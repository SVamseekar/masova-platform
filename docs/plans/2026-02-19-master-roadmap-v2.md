# MaSoVa Master Roadmap v2
**Version:** 2.0
**Date:** 2026-02-19
**Author:** Architecture Review (Senior UI/UX + Java + Cloud)
**Status:** Active — supersedes all prior roadmap documents

---

## Executive Summary

MaSoVa is a production-grade restaurant management platform comprising 5 projects: a Spring Boot microservices backend (11 services, Java 21, MongoDB), a React 19 web frontend, a React Native customer mobile app (Expo 54), a React Native driver/staff app (RN 0.83), and a Python AI support agent (Google ADK + Gemini). The platform handles the full restaurant lifecycle: ordering, kitchen workflow, delivery, payments, loyalty, analytics, and staff management.

This document defines the complete evolution roadmap ordered by technical dependency and business impact. Every phase decision is grounded in what actually exists in the codebase today.

---

## Current State Assessment

### What Works Well
- **Backend**: All 11 services are feature-complete with proper Resilience4j circuit breakers, JWT authentication flowing through the API Gateway, MongoDB auditing, GDPR data handling, and Brevo email notifications.
- **Web Frontend**: Neumorphic design system is fully built and consistent. RTK Query handles all API calls. Role-based routing works for customer, manager, kitchen, driver, POS, and kiosk.
- **Customer Mobile**: Feature-complete. Menu browsing, cart, Razorpay checkout, STOMP WebSocket order tracking, Google Maps driver tracking, Google Sign-In — all working.
- **AI Agent**: FastAPI server running on port 8000 with Google ADK + Gemini 2.0 Flash. Five tools: get_order_status, get_menu_items, get_store_hours, submit_complaint, request_refund. Web chat widget embedded in React frontend.

### Critical Gaps (Ordered by Impact)

| Gap                                | Impact                               | Effort |
| ---------------------------------- | ------------------------------------ | ------ |
| No async messaging (all HTTP sync) | High coupling, cascading failures    | Medium |
| 11 services → operational overhead | Deployment complexity, resource cost | High   |
| No Redis JWT blacklist             | Logout doesn't invalidate tokens     | Low    |
| No CI/CD pipeline                  | Manual deploys, regression risk      | Medium |
| TrackingPage TypeScript errors     | Customer feature broken              | Low    |
| Session bugs (refresh = logout)    | Customer UX broken everywhere        | Medium |

---

## Phase 0: RabbitMQ — Async Event Bus (Week 1–2)

**Why first:** Every other phase assumes reliable async messaging. Order events, notification fanout, delivery dispatch, and AI agent integration all benefit from decoupled message queues. This is purely additive — it does not replace existing REST endpoints.

### 0.1 Current Synchronous Call Chain (The Problem)

**Actual ports (confirmed from application.yml files):**

| Service              | Port |
| -------------------- | ---- |
| api-gateway          | 8080 |
| user-service         | 8081 |
| menu-service         | 8082 |
| order-service        | 8083 |
| analytics-service    | 8085 |
| payment-service      | 8086 |
| inventory-service    | 8088 |
| review-service       | 8089 |
| delivery-service     | 8090 |
| customer-service     | 8091 |
| notification-service | 8092 |

**Complete synchronous HTTP call map (all calls confirmed from source code):**

| Caller           | Target                    | Endpoint                                | Circuit Breaker? | Fail Behavior           |
| ---------------- | ------------------------- | --------------------------------------- | ---------------- | ----------------------- |
| order-service    | customer-service:8091     | `POST /api/customers/{id}/update-email` | No               | Exception swallowed     |
| order-service    | customer-service:8091     | `POST /api/customers/{id}/order-stats`  | No               | Exception swallowed     |
| order-service    | delivery-service:8090     | `GET /api/delivery/zone/fee`            | Yes + Retry      | Fail-open (allow order) |
| order-service    | delivery-service:8090     | `GET /api/delivery/zone/validate`       | Yes + Retry      | Fail-open (allow order) |
| order-service    | menu-service:8082         | `GET /api/menu/public/{id}`             | Yes + Retry      | Fail-open (allow order) |
| order-service    | user-service:8081         | `GET /api/users/{driverId}`             | No               | Exception propagates    |
| order-service    | notification-service:8092 | `POST /api/notifications/send`          | No               | Exception swallowed     |
| delivery-service | order-service:8083        | `GET /api/orders/{id}`                  | Yes + Retry      | Exception propagates    |
| delivery-service | order-service:8083        | `PUT /api/orders/{id}/delivery-status`  | Yes + Retry      | Exception propagates    |
| delivery-service | order-service:8083        | `PATCH /api/orders/{id}/assign-driver`  | Yes + Retry      | Exception propagates    |
| delivery-service | order-service:8083        | `PUT /api/orders/{id}/delivery-otp`     | Yes + Retry      | Exception propagates    |
| delivery-service | order-service:8083        | `PUT /api/orders/{id}/delivery-proof`   | Yes + Retry      | Exception propagates    |
| delivery-service | order-service:8083        | `PUT /api/orders/{id}/mark-delivered`   | Yes + Retry      | Exception propagates    |
| delivery-service | user-service:8081         | `GET /api/users/drivers/available`      | No               | Exception propagates    |
| delivery-service | user-service:8081         | `GET /api/users/{driverId}`             | No               | Exception propagates    |
| delivery-service | user-service:8081         | `PUT /api/users/{driverId}/status`      | No               | Exception propagates    |
| payment-service  | order-service:8083        | `GET /api/orders/track/{id}`            | No               | Exception swallowed     |
| payment-service  | notification-service:8092 | `POST /api/notifications/send`          | No               | Exception swallowed     |

**The worst chain:** placing a delivery order hits 7 services synchronously (gateway → order → menu → delivery/zone → customer → notification → user). Any one slow service blocks the response.

Today, when an order is placed, this synchronous chain fires:

```
Customer → API Gateway → Order Service
                              ↓ HTTP (sync, no CB)
                         customer-service:8091 (update stats)
                              ↓ HTTP (sync, CB fail-open)
                         menu-service:8082 (validate items)
                              ↓ HTTP (sync, CB fail-open)
                         delivery-service:8090 (validate zone)
                              ↓ HTTP (sync, no CB)
                         notification-service:8092 (send email)
```

If Notification Service is slow, the order placement request hangs. If Delivery Service is down, zone validation fails open (order allowed) but the call still adds latency. This is the core architectural weakness.

### 0.2 RabbitMQ Topology Design

**Exchange Architecture:**

```
masova.orders.events    (topic exchange — durable)
masova.payments.events  (topic exchange — durable)
masova.delivery.events  (topic exchange — durable)
masova.notifications.events (topic exchange — durable)
masova.dlx              (topic exchange — dead letter)
```

**Routing Key Convention:** `{domain}.{event}[.{qualifier}]`

| Routing Key                | Producer          | Consumers                                                                       | Replaces                                           |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| `order.created`            | order-service     | core-service, logistics-service, intelligence-service                           | POST /customers/{id}/order-stats (fire-and-forget) |
| `order.status.dispatched`  | order-service     | core-service (notify), intelligence-service                                     | POST /notifications/send                           |
| `order.status.*`           | order-service     | intelligence-service                                                            | analytics REST queries                             |
| `order.cancelled`          | order-service     | logistics-service, payment-service                                              | manual refund trigger                              |
| `payment.completed`        | payment-service   | order-service (status update), core-service (notify), intelligence-service      | PUT /orders/{id}/delivery-status                   |
| `payment.failed`           | payment-service   | core-service (notify)                                                           | POST /notifications/send                           |
| `payment.refund.completed` | payment-service   | core-service (notify), intelligence-service                                     | POST /notifications/send                           |
| `delivery.assigned`        | logistics-service | order-service (driver assignment), core-service (notify)                        | PATCH /orders/{id}/assign-driver                   |
| `delivery.completed`       | logistics-service | order-service (mark delivered), payment-service (verify), core-service (notify) | PUT /orders/{id}/mark-delivered                    |
| `delivery.failed`          | logistics-service | order-service, payment-service (refund), core-service (notify)                  | —                                                  |
| `driver.status.*`          | core-service      | logistics-service (availability cache)                                          | GET /users/drivers/available (polling)             |

**Queue Bindings:**

```
masova.order-created.queue      → masova.orders.events   # order.created
masova.order-status.queue       → masova.orders.events   # order.status.*
masova.delivery-assigned.queue  → masova.delivery.events # delivery.assigned
masova.delivery-completed.queue → masova.delivery.events # delivery.completed
masova.payment-completed.queue  → masova.payments.events # payment.completed
masova.payment-failed.queue     → masova.payments.events # payment.failed
masova.send-notification.queue  → masova.notifications.events # notification.send.*
masova.dlx.queue                → masova.dlx             # # (catch-all, 3-day TTL)
```

### 0.3 Implementation Plan

**Step 1: Add RabbitMQ to docker-compose.yml**
```yaml
rabbitmq:
  image: rabbitmq:3.12-management-alpine
  ports:
    - "5672:5672"
    - "15672:15672"
  environment:
    RABBITMQ_DEFAULT_USER: masova
    RABBITMQ_DEFAULT_PASS: masova_dev
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
  healthcheck:
    test: ["CMD", "rabbitmq-diagnostics", "ping"]
    interval: 30s
    timeout: 10s
    retries: 5
```

**Step 2: Add AMQP dependency to each producer/consumer service pom.xml**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

**Step 3: Create `shared-models` RabbitMQ config module**
File: `shared-models/src/main/java/com/MaSoVa/shared/messaging/RabbitMQConfig.java`
- Declare all exchanges, queues, bindings as `@Bean`
- Configure Jackson2JsonMessageConverter for JSON serialization
- Configure RetryTemplate for publisher confirms

**Step 4: Create event DTOs in shared-models**
```
shared-models/src/main/java/com/MaSoVa/shared/events/
├── OrderPlacedEvent.java      (orderId, customerId, storeId, total, orderType, items)
├── OrderStatusChangedEvent.java (orderId, oldStatus, newStatus, timestamp)
├── OrderDispatchedEvent.java  (orderId, driverId, deliveryAddress, estimatedArrival)
├── PaymentCompletedEvent.java (paymentId, orderId, amount, method, transactionId)
└── PaymentRefundedEvent.java  (paymentId, orderId, refundAmount, reason)
```

**Step 5: Refactor order-service to publish events**
In `OrderService.java`, after saving order state changes:
```java
// Replace synchronous HTTP calls with event publishing
rabbitTemplate.convertAndSend(
    "masova.orders.topic",
    "order.order.placed",
    new OrderPlacedEvent(order)
);
```

**Step 6: Add @RabbitListener consumers to notification-service, customer-service, delivery-service, analytics-service**

**Step 7: Configure Dead Letter Queue handling**
Failed messages → `masova.dlq` → logged to MongoDB `failed_events` collection → manual retry UI in manager dashboard.

### 0.4 Backward Compatibility


The existing REST endpoints remain unchanged. RabbitMQ is additive. During transition, both the synchronous call AND the async event fire — once consumers are verified stable, remove the synchronous fallback calls one by one.

### 0.5 Verification

- `docker-compose up rabbitmq` → Management UI at `http://localhost:15672`
- Place a test order → confirm events appear in RabbitMQ Management → confirm notification email arrives async
- Simulate notification-service down → order placement succeeds, event queues, notification delivered when service recovers

---

## Phase 1: Service Consolidation (Week 3–5)

**Why:** 11 services means 11 JVM processes, 11 MongoDB connection pools, 11 health check endpoints, 11 log streams. For a team of 1-3 developers, this operational overhead slows feature development and inflates cloud costs. The goal is 6 services that retain logical separation via package structure.

### 1.1 Consolidation Map

| Before (11 services)                                                    | After (6 services)   | Rationale                                                                                                       |
| ----------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| api-gateway                                                             | api-gateway          | Must stay separate — traffic routing layer                                                                      |
| user-service + customer-service + notification-service + review-service | core-service         | All deal with people data, same JWT context, notification naturally owned by core since it has user preferences |
| menu-service + order-service                                            | commerce-service     | Menu availability is checked on every order — co-location eliminates the most frequent cross-service call       |
| payment-service                                                         | payment-service      | **MUST stay standalone** — PCI DSS scope isolation, Razorpay webhook receiver, GDPR financial data              |
| delivery-service + inventory-service                                    | logistics-service    | Both deal with physical movement of goods; inventory depletion fires when orders are dispatched                 |
| analytics-service                                                       | intelligence-service | Rename + make fully event-driven (no more REST queries to order-service)                                        |

**Final architecture:**
```
api-gateway          (port 8080) — Spring Cloud Gateway
core-service         (port 8085) — users, customers, reviews, notifications, GDPR
commerce-service     (port 8084) — menu, orders, pricing, kitchen workflow
payment-service      (port 8089) — payments, refunds, Razorpay (standalone)
logistics-service    (port 8086) — delivery, driver tracking, inventory, zones
intelligence-service (port 8087) — analytics (fully event-driven, no REST reads)
```

### 1.2 Migration Strategy (Zero Downtime)

**Do NOT do a big-bang rewrite.** Instead:

1. Create new Maven modules (`core-service`, `commerce-service`) as siblings
2. Copy entity + repository + service + controller packages verbatim
3. Add all dependencies from source services to destination pom.xml
4. Run both old and new services simultaneously behind the gateway
5. Test new service with 10% traffic (gateway weighted routing)
6. Switch 100% traffic to new service
7. Delete old service module

**Package structure for core-service:**
```
com.MaSoVa.core/
├── user/           (from user-service)
│   ├── entity/
│   ├── service/
│   ├── controller/
│   └── repository/
├── customer/       (from customer-service)
│   ├── entity/
│   ├── service/
│   ├── controller/
│   └── repository/
└── review/         (from review-service)
    ├── entity/
    ├── service/
    ├── controller/
    └── repository/
```

### 1.3 Database Strategy

**Keep separate MongoDB databases per logical domain** — do not merge into one database. The benefit of consolidation is fewer JVM processes, not fewer databases.

```
masova_core        (users, customers, reviews, notifications, templates, campaigns, GDPR logs)
masova_commerce    (menu items, orders, order items, rating tokens, pricing rules)
masova_payment     (transactions, refunds — restricted access, separate credentials)
masova_logistics   (delivery trackings, driver locations, inventory, waste records, zones)
masova_analytics   (events TTL 90d, hourly_metrics, daily_metrics, reports)
```

### 1.4 Gateway Route Updates

Update `api-gateway/src/main/resources/application.yml` routes:
- `/api/users/**` → `core-service:8085`
- `/api/customers/**` → `core-service:8085`
- `/api/reviews/**` → `core-service:8085`
- `/api/notifications/**` → `core-service:8085`
- `/api/menu/**` → `commerce-service:8084`
- `/api/orders/**` → `commerce-service:8084`
- `/api/delivery/**` → `logistics-service:8086`
- `/api/inventory/**` → `logistics-service:8086`
- `/api/analytics/**` → `intelligence-service:8087`
- `/api/payments/**` → `payment-service:8089`

### 1.5 Effort Estimate

| Task                                                         | Days |
| ------------------------------------------------------------ | ---- |
| Shared messaging module (events, config, publishers)         | 6    |
| commerce-service merge (menu + order)                        | 8    |
| core-service merge (user + customer + notification + review) | 11   |
| logistics-service merge (delivery + inventory)               | 8    |
| payment-service event publishers                             | 3    |
| intelligence-service event listeners + pre-aggregation       | 7    |
| Database migration scripts                                   | 2    |
| Integration testing + chaos testing                          | 7    |
| CI/CD + deployment updates                                   | 2    |

tail -f /tmp/masova-logs/<service-name>.log| **Total**                                                    | **~55 days (3 months with 2 backend devs, 6 months solo)** |

### 1.6 Verification

- All 6 services start with `mvn spring-boot:run`
- All existing Swagger UI endpoints respond correctly
- Postman regression test suite passes
- Frontend in dev mode works without any API URL changes (gateway handles routing)

---

## Phase 2: Infrastructure (Week 6–7)

### 2.1 Redis JWT Blacklist (Critical Security Fix)

**The bug:** When a user logs out, their JWT remains valid until expiry (typically 24h). A stolen token can be used after logout.

**Fix:** Add Redis to track invalidated tokens.

```xml
<!-- user-service pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

```java
// In JwtService.java — add to blacklist on logout
public void invalidateToken(String token) {
    long expiryMs = getExpiration(token).getTime() - System.currentTimeMillis();
    redisTemplate.opsForValue().set(
        "blacklisted:" + token, "1",
        expiryMs, TimeUnit.MILLISECONDS
    );
}

// In JwtAuthFilter.java — check blacklist on every request
public boolean isTokenBlacklisted(String token) {
    return Boolean.TRUE.equals(redisTemplate.hasKey("blacklisted:" + token));
}
```

Add Redis to docker-compose.yml:
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  command: redis-server --appendonly yes
  volumes:
    - redis_data:/data
```

### 2.2 Session Bug Fix (Refresh = Logout)

**The bug:** Token refresh fails silently, user is logged out on page reload or after token expiry.

**Root cause investigation needed:** Check `useTokenRefresh.tsx` hook and the `/auth/refresh` endpoint. Likely causes:
- Refresh token not persisted in httpOnly cookie (stored in localStorage = wiped on logout)
- Race condition: multiple simultaneous refresh calls (parallel API requests all trigger refresh)
- Gateway not forwarding refresh tokens

**Fix approach:**
1. Store refresh token in `sessionStorage` with encryption
2. Add request queue in `axios.ts` interceptor: when refresh is in-flight, queue all other requests
3. Ensure gateway route `/api/auth/refresh` is public (no JWT validation filter)
4. Add refresh token rotation: each refresh returns a new refresh token

### 2.3 Store Delivery Radius (Domino's-style)

Each store needs a configurable delivery radius. Orders placed from outside the radius should be rejected at checkout.

**Backend:** Add `deliveryRadiusKm` field to Store entity. Add validation in order-service when `orderType = DELIVERY`.

**Frontend checkout:** Use browser Geolocation API + Haversine formula to compute distance to selected store. Show warning if outside radius before allowing delivery order.

**Admin:** Store Management page in manager dashboard gets a radius input field (1–25 km slider).

### 2.4 CI/CD Pipeline

**GitHub Actions workflow:** `.github/workflows/ci.yml`

```yaml
on: [push, pull_request]
jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports: ["27017:27017"]
      rabbitmq:
        image: rabbitmq:3.12-alpine
        ports: ["5672:5672"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '21', distribution: 'temurin' }
      - run: mvn test -pl order-service,user-service,payment-service

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run test:run

  deploy-staging:
    needs: [backend-test, frontend-test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to Cloud Run staging"
```

### 2.5 Hosting Architecture

**Recommended for MaSoVa (with ₹917/month Google AI Pro credit):**

| Component            | Service                  | Cost                                                  |
| -------------------- | ------------------------ | ----------------------------------------------------- |
| Backend (6 services) | Google Cloud Run         | ~$0 with GCP credit (scale-to-zero)                   |
| Web Frontend         | Firebase Hosting         | Free tier (10GB/month)                                |
| MongoDB              | MongoDB Atlas M0         | Free (512MB) — upgrade to M10 ($57/mo) for production |
| RabbitMQ             | CloudAMQP Little Lemur   | Free (1M messages/month)                              |
| Redis                | Upstash Redis            | Free (10K commands/day)                               |
| Customer Mobile      | Expo EAS Build           | $0 for small teams                                    |
| Driver App           | Google Play Store        | $25 one-time                                          |
| AI Agent             | Cloud Run (same project) | ~$0 with credit                                       |

**Domain setup:** `masova.app` (web), `api.masova.app` (gateway), `agent.masova.app` (AI)

**Estimated monthly cost after GCP credit:** ~$0–20 for development/staging. Production with real traffic: ~$50–150/month.

---

## Phase 3: Feature Roadmap (Week 8–16)

These are the 19 points from the handwritten roadmap, reprioritized by dependency and business value.

### 3.1 Critical Fixes (Do Now — Bugs Blocking Customers)

**TrackingPage TypeScript Fix:**
File: `frontend/src/pages/customer/TrackingPage.tsx`
- `DeliveryLocation` is GeoJSON: `{ type: 'Point', coordinates: [lng, lat] }` — NOT `{ latitude, longitude }`
- Use `delivery.destination.coordinates[1]` for lat, `coordinates[0]` for lng
- Remove non-existent fields: `deliveryAddress`, `pickupAddress` on `TrackingResponse`
- Fix: ~30 min of surgical TypeScript corrections

**Payment Preferences Storage:**
Store customer's preferred payment method (UPI, card, wallet) in customer-service after each successful payment. Pre-select it at next checkout. Reduces checkout friction from 4 steps → 2 steps.

### 3.2 UI/UX Revamps (High Visibility)

**Login Page Revamp** (`frontend/src/pages/auth/LoginPage.tsx`)
- Remove all emojis → replace with MUI icons
- Add all 5 staff roles to demo grid: Manager, Kitchen, Driver, Cashier, Assistant Manager
- Left panel: brand identity (logo, tagline, subtle food photography)
- Mobile responsive: single column stack
- Add "Forgot Password" flow with email OTP

**KDS Revamp** (`frontend/src/pages/kitchen/KitchenDisplayPage.tsx`)
- Summary bar: total active orders, avg prep time, longest waiting
- Urgency color system: green (0–5 min), amber (5–10), red (10+), pulsing animation
- Sound alerts on new orders (Web Audio API)
- Full-screen mode toggle (F key or button) — essential for wall-mounted displays
- One-click bump with large touch targets (tablet-friendly)
- Optimized for 1080p display with larger typography

**Customer Web Revamp** (`frontend/src/pages/customer/`)
- MenuPage: food-first grid layout with large imagery, sticky category filters
- CartPage: slide-up drawer with smooth spring animations
- All customer pages: consistent neumorphic tokens, mobile-first viewport
- Skeleton loaders replacing all spinners

**masova-mobile UI Match Web Design**
The mobile app must visually match the web app's brand language. Currently uses default React Native Paper styling.
- Apply MaSoVa brand tokens (red primary ~#D32F2F, dark background, gold accents)
- Glassmorphism cards per the design system plan in `docs/project/APPS/MOBILE_DESIGN_SYSTEM_PLAN.md`
- Smooth screen transitions via react-navigation animations
- Skeleton loading screens throughout

### 3.3 Staff App Conversion (MaSoVaDriverApp)

Convert from driver-only to multi-role staff app. Role detection at login reads `user.type` from JWT.

**New navigation stacks:**
- `DRIVER` → existing delivery screens (unchanged)
- `KITCHEN_STAFF` → new KDS screens: order queue, order detail with timers
- `CASHIER` → simplified mobile POS: take order, select payment, print/show receipt
- `MANAGER` → quick metrics dashboard + approval actions

**New screens:**
- `src/screens/kitchen/KitchenQueueScreen.tsx` — mobile KDS view
- `src/screens/kitchen/OrderDetailScreen.tsx` — item checklist, timer, bump button
- `src/screens/pos/QuickOrderScreen.tsx` — mobile POS for walk-in
- `src/screens/manager/QuickDashboardScreen.tsx` — revenue, active orders, alerts

**Shared components:** NotificationBell, ProfileHeader, StoreSelector, StatusBadge extracted to `src/components/shared/`

### 3.4 Google Sign-In

**Backend (user-service):**
- Add `authProviders` array to User entity: `[{provider, providerId, email}]`
- Add `POST /api/auth/google` endpoint: validate Google ID token → create/link user → return JWT
- Add `google.oauth.client-id` to application.yml

**Web frontend:**
- Install `@react-oauth/google`
- `GoogleOAuthProvider` wrapper in `App.tsx`
- "Sign in with Google" button on LoginPage and customer login

**masova-mobile:**
- `@react-native-google-signin/google-signin` already in project — wire up to backend

### 3.5 Store Selector Enhancement

Improve `frontend/src/components/StoreSelector.tsx`:
- Auto-detect nearest store using `navigator.geolocation`
- Show Open / Closed / Temporarily Closed badges
- Distance display when location is granted
- Persist selection in localStorage
- Delivery radius visualization (circle on mini-map)

### 3.6 Manager Metrics Visualization

**Standard manager page template:** KPI row → time-series chart → data table → action buttons

Charting library: **Recharts** (check if already in package.json — if not, add it)

Pages to upgrade first (highest impact):
1. `DashboardPage.tsx` — revenue sparklines, order volume chart
2. `AnalyticsPage.tsx` / `AdvancedReportsPage.tsx` — full time-series
3. `KitchenAnalyticsPage.tsx` — prep time histogram, throughput
4. `ProductAnalyticsPage.tsx` — top items bar chart, category pie

Create `frontend/src/pages/manager/ManagerMetricTemplate.tsx` as the reusable wrapper.

### 3.7 Google Maps Enhancements

**Web (already have `@react-google-maps/api` v2.20.7):**
- Delivery address autocomplete using Google Places API in checkout
- Fix TrackingPage map (after TypeScript fix)
- Reduce LiveMap.tsx re-renders on GPS updates (useMemo for markers)

**masova-mobile (`react-native-maps` v1.20.1 already installed):**
- Confirm Google Maps SDK is configured (check `app.json`)
- Add Google Places Autocomplete for delivery address input
- Live tracking map already working — verify it uses Google Maps not MapBox

### 3.8 MongoDB Schema Improvements

Based on prior audit — key fixes remaining:
- Add TTL index on `user_sessions` collection (auto-expire after 30 days)
- Add compound index on orders: `(storeId, status, createdAt)` for kitchen queue queries
- Add `2dsphere` index on `driver_locations.location` for geo queries
- Add `deliveryRadiusKm` field to Store entity (needed for Phase 3.1)
- Ensure `customerEmail` is indexed in orders for walk-in customer lookup

---

## Phase 4: AI Strategy (Week 17–20)

### 4.1 AI Chatbot Enhancement (masova-support)

**Current state:** FastAPI on port 8000, 5 tools, embedded as ChatWidget in web frontend and ChatScreen in masova-mobile.

**Enhancements:**
- Add conversation memory: store last 10 turns per session in Redis with 1h TTL
- Add intent classification before tool routing (reduces unnecessary tool calls)
- Add proactive suggestions: when user asks about an order, offer "Would you like to track it?" quick reply
- Connect complaint submission to a real support ticket in the database
- Add multilingual support (Hindi + Telugu for Hyderabad market) using Gemini's multilingual capability

**New tools to add:**
- `get_loyalty_points(customer_id)` → returns balance, tier, next reward threshold
- `get_store_wait_time(store_id)` → estimates current queue depth from order-service
- `cancel_order(order_id, reason)` → calls order-service cancel endpoint (with time window check)

### 4.2 AI Voice Calls (New Feature — Gemini Multimodal Live API + Twilio)

**Purpose:** Customer calls a Twilio phone number → Twilio streams audio → Gemini Multimodal Live API processes speech → responds in natural language → Twilio plays response. Same tools as chatbot but via voice.

**Architecture:**
```
Customer Phone Call
        ↓
   Twilio (phone number)
        ↓ WebSocket audio stream
   masova-support voice bridge
   (FastAPI + websockets)
        ↓
   Gemini Multimodal Live API
   (real-time speech understanding + generation)
        ↓ tool calls
   MaSoVa Backend APIs
   (same tools as chatbot)
```

**Implementation:**
1. Add Twilio Media Streams WebSocket endpoint to masova-support
2. Pipe audio bytes → Gemini Live API's audio input channel
3. Pipe Gemini audio output → Twilio response stream
4. Reuse existing tool definitions (get_order_status, get_menu_items, etc.)
5. Add `POST /voice/incoming` Twilio webhook handler (TwiML)

**Cost estimate:**
- Twilio phone number: ~$1/month
- Gemini Multimodal Live API: ~$0.35 per hour of audio (very low for support calls)
- Free Twilio trial: $15 credit → ~100 test calls

### 4.3 Razorpay Payment Preferences

Store per-customer payment preferences:
- `preferredMethod`: UPI | CARD | NETBANKING | WALLET
- `savedUpiId`: encrypted stored UPI ID
- `savedCardLast4`: for display only (no full card storage — PCI DSS)

After each successful payment, update preferences in customer-service. Pre-populate at next checkout. Reduces clicks from ~6 → 2 for returning customers.

---

## Phase 5: GCP Deployment (Week 21–23)

Deploy the entire MaSoVa platform to Google Cloud Platform within the AI Pro subscription ($10/month Cloud credits) and free tiers. Zero new paid services required for dev/staging. Production at real scale fits within the $10 credit.

### 5.1 Infrastructure Map

| Component                | GCP Service            | Free Tier                          | Notes                          |
| ------------------------ | ---------------------- | ---------------------------------- | ------------------------------ |
| 6 Spring Boot services   | Cloud Run              | 2M req/month + 180K vCPU-sec/month | Scale-to-zero, cold start ~10s |
| masova-support (FastAPI) | Cloud Run              | Same free tier                     | Python container               |
| Web frontend             | Firebase Hosting       | 10GB/month bandwidth               | Static Vite build              |
| MongoDB                  | Atlas M0 (free)        | 512MB storage                      | 1 cluster per project          |
| Redis                    | Upstash Redis          | 10K commands/day free              | JWT blacklist + chat sessions  |
| RabbitMQ                 | CloudAMQP Little Lemur | 1M messages/month free             | Async event bus                |
| Container images         | Artifact Registry      | 0.5GB free/month                   | All Docker images stored here  |
| CI/CD                    | GitHub Actions         | 2000 min/month free                | Auto-deploy on push to main    |
| Domains                  | Cloud DNS              | ~$0.20/month                       | `masova.app`, `api.masova.app` |
| SSL                      | Cloud Run managed      | Free                               | Auto-provisioned               |
| Gemini Live API (voice)  | Vertex AI / AI Studio  | Free tier + $10 credit             | ~$0.0002 per conversation      |
| Mobile app builds        | Expo EAS               | Free for small teams               | OTA updates free               |

**Estimated monthly cost:** $0 dev/staging · $5–10 production (within $10 credit) · $20–50 at scale (small overage)

### 5.2 Domain Architecture

```
masova.app              → Firebase Hosting (web frontend)
api.masova.app          → Cloud Run (api-gateway:8080)
agent.masova.app        → Cloud Run (masova-support:8000)
```

### 5.3 Dockerfiles

Each Spring Boot service needs a `Dockerfile`. Standard multi-stage build:

```dockerfile
# Stage 1: build
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN ./mvnw package -DskipTests

# Stage 2: runtime (smaller image)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Services needing Dockerfiles: `api-gateway`, `core-service`, `commerce-service`, `payment-service`, `logistics-service`, `intelligence-service`.

masova-support Python Dockerfile:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "masova_agent.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Frontend Dockerfile (for optional containerized deploy — Firebase Hosting is preferred):
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### 5.4 Environment Variables per Service (Cloud Run)

All secrets injected as Cloud Run environment variables (never baked into images):

```
# All backend services
SPRING_DATA_MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/masova_<db>
SPRING_REDIS_HOST=<upstash-endpoint>
SPRING_REDIS_PORT=6380
SPRING_REDIS_SSL=true
SPRING_REDIS_PASSWORD=<upstash-token>
SPRING_RABBITMQ_HOST=<cloudamqp-host>
SPRING_RABBITMQ_USERNAME=<cloudamqp-user>
SPRING_RABBITMQ_PASSWORD=<cloudamqp-pass>
JWT_SECRET=<64-char-secret>

# commerce-service + logistics-service
CORE_SERVICE_URL=https://api.masova.app

# api-gateway
CORE_SERVICE_URL=https://api.masova.app
COMMERCE_SERVICE_URL=https://api.masova.app
PAYMENT_SERVICE_URL=https://api.masova.app
LOGISTICS_SERVICE_URL=https://api.masova.app
INTELLIGENCE_SERVICE_URL=https://api.masova.app

# masova-support
GOOGLE_API_KEY=<gemini-api-key>
REDIS_URL=rediss://<upstash-token>@<upstash-endpoint>:6380
MASOVA_BACKEND_URL=https://api.masova.app
```

### 5.5 GitHub Actions CI/CD Pipeline

`.github/workflows/deploy.yml` — triggers on push to `main`, builds and deploys all services:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

env:
  PROJECT_ID: masova-app
  REGION: asia-south1   # Mumbai — closest to Hyderabad

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api-gateway, core-service, commerce-service, payment-service, logistics-service, intelligence-service]
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/setup-gcloud@v2
      - name: Build and push
        run: |
          gcloud builds submit ${{ matrix.service }} \
            --tag asia-south1-docker.pkg.dev/$PROJECT_ID/masova/${{ matrix.service }}:$GITHUB_SHA
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ matrix.service }} \
            --image asia-south1-docker.pkg.dev/$PROJECT_ID/masova/${{ matrix.service }}:$GITHUB_SHA \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --min-instances 0 \
            --max-instances 3 \
            --memory 512Mi \
            --set-env-vars-file .env.${{ matrix.service }}.yaml

  deploy-agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: souravamseekar/masova-support
          token: ${{ secrets.GITHUB_TOKEN }}
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - name: Build and deploy masova-support
        run: |
          gcloud builds submit . \
            --tag asia-south1-docker.pkg.dev/$PROJECT_ID/masova/masova-support:$GITHUB_SHA
          gcloud run deploy masova-support \
            --image asia-south1-docker.pkg.dev/$PROJECT_ID/masova/masova-support:$GITHUB_SHA \
            --region $REGION --platform managed --allow-unauthenticated

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: masova-app
```

### 5.6 One-Time Setup Steps

1. **Create GCP project** — `masova-app` in Google Cloud Console
2. **Enable APIs** — Cloud Run, Cloud Build, Artifact Registry, Cloud DNS
3. **Create service account** — `masova-deploy@masova-app.iam.gserviceaccount.com` with roles: Cloud Run Admin, Cloud Build Editor, Artifact Registry Writer
4. **MongoDB Atlas** — Create M0 free cluster, whitelist `0.0.0.0/0` for Cloud Run (dynamic IPs), create DB user
5. **Upstash Redis** — Create free database, note endpoint + token, enable TLS
6. **CloudAMQP** — Create Little Lemur free instance, note AMQP URL
7. **Firebase project** — Same `masova-app` project ID, enable Hosting, run `firebase init hosting` in `frontend/`
8. **GitHub Secrets** — Add `GCP_SA_KEY` (service account JSON), `FIREBASE_SERVICE_ACCOUNT`, all env var secrets
9. **Domain** — Point `masova.app` A record to Firebase Hosting IP, `api.masova.app` CNAME to Cloud Run URL
10. **Warm instances** — Set `--min-instances 1` on `api-gateway` and `core-service` to avoid cold starts for critical path

### 5.7 Mobile App Deployment

**masova-mobile (Expo):**
```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure
eas build:configure

# Build for production
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

Update `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.masova.app",
      "agentUrl": "https://agent.masova.app"
    }
  }
}
```

**MaSoVaDriverApp (RN 0.83):**
- Same EAS build process
- Separate app entry in Play Store / App Store
- Bundle identifier: `com.masova.driver`

### 5.8 Verification Checklist

- [ ] `https://masova.app` loads the web frontend
- [ ] `https://api.masova.app/actuator/health` returns `{"status":"UP"}` for all 6 services
- [ ] `https://agent.masova.app/health` returns `{"status":"ok"}`
- [ ] Place a test order end-to-end: web → payment → kitchen → delivery tracking
- [ ] RabbitMQ events flowing (check CloudAMQP dashboard)
- [ ] Redis JWT blacklist working (logout → token invalidated)
- [ ] Mobile app connects to `api.masova.app` (check network requests)
- [ ] GitHub Actions deploy pipeline green on push to main
- [ ] SSL certificates auto-provisioned on all domains

### 5.9 Cost Monitoring

Set up GCP budget alert at $8/month (80% of $10 credit) to get notified before overage:
```
Google Cloud Console → Billing → Budgets & alerts → Create budget → $10/month → Alert at 80%
```

---

## Technical Debt Register

Items that should be fixed opportunistically:

| Item                                                | File                          | Effort                        |
| --------------------------------------------------- | ----------------------------- | ----------------------------- |
| `review-service` not in parent pom.xml              | `pom.xml`                     | 5 min                         |
| `notification-service` port conflict (8089 vs 8092) | `application.yml`             | 5 min                         |
| `analytics-service` port conflict (8085 vs 8090)    | `application.yml`             | 5 min                         |
| Remove `.bak` files from manager pages              | `frontend/src/pages/manager/` | 10 min                        |
| `start-services.sh` deleted but referenced          | `README.md`                   | 15 min                        |
| `docs_backup_2025/` staged for deletion             | git                           | `git rm -r docs_backup_2025/` |
| `imp_docs/` staged for deletion                     | git                           | `git rm -r imp_docs/`         |

---

## Execution Timeline

```
WEEK 1–2:   Phase 0 — RabbitMQ event bus
WEEK 3–5:   Phase 1 — Service consolidation
WEEK 6–7:   Phase 2 — Infrastructure (Redis, sessions, CI/CD, hosting)
WEEK 8:     Critical fixes (TrackingPage, payment preferences)
WEEK 9–10:  KDS revamp + Login revamp
WEEK 11–12: Customer web + mobile UI revamps
WEEK 13–14: Staff app conversion + Google Sign-In
WEEK 15–16: Manager metrics + Store selector + Maps
WEEK 17–18: AI chatbot enhancements + Redis sessions + new tools
WEEK 19–20: AI voice (Gemini Live API — browser + mobile, free via AI Pro credits)
WEEK 21–23: Phase 5 — GCP deployment (Cloud Run + Firebase + Atlas + Upstash + CloudAMQP)
```

---

## Definition of Done Per Phase

**Phase 0 (RabbitMQ):**
- `docker-compose up` starts RabbitMQ management UI at `:15672`
- Place order → notification email arrives without blocking the order API response
- Kill notification-service → orders still placed → email queued → arrives when service restarts

**Phase 1 (Consolidation):**
- 6 services start with `./start-all.sh`
- All Swagger docs accessible
- Frontend works without changes (gateway routes unchanged)
- All 11 original services' tests pass in new service structure

**Phase 2 (Infrastructure):**
- Logout → immediately invalidated token → 401 on retry
- Page refresh → session maintained without re-login
- GitHub Actions CI green on every push to main
- Staging environment deployed on Cloud Run

**Phase 3 (Features):**
- TrackingPage renders driver map for DISPATCHED orders (no TypeScript errors)
- KDS full-screen mode works on 1080p display, sounds play on new orders
- masova-mobile matches web brand colors within ±5% visual similarity
- All 5 staff roles accessible in MaSoVaDriverApp after login

**Phase 4 (AI):**
- Chat widget: conversation memory maintained across 10 turns, responses <2s
- Voice: customer can speak to the AI and hear a spoken response (Gemini Live API, free via AI Pro)
- Payment preferences: returning customer checkout is 2 clicks

**Phase 5 (Deployment):**
- `https://masova.app` serves the web frontend via Firebase Hosting
- `https://api.masova.app/actuator/health` returns UP for all 6 services on Cloud Run
- `https://agent.masova.app/health` returns ok for masova-support
- End-to-end order flow works in production (web → payment → kitchen → tracking)
- GitHub Actions auto-deploys on push to main
- Total monthly GCP cost stays within $10 AI Pro credit

---

## Appendix: Key File Locations

| Topic                  | Files                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| API Gateway routes     | `api-gateway/src/main/resources/application.yml`                                            |
| Service ports          | Each `*/src/main/resources/application.yml`                                                 |
| JWT handling           | `user-service/.../service/JwtService.java`                                                  |
| Order status flow      | `order-service/.../entity/Order.java` (enum comments)                                       |
| Delivery types         | `delivery-service/.../entity/DeliveryTracking.java`                                         |
| Notification channels  | `notification-service/.../service/` (EmailService✅, SmsService⚠️, PushService⚠️)              |
| Email provider         | `notification-service/.../config/BrevoConfig.java` (Brevo — **enabled**, 300/day free tier) |
| SMS provider           | `notification-service/.../config/TwilioConfig.java` (Twilio — **disabled** by default)      |
| Push provider          | `notification-service/.../config/FirebaseConfig.java` (FCM — **disabled** by default)       |
| Frontend design tokens | `frontend/src/styles/design-tokens.ts`                                                      |
| Neumorphic components  | `frontend/src/components/ui/neumorphic/`                                                    |
| RTK Query APIs         | `frontend/src/store/api/`                                                                   |
| AI agent               | `/Users/souravamseekarmarti/Projects/masova-support/src/masova_agent/`                      |
| Mobile app             | `/Users/souravamseekarmarti/Projects/masova-mobile/src/`                                    |
| Driver app             | `/Users/souravamseekarmarti/Projects/MaSoVaDriverApp/src/`                                  |
| DB seed script         | `scripts/seed-database.js`                                                                  |
