# Driver Web App Audit

**Date:** 2026-02-17
**Path:** `frontend/src/apps/DriverApp/`
**Purpose:** Baseline audit before converting the web driver app to an All-Staff app (Tier 2, Point 4).

---

## 1. File Structure

```
frontend/src/apps/DriverApp/
├── DriverDashboard.tsx              # Root shell — bottom nav, online/offline toggle
├── pages/
│   ├── DeliveryHomePage.tsx         # GPS tracking, session management, online toggle
│   ├── ActiveDeliveryPage.tsx       # In-progress deliveries list/map
│   ├── DeliveryHistoryPage.tsx      # Past deliveries, earnings, charts
│   └── DriverProfilePage.tsx        # Driver profile, ratings, shift management
└── components/
    ├── NavigationMap.tsx            # Google Maps turn-by-turn navigation
    ├── LocationMapModal.tsx         # OpenStreetMap GPS location modal (fallback)
    ├── CustomerContact.tsx          # Phone/SMS contact bottom sheet
    └── shared/
        ├── ActionButton.tsx         # Uber-style button with multiple variants
        ├── DeliveryCard.tsx         # Individual delivery item card
        ├── MetricCard.tsx           # KPI display card (value, label, trend)
        ├── StatusBadge.tsx          # Online/offline/delivering/idle pill badge
        └── StatsChart.tsx           # Recharts line/bar/area chart with period toggle
```

---

## 2. Design System

**Token file:** `frontend/src/styles/driver-design-tokens.ts`
**Style:** Hybrid Uber-style (clean, minimal) + Neumorphic accents
**Primary color:** Green `#00B14F` (Uber-style delivery green)
**Background:** Dark surfaces for the app shell, light cards for content

This token file is **separate from the main neumorphic design-tokens.ts** used by the rest of the web app. Key exports:

| Export | Purpose |
|--------|---------|
| `colors` | Full palette — primary, surface, text, semantic, status, gradients |
| `typography` | Font family, sizes (hero→tiny), weights, line heights |
| `spacing` | 8px base scale: xs(4) sm(8) md(12) base(16) lg(24) xl(32) xxl(48) xxxl(64) |
| `borderRadius` | xs(4) sm(8) md(12) lg(16) xl(24) full(9999) |
| `shadows` | subtle, card, elevated, neumorphic (inset/outset/pressed), greenGlow |
| `animations` | duration (150/300/500ms), easing functions |
| `components` | Button heights, card padding, avatar sizes, bottomNav height (64px) |
| `createNeumorphicSurface(variant, color)` | Helper for interactive neumorphic CSS |
| `createCard()` | Standard card surface helper |
| `createPulseAnimation(color)` | Pulsing dot CSS for status indicators |

**Exception:** `NavigationMap.tsx` imports from the **main** `design-tokens.ts` and `neumorphic-utils.ts`, not from `driver-design-tokens.ts`.

---

## 3. Redux & State Management

### Redux Slices Used

| Slice | Usage | Selectors / Actions |
|-------|-------|-------------------|
| `authSlice` | `DriverDashboard.tsx`, `DriverProfilePage.tsx` | `state.auth.user` (id, name, email, phone, employeeId, storeId) · `logout()` |

### RTK Query Hooks

| Hook | Source API | Used In | Purpose |
|------|-----------|---------|---------|
| `useGetDriverStatusQuery()` | `driverApi` | `DriverDashboard.tsx` | Poll online/offline status every 30s |
| `useGetDriverPerformanceQuery()` | `driverApi` | `DeliveryHomePage.tsx`, `DriverProfilePage.tsx` | Deliveries, earnings, distance, ratings (30s poll) |
| `useStartSessionMutation()` | `sessionApi` | `DeliveryHomePage.tsx`, `DriverProfilePage.tsx` | Clock in |
| `useEndSessionMutation()` | `sessionApi` | `DeliveryHomePage.tsx`, `DriverProfilePage.tsx` | Clock out |
| `useUpdateLocationMutation()` | `deliveryApi` | `DeliveryHomePage.tsx` | POST GPS coordinates |
| `useGetOrdersByStatusQuery()` | `orderApi` | `ActiveDeliveryPage.tsx`, `DeliveryHistoryPage.tsx` | Fetch DISPATCHED / DELIVERED orders (30–60s poll) |
| `useUpdateOrderStatusMutation()` | `orderApi` | `ActiveDeliveryPage.tsx` | Mark order DELIVERED |
| `useGetOptimizedRouteMutation()` | `deliveryApi` | `NavigationMap.tsx` | Turn-by-turn route (auto-refresh 30s) |
| `useGetCurrentSessionQuery()` | `sessionApi` | `DriverProfilePage.tsx` | Current shift details (30s poll) |

### Local State Per Component

**DriverDashboard.tsx**
- `currentNavValue` — bottom tab index (0–3)
- `isOnline` — driver online/offline toggle

**DeliveryHomePage.tsx**
- `location` — `{ latitude, longitude }` from GPS
- `isLoadingLocation` / `locationError` — GPS state
- `locationMode` — `'auto'` (GPS) | `'manual'` (fallback)
- `isUsingFallback` — whether fallback coords are active
- `sessionStartTime` / `elapsedTime` — shift timer
- `chartPeriod` — `'day'` | `'week'` | `'month'`
- `showLocationMap` — modal visibility

**ActiveDeliveryPage.tsx**
- `selectedOrder` — currently selected delivery
- `showContactDialog` — customer contact sheet
- `viewMode` — `'list'` | `'map'`
- `sortBy` — sort preference

**DeliveryHistoryPage.tsx**
- `timeFilter` — `'today'` | `'week'` | `'month'` | `'all'`
- `searchQuery` — filter text
- `expandedOrder` — expanded card ID
- `chartPeriod` — chart period

---

## 4. API Endpoints Called

All calls go through RTK Query base query (`/api` prefix via API Gateway at `localhost:8080`).

| Purpose | Method | Inferred Endpoint |
|---------|--------|-------------------|
| Driver online/offline status | GET | `/api/drivers/{driverId}/status` |
| Driver performance metrics | GET | `/api/drivers/{driverId}/performance?startDate=&endDate=` |
| Start shift session | POST | `/api/sessions/start` |
| End shift session | POST | `/api/sessions/end` |
| Current session | GET | `/api/sessions/current` |
| Update GPS location | POST | `/api/drivers/{driverId}/location` |
| Orders by status | GET | `/api/orders?status={DISPATCHED\|DELIVERED}` |
| Update order status | PATCH | `/api/orders/{orderId}/status` |
| Get optimized route | POST | `/api/delivery/route/optimize` |

**Location payload format:**
```json
{ "latitude": 17.385, "longitude": 78.4867, "accuracy": 12.5, "speed": 30, "heading": 180, "timestamp": "2026-02-17T10:00:00Z" }
```

**Route request format:**
```json
{ "origin": { "lat": 17.385, "lng": 78.4867 }, "destination": { "lat": 17.4318, "lng": 78.4071 }, "travelMode": "DRIVING", "avoidTolls": false, "avoidHighways": false }
```

---

## 5. WebSocket Usage

**Service:** `frontend/src/services/websocketService` (STOMP over SockJS)
**Used in:** `DeliveryHomePage.tsx`

```typescript
// Connect when driver goes online
await websocketService.connect();

// Disconnect when driver goes offline or unmounts
websocketService.disconnect();
```

The WebSocket is used for real-time delivery assignment notifications — when a new order is assigned to the driver, it arrives via WebSocket rather than polling. The actual subscription topics are handled inside `websocketService`.

**Cross-tab synchronization** (NOT WebSocket):
Uses a custom `tabSync` utility in `./utils/tabSync`.
Event: `DRIVER_STATUS_CHANGE` — syncs online/offline state when driver has multiple browser tabs open.

---

## 6. GPS Location Strategy

```
navigator.geolocation.watchPosition()
  │
  ├── accuracy <= 100m → accept → POST to /api/drivers/{id}/location
  │
  └── accuracy > 100m → ignore
       │
       └── no GPS at all → fallback to:
            1. localStorage key: driver_default_location_{userId}
            2. Hardcoded: { latitude: 12.9716, longitude: 77.5946 } (Bangalore)
```

localStorage keys used:
- `driver_online_{userId}` — persists online state across page refreshes
- `driver_session_start_{userId}` — shift start time
- `driver_default_location_{userId}` — last known fallback location

---

## 7. Component Reusability Analysis

### Driver-Specific (cannot be reused as-is)

| Component | Why Driver-Only |
|-----------|----------------|
| `DeliveryHomePage.tsx` | GPS watch, online toggle, location API calls |
| `ActiveDeliveryPage.tsx` | Filters orders by `assignedDriverId`, delivery workflow actions |
| `DeliveryHistoryPage.tsx` | Calculates 20% delivery commission earnings |
| `DeliveryCard.tsx` | Navigate / Contact / Complete delivery actions |
| `CustomerContact.tsx` | `tel:` and SMS links for delivery customer |
| `LocationMapModal.tsx` | Shows driver's own GPS position |
| `NavigationMap.tsx` | Route optimization to delivery address |

### Reusable (extract for All-Staff app)

| Component | Reuse Plan |
|-----------|-----------|
| `DriverDashboard.tsx` | Extract navigation shell — replace bottom tabs with role-aware ones |
| `StatusBadge.tsx` | Generic — shows any status with pulse dot |
| `ActionButton.tsx` | Generic — Uber-style button, usable in kitchen/POS/manager screens |
| `MetricCard.tsx` | Generic — KPI card, usable for kitchen throughput, sales metrics |
| `StatsChart.tsx` | Generic — any role with performance charts |
| `driver-design-tokens.ts` | Fully portable — can be imported by any role's screens |

---

## 8. Component Hierarchy

```
DriverDashboard
├── TopBar (driver name, store, StatusBadge, logout)
├── Online/Offline toggle (header)
└── Routes:
    ├── /driver → DeliveryHomePage
    │   ├── GPS location section + LocationMapModal
    │   ├── Session timer
    │   ├── Quick stats (MetricCard × 4)
    │   └── StatsChart (earnings over period)
    ├── /driver/active → ActiveDeliveryPage
    │   ├── View toggle (list / map)
    │   ├── DeliveryCard[] (DISPATCHED orders)
    │   │   ├── ActionButton (Navigate → NavigationMap)
    │   │   ├── ActionButton (Contact → CustomerContact)
    │   │   └── ActionButton (Complete → PATCH order status)
    │   └── CustomerContact (bottom sheet)
    ├── /driver/history → DeliveryHistoryPage
    │   ├── Filter bar (search + time filter)
    │   ├── StatsChart (earnings chart)
    │   └── Timeline groups → DeliveryCard (collapsed)
    └── /driver/profile → DriverProfilePage
        ├── Avatar + rating + tier
        ├── MetricCard[] (deliveries, earnings, distance, rating)
        ├── StatsChart (weekly earnings)
        ├── Clock In / Clock Out (ActionButton)
        └── Personal info fields
```

---

## 9. Polling Intervals Summary

| Data | Interval | Component |
|------|----------|-----------|
| Driver status | 30s | DriverDashboard |
| Driver performance | 30s | DeliveryHomePage, DriverProfilePage |
| Current session | 30s | DriverProfilePage |
| Active orders (DISPATCHED) | 30s | ActiveDeliveryPage |
| Delivery history (DELIVERED) | 60s | DeliveryHistoryPage |
| Route optimization | 30s | NavigationMap |

---

## 10. Conversion Notes for Tier 2 (All-Staff App)

These are the concrete changes needed when converting `MaSoVaDriverApp` (React Native) to multi-role. The web `DriverApp` is **not** being converted — it stays as-is. This audit informs what the native app conversion should preserve and what it can generalise.

1. **Keep all driver screens intact** — `DeliveryHomePage`, `ActiveDeliveryPage`, `DeliveryHistoryPage`, `DriverProfilePage`. Zero changes needed for DRIVER role.

2. **Extract the dashboard shell** — `DriverDashboard.tsx`'s bottom nav pattern maps directly to the native `AppNavigator.tsx` role-based router.

3. **Extract reusable components** — `StatusBadge`, `ActionButton`, `MetricCard`, `StatsChart` are already generic enough to use in Kitchen, Manager, and POS screens with no changes.

4. **`driver-design-tokens.ts` is the design reference** — the Uber-style green/dark scheme applies to DRIVER role only. Kitchen screens should use a warmer palette; POS screens use the main neumorphic tokens.

5. **GPS permission is driver-only** — `navigator.geolocation.watchPosition()` and `useUpdateLocationMutation()` must not be called for non-driver roles. The role guard in `RoleRouter` (Tier 2) handles this.

6. **`tabSync` utility is driver-only** — cross-tab online/offline sync only matters for DRIVER. Other roles don't have an online/offline concept.
