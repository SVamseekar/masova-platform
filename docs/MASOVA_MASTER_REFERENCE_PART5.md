# MaSoVa Platform — Master Reference Document
## Part 5 of 5: Security, Events, Operations, Testing & Cross-Cutting Concerns

---

## 15. SECURITY ARCHITECTURE

### 15.1 Authentication Overview

The platform uses three authentication mechanisms:

| Mechanism | Used for | Notes |
|-----------|----------|-------|
| JWT (HS512) | All API calls | Primary method |
| PIN-based | Kiosk/POS terminals | 6-digit + 2-digit suffix |
| Google OAuth2 | Customer login | RS256 ID token validation |

---

### 15.2 JWT Token Details

**Algorithm:** HS512 (symmetric, 256-bit minimum secret — `JWT_SECRET` env var)

**Token payload:**
```json
{
  "sub": "userId",
  "userType": "CUSTOMER|MANAGER|ASSISTANT_MANAGER|STAFF|DRIVER|KIOSK",
  "storeId": "storeId (staff only — not present for CUSTOMER)",
  "iat": 1712345678,
  "exp": 1712349278
}
```

**Expiry times:**
| Token | Access | Refresh |
|-------|--------|---------|
| Customer | 1 hour (3,600,000 ms) | 7 days (604,800,000 ms) |
| Staff/Manager/Driver | 1 hour | 7 days |
| Kiosk | 8 hours | 24 hours |

**JWT validation flow (API Gateway):**
1. Extract Bearer token from `Authorization` header
2. Verify HMAC-SHA512 signature with `JWT_SECRET`
3. Check expiry (`exp` claim)
4. Check Redis DB 0 blacklist (`token:{jti}` key) — if present → 401
5. Validate `storeId` present for staff roles (MANAGER, ASSISTANT_MANAGER, STAFF, DRIVER, KIOSK) → 403 if missing
6. Set downstream headers: `X-User-Id`, `X-User-Type`, `X-User-Store-Id`

---

### 15.3 Token Invalidation (Logout)

**Mechanism:** Redis blacklist (DB 0)

```
Key:   token:{jti}    (JWT ID claim, or SHA256 hash of token)
Value: expiration timestamp
TTL:   Same as token expiration (auto-cleaned by Redis)
```

On logout: `UserService` adds token to blacklist immediately → effective instant logout across all instances.

---

### 15.4 PIN Authentication (Kiosk/POS)

```
PIN format: 6 digits + 2-digit terminal suffix
Storage:    employee_pin_hash (bcrypt), pin_suffix (plaintext for routing)
Generation: Random 6-digit, bcrypt hashed, suffix per terminal
Endpoint:   POST /api/users/validate-pin (Public)
Use case:   Staff auto-login on physical POS terminals
```

---

### 15.5 Google OAuth2 Flow

```
1. Frontend redirects to Google consent screen
2. Google returns authorization code (or ID token on mobile)
3. Backend POST /api/auth/google receives ID token
4. UserService validates RS256 signature via Google public keys
5. Extract email, name from claims
6. Upsert user (create if new, update lastLogin if existing)
7. Return JWT (same format as password login)
```

---

### 15.6 Authorization & Access Control

**Layer 1 — API Gateway:** Token validation, storeId enforcement for staff

**Layer 2 — Controller level:**
```java
@PreAuthorize("hasRole('MANAGER')")           // Manager only
@PreAuthorize("hasAnyRole('MANAGER','STAFF')") // Staff or above
@PreAuthorize("isAuthenticated()")             // Any valid JWT
// Public endpoints: @PermitAll or no annotation
```

**Layer 3 — Store Isolation:**
- All DB queries include `storeId` filter
- `StoreContextUtil` extracts `X-User-Store-Id` from request headers
- Manager can override with `X-Selected-Store-Id` header (view other stores)

**Layer 4 — Feign Client forwarding:**
- `JwtForwardingInterceptor` copies `Authorization` header to all inter-service Feign calls
- Services can trust headers already validated by gateway

---

### 15.7 Data Encryption

**PII Encryption (Payment Service):**
```
Algorithm: AES-256 (symmetric key in PAYMENT_ENCRYPTION_KEY env)
Fields:    Card PAN — only last 4 digits stored (rest discarded)
Service:   PiiEncryptionService (encrypt before MongoDB write, decrypt on read)
Converter: EncryptedStringReadingConverter (MongoDB type converter)
```

**Password & PIN Hashing:**
```
Algorithm: bcrypt (Spring Security PasswordEncoder, default strength 10)
Fields:    password_hash, employee_pin_hash
Policy:    Never store plaintext, never log, never return in API responses
Reset:     Email-based token link (signed URL, 1h expiry)
```

**Webhook Signature Validation:**
- Stripe: `Stripe-Signature` header validation (HMAC-SHA256)
- Razorpay: `X-Razorpay-Signature` validation (HMAC-SHA256)

---

### 15.8 GDPR Compliance

**Data Subject Rights implemented:**

| Right | Endpoint | Implementation |
|-------|----------|----------------|
| Access (SAR) | POST `/api/gdpr/data-request` (type=ACCESS) | Export all personal data as JSON |
| Deletion (DPR) | POST `/api/gdpr/data-request` (type=DELETION) | Soft-delete with cascading |
| Portability | POST `/api/gdpr/data-request` (type=PORTABILITY) | Standard format export |
| Objection | POST `/api/gdpr/data-request` (type=OBJECTION) | Opt-out of processing |

**Data Retention policies (DataRetentionService):**
- Customer profile data: 2 years
- Transaction data: 7 years (PCI DSS compliance)
- Analytics data: Configurable per category
- Auto-delete: Scheduled job checks retention dates

**Consent management:**
- Explicit opt-in required for: marketing, analytics, third-party sharing
- `GdprConsent` entity: type, status, timestamp, ip_address
- Consent withdrawal: Immediate effect, recorded in audit log

**Audit trail:**
- `DataAccessAuditService`: logs every personal data access (user, resource, action, timestamp)
- `GdprAuditLog` entity in MongoDB: immutable, append-only

---

## 16. EVENT-DRIVEN ARCHITECTURE (RabbitMQ)

### 16.1 Exchange & Queue Configuration

**Exchange 1: masova.orders.exchange**
```
Type:    topic
Durable: true
Routing: order.*
```

| Event | Routing Key | Producer | Consumers |
|-------|-------------|----------|-----------|
| OrderCreatedEvent | order.created | commerce-service | logistics, intelligence, core (notifications) |
| OrderStatusChangedEvent | order.status.{status} | commerce-service | logistics (dispatch), intelligence (analytics), core (notifications), KDS |
| OrderCancelledEvent | order.cancelled | commerce-service | payment, logistics, intelligence |

**Exchange 2: masova.notifications.exchange**
```
Type:    topic
Durable: true
Routing: notification.*
```

| Event | Routing Key | Producer | Consumers |
|-------|-------------|----------|-----------|
| EmailNotificationEvent | notification.email | core-service | Email service (Brevo) |
| SmsNotificationEvent | notification.sms | core-service | SMS service (Twilio) |
| PushNotificationEvent | notification.push | core-service | Push service (FCM) |

---

### 16.2 Event Schema

**OrderStatusChangedEvent:**
```java
{
  eventId:         UUID,
  orderId:         String,
  storeId:         String,
  timestamp:       LocalDateTime,
  previousStatus:  OrderStatus,
  newStatus:       OrderStatus,
  orderType:       OrderType (DINE_IN|DELIVERY|TAKEAWAY),
  customerId:      String,
  assignedDriverId: String (nullable),
  metadata:        Map<String, Object>
}
```

**PaymentCompletedEvent:**
```java
{
  eventId:       UUID,
  transactionId: String,
  orderId:       String,
  customerId:    String,
  storeId:       String,
  amount:        BigDecimal,
  currency:      String,
  method:        PaymentMethod,
  timestamp:     LocalDateTime
}
```

---

### 16.3 Consumer Behaviour

**Error handling:**
- Failed message processing: logged with full context (orderId, error message, stack)
- No dead letter queue configured (manual monitoring via RabbitMQ management UI)
- Retry: None automatic — manual resend via management UI

**Ordering guarantee:**
- Per-queue FIFO (within one consumer)
- No cross-queue ordering guarantees

**Consumer services:**
- `OrderEventListener` (core): notifications on order status changes
- `AnalyticsEventListener` (intel): updates analytics aggregates
- RabbitMQ consumer in masova-support: `review.created` events with rating ≤ 3 → Agent 5

---

### 16.4 WebSocket Real-Time Architecture

**Backend WebSocket endpoints:**
- Commerce Service: `/ws/orders` (STOMP broker relay)
- Logistics Service: `/ws/delivery` (STOMP broker relay)
- Gateway: `/ws` (aggregated, used by customer mobile app)

**Topics structure:**
```
/topic/store/{storeId}/orders        — New orders for store (Kitchen Display)
/topic/store/{storeId}/kitchen       — KDS updates for store
/queue/customer/{customerId}/orders  — Customer-specific order updates
/topic/delivery/{orderId}            — Delivery tracking updates
/topic/driver/{driverId}/location    — Driver GPS location
/topic/driver/{driverId}/orders      — New order assignments to driver
/topic/order/{orderId}/tracking      — Full order tracking state
```

**Publish destinations (from clients):**
```
/app/location-update    — Driver publishes GPS update
```

**Frame size limit:** 10MB (configured in Gateway Netty config for large photo uploads)

---

## 17. MULTI-REGION & LOCALISATION

### 17.1 Country Configuration

| Country | Currency | Tax | Payment Gateway |
|---------|---------|-----|----------------|
| India (IN) | INR | GST 5% | Razorpay |
| Germany (DE) | EUR | VAT 7-19% context-aware | Stripe |
| France (FR) | EUR | VAT 5.5-20% context-aware | Stripe |
| Italy (IT) | EUR | VAT 10% food | Stripe |
| Netherlands (NL) | EUR | VAT 9% food | Stripe |
| Belgium (BE) | EUR | VAT 6% food | Stripe |
| Hungary (HU) | EUR | VAT 5% food | Stripe |
| Luxembourg (LU) | EUR | VAT 3% food | Stripe |
| Ireland (IE) | EUR | VAT 9% food | Stripe |
| Switzerland (CH) | CHF | VAT 2.5% food | Stripe |
| UK (GB) | GBP | VAT 0% food, 20% alcohol | Stripe |
| USA (US) | USD | 0% (state-based, not implemented) | Stripe |
| Canada (CA) | CAD | 0% (provincial, not implemented) | Stripe |

### 17.2 VAT Context Rules

VAT rate selection: `country + orderType + productCategory`

Examples:
```
Germany DINE_IN  + FOOD:     19%
Germany TAKEAWAY + FOOD:      7%
Germany TAKEAWAY + ALCOHOL:  19%
France  TAKEAWAY + FOOD:    5.5%
France  TAKEAWAY + ALCOHOL:  20%
UK      any      + FOOD:      0%
UK      any      + ALCOHOL:  20%
```

**VatBreakdown stored per order:**
```java
{
  category: FOOD|ALCOHOL|BEVERAGE|PACKAGING,
  netAmount: BigDecimal,
  vatRate: BigDecimal,
  vatAmount: BigDecimal,
  grossAmount: BigDecimal
}
```

### 17.3 i18n (Frontend)

**Framework:** react-i18next
**Languages:** `en`, `hi` (Hindi), `de` (German), `fr` (French)
**Namespaces:** `common`, `orders`, `menu`, `notifications`, `errors`
**Usage:** `const { t } = useTranslation(); t('orders.status.PREPARING')`
**Files:** `locales/{lang}/{namespace}.json`

---

## 18. PERFORMANCE & SCALABILITY

### 18.1 Caching Strategy

| Cache | TTL | Store |
|-------|-----|-------|
| Menu items | 5 minutes | Redis |
| Store data | 10 minutes | Redis |
| User sessions | 24 hours | Redis |
| JWT blacklist | Token expiry | Redis DB 0 (auto-expires) |
| Agent sessions | 1 hour | Redis DB 1 |
| Geolocation (agent) | 1 hour | In-memory (masova-support) |

**Cache invalidation:**
- Menu: On `MenuService.updateItem()` or `storeId` change (mobile app)
- Store: On `StoreService.update()`
- User session: On logout (blacklist) or token expiry

### 18.2 Connection Pooling

| Component | Config |
|-----------|--------|
| MongoDB | 10 min, 100 max connections |
| PostgreSQL (HikariCP) | 2 min idle, 10 max connections |
| Redis (Lettuce) | 25 max idle, 50 max active |
| API Gateway (Netty) | 500 max connections, 3s acquire, 10s response |

### 18.3 Resilience4j Circuit Breakers

**Configured for:** `deliveryService`, `customerService`, `orderService` Feign clients

| Setting | Value |
|---------|-------|
| Failure rate threshold | 50% (60% for delivery/customer) |
| Slow call threshold | 80% calls > 3s |
| Sliding window | 20 calls |
| Wait in open state | 30s (15s for delivery) |
| Half-open permitted calls | 5 |

**Fallback:** Return cached data or default empty response. Circuit breaker state logged via Micrometer.

### 18.4 Async Processing

**Order status events:** Published to RabbitMQ asynchronously — notifications, analytics, dispatch all process independently

**Notifications:** Email/SMS/Push sent async — failures logged, do NOT block order workflow

**Analytics:** AnalyticsEventListener processes events independently — no sync dependency

**Rate limiting:**
```
Default:          1000 req/min per IP (API Gateway)
Order creation:   200 req/min per IP
Auth endpoints:   10 req/min (login), 5 req/min (register), 20 req/min (refresh)
Payment initiate: 50 req/min
Delivery track:   150 req/min
```

---

## 19. DEPLOYMENT & OPERATIONS

### 19.1 Docker Compose (Local Dev — Dell)

```yaml
Services:
  mongodb:   mongo:7.0, port 27017, volume: masova-mongodb-data
  redis:     redis:7.2-alpine, port 6379, volume: masova-redis-data
  rabbitmq:  rabbitmq:3.12-management, ports: 5672, 15672
  postgres:  postgres:15, port 5432, volume: masova-pg-data, db: masova_db
```

**Startup command (PowerShell, Dell):**
```powershell
docker compose up -d mongodb redis rabbitmq postgres
cd <service>
mvn spring-boot:run "-Dmaven.test.skip=true"
```

**PowerShell gotchas:**
- No `grep` → use `Select-String -Path <file> -Pattern "<term>"`
- Always quote `-D` flags: `"-Dmaven.test.skip=true"`
- YAML: `rabbitmq:` MUST be under `spring:` — wrong indentation = silent guest/guest fallback

### 19.2 Service Startup Order

```
1. mongodb, redis, rabbitmq, postgres  (infrastructure — wait for health)
2. core-service      (depends on mongo, postgres, redis)
3. commerce-service  (depends on mongo, postgres, rabbitmq)
4. payment-service   (depends on mongo, postgres, rabbitmq)
5. logistics-service (depends on mongo, postgres, rabbitmq)
6. intelligence-service (depends on mongo, rabbitmq)
7. api-gateway       (depends on all 5 services)
```

### 19.3 GCP Cloud Run Deployment

**Per service:**
```
Min instances: 1 (cost opt)
Max instances: 10 (auto-scale on CPU/memory)
Memory:        512MB–1GB per instance
Image:         openjdk:21-slim, multi-stage build
Health check:  /health endpoint, 5 retries, 60s timeout
```

**CI/CD (GitHub Actions):**
```
On push to main:
  1. Build Docker image (Dockerfile per service)
  2. Push to Artifact Registry
  3. Deploy to Cloud Run (parallel across all 5 services)
  4. Auto-rollback on failed health check
```

**Monitoring:**
- Cloud Logging: Aggregated logs from all services
- Cloud Monitoring: CPU, memory, request latency metrics
- Cloud Trace: Distributed tracing via `correlationId` header
- Alerts: On 5xx error rate, p95 latency > 2s, circuit breaker open

### 19.4 Frontend Deployment

```bash
# Build
cd frontend && npm run build    # Output: /dist

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

**Environments:**
- Production: Firebase Hosting
- Staging/Preview: Vercel
- Local: `npm run dev` (Vite HMR, :3000)

### 19.5 Database Migrations

**Flyway (PostgreSQL):**
```
Baseline: 0 (baseline-on-migrate: true)
Naming:   V{version}__{description}.sql
Schemas:  core_schema, commerce_schema, payment_schema, logistics_schema
Rule:     Append-only — NEVER edit an existing V*.sql file
Scripts:  Use IF NOT EXISTS, CREATE OR REPLACE (idempotent)
```

**Hibernate validation:**
- Production: `ddl-auto: validate` — fails on schema mismatch
- Dev: `ddl-auto: update` — auto-creates missing columns

---

## 20. TESTING ARCHITECTURE

### 20.1 Backend (JUnit 5 + Mockito + TestContainers)

**Base classes (shared-models):**
```java
BaseServiceTest        — Mock repositories, logging setup
BaseIntegrationTest    — MongoDB TestContainer, transaction rollback
```

**Test data builders:**
```java
MockFactory            — Creates mock entity instances
TestDataBuilder        — Fluent builder base
OrderTestDataBuilder   — Order test fixtures
PaymentTestDataBuilder — Payment test fixtures
MenuTestDataBuilder    — Menu test fixtures
DeliveryTestDataBuilder — Delivery test fixtures
```

**Test file naming:**
```
src/test/java/com/MaSoVa/{service}/{domain}/
├── controller/{ControllerName}Test.java
├── service/{ServiceName}Test.java
└── repository/{RepositoryName}Test.java
```

### 20.2 Frontend (Vitest + RTL + MSW + Pact)

**Integration test flows:**
- `order-creation-flow.test.ts` — Full order: add items → cart → checkout → payment
- `delivery-dispatch-flow.test.ts` — Order created → auto-dispatch → driver accepts

**Pact contract tests (`pact/pact-config.ts`):**
- Consumer-driven: frontend defines expected contract for each backend API
- Run before deploy: ensures frontend/backend API compatibility
- Verifies: request shape, response schema, status codes

**MSW mock handlers (`test/mocks/handlers.ts`):**
- All HTTP calls intercepted — no real network in test environment
- Configurable responses: success, error, edge cases

**Test fixtures:**
```
mockOrders.ts    — Order objects in various states
mockUsers.ts     — User objects per role
mockMenu.ts      — MenuItem arrays
mockPayments.ts  — Transaction objects
mockDelivery.ts  — DeliveryTracking objects
```

### 20.3 AI Agent Tests (pytest)

**test_redis_session.py (3 async tests):**
- Session stored in Redis on create
- TTL = 3600 seconds
- Falls back to in-memory when Redis unavailable

**test_connection.py:**
- Google GenAI API connectivity (generates 2-word response)

**test_scenarios.py (4 smoke tests):**
- User identification
- Menu inquiry
- Item availability check
- Order placement

---

## 21. CONFIGURATION MANAGEMENT

### 21.1 Environment Variables — All Services

**Common across all 6 services:**
```
SPRING_DATA_MONGODB_URI=mongodb://192.168.50.88:27017/masova_{service}
SPRING_DATASOURCE_URL=jdbc:postgresql://192.168.50.88:5432/masova_db?currentSchema={service}_schema
SPRING_DATASOURCE_USERNAME=masova
SPRING_DATASOURCE_PASSWORD=masova_secret
SPRING_RABBITMQ_HOST=192.168.50.88
SPRING_RABBITMQ_USERNAME=masova
SPRING_RABBITMQ_PASSWORD=masova_secret
JWT_SECRET=<64+ char key — REQUIRED, fail on missing>
```

**Inter-service URLs:**
```
CORE_SERVICE_URL=http://192.168.50.88:8085
COMMERCE_SERVICE_URL=http://192.168.50.88:8084
PAYMENT_SERVICE_URL=http://192.168.50.88:8089
LOGISTICS_SERVICE_URL=http://192.168.50.88:8086
INTELLIGENCE_SERVICE_URL=http://192.168.50.88:8087
```

**Service-specific:**
```
--- payment-service ---
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RAZORPAY_KEY_ID=rzp_test_RjYYkXMmoArj4C
RAZORPAY_KEY_SECRET=<secret>
PAYMENT_ENCRYPTION_KEY=<AES-256 key>

--- core-service ---
GOOGLE_OAUTH_CLIENT_ID=<Google OAuth client ID>
BREVO_API_KEY=<Brevo API key>
BREVO_SENDER_EMAIL=noreply@masova.com
BREVO_SENDER_NAME=MaSoVa
TWILIO_ACCOUNT_SID=<Twilio SID>
TWILIO_AUTH_TOKEN=<Twilio token>
TWILIO_FROM_NUMBER=+91...
FIREBASE_CREDENTIALS_PATH=/app/firebase-service-account.json

--- api-gateway ---
JWT_SECRET=<same key as all services>

--- logistics-service ---
GOOGLE_MAPS_API_KEY=<API key>
```

**Frontend (.env.local on Mac):**
```
VITE_API_BASE_URL=http://192.168.50.88:8080
```

**masova-support (.env):**
```
GOOGLE_API_KEY=<Google GenAI key>
MASOVA_BACKEND_URL=http://192.168.50.88:8080/api
REDIS_URL=redis://192.168.50.88:6379/1
RABBITMQ_URL=amqp://guest:guest@192.168.50.88:5672/
```

---

## 22. API PATH REFERENCE (CANONICAL — 194 LIVE ENDPOINTS)

> Full per-controller endpoint tables: see `docs/MASOVA_MASTER_REFERENCE_ENDPOINTS.md`

### Critical Path Corrections

| Wrong | Correct | Status |
|-------|---------|--------|
| `/api/kitchen-equipment` | `/api/equipment` | Fixed — gateway remaps |
| `/api/ratings/token/{token}` | `/api/reviews/public/token/{token}` | Fixed — RatingController deleted |
| `/api/v1/orders/...` | `/api/orders/...` | Fixed — no /v1/ prefix anywhere |
| `/api/users/login` | `/api/auth/login` | Fixed — AuthController split in Phase 1 |
| `/api/users/register` | `/api/auth/register` | Fixed |
| `/api/dispatch/*` | `/api/delivery/*` | Fixed — 3 controllers merged into DeliveryController |
| `/api/intelligence/*` | `/api/bi/*` | Fixed — BIController path changed |
| `/api/responses/**` | `/api/reviews/{id}/response` | Fixed — ResponseController deleted |
| `/api/sessions/employee/{id}` | `/api/sessions?employeeId={id}` | Fixed — collapsed to query param |
| `/api/delivery/verify-otp` | `/api/delivery/verify` | Fixed — path simplified |
| `/api/delivery/location-update` | `/api/delivery/location` | Fixed — path simplified |

### Canonical Session Paths
```
POST /api/sessions                           → Start session (clock in)
POST /api/sessions/end                       → End session (clock out)
GET  /api/sessions?employeeId={id}&active=true → Active session
GET  /api/sessions?employeeId={id}           → Session history
```

### Legacy Auth Aliases (still work via gateway dual-routing)
```
/api/users/login    → /api/auth/login
/api/users/register → /api/auth/register
/api/users/logout   → /api/auth/logout
/api/users/refresh  → /api/auth/refresh
/api/users/google   → /api/auth/google
```

### Key Endpoint Groups by Service

**Core Service:**
```
/api/auth/*             Authentication (login, register, logout, refresh, google)
/api/users/*            User CRUD, kiosk management
/api/customers/*        Customer management, addresses, loyalty
/api/stores/*           Store management, public store locator
/api/sessions/*         Working sessions (clock in/out)
/api/shifts/*           Shift scheduling
/api/reviews/*          Reviews and ratings
/api/notifications/*    Notifications
/api/campaigns/*        Marketing campaigns
/api/gdpr/*             GDPR data requests
/api/staff/earnings/*   Staff earnings, pay rates
```

**Commerce Service:**
```
/api/orders/*           Order lifecycle, kitchen queue, tracking
/api/menu/*             Menu items, search, recommendations
/api/equipment/*        Kitchen equipment
/api/tips/*             Gratuity management
```

**Payment Service:**
```
/api/payments/*         Initiate, verify, refund, cash, reconcile
```

**Logistics Service:**
```
/api/delivery/*         All delivery — dispatch, tracking, OTP, driver status, performance
                        (DispatchController + TrackingController + PerformanceController merged)
/api/inventory/*        Inventory items, stock adjust/reserve/release
/api/suppliers/*        Supplier management
/api/purchase-orders/*  PO lifecycle, auto-generate (AI agent)
/api/waste/*            Waste recording and approval
```

**Intelligence Service:**
```
/api/analytics          Analytics (query params: period, view, type)
/api/analytics/cache/clear  Cache management
/api/bi                 BI dashboard
/api/bi/reports         BI reports
```

---

## 23. KNOWN ISSUES & TECHNICAL DEBT

| Issue | Severity | Notes |
|-------|----------|-------|
| Dual-write consistency | Medium | MongoDB write can succeed while PostgreSQL fails — no compensating transaction |
| No dead letter queue | Medium | Failed RabbitMQ messages lost — need DLQ for critical events |
| Multi-tenancy at DB level | Low | Relies on application-level `storeId` filtering, no row-level security |
| Circuit breaker fallback | Low | Returns 503 with no fallback content — UX could degrade |
| Swagger sync | Low | Auto-generated Swagger may lag behind code changes |
| Agents 6/7/8 are stubs | Info | Shift optimisation, kitchen coach, dynamic pricing need Phase 2 PostgreSQL data |
| masova-mobile mock data | Info | HomeScreen uses hardcoded mock stores — not live API |
| SavedScreen mock data | Info | Saved items use hardcoded mock — wishlist API not wired |
| MaSoVaCrewApp ChatScreen | Info | Stub — not implemented |
| EU allergens on older items | Info | Legacy menu items may not have allergensDeclared=true |

---

## 24. DEVELOPMENT RULES & HARD CONSTRAINTS

### Backend (Spring Boot Services)
- Controllers handle HTTP only — no business logic, no direct repository calls
- Every new endpoint: `@PreAuthorize` annotation + input validation + error response body
- New service methods calling other services: use existing Feign clients — never raw `RestTemplate`
- Any `try/catch` swallowing an exception MUST log `log.warn(...)` with order/user context
- Before removing any endpoint: use search to find all callers first
- `OrderService` state transitions MUST publish to `masova.orders.exchange` via `OrderEventPublisher`
- commerce-service NEVER imports from logistics-service — use RabbitMQ events
- api-gateway is routing only — no business logic, no DB calls
- `shared-models` is single source of truth for enums — inner enums in entities must match
- New features touching >2 services: event-driven design — not synchronous chained calls
- Spring Boot 3: use `micrometer-tracing-bridge-brave` — NEVER Spring Cloud Sleuth
- Hibernate 6 JSONB: `@JdbcTypeCode(SqlTypes.JSON)` — never `@Type`
- Flyway migrations: append-only — NEVER edit an existing `V*.sql` file
- Financial data: soft delete only — add `deleted_at`, NEVER `DELETE`
- Every new MongoDB query field: corresponding `@Indexed` annotation
- `TestDataController` MUST stay behind `@Profile("dev")` — never delete it
- `POST /api/customers/get-or-create` MUST NOT be accessible via gateway — internal only

### Frontend
- Customer pages: `--dp-*` CSS vars only — never hardcode `#` colours or `px` spacing
- Staff pages: neumorphic tokens from `design-tokens.ts` only — never mix with dark-premium
- Every RTK Query endpoint uses canonical paths (194 live endpoints — no `/api/v1/` prefix)
- `deliveryFeeINR` always from `useSelector(selectDeliveryFeeINR)` — NEVER hardcoded
- Every new component: loading state + error state + empty state — all three
- TypeScript strict: no `any`, no `// @ts-ignore`
- TypeScript IIFE `(() => {...})()` inside JSX → extract to variable before `return (`

### Mobile Apps
- `RoleRouter` reads `user.type` from JWT — NEVER hardcode role checks inline in screens
- Role colours MUST never change: Driver=#00B14F, Kitchen=#FF6B35, Cashier=#2196F3, Manager=#7B1FA2
- masova-mobile is NOT Expo Go — bare RN 0.81, Metro on :8888
- Every screen calling an API: loading spinner + network error + empty data — all three
- Navigation params MUST be typed — no untyped `route.params`

### AI Agents (masova-support)
- Agents NEVER auto-write to database — they propose actions (DRAFT status), manager approves
- Every agent: `POST /agents/{name}/trigger` endpoint for manual testing
- Tool functions: `async def`, return `dict` — ADK requires this signature
- APScheduler jobs share FastAPI event loop — NEVER create `asyncio.run()` inside a job
- If Gemini/LLM call fails: fall back to rule-based — NEVER surface raw API errors to user
- Every agent action logged: agent name, trigger type, store_id, output summary

### Git & Commits
- Branching: GitHub Flow (feature branches → PR → merge to main)
- Commit format: `feat(service):`, `fix(service):`, `chore:`, `docs:`
- NEVER add "Co-Authored-By" trailer to commits
- NEVER use `ralph-loop` or `dispatching-parallel-agents` (Pro subscription — conserve quota)
- Use worktrees for destructive phases (API removal, DB migration)

---

## 25. THIRD-PARTY INTEGRATIONS SUMMARY

| Service | Purpose | Config Keys |
|---------|---------|-------------|
| Google Maps API | ETA calc, route optimisation, geocoding | `GOOGLE_MAPS_API_KEY` |
| Google OAuth2 | Customer login (mobile + web) | `GOOGLE_OAUTH_CLIENT_ID` |
| Google GenAI (Gemini) | AI support agent, review responses | `GOOGLE_API_KEY` |
| Google Cloud Run | Backend deployment | GCP project, service account |
| Firebase Hosting | Frontend deployment | Firebase project config |
| Firebase Cloud Messaging | Push notifications (mobile) | `FIREBASE_CREDENTIALS_PATH` |
| Stripe | EU/Global payment processing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Razorpay | India payment processing | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Brevo (SendinBlue) | Transactional email | `BREVO_API_KEY` |
| Twilio | SMS notifications, OTP delivery | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| ip-api.com | IP geolocation (masova-support) | No key required (free tier) |
| SunCalc | Sunrise/sunset calculation (customer app) | Library, no API key |

---

## 26. COMPLETE FILE COUNT REFERENCE

| Component | Language | File Count |
|-----------|----------|-----------|
| api-gateway | Java | 10 |
| core-service | Java | 124 |
| commerce-service | Java | 69 |
| payment-service | Java | 49 |
| logistics-service | Java | 73 |
| intelligence-service | Java | 34 |
| shared-models | Java | 96 |
| shared-security | Java | 3 |
| **Total Java** | | **458** |
| frontend/src | TypeScript/TSX | 395+ |
| masova-support/src | Python | ~40 |
| MaSoVaCrewApp/src | TypeScript/TSX | ~120 |
| masova-mobile/src | TypeScript/TSX | ~100 |
| **Total frontend/mobile** | | **~755** |

---

## 27. QUICK REFERENCE — START EVERYTHING

**1. Start Dell infrastructure (PowerShell):**
```powershell
docker compose up -d mongodb redis rabbitmq postgres
```

**2. Start backend services (PowerShell, one terminal each):**
```powershell
cd core-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd commerce-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd payment-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd logistics-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd intelligence-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd api-gateway && mvn spring-boot:run "-Dmaven.test.skip=true"
```

**3. Start frontend (Mac, :3000):**
```bash
cd frontend && npm run dev
```

**4. Start AI support agent (Mac, :8000):**
```bash
cd /Users/souravamseekarmarti/Projects/masova-support
uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload
```

**5. Start customer mobile app (Mac, Metro :8888):**
```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
npm start              # Metro bundler
npm run android        # Run on Android
```

**6. Start crew app (Mac):**
```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaCrewApp
npm start
npm run android
```

**7. Verify health:**
```bash
curl http://192.168.50.88:8080/health     # API Gateway
curl http://192.168.50.88:8085/health     # Core
curl http://192.168.50.88:8084/health     # Commerce
curl http://192.168.50.88:8089/health     # Payment
curl http://192.168.50.88:8086/health     # Logistics
curl http://192.168.50.88:8087/health     # Intelligence
curl http://localhost:8000/health          # AI Agent (Mac)
```

**8. Swagger UI (all services aggregated):**
```
http://192.168.50.88:8080/swagger-ui.html
```

---

*End of MaSoVa Platform Master Reference Document (5 parts)*

*Generated: 2026-05-05*
*Based on: complete codebase analysis of all 6 backend services, frontend web app, masova-support AI agent, MaSoVaCrewApp, and masova-mobile*
