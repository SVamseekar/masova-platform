# Frontend Test Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all confirmed frontend test infrastructure bugs — MSW handler `/api/` prefix, RTK Query slice URL mismatches, broken Pact consumer files — and restructure test files to the co-located industry standard so all subsequent test writing has a correct foundation.

**Architecture:** Tests co-located next to source files. MSW handlers intercept at full URL including `/api/` prefix. RTK Query slices use canonical paths matching the backend endpoint map. Pact consumer tests use `@pact-foundation/pact` v4 API (not `jest-pact`). Vitest coverage thresholds raised to 80%.

**Prerequisite:** Plan 0 (deployment blockers) must be complete.

**Tech Stack:** Vitest 1.6.x, React Testing Library 16.x, MSW 2.x, @pact-foundation/pact 16.x

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
| `frontend/src/test/mocks/handlers/customerHandlers.ts` | Fix `/api/customers/` prefix |
| `frontend/src/test/mocks/handlers/inventoryHandlers.ts` | Fix `/api/inventory/`, `/api/suppliers/`, `/api/purchase-orders/` |
| `frontend/src/test/mocks/handlers/notificationHandlers.ts` | Fix inconsistent `/api/` prefix |
| `frontend/src/test/mocks/handlers/sessionHandlers.ts` | Fix `/api/sessions/` (not `/users/sessions/`) |
| `frontend/src/test/mocks/handlers/analyticsHandlers.ts` | Fix `/api/analytics`, `/api/bi` |
| `frontend/src/test/mocks/handlers/reviewHandlers.ts` | Fix `/api/reviews/` prefix |
| `frontend/src/store/api/authApi.ts` | Fix paths: `/api/auth/login` not `/users/login` |
| `frontend/src/store/api/sessionApi.ts` | Fix paths: `/api/sessions` not `/users/sessions` |
| `frontend/src/store/api/equipmentApi.ts` | Fix paths: `/api/equipment` not `/kitchen-equipment` |
| `frontend/src/store/api/orderApi.ts` | Fix `updateOrderStatus` method: POST not PATCH |
| `frontend/src/store/api/shiftApi.ts` | Fix `/api/shifts/bulk` not `/shifts/bulk-create` |
| `frontend/src/store/api/driverApi.ts` | Fix `/api/delivery/location` not `/delivery/location-update` |
| `frontend/src/pact/consumers/order-service.pact.test.ts` | Rewrite as `commerce-service.pact.test.ts` |
| `frontend/src/pact/consumers/menu-service.pact.test.ts` | Rewrite using `@pact-foundation/pact` v4 |
| `frontend/src/pact/consumers/payment-service.pact.test.ts` | Rewrite, remove `/api/v1/` paths |
| `frontend/src/pact/consumers/user-service.pact.test.ts` | Rewrite |
| `frontend/src/pact/consumers/delivery-service.pact.test.ts` | Rewrite |
| `frontend/src/pact/consumers/customer-service.pact.test.ts` | Rewrite |
| `frontend/vitest.config.ts` | Raise coverage thresholds to 80% |

---

### Task 1: Fix MSW Handler URLs — Add /api/ Prefix

**Context:** Every MSW handler uses `${API}/orders`, `${API}/payments` etc. where `API = VITE_API_URL || 'http://localhost:8080'`. This resolves to `http://localhost:8080/orders`. The backend serves `http://localhost:8080/api/orders`. MSW intercepts the wrong URL and tests make real network calls or fail silently.

The fix: change every handler to use `${API}/api/orders`, `${API}/api/payments` etc.

**Files:**
- Modify: all 12 handler files in `frontend/src/test/mocks/handlers/`

- [ ] **Step 1: Fix orderHandlers.ts**

Open `frontend/src/test/mocks/handlers/orderHandlers.ts`. Change every URL from `${API}/orders/...` to `${API}/api/orders/...`:

Before:
```typescript
http.get(`${API}/orders`, () => HttpResponse.json(mockOrders)),
http.get(`${API}/orders/:orderId`, ...) 
http.get(`${API}/orders/track/:orderId`, ...)
http.get(`${API}/orders/kitchen`, ...)
```

After:
```typescript
http.get(`${API}/api/orders`, () => HttpResponse.json(mockOrders)),
http.get(`${API}/api/orders/:orderId`, ...)
http.get(`${API}/api/orders/track/:orderId`, ...)
http.get(`${API}/api/orders/kitchen`, ...)
```

Apply the same `/api/` insertion to every route in the file.

- [ ] **Step 2: Fix authHandlers.ts — paths change from /users/ to /api/auth/**

The `authApi` calls `/api/auth/login`, `/api/auth/register` etc. but the old handlers likely have `/api/users/login`. Change:

Before:
```typescript
http.post(`${API}/api/users/login`, ...)
http.post(`${API}/api/users/register`, ...)
http.post(`${API}/api/users/logout`, ...)
http.post(`${API}/api/users/refresh`, ...)
```

After:
```typescript
http.post(`${API}/api/auth/login`, ...)
http.post(`${API}/api/auth/register`, ...)
http.post(`${API}/api/auth/logout`, ...)
http.post(`${API}/api/auth/refresh`, ...)
```

- [ ] **Step 3: Fix sessionHandlers.ts — /api/sessions not /users/sessions**

Before:
```typescript
http.post(`${API}/users/sessions/start`, ...)
http.post(`${API}/users/sessions/end`, ...)
```

After:
```typescript
http.post(`${API}/api/sessions`, ...)
http.post(`${API}/api/sessions/end`, ...)
```

- [ ] **Step 4: Fix deliveryHandlers.ts — path name fix**

Before:
```typescript
http.post(`${API}/delivery/location-update`, ...)
```

After:
```typescript
http.post(`${API}/api/delivery/location`, ...)
```

Apply `/api/` prefix to all other delivery routes.

- [ ] **Step 5: Fix analyticsHandlers.ts — mixed absolute paths**

Before (broken — mixes baseUrl+/analytics with absolute /api/bi paths):
```typescript
// baseUrl already has /analytics appended in analyticsApi
http.get(`${API}/analytics/sales/today`, ...)
http.get(`${API}/api/bi/executive-summary`, ...)
```

After:
```typescript
http.get(`${API}/api/analytics`, ...)          // query param: ?type=sales
http.get(`${API}/api/bi`, ...)                  // query param: ?type=sales-forecast
http.get(`${API}/api/bi/reports`, ...)          // query param: ?type=executive-summary
```

- [ ] **Step 6: Fix inventoryHandlers.ts — suppliers and purchase-orders are separate base paths**

Before:
```typescript
http.get(`${API}/inventory/suppliers`, ...)
http.get(`${API}/inventory/purchase-orders`, ...)
```

After:
```typescript
http.get(`${API}/api/suppliers`, ...)
http.get(`${API}/api/purchase-orders`, ...)
http.get(`${API}/api/inventory`, ...)
```

- [ ] **Step 7: Fix remaining handler files (paymentHandlers, menuHandlers, userHandlers, customerHandlers, reviewHandlers, notificationHandlers)**

For each: add `/api/` between the base URL and the resource path. Run grep to verify:

```bash
grep -r "http\.\(get\|post\|put\|patch\|delete\).*\`\${API}/[^a]" frontend/src/test/mocks/handlers/
```

Expected: no matches (all URLs should now have `/api/` after the base URL).

- [ ] **Step 8: Run Vitest to verify MSW handlers intercept correctly**

```bash
cd frontend && npm run test:run -- --reporter=verbose 2>&1 | grep -E "PASS|FAIL|Error" | head -30
```

Expected: tests that previously made unintercepted requests now get mock responses.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/test/mocks/handlers/
git commit -m "fix(frontend/test): add /api/ prefix to all MSW handlers to match actual backend routes"
```

---

### Task 2: Fix RTK Query Slice URL Mismatches

**Context:** 7 confirmed mismatches between what RTK Query slices call and what the backend serves. Each needs a targeted fix in the slice file. No test changes — fixing the slices fixes both the app and the tests simultaneously.

**Files:**
- Modify: `frontend/src/store/api/authApi.ts`
- Modify: `frontend/src/store/api/sessionApi.ts`
- Modify: `frontend/src/store/api/equipmentApi.ts`
- Modify: `frontend/src/store/api/orderApi.ts`
- Modify: `frontend/src/store/api/shiftApi.ts`
- Modify: `frontend/src/store/api/driverApi.ts`

- [ ] **Step 1: Fix authApi.ts — change from /users/ to /api/auth/**

In `frontend/src/store/api/authApi.ts`:

Change `baseQuery: baseQueryWithAuth` — `baseQueryWithAuth` uses `API_CONFIG.BASE_URL` which is the gateway URL without path. Then change each endpoint URL:

```typescript
// BEFORE
url: '/users/login',
url: '/users/register',
url: '/users/logout',
url: '/users/refresh',
url: '/users/profile',
url: '/users/auth/google',
url: '/users/auth/google/register',

// AFTER
url: '/api/auth/login',
url: '/api/auth/register',
url: '/api/auth/logout',
url: '/api/auth/refresh',
url: '/api/users/profile',     // profile is on UserController not AuthController
url: '/api/auth/google',
url: '/api/auth/google',       // same endpoint handles both login and register
```

- [ ] **Step 2: Fix sessionApi.ts — /api/sessions not /users/sessions**

In `frontend/src/store/api/sessionApi.ts`, change:

```typescript
// BEFORE
url: '/users/sessions/start',
url: '/users/sessions/end',
url: '/users/sessions/${employeeId}/break',
url: '/users/sessions/${sessionId}/approve',
url: '/users/sessions/${sessionId}/reject',
url: '/users/sessions/clock-in-with-pin',
url: '/users/sessions/clock-out-employee',

// AFTER
url: '/api/sessions',           // POST to start session
url: '/api/sessions/end',
url: '/api/sessions/${employeeId}/break',
url: '/api/sessions/${sessionId}/approve',
url: '/api/sessions/${sessionId}/reject',
url: '/api/sessions/clock-in',
url: '/api/sessions/clock-out',
```

Also change `baseUrl` from `API_CONFIG.USER_SERVICE_URL` to `API_CONFIG.BASE_URL` (both are the gateway URL, but `USER_SERVICE_URL` naming is misleading for sessions).

- [ ] **Step 3: Fix equipmentApi.ts — /api/equipment not /kitchen-equipment**

In `frontend/src/store/api/equipmentApi.ts`, change:

```typescript
// BEFORE
url: '/kitchen-equipment',
url: '/kitchen-equipment/${equipmentId}/status',
url: '/kitchen-equipment/${equipmentId}/power',
url: '/kitchen-equipment/${equipmentId}/temperature',
url: '/kitchen-equipment/${equipmentId}/maintenance',
url: '/kitchen-equipment/${equipmentId}',
url: '/kitchen-equipment/store/reset-usage',
baseUrl: API_CONFIG.ORDER_SERVICE_URL,   // confusingly named

// AFTER
url: '/api/equipment',
url: '/api/equipment/${equipmentId}',
url: '/api/equipment/${equipmentId}',
url: '/api/equipment/${equipmentId}',
url: '/api/equipment/${equipmentId}/maintenance',
url: '/api/equipment/${equipmentId}',
// remove reset-usage — endpoint doesn't exist in backend
baseUrl: API_CONFIG.BASE_URL,
```

- [ ] **Step 4: Fix orderApi.ts — updateOrderStatus method should be POST not PATCH**

In `frontend/src/store/api/orderApi.ts`, find `updateOrderStatus` mutation:

```typescript
// BEFORE
url: `/orders/${orderId}/status`,
method: 'PATCH',

// AFTER
url: `/api/orders/${orderId}/status`,
method: 'POST',
```

Also add `/api/` prefix to all other orderApi URLs (they currently use relative paths with `baseUrl: API_CONFIG.ORDER_SERVICE_URL` = gateway root, so `/orders/...` needs to become `/api/orders/...`).

- [ ] **Step 5: Fix shiftApi.ts — /api/shifts/bulk not /shifts/bulk-create**

In `frontend/src/store/api/shiftApi.ts`:

```typescript
// BEFORE
url: '/shifts/bulk-create',
url: '/shifts/copy-previous-week?targetWeekStart=${targetWeekStart}',

// AFTER
url: '/api/shifts/bulk',
url: '/api/shifts/copy-week?targetWeekStart=${targetWeekStart}',
```

Add `/api/` prefix to all other shift URLs.

- [ ] **Step 6: Fix driverApi.ts — /api/delivery/location not /delivery/location-update**

In `frontend/src/store/api/driverApi.ts`:

```typescript
// BEFORE
url: '/delivery/location-update',

// AFTER
url: '/api/delivery/location',
```

- [ ] **Step 7: Verify TypeScript compiles with no errors**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 8: Run unit tests for affected API slices**

```bash
cd frontend && npm run test:run -- src/store/api/ --reporter=verbose 2>&1 | tail -20
```

Expected: all API slice tests pass.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/store/api/
git commit -m "fix(frontend): correct RTK Query slice URLs to match canonical backend paths — authApi, sessionApi, equipmentApi, orderApi, shiftApi, driverApi"
```

---

### Task 3: Rewrite Broken Pact Consumer Tests

**Context:** 6 of 7 frontend Pact consumer files use `jest-pact` (wrong package — not installed) and have TODO stubs with no real assertions. The one working file is `order.pact.test.ts` which uses the correct `@pact-foundation/pact` v4 API. Rewrite all 6 broken files following the same pattern as the working one.

The correct pattern for `@pact-foundation/pact` v16:
- Use `PactV4` class (not `pactWith`)
- Use `MatchersV3` (not `like`, `string`, `integer` from v1 DSL)
- Each test: define interaction → execute → verify

**Files:**
- Rewrite: `frontend/src/pact/consumers/menu-service.pact.test.ts`
- Rewrite: `frontend/src/pact/consumers/payment-service.pact.test.ts`
- Rewrite: `frontend/src/pact/consumers/user-service.pact.test.ts`
- Rewrite: `frontend/src/pact/consumers/delivery-service.pact.test.ts`
- Rewrite: `frontend/src/pact/consumers/customer-service.pact.test.ts`
- Delete: `frontend/src/pact/consumers/order-service.pact.test.ts` (old broken one)
- Keep: `frontend/src/pact/consumers/order.pact.test.ts` (this one already works)

- [ ] **Step 1: Read the working order.pact.test.ts to understand the correct pattern**

```bash
cat frontend/src/pact/consumers/order.pact.test.ts
```

Note the structure: `new PactV4({...})`, `addInteraction()`, `executeTest()`.

- [ ] **Step 2: Rewrite menu-service.pact.test.ts**

```typescript
import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import { menuApi } from '../../store/api/menuApi';
import { setupStore } from '../../store/store';

const { like, eachLike, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'commerce-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Menu Service Pact', () => {
  describe('GET /api/menu', () => {
    it('returns list of menu items', async () => {
      await provider
        .addInteraction()
        .given('menu items exist')
        .uponReceiving('a request to get all menu items')
        .withRequest('GET', '/api/menu')
        .willRespondWith(200, {
          contentType: 'application/json',
          body: eachLike({
            id: string('menu-1'),
            name: string('Margherita Pizza'),
            basePrice: like(29900),
            allergensDeclared: like(true),
          }),
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
        .willRespondWith(200, {
          contentType: 'application/json',
          body: {
            id: string('menu-pact-1'),
            name: string('Margherita Pizza'),
            basePrice: like(29900),
            allergensDeclared: like(true),
          },
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
        .withRequest('PATCH', '/api/menu/items/menu-pact-1/allergens', {
          contentType: 'application/json',
          body: {
            allergens: like(['MILK', 'GLUTEN']),
            allergenFree: like(false),
          },
        })
        .willRespondWith(200, {
          contentType: 'application/json',
          body: {
            id: string('menu-pact-1'),
            allergensDeclared: like(true),
          },
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

- [ ] **Step 3: Rewrite payment-service.pact.test.ts**

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
        .withRequest('POST', '/api/payments/initiate', {
          contentType: 'application/json',
          body: {
            orderId: string('order-1'),
            amount: like(500.00),
            customerId: string('cust-1'),
            customerEmail: string('test@masova.com'),
            storeId: string('store-1'),
            orderType: string('TAKEAWAY'),
            paymentMethod: string('CARD'),
          },
        })
        .willRespondWith(200, {
          contentType: 'application/json',
          body: {
            transactionId: string('txn-1'),
            razorpayOrderId: string('order_razorpay_1'),
            razorpayKeyId: string('rzp_test_key'),
            amount: like(500.00),
            status: string('INITIATED'),
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/payments/initiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: 'order-1',
              amount: 500.00,
              customerId: 'cust-1',
              customerEmail: 'test@masova.com',
              storeId: 'store-1',
              orderType: 'TAKEAWAY',
              paymentMethod: 'CARD',
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
        .given('payment service is available')
        .uponReceiving('a request to verify payment')
        .withRequest('POST', '/api/payments/verify', {
          contentType: 'application/json',
          body: {
            razorpayOrderId: string('order_razorpay_1'),
            razorpayPaymentId: string('pay_razorpay_1'),
            razorpaySignature: string('valid_signature'),
          },
        })
        .willRespondWith(200, {
          contentType: 'application/json',
          body: {
            transactionId: string('txn-1'),
            status: string('SUCCESS'),
          },
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

- [ ] **Step 4: Rewrite user-service.pact.test.ts (maps to core-service)**

```typescript
import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'core-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Core Service (Users) Pact', () => {
  describe('POST /api/auth/login', () => {
    it('returns access token on valid credentials', async () => {
      await provider
        .addInteraction()
        .given('user exists with email test@masova.com')
        .uponReceiving('a login request with valid credentials')
        .withRequest('POST', '/api/auth/login', {
          contentType: 'application/json',
          body: {
            email: string('test@masova.com'),
            password: string('Test1234!'),
          },
        })
        .willRespondWith(200, {
          contentType: 'application/json',
          body: {
            accessToken: string('access.token.value'),
            refreshToken: string('refresh.token.value'),
            user: {
              id: string('user-1'),
              email: string('test@masova.com'),
            },
          },
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
        .willRespondWith(200, {
          contentType: 'application/json',
          body: like([{
            id: string('store-1'),
            name: string('MaSoVa Mumbai'),
            code: string('MUM001'),
          }]),
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

- [ ] **Step 5: Rewrite delivery-service.pact.test.ts (maps to logistics-service)**

```typescript
import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, string } = MatchersV3;

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
        .willRespondWith(200, {
          contentType: 'application/json',
          body: {
            orderId: string('order-track-1'),
            status: string('IN_TRANSIT'),
            driverName: string('Rajesh Driver'),
            estimatedMinutes: like(15),
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/delivery/track/order-track-1`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty('status');
        });
    });
  });

  describe('GET /api/delivery/zones', () => {
    it('returns delivery zone configuration', async () => {
      await provider
        .addInteraction()
        .given('delivery zones are configured for store store-1')
        .uponReceiving('a request to get delivery zones')
        .withRequest('GET', '/api/delivery/zones', undefined, [['storeId', 'store-1']])
        .willRespondWith(200, {
          contentType: 'application/json',
          body: like([{
            zone: string('ZONE_A'),
            maxDistanceKm: like(3),
            feeINR: like(29),
          }]),
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/delivery/zones?storeId=store-1`);
          expect(response.status).toBe(200);
        });
    });
  });
});
```

- [ ] **Step 6: Rewrite customer-service.pact.test.ts (maps to core-service customers)**

```typescript
import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, string } = MatchersV3;

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
        .willRespondWith(200, {
          contentType: 'application/json',
          body: {
            id: string('cust-pact-1'),
            email: string('customer@masova.com'),
            loyaltyPoints: like(100),
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/customers/cust-pact-1`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.id).toBe('cust-pact-1');
        });
    });
  });
});
```

- [ ] **Step 7: Delete the old broken order-service.pact.test.ts**

```bash
rm frontend/src/pact/consumers/order-service.pact.test.ts
```

The working `order.pact.test.ts` already covers order service interactions.

- [ ] **Step 8: Run Pact consumer tests to verify they generate pact files**

```bash
cd frontend && npm run test:pact 2>&1 | tail -20
```

Expected: tests pass and `frontend/pacts/*.json` files are created.

- [ ] **Step 9: Verify pact files exist**

```bash
ls frontend/pacts/
```

Expected: JSON files named like `masova-frontend-commerce-service.json`, `masova-frontend-payment-service.json` etc.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/pact/consumers/ frontend/pacts/
git commit -m "fix(frontend/pact): rewrite 6 broken Pact consumer tests using @pact-foundation/pact v4 API, remove jest-pact"
```

---

### Task 4: Raise Vitest Coverage Thresholds

**Context:** Current thresholds are 30% across the board. After Plan 5 writes all missing tests, coverage will be ≥ 80%. Raise the thresholds now so CI fails if coverage drops below 80% — enforces the quality gate.

**Files:**
- Modify: `frontend/vitest.config.ts`

- [ ] **Step 1: Update coverage thresholds in vitest.config.ts**

In `frontend/vitest.config.ts`, find the `thresholds` block and change:

```typescript
// BEFORE
thresholds: {
  lines: 30,
  branches: 25,
  functions: 30,
  statements: 30,
},

// AFTER
thresholds: {
  lines: 80,
  branches: 75,
  functions: 80,
  statements: 80,
},
```

- [ ] **Step 2: Verify the existing tests still meet thresholds (they won't yet — Plan 5 fills the gaps)**

```bash
cd frontend && npm run test:coverage 2>&1 | tail -20
```

If coverage is below 80% (expected at this point), the output will show which files are missing coverage. This is expected — Plan 5 will fix it. The important thing is the configuration is correct.

- [ ] **Step 3: Commit**

```bash
git add frontend/vitest.config.ts
git commit -m "feat(frontend/test): raise Vitest coverage thresholds to 80% lines/functions/statements, 75% branches"
```

---

### Task 5: Add RTK Query Cache Reset to Test Setup

**Context:** RTK Query caches responses in the Redux store. Without resetting the cache between tests, one test's data bleeds into the next. The Redux docs explicitly require calling `store.dispatch(apiSlice.util.resetApiState())` after each test.

**Files:**
- Modify: `frontend/src/test/setup.ts`

- [ ] **Step 1: Import and reset all RTK Query API state in afterEach**

In `frontend/src/test/setup.ts`, after the existing `afterEach` block:

```typescript
import { authApi } from '../store/api/authApi';
import { orderApi } from '../store/api/orderApi';
import { menuApi } from '../store/api/menuApi';
import { paymentApi } from '../store/api/paymentApi';
import { deliveryApi } from '../store/api/deliveryApi';
import { customerApi } from '../store/api/customerApi';
import { userApi } from '../store/api/userApi';
import { inventoryApi } from '../store/api/inventoryApi';

// After the existing afterEach:
afterEach(() => {
  server.resetHandlers();
  cleanup();
  // Reset RTK Query cache so tests don't bleed into each other
  // Import the store from testUtils and dispatch resetApiState
});
```

Note: The actual store reset should happen in `testUtils.tsx` where `createTestStore()` is defined — create a fresh store per test rather than resetting a shared one:

In `frontend/src/test/utils/testUtils.tsx`, update `renderWithProviders` to create a fresh store per render call (the current implementation may already do this — verify):

```typescript
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),  // fresh store each time
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

- [ ] **Step 3: Commit**

```bash
git add frontend/src/test/setup.ts frontend/src/test/utils/testUtils.tsx
git commit -m "fix(frontend/test): ensure fresh Redux store per test to prevent RTK Query cache leakage between tests"
```

---

## Verification Checklist

- [ ] `grep -r "http\.\(get\|post\|put\|patch\|delete\).*\`\${API}/[^a]" frontend/src/test/mocks/handlers/` returns nothing
- [ ] `cd frontend && npm run test:run -- src/store/api/` — all API slice tests pass
- [ ] `cd frontend && npm run test:pact` — generates pact JSON files in `frontend/pacts/`
- [ ] `ls frontend/pacts/` shows at least 5 JSON contract files
- [ ] `cd frontend && npx tsc --noEmit` — no TypeScript errors
- [ ] `grep "api/v1" frontend/src/store/api/` — returns nothing (no stale v1 paths)
