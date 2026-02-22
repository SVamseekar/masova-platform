# Domino's-style Store Selection + Distance-based Delivery Pricing

**Date:** 2026-02-23
**Status:** Approved
**Scope:** Web frontend (React) + core-service backend (Spring Boot)
**Mobile:** Out of scope for this feature (endpoint available for free)

---

## Problem

Customers currently select a store from a dropdown in the header (GPS auto-select). There is no address-entry gate before browsing, delivery fees are hardcoded at ₹50 everywhere, and the existing `ServiceArea` / `DeliveryZone` model in `Store.java` is never used at runtime.

---

## Goal

Implement a Domino's-style customer flow:
1. Customer enters their delivery address before seeing the menu
2. Backend resolves the nearest serving store and the correct delivery zone
3. Delivery fee and ETA are shown at address-entry time and used throughout cart/checkout

---

## Customer Flow

1. Customer lands on public website (guest or logged-in)
2. Full-screen **AddressGate** appears before any menu route
3. Google Places autocomplete — customer types area / street / pincode
4. On selection → coordinates sent to `GET /api/stores/find-by-location`
5. Result shown:
   - Within radius: "Delivering to [Area] from [Store] — ₹30 · ~15 min" → Confirm CTA
   - Outside all radii: "We don't deliver here. Nearest store: [Store] (X km) — Switch to Pickup?" → Continue as Pickup CTA
6. Logged-in customers with a saved default address skip the gate silently (pre-resolved, shown as dismissible banner)
7. Store + zone + fee stored in Redux — used throughout cart and checkout

---

## Backend Changes

### New endpoint: `GET /api/stores/find-by-location`

**Location:** `core-service` → `StoreController.java` + `StoreService.java`
**Auth:** Public (no token required)
**Parameters:** `latitude` (double), `longitude` (double)

**Logic:**
1. Fetch all `ACTIVE` stores
2. For each store, compute Haversine distance from store center (`address.latitude/longitude`) to customer coords
3. Filter stores where `distance <= configuration.deliveryRadiusKm`
4. Among eligible stores, pick the closest
5. Determine which `DeliveryZone` the distance falls in (Zone A/B/C)
6. Return result

**Response DTO:**
```json
{
  "store": {
    "id": "...",
    "name": "MaSoVa Indiranagar",
    "storeCode": "DOM001",
    "address": { "street": "...", "city": "Bangalore", "state": "Karnataka", "pincode": "560038" },
    "phoneNumber": "9876543210"
  },
  "withinDeliveryArea": true,
  "zone": "A",
  "deliveryFeeINR": 30.0,
  "estimatedDeliveryMinutes": 15,
  "distanceKm": 2.3,
  "nearestStore": {
    "id": "...",
    "name": "MaSoVa Indiranagar",
    "storeCode": "DOM001",
    "distanceKm": 2.3
  }
}
```

**If outside all radii:** `withinDeliveryArea: false`, `zone: null`, `deliveryFeeINR: 0`, `nearestStore` always present.

### New DTO class

`LocationQueryResult.java` in `core-service/dto/` (or returned as `Map` if minimal effort preferred).

### Commerce-service OrderService

- Frontend sends `deliveryFeeINR` from Redux state in the order request
- Backend validates it against the computed zone fee for the order's delivery address
- Replaces hardcoded ₹50 default

---

## Frontend Changes

### New component: `<AddressGate />`

**File:** `frontend/src/components/common/AddressGate.tsx`

- Full-screen overlay, rendered in `App.tsx` / `CustomerApp.tsx` before menu routes load
- Google Places autocomplete input (reuses existing `VITE_GOOGLE_MAPS_API_KEY`)
- On address select → calls `findByLocation` RTK Query → shows result card
- Two states: within radius (green) / outside radius (amber, pickup suggestion)
- "Confirm" CTA → dispatches to Redux, sets `sessionStorage` key, dismisses gate
- "Change address" link always visible in header after dismissal → re-opens gate

**Gate skip logic:**
- `sessionStorage` key `masova_delivery_address` present → gate skipped on refresh
- Logged-in user with `user.addresses` → default address pre-resolved silently on mount

### Redux `cartSlice` additions

```ts
// New fields in CartState
deliveryAddress: {
  formatted: string;
  latitude: number;
  longitude: number;
} | null;
deliveryZone: 'A' | 'B' | 'C' | null;
deliveryFeeINR: number;          // replaces hardcoded 50
estimatedDeliveryMinutes: number;
withinDeliveryArea: boolean;

// New actions
setDeliveryLocation(payload: { address, zone, fee, eta, withinArea, store })
clearDeliveryLocation()
```

### `storeApi.ts` addition

```ts
findByLocation: builder.query<LocationQueryResult, { latitude: number; longitude: number }>({
  query: ({ latitude, longitude }) =>
    `/stores/find-by-location?latitude=${latitude}&longitude=${longitude}`,
})
```

### Hardcoded ₹50 replacements

| File | Change |
|------|--------|
| `frontend/src/apps/POSSystem/components/OrderPanel.tsx` | Read `deliveryFeeINR` from props/Redux |
| `frontend/src/store/slices/cartSlice.ts` | Remove `deliveryFee: 50`, use `deliveryFeeINR` from state |
| `frontend/src/pages/customer/CartPage.tsx` | Use Redux `deliveryFeeINR` |
| `frontend/src/pages/customer/CheckoutPage.tsx` | Pass `deliveryFeeINR` in order request |

### `StoreSelector.tsx` simplification

- Remove GPS auto-select logic (handled by AddressGate now)
- Show current store name + "Change" link → re-opens AddressGate
- Keep dropdown for manager variant (unchanged)

---

## Error Handling & Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Outside delivery radius | `withinDeliveryArea: false` → gate shows pickup-only mode; delivery option grayed out in cart |
| Google Places API failure | Fall back to 6-digit pincode field → Google Geocoding API → same backend endpoint |
| Geocoding failure | Show manual pincode input → call `/stores/nearby` with broad search |
| Store `TEMPORARILY_CLOSED` | Gate shows store name + "Currently closed, opens at [time]" — customer can still browse |
| Session refresh | `sessionStorage` key re-resolves address silently — gate not shown again |
| New tab | Gate shown again (matches existing `tabStorage` per-tab pattern) |
| Guest user | Same gate, no pre-fill |
| Logged-in, no saved address | Same gate, no pre-fill |
| Logged-in, saved default address | Gate skipped, address pre-resolved, dismissible banner shown |

---

## Files to Create / Modify

### Create
- `core-service/.../dto/LocationQueryResult.java`
- `frontend/src/components/common/AddressGate.tsx`

### Modify
- `core-service/.../controller/StoreController.java` — add `findByLocation` endpoint
- `core-service/.../service/StoreService.java` — add `findByLocation` service method
- `frontend/src/store/api/storeApi.ts` — add `findByLocation` query + export hook
- `frontend/src/store/slices/cartSlice.ts` — add delivery location state + actions
- `frontend/src/App.tsx` or `CustomerApp.tsx` — render `<AddressGate />`
- `frontend/src/components/StoreSelector.tsx` — simplify, add "Change" link
- `frontend/src/apps/POSSystem/components/OrderPanel.tsx` — use Redux fee
- `frontend/src/pages/customer/CartPage.tsx` — use Redux fee
- `frontend/src/pages/customer/CheckoutPage.tsx` (if exists) — pass fee in order request

---

## Out of Scope

- Mobile app (masova-mobile, MaSoVaDriverApp) — endpoint available, UI is a separate task
- Pincode-to-store mapping table — not needed, coordinates are sufficient
- Polygon-based service areas — radius-based zones are sufficient for now
- Manager store creation UI with Google Maps — separate feature
