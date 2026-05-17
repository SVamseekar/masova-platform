# Frontend Test Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all confirmed frontend test infrastructure bugs — MSW handler `/api/` prefix, RTK Query slice URL mismatches, broken Pact consumer files — and stabilise the Vitest runner (OOM fix) so all subsequent test writing has a correct foundation.

**Architecture:** Tests co-located next to source files. MSW handlers intercept at full absolute URL including `/api/` prefix (MSW v2 in Node/jsdom requires absolute URLs — relative paths are unreliable). RTK Query slices use canonical paths matching the backend endpoint map. Pact consumer tests use `@pact-foundation/pact` v16 `PactV4` class (HTTP/1-style interactions — the `PactV4` class in pact-js v16 uses `withRequest(method, path, builderFn)` string signature, confirmed by the installed package's type definitions). Vitest coverage thresholds raised to 80%.

**Prerequisite:** Plan 0 (deployment blockers) must be complete.

**Tech Stack:** Vitest 1.6.x, React Testing Library 16.x, MSW 2.x, @pact-foundation/pact 16.0.4

---

## Research-Validated Corrections (applied to this plan)

The following issues were found by auditing the actual codebase against the plan:

1. **`analyticsHandlers.ts` already correct** — already uses `${API}/api/analytics/...`. Do NOT change it, only verify.
2. **`customerHandlers.ts` already correct** — already uses `${API}/api/customers/...`. Do NOT change it, only verify.
3. **`notificationHandlers.ts` already correct** — already uses `${API}/api/notifications/...`. Do NOT change it, only verify.
4. **`inventoryHandlers.ts`** — `${API}/inventory/items` needs to become `${API}/api/inventory`. The canonical path is `/api/inventory` (not `/api/inventory/items`). Suppliers = `/api/suppliers`. Purchase orders = `/api/purchase-orders`.
5. **`inventoryApi.ts`** — `baseUrl = ${API_CONFIG.API_GATEWAY_URL}/inventory`. All endpoint URLs like `/items` resolve to `gateway/inventory/items`. Fix: change `baseUrl` to `API_CONFIG.BASE_URL` and prefix all URLs with `/api/inventory`, `/api/suppliers`, `/api/purchase-orders`.
6. **`orderApi.ts`** — `baseUrl = API_CONFIG.ORDER_SERVICE_URL` (= gateway root). All URLs like `/orders/...` resolve to `gateway/orders/...`. Fix: add `/api/` prefix to all order URLs AND change `updateOrderStatus` to POST.
7. **`order.pact.test.ts` is BROKEN** — it imports `{ Pact, Matchers }` from `@pact-foundation/pact`. In v16, there is no bare `Pact` export (it's exported as `PactV2`). This file must be rewritten as `PactV4`, not kept.
8. **OOM crash** — tests hit `JS heap out of memory`. Fix: add `pool: 'forks'` + `maxWorkers` to vitest.config.ts. Must be done BEFORE raising coverage thresholds.
9. **`coverage.include` missing** — add explicit `include: ['src/**/*.{ts,tsx}']` so coverage only counts source files, not test utilities.

---

## File Map

| File | Change |
|------|--------|
| `frontend/src/test/mocks/handlers/orderHandlers.ts` | Fix `/api/` prefix on all URLs |
| `frontend/src/test/mocks/handlers/paymentHandlers.ts` | Fix `/api/` prefix |
| `frontend/src/test/mocks/handlers/authHandlers.ts` | Fix `/api/auth/` paths (not `/users/`) |
| `frontend/src/test/mocks/handlers/menuHandlers.ts` | Fix `/api/menu/` prefix |
| `frontend/src/test/mocks/handlers/userHandlers.ts` | Fix `/api/users/` prefix |
| `frontend/src/test/mocks/handlers/deliveryHandlers.ts` | Fix `/api/delivery/` prefix + `location` not `location-update` |
| `frontend/src/test/mocks/handlers/customerHandlers.ts` | **Already correct** — verify only, no changes needed |
| `frontend/src/test/mocks/handlers/inventoryHandlers.ts` | Fix to `/api/inventory`, `/api/suppliers`, `/api/purchase-orders` |
| `frontend/src/test/mocks/handlers/notificationHandlers.ts` | **Already correct** — verify only, no changes needed |
| `frontend/src/test/mocks/handlers/sessionHandlers.ts` | Fix ALL routes: `/api/sessions` (not `/users/sessions`) |
| `frontend/src/test/mocks/handlers/analyticsHandlers.ts` | **Already correct** — verify only, no changes needed |
| `frontend/src/test/mocks/handlers/reviewHandlers.ts` | Fix `/api/reviews/` prefix |
| `frontend/src/store/api/authApi.ts` | Fix paths: `/api/auth/login` not `/users/login` |
| `frontend/src/store/api/sessionApi.ts` | Fix paths: `/api/sessions` not `/users/sessions` |
| `frontend/src/store/api/equipmentApi.ts` | Fix paths: `/api/equipment` not `/kitchen-equipment` |
| `frontend/src/store/api/orderApi.ts` | Add `/api/` prefix to ALL order URLs + change `updateOrderStatus` to POST |
| `frontend/src/store/api/shiftApi.ts` | Fix `/api/shifts/bulk` not `/shifts/bulk-create`; add `/api/` to all paths |
| `frontend/src/store/api/driverApi.ts` | Fix `/api/delivery/location` not `/delivery/location-update` |
| `frontend/src/store/api/inventoryApi.ts` | Change baseUrl to BASE_URL; fix all URLs to `/api/inventory`, `/api/suppliers`, `/api/purchase-orders` |
| `frontend/src/pact/consumers/order.pact.test.ts` | Rewrite — imports broken `Pact` (v2 class) — rewrite as `PactV4` |
| `frontend/src/pact/consumers/order-service.pact.test.ts` | Delete — replaced by rewritten `order.pact.test.ts` |
| `frontend/src/pact/consumers/menu-service.pact.test.ts` | Rewrite using `PactV4` |
| `frontend/src/pact/consumers/payment-service.pact.test.ts` | Rewrite using `PactV4` |
| `frontend/src/pact/consumers/user-service.pact.test.ts` | Rewrite using `PactV4` |
| `frontend/src/pact/consumers/delivery-service.pact.test.ts` | Rewrite using `PactV4` |
| `frontend/src/pact/consumers/customer-service.pact.test.ts` | Rewrite using `PactV4` |
| `frontend/vitest.config.ts` | Add OOM fix (pool + maxWorkers + include); raise coverage thresholds to 80% |

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

- [ ] **Step 1: Fix orderHandlers.ts**

Open `frontend/src/test/mocks/handlers/orderHandlers.ts`. Change every URL from `${API}/orders/...` to `${API}/api/orders/...`. Also fix the one PATCH status handler — the canonical backend method is POST not PATCH for status transitions:

```typescript
// BEFORE
http.get(`${API}/orders`, ...)
http.get(`${API}/orders/:orderId`, ...)
http.get(`${API}/orders/track/:orderId`, ...)
http.get(`${API}/orders/kitchen`, ...)
http.get(`${API}/orders/status/:status`, ...)
http.post(`${API}/orders`, ...)
http.patch(`${API}/orders/:orderId/status`, ...)    // ← also wrong method
http.delete(`${API}/orders/:orderId`, ...)
// ... all other routes

// AFTER
http.get(`${API}/api/orders`, ...)
http.get(`${API}/api/orders/:orderId`, ...)
http.get(`${API}/api/orders/track/:orderId`, ...)
http.get(`${API}/api/orders/kitchen`, ...)
http.get(`${API}/api/orders/status/:status`, ...)
http.post(`${API}/api/orders`, ...)
http.post(`${API}/api/orders/:orderId/status`, ...) // POST not PATCH
http.delete(`${API}/api/orders/:orderId`, ...)
// ... apply /api/ to all other routes
```

Apply the same `/api/` insertion to every route in the file.

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

- [ ] **Step 3: Fix sessionHandlers.ts — ALL routes: /api/sessions not /users/sessions**

The current file has 14 handlers all on `/users/sessions/...`. Every single route needs to change. Canonical paths per the endpoint map:

```typescript
// BEFORE → AFTER mapping
`${API}/users/sessions/current`           → `${API}/api/sessions/current`
`${API}/users/sessions/start`             → `${API}/api/sessions`          // POST to start
`${API}/users/sessions/end`               → `${API}/api/sessions/end`
`${API}/users/sessions/:employeeId/break` → `${API}/api/sessions/:sessionId/break`
`${API}/users/sessions/store/active`      → `${API}/api/sessions/store/active`
`${API}/users/sessions/store`             → `${API}/api/sessions/store`
`${API}/users/sessions/:employeeId`       → `${API}/api/sessions/:employeeId`
`${API}/users/sessions/pending-approval`  → `${API}/api/sessions/pending`
`${API}/users/sessions/:sessionId/approve`→ `${API}/api/sessions/:sessionId/approve`
`${API}/users/sessions/:sessionId/reject` → `${API}/api/sessions/:sessionId/reject`
`${API}/users/sessions/clock-in-with-pin` → `${API}/api/sessions/clock-in`
`${API}/users/sessions/clock-out-employee`→ `${API}/api/sessions/clock-out`
`${API}/users/sessions/:employeeId/report`→ `${API}/api/sessions/:employeeId/report`
`${API}/users/sessions/:employeeId/status`→ `${API}/api/sessions/:employeeId/status`
```

- [ ] **Step 4: Fix deliveryHandlers.ts — /api/delivery/ prefix + fix location-update path**

```typescript
// BEFORE → AFTER (representative examples — apply to ALL routes)
`${API}/delivery/drivers/available`       → `${API}/api/delivery/drivers/available`
`${API}/delivery/auto-dispatch`           → `${API}/api/delivery/auto-dispatch`
`${API}/delivery/route-optimize`          → `${API}/api/delivery/route-optimize`
`${API}/delivery/location-update`         → `${API}/api/delivery/location`  // name change too
`${API}/delivery/track/:orderId`          → `${API}/api/delivery/track/:orderId`
`${API}/delivery/eta/:orderId`            → `${API}/api/delivery/eta/:orderId`
`${API}/delivery/metrics`                 → `${API}/api/delivery/metrics`
`${API}/delivery/metrics/today`           → `${API}/api/delivery/metrics/today`
`${API}/delivery/driver/:driverId/...`    → `${API}/api/delivery/driver/:driverId/...`
`${API}/delivery/zone/check`              → `${API}/api/delivery/zone/check`
`${API}/delivery/zone/fee`                → `${API}/api/delivery/zone/fee`
`${API}/delivery/zone/list`               → `${API}/api/delivery/zone/list`
`${API}/delivery/zone/validate`           → `${API}/api/delivery/zone/validate`
`${API}/delivery/accept`                  → `${API}/api/delivery/accept`
`${API}/delivery/reject`                  → `${API}/api/delivery/reject`
`${API}/delivery/:orderId/generate-otp`   → `${API}/api/delivery/:orderId/generate-otp`
`${API}/delivery/:orderId/regenerate-otp` → `${API}/api/delivery/:orderId/regenerate-otp`
```

- [ ] **Step 5: Verify analyticsHandlers.ts is already correct — no changes needed**

```bash
grep -n "http\." frontend/src/test/mocks/handlers/analyticsHandlers.ts | head -5
```

Expected: all routes already have `${API}/api/analytics/...` or `${API}/api/bi/...`. If all correct, move on.

- [ ] **Step 6: Fix inventoryHandlers.ts — three different canonical base paths**

The canonical backend paths are:
- Items: `/api/inventory` (not `/inventory/items`)
- Suppliers: `/api/suppliers` (not `/inventory/suppliers`)
- Purchase orders: `/api/purchase-orders` (not `/inventory/purchase-orders`)
- Waste: `/api/waste` (not `/inventory/waste`)

```typescript
// BEFORE → AFTER
`${API}/inventory/items`                  → `${API}/api/inventory`
`${API}/inventory/items/:id`              → `${API}/api/inventory/:id`
`${API}/inventory/items/category/:cat`    → `${API}/api/inventory/category/:cat`
`${API}/inventory/items/search`           → `${API}/api/inventory/search`
`${API}/inventory/low-stock`              → `${API}/api/inventory/low-stock`
`${API}/inventory/out-of-stock`           → `${API}/api/inventory/out-of-stock`
`${API}/inventory/expiring-soon`          → `${API}/api/inventory/expiring-soon`
`${API}/inventory/alerts/low-stock`       → `${API}/api/inventory/alerts/low-stock`
`${API}/inventory/value`                  → `${API}/api/inventory/value`
`${API}/inventory/value/by-category`      → `${API}/api/inventory/value/by-category`

`${API}/inventory/suppliers`              → `${API}/api/suppliers`
`${API}/inventory/suppliers/:id`          → `${API}/api/suppliers/:id`
`${API}/inventory/suppliers/active`       → `${API}/api/suppliers/active`
`${API}/inventory/suppliers/preferred`    → `${API}/api/suppliers/preferred`
`${API}/inventory/suppliers/reliable`     → `${API}/api/suppliers/reliable`
`${API}/inventory/suppliers/search`       → `${API}/api/suppliers/search`

`${API}/inventory/purchase-orders`        → `${API}/api/purchase-orders`
`${API}/inventory/purchase-orders/:id`    → `${API}/api/purchase-orders/:id`

`${API}/inventory/waste`                  → `${API}/api/waste`
`${API}/inventory/waste/trend`            → `${API}/api/waste/trend`
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

- [ ] **Step 8: Fix menuHandlers.ts — add /api/ prefix**

```typescript
// BEFORE → AFTER
`${API}/menu/public`                      → `${API}/api/menu/public`
`${API}/menu/public/:id`                  → `${API}/api/menu/public/:id`
`${API}/menu/public/cuisine/:cuisine`     → `${API}/api/menu/public/cuisine/:cuisine`
`${API}/menu/public/category/:category`   → `${API}/api/menu/public/category/:category`
`${API}/menu/public/dietary/:type`        → `${API}/api/menu/public/dietary/:type`
`${API}/menu/public/recommended`          → `${API}/api/menu/public/recommended`
`${API}/menu/public/search`               → `${API}/api/menu/public/search`
`${API}/menu/public/tag/:tag`             → `${API}/api/menu/public/tag/:tag`
`${API}/menu/items`                       → `${API}/api/menu/items`
`${API}/menu/items/:id`                   → `${API}/api/menu/items/:id`
// etc. — apply to all routes in file
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

- [ ] **Step 2: Fix sessionApi.ts — /api/sessions not /users/sessions**

`sessionApi.ts` has `baseUrl: API_CONFIG.USER_SERVICE_URL` (= gateway root). Change every URL:

```typescript
// BEFORE → AFTER
`/users/sessions/current`              → `/api/sessions/current`
`/users/sessions/start`                → `/api/sessions`           // POST to start session
`/users/sessions/end`                  → `/api/sessions/end`
`/users/sessions/${employeeId}/break`  → `/api/sessions/${sessionId}/break`
`/users/sessions/store/active`         → `/api/sessions/store/active`
`/users/sessions/store`                → `/api/sessions/store`
`/users/sessions/${employeeId}`        → `/api/sessions/${employeeId}`
`/users/sessions/pending-approval`     → `/api/sessions/pending`
`/users/sessions/${sessionId}/approve` → `/api/sessions/${sessionId}/approve`
`/users/sessions/${sessionId}/reject`  → `/api/sessions/${sessionId}/reject`
`/users/sessions/clock-in-with-pin`    → `/api/sessions/clock-in`
`/users/sessions/clock-out-employee`   → `/api/sessions/clock-out`
`/users/sessions/${employeeId}/report` → `/api/sessions/${employeeId}/report`
`/users/sessions/${employeeId}/status` → `/api/sessions/${employeeId}/status`
```

- [ ] **Step 3: Fix equipmentApi.ts — /api/equipment not /kitchen-equipment**

`equipmentApi.ts` has `baseUrl: API_CONFIG.ORDER_SERVICE_URL` (= gateway root). Change every URL:

```typescript
// BEFORE → AFTER
`/kitchen-equipment`                   → `/api/equipment`
`/kitchen-equipment/store`             → `/api/equipment/store`
`/kitchen-equipment/${id}`             → `/api/equipment/${id}`
`/kitchen-equipment/${id}/status`      → `/api/equipment/${id}/status`
`/kitchen-equipment/${id}/power`       → `/api/equipment/${id}/power`
`/kitchen-equipment/${id}/temperature` → `/api/equipment/${id}/temperature`
`/kitchen-equipment/${id}/maintenance` → `/api/equipment/${id}/maintenance`
`/kitchen-equipment/store/status/${s}` → `/api/equipment/store/status/${s}`
`/kitchen-equipment/store/maintenance-needed` → `/api/equipment/store/maintenance-needed`
`/kitchen-equipment/store/reset-usage` → remove this endpoint — does not exist in backend
```

Remove `resetUsageCounts` mutation entirely — this endpoint (`/kitchen-equipment/store/reset-usage`) does not exist in the backend canonical endpoint map.

Also change `baseUrl` from `API_CONFIG.ORDER_SERVICE_URL` to `API_CONFIG.BASE_URL` (semantically cleaner, functionally the same).

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

- [ ] **Step 5: Fix shiftApi.ts — add /api/ prefix to all URLs**

`shiftApi.ts` has `baseUrl: API_CONFIG.USER_SERVICE_URL` (= gateway root). Fix all URLs:

```typescript
// BEFORE → AFTER (key mismatches)
url: '/shifts/bulk-create'              → url: '/api/shifts/bulk'
url: `/shifts/copy-previous-week?...`  → url: `/api/shifts/copy-week?...`

// All other shift URLs — add /api/ prefix:
`/shifts`                              → `/api/shifts`
`/shifts/${shiftId}`                   → `/api/shifts/${shiftId}`
`/shifts/${shiftId}/confirm`           → `/api/shifts/${shiftId}/confirm`
`/shifts/${shiftId}/start`             → `/api/shifts/${shiftId}/start`
`/shifts/${shiftId}/complete`          → `/api/shifts/${shiftId}/complete`
`/shifts/employee/${id}/current`       → `/api/shifts/employee/${id}/current`
`/shifts/store/${id}/week?...`         → `/api/shifts/store/${id}/week?...`
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

- [ ] **Step 7: Fix inventoryApi.ts — change baseUrl and fix all URL groups**

`inventoryApi.ts` currently has `baseUrl: ${API_CONFIG.API_GATEWAY_URL}/inventory`. This means URL `/items` resolves to `gateway/inventory/items`. The canonical paths are completely different — three separate base paths. Change:

```typescript
// BEFORE
baseUrl: `${API_CONFIG.API_GATEWAY_URL}/inventory`,

// AFTER
baseUrl: API_CONFIG.BASE_URL,    // plain gateway root
```

Then fix all URL groups:

```typescript
// Items — BEFORE → AFTER
url: '/items'                          → url: '/api/inventory'
url: `/items/${id}`                    → url: `/api/inventory/${id}`
url: `/items/${id}/adjust`             → url: `/api/inventory/${id}/adjust`
url: `/items/${id}/reserve`            → url: `/api/inventory/${id}/reserve`
url: `/items/${id}/release`            → url: `/api/inventory/${id}/release`
url: `/items/${id}/consume`            → url: `/api/inventory/${id}/consume`
// also fix query paths like /low-stock, /out-of-stock, /expiring-soon, /value, /value/by-category

// Suppliers — BEFORE → AFTER
url: '/suppliers'                      → url: '/api/suppliers'
url: `/suppliers/${id}`                → url: `/api/suppliers/${id}`
url: `/suppliers/${id}/status`         → url: `/api/suppliers/${id}/status`
url: `/suppliers/${id}/preferred`      → url: `/api/suppliers/${id}/preferred`
url: `/suppliers/${id}/performance`    → url: `/api/suppliers/${id}/performance`

// Purchase Orders — BEFORE → AFTER
url: '/purchase-orders'                → url: '/api/purchase-orders'
url: `/purchase-orders/${id}`          → url: `/api/purchase-orders/${id}`
url: `/purchase-orders/${id}/approve`  → url: `/api/purchase-orders/${id}/approve`
url: `/purchase-orders/${id}/reject`   → url: `/api/purchase-orders/${id}/reject`
url: `/purchase-orders/${id}/send`     → url: `/api/purchase-orders/${id}/send`
url: `/purchase-orders/${id}/receive`  → url: `/api/purchase-orders/${id}/receive`
url: `/purchase-orders/${id}/cancel`   → url: `/api/purchase-orders/${id}/cancel`
url: '/purchase-orders/auto-generate'  → url: '/api/purchase-orders/auto-generate'

// Waste — BEFORE → AFTER
url: '/waste'                          → url: '/api/waste'
url: `/waste/${id}`                    → url: `/api/waste/${id}`
url: `/waste/${id}/approve`            → url: `/api/waste/${id}/approve`
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
  describe('GET /api/menu/public', () => {
    it('returns list of public menu items', async () => {
      await provider
        .addInteraction()
        .given('menu items exist')
        .uponReceiving('a request to get all public menu items')
        .withRequest('GET', '/api/menu/public')
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
          const response = await fetch(`${mockServer.url}/api/menu/public`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
          expect(data[0]).toHaveProperty('id');
          expect(data[0]).toHaveProperty('name');
        });
    });
  });

  describe('GET /api/menu/public/:id', () => {
    it('returns a single menu item by id', async () => {
      await provider
        .addInteraction()
        .given('menu item exists with id menu-pact-1')
        .uponReceiving('a request to get menu item by id')
        .withRequest('GET', '/api/menu/public/menu-pact-1')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            id: string('menu-pact-1'),
            name: string('Margherita Pizza'),
            basePrice: like(29900),
            isAvailable: like(true),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/menu/public/menu-pact-1`);
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
        .given('drivers are available for store store-1')
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
