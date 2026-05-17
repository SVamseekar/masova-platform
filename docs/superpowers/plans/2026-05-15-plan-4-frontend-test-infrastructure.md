# Frontend Test Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all confirmed frontend test infrastructure bugs — MSW handler `/api/` prefix, RTK Query slice URL mismatches, broken Pact consumer files — and stabilise the Vitest runner (OOM fix) so all subsequent test writing has a correct foundation.

**Architecture:** Tests co-located next to source files. MSW handlers intercept at full absolute URL including `/api/` prefix (MSW v2 in Node/jsdom requires absolute URLs — relative paths are unreliable). RTK Query slices use canonical paths matching the backend endpoint map. Pact consumer tests use `@pact-foundation/pact` v16 `PactV4` class (HTTP/1-style interactions — the `PactV4` class in pact-js v16 uses `withRequest(method, path, builderFn)` string signature, confirmed by the installed package's type definitions). Vitest coverage thresholds raised to 80%.

**Prerequisite:** Plan 0 (deployment blockers) must be complete.

**Tech Stack:** Vitest 1.6.x, React Testing Library 16.x, MSW 2.x, @pact-foundation/pact 16.0.4

---

## Research-Validated Corrections (applied to this plan)

The following issues were found by auditing the actual codebase AND reading every backend `@RequestMapping`/`@GetMapping`/`@PostMapping` annotation directly from the Java controllers:

### Handler files — two already correct (prefix only), do NOT touch prefix but verify content:
1. **`analyticsHandlers.ts` already correct** — already uses `${API}/api/analytics/...`. Verify only.
2. **`notificationHandlers.ts` already correct** — already uses `${API}/api/notifications/...`, `/api/preferences/...`, `/api/campaigns/...`. All confirmed against `NotificationController`, `UserPreferencesController`, `CampaignController`. Verify only.
3. **`customerHandlers.ts` has correct prefix BUT has stale sub-paths** — prefix `/api/customers/` is correct but routes like `/user/:userId`, `/email/:email`, `/phone/:phone`, `/high-value`, `/top-spenders`, `/recently-active`, `/inactive`, `/birthdays/today`, `/marketing-opt-in`, `/sms-opt-in`, `/loyalty/max-redeemable`, `/order-stats`, `/preferences`, `/loyalty/tier/:tier` don't exist. `CustomerController` uses query params: `?userId=&email=&phone=&tier=&tag=&search=` on `GET /api/customers`. **Must clean up stale routes.**

### Handler files — stale routes that don't exist in any backend controller:
These routes are in the handler files but the backend never serves them. Simply adding `/api/` prefix will NOT fix them — the endpoint doesn't exist. They must be **removed** from handlers (and their RTK Query counterparts noted for follow-up):
- `${API}/orders/status/:status` — `OrderController` has no `GET /api/orders/status/:status`
- `${API}/orders/kitchen` — no such endpoint (kitchen queue is a query param on `GET /api/orders`)
- `${API}/orders/store`, `/orders/customer/:id`, `/orders/number/:num`, `/orders/date/:date`, `/orders/range`, `/orders/active-deliveries/count`, `/orders/store/avg-prep-time`, `/orders/store/failed-quality-checks`, `/orders/store/make-table/:station` — none exist
- `${API}/delivery/auto-dispatch` → real path is `/api/delivery/dispatch`
- `${API}/delivery/route-optimize` → real path is `/api/delivery/route`
- `${API}/delivery/eta/:orderId`, `/delivery/zone/check`, `/delivery/zone/fee`, `/delivery/zone/list`, `/delivery/zone/validate`, `/delivery/driver/:id/performance/today`, `/delivery/metrics/today` — none exist in `DeliveryController`
- `${API}/delivery/accept`, `/delivery/reject` — real paths are `/api/delivery/accept`, `/api/delivery/reject` ✅ (these do exist)
- `${API}/users/sessions/current`, `/users/sessions/store/active`, `/users/sessions/store`, `/users/sessions/:employeeId`, `/users/sessions/:employeeId/report`, `/users/sessions/:employeeId/status` — `WorkingSessionController` has NO such endpoints
- `${API}/inventory/items/category/:cat`, `/inventory/items/search`, `/inventory/items/reserve`, `/inventory/items/release`, `/inventory/items/consume`, `/inventory/low-stock`, `/inventory/out-of-stock`, `/inventory/expiring-soon`, `/inventory/alerts/low-stock`, `/inventory/value/by-category` — `InventoryController` uses query params on `GET /api/inventory` instead of separate sub-paths
- `${API}/inventory/suppliers/active`, `/inventory/suppliers/preferred`, `/inventory/suppliers/reliable`, `/inventory/suppliers/search` — `SupplierController` has no such sub-paths
- `${API}/menu/public`, `/menu/public/:id`, `/menu/public/cuisine/:cuisine`, etc. — `MenuController` collapsed all public routes into `GET /api/menu` with query params; comment says "Replaces /public/*"
- `${API}/equipment/store/status/:status`, `/equipment/store/maintenance-needed`, `/equipment/store/reset-usage` — `KitchenEquipmentController` has no store-scoped sub-paths
- `${API}/shifts/employee/:id/current`, `/shifts/store/:id/week` — `ShiftController` has no such paths
- `${API}/users/profile`, `/users/change-password`, `/users/type/:type`, `/users/store`, `/users/managers`, `/users/create`, `/users/search`, `/users/stats` — `UserController` has NO `/profile` endpoint anywhere, `change-password` is on `AuthController` at `/api/auth/change-password`, all filters use query params on `GET /api/users`
- `${API}/customers/user/:userId`, `/customers/email/:email`, `/customers/phone/:phone`, `/customers/high-value`, `/customers/top-spenders`, etc. — `CustomerController` uses query params on `GET /api/customers`; sub-path routes like `/loyalty/max-redeemable`, `/order-stats`, `/preferences`, `/loyalty/tier/:tier` don't exist as separate endpoints
- `${API}/reviews/order/:orderId`, `/reviews/customer/:customerId`, `/reviews/driver/:driverId`, `/reviews/item/:menuItemId`, `/reviews/recent`, `/reviews/needs-response`, `/reviews/stats/overall`, `/reviews/pending`, `/reviews/flagged`, `/reviews/staff/:id` — `ReviewController` uses query params on `GET /api/reviews`; consolidated
- `${API}/responses/review/:reviewId` (POST/GET) → real path is `POST /api/reviews/{id}/response` and `GET /api/reviews/{id}/response` — on `ReviewController`
- `${API}/responses/templates` → real path is `GET /api/reviews/response-templates`

### Backend-verified canonical endpoints (source of truth from controllers):
- **`AuthController`** → `/api/auth`: login, register, logout, refresh, google, change-password, validate-pin
- **`UserController`** → `/api/users`: GET(list), GET `/{id}`, PATCH `/{id}`, POST `/{id}/activate`, POST `/{id}/deactivate`, POST `/{id}/generate-pin`, POST/GET `/kiosk`, GET `/{id}/status`, PATCH `/{id}/status`, GET `/{id}/can-take-orders`
- **`WorkingSessionController`** → `/api/sessions`: POST(start), POST `/end`, POST `/clock-in`, POST `/clock-out`, GET(list), GET `/pending`, POST `/{id}/approve`, POST `/{id}/reject`, POST `/{id}/break`
- **`ShiftController`** → `/api/shifts`: GET, POST, POST `/bulk`, POST `/copy-week`, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`, POST `/{id}/confirm`, POST `/{id}/start`, POST `/{id}/complete`
- **`OrderController`** → `/api/orders`: POST, GET `/{id}`, GET `/track/{id}`, GET(list with query params), POST `/{id}/status`, POST `/{id}/next-stage`, PATCH `/{id}`, DELETE `/{id}`, PATCH `/{id}/payment`, POST `/{id}/quality-checkpoint`, PATCH `/{id}/quality-checkpoint/{name}`, GET `/analytics`
- **`MenuController`** → `/api/menu`: GET(list), GET `/{id}`, POST, POST `/bulk`, PATCH `/{id}`, DELETE `/{id}`, POST `/copy`, PATCH `/items/{id}/allergens`, GET `/stats`
- **`KitchenEquipmentController`** → `/api/equipment`: GET, POST, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`, POST `/{id}/maintenance`
- **`DeliveryController`** → `/api/delivery`: POST `/dispatch`, POST `/route`, POST `/accept`, POST `/reject`, POST `/location`, GET `/track/{id}`, POST `/verify`, POST `/{id}/otp`, GET `/driver/{id}/pending`, GET `/driver/{id}/performance`, GET `/zones`, POST `/{id}/status`, PATCH `/driver/{id}/status`, GET `/driver/{id}/status`, GET `/metrics`, GET `/drivers/available`
- **`InventoryController`** → `/api/inventory`: GET(with query params), POST, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`, POST `/{id}/stock`, GET `/value`
- **`SupplierController`** → `/api/suppliers`: GET, POST, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`, GET `/compare`
- **`PurchaseOrderController`** → `/api/purchase-orders`: GET, POST, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`, POST `/auto-generate`
- **`PaymentController`** → `/api/payments`: POST `/initiate`, POST `/verify`, POST `/cash`, GET `/{id}`, GET(list), POST `/{id}/reconcile`
- **`RefundController`** → `/api/payments/refund`: POST, GET `/{id}`, GET(list)
- **`ReviewController`** → `/api/reviews`: GET(list with query params), POST, GET `/stats`, GET `/public/token/{token}`, POST `/public/submit`, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`, POST `/{id}/response`, GET `/response-templates`
- **`WasteController`** → `/api/waste`: GET(list), POST, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`, GET `/analytics`
- **`CustomerController`** → `/api/customers`: GET(list with query params), POST, GET `/stats`, GET `/{id}`, PATCH `/{id}`, POST `/{id}/activate`, POST `/{id}/deactivate`, POST `/{id}/loyalty`, POST `/{id}/addresses`, PATCH `/{id}/addresses/{addressId}`, DELETE `/{id}/addresses/{addressId}`, POST `/{id}/tags`, DELETE `/{id}`, POST `/get-or-create`
- **`NotificationController`** → `/api/notifications`: GET, POST, PATCH `/{id}/read`, PATCH `/read-all`, DELETE `/{id}`
- **`UserPreferencesController`** → `/api/preferences`: (verify endpoints)
- **`CampaignController`** → `/api/campaigns`: (verify endpoints)
- **`AnalyticsController`** → `GET /api/analytics`, `POST /api/analytics/cache/clear`, `GET /api/bi`, `GET /api/bi/reports`

### Other corrections:
4. **`inventoryApi.ts`** — `baseUrl = ${API_CONFIG.API_GATEWAY_URL}/inventory`. Fix: change to `API_CONFIG.BASE_URL` and prefix URLs with `/api/inventory`, `/api/suppliers`, `/api/purchase-orders`.
5. **`orderApi.ts`** — `baseUrl = API_CONFIG.ORDER_SERVICE_URL`. Fix: add `/api/` prefix to all URLs AND change `updateOrderStatus` to POST.
6. **`order.pact.test.ts` is BROKEN** — imports `{ Pact, Matchers }` — no bare `Pact` export in v16 (it's `PactV2`). Must rewrite as `PactV4`.
7. **OOM crash** — add `pool: 'forks'` + `maxForks: 2` to vitest.config.ts. Must be done BEFORE raising coverage thresholds.
8. **`coverage.include` missing** — add `include: ['src/**/*.{ts,tsx}']` so coverage only counts source files.

---

## File Map

| File | Change |
|------|--------|
| `frontend/src/test/mocks/handlers/orderHandlers.ts` | Fix `/api/` prefix + remove stale routes that don't exist in `OrderController` |
| `frontend/src/test/mocks/handlers/paymentHandlers.ts` | Fix `/api/` prefix |
| `frontend/src/test/mocks/handlers/authHandlers.ts` | Fix to `/api/auth/` paths; remove `/users/profile` handler (no profile endpoint exists) |
| `frontend/src/test/mocks/handlers/menuHandlers.ts` | Fix: collapse `/menu/public/*` into `GET /api/menu` with query params; fix item paths |
| `frontend/src/test/mocks/handlers/userHandlers.ts` | Fix `/api/users/` prefix; `/api/auth/validate-pin` for pin validation |
| `frontend/src/test/mocks/handlers/deliveryHandlers.ts` | Fix prefix + rename `auto-dispatch→dispatch`, `route-optimize→route`; remove non-existent sub-paths |
| `frontend/src/test/mocks/handlers/customerHandlers.ts` | Has correct prefix but stale sub-paths — remove non-existent routes |
| `frontend/src/test/mocks/handlers/inventoryHandlers.ts` | Fix to `/api/inventory`, `/api/suppliers`, `/api/purchase-orders`; remove stale sub-paths |
| `frontend/src/test/mocks/handlers/notificationHandlers.ts` | **Already correct** — verify only, no changes needed |
| `frontend/src/test/mocks/handlers/sessionHandlers.ts` | Rewrite: only 9 real endpoints exist; remove 5 stale routes |
| `frontend/src/test/mocks/handlers/analyticsHandlers.ts` | **Already correct** — verify only, no changes needed |
| `frontend/src/test/mocks/handlers/reviewHandlers.ts` | Fix `/api/reviews/` prefix |
| `frontend/src/store/api/authApi.ts` | Fix paths: `/api/auth/login` not `/users/login` |
| `frontend/src/store/api/sessionApi.ts` | Fix to `/api/sessions`; remove 5 methods for non-existent endpoints |
| `frontend/src/store/api/equipmentApi.ts` | Fix `/api/equipment`; remove `resetUsageCounts` + stale store sub-paths |
| `frontend/src/store/api/orderApi.ts` | Add `/api/` prefix to ALL order URLs + change `updateOrderStatus` to POST |
| `frontend/src/store/api/shiftApi.ts` | Fix `/api/shifts/bulk`; add `/api/`; remove `employee/:id/current`, `store/:id/week` |
| `frontend/src/store/api/driverApi.ts` | Fix `/api/delivery/location`; add `/api/` prefix to all driver URLs |
| `frontend/src/store/api/inventoryApi.ts` | Change baseUrl to BASE_URL; fix all URL groups; remove stale sub-paths |
| `frontend/src/pact/consumers/order.pact.test.ts` | Rewrite — imports broken `Pact` v2 class — rewrite as `PactV4` |
| `frontend/src/pact/consumers/order-service.pact.test.ts` | Delete — replaced by rewritten `order.pact.test.ts` |
| `frontend/src/pact/consumers/menu-service.pact.test.ts` | Rewrite using `PactV4` with correct paths |
| `frontend/src/pact/consumers/payment-service.pact.test.ts` | Rewrite using `PactV4` |
| `frontend/src/pact/consumers/user-service.pact.test.ts` | Rewrite using `PactV4` |
| `frontend/src/pact/consumers/delivery-service.pact.test.ts` | Rewrite using `PactV4` with correct paths |
| `frontend/src/pact/consumers/customer-service.pact.test.ts` | Rewrite using `PactV4` |
| `frontend/vitest.config.ts` | Add OOM fix (pool:forks + maxForks:2 + include); raise coverage thresholds to 80% |

---

### Task 0: Fix Vitest OOM Crash (prerequisite for all other tasks)

**Context:** Running `npm run test:run` crashes with `JS heap out of memory` after ~263s. Root cause: Vitest's default `pool: 'threads'` shares memory across workers and spawns too many concurrent workers for a large test suite. Fix: switch to `pool: 'forks'` (isolated subprocesses) and cap `maxWorkers`. This must be done first — the OOM prevents reliable test runs.

**Files:**
- Modify: `frontend/vitest.config.ts`

- [ ] **Step 1: Add pool config and fix coverage include to vitest.config.ts**

In `frontend/vitest.config.ts`, update the `test` block to add pool config, fix coverage include, and raise thresholds at the same time:

```typescript
// BEFORE (in test block)
testTimeout: 10000,
hookTimeout: 10000,
clearMocks: true,
restoreMocks: true,
mockReset: true,

// AFTER — add these lines
testTimeout: 15000,
hookTimeout: 15000,
clearMocks: true,
restoreMocks: true,
mockReset: true,

// Pool config: forks prevents OOM by isolating each worker in its own process
pool: 'forks',
poolOptions: {
  forks: {
    maxForks: 2,        // cap concurrent processes — M1 Mac has enough RAM but keep it sane
    minForks: 1,
  },
},
```

Also update the `coverage` block to add `include` and raise thresholds:

```typescript
// BEFORE
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/types.ts',
    '**/vite-env.d.ts',
    '**/*.config.{ts,js}',
    '**/dist/',
  ],
  thresholds: {
    lines: 30,
    branches: 25,
    functions: 30,
    statements: 30,
  },
},

// AFTER
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  include: ['src/**/*.{ts,tsx}'],   // only measure source files, not test utilities
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/types.ts',
    '**/vite-env.d.ts',
    '**/*.config.{ts,js}',
    '**/dist/',
    'src/pact/**',
  ],
  thresholds: {
    lines: 80,
    branches: 75,
    functions: 80,
    statements: 80,
  },
},
```

- [ ] **Step 2: Run a quick test to confirm no OOM**

```bash
cd frontend && npm run test:run -- src/store/api/authApi.test.ts --reporter=verbose 2>&1 | tail -15
```

Expected: no `heap out of memory` error, test completes cleanly.

- [ ] **Step 3: Run full suite to verify fewer crashes**

```bash
cd frontend && npm run test:run 2>&1 | tail -10
```

Expected: test summary prints without OOM error (some tests may still fail due to URL bugs — that is fixed in Tasks 1 and 2).

- [ ] **Step 4: Commit**

```bash
git add frontend/vitest.config.ts
git commit -m "fix(frontend/test): switch Vitest pool to forks to prevent OOM, add coverage include, raise thresholds to 80%"
```

---

### Task 1: Fix MSW Handler URLs — Add /api/ Prefix

**Context:** MSW v2 in Node/jsdom requires absolute URLs. Handlers using `${API}/orders` (where `API = 'http://localhost:8080'`) resolve to `http://localhost:8080/orders`. The backend serves `http://localhost:8080/api/orders`. MSW intercepts the wrong URL and tests make real network calls or fail silently.

The fix: change every handler to include `/api/` in the path. Three files are already correct (`customerHandlers.ts`, `notificationHandlers.ts`, `analyticsHandlers.ts`) — do NOT touch them.

**Files:**
- Modify: `orderHandlers.ts`, `authHandlers.ts`, `sessionHandlers.ts`, `deliveryHandlers.ts`, `inventoryHandlers.ts`, `paymentHandlers.ts`, `menuHandlers.ts`, `userHandlers.ts`, `reviewHandlers.ts`
- Verify only (no changes): `customerHandlers.ts`, `notificationHandlers.ts`, `analyticsHandlers.ts`

- [ ] **Step 1: Fix orderHandlers.ts — add /api/ prefix AND remove stale routes**

`OrderController` (verified) only exposes: `POST /api/orders`, `GET /api/orders/{id}`, `GET /api/orders/track/{id}`, `GET /api/orders` (list with query params), `POST /api/orders/{id}/status`, `POST /api/orders/{id}/next-stage`, `PATCH /api/orders/{id}`, `DELETE /api/orders/{id}`, `PATCH /api/orders/{id}/payment`, `POST /api/orders/{id}/quality-checkpoint`, `PATCH /api/orders/{id}/quality-checkpoint/{name}`.

Keep only handlers that map to real endpoints. Remove: `orders/status/:status`, `orders/kitchen`, `orders/store`, `orders/customer/:id`, `orders/number/:num`, `orders/date/:date`, `orders/range`, `orders/active-deliveries/count`, `orders/search`, `orders/store/avg-prep-time`, `orders/store/failed-quality-checks`, `orders/store/make-table/:station`.

```typescript
// KEEP with /api/ prefix — these endpoints exist in OrderController:
http.post(`${API}/api/orders`, ...)
http.get(`${API}/api/orders`, ...)             // list with query params ?storeId=&status=&startDate=&endDate=
http.get(`${API}/api/orders/:orderId`, ...)
http.get(`${API}/api/orders/track/:orderId`, ...)
http.post(`${API}/api/orders/:orderId/status`, ...)  // POST not PATCH
http.post(`${API}/api/orders/:orderId/next-stage`, ...)
http.patch(`${API}/api/orders/:orderId`, ...)
http.delete(`${API}/api/orders/:orderId`, ...)
http.patch(`${API}/api/orders/:orderId/payment`, ...)
http.post(`${API}/api/orders/:orderId/quality-checkpoint`, ...)
http.patch(`${API}/api/orders/:orderId/quality-checkpoint/:checkpointName`, ...)

// REMOVE — these don't exist in backend:
// http.get(`${API}/orders/status/:status`, ...)
// http.get(`${API}/orders/kitchen`, ...)
// http.get(`${API}/orders/store`, ...)
// http.get(`${API}/orders/customer/:customerId`, ...)
// ... etc.
```

- [ ] **Step 2: Fix authHandlers.ts — paths change from /users/ to /api/auth/**

The auth endpoints canonical paths are under `/api/auth/` not `/users/`. Also fix `/users/profile` → `/api/users/profile` (profile is on UserController):

```typescript
// BEFORE
http.post(`${API}/users/login`, ...)
http.post(`${API}/users/register`, ...)
http.post(`${API}/users/refresh-token`, ...)   // also wrong suffix
http.post(`${API}/users/logout`, ...)
http.get(`${API}/users/profile`, ...)          // ← REMOVE: no /profile endpoint exists anywhere

// AFTER
http.post(`${API}/api/auth/login`, ...)
http.post(`${API}/api/auth/register`, ...)
http.post(`${API}/api/auth/refresh`, ...)      // canonical: /api/auth/refresh
http.post(`${API}/api/auth/logout`, ...)
// Remove the profile handler entirely — no /profile endpoint exists in UserController or AuthController
```

- [ ] **Step 3: Fix sessionHandlers.ts — rewrite to only 9 real endpoints**

`WorkingSessionController` (verified) only has these 9 endpoints: `POST /api/sessions` (start), `POST /api/sessions/end`, `POST /api/sessions/clock-in`, `POST /api/sessions/clock-out`, `GET /api/sessions` (list), `GET /api/sessions/pending`, `POST /api/sessions/{id}/approve`, `POST /api/sessions/{id}/reject`, `POST /api/sessions/{id}/break`.

Remove the 5 routes that don't exist in the backend: `current`, `store/active`, `store`, `/:employeeId` (employee-specific list), `/:employeeId/report`, `/:employeeId/status`.

```typescript
// KEEP — real endpoints (9 total):
http.post(`${API}/api/sessions`, ...)                    // start session
http.post(`${API}/api/sessions/end`, ...)
http.post(`${API}/api/sessions/clock-in`, ...)
http.post(`${API}/api/sessions/clock-out`, ...)
http.get(`${API}/api/sessions`, ...)                     // list all sessions
http.get(`${API}/api/sessions/pending`, ...)
http.post(`${API}/api/sessions/:sessionId/approve`, ...)
http.post(`${API}/api/sessions/:sessionId/reject`, ...)
http.post(`${API}/api/sessions/:sessionId/break`, ...)

// REMOVE — these endpoints do NOT exist in WorkingSessionController:
// http.get(`${API}/users/sessions/current`, ...)
// http.get(`${API}/users/sessions/store/active`, ...)
// http.get(`${API}/users/sessions/store`, ...)
// http.get(`${API}/users/sessions/:employeeId`, ...)
// http.get(`${API}/users/sessions/:employeeId/report`, ...)
// http.get(`${API}/users/sessions/:employeeId/status`, ...)
```

- [ ] **Step 4: Fix deliveryHandlers.ts — fix paths AND remove non-existent routes**

`DeliveryController` (verified) has: `POST /dispatch`, `POST /route`, `POST /accept`, `POST /reject`, `POST /location`, `GET /track/{id}`, `POST /verify`, `POST /{id}/otp`, `GET /driver/{id}/pending`, `GET /driver/{id}/performance`, `GET /zones`, `POST /{id}/status`, `PATCH /driver/{id}/status`, `GET /driver/{id}/status`, `GET /metrics`, `GET /drivers/available`.

```typescript
// KEEP with /api/ prefix — real endpoints:
http.get(`${API}/api/delivery/drivers/available`, ...)
http.post(`${API}/api/delivery/dispatch`, ...)           // was /auto-dispatch — name change
http.post(`${API}/api/delivery/route`, ...)              // was /route-optimize — name change
http.post(`${API}/api/delivery/accept`, ...)
http.post(`${API}/api/delivery/reject`, ...)
http.post(`${API}/api/delivery/location`, ...)           // was /location-update — name change
http.get(`${API}/api/delivery/track/:orderId`, ...)
http.post(`${API}/api/delivery/verify`, ...)
http.post(`${API}/api/delivery/:orderId/otp`, ...)       // was /:orderId/generate-otp
http.get(`${API}/api/delivery/driver/:driverId/pending`, ...)
http.get(`${API}/api/delivery/driver/:driverId/performance`, ...)
http.get(`${API}/api/delivery/zones`, ...)               // plural, was /zone/list
http.post(`${API}/api/delivery/:trackingId/status`, ...)
http.patch(`${API}/api/delivery/driver/:driverId/status`, ...)
http.get(`${API}/api/delivery/driver/:driverId/status`, ...)
http.get(`${API}/api/delivery/metrics`, ...)

// REMOVE — these do NOT exist in DeliveryController:
// http.get(`${API}/delivery/eta/:orderId`, ...)
// http.get(`${API}/delivery/metrics/today`, ...)
// http.get(`${API}/delivery/driver/:id/performance/today`, ...)
// http.get(`${API}/delivery/zone/check`, ...)
// http.get(`${API}/delivery/zone/fee`, ...)
// http.get(`${API}/delivery/zone/validate`, ...)
// http.post(`${API}/delivery/:orderId/regenerate-otp`, ...)
```

- [ ] **Step 5: Verify analyticsHandlers.ts is already correct — no changes needed**

```bash
grep -n "http\." frontend/src/test/mocks/handlers/analyticsHandlers.ts | head -5
```

Expected: all routes already have `${API}/api/analytics/...` or `${API}/api/bi/...`. If all correct, move on.

- [ ] **Step 6: Fix inventoryHandlers.ts — three base paths, remove stale sub-paths**

`InventoryController` (verified): GET `/api/inventory` (with query params `?category=&search=&lowStock=&outOfStock=&expiringSoon=`), POST, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`, POST `/{id}/stock`, GET `/value`.
`SupplierController` (verified): GET `/api/suppliers`, POST, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`, GET `/compare`.
`PurchaseOrderController` (verified): GET `/api/purchase-orders`, POST, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`, POST `/auto-generate`.

```typescript
// KEEP — real Inventory endpoints:
http.get(`${API}/api/inventory`, ...)          // list with query params
http.post(`${API}/api/inventory`, ...)
http.get(`${API}/api/inventory/:id`, ...)
http.patch(`${API}/api/inventory/:id`, ...)
http.delete(`${API}/api/inventory/:id`, ...)
http.post(`${API}/api/inventory/:id/stock`, ...)
http.get(`${API}/api/inventory/value`, ...)

// KEEP — real Supplier endpoints:
http.get(`${API}/api/suppliers`, ...)
http.post(`${API}/api/suppliers`, ...)
http.get(`${API}/api/suppliers/:id`, ...)
http.patch(`${API}/api/suppliers/:id`, ...)
http.delete(`${API}/api/suppliers/:id`, ...)
http.get(`${API}/api/suppliers/compare`, ...)

// KEEP — real PurchaseOrder endpoints:
http.get(`${API}/api/purchase-orders`, ...)
http.post(`${API}/api/purchase-orders`, ...)
http.get(`${API}/api/purchase-orders/:id`, ...)
http.patch(`${API}/api/purchase-orders/:id`, ...)
http.delete(`${API}/api/purchase-orders/:id`, ...)
http.post(`${API}/api/purchase-orders/auto-generate`, ...)

// REMOVE — these don't exist in any backend controller:
// http.get(`${API}/inventory/items/category/:cat`, ...)       ← use ?category= query param
// http.get(`${API}/inventory/items/search`, ...)              ← use ?search= query param
// http.get(`${API}/inventory/low-stock`, ...)                 ← use ?lowStock=true
// http.get(`${API}/inventory/out-of-stock`, ...)              ← use ?outOfStock=true
// http.get(`${API}/inventory/expiring-soon`, ...)             ← use ?expiringSoon=true
// http.get(`${API}/inventory/alerts/low-stock`, ...)
// http.get(`${API}/inventory/value/by-category`, ...)         ← use ?byCategory=true
// http.patch(`${API}/inventory/items/:id/reserve`, ...)       ← use POST /{id}/stock with operation=RESERVE
// http.patch(`${API}/inventory/items/:id/release`, ...)       ← use POST /{id}/stock with operation=RELEASE
// http.patch(`${API}/inventory/items/:id/consume`, ...)       ← use POST /{id}/stock with operation=CONSUME
// http.get(`${API}/inventory/suppliers/active`, ...)
// http.get(`${API}/inventory/suppliers/preferred`, ...)
// http.get(`${API}/inventory/suppliers/reliable`, ...)
// http.get(`${API}/inventory/suppliers/search`, ...)
// KEEP — real Waste endpoints (WasteController verified at /api/waste):
http.get(`${API}/api/waste`, ...)
http.post(`${API}/api/waste`, ...)
http.get(`${API}/api/waste/:id`, ...)
http.patch(`${API}/api/waste/:id`, ...)
http.delete(`${API}/api/waste/:id`, ...)
http.get(`${API}/api/waste/analytics`, ...)

// REMOVE — stale waste sub-paths not in WasteController:
// http.get(`${API}/inventory/waste/trend`, ...)   ← use /api/waste/analytics instead
```

- [ ] **Step 7: Fix paymentHandlers.ts — add /api/ prefix**

```typescript
// BEFORE → AFTER (representative — apply to ALL routes)
`${API}/payments/initiate`                → `${API}/api/payments/initiate`
`${API}/payments/cash`                    → `${API}/api/payments/cash`
`${API}/payments/verify`                  → `${API}/api/payments/verify`
`${API}/payments/:transactionId`          → `${API}/api/payments/:transactionId`
`${API}/payments/order/:orderId`          → `${API}/api/payments/order/:orderId`
`${API}/payments/customer/:customerId`    → `${API}/api/payments/customer/:customerId`
`${API}/payments/store`                   → `${API}/api/payments/store`
`${API}/payments/reconciliation`          → `${API}/api/payments/reconciliation`
`${API}/payments/:transactionId/reconcile`→ `${API}/api/payments/:transactionId/reconcile`
`${API}/payments/refund`                  → `${API}/api/payments/refund`
`${API}/payments/refund/:refundId`        → `${API}/api/payments/refund/:refundId`
// etc.
```

- [ ] **Step 8: Fix menuHandlers.ts — collapse /public/* routes, fix item paths**

`MenuController` (verified) has: `GET /api/menu` (list — replaces all `/public/*` sub-paths via query params), `GET /api/menu/{id}`, `POST /api/menu`, `POST /api/menu/bulk`, `PATCH /api/menu/{id}`, `DELETE /api/menu/{id}`, `POST /api/menu/copy`, `PATCH /api/menu/items/{id}/allergens`, `GET /api/menu/stats`.

The controller comment explicitly says: "Replaces: /public, /public/{id}, /public/cuisine/{c}, /public/category/{cat}, /public/dietary/{d}, /public/recommended, /public/search, /public/tag/{t}". All those old paths no longer exist.

```typescript
// KEEP — real endpoints:
http.get(`${API}/api/menu`, ...)               // list all menu items (accepts query params)
http.get(`${API}/api/menu/:id`, ...)
http.post(`${API}/api/menu`, ...)
http.post(`${API}/api/menu/bulk`, ...)
http.patch(`${API}/api/menu/:id`, ...)
http.delete(`${API}/api/menu/:id`, ...)
http.post(`${API}/api/menu/copy`, ...)
http.patch(`${API}/api/menu/items/:id/allergens`, ...)
http.get(`${API}/api/menu/stats`, ...)

// REMOVE — all /public/* sub-paths are gone (collapsed into GET /api/menu):
// http.get(`${API}/menu/public`, ...)
// http.get(`${API}/menu/public/:id`, ...)
// http.get(`${API}/menu/public/cuisine/:cuisine`, ...)
// http.get(`${API}/menu/public/category/:category`, ...)
// http.get(`${API}/menu/public/dietary/:type`, ...)
// http.get(`${API}/menu/public/recommended`, ...)
// http.get(`${API}/menu/public/search`, ...)
// http.get(`${API}/menu/public/tag/:tag`, ...)
// http.patch(`${API}/menu/items/:id/availability`, ...)        ← no availability endpoint in controller
// http.patch(`${API}/menu/items/:id/availability/:status`, ...)
```

- [ ] **Step 9: Fix userHandlers.ts — add /api/ prefix AND remove stale routes**

`UserController` (verified) uses query params for type/search/store/availability — NOT sub-paths. There is no `/profile` endpoint anywhere. `change-password` is on `AuthController`.

```typescript
// KEEP — real endpoints:
http.get(`${API}/api/users`, ...)            // list (query: ?type=&storeId=&search=&available=)
http.get(`${API}/api/users/:userId`, ...)
http.patch(`${API}/api/users/:userId`, ...)
http.post(`${API}/api/users/:userId/activate`, ...)
http.post(`${API}/api/users/:userId/deactivate`, ...)
http.post(`${API}/api/users/:userId/generate-pin`, ...)
http.get(`${API}/api/users/:userId/status`, ...)
http.patch(`${API}/api/users/:userId/status`, ...)
http.get(`${API}/api/users/:userId/can-take-orders`, ...)
http.post(`${API}/api/auth/validate-pin`, ...)    // moved from users — on AuthController

// REMOVE — these don't exist in UserController:
// http.get(`${API}/users/profile`, ...)          ← no /profile endpoint anywhere
// http.put(`${API}/users/profile`, ...)          ← no /profile endpoint anywhere
// http.post(`${API}/users/change-password`, ...) ← on AuthController at /api/auth/change-password
// http.get(`${API}/users/type/:type`, ...)       ← use ?type= query param
// http.get(`${API}/users/store`, ...)            ← use ?storeId= query param
// http.get(`${API}/users/managers`, ...)         ← use ?type=MANAGER query param
// http.post(`${API}/users/create`, ...)          ← no POST /users/create; just POST /api/users (or /api/auth/register)
// http.get(`${API}/users/search`, ...)           ← use ?search= query param
// http.get(`${API}/users/stats`, ...)            ← no stats endpoint in UserController
```

- [ ] **Step 10: Fix reviewHandlers.ts — add /api/ prefix AND fix response/template paths AND remove stale sub-paths**

`ReviewController` (verified) at `/api/reviews`: GET(list), POST, GET `/stats`, GET `/public/token/{token}`, POST `/public/submit`, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`, POST `/{id}/response`, GET `/response-templates`.

```typescript
// KEEP — real endpoints:
http.get(`${API}/api/reviews`, ...)                      // list (query params for filter)
http.post(`${API}/api/reviews`, ...)
http.get(`${API}/api/reviews/stats`, ...)
http.get(`${API}/api/reviews/public/token/:token`, ...)
http.post(`${API}/api/reviews/public/submit`, ...)
http.get(`${API}/api/reviews/:reviewId`, ...)
http.patch(`${API}/api/reviews/:reviewId`, ...)
http.delete(`${API}/api/reviews/:reviewId`, ...)
http.post(`${API}/api/reviews/:reviewId/response`, ...)   // was /responses/review/:id — wrong base path
http.get(`${API}/api/reviews/:reviewId/response`, ...)    // was /responses/review/:id
http.get(`${API}/api/reviews/response-templates`, ...)    // was /responses/templates — wrong base path

// REMOVE — these don't exist in ReviewController:
// http.get(`${API}/reviews/order/:orderId`, ...)          ← use ?orderId= query param
// http.get(`${API}/reviews/customer/:customerId`, ...)    ← use ?customerId= query param
// http.get(`${API}/reviews/driver/:driverId`, ...)        ← use ?driverId= query param
// http.get(`${API}/reviews/item/:menuItemId`, ...)        ← use ?menuItemId= query param
// http.get(`${API}/reviews/recent`, ...)                  ← use ?recent=true query param
// http.get(`${API}/reviews/needs-response`, ...)          ← use ?needsResponse=true
// http.patch(`${API}/reviews/:reviewId/flag`, ...)        ← use PATCH /:id with body
// http.patch(`${API}/reviews/:reviewId/status`, ...)      ← use PATCH /:id with body
// http.get(`${API}/reviews/stats/overall`, ...)           ← just /stats
// http.get(`${API}/reviews/stats/driver/:id`, ...)        ← use /stats?driverId=
// http.get(`${API}/reviews/stats/item/:id`, ...)          ← use /stats?menuItemId=
// http.get(`${API}/reviews/public/item/:id/average`, ...) ← no such endpoint
// http.get(`${API}/reviews/pending`, ...)                 ← use ?status=PENDING query param
// http.get(`${API}/reviews/flagged`, ...)                 ← use ?status=FLAGGED query param
// http.post(`${API}/reviews/:id/approve`, ...)            ← use PATCH /:id with body
// http.post(`${API}/reviews/:id/reject`, ...)             ← use PATCH /:id with body
// http.get(`${API}/reviews/staff/:id/rating`, ...)        ← no such endpoint
// http.get(`${API}/reviews/staff/:id`, ...)               ← no such endpoint
```

- [ ] **Step 11: Fix customerHandlers.ts — prefix correct but remove stale sub-paths**

`CustomerController` (verified) uses query params: `?email=&phone=&userId=&tier=&tag=&search=&filter=`. Many sub-path routes in the handler are stale.

```typescript
// KEEP — real endpoints (prefix already correct):
http.get(`${API}/api/customers`, ...)              // list (query params)
http.post(`${API}/api/customers`, ...)
http.post(`${API}/api/customers/get-or-create`, ...)  // internal only — keep for test mocking
http.get(`${API}/api/customers/stats`, ...)
http.get(`${API}/api/customers/:id`, ...)
http.patch(`${API}/api/customers/:id`, ...)
http.post(`${API}/api/customers/:id/activate`, ...)
http.post(`${API}/api/customers/:id/deactivate`, ...)
http.post(`${API}/api/customers/:id/loyalty`, ...)    // unified endpoint: EARNED|REDEEMED in body
http.post(`${API}/api/customers/:id/addresses`, ...)
http.patch(`${API}/api/customers/:id/addresses/:addressId`, ...)
http.delete(`${API}/api/customers/:id/addresses/:addressId`, ...)
http.post(`${API}/api/customers/:id/tags`, ...)
http.delete(`${API}/api/customers/:id`, ...)

// REMOVE — these don't exist in CustomerController:
// http.get(`${API}/api/customers/user/:userId`, ...)
// http.get(`${API}/api/customers/email/:email`, ...)
// http.get(`${API}/api/customers/phone/:phone`, ...)
// http.get(`${API}/api/customers/active`, ...)
// http.get(`${API}/api/customers/high-value`, ...)
// http.get(`${API}/api/customers/top-spenders`, ...)
// http.get(`${API}/api/customers/recently-active`, ...)
// http.get(`${API}/api/customers/inactive`, ...)
// http.get(`${API}/api/customers/birthdays/today`, ...)
// http.get(`${API}/api/customers/marketing-opt-in`, ...)
// http.get(`${API}/api/customers/sms-opt-in`, ...)
// http.get(`${API}/api/customers/loyalty/tier/:tier`, ...)
// http.post(`${API}/api/customers/:id/loyalty/points`, ...)      ← use /loyalty with type=EARNED
// http.post(`${API}/api/customers/:id/loyalty/redeem`, ...)      ← use /loyalty with type=REDEEMED
// http.get(`${API}/api/customers/:id/loyalty/max-redeemable`, ...) ← bundled in GET /:id response
// http.get(`${API}/api/customers/:id/order-stats`, ...)
// http.get(`${API}/api/customers/:id/preferences`, ...)
// http.get(`${API}/api/customers/:id/loyalty/points`, ...)
// http.get(`${API}/api/customers/:id/addresses`, ...)
// http.patch(`${API}/api/customers/:id/addresses/:id/set-default`, ...)  ← use PATCH /:id/addresses/:id with isDefault: true
// http.post(`${API}/api/customers/:id/notes`, ...)
// http.patch(`${API}/api/customers/:id/verify-email`, ...)
// http.patch(`${API}/api/customers/:id/verify-phone`, ...)
// http.delete(`${API}/api/customers/:id/tags`, ...)
// http.get(`${API}/api/customers/tags`, ...)
```

- [ ] **Step 12: Verify notificationHandlers.ts is correct**

```bash
grep -n "http\." frontend/src/test/mocks/handlers/notificationHandlers.ts | head -5
```

Expected: all routes use `/api/notifications/...`, `/api/preferences/...`, `/api/campaigns/...` — all confirmed correct.

- [ ] **Step 13: Run grep to verify no handlers remain without /api/ prefix**

```bash
grep -rn "http\.\(get\|post\|put\|patch\|delete\).*\`\${API}/[^a]" frontend/src/test/mocks/handlers/
```

Expected: zero matches. Every handler should now have `/api/` after the base URL.

- [ ] **Step 14: Commit**

```bash
git add frontend/src/test/mocks/handlers/
git commit -m "fix(frontend/test): add /api/ prefix to all MSW handlers to match actual backend routes, remove stale sub-paths"
```

---

### Task 2: Fix RTK Query Slice URL Mismatches

**Context:** Multiple RTK Query slices have URL mismatches — wrong paths, wrong HTTP methods, stale sub-path endpoints that don't exist in the backend. Each slice needs targeted fixes. These fixes correct both the app behaviour and the tests simultaneously since MSW handler fixes align with the same canonical paths.

**Files:**
- Modify: `authApi.ts`, `sessionApi.ts`, `equipmentApi.ts`, `orderApi.ts`, `shiftApi.ts`, `driverApi.ts`, `inventoryApi.ts`

- [ ] **Step 1: Fix authApi.ts — change from /users/ to /api/auth/**

In `frontend/src/store/api/authApi.ts`, the `baseQuery` is `baseQueryWithAuth` which uses `API_CONFIG.BASE_URL` (gateway root). Change each endpoint URL:

```typescript
// BEFORE
url: '/users/login',
url: '/users/register',
url: '/users/refresh',
url: '/users/logout',
query: () => '/users/profile',          // ← this endpoint does NOT exist in any backend controller
url: '/users/auth/google',
url: '/users/auth/google/register',

// AFTER
url: '/api/auth/login',
url: '/api/auth/register',
url: '/api/auth/refresh',
url: '/api/auth/logout',
// getProfile → remove or replace with GET /api/users/{userId} (use current user's ID from JWT)
// The backend has no /profile shortcut — profile data comes from GET /api/users/{userId}
url: '/api/auth/google',
url: '/api/auth/google',               // same endpoint handles both login and register
```

- [ ] **Step 2: Fix sessionApi.ts — fix paths AND remove methods for non-existent endpoints**

`WorkingSessionController` (verified) has only 9 endpoints. Remove the RTK Query methods for `getCurrentSession` (`/current`), `getActiveStoreSessions` (`/store/active`), `getStoreSessions` (`/store`), `getEmployeeSessions` (`/:employeeId`), `getEmployeeSessionReport` (`/:employeeId/report`), `getEmployeeSessionStatus` (`/:employeeId/status`) — these endpoints do NOT exist in the backend controller.

Keep and fix the 9 real endpoint methods:

```typescript
// KEEP — fix URL and method names:
startSession:   url: '/api/sessions', method: 'POST'
endSession:     url: '/api/sessions/end', method: 'POST'
clockIn:        url: '/api/sessions/clock-in', method: 'POST'     // was clockInWithPin
clockOut:       url: '/api/sessions/clock-out', method: 'POST'    // was clockOutEmployee
getSessions:    query: () => '/api/sessions'                       // GET list
getPending:     query: () => '/api/sessions/pending'              // was pending-approval
approveSession: url: `/api/sessions/${sessionId}/approve`
rejectSession:  url: `/api/sessions/${sessionId}/reject`
addBreak:       url: `/api/sessions/${sessionId}/break`

// REMOVE these methods — no backend endpoint exists:
// getCurrentSession    → no /api/sessions/current
// getActiveStoreSessions → no /api/sessions/store/active
// getStoreSessions     → no /api/sessions/store
// getEmployeeSessions  → no /api/sessions/:employeeId list endpoint
// getEmployeeSessionReport → no /api/sessions/:id/report
// getEmployeeSessionStatus → no /api/sessions/:id/status
```

Also remove the `useRecordBreakMutation` alias export at the bottom (no longer needed).

- [ ] **Step 3: Fix equipmentApi.ts — /api/equipment not /kitchen-equipment, remove stale methods**

`KitchenEquipmentController` (verified) has: `GET /api/equipment`, `POST /api/equipment`, `GET /api/equipment/{id}`, `PATCH /api/equipment/{id}`, `DELETE /api/equipment/{id}`, `POST /api/equipment/{id}/maintenance`.

```typescript
// KEEP — real endpoints:
getEquipmentByStore:      query: () => '/api/equipment'
createEquipment:          url: '/api/equipment', method: 'POST'
getEquipmentById:         query: (id) => `/api/equipment/${id}`
updateEquipment:          url: `/api/equipment/${id}`, method: 'PATCH'   // was updateEquipmentStatus
deleteEquipment:          url: `/api/equipment/${id}`, method: 'DELETE'
recordMaintenance:        url: `/api/equipment/${id}/maintenance`, method: 'POST'

// REMOVE — these endpoints do NOT exist in KitchenEquipmentController:
// toggleEquipmentPower   → no /api/equipment/{id}/power
// updateTemperature      → no /api/equipment/{id}/temperature
// getEquipmentByStatus   → no /api/equipment/store/status/:status
// getEquipmentNeedingMaintenance → no /api/equipment/store/maintenance-needed
// resetUsageCounts       → no /api/equipment/store/reset-usage
```

Change `baseUrl` from `API_CONFIG.ORDER_SERVICE_URL` to `API_CONFIG.BASE_URL`.

- [ ] **Step 4: Fix orderApi.ts — add /api/ prefix to ALL URLs + change updateOrderStatus to POST**

`orderApi.ts` has `baseUrl: API_CONFIG.ORDER_SERVICE_URL` (= gateway root). All query/mutation URLs lack the `/api/` prefix:

`OrderController` comment says: "Replaces: /items, /priority, /assign-driver, /assign-make-table..." — they are all now `PATCH /api/orders/{id}` with different body keys.

```typescript
// KEEP — real endpoints (add /api/ prefix):
url: '/api/orders',                              POST create
query: `/api/orders/${orderId}`                  GET by id
query: `/api/orders/track/${orderId}`            GET track (public, no auth)
query: '/api/orders' (+ query params)            GET list (?storeId=&status=&kitchen=&customerId=&search=&number=)
url: `/api/orders/${orderId}/status`, POST       POST status transition (was PATCH)
url: `/api/orders/${orderId}/next-stage`, POST   POST next kitchen stage
url: `/api/orders/${orderId}`, PATCH             PATCH update (replaces /items, /priority, /assign-driver, /assign-make-table)
url: `/api/orders/${orderId}`, DELETE            DELETE / cancel
url: `/api/orders/${orderId}/payment`, PATCH     PATCH payment status
url: `/api/orders/${orderId}/quality-checkpoint`, POST
url: `/api/orders/${orderId}/quality-checkpoint/${name}`, PATCH
query: '/api/orders/analytics'                   GET analytics (+ query params)

// REMOVE — these are now handled by PATCH /api/orders/{id} with body keys:
// url: `/orders/${orderId}/assign-driver`       → use PATCH /{id} with body {driverId: ...}
// url: `/orders/${orderId}/items`               → use PATCH /{id} with body {items: [...]}
// url: `/orders/${orderId}/priority`            → use PATCH /{id} with body {priority: ...}
// url: `/orders/${orderId}/assign-make-table`   → use PATCH /{id} with body {makeTableStation: ...}
// Also remove: /orders/status/:status, /orders/kitchen, /orders/store, /orders/customer/:id,
//   /orders/number/:num, /orders/date/:date, /orders/range, /orders/active-deliveries/count,
//   /orders/search, /orders/store/avg-prep-time, /orders/store/failed-quality-checks
// These are all query params on GET /api/orders
```

- [ ] **Step 5: Fix shiftApi.ts — add /api/ prefix, fix names, remove stale methods**

`ShiftController` (verified) has: `GET /api/shifts`, `POST /api/shifts`, `POST /api/shifts/bulk`, `POST /api/shifts/copy-week`, `GET /api/shifts/{id}`, `PATCH /api/shifts/{id}`, `DELETE /api/shifts/{id}`, `POST /api/shifts/{id}/confirm`, `POST /api/shifts/{id}/start`, `POST /api/shifts/{id}/complete`.

```typescript
// KEEP — real endpoints:
getShifts:           query: () => '/api/shifts'
createShift:         url: '/api/shifts', method: 'POST'
bulkCreateShifts:    url: '/api/shifts/bulk', method: 'POST'         // was /shifts/bulk-create
copyWeekSchedule:    url: '/api/shifts/copy-week?...', method: 'POST' // was /shifts/copy-previous-week
getShiftById:        query: (id) => `/api/shifts/${id}`
updateShift:         url: `/api/shifts/${id}`, method: 'PATCH'
deleteShift:         url: `/api/shifts/${id}`, method: 'DELETE'
confirmShift:        url: `/api/shifts/${id}/confirm`, method: 'POST'
startShift:          url: `/api/shifts/${id}/start`, method: 'POST'
completeShift:       url: `/api/shifts/${id}/complete`, method: 'POST'

// REMOVE — these endpoints do NOT exist in ShiftController:
// getEmployeeCurrentShift → no /api/shifts/employee/:id/current
// getStoreWeekShifts      → no /api/shifts/store/:id/week
// getShiftCoverage (separate mutation) → use GET /api/shifts?view=coverage instead
//   ShiftController comment: "Replaces: /api/shifts/store/coverage"
```

- [ ] **Step 6: Fix driverApi.ts — multiple broken URLs, stale endpoints**

`driverApi.ts` has `baseUrl: API_CONFIG.USER_SERVICE_URL` (= gateway root). Fix all URLs:

```typescript
// getAllDrivers: no /users/drivers/store endpoint
// → change to GET /api/users?type=DRIVER (query param on UserController)
query: (storeId) => `/api/users?type=DRIVER${storeId ? `&storeId=${storeId}` : ''}`

// getDriverById: /users/${id} → correct base but missing /api/
query: (id) => `/api/users/${id}`

// getDriverByUserId: /users/${userId} → same fix
query: (userId) => `/api/users/${userId}`

// getOnlineDrivers: /users/type/DRIVER?... → no /users/type/:type sub-path
// → change to query params on GET /api/users
query: (storeId) => `/api/users?type=DRIVER&available=true${storeId ? `&storeId=${storeId}` : ''}`

// getAvailableDrivers: /users/type/DRIVER?... → same fix
query: (storeId) => `/api/users?type=DRIVER&available=true${storeId ? `&storeId=${storeId}` : ''}`

// updateDriver: /users/${id} → just add /api/
url: `/api/users/${id}`, method: 'PATCH'

// updateDriverLocation: FIXED
url: '/api/delivery/location', method: 'POST'

// getDriverPerformance: /delivery/driver/${id}/performance — VERIFIED real endpoint
query: (driverId) => `/api/delivery/driver/${driverId}/performance`

// getDriverPerformanceToday: /delivery/driver/${id}/performance/today — DOES NOT EXIST
// → REMOVE this method or fold into getDriverPerformance

// getDriverStats: /users/stats — DOES NOT EXIST in UserController
// → REMOVE this method

// activateDriver: /users/${id}/activate — VERIFIED (UserController POST /{userId}/activate)
url: `/api/users/${id}/activate`, method: 'POST'

// deactivateDriver: /users/${id}/deactivate — VERIFIED
url: `/api/users/${id}/deactivate`, method: 'POST'

// getDriverStatus: /users/${driverId}/status — VERIFIED (UserController GET /{userId}/status)
query: (driverId) => `/api/users/${driverId}/status`

// updateDriverStatus: /users/${driverId}/status — VERIFIED (UserController PATCH /{userId}/status)
url: `/api/users/${driverId}/status`, method: 'PATCH'
```

- [ ] **Step 7: Fix inventoryApi.ts — change baseUrl, fix all URL groups, remove stale methods**

Change `baseUrl` from `${API_CONFIG.API_GATEWAY_URL}/inventory` to `API_CONFIG.BASE_URL`.

Then fix URLs based on verified controller endpoints:

```typescript
// Inventory items — KEEP:
url: '/api/inventory'                        // was '/items' (list with query params)
url: '/api/inventory'         POST           // was '/items' create
url: `/api/inventory/${id}`                  // was `/items/${id}`
url: `/api/inventory/${id}`   PATCH          // was `/items/${id}`
url: `/api/inventory/${id}`   DELETE         // was `/items/${id}`
url: `/api/inventory/${id}/stock`            // was `/items/${id}/adjust` — backend uses single /stock endpoint

// Inventory items — REMOVE (no backend endpoint):
// url: `/items/${id}/adjust`    → use /stock with body {operation: 'ADJUST'}
// url: `/items/${id}/reserve`   → use /stock with body {operation: 'RESERVE'}
// url: `/items/${id}/release`   → use /stock with body {operation: 'RELEASE'}
// url: `/items/${id}/consume`   → use /stock with body {operation: 'CONSUME'}

// Suppliers — KEEP (verified):
url: '/api/suppliers'
url: '/api/suppliers'         POST
url: `/api/suppliers/${id}`
url: `/api/suppliers/${id}`   PATCH
url: `/api/suppliers/${id}`   DELETE
url: '/api/suppliers/compare'

// Suppliers — REMOVE:
// url: `/suppliers/${id}/status`       → no such endpoint
// url: `/suppliers/${id}/preferred`    → no such endpoint
// url: `/suppliers/${id}/performance`  → no such endpoint

// Purchase Orders — KEEP (verified):
url: '/api/purchase-orders'
url: '/api/purchase-orders'       POST
url: `/api/purchase-orders/${id}`
url: `/api/purchase-orders/${id}` PATCH
url: `/api/purchase-orders/${id}` DELETE
url: '/api/purchase-orders/auto-generate'

// Purchase Orders — REMOVE:
// url: `/purchase-orders/${id}/approve` → no such endpoint in PurchaseOrderController
// url: `/purchase-orders/${id}/reject`  → no such endpoint
// url: `/purchase-orders/${id}/send`    → no such endpoint
// url: `/purchase-orders/${id}/receive` → no such endpoint
// url: `/purchase-orders/${id}/cancel`  → no such endpoint

// Waste — KEEP but fix paths (WasteController verified at /api/waste):
url: '/api/waste'                          // GET list + POST create
url: `/api/waste/${id}`                    // GET, PATCH, DELETE
url: '/api/waste/analytics'               // GET analytics (was /waste/trend — wrong)
```

- [ ] **Step 8: Verify TypeScript compiles with no errors**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 9: Run unit tests for affected API slices**

```bash
cd frontend && npm run test:run -- src/store/api/ --reporter=verbose 2>&1 | tail -20
```

Expected: all existing API slice tests pass.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/store/api/
git commit -m "fix(frontend): correct RTK Query slice URLs to match canonical backend paths — authApi, sessionApi, equipmentApi, orderApi, shiftApi, driverApi, inventoryApi"
```

---

### Task 3: Rewrite All Broken Pact Consumer Tests

**Context:** All 7 Pact consumer files are broken:
- `order.pact.test.ts` — imports `{ Pact, Matchers }` from `@pact-foundation/pact`. In v16, `Pact` is NOT a top-level export (it's exported as `PactV2`). This file will fail at import. Must rewrite.
- `order-service.pact.test.ts` — uses `jest-pact` (not installed). Delete.
- 5 other files — all use `jest-pact` (not installed). Rewrite.

**Correct API for `@pact-foundation/pact` v16.0.4:**
- Class: `PactV4` from `@pact-foundation/pact` (verified via `node_modules/@pact-foundation/pact/src/v4/index.d.ts`)
- `withRequest(method: string, path: string, builderFn?: fn)` — string-based signature
- `willRespondWith(status: number, builderFn?: fn)` — builder configures body/headers
- `executeTest(async (mockServer) => { ... })` — all assertions inside

**Provider name convention:** Use the actual service names that match the backend Pact provider verification tests: `commerce-service`, `payment-service`, `core-service`, `logistics-service`.

**Files:**
- Rewrite: `order.pact.test.ts` (from broken v2 API to PactV4)
- Delete: `order-service.pact.test.ts`
- Rewrite: `menu-service.pact.test.ts`
- Rewrite: `payment-service.pact.test.ts`
- Rewrite: `user-service.pact.test.ts`
- Rewrite: `delivery-service.pact.test.ts`
- Rewrite: `customer-service.pact.test.ts`

- [ ] **Step 1: Delete the broken order-service.pact.test.ts**

```bash
rm frontend/src/pact/consumers/order-service.pact.test.ts
```

- [ ] **Step 2: Rewrite order.pact.test.ts using PactV4**

The old file uses `new Pact({...})` + `beforeAll/afterAll` lifecycle — deprecated and broken in v16. Rewrite completely:

```typescript
import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'commerce-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Commerce Service (Orders) Pact', () => {
  describe('GET /api/orders/:orderId', () => {
    it('returns the order successfully', async () => {
      await provider
        .addInteraction()
        .given('order exists with id order-pact-1')
        .uponReceiving('a request to get order by ID')
        .withRequest('GET', '/api/orders/order-pact-1')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            id: string('order-pact-1'),
            orderNumber: string('ORD-20250101-001'),
            customerName: string('Test Customer'),
            storeId: string('store-1'),
            items: eachLike({ menuItemId: string('item-1'), name: string('Pizza'), quantity: like(1), price: like(299) }),
            total: like(299),
            status: string('RECEIVED'),
            orderType: string('DELIVERY'),
            paymentStatus: string('PENDING'),
            createdAt: string('2025-01-15T10:30:00Z'),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/orders/order-pact-1`);
          expect(response.status).toBe(200);
          const order = await response.json();
          expect(order).toHaveProperty('id');
          expect(order).toHaveProperty('status');
          expect(Array.isArray(order.items)).toBe(true);
        });
    });
  });

  describe('POST /api/orders', () => {
    it('creates a new order successfully', async () => {
      await provider
        .addInteraction()
        .given('store exists with id store-1')
        .uponReceiving('a request to create a new order')
        .withRequest('POST', '/api/orders', (builder) => {
          builder.jsonBody({
            storeId: string('store-1'),
            customerName: string('Test Customer'),
            items: eachLike({ menuItemId: string('item-1'), name: string('Pizza'), quantity: like(1), price: like(299) }),
            orderType: string('DELIVERY'),
          });
        })
        .willRespondWith(201, (builder) => {
          builder.jsonBody(like({
            id: string('order-pact-new'),
            orderNumber: string('ORD-20250101-002'),
            customerName: string('Test Customer'),
            status: string('RECEIVED'),
            total: like(299),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storeId: 'store-1',
              customerName: 'Test Customer',
              items: [{ menuItemId: 'item-1', name: 'Pizza', quantity: 1, price: 299 }],
              orderType: 'DELIVERY',
            }),
          });
          expect(response.status).toBe(201);
          const order = await response.json();
          expect(order).toHaveProperty('id');
          expect(order.status).toBe('RECEIVED');
        });
    });
  });

  describe('POST /api/orders/:orderId/status', () => {
    it('updates order status successfully', async () => {
      await provider
        .addInteraction()
        .given('order exists with id order-pact-1')
        .uponReceiving('a request to update order status to PREPARING')
        .withRequest('POST', '/api/orders/order-pact-1/status', (builder) => {
          builder.jsonBody({ status: string('PREPARING') });
        })
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            id: string('order-pact-1'),
            status: string('PREPARING'),
            updatedAt: string('2025-01-15T11:00:00Z'),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/orders/order-pact-1/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PREPARING' }),
          });
          expect(response.status).toBe(200);
          const order = await response.json();
          expect(order.status).toBe('PREPARING');
        });
    });
  });
});
```

- [ ] **Step 3: Rewrite menu-service.pact.test.ts**

Use verified `MenuController` endpoints: `GET /api/menu` (list — no `/public` sub-path), `GET /api/menu/{id}`, `PATCH /api/menu/items/{id}/allergens`.

```typescript
import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'commerce-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Commerce Service (Menu) Pact', () => {
  describe('GET /api/menu', () => {
    it('returns list of menu items', async () => {
      await provider
        .addInteraction()
        .given('menu items exist')
        .uponReceiving('a request to get all menu items')
        .withRequest('GET', '/api/menu')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(eachLike({
            id: string('menu-1'),
            name: string('Margherita Pizza'),
            basePrice: like(29900),
            isAvailable: like(true),
            allergensDeclared: like(true),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/menu`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
          expect(data[0]).toHaveProperty('id');
          expect(data[0]).toHaveProperty('name');
        });
    });
  });

  describe('GET /api/menu/:id', () => {
    it('returns a single menu item by id', async () => {
      await provider
        .addInteraction()
        .given('menu item exists with id menu-pact-1')
        .uponReceiving('a request to get menu item by id')
        .withRequest('GET', '/api/menu/menu-pact-1')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            id: string('menu-pact-1'),
            name: string('Margherita Pizza'),
            basePrice: like(29900),
            isAvailable: like(true),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/menu/menu-pact-1`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.id).toBe('menu-pact-1');
        });
    });
  });

  describe('PATCH /api/menu/items/:id/allergens', () => {
    it('declares allergens for a menu item', async () => {
      await provider
        .addInteraction()
        .given('menu item exists with id menu-pact-1')
        .uponReceiving('a request to declare allergens')
        .withRequest('PATCH', '/api/menu/items/menu-pact-1/allergens', (builder) => {
          builder.jsonBody({
            allergens: like(['MILK', 'GLUTEN']),
            allergenFree: like(false),
          });
        })
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            id: string('menu-pact-1'),
            allergensDeclared: like(true),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/api/menu/items/menu-pact-1/allergens`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ allergens: ['MILK', 'GLUTEN'], allergenFree: false }),
            }
          );
          expect(response.status).toBe(200);
        });
    });
  });
});
```

- [ ] **Step 4: Rewrite payment-service.pact.test.ts**

```typescript
import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'payment-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Payment Service Pact', () => {
  describe('POST /api/payments/initiate', () => {
    it('initiates a payment and returns razorpay order details', async () => {
      await provider
        .addInteraction()
        .given('payment service is available')
        .uponReceiving('a request to initiate payment')
        .withRequest('POST', '/api/payments/initiate', (builder) => {
          builder.jsonBody({
            orderId: string('order-1'),
            amount: like(500.00),
            customerId: string('cust-1'),
            customerEmail: string('test@masova.com'),
            storeId: string('store-1'),
            orderType: string('TAKEAWAY'),
            paymentMethod: string('CARD'),
          });
        })
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            transactionId: string('txn-1'),
            razorpayOrderId: string('order_razorpay_1'),
            razorpayKeyId: string('rzp_test_key'),
            amount: like(500.00),
            status: string('INITIATED'),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/payments/initiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: 'order-1', amount: 500.00, customerId: 'cust-1',
              customerEmail: 'test@masova.com', storeId: 'store-1',
              orderType: 'TAKEAWAY', paymentMethod: 'CARD',
            }),
          });
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty('transactionId');
          expect(data).toHaveProperty('razorpayOrderId');
        });
    });
  });

  describe('POST /api/payments/verify', () => {
    it('verifies a payment and returns SUCCESS status', async () => {
      await provider
        .addInteraction()
        .given('payment transaction exists with id txn-1')
        .uponReceiving('a request to verify payment')
        .withRequest('POST', '/api/payments/verify', (builder) => {
          builder.jsonBody({
            razorpayOrderId: string('order_razorpay_1'),
            razorpayPaymentId: string('pay_razorpay_1'),
            razorpaySignature: string('valid_signature'),
          });
        })
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            transactionId: string('txn-1'),
            status: string('SUCCESS'),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: 'order_razorpay_1',
              razorpayPaymentId: 'pay_razorpay_1',
              razorpaySignature: 'valid_signature',
            }),
          });
          expect(response.status).toBe(200);
        });
    });
  });
});
```

- [ ] **Step 5: Rewrite user-service.pact.test.ts (maps to core-service)**

```typescript
import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'core-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Core Service (Users/Auth) Pact', () => {
  describe('POST /api/auth/login', () => {
    it('returns access token on valid credentials', async () => {
      await provider
        .addInteraction()
        .given('user exists with email test@masova.com')
        .uponReceiving('a login request with valid credentials')
        .withRequest('POST', '/api/auth/login', (builder) => {
          builder.jsonBody({
            email: string('test@masova.com'),
            password: string('Test1234!'),
          });
        })
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            accessToken: string('access.token.value'),
            refreshToken: string('refresh.token.value'),
            user: like({
              id: string('user-1'),
              email: string('test@masova.com'),
              type: string('CUSTOMER'),
            }),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@masova.com', password: 'Test1234!' }),
          });
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty('accessToken');
          expect(data).toHaveProperty('user');
        });
    });
  });

  describe('GET /api/stores', () => {
    it('returns list of stores', async () => {
      await provider
        .addInteraction()
        .given('stores exist')
        .uponReceiving('a request to list stores')
        .withRequest('GET', '/api/stores')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(eachLike({
            id: string('store-1'),
            name: string('MaSoVa Mumbai'),
            code: string('MUM001'),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/stores`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
        });
    });
  });
});
```

- [ ] **Step 6: Rewrite delivery-service.pact.test.ts (maps to logistics-service)**

Use only verified `DeliveryController` endpoints: `GET /api/delivery/track/{id}` and `GET /api/delivery/drivers/available` (both confirmed real).

```typescript
import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'logistics-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Logistics Service (Delivery) Pact', () => {
  describe('GET /api/delivery/track/:orderId', () => {
    it('returns tracking information for an order', async () => {
      await provider
        .addInteraction()
        .given('delivery tracking exists for order order-track-1')
        .uponReceiving('a request to track delivery')
        .withRequest('GET', '/api/delivery/track/order-track-1')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            orderId: string('order-track-1'),
            status: string('IN_TRANSIT'),
            driverName: string('Rajesh Driver'),
            estimatedMinutes: like(15),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/delivery/track/order-track-1`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty('status');
          expect(data).toHaveProperty('orderId');
        });
    });
  });

  describe('GET /api/delivery/drivers/available', () => {
    it('returns list of available drivers', async () => {
      await provider
        .addInteraction()
        .given('drivers are available')
        .uponReceiving('a request to get available drivers')
        .withRequest('GET', '/api/delivery/drivers/available')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(eachLike({
            id: string('driver-1'),
            name: string('Rajesh Kumar'),
            status: string('AVAILABLE'),
            rating: like(4.8),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/delivery/drivers/available`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
        });
    });
  });
});
```

- [ ] **Step 7: Rewrite customer-service.pact.test.ts (maps to core-service)**

```typescript
import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'core-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Core Service (Customers) Pact', () => {
  describe('GET /api/customers/:id', () => {
    it('returns customer by id', async () => {
      await provider
        .addInteraction()
        .given('customer exists with id cust-pact-1')
        .uponReceiving('a request to get customer by id')
        .withRequest('GET', '/api/customers/cust-pact-1')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            id: string('cust-pact-1'),
            email: string('customer@masova.com'),
            loyaltyInfo: like({ totalPoints: like(100), tier: string('SILVER') }),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/customers/cust-pact-1`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.id).toBe('cust-pact-1');
        });
    });
  });

  describe('GET /api/customers', () => {
    it('returns list of customers', async () => {
      await provider
        .addInteraction()
        .given('customers exist')
        .uponReceiving('a request to list customers')
        .withRequest('GET', '/api/customers')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(eachLike({
            id: string('cust-1'),
            email: string('customer@masova.com'),
            active: like(true),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/customers`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
        });
    });
  });
});
```

- [ ] **Step 8: Run Pact consumer tests to verify they generate pact files**

```bash
cd frontend && npm run test:pact 2>&1 | tail -20
```

Expected: tests pass and `frontend/pacts/*.json` files are created.

- [ ] **Step 9: Verify pact files exist and have correct provider names**

```bash
ls frontend/pacts/
```

Expected: JSON files named like `masova-frontend-commerce-service.json`, `masova-frontend-payment-service.json`, `masova-frontend-core-service.json`, `masova-frontend-logistics-service.json`.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/pact/consumers/ frontend/pacts/
git commit -m "fix(frontend/pact): rewrite all 7 Pact consumer tests using PactV4 from @pact-foundation/pact v16 — replaces broken Pact-v2 and jest-pact imports"
```

---

### Task 4: Add RTK Query Cache Reset to Test Setup

**Context:** RTK Query caches responses in the Redux store. Without resetting the cache between tests, one test's data bleeds into the next. The correct approach per Redux docs: create a fresh store per test rather than dispatching `resetApiState` on a shared store.

**Files:**
- Modify: `frontend/src/test/utils/testUtils.tsx`

- [ ] **Step 1: Verify renderWithProviders creates a fresh store per call**

Read `frontend/src/test/utils/testUtils.tsx`. Check if `renderWithProviders` already creates a new store per render (via `store = createTestStore(preloadedState)` as default arg). If so, no change needed — just confirm.

If it uses a module-level shared store, update the default parameter to create a fresh store each call:

```typescript
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),  // fresh store each call — no shared state
    ...renderOptions
  }: RenderWithProvidersOptions = {}
) {
  // ...
}
```

- [ ] **Step 2: Verify no state leakage between tests**

```bash
cd frontend && npm run test:run -- src/store/api/orderApi.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all tests pass with no cache-related failures.

- [ ] **Step 3: Commit (only if changes were made)**

```bash
git add frontend/src/test/utils/testUtils.tsx
git commit -m "fix(frontend/test): ensure fresh Redux store per test to prevent RTK Query cache leakage between tests"
```

---

## Verification Checklist

- [ ] `npm run test:run` completes without `JS heap out of memory` error
- [ ] `grep -rn "http\.\(get\|post\|put\|patch\|delete\).*\`\${API}/[^a]" frontend/src/test/mocks/handlers/` — returns nothing (all handlers have `/api/` prefix)
- [ ] `cd frontend && npm run test:run -- src/store/api/` — all API slice tests pass
- [ ] `cd frontend && npm run test:pact` — passes and generates pact JSON files in `frontend/pacts/`
- [ ] `ls frontend/pacts/` — shows JSON files with correct provider names (`commerce-service`, `core-service`, `payment-service`, `logistics-service`)
- [ ] `cd frontend && npx tsc --noEmit` — no TypeScript errors
- [ ] `grep -r "api/v1" frontend/src/store/api/` — returns nothing (no stale v1 paths)
- [ ] `grep -r "jest-pact" frontend/src/pact/` — returns nothing
- [ ] `grep -r "import.*Pact.*from.*@pact-foundation/pact" frontend/src/pact/` — all imports use `PactV4`
- [ ] `grep -r "kitchen-equipment" frontend/src/store/api/` — returns nothing
- [ ] `grep -r "/users/login\|/users/register\|/users/logout" frontend/src/store/api/` — returns nothing
- [ ] `grep -r "users/sessions\|/users/auth/google" frontend/src/store/api/` — returns nothing
- [ ] `grep -r "bulk-create\|copy-previous-week" frontend/src/store/api/` — returns nothing
- [ ] `grep -r "location-update\|auto-dispatch\|route-optimize" frontend/src/store/api/\|frontend/src/test/` — returns nothing
- [ ] `grep -r "/responses/review\|/responses/templates" frontend/src/test/` — returns nothing (moved to `/api/reviews/{id}/response` and `/api/reviews/response-templates`)
- [ ] `grep -r "users/profile\|users/type/\|users/store\|users/managers\|users/stats" frontend/src/test/` — returns nothing
