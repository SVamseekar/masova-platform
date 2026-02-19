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

| Gap | Impact | Effort |
|-----|--------|--------|
| No async messaging (all HTTP sync) | High coupling, cascading failures | Medium |
| 11 services → operational overhead | Deployment complexity, resource cost | High |
| No Redis JWT blacklist | Logout doesn't invalidate tokens | Low |
| No CI/CD pipeline | Manual deploys, regression risk | Medium |
| TrackingPage TypeScript errors | Customer feature broken | Low |
| Session bugs (refresh = logout) | Customer UX broken everywhere | Medium |

---

## Phase 0: RabbitMQ — Async Event Bus (Week 1–2)

**Why first:** Every other phase assumes reliable async messaging. Order events, notification fanout, delivery dispatch, and AI agent integration all benefit from decoupled message queues. This is purely additive — it does not replace existing REST endpoints.

### 0.1 Current Synchronous Call Chain (The Problem)

Today, when an order is placed, this synchronous chain fires:

```
Customer → API Gateway → Order Service
                              ↓ HTTP (sync)
                         Customer Service (update stats)
                              ↓ HTTP (sync)
                         Notification Service (send email)
                              ↓ HTTP (sync)
                         Delivery Service (create tracking record)
```

If Notification Service is slow, the order placement request hangs. If Delivery Service is down, order placement fails entirely. This is the core architectural weakness.

### 0.2 RabbitMQ Topology Design

**Exchange Architecture:**

```
masova.orders.topic    (topic exchange)
masova.payments.topic  (topic exchange)
masova.delivery.topic  (topic exchange)
masova.dlx            (dead letter exchange — fanout)
```

**Routing Key Convention:** `{service}.{entity}.{event}`

| Routing Key | Producer | Consumers |
|---|---|---|
| `order.order.placed` | order-service | notification-service, customer-service, delivery-service |
| `order.order.status_changed` | order-service | notification-service, analytics-service |
| `order.order.dispatched` | order-service | delivery-service, notification-service |
| `payment.payment.completed` | payment-service | order-service, notification-service, analytics-service |
| `payment.payment.refunded` | payment-service | order-service, notification-service |
| `delivery.driver.location_updated` | delivery-service | (future: real-time push via WebSocket bridge) |

**Queue Bindings:**

```
notification.order.queue    → binds masova.orders.topic   with order.order.*
notification.payment.queue  → binds masova.payments.topic with payment.payment.*
customer.stats.queue        → binds masova.orders.topic   with order.order.placed
delivery.dispatch.queue     → binds masova.orders.topic   with order.order.dispatched
analytics.events.queue      → binds masova.orders.topic   with order.order.*
                             + binds masova.payments.topic with payment.payment.*
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

| Before (11 services) | After (6 services) | Rationale |
|---|---|---|
| api-gateway | api-gateway | Must stay separate — traffic routing layer |
| user-service + customer-service | core-service | User management and customer profiles are tightly coupled (same customer entity, shared JWT context) |
| menu-service + inventory-service | commerce-service | Menu items reference inventory; recipe management lives in both |
| order-service + analytics-service | order-service | Analytics queries directly over order data — embedded is faster and simpler |
| payment-service | payment-service | **MUST stay standalone** — PCI DSS scope isolation, Razorpay webhook receiver, GDPR financial data |
| delivery-service | logistics-service | Currently standalone but small — keep separate for GPS/WebSocket concerns |
| notification-service | notification-service | Cross-cutting concern; all services publish to it via RabbitMQ; stays separate |
| review-service | → core-service | Review entities link to orders and customers; fold into core |

**Final architecture:**
```
api-gateway        (port 8080) — Spring Cloud Gateway
core-service       (port 8081) — users, customers, reviews, GDPR
commerce-service   (port 8082) — menu, inventory, recipes, suppliers
order-service      (port 8083) — orders, kitchen workflow, analytics
payment-service    (port 8086) — payments, refunds, Razorpay
logistics-service  (port 8085) — delivery, driver tracking, dispatch
notification-svc   (port 8089) — email (Brevo), SMS, push, campaigns
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
masova_core_db     (users, customers, reviews, GDPR logs)
masova_commerce_db (menu items, inventory, recipes, suppliers)
masova_orders_db   (orders, kitchen queue)
masova_payment_db  (payments, refunds — restricted access)
masova_logistics_db (delivery trackings, driver locations)
masova_notification_db (notification logs, campaigns)
```

### 1.4 Gateway Route Updates

Update `api-gateway/src/main/resources/application.yml` routes:
- `/api/users/**` → `core-service`
- `/api/customers/**` → `core-service`
- `/api/reviews/**` → `core-service`
- `/api/menu/**` → `commerce-service`
- `/api/inventory/**` → `commerce-service`

### 1.5 Verification

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

| Component | Service | Cost |
|---|---|---|
| Backend (6 services) | Google Cloud Run | ~$0 with GCP credit (scale-to-zero) |
| Web Frontend | Firebase Hosting | Free tier (10GB/month) |
| MongoDB | MongoDB Atlas M0 | Free (512MB) — upgrade to M10 ($57/mo) for production |
| RabbitMQ | CloudAMQP Little Lemur | Free (1M messages/month) |
| Redis | Upstash Redis | Free (10K commands/day) |
| Customer Mobile | Expo EAS Build | $0 for small teams |
| Driver App | Google Play Store | $25 one-time |
| AI Agent | Cloud Run (same project) | ~$0 with credit |

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

## Technical Debt Register

Items that should be fixed opportunistically:

| Item | File | Effort |
|---|---|---|
| `review-service` not in parent pom.xml | `pom.xml` | 5 min |
| `notification-service` port conflict (8089 vs 8092) | `application.yml` | 5 min |
| `analytics-service` port conflict (8085 vs 8090) | `application.yml` | 5 min |
| Remove `.bak` files from manager pages | `frontend/src/pages/manager/` | 10 min |
| `start-services.sh` deleted but referenced | `README.md` | 15 min |
| `docs_backup_2025/` staged for deletion | git | `git rm -r docs_backup_2025/` |
| `imp_docs/` staged for deletion | git | `git rm -r imp_docs/` |

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
WEEK 17–18: AI chatbot enhancements
WEEK 19–20: AI voice calls (Gemini + Twilio)
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
- Voice: customer can ask "What's on the menu today?" and hear a spoken response
- Payment preferences: returning customer checkout is 2 clicks

---

## Appendix: Key File Locations

| Topic | Files |
|---|---|
| API Gateway routes | `api-gateway/src/main/resources/application.yml` |
| Service ports | Each `*/src/main/resources/application.yml` |
| JWT handling | `user-service/.../service/JwtService.java` |
| Order status flow | `order-service/.../entity/Order.java` (enum comments) |
| Delivery types | `delivery-service/.../entity/DeliveryTracking.java` |
| Notification channels | `notification-service/.../service/` (EmailService, SmsService, PushService) |
| Email provider | `notification-service/.../config/BrevoConfig.java` (Brevo/SendInBlue) |
| Frontend design tokens | `frontend/src/styles/design-tokens.ts` |
| Neumorphic components | `frontend/src/components/ui/neumorphic/` |
| RTK Query APIs | `frontend/src/store/api/` |
| AI agent | `/Users/souravamseekarmarti/Projects/masova-support/src/masova_agent/` |
| Mobile app | `/Users/souravamseekarmarti/Projects/masova-mobile/src/` |
| Driver app | `/Users/souravamseekarmarti/Projects/MaSoVaDriverApp/src/` |
| DB seed script | `scripts/seed-database.js` |
