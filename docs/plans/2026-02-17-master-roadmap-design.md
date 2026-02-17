# MaSoVa Master Roadmap — Full Design Document
**Date:** 2026-02-17
**Version:** 1.0
**Scope:** All 13 roadmap points across 4 projects (backend monorepo, web frontend, MaSoVaDriverApp, masova-mobile, masova-support)

---

## Overview

Implementation is **tier-by-tier**: complete each tier fully before starting the next. Within each tier, items follow the order specified in the roadmap plan. Each tier produces independently verifiable outputs.

---

## TIER 1 — Foundation

### Point 12: Schema Audit & Improvements

**What the audit reveals:**
- Schema doc (v2.1.0, last updated 2026-01-30) documents 10 databases correctly
- Java entities largely match the doc with minor gaps:
  - `order-service` Order entity has extra fields not in doc: `priority`, `assignedDriverId`, kitchen workflow timestamps (`receivedAt`, `preparingStartedAt`, `ovenStartedAt`), `version` (optimistic locking)
  - `delivery-service` DriverLocation entity correctly has `@GeoSpatialIndexed(GEO_2DSPHERE)` — geospatial is already handled
  - No TTL indexes anywhere — `working_sessions`, `driver_locations`, and notification logs all need them
  - `user-service` User entity is in `shared-models` — no `authProviders` array field (needed for Point 1: Google Sign-In)
  - Schema doc missing: `masova_inventory` collections (InventoryItem, PurchaseOrder, Supplier, WasteRecord), `masova_notifications` collections (Notification, Campaign, Template, UserPreferences)

**Changes to make:**

1. **`MONGODB_SCHEMAS.md`** — Add missing sections for inventory and notification service collections. Add `authProviders` field to users schema (prep for Point 1). Add kitchen workflow timestamp fields to orders schema.

2. **TTL index migration scripts** — 3 scripts:
   - `scripts/migrations/add-ttl-indexes.js` — TTL on `working_sessions` (180 days after `clockOutTime`), `driver_locations` (24 hours after `timestamp`), `masova_notifications.notifications` (90 days after `createdAt`)

3. **Compound index additions** — 1 script:
   - `scripts/migrations/add-compound-indexes.js` — Add `{ storeId: 1, status: 1, createdAt: -1 }` on orders (kitchen queue query pattern), `{ driverId: 1, timestamp: -1 }` on driver_locations (latest location query)

4. **No breaking changes** — All additions are additive (new indexes, new optional fields)

**Output files:**
- `docs/MONGODB_SCHEMAS.md` (updated)
- `scripts/migrations/add-ttl-indexes.js`
- `scripts/migrations/add-compound-indexes.js`

---

### Point 11: Seed All Mock Data

**Source fixtures** (already exist in `frontend/src/test/fixtures/`):
- `mockStore.ts` — 5 stores (Downtown, HITEC City, Secunderabad branches + 2 more)
- `mockMenu.ts` — pizza, Indian cuisines, with customizations
- `mockOrders.ts` — orders in all statuses (RECEIVED, PREPARING, OVEN, BAKED, DISPATCHED, DELIVERED, CANCELLED)
- `mockUsers.ts` — all roles (CUSTOMER, MANAGER, STAFF/KITCHEN, DRIVER, ADMIN, ASSISTANT_MANAGER)
- `mockDelivery.ts` — delivery tracking records with GeoJSON locations
- `mockPayments.ts` — Razorpay transactions (SUCCESS, PENDING, FAILED, REFUNDED)

**Architecture:**

Single Node.js seed runner (`scripts/seed-database.js`) that:
1. Connects to all 10 MongoDB databases via `mongodb://localhost:27017`
2. Seeds in dependency order: stores → users → customers → menu_items → orders → payments → deliveries → reviews → notifications (minimal) → analytics (aggregated)
3. Uses `insertMany` with `ordered: false` + `upsert`-style logic (drop collections first, then insert) to be idempotent
4. Logs progress per collection

Supporting files:
- `scripts/clear-database.js` — drops all seeded collections (safe: only touches collections seeded by seed script, never schema/index collections)
- Root `package.json` — add `"seed": "node scripts/seed-database.js"` and `"seed:clear": "node scripts/clear-database.js"`
- `docs/development/SEED_DATA.md` — documents what data is seeded and how to use it

**Seeded counts (approximate):**
- 5 stores, 15 users (3 per role type), 20 customers, 50 menu items across all stores
- 30 orders (covering all statuses and order types), 25 payments, 20 deliveries, 15 reviews

---

### Point 3: Driver App Web Audit

**Findings from code exploration:**

`frontend/src/apps/DriverApp/` contains:
- `DriverDashboard.tsx` — MUI bottom nav shell (Home/Active/History/Profile tabs), uses `driverApi.useGetDriverStatusQuery`, `authSlice`, `driver-design-tokens`
- `pages/DeliveryHomePage.tsx` — online/offline toggle, accept delivery requests
- `pages/ActiveDeliveryPage.tsx` — live delivery tracking with Google Maps, customer contact
- `pages/DeliveryHistoryPage.tsx` — past deliveries with earnings summary
- `pages/DriverProfilePage.tsx` — profile, vehicle info, ratings
- `components/NavigationMap.tsx` — `@react-google-maps/api` DirectionsRenderer + markers
- `components/LocationMapModal.tsx` — OpenStreetMap fallback modal
- `components/CustomerContact.tsx` — phone/message customer
- `components/shared/` — ActionButton, DeliveryCard, MetricCard, StatusBadge, StatsChart

**APIs used:** `deliveryApi` (tracking, status updates), `driverApi` (status, earnings, history), `sessionApi` (working session clock-in/out)

**Design tokens:** `src/styles/driver-design-tokens.ts` — Uber-style (black/white/green), separate from main neumorphic tokens

**Driver-specific vs reusable:**
- Driver-specific: GPS tracking, delivery accept/reject flow, navigation map, earnings
- Reusable across roles: StatusBadge, MetricCard, bottom nav shell pattern, online/offline toggle concept

**Output:** `docs/development/DRIVER_APP_AUDIT.md`

---

## TIER 2 — Architecture & Structural Decisions

### Point 4: Convert MaSoVaDriverApp → All-Staff App (React Native)

**Current state:** `MaSoVaDriverApp/` — RN 0.83.1, bottom-tab navigator, 4 screens (Home, Active, History, Profile), driver-only design tokens (Uber-green), `LocationService.java` background GPS

**Architecture — Role-based navigation:**

```
AppNavigator
├── (unauthenticated) → LoginScreen (existing)
└── (authenticated) → RoleRouter
    ├── role=DRIVER → DriverTabNavigator (existing screens, unchanged)
    ├── role=KITCHEN_STAFF → KitchenTabNavigator (new)
    ├── role=CASHIER → CashierTabNavigator (new)
    └── role=MANAGER → ManagerTabNavigator (new)
```

`RoleRouter` reads `user.role` (or `user.type`) from Redux auth slice. Routes to correct navigator. Single `LoginScreen` serves all roles.

**New screens to build:**
- `src/screens/kitchen/KitchenQueueScreen.tsx` — order list with status columns, "Bump" button
- `src/screens/kitchen/OrderDetailScreen.tsx` — item list, countdown timer, mark complete
- `src/screens/pos/QuickOrderScreen.tsx` — menu grid, cart, take payment
- `src/screens/manager/QuickDashboardScreen.tsx` — KPI cards (today's orders, revenue, active staff)

**Shared components** (extract to `src/components/shared/`):
- `NotificationBell.tsx` — badge count, tap to open list
- `ProfileHeader.tsx` — avatar, name, role badge, store name
- `StoreSelector.tsx` — dropdown for multi-store managers
- `StatusBadge.tsx` — colored pill badge (already exists in driver screens, extract it)

**Permissions** — conditional: GPS + foreground service only requested for DRIVER role. Camera only for DRIVER/KITCHEN. `AndroidManifest.xml` uses all permissions; runtime request is conditional in JS.

**Design tokens** — extend `driverDesignTokens.ts` with role-specific accent colors:
- DRIVER: existing green `#00B14F`
- KITCHEN_STAFF: orange `#FF6B35`
- CASHIER: blue `#2196F3`
- MANAGER: purple `#7B1FA2`

**Files to create/modify:**
- `src/navigation/AppNavigator.tsx` — add RoleRouter
- `src/navigation/KitchenNavigator.tsx` (new)
- `src/navigation/CashierNavigator.tsx` (new)
- `src/navigation/ManagerNavigator.tsx` (new)
- `src/screens/kitchen/KitchenQueueScreen.tsx` (new)
- `src/screens/kitchen/OrderDetailScreen.tsx` (new)
- `src/screens/pos/QuickOrderScreen.tsx` (new)
- `src/screens/manager/QuickDashboardScreen.tsx` (new)
- `src/components/shared/` (extract from existing + new)
- `src/styles/driverDesignTokens.ts` — add role accent colors

---

### Point 10: Store Selector — Develop Further

**Current state:** `StoreSelector.tsx` — dropdown, RTK Query `useGetActiveStoresQuery`, Redux + tabStorage dual-write, neumorphic styling. No geolocation. No open/closed status.

**Decision: Develop further.** The component is already used in 10+ pages. Enhance it in-place.

**Changes:**
1. Add `navigator.geolocation.getCurrentPosition()` on mount — calculate Haversine distance to each store using `address.latitude/longitude` from the API response
2. Sort stores by distance when location is available; show distance label (`0.8 km away`)
3. Add open/closed badge — derive from `operatingHours` field in store data + current time
4. Auto-select nearest open store on first load (only if no selection saved in Redux/tabStorage)
5. Persist selection in `localStorage` key `masova_selected_store` (in addition to Redux)

**No new dependencies** — uses browser Geolocation API (already available), existing store API data already has `latitude`, `longitude`, `operatingHours`.

**Files to modify:**
- `frontend/src/components/StoreSelector.tsx`
- `frontend/src/components/StoreSelector.test.tsx` — add geolocation tests

---

### Point 8: RabbitMQ Interview Assignment + Pattern Application

**Interview assignment output** (in a separate directory, not inside the main monorepo):
- `docker/docker-compose.yml` — RabbitMQ 3.10 management, Python Cleverbot service, fixed IP network `10.100.0.0/24`
- `docker/cleverbot.Dockerfile`
- `docker/cleverbot_bot.py` — Pika consumer/publisher using topic exchange

**MaSoVa application** (additive, does not replace WebSocket):
- Add RabbitMQ as optional service to main `docker-compose.yml` (commented out by default)
- Design async event flow: Order status change → `order.events` topic exchange → fanout to `notification.email`, `notification.push`, `notification.inapp` queues
- `notification-service` gets a new `RabbitMQConsumer` component (optional, enabled via `RABBITMQ_ENABLED=true` env var)

**Output files:**
- `docker/docker-compose.yml` (interview assignment)
- `docker/cleverbot.Dockerfile`
- `docker/cleverbot_bot.py`
- `docs/development/RABBITMQ_PATTERNS.md`
- Main `docker-compose.yml` — add RabbitMQ optional service block

---

## TIER 3 — UI/UX Revamps

### Point 6: Staff Login Page Revamp

**Current state:** Two-column grid, blue gradient left panel, neumorphic right form, emoji icons, 3 demo role buttons (Manager, Kitchen Staff, Driver)

**Changes:**
1. **Remove all emojis** — replace with MUI icons (`ManageAccounts`, `Restaurant`, `LocalShipping`, `PointOfSale`, `SupervisorAccount`)
2. **Demo roles** — expand from 3 to 5: Manager, Kitchen Staff, Driver, Cashier, Assistant Manager. Each uses real credentials from seed data (Point 11)
3. **Left panel** — replace blue gradient with: dark `#1a1a1a` background, MaSoVa logo (text-based), tagline "Restaurant Management, Simplified", subtle decorative grid pattern (CSS `background-image: repeating-linear-gradient`)
4. **Forgot password flow** — toggle between login form and "enter email" form within same right panel; shows success message, no navigation
5. **Mobile** — single column at `<768px`, left panel collapses to a top banner strip
6. **Design tokens** — uses existing neumorphic tokens throughout; no new tokens needed

**Files to modify:**
- `frontend/src/pages/auth/LoginPage.tsx` — full rewrite of JSX/styles, keep all existing logic
- No new dependencies

---

### Point 7: KDS Full Revamp

**Current state:** 5-column Kanban, neumorphic cards, WebSocket real-time, emoji icons, basic timer, no sound, no full-screen

**Changes:**

1. **Summary bar** (top, fixed) — 3 KPIs: "Active Orders: N", "Avg Wait: Xm", "Longest: Ym" — updates in real-time from local order state

2. **Color urgency system** — card border-left (4px) changes color based on age since `receivedAt`:
   - Green: 0–5 min
   - Amber: 5–10 min
   - Red: 10+ min (+ CSS `@keyframes pulse` animation)

3. **Sound alerts** — on new order arriving in RECEIVED column, play a short chime using `new Audio('data:audio/wav;base64,...')` (base64-encoded inline WAV, no external file dependency). Mute toggle button in header.

4. **Full-screen mode** — button (or press `F`) calls `document.documentElement.requestFullscreen()`. KDS adjusts to fill viewport, columns expand proportionally.

5. **One-click bump** — large `►` button on each card advances status. On mobile/tablet, minimum touch target 48×48px.

6. **Typography** — increase base font size by 2px for 1080p wall display readability. Order number in `24px bold`, item names `16px`, quantity `14px`.

7. **Remove emojis** — all icons replaced with SVG/MUI icons.

8. **No new dependencies** — uses existing neumorphic tokens, browser APIs only.

**Files to modify:**
- `frontend/src/pages/kitchen/KitchenDisplayPage.tsx` — primary changes
- No new files needed (summary bar is an inline component)

---

### Point 5: Customer App Revamps

**Scope A — Web (`frontend/src/pages/customer/` + `frontend/src/apps/PublicWebsite/`)**

1. **MenuPage** — switch from list layout to 2-column card grid at `≥768px`. Cards show image (top), name, price, add button. Sticky category filter bar. No layout library changes; inline styles using existing design tokens.

2. **CartPage** — convert from full-page to slide-up drawer (`position: fixed, bottom: 0`). Controlled by existing Redux `cartSlice`. Smooth `translateY` CSS transition. CartDrawer already exists at `frontend/src/components/cart/CartDrawer.tsx` — unify so the cart page uses the same drawer component.

3. **PublicWebsite/HomePage** — remove all emojis. Replace hero section text with clean typographic layout: large headline, subheadline, two CTA buttons (Order Now / View Menu). Add a food imagery strip (3 placeholder images in a horizontal row).

4. **Neumorphic consistency** — any pages still using plain HTML buttons/inputs get swapped to neumorphic component equivalents.

**Scope B — Mobile (`masova-mobile/`)**

The mobile app already has a glassmorphism theme system (`src/styles/theme.ts`, `src/styles/tokens.ts`). The revamp applies it consistently:

1. **Food item cards** — update `MenuScreen.tsx` card layout: taller image (180px), name + price in `surfaceElevated` container with `glassSurface` overlay on the image
2. **Skeleton loading** — replace `ActivityIndicator` spinners with `SkeletonLoader` component (build using `Animated.Value` + `interpolate` for shimmer)
3. **Screen transitions** — add `cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS` to all stack navigators
4. **Consistent color tokens** — audit all screens that use hardcoded hex colors; replace with `useTheme()` hook values

**Files to modify (web):**
- `frontend/src/pages/customer/MenuPage.tsx`
- `frontend/src/pages/customer/CartPage.tsx`
- `frontend/src/apps/PublicWebsite/HomePage.tsx`
- `frontend/src/apps/PublicWebsite/PromotionsPage.tsx`

**Files to modify (mobile):**
- `masova-mobile/src/screens/menu/MenuScreen.tsx`
- `masova-mobile/src/screens/` (all screens — theme token audit)
- `masova-mobile/src/components/` (new `SkeletonLoader.tsx`)
- `masova-mobile/src/navigation/` (add transition interpolators)

---

### Point 9: Manager Metrics Visualization

**Current state:** 24+ pages, Recharts v3.2.1 already installed. Existing chart components in `frontend/src/components/charts/` (SalesTrendChart, RevenueBreakdownChart, PeakHoursHeatmap). Manager shell consolidation plan already in `docs/plans/2026-02-15-manager-consolidation-plan.md`.

**Standard page template** (`ManagerMetricTemplate.tsx`):
```
┌─────────────────────────────────────┐
│  KPI Row (3–5 metric cards)         │
├─────────────────────────────────────┤
│  Time-series chart + filter bar     │
├─────────────────────────────────────┤
│  Data table (sortable, paginated)   │
├─────────────────────────────────────┤
│  Action buttons (export, etc.)      │
└─────────────────────────────────────┘
```

**Priority pages to apply template first:**
1. `DashboardPage.tsx` — revenue KPIs + SalesTrendChart
2. `ProductAnalyticsPage.tsx` — top items KPIs + bar chart
3. `KitchenAnalyticsPage.tsx` — prep time KPIs + line chart
4. `AdvancedReportsPage.tsx` — aggregated metrics + RevenueBreakdownChart

**`ManagerMetricTemplate.tsx`** — accepts props: `kpis[]`, `chartComponent`, `tableComponent`, `actions[]`. Uses `manager-tokens.ts` for consistent spacing/colors.

**No new charting libraries** — Recharts is already installed and working.

**Files to create/modify:**
- `frontend/src/pages/manager/ManagerMetricTemplate.tsx` (new)
- `frontend/src/pages/manager/DashboardPage.tsx` — apply template
- `frontend/src/pages/manager/ProductAnalyticsPage.tsx` — apply template
- `frontend/src/pages/manager/KitchenAnalyticsPage.tsx` — apply template
- `frontend/src/pages/manager/AdvancedReportsPage.tsx` — apply template

---

## TIER 4 — Integrations & Advanced Features

### Point 1: Google Sign-In

**Backend (`user-service`):**
- Add `authProviders` array field to User entity: `List<AuthProvider>` where `AuthProvider = { provider: "GOOGLE", providerId: String, email: String }`
- Add `POST /api/auth/google` endpoint: accepts `{ idToken: String }`, validates via Google tokeninfo API (`https://oauth2.googleapis.com/tokeninfo?id_token=...`), creates user if new / links if email matches existing user, returns same JWT as email/password login
- Add `google.oauth.client-id` to `application.yml`
- No new Spring Security dependencies needed — validation is a simple HTTP call to Google's tokeninfo endpoint

**Web frontend:**
- Install `@react-oauth/google`
- Wrap `App.tsx` with `<GoogleOAuthProvider clientId={...}>`
- Add `<GoogleLogin onSuccess={...} />` button to `LoginPage.tsx` (for staff) and customer login/register modals
- On success: call `POST /api/auth/google` with the credential, store JWT same as email login

**Mobile (`masova-mobile`):**
- Install `@react-native-google-signin/google-signin`
- Add to `app.json` Expo plugins: `@react-native-google-signin/google-signin`
- Add Google Sign-In button to `LoginScreen.tsx` and `RegisterScreen.tsx`
- Same backend endpoint call

**Files to create/modify:**
- `user-service/src/main/java/com/MaSoVa/user/entity/User.java` — add `authProviders`
- `user-service/src/main/java/com/MaSoVa/user/controller/UserController.java` — add `/auth/google`
- `user-service/src/main/java/com/MaSoVa/user/service/UserService.java` — add `loginWithGoogle()`
- `user-service/src/main/resources/application.yml` — add Google client ID config
- `frontend/src/App.tsx` — add GoogleOAuthProvider
- `frontend/src/pages/auth/LoginPage.tsx` — add Google button
- `masova-mobile/src/screens/auth/LoginScreen.tsx` — add Google button
- `masova-mobile/app.json` — add plugin

---

### Point 2: Google Maps Expansion

**Web frontend (enhancements to existing integration):**
1. `CartPage.tsx` / checkout flow — add `<Autocomplete>` from Google Places API for delivery address input
2. `LiveTrackingPage.tsx` — replace any OpenStreetMap refs with `@react-google-maps/api` GoogleMap + driver marker
3. `LiveMap.tsx` — memoize markers with `useCallback` to reduce re-renders on each location WebSocket update

**Mobile (`masova-mobile`):**
1. `react-native-maps` v1.20.1 already installed — confirm `PROVIDER_GOOGLE` is set in `app.json` and `google-services.json` is configured
2. `OrderTrackingScreen.tsx` — add MapView showing store pin, customer pin, and driver pin (real-time via WebSocket)
3. Add `react-native-google-places-autocomplete` for delivery address input at checkout

**MaSoVaDriverApp:**
1. `NavigationMap.tsx` (already in web) — equivalent already exists in RN app at `src/screens/ActiveDeliveryScreen.tsx` using react-native-maps; improve to show full turn-by-turn route polyline using Directions API
2. Replace `LocationMapModal.tsx` OpenStreetMap fallback with Google Maps

**Files to modify:**
- `frontend/src/components/delivery/LiveMap.tsx`
- `frontend/src/pages/customer/LiveTrackingPage.tsx`
- `frontend/src/pages/customer/CartPage.tsx` (address autocomplete)
- `masova-mobile/src/screens/order/OrderTrackingScreen.tsx`
- `masova-mobile/src/screens/` (checkout address input)
- `MaSoVaDriverApp/src/screens/ActiveDeliveryScreen.tsx`

---

### Point 13: AI Chat Agent — Customer Support

**Backend agent (`masova-support`) expansion:**

Replace mock `CUSTOMERS_DB` / `ORDERS_DB` with real HTTP tool calls:
```python
async def get_menu_items(store_id: str, category: str = None) -> dict
async def get_order_status(order_id: str) -> dict
async def get_store_hours(store_id: str) -> dict
async def submit_complaint(customer_id: str, order_id: str, description: str) -> dict
async def request_refund(order_id: str, reason: str) -> dict
```

Add `POST /agent/chat` REST endpoint to `main.py` (FastAPI already imported via ADK's web runner):
- Request: `{ sessionId: str, message: str, customerId: str | None }`
- Response: `{ reply: str, sessionId: str }`
- Session memory via `InMemorySessionService` (already initialized)

**Web frontend — ChatWidget:**
- `frontend/src/components/chat/ChatWidget.tsx` — floating button (bottom-right, `position: fixed`), slide-up panel (300×500px), message list, text input, send button
- Add to `frontend/src/App.tsx` — render only on customer routes (`/`, `/menu`, `/order/*`, `/track/*`)
- New `frontend/src/store/api/agentApi.ts` RTK Query slice with `POST /agent/chat` mutation
- Typing indicator: show `...` bubble while awaiting response
- Quick reply buttons for common intents: "Track my order", "View menu", "Contact support"

**Mobile (`masova-mobile`):**
- `src/screens/support/ChatScreen.tsx` — full-screen chat (same API)
- Add "Support" tab to bottom navigation
- Haptic feedback on new message: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`

**Files to create/modify:**
- `masova-support/masova_agent/agent.py` — replace mock data with real API tool functions
- `masova-support/masova_agent/main.py` — add `/agent/chat` REST endpoint
- `frontend/src/components/chat/ChatWidget.tsx` (new)
- `frontend/src/store/api/agentApi.ts` (new)
- `frontend/src/App.tsx` — add ChatWidget
- `masova-mobile/src/screens/support/ChatScreen.tsx` (new)
- `masova-mobile/src/navigation/` — add Support tab

---

## Verification Checklist (per tier)

### Tier 1
- [ ] `node scripts/migrations/add-ttl-indexes.js` runs without errors
- [ ] `node scripts/migrations/add-compound-indexes.js` runs without errors
- [ ] `npm run seed` populates all 10 databases; `mongosh masova_orders --eval "db.orders.countDocuments()"` returns ~30
- [ ] `npm run seed:clear` drops seeded data without errors
- [ ] `docs/development/DRIVER_APP_AUDIT.md` committed and covers all 4 API slices

### Tier 2
- [ ] `MaSoVaDriverApp`: login as KITCHEN_STAFF role → KitchenQueueScreen loads
- [ ] `MaSoVaDriverApp`: login as DRIVER role → existing DeliveryHomeScreen loads (unchanged)
- [ ] `StoreSelector`: browser grants location → nearest open store auto-selected, distance shown
- [ ] `docker-compose -f docker/docker-compose.yml up` → RabbitMQ management UI at port 15672

### Tier 3
- [ ] KDS: new order arrives via WebSocket → chime plays (if not muted), card appears in RECEIVED column
- [ ] KDS: order older than 10 min → card pulsing red border
- [ ] KDS: press `F` → enters full-screen mode
- [ ] Login: all 5 role demo buttons visible, no emojis
- [ ] MenuPage: loads in 2-column grid on desktop, single column on mobile
- [ ] Manager DashboardPage: KPI row + chart visible, uses ManagerMetricTemplate

### Tier 4
- [ ] "Sign in with Google" button on LoginPage → Google consent → JWT returned → redirected to role dashboard
- [ ] Delivery address input in cart → Google Places autocomplete dropdown appears
- [ ] ChatWidget: click floating button → panel opens, type message → agent response within 5 seconds
- [ ] masova-mobile: Support tab → ChatScreen → message sends and receives reply

---

## File Map Summary

| Tier | Point | New Files | Modified Files |
|------|-------|-----------|----------------|
| 1 | 12 | `scripts/migrations/add-ttl-indexes.js`, `scripts/migrations/add-compound-indexes.js` | `docs/MONGODB_SCHEMAS.md` |
| 1 | 11 | `scripts/seed-database.js`, `scripts/clear-database.js`, `docs/development/SEED_DATA.md` | `package.json` (root) |
| 1 | 3 | `docs/development/DRIVER_APP_AUDIT.md` | — |
| 2 | 4 | `KitchenNavigator.tsx`, `CashierNavigator.tsx`, `ManagerNavigator.tsx`, 4 new screens, shared components | `AppNavigator.tsx`, `driverDesignTokens.ts` |
| 2 | 10 | — | `StoreSelector.tsx`, `StoreSelector.test.tsx` |
| 2 | 8 | `docker/docker-compose.yml`, `docker/cleverbot.Dockerfile`, `docker/cleverbot_bot.py`, `docs/development/RABBITMQ_PATTERNS.md` | Main `docker-compose.yml` |
| 3 | 6 | — | `LoginPage.tsx` |
| 3 | 7 | — | `KitchenDisplayPage.tsx` |
| 3 | 5 | `masova-mobile/src/components/SkeletonLoader.tsx` | MenuPage, CartPage, HomePage, PromotionsPage, mobile screens |
| 3 | 9 | `ManagerMetricTemplate.tsx` | DashboardPage, ProductAnalyticsPage, KitchenAnalyticsPage, AdvancedReportsPage |
| 4 | 1 | — | User.java, UserController.java, UserService.java, application.yml, App.tsx, LoginPage.tsx, mobile auth screens, app.json |
| 4 | 2 | — | LiveMap.tsx, LiveTrackingPage.tsx, CartPage.tsx (places), mobile tracking screen, driver active screen |
| 4 | 13 | `ChatWidget.tsx`, `agentApi.ts`, `ChatScreen.tsx` (mobile) | `agent.py`, `main.py`, `App.tsx`, mobile navigation |
