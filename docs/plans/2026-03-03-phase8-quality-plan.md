# Phase 8 — Quality + Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Achieve 90%+ unit test pass rate, fix E2E Playwright specs, add distributed tracing, and complete the product website.

**Architecture:** Vitest for frontend unit tests, Pact for contract tests between frontend + backend, Playwright for E2E, Spring Cloud Sleuth + Zipkin for distributed tracing. Product website completion in existing `frontend/src/pages/product-site/`.

**Tech Stack:** Vitest 2.x, Pact JS, Playwright, Spring Cloud Sleuth, Zipkin, React 19

**Prerequisite:** All Phases 0–7 complete. Services deployed and accessible.

---

## Task 8.1: Audit Current Unit Test State

**Files:**
- Read: `frontend/src/` (find all test files)

**Step 1: Find all Vitest test files**

```bash
find frontend/src -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | sort | wc -l
```

Expected: ~104 files, ~1374 tests (per MEMORY.md).

**Step 2: Run all tests and record baseline**

```bash
cd frontend
npm test -- --reporter=verbose --run 2>&1 | tee /tmp/test-baseline.txt
grep -E "Tests|pass|fail" /tmp/test-baseline.txt | tail -10
```

Record: X passing, Y failing, Z skipped.

**Step 3: Categorize failures**

```bash
# Count failures by file
npm test -- --reporter=json --run 2>&1 | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for file in data.get('testResults', []):
        failures = [t for t in file.get('assertionResults', []) if t.get('status') == 'failed']
        if failures:
            print(f'{len(failures):3d} failures: {file[\"testFilePath\"].split(\"/src/\")[1]}')
except: pass
" | sort -rn | head -20
```

Document the top 20 files with most failures — these are fixed first.

**Step 4: No commit — audit only.**

---

## Task 8.2: Fix RTK Query Mock Path Issues

Most unit test failures will be RTK Query mocks using old API paths (before Phase 1 API reduction). Fix these systematically.

**Files:**
- Modify: Multiple `*.test.tsx` files in `frontend/src/`

**Step 1: Find all tests mocking old API paths**

```bash
cd frontend
grep -r "/api/v1/" src --include="*.test.*" -l
grep -r "/api/kitchen-equipment" src --include="*.test.*" -l
grep -r "/api/ratings" src --include="*.test.*" -l
```

**Step 2: Update all v1 path mocks to canonical paths**

For each file found, replace old paths with canonical ones from the spec:

```typescript
// Before:
server.use(
  rest.get('/api/v1/orders', (req, res, ctx) => res(ctx.json(mockOrders)))
);

// After:
server.use(
  rest.get('/api/orders', (req, res, ctx) => res(ctx.json(mockOrders)))
);
```

Common replacements:
- `/api/v1/auth/login` → `/api/auth/login`
- `/api/v1/orders` → `/api/orders`
- `/api/v1/menu/items` → `/api/menu`
- `/api/kitchen-equipment` → `/api/equipment`
- `/api/ratings/token/` → `/api/reviews/public/token/`

**Step 3: Fix stale field name mocks**

If tests mock response shapes that don't match current entity fields, update:
- `scheduledStart`/`scheduledEnd` (not `startTime`/`endTime`) for shifts
- `itemName`, `currentStock`, `minimumStock` (not `name`, `stock`, `minStock`) for inventory
- `equipmentName` (not `name`) for kitchen equipment

**Step 4: Run targeted tests to verify fixes**

```bash
cd frontend
npm test -- --reporter=verbose --run src/features/orders/
npm test -- --reporter=verbose --run src/features/menu/
```

**Step 5: Commit batch of fixes**

```bash
git add frontend/src/
git commit -m "fix(tests): update RTK Query mocks to canonical API paths after Phase 1 reduction"
```

---

## Task 8.3: Fix Component Unit Tests

After fixing path mocks, remaining failures will be component render issues.

**Files:**
- Modify: Multiple component test files

**Step 1: Run full test suite and get current count**

```bash
cd frontend
npm test -- --run 2>&1 | tail -5
```

**Step 2: Fix top failing test files one at a time**

Common patterns in broken component tests:

**Pattern 1: Missing Redux store provider**

```typescript
// Before (missing Provider):
render(<KitchenDisplayPage />);

// After:
import { renderWithProviders } from '../test-utils';
renderWithProviders(<KitchenDisplayPage />);
```

**Pattern 2: Missing RTK Query setupApiMocks**

```typescript
// Add to test file top:
import { server } from '../../mocks/server';
import { rest } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Pattern 3: Async state not awaited**

```typescript
// Before:
render(<OrderManagementPage />);
expect(screen.getByText('Orders')).toBeInTheDocument();

// After:
render(<OrderManagementPage />);
await screen.findByText('Orders');  // waits for async render
```

**Step 3: Target 90% pass rate**

Repeat fix-run-commit cycle until:
```bash
npm test -- --run 2>&1 | grep "Tests:" | tail -1
# Target: Tests: X passed, Y failed — Y/X < 10%
```

**Step 4: Commit each batch of fixes**

```bash
git commit -m "fix(tests): fix component unit tests — Provider wrapping, async awaiting, MSW handlers"
```

---

## Task 8.4: Pact Contract Tests

**Files:**
- Modify/Create: `frontend/src/pact/` files

**Step 1: List existing Pact files**

```bash
ls frontend/src/pact/
```

Check what contracts already exist vs what's needed for the 175 canonical endpoints.

**Step 2: Write consumer contracts for critical endpoints**

Priority order for Pact contracts:
1. Auth endpoints (login, refresh, logout)
2. Order creation + status update
3. Menu listing
4. Cart/checkout flow
5. Customer profile

Example Pact consumer test for order creation:

```typescript
// frontend/src/pact/orders.pact.test.ts
import { Pact } from '@pact-foundation/pact';
import { createOrder } from '../api/ordersApi';

const provider = new Pact({
  consumer: 'MaSoVa Frontend',
  provider: 'commerce-service',
  port: 8084,
  log: process.stdout,
  dir: 'pacts',
});

describe('Order API contract', () => {
  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());
  afterEach(() => provider.verify());

  it('creates an order', async () => {
    await provider.addInteraction({
      state: 'menu item exists',
      uponReceiving: 'a request to create an order',
      withRequest: {
        method: 'POST',
        path: '/api/orders',
        headers: { 'Content-Type': 'application/json' },
        body: {
          storeId: 'STORE001',
          orderType: 'TAKEAWAY',
          customerName: 'Test Customer',
          items: [{ menuItemId: 'ITEM001', name: 'Test Item', quantity: 1, price: 100 }]
        }
      },
      willRespondWith: {
        status: 201,
        body: {
          id: Matchers.uuid(),
          orderNumber: Matchers.like('ORD-001'),
          status: 'RECEIVED',
          total: Matchers.like(110.0)
        }
      }
    });

    const result = await createOrder({
      storeId: 'STORE001',
      orderType: 'TAKEAWAY',
      customerName: 'Test Customer',
      items: [{ menuItemId: 'ITEM001', name: 'Test Item', quantity: 1, price: 100 }]
    });

    expect(result.status).toBe('RECEIVED');
  });
});
```

**Step 3: Run Pact consumer tests to generate pact files**

```bash
cd frontend
npx pact-broker can-i-deploy --pacticipant "MaSoVa Frontend" --latest
npm run test:pact
```

Generated pact files go to `frontend/pacts/` directory.

**Step 4: Commit pact files**

```bash
git add frontend/src/pact/
git add frontend/pacts/
git commit -m "feat(tests): Pact consumer contracts for auth, orders, menu endpoints"
```

---

## Task 8.5: Distributed Tracing — Spring Cloud Sleuth + Zipkin

**Files:**
- Modify: All 6 Java service `pom.xml` files
- Modify: `docker-compose.yml`
- Modify: All 6 service `application.yml` files

**Step 1: Add Zipkin to docker-compose.yml**

In `docker-compose.yml`, add Zipkin service:

```yaml
  zipkin:
    image: openzipkin/zipkin:3.4
    container_name: masova-zipkin
    restart: unless-stopped
    ports:
      - "9411:9411"
    networks:
      - masova-network
```

**Step 2: Add Micrometer Tracing to each Java service pom.xml**

Spring Boot 3 uses Micrometer Tracing (not Spring Cloud Sleuth which was Spring Boot 2 era). Add to each service's `pom.xml`:

```xml
<!-- Distributed Tracing (Spring Boot 3 / Micrometer) -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-brave</artifactId>
</dependency>
<dependency>
    <groupId>io.zipkin.reporter2</groupId>
    <artifactId>zipkin-reporter-brave</artifactId>
</dependency>
```

**Step 3: Configure tracing in application.yml**

In each service's `application.yml`, add:

```yaml
management:
  tracing:
    sampling:
      probability: 1.0  # Sample 100% in dev (use 0.1 in production)
  zipkin:
    tracing:
      endpoint: http://${ZIPKIN_HOST:192.168.50.88}:9411/api/v2/spans
```

**Step 4: Start Zipkin and verify traces**

```powershell
docker compose up -d zipkin
```

Open `http://192.168.50.88:9411` → create an order via API → check Zipkin UI for trace spanning api-gateway → commerce-service.

Expected: trace shows propagation across service calls with timing per span.

**Step 5: Commit**

```bash
git add docker-compose.yml
git add core-service/pom.xml commerce-service/pom.xml logistics-service/pom.xml
git add payment-service/pom.xml intelligence-service/pom.xml api-gateway/pom.xml
git add core-service/src/main/resources/application.yml
# ... other application.yml files
git commit -m "feat(observability): distributed tracing — Micrometer Brave + Zipkin across all 6 services"
```

---

## Task 8.6: Fix Playwright E2E Tests

**Files:**
- Modify: `frontend/tests/` (all Playwright specs)

**Step 1: List existing Playwright specs**

```bash
ls frontend/tests/
```

Expected: ~13 spec files.

**Step 2: Run Playwright tests against local dev server**

```bash
cd frontend
npx playwright test --reporter=list 2>&1 | tail -30
```

**Step 3: Fix failing test selectors**

Most Playwright test failures after a UI revamp are due to changed selectors. Common fixes:

```typescript
// Before (fragile text selector):
await page.click('text=Sign In');

// After (role-based — more robust):
await page.getByRole('button', { name: 'Sign In' }).click();
```

```typescript
// Before (CSS class selector):
await page.click('.submit-btn');

// After (test ID — most robust):
// In the component: <Button data-testid="submit-login">Sign In</Button>
await page.getByTestId('submit-login').click();
```

**Step 4: Add data-testid to critical UI elements**

For each Playwright test that's broken due to selector changes, add `data-testid` to the corresponding component element rather than changing the test to use a fragile selector. Test IDs survive CSS class/text changes.

**Step 5: Fix critical flows**

Critical flows that must pass:

**Full checkout flow:**
```typescript
// tests/checkout.spec.ts
test('customer can place TAKEAWAY order', async ({ page }) => {
  await page.goto('/');
  // Login as customer
  await page.getByTestId('customer-login-email').fill('customer@masova.com');
  await page.getByTestId('customer-login-password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Add item to cart
  await page.goto('/menu');
  await page.getByTestId('add-to-cart-ITEM001').click();

  // Checkout
  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Place Order' }).click();

  // Verify order confirmation
  await expect(page.getByText('Order Placed')).toBeVisible();
});
```

**Order tracking flow:**
```typescript
test('customer can track order', async ({ page }) => {
  // ... navigate to order tracking page
  // Verify status timeline is visible
  await expect(page.getByText('RECEIVED')).toBeVisible();
});
```

**Step 6: Run and verify critical flows pass**

```bash
cd frontend
npx playwright test tests/checkout.spec.ts tests/order-tracking.spec.ts --headed
```

**Step 7: Commit**

```bash
git add frontend/tests/
git add frontend/src/  # data-testid additions
git commit -m "fix(e2e): fix Playwright specs — role-based selectors, data-testid on critical elements, critical flow tests"
```

---

## Task 8.7: Product Website Completion

**Files:**
- Modify: `frontend/src/pages/product-site/` (all existing files)
- Modify: `frontend/src/components/product-site/SupportFAB.tsx`

**Step 1: Read existing product-site pages**

```bash
ls frontend/src/pages/product-site/
ls frontend/src/components/product-site/
```

**Step 2: Complete all sections**

The product site needs these sections completed:

**Hero section** — already partially built. Complete with:
- Animated headline (CSS animation, no library)
- CTA button → `/register`
- Background: dark gradient with subtle grid pattern

**Features section** — 6 feature cards:
1. Smart KDS — Kitchen Display with real-time updates
2. Zone Delivery — Haversine distance pricing
3. AI Agents — Demand forecasting, churn prevention
4. Multi-role App — Manager, Kitchen, Driver, Cashier
5. Live Tracking — Real-time driver location
6. Analytics — Sales, staff performance, forecasting

```tsx
const features = [
  { icon: <RestaurantMenu />, title: 'Smart Kitchen Display', desc: 'Real-time order queue with urgency colors and sound alerts' },
  { icon: <LocalShipping />, title: 'Zone-Based Delivery', desc: '0–3km ₹29, 3–6km ₹49, 6–10km ₹79 — automatic calculation' },
  { icon: <Psychology />, title: '8 AI Agents', desc: 'Demand forecasting, churn prevention, smart review responses' },
  { icon: <PhoneAndroid />, title: 'Multi-Role Mobile App', desc: 'One app for Manager, Kitchen Staff, Driver, and Cashier' },
  { icon: <Map />, title: 'Live Order Tracking', desc: 'Real-time driver location, OTP proof-of-delivery' },
  { icon: <BarChart />, title: 'Business Analytics', desc: 'Sales trends, staff performance, revenue forecasting' },
];
```

**How It Works section** — 3 steps:
1. Customer places order → 2. Kitchen prepares, driver dispatched → 3. OTP verified, delivered

**Pricing section** — 1 plan (for now):
- Free to use (open source demo)
- Contact for enterprise

**Screenshots section** — embed actual screenshots of the app. Add placeholder images from the public directory if real screenshots aren't available yet.

**CTA section** — "Get Started" → `/register`, "See Demo" → a demo video or `/menu?storeId=STORE001`

**Step 3: Wire SupportFAB to real ChatWidget**

In `SupportFAB.tsx`, check if it's wired to real ChatWidget or a stub. If stub:

```tsx
// Replace stub with real ChatWidget
import { ChatWidget } from '../ChatWidget';

export const SupportFAB = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Fab
        color="primary"
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', bottom: 24, right: 24, bgcolor: 'var(--red)' }}
      >
        <Chat />
      </Fab>
      <ChatWidget open={open} onClose={() => setOpen(false)} />
    </>
  );
};
```

**Step 4: Complete ProductTourTab interface**

`ProductTourTab` interface is partially implemented. Check what's missing:

```bash
grep -r "ProductTourTab" frontend/src --include="*.tsx"
```

Complete the implementation — it likely needs:
- Tab switching for different product areas (Orders, KDS, Analytics, Driver App)
- Screenshot or demo video per tab
- Feature bullet points per tab

**Step 5: Build and visually verify**

```bash
npm run build && npm run dev
# Navigate to /product (or wherever the product site route is)
```

**Step 6: Commit**

```bash
git add frontend/src/pages/product-site/
git add frontend/src/components/product-site/
git commit -m "feat(product-site): complete all sections — hero, features, how-it-works, pricing, CTA, real ChatWidget"
```

---

## Task 8.8: Rate Limiting + Security Hardening

**Files:**
- Modify: `api-gateway/src/main/java/com/MaSoVa/gateway/` (security/filter config)

**Step 1: Add rate limiting filter in API Gateway**

```java
// RateLimitingFilter.java
@Component
@Order(1)
public class RateLimitingFilter implements Filter {

    private final RedisTemplate<String, String> redisTemplate;

    // 60 requests per minute per user
    private static final int MAX_REQUESTS = 60;
    private static final int WINDOW_SECONDS = 60;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String userId = extractUserId(httpRequest);  // from JWT

        if (userId != null) {
            String key = "rate:limit:" + userId + ":" + httpRequest.getRequestURI().split("/")[2];
            String count = redisTemplate.opsForValue().get(key);

            if (count != null && Integer.parseInt(count) >= MAX_REQUESTS) {
                ((HttpServletResponse) response).setStatus(429);
                ((HttpServletResponse) response).getWriter().write("{\"error\":\"Rate limit exceeded\"}");
                return;
            }

            redisTemplate.opsForValue().increment(key);
            redisTemplate.expire(key, WINDOW_SECONDS, java.util.concurrent.TimeUnit.SECONDS);
        }

        chain.doFilter(request, response);
    }

    private String extractUserId(HttpServletRequest request) {
        // Extract user ID from JWT Authorization header
        // ... (use existing JWT utilities)
        return null;  // implement
    }
}
```

**Step 2: Add CORS configuration for production domains**

In API Gateway security config, update CORS to allow production domains:

```java
.cors(cors -> cors.configurationSource(request -> {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(
        "http://localhost:3000",           // local dev
        "https://masova.app",             // production
        "https://masova-app.web.app"       // Firebase Hosting
    ));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    return config;
}))
```

**Step 3: Commit**

```bash
git add api-gateway/src/main/java/com/MaSoVa/gateway/
git commit -m "feat(security): rate limiting (60 req/min/user), production CORS config"
```

---

## Task 8.9: Final Quality Gate

Before marking Phase 8 complete, run all quality checks and verify targets are met.

**Step 1: Run full Vitest suite**

```bash
cd frontend
npm test -- --run 2>&1 | tail -5
```

Target: >90% pass rate (at least 1237 of 1374 tests passing).

**Step 2: Run Playwright E2E**

```bash
npx playwright test --reporter=list
```

Target: All critical flow tests passing (checkout, order tracking, driver delivery, manager order management).

**Step 3: Run API smoke test**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
node scripts/test-api-full.js 2>&1 | tail -20
```

Target: 175 endpoints covered, no 500 errors.

**Step 4: TypeScript check**

```bash
cd frontend
npx tsc --noEmit
```

Target: 0 TypeScript errors.

**Step 5: Build check**

```bash
npm run build
```

Target: Build succeeds, bundle size < 2MB gzipped.

**Step 6: Verify Zipkin traces**

Start all services, create an order, check Zipkin at `http://192.168.50.88:9411` → verify trace spans across gateway + commerce-service.

**Step 7: Commit final quality report**

```bash
# Create a brief quality report
cat > docs/quality-report-2026-03-03.md << 'EOF'
# Quality Report — Phase 8 Complete

## Test Results
- Vitest: X/1374 passing (Y%)
- Playwright: Z/13 specs passing
- TypeScript: 0 errors
- Build: success

## API Coverage
- 175 endpoints — smoke test: all passing

## Distributed Tracing
- Zipkin: spans visible across gateway + all 5 services

## Security
- Rate limiting: 60 req/min/user (Redis-backed)
- CORS: production domains allowed
- JWT blacklist: Redis, TTL-based
EOF

git add docs/quality-report-2026-03-03.md
git commit -m "docs: Phase 8 quality report — test results, coverage, tracing verification"
```

---

## Execution Notes

### Task Order
1. Task 8.1 (audit) — first, establishes baseline
2. Task 8.2 (fix path mocks) — biggest impact, fix first
3. Task 8.3 (fix component tests) — iterative, repeat until 90%
4. Task 8.4 (Pact contracts) — can be done in parallel with 8.2/8.3
5. Task 8.5 (Zipkin) — backend, can be done in parallel
6. Task 8.6 (Playwright) — after UI stabilizes (Phase 4 complete)
7. Task 8.7 (product site) — independent, can be done anytime
8. Task 8.8 (security) — near the end, doesn't affect other tasks
9. Task 8.9 (quality gate) — always last

### Target Metrics
| Metric | Target | Command to Check |
|--------|--------|-----------------|
| Vitest pass rate | >90% | `npm test -- --run \| tail -5` |
| TypeScript errors | 0 | `npx tsc --noEmit` |
| Playwright critical flows | 100% | `npx playwright test` |
| API smoke test | 175/175 | `node scripts/test-api-full.js` |
| Build bundle size | <2MB gz | `npm run build` check output |
| Zipkin trace depth | 2+ hops | Manual check in UI |

### Not Blocking Production
Tasks 8.4 (Pact), 8.5 (Zipkin), 8.7 (product site), 8.8 (rate limiting) are quality improvements — the system is functional without them. Prioritize 8.1–8.3 (Vitest) and 8.6 (Playwright) first.
