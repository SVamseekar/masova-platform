# Frontend Test Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all confirmed frontend test infrastructure bugs — MSW handler `/api/` prefix, RTK Query slice URL mismatches, broken Pact consumer files — and stabilise the Vitest runner (OOM fix) so all subsequent test writing has a correct foundation.

**Architecture:** Tests co-located next to source files. MSW handlers intercept at full absolute URL including `/api/` prefix (MSW v2 in Node/jsdom requires absolute URLs — relative paths are unreliable). RTK Query slices use canonical paths matching the backend endpoint map. Pact consumer tests use `@pact-foundation/pact` v16 `PactV4` class (HTTP/1-style interactions — the `PactV4` class in pact-js v16 uses `withRequest(method, path, builderFn)` string signature, confirmed by the installed package's type definitions). Vitest coverage thresholds raised to 80%.

**Prerequisite:** Plan 0 (deployment blockers) must be complete.

**Tech Stack:** Vitest 1.6.x, React Testing Library 16.x, MSW 2.x, @pact-foundation/pact 16.0.4

---

## Research-Validated Corrections (applied to this plan)

The following issues were found by auditing the actual codebase AND reading every backend `@RequestMapping`/`@GetMapping`/`@PostMapping` annotation directly from the Java controllers:

### Handler files — three already correct, do NOT touch:
1. **`analyticsHandlers.ts` already correct** — already uses `${API}/api/analytics/...`. Verify only.
2. **`customerHandlers.ts` already correct** — already uses `${API}/api/customers/...`. Verify only.
3. **`notificationHandlers.ts` already correct** — already uses `${API}/api/notifications/...`. Verify only.

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
| `frontend/src/test/mocks/handlers/authHandlers.ts` | Fix to `/api/auth/` paths; `/api/users/profile` for profile |
| `frontend/src/test/mocks/handlers/menuHandlers.ts` | Fix: collapse `/menu/public/*` into `GET /api/menu` with query params; fix item paths |
| `frontend/src/test/mocks/handlers/userHandlers.ts` | Fix `/api/users/` prefix; `/api/auth/validate-pin` for pin validation |
| `frontend/src/test/mocks/handlers/deliveryHandlers.ts` | Fix prefix + rename `auto-dispatch→dispatch`, `route-optimize→route`; remove non-existent sub-paths |
| `frontend/src/test/mocks/handlers/customerHandlers.ts` | **Already correct** — verify only, no changes needed |
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
http.get(`${API}/users/profile`, ...)

// AFTER
http.post(`${API}/api/auth/login`, ...)
http.post(`${API}/api/auth/register`, ...)
http.post(`${API}/api/auth/refresh`, ...)      // canonical: /api/auth/refresh
http.post(`${API}/api/auth/logout`, ...)
http.get(`${API}/api/users/profile`, ...)
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
// All waste handlers — no WasteController found in backend
```

Note: The handler file currently has a `waste` section. Search for `WasteController.java` in the codebase — if no waste controller exists, remove all waste handlers.

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

- [ ] **Step 9: Fix userHandlers.ts — add /api/ prefix**

```typescript
// BEFORE → AFTER
`${API}/users/profile`                    → `${API}/api/users/profile`
`${API}/users/change-password`            → `${API}/api/users/change-password`
`${API}/users/:userId`                    → `${API}/api/users/:userId`
`${API}/users/type/:type`                 → `${API}/api/users/type/:type`
`${API}/users/store`                      → `${API}/api/users/store`
`${API}/users/managers`                   → `${API}/api/users/managers`
`${API}/users`                            → `${API}/api/users`
`${API}/users/create`                     → `${API}/api/users/create`
`${API}/users/validate-pin`               → `${API}/api/auth/validate-pin`  // canonical path
`${API}/users/search`                     → `${API}/api/users/search`
`${API}/users/stats`                      → `${API}/api/users/stats`
```

- [ ] **Step 10: Fix reviewHandlers.ts — add /api/ prefix**

```typescript
// BEFORE → AFTER (apply to all routes)
`${API}/reviews`                          → `${API}/api/reviews`
`${API}/reviews/:reviewId`                → `${API}/api/reviews/:reviewId`
`${API}/reviews/order/:orderId`           → `${API}/api/reviews/order/:orderId`
`${API}/reviews/customer/:customerId`     → `${API}/api/reviews/customer/:customerId`
// etc.
`${API}/responses/review/:reviewId`       → `${API}/api/responses/review/:reviewId`
`${API}/responses/templates`              → `${API}/api/responses/templates`
```

- [ ] **Step 11: Verify customerHandlers.ts and notificationHandlers.ts are already correct**

```bash
grep -c "api/" frontend/src/test/mocks/handlers/customerHandlers.ts
grep -c "api/" frontend/src/test/mocks/handlers/notificationHandlers.ts
```

Expected: large numbers — these files are already correct.

- [ ] **Step 12: Run grep to verify no handlers remain without /api/ prefix**

```bash
grep -rn "http\.\(get\|post\|put\|patch\|delete\).*\`\${API}/[^a]" frontend/src/test/mocks/handlers/
```

Expected: zero matches. Every handler should now have `/api/` after the base URL.

- [ ] **Step 13: Commit**

```bash
git add frontend/src/test/mocks/handlers/
git commit -m "fix(frontend/test): add /api/ prefix to all MSW handlers to match actual backend routes"
```

---

### Task 2: Fix RTK Query Slice URL Mismatches

**Context:** 7 confirmed mismatches between what RTK Query slices call and what the backend serves. Each needs a targeted fix in the slice file. No test changes — fixing the slices fixes both the app and the tests simultaneously.

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
query: () => '/users/profile',
url: '/users/auth/google',
url: '/users/auth/google/register',

// AFTER
url: '/api/auth/login',
url: '/api/auth/register',
url: '/api/auth/refresh',
url: '/api/auth/logout',
query: () => '/api/users/profile',     // profile is on UserController not AuthController
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

```typescript
// BEFORE → AFTER (representative — apply to ALL occurrences)
query: `...`  `/orders` (any form)      → `/api/orders` (same form)
query: `/orders/${orderId}`              → `/api/orders/${orderId}`
query: `/orders/track/${orderId}`        → `/api/orders/track/${orderId}`
query: `/orders/kitchen...`             → `/api/orders/kitchen...`
query: `/orders/status/${status}`       → `/api/orders/status/${status}`
url: '/orders',                         → url: '/api/orders',
url: `/orders/${orderId}/status`,        → url: `/api/orders/${orderId}/status`,
method: 'PATCH',                        → method: 'POST',   // ← status transition is POST
url: `/orders/${orderId}...` (delete)   → url: `/api/orders/${orderId}...`
url: `/orders/${orderId}/next-stage`    → url: `/api/orders/${orderId}/next-stage`
url: `/orders/${orderId}/assign-driver` → url: `/api/orders/${orderId}/assign-driver`
url: `/orders/${orderId}/payment`       → url: `/api/orders/${orderId}/payment`
url: `/orders/${orderId}/items`         → url: `/api/orders/${orderId}/items`
url: `/orders/${orderId}/priority`      → url: `/api/orders/${orderId}/priority`
// etc. — apply /api/ prefix to every single URL in this file
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
// getShiftCoverage        → (verify if this exists — if not, remove)
```

- [ ] **Step 6: Fix driverApi.ts — /api/delivery/location not /delivery/location-update**

In `frontend/src/store/api/driverApi.ts`, find `updateDriverLocation` mutation:

```typescript
// BEFORE
url: '/delivery/location-update',

// AFTER
url: '/api/delivery/location',
```

Also check all other driverApi URLs for missing `/api/` prefix and add it.

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

// Waste — REMOVE entirely:
// Search backend for WasteController.java — if not found, delete all waste methods from inventoryApi.ts
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
