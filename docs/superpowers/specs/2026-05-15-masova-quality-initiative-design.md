# MaSoVa Quality Initiative — Design Spec
**Date:** 2026-05-15  
**Scope:** Backend (6 services) + Frontend (web only) — mobile excluded  
**Goal:** Bring MaSoVa to corporate production-grade standard across testing, observability, security, CI/CD, and repo hygiene before deployment  

---

## 1. Context & What We Found

### What MaSoVa Does Well
The codebase has genuine engineering depth that most projects lack:
- Dual-write pattern (MongoDB + PostgreSQL) with Flyway migrations
- EU 14-allergen enforcement, 7-country fiscal signing, EU VAT engine
- API Gateway with JWT filter (30+ tests), rate limiting, correlation ID propagation
- Circuit breaker config in shared-models, GDPR anonymization across all PII services
- RabbitMQ event-driven architecture with proper exchange/queue design
- OpenAPI docs on all services, Testcontainers chosen as the right tool

### The Problem
Good domain logic is wrapped in incomplete operational infrastructure. The gaps are not architectural — they are the layer between "it works on Dell" and "it is production-grade":
1. Testing structure is flat, un-separated, incomplete, and has broken files
2. Observability is partial — metrics, structured logging, and tracing are inconsistent
3. Security has known gaps — refresh token rotation missing, CSP headers absent
4. CI does not enforce quality gates — Pact never blocks, no coverage, no Playwright
5. Repo has committed archives, backups, and worktrees cluttering main
6. Frontend is missing SEO meta, PWA wiring, and has incomplete code splitting

### 🔴 Deployment Blockers — Fix Before Anything Else

These will cause production failures:

**BLOCKER 1 — Duplicate Flyway versions in commerce-service**
```
V6__aggregator_order_columns.sql  ← duplicate V6
V6__fiscal_signatures.sql         ← duplicate V6
V7__aggregator_connections.sql    ← duplicate V7
V7__uk_vat_ledger.sql             ← duplicate V7
```
Flyway throws `FlywayException: Found more than one migration with version 6` at startup. commerce-service will not start. Fix: rename to V6a/V6b or renumber sequentially to V6, V7, V8, V9.

**BLOCKER 2 — Frontend production build crashes at startup**
`api.config.ts` calls `validateEnvVars()` which throws if `VITE_API_GATEWAY_URL` is missing. `deploy.yml` only sets `VITE_API_BASE_URL` — not `VITE_API_GATEWAY_URL`. Production build will crash immediately on load.

Fix: either make `VITE_API_GATEWAY_URL` fall back to `VITE_API_BASE_URL`, or add `VITE_API_GATEWAY_URL` to the deploy workflow frontend build step.

**BLOCKER 3 — `deploy.yml` missing critical env vars for backend services**
Not set in Cloud Run deploy:
- `SPRING_DATASOURCE_URL` — PostgreSQL (all services use it — they'll fail to connect)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — payment-service
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` — core-service (SMS notifications)
- `FIREBASE_CREDENTIALS` — core-service (push notifications)

**BLOCKER 4 — `api-contract-validation.yml` references dead services**
Tries to start `user-service`, `order-service`, `delivery-service` etc — all merged away in Phase 1. This workflow has never worked since Phase 1 and must be rewritten to use the 5 current services.

Additionally, the `backend-contract-verification` job runs `mvn test -Dtest=PactProviderTest` on `order-service`, `delivery-service`, `payment-service` — none of these service names exist and `PactProviderTest` doesn't exist in any service. Maven exits 0 when it can't find the test class, so this job **silently passes while doing nothing**. Fix: remove this job entirely and replace with real provider verification tests once Pact consumer files are fixed.

**BLOCKER 5 — `VITE_WS_URL` points at wrong port**
`.env.example` has `VITE_WS_URL=http://localhost:8083/ws` — commerce-service (which owns WebSocket) is on port 8084, not 8083. WebSocket connections fail silently in dev.

---

## 2. Canonical Endpoint Map (Source of Truth)

All tests, MSW handlers, Pact contracts, and smoke tests MUST use these exact paths. No `/api/v1/` prefix anywhere.

### core-service — port 8085

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/logout` | Any |
| POST | `/api/auth/refresh` | Public |
| POST | `/api/auth/google` | Public |
| POST | `/api/auth/change-password` | Any |
| POST | `/api/auth/validate-pin` | Public (rate-limited) |
| GET | `/api/users` | Staff/Manager |
| GET | `/api/users/{userId}` | Staff/Manager |
| PATCH | `/api/users/{userId}` | Manager |
| POST | `/api/users/{userId}/activate` | Manager |
| POST | `/api/users/{userId}/deactivate` | Manager |
| POST | `/api/users/{userId}/generate-pin` | Manager |
| POST | `/api/users/kiosk` | Manager |
| GET | `/api/users/kiosk` | Manager |
| POST | `/api/users/kiosk/{kioskUserId}/regenerate` | Manager |
| POST | `/api/users/kiosk/{kioskUserId}/deactivate` | Manager |
| POST | `/api/users/kiosk/auto-login` | Public |
| GET | `/api/users/{userId}/status` | Staff/Manager |
| PATCH | `/api/users/{userId}/status` | Any (self) |
| GET | `/api/users/{userId}/can-take-orders` | Staff/Manager |
| GET | `/api/stores` | Public |
| GET | `/api/stores/{storeId}` | Public |
| POST | `/api/stores` | Manager |
| PATCH | `/api/stores/{storeId}` | Manager |
| GET | `/api/shifts` | Staff/Manager |
| POST | `/api/shifts` | Manager |
| POST | `/api/shifts/bulk` | Manager |
| POST | `/api/shifts/copy-week` | Manager |
| GET | `/api/shifts/{shiftId}` | Staff/Manager |
| PATCH | `/api/shifts/{shiftId}` | Manager |
| DELETE | `/api/shifts/{shiftId}` | Manager |
| POST | `/api/shifts/{shiftId}/confirm` | Staff |
| POST | `/api/shifts/{shiftId}/start` | Staff |
| POST | `/api/shifts/{shiftId}/complete` | Staff |
| POST | `/api/sessions` | Staff |
| POST | `/api/sessions/end` | Staff |
| POST | `/api/sessions/clock-in` | Manager |
| POST | `/api/sessions/clock-out` | Manager |
| GET | `/api/sessions` | Manager |
| GET | `/api/sessions/pending` | Manager |
| POST | `/api/sessions/{sessionId}/approve` | Manager |
| POST | `/api/sessions/{sessionId}/reject` | Manager |
| POST | `/api/sessions/{sessionId}/break` | Manager |
| GET | `/api/customers` | Manager |
| POST | `/api/customers` | Public/Internal |
| GET | `/api/customers/stats` | Manager |
| GET | `/api/customers/{id}` | Manager/Customer |
| PATCH | `/api/customers/{id}` | Manager |
| POST | `/api/customers/{id}/activate` | Manager |
| POST | `/api/customers/{id}/deactivate` | Manager |
| POST | `/api/customers/{id}/loyalty` | Manager |
| POST | `/api/customers/{id}/addresses` | Customer |
| PATCH | `/api/customers/{id}/addresses/{addressId}` | Customer |
| DELETE | `/api/customers/{id}/addresses/{addressId}` | Customer |
| POST | `/api/customers/{id}/tags` | Manager |
| DELETE | `/api/customers/{id}` | Manager (GDPR) |
| POST | `/api/customers/get-or-create` | Internal only (blocked at gateway) |
| GET | `/api/notifications` | Any |
| POST | `/api/notifications` | Staff/Manager |
| PATCH | `/api/notifications/{id}/read` | Any |
| PATCH | `/api/notifications/read-all` | Any |
| DELETE | `/api/notifications/{id}` | Any |
| POST | `/api/notifications/rating/send` | Manager |
| POST | `/api/campaigns` | Manager |
| PATCH | `/api/campaigns/{id}` | Manager |
| POST | `/api/campaigns/{id}/schedule` | Manager |
| POST | `/api/campaigns/{id}/execute` | Manager |
| POST | `/api/campaigns/{id}/cancel` | Manager |
| GET | `/api/campaigns` | Manager |
| GET | `/api/campaigns/{id}` | Manager |
| DELETE | `/api/campaigns/{id}` | Manager |
| GET | `/api/preferences/{userId}` | Any |
| PATCH | `/api/preferences/{userId}` | Any |
| DELETE | `/api/preferences/{userId}` | Any |
| GET | `/api/reviews` | Manager |
| POST | `/api/reviews` | Customer |
| GET | `/api/reviews/stats` | Manager |
| GET | `/api/reviews/public/token/{token}` | Public |
| POST | `/api/reviews/public/submit` | Public |
| GET | `/api/reviews/{reviewId}` | Manager |
| PATCH | `/api/reviews/{reviewId}` | Manager |
| DELETE | `/api/reviews/{reviewId}` | Manager |
| POST | `/api/reviews/{reviewId}/response` | Manager |
| GET | `/api/reviews/response-templates` | Manager |
| GET | `/api/staff/earnings/weekly` | Staff/Manager |
| GET | `/api/staff/earnings/history` | Staff/Manager |
| GET | `/api/staff/pay-rates` | Manager |
| POST | `/api/staff/pay-rates` | Manager |
| GET | `/api/gdpr/consent` | Any |
| POST | `/api/gdpr/consent` | Any |
| DELETE | `/api/gdpr/consent` | Any |
| POST | `/api/gdpr/request` | Any |
| GET | `/api/gdpr/request` | Any |
| POST | `/api/gdpr/request/{requestId}/process` | Manager |
| GET | `/api/gdpr/export/{userId}` | Manager |
| GET | `/api/gdpr/audit/{userId}` | Manager |
| GET | `/api/system/version` | Public |
| GET | `/api/system/updates/check` | Manager |
| GET | `/api/system/updates/status` | Manager |
| GET | `/api/system/health` | Public |
| GET | `/api/system/info` | Manager |

### commerce-service — port 8084

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/menu` | Public |
| GET | `/api/menu/{id}` | Public |
| POST | `/api/menu` | Manager |
| POST | `/api/menu/bulk` | Manager |
| PATCH | `/api/menu/{id}` | Manager |
| DELETE | `/api/menu/{id}` | Manager |
| POST | `/api/menu/copy` | Manager |
| PATCH | `/api/menu/items/{id}/allergens` | Manager |
| GET | `/api/menu/stats` | Manager |
| POST | `/api/orders` | Any |
| GET | `/api/orders/{orderId}` | Staff/Manager/Customer |
| GET | `/api/orders/track/{orderId}` | Public |
| GET | `/api/orders` | Staff/Manager |
| POST | `/api/orders/{orderId}/status` | Staff/Manager |
| POST | `/api/orders/{orderId}/next-stage` | Kitchen |
| PATCH | `/api/orders/{orderId}` | Staff/Manager |
| DELETE | `/api/orders/{orderId}` | Manager |
| PATCH | `/api/orders/{orderId}/payment` | Internal |
| POST | `/api/orders/{orderId}/quality-checkpoint` | Kitchen |
| PATCH | `/api/orders/{orderId}/quality-checkpoint/{checkpointName}` | Kitchen |
| GET | `/api/orders/analytics` | Manager |
| POST | `/api/orders/gdpr/anonymize` | Internal |
| POST | `/api/orders/{orderId}/tip` | Customer |
| GET | `/api/staff/tips/pending` | Staff |
| GET | `/api/equipment` | Staff/Manager |
| POST | `/api/equipment` | Manager |
| GET | `/api/equipment/{equipmentId}` | Staff/Manager |
| PATCH | `/api/equipment/{equipmentId}` | Staff/Manager |
| DELETE | `/api/equipment/{equipmentId}` | Manager |
| POST | `/api/equipment/{equipmentId}/maintenance` | Manager |
| GET | `/api/aggregators/connections` | Manager |
| PUT | `/api/aggregators/connections` | Manager |

### logistics-service — port 8086

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/delivery/dispatch` | Manager/Internal |
| POST | `/api/delivery/route` | Driver/Internal |
| POST | `/api/delivery/accept` | Driver |
| POST | `/api/delivery/reject` | Driver |
| POST | `/api/delivery/location` | Driver |
| GET | `/api/delivery/track/{orderId}` | Public |
| POST | `/api/delivery/verify` | Driver |
| POST | `/api/delivery/{orderId}/otp` | Driver/Internal |
| GET | `/api/delivery/driver/{driverId}/pending` | Driver/Manager |
| GET | `/api/delivery/driver/{driverId}/performance` | Manager |
| GET | `/api/delivery/zones` | Public |
| POST | `/api/delivery/{trackingId}/status` | Driver |
| PATCH | `/api/delivery/driver/{driverId}/status` | Driver |
| GET | `/api/delivery/driver/{driverId}/status` | Manager |
| GET | `/api/delivery/metrics` | Manager |
| GET | `/api/delivery/drivers/available` | Manager/Internal |
| POST | `/api/delivery/gdpr/anonymize` | Internal |
| GET | `/api/inventory` | Manager |
| POST | `/api/inventory` | Manager |
| GET | `/api/inventory/{id}` | Manager |
| PATCH | `/api/inventory/{id}` | Manager |
| DELETE | `/api/inventory/{id}` | Manager |
| POST | `/api/inventory/{id}/stock` | Manager/Internal |
| GET | `/api/inventory/value` | Manager |
| GET | `/api/suppliers` | Manager |
| POST | `/api/suppliers` | Manager |
| GET | `/api/suppliers/{id}` | Manager |
| PATCH | `/api/suppliers/{id}` | Manager |
| DELETE | `/api/suppliers/{id}` | Manager |
| GET | `/api/suppliers/compare` | Manager |
| GET | `/api/purchase-orders` | Manager |
| POST | `/api/purchase-orders` | Manager |
| GET | `/api/purchase-orders/{id}` | Manager |
| PATCH | `/api/purchase-orders/{id}` | Manager |
| DELETE | `/api/purchase-orders/{id}` | Manager |
| POST | `/api/purchase-orders/auto-generate` | Manager/Internal |
| GET | `/api/waste` | Manager |
| POST | `/api/waste` | Staff/Manager |
| GET | `/api/waste/{id}` | Manager |
| PATCH | `/api/waste/{id}` | Manager |
| DELETE | `/api/waste/{id}` | Manager |
| GET | `/api/waste/analytics` | Manager |

### payment-service — port 8089

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/payments/initiate` | Customer/Staff |
| POST | `/api/payments/verify` | Customer |
| POST | `/api/payments/cash` | Staff |
| GET | `/api/payments/{transactionId}` | Manager/Customer |
| GET | `/api/payments` | Manager |
| POST | `/api/payments/{transactionId}/reconcile` | Manager |
| POST | `/api/payments/gdpr/anonymize` | Internal |
| POST | `/api/payments/refund` | Manager |
| GET | `/api/payments/refund/{refundId}` | Manager |
| GET | `/api/payments/refund` | Manager |
| POST | `/api/payments/webhook` | Public (Razorpay signature verified) |
| POST | `/api/payments/webhook/stripe` | Public (Stripe signature verified) |

### intelligence-service — port 8087

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/analytics` | Manager |
| POST | `/api/analytics/cache/clear` | Manager |
| GET | `/api/bi` | Manager |
| GET | `/api/bi/reports` | Manager |

**Total: ~175 endpoints** (matches documented count)

---

## 3. Frontend API Mismatch Register

These are confirmed mismatches between what RTK Query slices call and what the backend actually serves. Every test and MSW handler must use the **Backend Actual** column.

| Slice | Frontend Calls | Backend Actual | Fix Required |
|-------|---------------|----------------|--------------|
| `authApi` | `/users/login`, `/users/register`, `/users/logout`, `/users/refresh`, `/users/auth/google` | `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/refresh`, `/api/auth/google` | Fix authApi baseUrl + paths |
| `sessionApi` | `/users/sessions/start`, `/users/sessions/end`, `/users/sessions/clock-in-with-pin` | `/api/sessions` (POST), `/api/sessions/end`, `/api/sessions/clock-in` | Fix sessionApi paths |
| `equipmentApi` | `/kitchen-equipment`, `/kitchen-equipment/{id}/status` | `/api/equipment`, `/api/equipment/{id}` | Fix equipmentApi paths |
| `notificationApi` | Mix of `/notifications/send` and `/api/notifications/{id}/read` | `/api/notifications` consistently | Fix inconsistency |
| `analyticsApi` | `baseUrl+/analytics` then absolute `/api/bi/executive-summary` | `/api/analytics`, `/api/bi` | Fix BI endpoint paths |
| `inventoryApi` | `baseUrl+/inventory` then `/suppliers`, `/purchase-orders` | `/api/suppliers`, `/api/purchase-orders` | Fix supplier/PO paths in inventoryApi |
| `driverApi` | `/delivery/location-update` | `/api/delivery/location` | Fix path |
| `shiftApi` | `/shifts/bulk-create` | `/api/shifts/bulk` | Fix path |
| `orderApi` | PATCH `/{orderId}/status` | POST `/{orderId}/status` | Fix HTTP method |
| `PaymentControllerTest` | `/api/v1/payments/*` | `/api/payments/*` | Fix stale test paths |

---

## 4. Testing Architecture

### 4.1 — The Model

Industry standard for this scale is the **Testing Trophy** (not pyramid):

```
         /‾‾‾‾‾‾‾‾‾‾‾\
        /   E2E (few)   \          Playwright — critical user journeys only
       /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
      /  Integration (most) \      Spring @WebMvcTest + Testcontainers + Vitest+MSW
     /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
    /    Unit (service logic)  \   JUnit5+Mockito (backend) + Vitest pure logic (frontend)
   /______Static (always on)____\  TypeScript strict, ESLint, SpotBugs
```

### 4.2 — Backend Folder Structure (per service)

Every service MUST adopt this structure:

```
src/test/
  java/com/MaSoVa/{service}/
    unit/
      controller/
        {Name}ControllerTest.java      ← @ExtendWith(MockitoExtension) + standaloneSetup MockMvc
      service/
        {Name}ServiceTest.java         ← @ExtendWith(MockitoExtension) + @Mock deps
      domain/
        {Name}EntityTest.java          ← plain Java, no Spring
    integration/
      controller/
        {Name}ControllerIT.java        ← @SpringBootTest + @AutoConfigureMockMvc + Testcontainers
      repository/
        {Name}RepositoryIT.java        ← @DataMongoTest or @DataJpaTest + Testcontainers
      messaging/
        {Name}EventIT.java             ← @SpringRabbitTest or RabbitMQContainer
    contract/
      {Name}PactVerificationIT.java    ← @Provider + @PactFolder
  resources/
    application-test.yml               ← test profile: in-memory or Testcontainer URIs
    pacts/                             ← pact files from frontend consumer tests
```

**Naming convention (Maven Surefire/Failsafe):**
- `*Test.java` → runs with `mvn test` (Surefire — fast, no Docker)
- `*IT.java` → runs with `mvn verify` (Failsafe — Testcontainers, Docker required)

### 4.3 — Backend Testcontainers Strategy

**Singleton pattern with `withReuse(true)`** — containers start once per test run, reused across all IT classes in a service.

New base class in shared-models (published as test-jar):

```java
// BaseFullIntegrationTest — MongoDB + PostgreSQL + Redis
@SpringBootTest
@Testcontainers
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseFullIntegrationTest {
    @Container
    static final MongoDBContainer mongo = new MongoDBContainer("mongo:7.0").withReuse(true);
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16").withReuse(true);
    @Container
    static final GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379).withReuse(true);

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry r) {
        r.add("spring.data.mongodb.uri", mongo::getReplicaSetUrl);
        r.add("spring.datasource.url", postgres::getJdbcUrl);
        r.add("spring.data.redis.host", redis::getHost);
        r.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }
}

// BaseMessagingIntegrationTest — adds RabbitMQ
public abstract class BaseMessagingIntegrationTest extends BaseFullIntegrationTest {
    @Container
    static final RabbitMQContainer rabbit = new RabbitMQContainer("rabbitmq:3.12-alpine")
        .withReuse(true);
    // DynamicPropertySource for rabbit
}
```

**Testcontainer versions to add to poms (1.19.3 — matches existing commerce/payment):**

| Service | Add |
|---------|-----|
| core-service | `junit-jupiter`, `mongodb`, `postgresql`, `rabbitmq` |
| commerce-service | `postgresql` (mongodb already there) |
| logistics-service | `junit-jupiter`, `mongodb`, `postgresql` |
| payment-service | `postgresql` (mongodb already there) |
| intelligence-service | `junit-jupiter`, `mongodb` |
| api-gateway | `junit-jupiter` |

### 4.4 — Unit Test Coverage Targets Per Service

| Service | Controllers | Services | Target new unit tests |
|---------|------------|----------|----------------------|
| core-service | 14 (excl. TestData) | 30 | ~120 tests |
| commerce-service | 6 (excl. WebSocket) | 10 | ~40 more tests |
| logistics-service | 5 | 13 | ~80 tests |
| payment-service | 4 | 5 | ~20 more tests |
| intelligence-service | 1 | 5 | ~25 tests |
| api-gateway | filters | handlers | ~10 more tests |

Pattern for every controller unit test:
```java
@ExtendWith(MockitoExtension.class)
@DisplayName("{ControllerName} Unit Tests")
class {Name}ControllerTest {
    @Mock private {Service} service;
    @InjectMocks private {Controller} controller;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }
    // Test: happy path 200/201, not found 404, validation 400, unauthorized 403
}
```

### 4.5 — Integration Test Coverage Targets Per Service

One `*ControllerIT.java` per controller — hits real DB via Testcontainers, tests full request→response cycle including auth headers, DB state assertions.

One `*RepositoryIT.java` per repository — tests custom queries, index behavior, JSONB fields, pagination.

### 4.6 — RabbitMQ Event Tests

**Services and flows:**

| Producer | Event | Consumer | Test class |
|----------|-------|----------|------------|
| commerce-service | `OrderCreatedEvent` | logistics-service (dispatch) | `OrderCreatedEventIT.java` |
| commerce-service | `OrderStatusChangedEvent` (READY) | logistics-service (driver assign) | `OrderReadyEventIT.java` |
| payment-service | `PaymentConfirmedEvent` | commerce-service (order PAID) | `PaymentConfirmedEventIT.java` |
| commerce-service | `OrderStatusChangedEvent` (any) | core-service (notification) | `OrderNotificationEventIT.java` |
| commerce-service | `OrderStatusChangedEvent` (any) | intelligence-service (analytics) | `OrderAnalyticsEventIT.java` |

Use `@SpringRabbitTest` embedded broker for handler unit tests (fast, no Docker).
Use `RabbitMQContainer` for full publish→consume integration tests.

### 4.7 — Pact Contract Tests

**Consumer (frontend — rewrite 6 broken files):**

```typescript
// Correct pattern — @pact-foundation/pact v4, NOT jest-pact
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'commerce-service',
  dir: path.resolve(process.cwd(), 'pacts'),
});
```

Files to rewrite:
- `order-service.pact.test.ts` → `commerce-service.pact.test.ts` (rename + rewrite)
- `menu-service.pact.test.ts` → rewrite using correct API
- `payment-service.pact.test.ts` → rewrite, remove `/api/v1/` paths
- `user-service.pact.test.ts` → rewrite
- `delivery-service.pact.test.ts` → rewrite
- `customer-service.pact.test.ts` → rewrite
- Keep `order.pact.test.ts` — this one is already correct

**Provider (backend — add to each service):**

```java
@Provider("commerce-service")
@PactFolder("src/test/resources/pacts")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CommercePactVerificationIT {
    @TestTarget
    public final Target target = new SpringBootHttpTarget();
    
    @State("order exists with id ORDER-123")
    void orderExists() { /* seed test data */ }
}
```

**CI fix:** Remove `continue-on-error: true` from `pact-tests` job in `api-contract-validation.yml`.

### 4.8 — API Endpoint Discovery & Smoke Tests

Extend `scripts/test-api-full.js` with three phases:

1. **Discover** — hit `/actuator/mappings` on each live service, extract all registered routes
2. **Diff** — compare: discovered vs OpenAPI spec vs documented 175 — any delta = logged finding
3. **Smoke** — hit each discovered endpoint with auth token + minimal request body, verify expected status code

Spec files in `specs/` must be refreshed from live Dell services before running.

### 4.9 — Frontend Test Structure

**Co-location standard** — tests live next to source files:

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx          ← co-located
  pages/
    manager/
      DashboardPage.tsx
      DashboardPage.test.tsx   ← co-located
  hooks/
    useToast.ts
    useToast.test.ts           ← co-located
  store/
    api/
      orderApi.ts
      orderApi.test.ts         ← co-located
  test/                        ← shared infrastructure ONLY (no test files here)
    setup.ts
    utils/
      renderWithProviders.tsx
      createTestStore.ts
    mocks/
      server.ts
      handlers/
        auth.ts                ← renamed from authHandlers.ts
        orders.ts              ← renamed from orderHandlers.ts
        payments.ts            ← renamed from paymentHandlers.ts
        menu.ts
        users.ts
        delivery.ts
        customers.ts
        inventory.ts
        notifications.ts
        sessions.ts
        reviews.ts
        analytics.ts
    fixtures/
      orders.ts                ← renamed from mockOrders.ts
      menu.ts                  ← renamed from mockMenu.ts
      users.ts                 ← renamed from mockUsers.ts
      store.ts                 ← renamed from mockStore.ts
      payments.ts              ← renamed from mockPayments.ts
      delivery.ts              ← renamed from mockDelivery.ts
```

**MSW handler fix — all handlers must use `/api/` prefix:**

```typescript
// WRONG (current)
http.get(`${API}/orders`, ...)          // resolves to localhost:8080/orders

// CORRECT
http.get(`${API}/api/orders`, ...)      // resolves to localhost:8080/api/orders
```

**RTK Query cache reset between tests:**
```typescript
afterEach(() => {
  server.resetHandlers();
  store.dispatch(apiSlice.util.resetApiState()); // required for RTK Query
  cleanup();
});
```

**Coverage gaps to fill (priority order):**

1. All 13 untested RTK Query API slices (agentApi, aggregatorApi, driverApi, equipmentApi, fiscalApi, kioskApi, notificationApi, reviewApi, sessionApi, shiftApi, storeApi + gaps in existing)
2. All 52 untested pages (manager sub-pages, staff, auth, driver, pos, kiosk, executive)
3. All 40 untested components (forms, modals, gdpr, charts, backgrounds)
4. All 9 untested hooks

### 4.10 — Playwright E2E Structure

```
tests/
  e2e/
    auth/
      staff-login.spec.ts        ← existing login.spec.ts → move here
      customer-login.spec.ts     ← existing → move
      register.spec.ts           ← existing → move
    customer/
      checkout.spec.ts           ← existing → move
      order-flow.spec.ts         ← NEW: cart → checkout → payment → tracking
      menu-browse.spec.ts        ← from public-menu.spec.ts
    manager/
      dashboard.spec.ts          ← existing → move + expand
      inventory.spec.ts          ← NEW
      staff-management.spec.ts   ← NEW
      orders.spec.ts             ← NEW
    staff/
      kitchen-display.spec.ts    ← existing → move + expand
      driver-flow.spec.ts        ← NEW
    public/
      homepage.spec.ts           ← existing → move
      promotions.spec.ts         ← existing → move
      navigation.spec.ts         ← existing → move
    accessibility.spec.ts        ← existing → move, expand with axe
  page-objects/
    auth/
      StaffLoginPage.ts
      CustomerLoginPage.ts
      RegisterPage.ts
    customer/
      MenuPage.ts                ← existing → move
      CartPage.ts                ← existing → move
      CheckoutPage.ts            ← existing → move
      OrderTrackingPage.ts       ← existing → move
    manager/
      DashboardPage.ts           ← existing → move
      InventoryPage.ts           ← NEW
    staff/
      KitchenDisplayPage.ts      ← NEW
  fixtures/
    auth.fixture.ts              ← NEW: Playwright test.extend() pattern
    data.fixture.ts              ← NEW
  utils/
    test-helpers.ts              ← merge auth.ts + auth.helpers.ts + navigation.helpers.ts
playwright.config.ts
```

**Auth fixture (replace hard-coded credentials):**
```typescript
// fixtures/auth.fixture.ts
export const test = base.extend<{ staffPage: Page; managerPage: Page }>({
  staffPage: async ({ page }, use) => {
    await page.goto('/staff-login');
    await page.fill('[placeholder="Enter your work email"]',
      process.env.TEST_STAFF_EMAIL ?? 'rahul.staff@masova.com');
    await page.fill('[placeholder="Enter your password"]',
      process.env.TEST_STAFF_PASSWORD ?? 'staff123');
    await page.getByRole('button', { name: /Sign In/ }).click();
    await page.waitForURL('**/kitchen**');
    await use(page);
  },
});
```

---

## 5. Coverage Gates

### Backend (JaCoCo — add to root pom.xml)

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.11</version>
  <executions>
    <execution>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>verify</phase>
      <goals><goal>report</goal></goals>
    </execution>
    <execution>
      <id>check</id>
      <phase>verify</phase>
      <goals><goal>check</goal></goals>
      <configuration>
        <rules>
          <rule>
            <limits>
              <limit>
                <counter>LINE</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.80</minimum>
              </limit>
              <limit>
                <counter>BRANCH</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.70</minimum>
              </limit>
            </limits>
          </rule>
        </rules>
        <excludes>
          <exclude>**/*Application.class</exclude>
          <exclude>**/*Config.class</exclude>
          <exclude>**/*Configuration.class</exclude>
          <exclude>**/dto/**</exclude>
          <exclude>**/entity/**</exclude>
        </excludes>
      </configuration>
    </execution>
  </executions>
</plugin>
```

### Frontend (Vitest — raise thresholds)

```typescript
// vitest.config.ts
thresholds: {
  lines: 80,
  branches: 75,
  functions: 80,
  statements: 80,
}
```

---

## 6. CI/CD Pipeline

### Revised ci.yml — 5 jobs

```
Job 1: unit-tests          ← mvn test -pl all-services (Surefire only — fast, no Docker)
Job 2: integration-tests   ← mvn verify -pl all-services (Failsafe — Testcontainers)
                              needs: unit-tests
Job 3: contract-tests      ← npm run test:pact (generate) → backend pact verify
                              needs: integration-tests
                              NO continue-on-error
Job 4: frontend-tests      ← Vitest + coverage gate 80% + TypeScript check
                              runs parallel with Job 1
Job 5: e2e                 ← Playwright 4-shard matrix
                              needs: [frontend-tests, integration-tests]
                              grep-invert: [NEEDS BACKEND] (skip backend-dependent in CI)
```

### New: Smoke test workflow (manual trigger only)

```yaml
# .github/workflows/smoke.yml
on:
  workflow_dispatch:
    inputs:
      target:
        description: 'Dell IP (default 192.168.50.88)'
        default: '192.168.50.88'
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node scripts/test-api-full.js
        env:
          DELL_IP: ${{ inputs.target }}
```

---

## 7. Observability Gaps

### 7.1 — Prometheus metrics (confirmed missing in 4 services)

**Confirmed state:**
- logistics-service: ✅ has `micrometer-registry-prometheus`
- intelligence-service: ✅ has actuator config (health, info, metrics)
- core-service: ❌ no prometheus dep, no actuator exposure config
- commerce-service: ❌ no prometheus dep, no actuator exposure config
- payment-service: ❌ no prometheus dep, no actuator exposure config
- api-gateway: ❌ no actuator exposure config

Add to poms (core, commerce, payment):
```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

Add to all 6 service `application.yml` files:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,mappings
  endpoint:
    health:
      show-details: when-authorized
```

### 7.2 — Structured logging (confirmed state per service)

**Confirmed:**
- core-service: ✅ `[correlationId=%X{correlationId:-N/A}]` pattern present
- commerce-service: ✅ `[correlationId=%X{correlationId:-N/A}]` pattern present
- intelligence-service: ✅ `[correlationId=%X{correlationId:-N/A}]` pattern present
- payment-service: ❌ no logging pattern in yml
- logistics-service: ❌ no logging pattern in yml
- api-gateway: ❌ simplified `"%d{yyyy-MM-dd HH:mm:ss} - %msg%n"` — no correlationId

Add to payment-service, logistics-service, api-gateway `application.yml`:
```yaml
logging:
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} [correlationId=%X{correlationId:-N/A}] - %msg%n"
```

### 7.3 — Verify circuit breaker annotations are on Feign clients

`CircuitBreakerConfiguration` exists in shared-models. Need to audit that each `@FeignClient` interface in every service actually has `@CircuitBreaker(name="serviceName", fallbackMethod="fallback")` annotations applied — configuration alone doesn't activate circuit breakers.

---

## 8. Security Hardening

### 8.1 — Refresh token rotation (missing)

`POST /api/auth/refresh` should:
1. Validate incoming refresh token against Redis blacklist
2. Issue new access token + new refresh token
3. Blacklist the old refresh token immediately
4. If old refresh token reused after blacklisting → revoke entire session

### 8.2 — Access token expiry (confirmed: 1 hour — too long)

All services confirmed at `access-token-expiration: 3600000` (60 minutes).
Industry standard: 15 minutes (900000ms).
Change to 900000ms across all 6 service `application.yml` files.
Kiosk token is 8 hours (28800000ms) — acceptable for kiosk use case, keep as-is.

### 8.3 — CSP headers on frontend

Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.razorpay.com wss:">
```

### 8.4 — CORS (confirmed state)

**Gateway (CorsConfig.java):** Explicit origin allowlist — localhost:3000, localhost:5173, vercel domains. Good. One issue: `allowedHeaders: List.of("*")` — wildcard headers with credentials enabled is an OWASP flag. Change to explicit list: `Authorization`, `Content-Type`, `X-Selected-Store-Id`, `X-User-Id`, `X-User-Type`.

**Services (SecurityConfigurationBase):** `.cors(AbstractHttpConfigurer::disable)` — CORS disabled at service level. This is intentional (gateway handles CORS) but means direct service access has no CORS protection. Document as an explicit architectural assumption: all traffic MUST go through gateway.

### 8.5 — Default JWT secret (confirmed same across all 6 services)

All services share the same default `JWT_SECRET` fallback. Production MUST override this with `secrets.JWT_SECRET` — which `deploy.yml` does. Confirmed correct. But the default secret in source code is long enough (256-bit) and should be replaced with a placeholder like `CHANGE_ME_IN_PRODUCTION` to make it obvious.

---

## 9. Repo Hygiene

### 9.1 — Remove from main branch

```
/archive/          ← old pre-merge services
/backups/          ← pre-phase1 backups
/.worktrees/       ← leftover worktree directories
```

These are committed to main and bloat the repo. Move to git tags or delete.

### 9.2 — Frontend index.html

Add before `</head>`:
```html
<meta name="description" content="MaSoVa — Restaurant management system for staff, kitchen, drivers and customers">
<meta name="theme-color" content="#D32F2F">
<link rel="manifest" href="/manifest.json">
<meta property="og:title" content="MaSoVa Restaurant Management">
<meta property="og:description" content="Complete restaurant operations platform">
<meta property="og:type" content="website">
```

### 9.3 — PWA manifest

`/public/manifest.json` exists but is not linked in `index.html`. Link it (done above).

### 9.4 — Code splitting

Extend `React.lazy()` beyond manager shell — all major route groups should be lazy loaded:
```tsx
const CustomerApp = React.lazy(() => import('./apps/CustomerApp'));
const DriverApp = React.lazy(() => import('./apps/DriverApp'));
const POSSystem = React.lazy(() => import('./apps/POSSystem'));
const KitchenDisplay = React.lazy(() => import('./pages/kitchen/KitchenDisplayPage'));
```

### 9.5 — CLAUDE.md per service

Each of the 6 services + frontend gets a `CLAUDE.md` with:
- How to run tests: `mvn test` (unit), `mvn verify` (integration + coverage)
- Base classes: `BaseServiceTest` (unit), `BaseFullIntegrationTest` (integration)
- Testcontainer versions: `1.19.3`
- JaCoCo threshold: 80% line / 70% branch
- Canonical API paths (no `/api/v1/` prefix)
- Which RTK Query slice maps to this service's endpoints

---

## 10. What To Do In Order

### Phase 0 — Deployment Blockers (do these first, nothing else matters until fixed)
1. Fix duplicate Flyway versions in commerce-service (V6, V7 conflicts)
2. Fix frontend `VITE_API_GATEWAY_URL` crash — align env var naming or add fallback
3. Add missing env vars to `deploy.yml` (SPRING_DATASOURCE_URL, STRIPE_*, TWILIO_*, FIREBASE_*)
4. Fix `VITE_WS_URL` in `.env.example` from port 8083 → 8084
5. Rewrite `api-contract-validation.yml` to use current 5 services (not dead pre-Phase1 names)

### Phase A — Foundation (unblock everything else)
6. Fix `shared-models` test-jar publication
7. Add `application-test.yml` to core, commerce, logistics, intelligence
8. Add missing Testcontainer deps to all poms
9. Add JaCoCo to root pom
10. Fix MSW handlers `/api/` prefix in all 13 handler files
11. Fix RTK Query slice mismatches (authApi, sessionApi, equipmentApi, analyticsApi, inventoryApi, driverApi, shiftApi, orderApi method)
12. Fix `PaymentControllerTest` stale `/api/v1/` paths

### Phase B — Backend Tests
8. Reorganize test folders into `unit/`, `integration/`, `contract/` per service
9. Write unit tests for all 0-coverage controllers and services (logistics, intelligence, core gaps)
10. Write integration tests (`*IT.java`) for all controllers across 6 services
11. Write repository integration tests for custom queries
12. Write RabbitMQ event flow tests for 5 critical flows

### Phase C — Contract Tests
13. Rewrite 6 broken Pact consumer files in frontend
14. Write Pact provider verification tests in each backend service
15. Remove `continue-on-error` from CI pact job

### Phase D — Frontend Tests
16. Move test files to co-located structure
17. Rename handler and fixture files (remove prefix/suffix)
18. Write missing Vitest tests for all 52 untested pages, 40 components, 13 API slices, 9 hooks
19. Raise Vitest coverage thresholds to 80%

### Phase E — E2E & CI
20. Reorganize Playwright tests into domain folders
21. Rewrite auth fixture with `test.extend()`
22. Expand thin specs (kitchen-display, manager-dashboard)
23. Add new Playwright flows (order-to-delivery, inventory, driver OTP)
24. Add Playwright job with 4-shard matrix to `ci.yml`
25. Add coverage report upload to CI
26. Add smoke test `workflow_dispatch` workflow

### Phase F — Observability & Security
27. Add Prometheus micrometer to missing services
28. Verify structured logging pattern in all `application.yml`
29. Audit circuit breaker annotations on Feign clients
30. Implement refresh token rotation in AuthController
31. Add CSP headers to `index.html`
32. Audit CORS config in all services

### Phase G — Repo Hygiene & Polish
33. Remove `/archive/`, `/backups/`, `/.worktrees/` from main
34. Add SEO meta + PWA link to `index.html`
35. Extend `React.lazy()` to all major route groups
36. Write CLAUDE.md for each of 6 services + frontend

---

## 11. Definition of Done

The quality initiative is complete when:

**Deployment blockers (must be green before anything ships):**
- [ ] commerce-service starts without Flyway exception (V6/V7 conflict fixed)
- [ ] `npm run build` in frontend succeeds with production env vars (no VITE_API_GATEWAY_URL crash)
- [ ] `deploy.yml` has all required env vars (SPRING_DATASOURCE_URL, STRIPE_*, TWILIO_*, FIREBASE_*)
- [ ] `api-contract-validation.yml` uses current 5 services, not pre-Phase1 names

**Testing:**
- [ ] `mvn test` passes on all 6 services — unit tests only, no Docker needed, < 3 min
- [ ] `mvn verify` passes on all 6 services — integration + coverage gate 80% line
- [ ] `npm run test:coverage` passes — ≥ 80% lines across all frontend modules
- [ ] `npm run test:pact` generates pact files — 0 TODO stubs remaining
- [ ] All backend services have Pact provider verification passing
- [ ] `npx playwright test` passes — all specs green, no NEEDS BACKEND failures in headless mode
- [ ] CI pipeline: all 5 jobs pass on a clean PR to main
- [ ] Smoke script: 175 endpoints discovered, 0 undocumented, 0 missing

**Code quality:**
- [ ] Zero stale `/api/v1/` paths in any test file
- [ ] Zero MSW handler URL mismatches
- [ ] `allowedHeaders` in CorsConfig is explicit (not wildcard)
- [ ] All 6 services have `access-token-expiration: 900000` (15 min)
- [ ] All 6 services have actuator prometheus endpoint exposed
- [ ] payment-service, logistics-service, api-gateway have correlationId logging pattern

**Repo hygiene:**
- [ ] Repo has no `/archive/`, `/backups/`, `/.worktrees/` on main
- [ ] `index.html` has SEO meta, OG tags, manifest link
- [ ] `VITE_WS_URL` corrected to port 8084

---

*Spec written: 2026-05-15. Based on exhaustive codebase audit + industry research.*
*Last updated: 2026-05-15 — added 5 deployment blockers from application.yml + CI workflow audit.*
*Next step: invoke `superpowers:writing-plans` to create the implementation plan.*
