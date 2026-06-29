#



 MaSoVa Platform — Master Reference Document
## Part 1 of 5: Business Overview & Backend Architecture

---

## 1. BUSINESS OVERVIEW

### What is MaSoVa?

MaSoVa is a full-stack, multi-channel restaurant management platform for a multi-branch restaurant chain (with EU/US multi-region architecture built in). It covers the complete restaurant lifecycle: customer ordering (web + mobile), kitchen operations, delivery, staff management, analytics, and AI-powered decision support.

### Business Capabilities

| Capability                          | Channel                         | Status |
| ----------------------------------- | ------------------------------- | ------ |
| Customer ordering                   | Web, iOS, Android               | Live   |
| Kitchen display & prep tracking     | Web (staff), Crew app           | Live   |
| Delivery assignment & live tracking | Crew app (driver), Customer app | Live   |

| POS / Cashier order creation        | Web (kiosk mode), Crew app          | Live                      |
| Manager analytics dashboard         | Web                                 | Live                      |
| AI customer support                 | Web chat, mobile chat               | Live                      |
| Demand forecasting                  | Background agent                    | Live (scheduled)          |
| Churn prevention campaigns          | Background agent                    | Live (scheduled)          |
| Inventory reorder automation        | Background agent                    | Live (scheduled)          |
| Review response drafting            | Background agent (RabbitMQ trigger) | Live                      |
| Shift optimisation                  | Background agent                    | Stub (needs Phase 2 data) |
| Dynamic pricing                     | Background agent                    | Stub (needs Phase 2 data) |

### Cuisines & Menu Structure

8 cuisine categories: **South Indian**, **North Indian**, **Indo-Chinese**, **Italian**, **American**, **Continental**, **Beverages**, **Desserts**

40+ menu categories (DOSA, IDLY_VADA, PIZZA, PASTA, BURGER, BIRYANI, HOT_DRINKS, etc.)

### Store Locations

3 operational stores (dev seeded):
- MaSoVa Store 1 (DOM001) — 4.7★, 25 min ETA, ₹29 delivery
- MaSoVa Store 2 (DOM002) — 4.5★, 35 min ETA, ₹49 delivery
- MaSoVa Store 3 (DOM003) — 4.6★, 45 min ETA, ₹79 delivery

### Delivery Zone Pricing

| Zone        | Radius  | Fee      |
| ----------- | ------- | -------- |
| ZONE_A      | 0–3 km  | ₹29      |
| ZONE_B      | 3–6 km  | ₹49      |
| ZONE_C      | 6–10 km | ₹79      |
| Out of area | >10 km  | Rejected |

Free delivery threshold: ₹500+ order value

---

## 2. INFRASTRUCTURE OVERVIEW

### Dev Environment Split

| Machine         | Runs                                                               | Notes                |
| --------------- | ------------------------------------------------------------------ | -------------------- |
| Mac M1          | Frontend (:3000), Mobile apps, masova-support (:8000) | LAN IP auto-detected |
| Dell i3 Windows | All 6 backend services + Docker                                    | IP: 192.168.50.88    |

### Service Ports

| Service              | Port | Technology                      |
| -------------------- | ---- | ------------------------------- |
| API Gateway          | 8080 | Spring Cloud Gateway (reactive) |
| Core Service         | 8085 | Spring Boot 3, Java 21          |
| Commerce Service     | 8084 | Spring Boot 3, Java 21          |
| Payment Service      | 8089 | Spring Boot 3, Java 21          |
| Logistics Service    | 8086 | Spring Boot 3, Java 21          |
| Intelligence Service | 8087 | Spring Boot 3, Java 21          |
| Frontend             | 3000 | React 19, Vite                  |
| AI Support Agent     | 8000 | FastAPI, Python                 |

### Infrastructure Services (Docker, Dell)

| Service    | Port                               | Database                                                                         |
| ---------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| MongoDB    | 27017                              | masova_core, masova_commerce, masova_payment, masova_logistics, masova_analytics |
| PostgreSQL | 5432                               | masova_db (core_schema, commerce_schema, payment_schema, logistics_schema)       |
| Redis      | 6379                               | DB 0: JWT blacklist · DB 1: Agent sessions · Cache: menu/store/users             |
| RabbitMQ   | 5672 (AMQP), 15672 (Management UI) | masova.orders.exchange, masova.notifications.exchange                            |

### Production (GCP)

| Component            | Platform                                              |
| -------------------- | ----------------------------------------------------- |
| Backend (6 services) | GCP Cloud Run (auto-scaling 1–10 instances)           |
| Frontend             | Firebase Hosting                                      |
| Databases            | Cloud-managed MongoDB Atlas + Cloud SQL PostgreSQL    |
| Monitoring           | Cloud Logging, Cloud Monitoring, Cloud Trace          |
| CI/CD                | GitHub Actions → Artifact Registry → Cloud Run deploy |

---

## 3. BACKEND ARCHITECTURE

### Technology Stack

- **Language:** Java 21
- **Framework:** Spring Boot 3.x
- **Security:** Spring Security + JWT (HS512)
- **DB ORM:** Spring Data MongoDB + Spring Data JPA (Hibernate 6)
- **Async:** RabbitMQ (AMQP) + Spring @Async
- **Service Comm:** OpenFeign clients between services
- **Resilience:** Resilience4j (circuit breakers)
- **Docs:** SpringDoc OpenAPI (Swagger UI aggregated at gateway)
- **JSONB:** `@JdbcTypeCode(SqlTypes.JSON)` for Hibernate 6
- **Tracing:** `micrometer-tracing-bridge-brave` (NOT Spring Cloud Sleuth)

---

## 4. API GATEWAY (Port 8080)

**Location:** `/api-gateway`
**Technology:** Spring Cloud Gateway (reactive, non-blocking, Netty)
**Java Files:** 10

### Key Classes

| Class                     | Purpose                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `ApiGatewayApplication`   | Bootstrap                                                          |
| `GatewayConfig`           | Route registration — maps paths to 5 downstream services           |
| `JwtAuthenticationFilter` | Gateway-level JWT validation (HS512), extracts claims              |
| `RateLimitingFilter`      | 1000 req/min per IP (raised for POS concurrency)                   |
| `ForwardedHeaderFilter`   | Manages X-Forwarded-* headers for downstream                       |
| `CorsConfig`              | CORS policy (all origins in dev, specific in prod)                 |
| `NettyConfig`             | Connection pool: 500 max, 3s acquire timeout, 10s response timeout |
| `OpenApiConfig`           | Aggregates Swagger UI from all 5 services                          |

### JWT Validation Logic

1. Extract Bearer token from `Authorization` header
2. Validate signature (HS512, secret from env `JWT_SECRET`)
3. Check if token is blacklisted in Redis DB 0
4. Extract `sub` (userId), `userType`, `storeId` claims
5. For staff roles (MANAGER, ASSISTANT_MANAGER, STAFF, DRIVER, KIOSK): validate `storeId` is present
6. Set `X-User-Id`, `X-User-Type`, `X-User-Store-Id` headers on routed request
7. Return 401 on invalid token, 403 on missing storeId for staff

### Route Table (Gateway → Service)

| Path Pattern                                 | Downstream                 | Notes                              |
| -------------------------------------------- | -------------------------- | ---------------------------------- |
| `/api/users/**`, `/api/auth/**`              | Core Service :8085         | Auth, user management              |
| `/api/sessions/**`, `/api/shifts/**`         | Core Service :8085         | Working sessions, shift scheduling |
| `/api/customers/**`, `/api/reviews/**`       | Core Service :8085         | Customer management                |
| `/api/notifications/**`, `/api/campaigns/**` | Core Service :8085         | Notifications, campaigns           |
| `/api/stores/**`                             | Core Service :8085         | Store management                   |
| `/api/orders/**`, `/api/menu/**`             | Commerce Service :8084     | Orders, menu items                 |
| `/api/equipment/**`                          | Commerce Service :8084     | Kitchen equipment                  |
| `/api/payments/**`                           | Payment Service :8089      | Payment processing                 |
| `/api/delivery/**`, `/api/dispatch/**`       | Logistics Service :8086    | Delivery tracking, dispatch        |
| `/api/inventory/**`, `/api/suppliers/**`     | Logistics Service :8086    | Inventory, suppliers               |
| `/api/analytics/**`, `/api/intelligence/**`  | Intelligence Service :8087 | Analytics, BI                      |
| `/api/purchase-orders/**`, `/api/waste/**`   | Logistics Service :8086    | POs, waste records                 |

---

## 5. CORE SERVICE (Port 8085)

**Location:** `/core-service`
**Primary DB:** MongoDB (`masova_core`)
**Secondary DB:** PostgreSQL (`core_schema` — users table dual-write)
**Java Files:** 124

### 5.1 User Management

#### UserEntity (PostgreSQL JPA)
```
UUID id, String mongo_id (FK correlation), String name, String email, String phone
String password_hash (bcrypt), UserType userType, String storeId
String employeeRole, String employee_pin_hash, String pin_suffix, String terminal_id
Boolean is_kiosk_account, OffsetDateTime deleted_at (soft delete)
OffsetDateTime created_at, updated_at (IST timezone)
```

#### AuthController — 7 endpoints (`/api/auth`)

Auth was split into its own controller in Phase 1. Legacy `/api/users/*` paths still work via gateway dual-routing.

| Method | Path                        | Auth          | Purpose                    |
| ------ | --------------------------- | ------------- | -------------------------- |
| POST   | `/api/auth/login`           | Public        | Email/password login → JWT |
| POST   | `/api/auth/register`        | Public        | Customer registration      |
| POST   | `/api/auth/logout`          | JWT           | Blacklist token in Redis   |
| POST   | `/api/auth/refresh`         | JWT (refresh) | Issue new access token     |
| POST   | `/api/auth/google`          | Public        | Google OAuth2 → JWT        |
| POST   | `/api/auth/change-password` | JWT           | Change password            |
| POST   | `/api/auth/validate-pin`    | Public        | PIN-based login (kiosk)    |

#### UserController — 14 endpoints (`/api/users`)

| Method | Path                                        | Auth        | Purpose                                              |
| ------ | ------------------------------------------- | ----------- | ---------------------------------------------------- |
| GET    | `/api/users`                                | JWT         | List users (query: type, storeId, available, search) |
| GET    | `/api/users/{userId}`                       | JWT         | Get user                                             |
| PUT    | `/api/users/{userId}`                       | JWT         | Update user                                          |
| GET    | `/api/users/{userId}/status`                | JWT         | Get driver/staff status                              |
| PUT    | `/api/users/{userId}/status`                | JWT         | Update driver/staff status                           |
| POST   | `/api/users/{userId}/activate`              | JWT+MANAGER | Activate user                                        |
| POST   | `/api/users/{userId}/deactivate`            | JWT+MANAGER | Deactivate user                                      |
| POST   | `/api/users/{userId}/generate-pin`          | JWT+MANAGER | Generate employee PIN                                |
| GET    | `/api/users/{userId}/can-take-orders`       | JWT         | Check if staff can take orders                       |
| POST   | `/api/users/kiosk`                          | JWT+MANAGER | Create kiosk account                                 |
| GET    | `/api/users/kiosk`                          | JWT+MANAGER | List kiosk accounts                                  |
| POST   | `/api/users/kiosk/{kioskUserId}/regenerate` | JWT+MANAGER | Regenerate kiosk tokens                              |
| POST   | `/api/users/kiosk/{kioskUserId}/deactivate` | JWT+MANAGER | Deactivate kiosk                                     |
| POST   | `/api/users/kiosk/auto-login`               | Public      | PIN-based kiosk auto-login                           |

#### JWT Token Structure
```
Header: { alg: HS512, typ: JWT }
Payload: {
  sub: userId,
  userType: CUSTOMER|MANAGER|ASSISTANT_MANAGER|STAFF|DRIVER|KIOSK,
  storeId: storeId (staff only),
  iat: issuedAt,
  exp: +1h (access), +7d (refresh), +8h (kiosk access), +24h (kiosk refresh)
}
Signature: HMAC-SHA512(JWT_SECRET)
```

#### UserService Key Logic (1331 lines)
- bcrypt password hashing and verification
- 6-digit PIN generation + 2-digit suffix (for multi-terminal kiosk)
- Google OAuth2: validate ID token (RS256), upsert user, return JWT
- Redis blacklist check on every request (DB 0)
- Dual-write: User created in MongoDB (`masova_core`) then PostgreSQL (`core_schema.users`)
- Role validation: Only MANAGER can create MANAGER/DRIVER/STAFF accounts

### 5.2 Store Management

| Class                   | Notes                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `StoreEntity` (MongoDB) | Name, address, operatingHours, deliveryRadius, deliveryFee, storeType, countryCode |
| `StoreController`       | 4 endpoints: CRUD (collapsed from 25+ via query params)                            |
| `StoreService`          | Operating hours check, delivery radius validation                                  |
| `CountryProfileService` | Multi-country config — auto-sets currency+locale on store save                     |

**Store endpoints — 4 (`/api/stores`):**

| Method | Path                    | Auth        | Notes                                     |
| ------ | ----------------------- | ----------- | ----------------------------------------- |
| GET    | `/api/stores`           | Public      | query: code, region, near=lat,lng, radius |
| GET    | `/api/stores/{storeId}` | Public      |                                           |
| POST   | `/api/stores`           | JWT+MANAGER |                                           |
| PUT    | `/api/stores/{storeId}` | JWT+MANAGER |                                           |

### 5.3 Shift & Working Sessions

| Class                      | Notes                                                  |
| -------------------------- | ------------------------------------------------------ |
| `ShiftController`          | 10 endpoints (`/api/shifts`)                           |
| `ShiftService` (180 lines) | Overlap detection, 4h minimum shift duration rule      |
| `ShiftViolationException`  | Detects early checkout, working outside assigned shift |
| `WorkingSessionController` | 9 endpoints (`/api/sessions`)                          |
| `WorkingSessionService`    | Active session tracking, session history               |

**ShiftController — 10 (`/api/shifts`):**

| Method | Path                             | Auth        |
| ------ | -------------------------------- | ----------- |
| GET    | `/api/shifts`                    | JWT         |
| POST   | `/api/shifts`                    | JWT+MANAGER |
| POST   | `/api/shifts/bulk`               | JWT+MANAGER |
| POST   | `/api/shifts/copy-week`          | JWT+MANAGER |
| GET    | `/api/shifts/{shiftId}`          | JWT         |
| PUT    | `/api/shifts/{shiftId}`          | JWT+MANAGER |
| DELETE | `/api/shifts/{shiftId}`          | JWT+MANAGER |
| POST   | `/api/shifts/{shiftId}/confirm`  | JWT         |
| POST   | `/api/shifts/{shiftId}/start`    | JWT         |
| POST   | `/api/shifts/{shiftId}/complete` | JWT         |

**WorkingSessionController — 9 (`/api/sessions`):**

| Method | Path                                | Auth        |
| ------ | ----------------------------------- | ----------- |
| POST   | `/api/sessions`                     | JWT         |
| POST   | `/api/sessions/end`                 | JWT         |
| POST   | `/api/sessions/clock-in`            | Public      |
| POST   | `/api/sessions/clock-out`           | JWT+MANAGER |
| GET    | `/api/sessions`                     | JWT         |
| GET    | `/api/sessions/pending`             | JWT+MANAGER |
| POST   | `/api/sessions/{sessionId}/approve` | JWT+MANAGER |
| POST   | `/api/sessions/{sessionId}/reject`  | JWT+MANAGER |
| POST   | `/api/sessions/{sessionId}/break`   | JWT         |

### 5.4 Customer Management

| Class                          | Notes                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `CustomerEntity` (MongoDB)     | Profile, addresses[], loyaltyPoints, tier, preferences (incl. allergenAlerts), GDPR consent |
| `CustomerController`           | 14 endpoints (`/api/customers`) — filter variants collapsed to query params                 |
| `CustomerService` (500+ lines) | Signup bonus 100 pts, birthday bonus 200 pts, tier calculation                              |
| `CustomerAuditService`         | GDPR data access logging                                                                    |
| `CustomerDataRetentionService` | Auto soft-delete per retention policy                                                       |

**Loyalty Tiers:**
- BRONZE: 0–499 pts
- SILVER: 500–1999 pts
- GOLD: 2000–4999 pts
- PLATINUM: 5000+ pts

**CustomerController — 14 (`/api/customers`):**

| Method | Path                                        | Auth                               |
| ------ | ------------------------------------------- | ---------------------------------- |
| GET    | `/api/customers`                            | JWT                                |
| POST   | `/api/customers`                            | JWT                                |
| GET    | `/api/customers/stats`                      | JWT+MANAGER                        |
| GET    | `/api/customers/{id}`                       | JWT                                |
| PUT    | `/api/customers/{id}`                       | JWT                                |
| POST   | `/api/customers/{id}/activate`              | JWT+MANAGER                        |
| POST   | `/api/customers/{id}/deactivate`            | JWT+MANAGER                        |
| POST   | `/api/customers/{id}/loyalty`               | JWT                                |
| POST   | `/api/customers/{id}/addresses`             | JWT                                |
| PUT    | `/api/customers/{id}/addresses/{addressId}` | JWT                                |
| DELETE | `/api/customers/{id}/addresses/{addressId}` | JWT                                |
| POST   | `/api/customers/{id}/tags`                  | JWT+MANAGER                        |
| POST   | `/api/customers/get-or-create`              | Internal only — blocked at gateway |
| DELETE | `/api/customers/{id}/gdpr/anonymize`        | JWT+MANAGER                        |

### 5.5 Notifications & Communications

| Class                  | Notes                                                      |
| ---------------------- | ---------------------------------------------------------- |
| `NotificationService`  | Fan-out to email/SMS/push                                  |
| `EmailService`         | Brevo API (transactional: order confirm, OTP, receipts)    |
| `SmsService`           | Twilio (OTP delivery, delivery alerts)                     |
| `PushService`          | Firebase Cloud Messaging (FCM)                             |
| `CampaignService`      | Marketing campaign management (WIN_BACK, PROMOTIONAL)      |
| `RatingRequestService` | Post-delivery rating token workflow                        |
| `OrderEventListener`   | RabbitMQ consumer → triggers notifications on order events |

**Notification types:** ORDER_UPDATE, PAYMENT_SUCCESS, DRIVER_ASSIGNED, DELIVERY_OTP, PROMOTION, CHURN_ALERT, INVENTORY_ALERT, REVIEW_DRAFT_RESPONSE

### 5.6 Reviews & Ratings

| Class                      | Notes                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Review` (MongoDB)         | reviewId, orderId, customerId, storeId, rating(1-5), text, type(DINE_IN/DELIVERY/DRIVER/ITEM), flagged, createdAt |
| `ReviewResponse` (MongoDB) | reviewId, responseText, respondedBy, isAutoGenerated                                                              |
| `ReviewController`         | 10 endpoints (`/api/reviews`) — ResponseController merged in                                                      |
| `ReviewService`            | Creation, analytics by category/item/driver                                                                       |
| `ReviewResponseService`    | Manager responses — now served via `POST /api/reviews/{id}/response`                                              |
| `ModerationService`        | Content moderation (keyword filter)                                                                               |
| `SentimentAnalysisService` | NLP-based sentiment scoring                                                                                       |

**ReviewController — 10 (`/api/reviews`):**

| Method | Path                                | Auth        |
| ------ | ----------------------------------- | ----------- |
| GET    | `/api/reviews`                      | JWT         |
| POST   | `/api/reviews`                      | JWT         |
| GET    | `/api/reviews/stats`                | JWT         |
| GET    | `/api/reviews/public/token/{token}` | Public      |
| POST   | `/api/reviews/public/submit`        | Public      |
| GET    | `/api/reviews/{reviewId}`           | JWT         |
| PUT    | `/api/reviews/{reviewId}`           | JWT         |
| DELETE | `/api/reviews/{reviewId}`           | JWT+MANAGER |
| POST   | `/api/reviews/{reviewId}/response`  | JWT+MANAGER |
| GET    | `/api/reviews/response-templates`   | JWT+MANAGER |

> `ResponseController` was deleted — its endpoints are now part of ReviewController.

### 5.7 GDPR & Compliance

All data subject rights implemented:
- **Access (SAR):** Export all personal data as JSON
- **Deletion (DPR):** Soft-delete with cascading across services
- **Portability:** Standard format export
- **Objection:** Opt-out of processing

Retention policies (auto-delete):
- Customer data: 2 years
- Transaction data: 7 years (PCI DSS)

### 5.8 Earnings & Payroll

| Class                        | Notes                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| `StaffEarningsSummaryEntity` | Weekly earnings rollup per employee                         |
| `StaffPayRateEntity`         | Store-specific hourly pay rates (₹/hour)                    |
| `EarningsController`         | 4 endpoints (`/api/staff/earnings`, `/api/staff/pay-rates`) |
| `EarningsService`            | Calculates from working sessions + tips                     |

---

## 6. COMMERCE SERVICE (Port 8084)

**Location:** `/commerce-service`
**Primary DB:** MongoDB (`masova_commerce` — unified menu + orders)
**Secondary DB:** PostgreSQL (`commerce_schema` — orders dual-write)
**Java Files:** 69

### 6.1 Order State Machine

```
RECEIVED → PREPARING → OVEN → BAKED → READY → DISPATCHED → OUT_FOR_DELIVERY → DELIVERED
                                                                               → SERVED (dine-in)
                                                                               → COMPLETED (takeaway)
                                              ↓
                                         CANCELLED (any state, manager only)
```

### 6.2 Order Entity (MongoDB, 100+ fields)

```
orderNumber, customerId, customerName, storeId, items[]
subtotal, deliveryFee, tax, total
status (OrderStatus), orderType (DINE_IN/DELIVERY/TAKEAWAY)
paymentStatus, paymentMethod, priority
preparationTime, estimatedDeliveryTime
deliveryAddress, assignedDriverId
qualityCheckpoints[] (7 types)
createdAt, updatedAt, completedAt, cancelledAt
--- EU VAT fields ---
vatCountryCode, currency, totalNetAmount, totalVatAmount, totalGrossAmount, vatBreakdown[]
--- Kitchen fields ---
assignedKitchenStaffId, assignedMakeTableStation, receivedAt, actualPreparationTime
```

### 6.3 OrderController — 13 endpoints (`/api/orders`)

Collapsed from 40+ in Phase 1 — filter variants now use query params, delivery/OTP/proof consolidated into PATCH `/{orderId}`.

| Method | Path                                                        | Auth        | Purpose                                                      |
| ------ | ----------------------------------------------------------- | ----------- | ------------------------------------------------------------ |
| GET    | `/api/orders`                                               | JWT         | List (query: storeId, status, customerId, staffId, from, to) |
| POST   | `/api/orders`                                               | JWT         | Create order                                                 |
| GET    | `/api/orders/kitchen`                                       | JWT+STAFF   | Kitchen queue (KDS)                                          |
| GET    | `/api/orders/track/{orderId}`                               | Public      | Real-time tracking (no auth)                                 |
| GET    | `/api/orders/{orderId}`                                     | JWT         | Order details                                                |
| PUT    | `/api/orders/{orderId}`                                     | JWT         | Update mutable fields                                        |
| POST   | `/api/orders/{orderId}/status`                              | JWT+STAFF   | Explicit status transition                                   |
| DELETE | `/api/orders/{orderId}`                                     | JWT+MANAGER | Cancel order                                                 |
| PATCH  | `/api/orders/{orderId}/next-stage`                          | JWT+STAFF   | Advance KDS stage                                            |
| PATCH  | `/api/orders/{orderId}/payment`                             | Internal    | Payment status update                                        |
| GET    | `/api/orders/{orderId}/quality-checkpoint`                  | JWT         | Get checkpoints                                              |
| POST   | `/api/orders/{orderId}/quality-checkpoint`                  | JWT+STAFF   | Add checkpoint                                               |
| PATCH  | `/api/orders/{orderId}/quality-checkpoint/{checkpointName}` | JWT+STAFF   | Update checkpoint                                            |

### 6.4 OrderService Key Logic (1521 lines)

**Preparation Time Calculation:**
```
base = 15 minutes
per_item = 5 minutes each
rush_hours = 12:00–14:00, 19:00–21:00 → multiply by 1.5
preparationTime = (base + items * perItem) * rushMultiplier
```

**Delivery Fee Calculation:**
```
base = ₹50
per_km = ₹5/km (Haversine distance)
free_threshold = ₹500 order value
deliveryFee = max(0, base + distKm * perKm) if subtotal < 500 else 0
```

**Tax Engine:**
- India: GST 5% flat on subtotal
- EU: EuVatEngine (see 6.5)

**RabbitMQ:** Publishes `OrderStatusChangedEvent` to `masova.orders.exchange` on every status transition

### 6.5 EU VAT Engine (12 Countries)

Context-aware rates:

| Country | Context  | Category | Rate |
| ------- | -------- | -------- | ---- |
| France  | TAKEAWAY | FOOD     | 5.5% |
| France  | TAKEAWAY | ALCOHOL  | 20%  |
| Germany | DINE_IN  | FOOD     | 19%  |
| Germany | TAKEAWAY | FOOD     | 7%   |
| Germany | TAKEAWAY | ALCOHOL  | 19%  |
| UK      | any      | FOOD     | 0%   |
| UK      | any      | ALCOHOL  | 20%  |

12 countries total: DE, FR, IT, NL, BE, HU, LU, IE, CH, GB, US, CA

**VatBreakdown** stored per order: by category (FOOD, ALCOHOL, BEVERAGE, PACKAGING) with net, vat, gross amounts

### 6.6 Quality Checkpoints

7 checkpoint types: INGREDIENT_QUALITY, PORTION_SIZE, TEMPERATURE, PRESENTATION, TASTE_TEST, PACKAGING, FINAL_INSPECTION

Each checkpoint: `{type, passed, notes, checkedBy, checkedAt}`

### 6.7 Menu Management

**MenuItem fields:**
```
id, name, description, cuisine (8 types), category (40+ types)
basePrice, discountedPrice (in paise)
variants: [{id, name, priceModifier}]
customizations: [{id, name, required, maxSelections, options: [{id, name, priceModifier}]}]
dietaryInfo: VEGETARIAN|VEGAN|NON_VEGETARIAN|JAIN|HALAL|GLUTEN_FREE|DAIRY_FREE
spiceLevel: MILD|MEDIUM|HOT|EXTRA_HOT (displayed as 1–5)
allergenType: 14 EU mandatory allergens enforced
imageUrl, isAvailable, preparationTime, isRecommended
rating, reviewCount, nutritionalInfo: {calories, protein, carbs, fat}
```

**Allergen enforcement (EU Regulation 1169/2011):**
- `allergensDeclared` gate: a menu item cannot be set `isAvailable=true` until allergens are explicitly declared via `PATCH /api/menu/items/{id}/allergens`
- Copied menu items (`POST /api/menu/copy`) reset `allergensDeclared=false` — re-declaration required before going live
- `AllergenType` enum: 14 mandatory EU allergens (GLUTEN, CRUSTACEANS, EGGS, FISH, PEANUTS, SOYBEANS, MILK, NUTS, CELERY, MUSTARD, SESAME, SULPHITES, LUPIN, MOLLUSCS)

### 6.8 Kitchen Equipment

| Class                        | Notes                                                             |
| ---------------------------- | ----------------------------------------------------------------- |
| `KitchenEquipment` (MongoDB) | Equipment type, status (OPERATIONAL/MAINTENANCE/BROKEN), capacity |
| `KitchenEquipmentController` | GET `/api/equipment`, POST, PATCH status                          |
| `KitchenEquipmentService`    | Equipment state management, impacts prep time modeling            |

**Note:** Path is `/api/equipment` — NOT `/api/kitchen-equipment`

### 6.9 Tips & Gratuity

| Class                         | Notes                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `OrderTipEntity` (PostgreSQL) | Tip amount, orderId, staffId, createdAt                                            |
| `TipController`               | POST `/api/tips`, GET `/api/tips/order/{orderId}`, GET `/api/tips/staff/{staffId}` |
| `TipService`                  | Staff attribution, gratuity calculation                                            |

---

## 7. PAYMENT SERVICE (Port 8089)

**Location:** `/payment-service`
**Primary DB:** MongoDB (`masova_payment`) + PostgreSQL (`payment_schema`) dual-write
**Java Files:** 49

### 7.1 Payment Gateway Abstraction

```
PaymentGateway (interface)
├── RazorpayGateway — India (store.countryCode == "IN")
└── StripeGateway — EU/US/Global (SCA/3D Secure)

PaymentGatewayResolver — selects gateway at runtime based on store.countryCode
```

### 7.2 Transaction Entity

```
transactionId (UUID PK), orderId, customerId, storeId
amount, currency, method (STRIPE/RAZORPAY/CASH)
status: PENDING|COMPLETED|FAILED
gatewayResponse, timestamp, metadata
deleted_at (soft delete — 7 year PCI retention)
```

Dual-write: MongoDB `masova_payment` + PostgreSQL `payment_schema.transactions`

### 7.3 Payment Flow

```
1. POST /api/payments/initiate
   → PaymentGatewayResolver picks Razorpay (India) or Stripe (EU/US)
   → Returns {razorpayOrderId, razorpayKeyId, amount, currency} or {stripeClientSecret, ...}

2. Frontend opens payment modal (Razorpay checkout or Stripe PaymentElement)
   → Customer enters card/UPI/wallet details

3. Webhook callback (Stripe) or frontend verification (Razorpay)
   → POST /api/payments/verify
   → Verify signature (HMAC), update transaction status
   → Emit PaymentCompletedEvent or PaymentFailedEvent to RabbitMQ

4. Order service consumes event → update Order.paymentStatus
```

### 7.4 Refund Management

| Method | Path                            | Auth        |
| ------ | ------------------------------- | ----------- |
| POST   | `/api/payments/refund`          | JWT         |
| POST   | `/api/payments/refund/request`  | JWT         | (AI agent path)       |
| GET    | `/api/payments/{transactionId}` | JWT         |
| GET    | `/api/payments/order/{orderId}` | JWT         |
| POST   | `/api/payments/cash`            | JWT+CASHIER | Cash payment record   |
| POST   | `/api/payments/reconcile`       | JWT+MANAGER | Manual reconciliation |

**Refund reasons:** CUSTOMER_REQUEST, ORDER_CANCELLED, QUALITY_ISSUE, DUPLICATE_CHARGE, PAYMENT_ERROR

**Processing time:** 3–5 business days (surface to customer via masova-support agent)

### 7.5 Security

- `PiiEncryptionService` — AES-256 encryption for PAN (card numbers — last 4 only stored)
- Stripe webhook signature validation (Stripe-Signature header)
- Razorpay webhook HMAC validation

### 7.6 EU Fiscal Signing (Global-5)

7-country fiscal compliance triggered asynchronously when an order reaches a terminal status (DELIVERED, COMPLETED, SERVED).

```
FiscalSigningService (@Async) — wired into OrderService.updateOrderStatus()
├── GermanTSEFiscalSigner         — TSE (Technische Sicherheitseinrichtung)
├── FrenchNF525FiscalSigner       — NF525 certified cash register
├── ItalianSDIFiscalSigner        — SDI (Sistema di Interscambio)
├── SpanishVeriFactuFiscalSigner  — VeriFactu 2024
├── UKFiscalSigner                — HMRC MTD compatible
├── USFiscalSigner                — State-level sales tax signing
└── PassthroughFiscalSigner       — Fallback for unconfigured countries
```

**FiscalSignature value object (PostgreSQL — `payment_schema.fiscal_signatures`):**
```
transactionId, orderId, storeId, countryCode, signerSystem
signedAt (Instant), signaturePayload (jsonb)
```

**OrderJpaEntity columns added:**
- `fiscal_signature_id` — FK to fiscal_signatures.transaction_id
- `fiscal_signer_system` — e.g. "TSE", "NF525", "PASSTHROUGH"
- `fiscal_signing_failed` — boolean alert for manager
- `fiscal_signed_at` — Instant

**RabbitMQ:** Publishes `ReceiptSignedEvent` to `masova.orders.exchange` with routing key `order.receipt.signed`. Consumed by `masova.compliance.order-events` queue.

**Frontend:** `FiscalCompliancePage` at `/manager/fiscal-compliance` — `fiscalApi` RTK slice at `/api/payments/fiscal/**`

**Flyway migrations added:**
- `V6__add_fiscal_signatures_table.sql`
- `V7__add_fiscal_columns_to_orders.sql`
- `V8__add_compliance_indexes.sql`

---

## 8. LOGISTICS SERVICE (Port 8086)

**Location:** `/logistics-service`
**Primary DB:** MongoDB (`masova_logistics`)
**Secondary DB:** PostgreSQL (`logistics_schema` — inventory, POs)
**Java Files:** 73

### 8.1 Delivery Management

#### DeliveryTracking (MongoDB)
```
deliveryId, orderId, driverId
status: PENDING|ACCEPTED|PICKED_UP|IN_TRANSIT|ARRIVED|COMPLETED
currentLocation: {latitude, longitude}
assignedAt, pickedUpAt, deliveredAt
```

#### DriverLocation (MongoDB + Redis TTL 5 min)
```
driverId, latitude, longitude, accuracy, timestamp
```

#### DeliveryController — 17 endpoints (`/api/delivery`)

`DispatchController` + `TrackingController` + `PerformanceController` were merged into a single `DeliveryController` in Phase 1.

| Method | Path                                          | Auth        | Purpose                     |
| ------ | --------------------------------------------- | ----------- | --------------------------- |
| POST   | `/api/delivery/dispatch`                      | Internal    | Auto-dispatch driver        |
| POST   | `/api/delivery/accept`                        | JWT+DRIVER  | Driver accepts delivery     |
| POST   | `/api/delivery/reject`                        | JWT+DRIVER  | Driver rejects delivery     |
| POST   | `/api/delivery/location`                      | JWT+DRIVER  | Driver GPS location update  |
| POST   | `/api/delivery/verify`                        | JWT+DRIVER  | Verify delivery OTP + proof |
| POST   | `/api/delivery/route`                         | JWT+MANAGER | Route optimization          |
| GET    | `/api/delivery/track/{orderId}`               | JWT         | Track order with ETA        |
| GET    | `/api/delivery/zones`                         | JWT         | Delivery zones + fee        |
| GET    | `/api/delivery/drivers/available`             | JWT+MANAGER | Available drivers           |
| GET    | `/api/delivery/driver/{driverId}/pending`     | JWT+DRIVER  | Driver's pending deliveries |
| GET    | `/api/delivery/driver/{driverId}/performance` | JWT         | Driver performance metrics  |
| GET    | `/api/delivery/driver/{driverId}/status`      | JWT         | Driver current status       |
| PUT    | `/api/delivery/driver/{driverId}/status`      | JWT+DRIVER  | Update driver status        |
| POST   | `/api/delivery/{orderId}/otp`                 | JWT+DRIVER  | Generate/regenerate OTP     |
| PATCH  | `/api/delivery/{trackingId}/status`           | JWT+DRIVER  | Advance delivery state      |
| GET    | `/api/delivery/analytics`                     | JWT+MANAGER | Delivery analytics          |
| GET    | `/api/delivery/metrics`                       | JWT+MANAGER | Today's delivery metrics    |

**WebSocket:** `/ws/delivery` — Real-time driver location + order updates (STOMP)

#### Auto-Dispatch Algorithm (AutoDispatchService)
1. Get all AVAILABLE drivers in store area
2. Filter: not currently on delivery, is online
3. Calculate Haversine distance from each driver to store
4. Select closest driver (load-balance: minimize cumulative distance)
5. Assign via RabbitMQ event or direct DB write

### 8.5 Inventory Management

#### InventoryItem (MongoDB)
```
itemId, itemName, storeId, currentStock, minStock
reorderQuantity, unit, lastRestockDate
supplier (supplierId, name), cost
```

**Auto-reorder trigger:** `currentStock < minStock` → notify manager + background agent creates PO

**InventoryController — 7 (`/api/inventory`):**

| Method | Path                        | Auth        |
| ------ | --------------------------- | ----------- |
| GET    | `/api/inventory`            | JWT         |
| POST   | `/api/inventory`            | JWT+MANAGER |
| GET    | `/api/inventory/{id}`       | JWT         |
| PATCH  | `/api/inventory/{id}`       | JWT+MANAGER |
| DELETE | `/api/inventory/{id}`       | JWT+MANAGER |
| GET    | `/api/inventory/{id}/stock` | JWT         |
| GET    | `/api/inventory/value`      | JWT+MANAGER |

### 8.6 Purchase Orders & Suppliers

#### PurchaseOrder (MongoDB)
```
poNumber, supplierId, storeId, items[]
totalAmount, status: DRAFT|SUBMITTED|APPROVED|RECEIVED|CANCELLED
expectedDeliveryDate, actualDeliveryDate, notes
autoGenerated (boolean — from AI agent), generatedAt
```

**PurchaseOrderController — 6 (`/api/purchase-orders`):**

| Method | Path                                 | Auth                |
| ------ | ------------------------------------ | ------------------- |
| GET    | `/api/purchase-orders`               | JWT                 |
| POST   | `/api/purchase-orders`               | JWT+MANAGER         |
| GET    | `/api/purchase-orders/{id}`          | JWT                 |
| PUT    | `/api/purchase-orders/{id}`          | JWT+MANAGER         |
| DELETE | `/api/purchase-orders/{id}`          | JWT+MANAGER         |
| POST   | `/api/purchase-orders/auto-generate` | Internal (AI agent) |

**SupplierController — 6 (`/api/suppliers`):**

| Method | Path                     | Auth        |
| ------ | ------------------------ | ----------- |
| GET    | `/api/suppliers`         | JWT         |
| POST   | `/api/suppliers`         | JWT+MANAGER |
| GET    | `/api/suppliers/{id}`    | JWT         |
| PUT    | `/api/suppliers/{id}`    | JWT+MANAGER |
| DELETE | `/api/suppliers/{id}`    | JWT+MANAGER |
| GET    | `/api/suppliers/compare` | JWT+MANAGER |

### 8.7 Waste Tracking

#### WasteRecord (MongoDB)
```
wasteId, storeId, date
category: SPOILAGE|DAMAGED|EXPIRED|RETURNED
quantity, unit, reason, cost
approvedByManager, createdByStaffId
```

**WasteController — 6 (`/api/waste`):**

| Method | Path                      | Auth        |
| ------ | ------------------------- | ----------- |
| GET    | `/api/waste`              | JWT         |
| POST   | `/api/waste`              | JWT+STAFF   |
| GET    | `/api/waste/{id}`         | JWT         |
| PUT    | `/api/waste/{id}`         | JWT+MANAGER |
| POST   | `/api/waste/{id}/approve` | JWT+MANAGER |
| GET    | `/api/waste/stats`        | JWT+MANAGER |

---

## 9. INTELLIGENCE SERVICE (Port 8087)

**Location:** `/intelligence-service`
**Primary DB:** MongoDB (`masova_analytics`)
**Java Files:** 34

### AnalyticsController — 3 endpoints (`/api/analytics`)

| Method | Path                         | Auth        | Purpose                                      |
| ------ | ---------------------------- | ----------- | -------------------------------------------- |
| GET    | `/api/analytics`             | JWT+MANAGER | Analytics (query params: period, view, type) |
| GET    | `/api/analytics/cache/clear` | JWT+MANAGER | Cache status                                 |
| POST   | `/api/analytics/cache/clear` | JWT+MANAGER | Clear analytics cache                        |

### BIController — 2 endpoints (`/api/bi`)

> **Note:** BIController was NOT merged into AnalyticsController in the live code — it remains separate at `/api/bi`. The plan targeted `/api/analytics` for everything but the code kept them separate.

| Method | Path              | Auth        | Purpose      |
| ------ | ----------------- | ----------- | ------------ |
| GET    | `/api/bi`         | JWT+MANAGER | BI dashboard |
| GET    | `/api/bi/reports` | JWT+MANAGER | BI reports   |

> **Known gap:** Only 4 live intelligence endpoints exist vs the plan's 11. The analytics query params (`period`, `view`, `type`) are handled on the single `GET /api/analytics` endpoint rather than separate routes. This is intentional — the service methods are fully implemented, just consolidated behind query params.

### Event Consumption

`AnalyticsEventListener` consumes from RabbitMQ:
- `OrderStatusChangedEvent` → updates order analytics
- `PaymentCompletedEvent` → updates revenue metrics

All processing is async, failures logged but do not affect business flow.

---

## 10. SHARED MODULES

### shared-models (`/shared-models`) — 96 Java files

**Enums (15):** OrderStatus, PaymentStatus, PaymentMethod, UserType, ShiftType, ShiftStatus, StoreStatus, MenuCategory, Cuisine, DietaryType, SpiceLevel, ConsentType, GdprRequestType, GdprRequestStatus, **AllergenType**

**OrderStatus values:** RECEIVED, PREPARING, OVEN, BAKED, READY, DISPATCHED, OUT_FOR_DELIVERY, DELIVERED, SERVED, COMPLETED, CANCELLED

**Key DTOs:**
- `ApiResponse<T>` — Standardized wrapper: `{success, data, message, timestamp}`
- `ErrorResponse` — `{errorCode, message, details, timestamp}`
- `PagedResponse<T>` — `{page, size, total, data}`

**Domain Events:**
- `OrderCreatedEvent`
- `OrderStatusChangedEvent` — `{eventId, orderId, storeId, timestamp, previousStatus, newStatus, orderType, customerId, assignedDriverId}`
- `PaymentCompletedEvent` — includes `paymentGateway` + `paymentMethodType` fields
- `PaymentFailedEvent` — includes `paymentGateway` field
- `ReceiptSignedEvent` (Global-5) — `{orderId, storeId, signatureId, signerSystem, signedAt}`

**RabbitMQ Config:**
- `masova.orders.exchange` (topic, durable) — routing: `order.*`, `order.receipt.*`
- `masova.notifications.exchange` (topic, durable) — routing: `notification.*`
- Queues: `masova.compliance.order-events` — binds to `order.receipt.#`

**Security (shared-security):**
- `JwtTokenProvider` — HS512 generation/validation
- `SecurityConfigurationBase` — Base Spring Security config
- `JwtAuthenticationFilter` — Servlet filter (legacy; gateway uses reactive)

**Cache Config (AdvancedCacheConfig):**
- Redis caching with per-key TTL patterns
- Menu: 5 min, Store: 10 min, User sessions: 24h

### Database Summary

| DB               | Type       | Schemas/Collections                                                                                                                                          |
| ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| masova_core      | MongoDB    | users, customers, reviews, notifications, campaigns, shifts, workinksessions                                                                                 |
| masova_commerce  | MongoDB    | menu_items, orders, kitchen_equipment, rating_tokens                                                                                                         |
| masova_payment   | MongoDB    | transactions, refunds                                                                                                                                        |
| masova_logistics | MongoDB    | delivery_tracking, driver_locations, inventory_items, purchase_orders, suppliers, waste_records                                                              |
| masova_analytics | MongoDB    | analytics snapshots (denormalized)                                                                                                                           |
| masova_db        | PostgreSQL | core_schema.users, commerce_schema.orders, payment_schema.transactions, payment_schema.refunds, payment_schema.fiscal_signatures, logistics_schema.inventory |

**Redis:**
- DB 0: JWT blacklist (`token:{jti}` → expiration)
- DB 1: Agent sessions (conversation state, 1h TTL)
- Cache: Menu items (5 min), store data (10 min), user sessions (24h)

**Key MongoDB Indexes:**
- Orders: `{storeId:1, status:1}`, `{customerId:1, createdAt:-1}`, `{assignedDriverId:1, status:1}`
- Users: `{email:1 unique}`, `{phone:1 unique}`, `{storeId:1}`
- Menu: `{storeId:1, category:1}`, `{name:1}`

---

---

> **Endpoint Reference:** See `docs/MASOVA_MASTER_REFERENCE_ENDPOINTS.md` for the complete
> per-controller endpoint table derived from live source code.
> Live count: **194 endpoints** across 32 controllers (plan targeted 175 — difference is
> AggregatorController, SystemInfoController, GDPR anonymise endpoints, minor additions).

*Continued in Part 2: Frontend, AI Support Agent, Mobile Apps*



# MaSoVa Platform — Master Reference Document
## Part 2 of 5: Frontend Web App & AI Support Agent

---

## 11. FRONTEND WEB APP

**Location:** `/frontend`
**Framework:** React 19, TypeScript, Vite
**State Management:** Redux Toolkit + RTK Query
**UI Library:** Material-UI (MUI) + custom neumorphic/dark-premium components
**Testing:** Vitest + React Testing Library + MSW (mock service worker) + Pact (contract tests)
**Port:** 3000 (Vite dev server)
**Proxy target:** `http://192.168.50.88:8080` (Dell backend via LAN)

---

### 11.1 Project Structure Overview

```
frontend/
├── src/
│   ├── pages/              # 7 page-level components
│   ├── components/         # Shared UI components
│   ├── store/              # Redux store + RTK Query APIs
│   │   ├── store.ts        # Root store configuration
│   │   ├── slices/         # authSlice, uiSlice, cartSlice, notificationSlice
│   │   └── api/            # 18 RTK Query API slices
│   ├── hooks/              # 21 custom hooks
│   ├── config/             # API endpoint config
│   ├── styles/             # Design tokens, themes, global CSS
│   ├── i18n/               # react-i18next (en, hi, de, fr)
│   └── test/               # Test fixtures, mocks, integration tests
├── vite.config.ts
├── package.json
└── .env.local              # VITE_API_BASE_URL=http://192.168.50.88:8080
```

---

### 11.2 Redux Store

#### Feature Slices (4)

**authSlice**
```typescript
{
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  user: {
    id, name, email, phone, userType, storeId,
    employeeRole?, isKioskAccount?
  } | null
  loading: boolean
  error: string | null
}
```
Actions: `loginStart`, `loginSuccess`, `loginFailure`, `logout`, `refreshTokenSuccess`, `updateUserProfile`, `clearError`, `setLoading`

**cartSlice**
```typescript
{
  items: CartItem[]           // {menuItem, quantity, variant, customizations, specialInstructions, itemTotal}
  subtotal: number
  deliveryFeeINR: number      // ALWAYS from Redux — NEVER hardcode
  selectedStore: Store | null
  selectedStoreId: string | null
}
```
Selector: `selectDeliveryFeeINR` — every component that needs delivery fee MUST use this selector

**uiSlice**
```typescript
{
  modals: { [key: string]: boolean }
  drawers: { [key: string]: boolean }
  toastQueue: Toast[]
}
```

**notificationSlice**
```typescript
{
  notifications: Notification[]
  unreadCount: number
}
```

---

### 11.3 RTK Query API Slices (19)

Every slice uses the canonical base URL (no `/api/v1/` prefix — 194 live endpoints).

| Slice             | Key Endpoints                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| `authApi`         | POST `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/refresh`, `/api/auth/google` |
| `orderApi`        | GET/POST `/api/orders`, POST `/api/orders/{id}/status`, GET `/api/orders/{id}`, WebSocket subscriptions   |
| `userApi`         | GET/PUT `/api/users`, `/api/users/{id}`                                                                   |
| `sessionApi`      | POST `/api/sessions`, POST `/api/sessions/end`, GET `/api/sessions`                                       |
| `analyticsApi`    | GET `/api/analytics` (query params: period, view, type), GET `/api/bi`, GET `/api/bi/reports`             |
| `menuApi`         | GET `/api/menu`, `/api/menu/{id}`                                                                         |
| `storeApi`        | GET `/api/stores`, `/api/stores/{storeId}`                                                                |
| `shiftApi`        | GET `/api/shifts`, `/api/shifts/{id}`, POST `/api/shifts`                                                 |
| `paymentApi`      | POST `/api/payments/initiate`, `/api/payments/verify`, `/api/payments/cash`                               |
| `equipmentApi`    | GET `/api/equipment`, PATCH `/api/equipment/{id}`                                                         |
| `inventoryApi`    | GET `/api/inventory`, PATCH `/api/inventory/{id}`                                                         |
| `customerApi`     | GET/POST `/api/customers`, POST `/api/customers/{id}/loyalty`                                             |
| `driverApi`       | GET/PUT `/api/users/{driverId}/status`, GET `/api/delivery/driver/{id}/performance`                       |
| `deliveryApi`     | GET `/api/delivery/track/{orderId}`, GET `/api/delivery/driver/{id}/pending`                              |
| `reviewApi`       | GET/POST `/api/reviews`, GET `/api/reviews/public/token/{token}`                                          |
| `notificationApi` | GET `/api/notifications`, PATCH `/api/notifications/{id}/read`                                            |
| `kioskApi`        | POST `/api/users/kiosk/auto-login`                                                                        |
| `agentApi`        | POST `/api/agents/{name}/trigger` — AI agent manual triggers                                              |
| `fiscalApi`       | GET/POST `/api/payments/fiscal/**` — fiscal compliance (Global-5)                                         |

---

### 11.4 Pages (7)

#### HomePage.tsx
- Landing page — public menu browse, hero section, store selector
- Store picker with Haversine distance calculation from user's geolocation
- Featured categories, promotional banners
- No auth required

#### CustomerApp.tsx
- Main customer ordering interface
- Menu browsing with cuisine/category filters
- Cart management (add/remove/update quantities)
- Checkout flow (guest or authenticated)
- Order placement via `useCreateOrder()` mutation
- Real-time order tracking with WebSocket subscription (`useOrderTrackingWebSocket`)
- Post-delivery rating form (token-based, public)

#### DashboardPage.tsx
- Manager analytics dashboard
- Sales KPIs: revenue, order count, AOV, GMV
- Staff overview: active sessions, shifts
- Inventory alerts: low stock items
- Kitchen performance: prep times, throughput
- All data via `analyticsApi` RTK Query endpoints
- Protected: MANAGER | ASSISTANT_MANAGER only

#### PublicMenuPage.tsx
- Unauthenticated menu access
- No cart, no checkout — browse only
- SEO-optimised (static rendering possible)

#### PublicRatingPage.tsx
- Post-delivery anonymous review submission
- URL: `/rate/{token}` (token from email/SMS)
- GET `/api/reviews/public/token/{token}` to validate
- POST `/api/reviews` to submit rating
- 1–5 star rating + text comment
- No auth required

#### GdprRequests.tsx
- Data subject request form (access/deletion/portability/objection)
- Public — no auth required
- Submits to GDPR controller

#### PrivacyPolicy.tsx
- Static privacy policy & terms of service page

#### FiscalCompliancePage.tsx (Global-5)
- Route: `/manager/fiscal-compliance`
- Protected: MANAGER only
- Lists fiscal signatures per order, signing status, failed signings
- Uses `fiscalApi` RTK slice
- Alerts manager if `fiscalSigningFailed=true` on any recent order

---

### 11.4a Allergen Constants

**File:** `frontend/src/constants/allergens.ts`

14 EU mandatory allergens with display names and icon keys:
```typescript
export const EU_ALLERGENS = [
  { key: 'GLUTEN', label: 'Gluten', icon: 'wheat' },
  { key: 'CRUSTACEANS', label: 'Crustaceans', icon: 'shrimp' },
  // ... 12 more: EGGS, FISH, PEANUTS, SOYBEANS, MILK, NUTS,
  //              CELERY, MUSTARD, SESAME, SULPHITES, LUPIN, MOLLUSCS
]
```
Used by: `RecipeManagementPage`, `KitchenDisplayPage` allergen badges, `ProfilePage` allergen alert preferences.

---

### 11.5 Custom Hooks (21)

#### Authentication & Session
| Hook                | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `useSecureAuth()`   | Secure auth token management, expiry checks |
| `useTokenRefresh()` | Automatic token refresh on 401 — tested     |

#### Real-Time Data (WebSocket)
| Hook                           | Topic Subscribed                                          |
| ------------------------------ | --------------------------------------------------------- |
| `useWebSocket()`               | Generic STOMP connection management                       |
| `useOrderWebSocket()`          | `/topic/store/{storeId}/orders` — new orders              |
| `useKitchenWebSocket()`        | `/topic/store/{storeId}/kitchen` — KDS updates            |
| `useOrderTrackingWebSocket()`  | `/topic/delivery/{orderId}` — delivery tracking           |
| `useCustomerOrdersWebSocket()` | `/queue/customer/{customerId}/orders` — customer orders   |
| `useDriverLocationWebSocket()` | `/topic/driver/{driverId}/location` — driver GPS (tested) |

#### UI Utilities
| Hook                       | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `useToast()`               | Toast notification queue management        |
| `useKioskMode()`           | Fullscreen kiosk mode toggle (tested)      |
| `useSmartBackNavigation()` | Context-aware browser back button (tested) |

#### Data Management
| Hook                 | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `useOrderTracking()` | Order state machine, progress calculation      |
| `useGeocoding()`     | Address ↔ lat/lng via Google Maps API (tested) |

#### Storage
| Hook                | Purpose                            |
| ------------------- | ---------------------------------- |
| `useLocalStorage()` | Type-safe persistent local storage |

---

### 11.6 Design System

#### Design Pattern 1: Neumorphic (Staff Web Pages)
- Applied to: DashboardPage, session management, shift management, all staff-facing UI
- Tokens defined in: `frontend/src/styles/design-tokens.ts`
- CSS variables: `--nm-light: #e0e5ec`, `--nm-dark: #a3b1c6`
- Shadow pattern: `box-shadow: inset 2px 2px 5px rgba(163,177,198,0.5), inset -2px -2px 5px rgba(255,255,255,0.6)`
- **Rule:** Use neumorphic tokens ONLY on staff pages — never mix with dark-premium vars

#### Design Pattern 2: Dark-Premium (Customer Web Pages)
- Applied to: CustomerApp, PublicMenuPage, PublicRatingPage, HomePage
- Tokens defined in: `frontend/src/styles/theme.ts` (MUI theme overrides)
- CSS vars scoped to `.dark-premium-theme` class (NOT `:root`)
- Primary: `--dp-primary: #FF6B35` (Tangerine orange)
- Background: `--dp-bg: #0F0E17` (deep black)
- Accent glow effects, neon highlights
- **Rule:** Use `--dp-*` CSS vars only — never hardcode `#` hex colours or `px` spacing

#### Localization (i18n)
- Framework: `react-i18next`
- Languages: English (en), Hindi (hi), German (de), French (fr)
- Namespaces: `common`, `orders`, `menu`, `notifications`, `errors`
- Usage: `const { t } = useTranslation(); t('orders.status.PREPARING')`

---

### 11.7 API Configuration

**File:** `src/config/api.config.ts`

```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// Canonical paths (194 live endpoints — no /api/v1/ prefix)
export const API_PATHS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    google: '/api/auth/google',
  },
  orders: {
    base: '/api/orders',
    byId: (id: string) => `/api/orders/${id}`,
    status: (id: string) => `/api/orders/${id}/status`,
    track: (id: string) => `/api/orders/track/${id}`,
    kitchen: '/api/orders/kitchen',
  },
  sessions: {
    start: '/api/sessions',
    end: '/api/sessions/end',
    list: '/api/sessions',        // GET with query params: employeeId, storeId, active
  },
  // ... all 194 canonical paths — see MASOVA_MASTER_REFERENCE_ENDPOINTS.md
}
```

**Headers added to every request:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Staff pages also add:**
```
X-User-Store-Id: {user.storeId}
```

---

### 11.8 Testing Architecture

#### Test File Organization
```
src/
├── hooks/__tests__/
│   ├── useGeocoding.test.tsx
│   ├── useKioskMode.test.tsx
│   ├── useTokenRefresh.test.tsx
│   └── useSmartBackNavigation.test.tsx
├── pages/__tests__/
│   ├── CustomerApp.test.tsx
│   ├── DashboardPage.test.tsx
│   ├── HomePage.test.tsx
│   └── PublicMenuPage.test.tsx
├── components/__tests__/
│   └── StoreSelector.test.tsx
└── test/
    ├── integration/
    │   ├── order-creation-flow.test.ts
    │   └── delivery-dispatch-flow.test.ts
    ├── mocks/
    │   ├── server.ts          # MSW server setup
    │   └── handlers.ts        # HTTP request mock handlers
    ├── fixtures/
    │   ├── mockOrders.ts
    │   ├── mockUsers.ts
    │   ├── mockMenu.ts
    │   ├── mockPayments.ts
    │   └── mockDelivery.ts
    └── utils/
        └── testUtils.tsx      # Render with Redux + React Query providers
```

#### Test Types
- **Unit:** Hooks, utility functions (currency, validation, date formatting)
- **Integration:** Full flow tests (order creation → payment → tracking, delivery dispatch)
- **Contract (Pact):** Consumer-driven contracts between frontend and each backend API
- **MSW:** All HTTP calls intercepted — no real network in tests

#### Test Wrapper (TestWrapper.tsx)
Wraps components with: `Redux Provider + QueryClientProvider + MemoryRouter + ThemeProvider`

---

### 11.9 Build & Deployment

```bash
# Development
npm run dev           # Vite HMR on :3000

# Production build
npm run build         # Output: /dist (optimised, code-split)

# Test
npm run test          # Vitest
npm run test:coverage # Coverage report

# Lint
npm run lint
```

**Production deploy:** Firebase Hosting
**Staging/preview:** Vercel
**CI/CD:** GitHub Actions on push to main

---

## 12. AI SUPPORT AGENT (masova-support)

**Location:** `/Users/souravamseekarmarti/Projects/masova-support`
**Technology:** Python 3.9–3.12, Google ADK 1.25, FastAPI, APScheduler
**Port:** 8000
**Run command:** `uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload`
**Version:** 0.3.0

---

### 12.1 Architecture Overview

```
masova-support/
├── src/masova_agent/
│   ├── main.py                   # FastAPI app, lifespan, all HTTP endpoints
│   ├── agent.py                  # Root LlmAgent, send_message_async()
│   ├── core/
│   │   ├── agent.py              # MaSoVaAgent class (singleton)
│   │   └── redis_session_service.py  # Redis-backed session persistence
│   ├── tools/
│   │   ├── backend_tools.py      # 8 tool functions (HTTP → Spring backend)
│   │   └── system_briefing.py    # SystemBriefingTool (mock data)
│   ├── agents/                   # 7 background agents
│   │   ├── demand_forecasting_agent.py
│   │   ├── inventory_reorder_agent.py
│   │   ├── churn_prevention_agent.py
│   │   ├── review_response_agent.py
│   │   ├── shift_optimisation_agent.py  # stub
│   │   ├── kitchen_coach_agent.py       # stub
│   │   └── dynamic_pricing_agent.py     # stub
│   ├── scheduler/
│   │   └── scheduler.py          # APScheduler job registration
│   ├── services/
│   │   ├── customer_service.py   # CustomerService (mock data)
│   │   ├── order_service.py      # OrderService (mock data)
│   │   └── location_service.py   # IP geolocation with caching
│   ├── data/
│   │   ├── models.py             # Customer, Order, Location dataclasses
│   │   └── repositories.py       # In-memory mock repositories
│   ├── utils/
│   │   ├── config.py             # Config dataclasses + singleton
│   │   └── logger.py             # Logger setup
│   └── exceptions/
│       └── __init__.py           # All custom exceptions
├── tests/
│   ├── test_scenarios.py
│   ├── test_connection.py
│   └── test_redis_session.py
├── config/
│   └── logging.yaml
├── requirements.txt
└── pyproject.toml
```

---

### 12.2 Core Dependencies

```
google-adk==1.25.0
fastapi==0.115.6
uvicorn[standard]==0.34.0
google-genai==1.63.0
httpx==0.28.1
python-dotenv==1.2.1
redis==5.2.1
apscheduler==3.10.4
aio-pika==9.4.1
google-cloud-aiplatform==1.137.0
```

---

### 12.3 FastAPI Application (main.py)

#### Data Models
```python
class ChatRequest(BaseModel):
    message: str
    sessionId: Optional[str] = None
    customerId: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    sessionId: str
```

#### Lifespan
1. Start APScheduler with all registered jobs
2. Start RabbitMQ consumer for Agent 5 (review.created events with rating ≤ 3)
3. On shutdown: graceful stop of both

#### All HTTP Endpoints

| Method | Path                                 | Purpose                                    |
| ------ | ------------------------------------ | ------------------------------------------ |
| GET    | `/health`                            | Health check → `{"status": "ok"}`          |
| POST   | `/agent/chat`                        | Customer support chat (primary)            |
| POST   | `/agents/demand-forecast/trigger`    | Manual trigger Agent 2                     |
| POST   | `/agents/inventory-reorder/trigger`  | Manual trigger Agent 3                     |
| POST   | `/agents/churn-prevention/trigger`   | Manual trigger Agent 4                     |
| POST   | `/agents/review-response/trigger`    | Manual trigger Agent 5 (body: review_data) |
| POST   | `/agents/shift-optimisation/trigger` | Manual trigger Agent 6                     |
| POST   | `/agents/kitchen-coach/trigger`      | Manual trigger Agent 7                     |
| POST   | `/agents/dynamic-pricing/trigger`    | Manual trigger Agent 8                     |

**CORS origins:** `http://localhost:5173`, `http://localhost:3000`, `http://localhost:8080`

---

### 12.4 Root LlmAgent (agent.py)

```python
root_agent = LlmAgent(
    name="MaSoVa_Support",
    model="gemini-2.0-flash",
    instruction="[detailed system prompt]"
)
```

**System instruction defines:**
- Assistant is MaSoVa's friendly customer support for a multi-branch restaurant chain
- Menus: South Indian, North Indian, Indo-Chinese, Italian, American, Continental, Beverages
- Tone: warm, concise, max 150 words unless listing items
- Protocol: confirm details before actions, never surface raw API errors

**Tools registered:**
1. `get_order_status`
2. `get_menu_items`
3. `get_store_hours`
4. `submit_complaint`
5. `request_refund`
6. `get_loyalty_points`
7. `get_store_wait_time`
8. `cancel_order`

**Session flow:**
```python
async def send_message_async(message, user_id, session_id) -> str:
    session_id = await _ensure_session(user_id, session_id)
    runner = Runner(agent=root_agent, app_name="masova_support", session_service=_session_service)
    content = genai_types.Content(role="user", parts=[genai_types.Part(text=message)])
    # stream events, accumulate text parts
    return response_text
```

**ADK exports (for ADK discovery):**
```python
agent = root_agent
app = root_agent
```

---

### 12.5 Tool Functions (backend_tools.py)

All tools call Spring Boot backend via `httpx`. Base URL: `MASOVA_BACKEND_URL` env (default: `http://localhost:8080/api`). All calls: 8-second timeout.

#### Tool 1: get_order_status(order_id: str) → str
- GET `/api/orders/public/{order_id}`
- Returns: `"Order #ORD123 is PREPARING. ETA: 15 min. Items: Chicken Biryani, Garlic Naan."`
- Status messages for all 10 OrderStatus values
- Friendly "Order not found" if 404

#### Tool 2: get_menu_items(store_id: str, category: str = "") → str
- GET `/api/menu/items?storeId={storeId}&available=true[&category={category}]`
- Returns up to 10 items: `"- Masala Dosa[Medium]: ₹89 — Crispy rice crepe with potato filling..."`
- Shows count of remaining if > 10: `"...and 5 more items."`

#### Tool 3: get_store_hours(store_id: str) → str
- GET `/api/stores/{store_id}`
- Returns: `"MaSoVa Store 1 is currently OPEN. Hours: 08:00 – 23:00."`

#### Tool 4: submit_complaint(customer_id: str, order_id: str, description: str) → str
- Validates: description ≥ 10 chars
- POST `/api/reviews/complaints` with `{customerId, orderId, description, type: "COMPLAINT"}`
- Returns: ticket reference

#### Tool 5: get_loyalty_points(customer_id: str) → str
- GET `/api/customers/{customer_id}/stats`
- Returns points, tier, progress to next tier
- Tier thresholds: BRONZE→SILVER 500 pts, SILVER→GOLD 2000 pts, GOLD→PLATINUM 5000 pts

#### Tool 6: get_store_wait_time(store_id: str) → str
- GET `/api/orders/kitchen/queue?storeId={storeId}&status=RECEIVED,PREPARING,OVEN`
- Maps active order count to wait estimate:
  - 0 orders → "very fast service"
  - 1–5 → "15–20 minutes"
  - 6–10 → "25–35 minutes"
  - >10 → "40–50 minutes"

#### Tool 7: cancel_order(order_id: str, reason: str) → str
- First: GET `/api/orders/public/{order_id}` — validates status is PENDING or RECEIVED
- Then: POST `/api/orders/{order_id}/cancel` with reason
- Returns confirmation or error (e.g. "Order is already being prepared and cannot be cancelled")

#### Tool 8: request_refund(order_id: str, reason: str) → str
- Validates: reason ≥ 5 chars
- POST `/api/payments/refund/request` with `{orderId, reason}`
- Returns: `"Refund request submitted for Order #ORD123. Processing takes 3-5 business days."`

---

### 12.6 Redis Session Service (redis_session_service.py)

```python
SESSION_TTL_SECONDS = 3600   # 1 hour
MAX_HISTORY_TURNS = 10
REDIS_KEY_PREFIX = "masova:session:"
```

**Fallback:** If Redis unavailable (socket timeout 2s), falls back to `InMemorySessionService`

**SessionData dataclass:**
```python
@dataclass
class SessionData:
    id: str
    app_name: str
    user_id: str
    history: list = field(default_factory=list)
```

**Key methods:**
- `create_session(app_name, user_id, session_id=None)` → SessionData (stores in Redis with TTL)
- `get_session(app_name, user_id, session_id)` → Optional[SessionData]
- `append_turn(session_id, role, text)` → None (trims to MAX_HISTORY_TURNS, refreshes TTL)

Redis key format: `masova:session:{session_id}`

---

### 12.7 Background Agents — APScheduler

**Scheduler config:**
```python
AsyncIOScheduler(
    executors={"default": AsyncIOExecutor()},
    job_defaults={"coalesce": True, "max_instances": 1},
    timezone="Asia/Kolkata"
)
```

**All 6 scheduled jobs:**

| Agent                       | Schedule                    | Status |
| --------------------------- | --------------------------- | ------ |
| Agent 2: Demand Forecasting | Nightly 2am IST             | Live   |
| Agent 3: Inventory Reorder  | Every 6 hours               | Live   |
| Agent 4: Churn Prevention   | Daily 10am IST              | Live   |
| Agent 5: Review Response    | RabbitMQ event (rating ≤ 3) | Live   |
| Agent 6: Shift Optimisation | Sundays 8pm IST             | Stub   |
| Agent 7: Kitchen Coach      | Nightly 11pm IST            | Stub   |
| Agent 8: Dynamic Pricing    | Every 30 min, 9am–10pm IST  | Stub   |

**Architecture rules for all agents:**
- `async def` functions, return `dict`
- NEVER auto-write to database — agents propose (DRAFT status), manager approves
- If LLM call fails: fall back to rule-based response — never surface raw API errors
- Every action logged: agent name, trigger type (scheduled/manual), store_id, output summary
- APScheduler jobs share the FastAPI event loop — never create `asyncio.run()` inside a job

---

### 12.8 Agent 2: Demand Forecasting

**File:** `agents/demand_forecasting_agent.py`
**Schedule:** Nightly 2am IST
**Returns:** `{"forecasts": total_count, "stores": store_count, "generated_at": timestamp}`

**Algorithm:**
1. Fetch all stores from backend
2. For each store: fetch 90-day order history
3. Aggregate: `{menuItemId: {day_of_week: {hour: [quantities]}}}`
4. Generate forecast for tomorrow using weighted moving average
   - Weights: `1, 1 + (n-1)/n` (recent days weighted higher)
   - Considers day-of-week seasonality
5. POST forecasts to `/api/analytics/forecast`

---

### 12.9 Agent 3: Inventory Reorder

**File:** `agents/inventory_reorder_agent.py`
**Schedule:** Every 6 hours
**Returns:** `{"pos_drafted": count, "items_checked": count}`

**Logic:**
1. GET low-stock items per store (`currentStock < minStock`)
2. Group by preferred supplier
3. Draft PO: `{"storeId", "supplierId", "status": "DRAFT", "autoGenerated": True, "items": [...]}`
4. POST `/api/purchase-orders/auto-generate`
5. Notify managers with INVENTORY_ALERT notification

---

### 12.10 Agent 4: Churn Prevention

**File:** `agents/churn_prevention_agent.py`
**Schedule:** Daily 10am IST
**Returns:** `{"campaigns_created": count, "customers_targeted": count}`

**Constants:**
```python
CHURN_WINDOW_DAYS = 14          # No order in last 14 days = churned
QUALIFYING_ORDER_COUNT = 3       # Must have had 3+ orders to be "high value"
QUALIFYING_PERIOD_DAYS = 60      # Within last 60 days
RECOVERY_DISCOUNT_PERCENT = 15   # 15% win-back discount
```

**Campaign payload:**
```python
{
    "storeId": store_id,
    "name": "Win-Back Campaign — {date}",
    "type": "WIN_BACK",
    "status": "DRAFT",
    "autoGenerated": True,
    "targetSegment": "CHURNED_HIGH_VALUE",
    "customerIds": [...],
    "discountPercent": 15,
    "message": "We miss you! Come back and enjoy 15% off...",
    "expiresInDays": 7,
    "generatedBy": "churn_prevention_agent"
}
```

---

### 12.11 Agent 5: Review Response

**File:** `agents/review_response_agent.py`
**Trigger:** RabbitMQ event (`review.created`, rating ≤ 3)
**Returns:** `{"reviewId": id, "draftGenerated": True, "responseLength": len}`

**Logic:**
1. Extract complaint keywords from review text (cold, slow, late, wrong, missing, rude, dirty, overpriced, raw, burnt, stale, hair, wait, cancelled, never arrived, incorrect)
2. Call Gemini 2.0 Flash Lite to generate draft response (max 100 words, no marketing language)
3. On LLM failure: rule-based fallback:
   `"Thank you for your honest feedback. We're sorry to hear about {issue}. Our team is looking into this and we'll take steps to improve. We'd love the chance to make it right — please visit us again soon."`
4. Notify managers with REVIEW_DRAFT_RESPONSE notification

**Prompt instructions:**
- Acknowledge specific feedback (mention items if identifiable)
- Apologise sincerely
- State action to be taken
- Invite customer back with goodwill
- Max 100 words, no marketing language

---

### 12.12 Agents 6, 7, 8 (Stubs)

All three return `{"status": "stub", "message": "Requires Phase 2 PostgreSQL migration"}`.

Future functionality:
- **Agent 6 (Shift Optimisation):** Draft shift schedule based on demand forecasts + staff availability (Sunday 8pm)
- **Agent 7 (Kitchen Coach):** Nightly performance summary + coaching tips for kitchen staff
- **Agent 8 (Dynamic Pricing):** Suggest price adjustments based on real-time demand vs forecast (every 30 min during business hours)

---

### 12.13 Environment Variables

| Variable                    | Default                                  | Required |
| --------------------------- | ---------------------------------------- | -------- |
| `GOOGLE_API_KEY`            | —                                        | YES      |
| `GOOGLE_GENAI_USE_VERTEXAI` | `"0"`                                    | No       |
| `MASOVA_BACKEND_URL`        | `http://localhost:8080/api`              | No       |
| `MASOVA_INTERNAL_TOKEN`     | `""`                                     | No       |
| `REDIS_URL`                 | `redis://192.168.50.88:6379/1`           | No       |
| `AGENT_TOKEN`               | `""`                                     | No       |
| `RABBITMQ_URL`              | `amqp://guest:guest@192.168.50.88:5672/` | No       |
| `BACKEND_URL`               | `http://192.168.50.88:8080`              | No       |
| `LOG_LEVEL`                 | `INFO`                                   | No       |
| `LOG_FILE`                  | —                                        | No       |
| `LOCATION_API_URL`          | `http://ip-api.com/json/`                | No       |
| `LOCATION_TIMEOUT`          | `5.0`                                    | No       |

---

### 12.14 Data Models

#### Customer (dataclass)
```python
customer_id: str
name: str
tier: CustomerTier    # BRONZE, SILVER, GOLD, PLATINUM
loyalty_points: int
email: str
phone: str
created_at: str
```

#### Order (dataclass)
```python
order_id: str
customer_id: str
item: str
status: OrderStatus   # PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
quantity: int
total_amount: float
created_at: str
updated_at: str
```

#### Location (dataclass)
```python
city: str
country: str
latitude: float
longitude: float
region: str
# __str__ returns "city, country"
```

---

### 12.15 LocationService

- Fetches geolocation via `http://ip-api.com/json/` (5s timeout)
- In-memory cache with 1h TTL, max 1000 entries (LRU eviction)
- Cache keyed by customer_id (optional)

---

### 12.16 Custom Exceptions

```python
MaSoVaException (base)
├── CustomerNotFoundError("Customer not found: {identifier}")
├── OrderNotFoundError("Order not found: {order_id}")
├── LocationServiceError("Location service unavailable")
├── ConfigurationError
└── AgentError
```

---

### 12.17 Test Suite

**test_scenarios.py** — 4 scenario smoke tests (user ID, menu inquiry, item availability, order placement)

**test_connection.py** — Google GenAI API connectivity check

**test_redis_session.py** (pytest-asyncio) — 3 unit tests:
1. `test_create_session_stores_in_redis` — verifies setex called
2. `test_session_ttl_is_one_hour` — verifies TTL = 3600
3. `test_fallback_to_in_memory_when_redis_unavailable` — verifies fallback path

---

*Continued in Part 3: MaSoVa Crew (Staff Mobile App)*



# MaSoVa Platform — Master Reference Document
## Part 3 of 5: MaSoVa Crew (Staff Mobile App)

---

## 13. MASOVA CREW — STAFF MOBILE APP

**Location:** `/Users/souravamseekarmarti/Projects/MaSoVaCrewApp`
**App Name:** MaSoVa Crew
**Package:** `com.masovacrew`
**Platform:** React Native 0.83.1, React 19.2.0 (bare RN, NOT Expo Go)
**Metro port:** Default (no custom port)
**State Management:** Redux Toolkit (RTK Query) + AsyncStorage persistence
**Real-time:** STOMP WebSocket (SockJS)

---

### 13.1 Project Dependencies

```json
"react-native": "0.83.1",
"react": "19.2.0",
"@reduxjs/toolkit": "2.11.2",
"react-redux": "9.2.0",
"@react-navigation/native": "latest",
"@react-navigation/stack": "latest",
"@react-navigation/bottom-tabs": "latest",
"@notifee/react-native": "9.1.8",
"@react-native-community/geolocation": "latest",
"@react-native-community/netinfo": "latest",
"@stomp/stompjs": "7.2.1",
"sockjs-client": "1.6.1",
"react-native-image-picker": "8.2.1",
"axios": "1.13.2",
"redux-persist": "6.0.0",
"date-fns": "4.1.0"
```

---

### 13.2 API Configuration (src/config/api.config.ts)

```typescript
// Development
API_BASE_URL = 'http://192.168.50.88:8080/api'
WS_URL = 'http://192.168.50.88:8090/ws'

// Production
API_BASE_URL = 'https://api.masova.com/api'
WS_URL = 'wss://api.masova.com/ws'

TIMEOUT = 30000   // 30 seconds
```

---

### 13.3 Redux Store

**Root reducer combines:**
- `auth` — authReducer (persisted to AsyncStorage)
- `driverApi` — RTK Query slice
- `orderApi` — RTK Query slice
- `deliveryApi` — RTK Query slice
- `crewApi` — RTK Query slice

**Persist config:** Whitelist = `['auth']` only (no API cache persistence)

#### authSlice

```typescript
State {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  loading: boolean
  error: string | null
  lastLoginAttempt: string | null
}
```

Actions: `loginStart`, `loginSuccess({accessToken, refreshToken, user})`, `loginFailure(error)`, `logout`, `refreshTokenSuccess(newToken)`, `updateUserProfile(updates)`, `clearError`, `setLoading`

Selectors: `selectAuth`, `selectCurrentUser`, `selectIsAuthenticated`, `selectAuthLoading`, `selectAuthError`

AsyncStorage keys: `auth_accessToken`, `auth_refreshToken`, `auth_user`

---

### 13.4 User Type Definitions

#### User Interface
```typescript
interface User {
  id: string
  type: 'CUSTOMER'|'STAFF'|'KITCHEN_STAFF'|'CASHIER'|'DRIVER'|'MANAGER'|'ASSISTANT_MANAGER'|'KIOSK'
  name: string
  email: string
  phone: string
  address?: Address
  isActive: boolean
  storeId?: string
  role?: string
  permissions?: string[]
  generatedPIN?: string
}
```

#### WorkingSession Interface
```typescript
interface WorkingSession {
  id: string
  employeeId: string
  storeId: string
  date: string
  loginTime: string
  logoutTime?: string
  totalHours?: number
  isActive: boolean
  breakTime: number
  status: 'ACTIVE'|'COMPLETED'|'PENDING_APPROVAL'
}
```

---

### 13.5 RTK Query API Slices

#### driverApi

**Types:** `Driver`, `DriverPerformance`, `DriverLocation`, `UpdateDriverRequest`, `LocationUpdateRequest`

**Endpoints:**
| Endpoint                                                 | Method | Path                                             |
| -------------------------------------------------------- | ------ | ------------------------------------------------ |
| `getDriverById(id)`                                      | GET    | `/users/{id}`                                    |
| `getDriverByUserId(userId)`                              | GET    | `/users/{userId}`                                |
| `updateDriver({id, data})`                               | PUT    | `/users/{id}`                                    |
| `updateDriverLocation(data)`                             | POST   | `/delivery/location-update`                      |
| `getDriverPerformance({driverId, startDate?, endDate?})` | GET    | `/delivery/driver/{id}/performance`              |
| `getTodayDriverPerformance(driverId)`                    | GET    | `/delivery/driver/{id}/performance?period=today` |
| `getDriverStatus(driverId)`                              | GET    | `/users/{driverId}/status`                       |
| `updateDriverStatus({driverId, status})`                 | PUT    | `/users/{driverId}/status`                       |

**DriverPerformance fields:**
```typescript
{
  totalDeliveries, completedDeliveries, cancelledDeliveries
  averageDeliveryTime (minutes), onTimeDeliveryPercentage
  totalDistanceCovered (km), averageRating
  totalEarnings, todayDeliveries, todayEarnings
  weekDeliveries, weekEarnings, monthDeliveries, monthEarnings
}
```

**Headers added per request:**
```
Authorization: Bearer {accessToken}
X-User-Id: {user.id}
X-User-Type: {user.type}
X-User-Store-Id: {user.storeId}
```

#### orderApi

**Types:** `KitchenOrder`, `MenuItem`, `StaffOrderRequest`, `TodayAnalytics`, `RecentOrder`

**Endpoints:**
| Endpoint                               | Method | Path                                              |
| -------------------------------------- | ------ | ------------------------------------------------- |
| `getOrdersByStatus(status)`            | GET    | `/orders/status/{status}`                         |
| `updateOrderStatus({orderId, status})` | PATCH  | `/orders/{orderId}/status`                        |
| `getKitchenOrders(storeId)`            | GET    | `/orders/kitchen?storeId={storeId}`               |
| `advanceOrderStage(orderId)`           | POST   | `/orders/{orderId}/next-stage`                    |
| `getMenuItems(storeId)`                | GET    | `/menu?storeId={storeId}&available=true`          |
| `placeStaffOrder(body)`                | POST   | `/orders`                                         |
| `getTodayAnalytics(storeId)`           | GET    | `/analytics/sales?period=today&storeId={storeId}` |
| `getRecentOrders(storeId)`             | GET    | `/orders?storeId={storeId}&limit=5`               |

**KitchenOrder fields:**
```typescript
{
  id, orderNumber, status, orderType: 'DINE_IN'|'TAKEAWAY'|'DELIVERY'
  tableNumber?, createdAt
  items: [{name, quantity, customizations?, allergens?}]
  specialInstructions?
}
```

#### deliveryApi

**Types:** `DeliveryTracking`

| Endpoint                                 | Method | Path                                              | Polling |
| ---------------------------------------- | ------ | ------------------------------------------------- | ------- |
| `getPendingDeliveries(driverId)`         | GET    | `/delivery/driver/{id}/pending`                   | 30s     |
| `getActiveDeliveries(driverId)`          | GET    | `/delivery/driver/{id}/pending`                   | 30s     |
| `markAsPickedUp(trackingId)`             | PATCH  | `/delivery/{trackingId}/status` (body: PICKED_UP) | —       |
| `markAsDelivered({trackingId, notes?})`  | PATCH  | `/delivery/{trackingId}/status` (body: DELIVERED) | —       |
| `updateLocation({driverId, lat, lng})`   | POST   | `/delivery/location`                              | —       |
| `getDeliveryHistory({driverId, limit?})` | GET    | `/delivery/driver/{id}/pending?status=DELIVERED`  | —       |

#### crewApi

**Types:** `WorkingSession`, `Shift`, `WeeklyEarnings`

| Endpoint                                        | Method | Path                                                 |
| ----------------------------------------------- | ------ | ---------------------------------------------------- |
| `getMyActiveSession(employeeId)`                | GET    | `/sessions?employeeId={id}&active=true`              |
| `getMySessionHistory({employeeId, limit?})`     | GET    | `/sessions?employeeId={id}&limit=10`                 |
| `clockIn({employeeId, storeId})`                | POST   | `/sessions`                                          |
| `clockOut({sessionId})`                         | POST   | `/sessions/end`                                      |
| `getMyUpcomingShifts({employeeId, storeId})`    | GET    | `/shifts?employeeId={id}&storeId={id}&upcoming=true` |
| `getMyShiftHistory({employeeId})`               | GET    | `/shifts?employeeId={id}&past=true`                  |
| `getMyWeeklyEarnings({employeeId, weekStart?})` | GET    | `/staff/earnings/weekly?employeeId={id}`             |
| `getMyEarningsHistory({employeeId, weeks?})`    | GET    | `/staff/earnings/history?employeeId={id}&weeks={n}`  |

---

### 13.6 Navigation Structure

#### AppNavigator (Root)
```
Not authenticated → LoginScreen
Authenticated →
  DRIVER            → DriverTabNavigator
  KITCHEN_STAFF     → KitchenTabNavigator
  STAFF             → KitchenTabNavigator
  CASHIER           → CashierTabNavigator
  KIOSK             → CashierTabNavigator
  MANAGER           → ManagerTabNavigator
  ASSISTANT_MANAGER → ManagerTabNavigator
  Other             → StaffTabNavigator (generic fallback)
  Unsupported       → "Access Denied" screen
```

**Critical rule:** `RoleRouter` reads `user.type` from JWT — NEVER hardcode role checks inline in screens

#### DriverTabNavigator (7 tabs)

| #   | Tab Label | Screen                | Icon           | Accent  |
| --- | --------- | --------------------- | -------------- | ------- |
| 1   | Home      | DeliveryHomeScreen    | home           | #00B14F |
| 2   | Active    | ActiveDeliveryScreen  | local-shipping |         |
| 3   | History   | DeliveryHistoryScreen | history        |         |
| 4   | Shifts    | MyShiftsScreen        | timer          |         |
| 5   | Schedule  | MyScheduleScreen      | event          |         |
| 6   | Earnings  | MyEarningsScreen      | payments       |         |
| 7   | Profile   | MyProfileScreen       | person         |         |

**Tab bar:** Height 64px, active colour #00B14F (driver green)

#### KitchenTabNavigator (3 tabs)

| Tab     | Screen             | Icon       | Accent  |
| ------- | ------------------ | ---------- | ------- |
| Queue   | KitchenQueueScreen | restaurant | #FF6B35 |
| Shifts  | MyShiftsScreen     | timer      |         |
| Profile | MyProfileScreen    | person     |         |

#### CashierTabNavigator (3 tabs)

| Tab     | Screen           | Icon       | Accent  |
| ------- | ---------------- | ---------- | ------- |
| Orders  | QuickOrderScreen | add-circle | #2196F3 |
| Shifts  | MyShiftsScreen   | timer      |         |
| Profile | MyProfileScreen  | person     |         |

#### ManagerTabNavigator (3 tabs)

| Tab       | Screen                        | Icon      | Accent  |
| --------- | ----------------------------- | --------- | ------- |
| Dashboard | QuickDashboardScreen          | dashboard | #7B1FA2 |
| Staff     | MyShiftsScreen (manager view) | people    |         |
| Profile   | MyProfileScreen               | person    |         |

#### StaffTabNavigator (4 tabs — generic fallback)

| Tab      | Screen           | Icon     |
| -------- | ---------------- | -------- |
| Shifts   | MyShiftsScreen   | timer    |
| Schedule | MyScheduleScreen | event    |
| Earnings | MyEarningsScreen | payments |
| Profile  | MyProfileScreen  | person   |

---

### 13.7 Role Colours (NEVER change these)

```typescript
DRIVER:            #00B14F  (green)
KITCHEN_STAFF:     #FF6B35  (orange)
CASHIER / KIOSK:   #2196F3  (blue)
MANAGER:           #7B1FA2  (purple)
ASSISTANT_MANAGER: #FF9800  (amber)
```

---

### 13.8 Screens — Complete Specifications

#### LoginScreen

**State:** `email`, `password`, `showPassword`, `rememberMe`, `gpsPermission`, `isCheckingGPS`

**Features:**
- Email/password form with validation (email format, password ≥ 6 chars)
- GPS permission check before login (required for drivers)
- Demo credentials preset button
- Show/hide password toggle
- Features grid (capabilities overview)
- Entrance animations (fade + slide)

**API:** POST `/api/users/login` → `{accessToken, refreshToken, user}`

**On success:** AppNavigator auto-routes via RoleRouter based on `user.type`

---

#### DeliveryHomeScreen (Driver)

**State:** `location`, `isOnline`, `sessionStartTime`, `elapsedTime`, `locationMode: 'auto'|'manual'`, `performanceData`

**Sections:**

1. **GPS Tracking Section**
   - Toggle: Auto GPS / Manual location mode
   - Real-time coordinates with accuracy display
   - Session timer (HH:MM:SS, live)
   - Location error handling with retry

2. **Location Update Flow**
   - Foreground: `Geolocation.watchPosition()` (10m distanceFilter, 5s interval)
   - Background (Android): `BackgroundLocationModule.startTracking(driverId)`
   - WebSocket: `sendLocationUpdate()` on every GPS change
   - Offline queue: queues location updates if no network

3. **Today's Performance Stats** (4 metric cards)
   - Deliveries count
   - Earnings (₹)
   - Distance (km)
   - Avg delivery time (minutes)

4. **Actions**
   - My Location → LocationMapModal (OpenStreetMap embed)
   - Support → alert with phone/email

**API polling:** GET `/api/delivery/driver/{driverId}/performance` (30s)

**WebSocket:** subscribes to `/topic/driver/{driverId}/orders` for new assignment notifications

---

#### ActiveDeliveryScreen (Driver)

**State:** `viewMode: 'list'|'map'`, `myDeliveries`, `uploadingPhoto`

**Features:**
1. **Delivery List** — FlatList of active DISPATCHED orders for current driver
2. **DeliveryCard** shows: order number, customer name+phone, address, ETA, total ₹

3. **Mark Delivered Flow:**
   - Alert: "Skip Photo" or "Take Photo"
   - Photo capture: quality 0.8, max 5MB, max 1920×1080
   - Upload via photoUploadService
   - If offline: enqueue for retry via offlineQueueService
   - Status update PATCH `/api/orders/{orderId}/status` → DELIVERED
   - Success notification via notificationService

4. **OTP Verification** (OtpVerificationScreen modal)
   - 4-digit OTP input
   - POST `/api/delivery/verify-otp` with `{orderId, otp}`

**API polling:** GET `/api/orders/status/DISPATCHED` (30s)

---

#### DeliveryHistoryScreen (Driver)

**State:** `timeFilter: 'today'|'week'|'month'|'all'`, `searchQuery`, `expandedOrder`

**Features:**
- Search by order number or customer name
- Time filter dropdown
- Grouped by date (timeline view with dot + vertical line)
- Expandable cards: time, amount, address, items (first 3, "+N more")
- **Earnings calculation: 20% commission** (`orderTotal * 0.20`)

**API polling:** GET `/api/orders/status/DELIVERED` (60s)

---

#### KitchenQueueScreen (Kitchen Staff)

**State:** `orders: KitchenOrder[]`, `advancing: string | null`

**Features:**

1. **Order Cards** — left border colour indicates urgency:
   - <5 min ago: GREEN (#00B14F)
   - 5–10 min ago: ORANGE (#FFA726)
   - >10 min ago: RED (#F44336)

2. **Card content:**
   - Order number (large) + time ago (small)
   - Status (uppercase)
   - Table number (if DINE_IN)
   - Items: "Qty× Item Name" + customizations (indented)
   - Allergen badges (all 14 EU allergens, orange background)
   - Special instructions (emoji + text)
   - "▶ Advance Status" button

**API polling:** GET `/api/orders/kitchen?storeId={storeId}` (15s)
**API mutation:** POST `/api/orders/{orderId}/next-stage`

---

#### QuickOrderScreen (Cashier/Kiosk)

**State:** `cart: CartEntry[]`, `customerName`, `orderType: 'TAKEAWAY'|'DINE_IN'`, `tableNumber`, `menu`

**Features:**
1. Customer name input
2. Order type toggle: TAKEAWAY / DINE_IN
3. Table number input (visible only for DINE_IN)
4. Menu grid (2 columns): item name, price (kiosk blue), quantity badge if in cart
5. Sticky cart bar at bottom (when items exist): "N items · ₹Total" + "Place Order (Cash)"

**Validation:** customer name required, ≥1 item, table number required for DINE_IN

**StaffOrderRequest payload:**
```typescript
{
  storeId, customerName, orderType
  tableNumber? (DINE_IN only)
  paymentMethod: 'CASH'
  createdByStaffId, items: [{menuItemId, name, quantity, price}]
}
```

**API:** GET `/api/menu?storeId={storeId}&available=true`, POST `/api/orders`

---

#### QuickDashboardScreen (Manager)

**State:** `analytics: TodayAnalytics`, `recentOrders: RecentOrder[]`

**Sections:**
1. KPI grid (2×2): Today Revenue ₹, Active Orders, Avg Prep (min), Staff On Duty
2. Recent orders list: order number, type, customer, total ₹, status badge

**API polling:**
- GET `/api/analytics/sales?period=today&storeId={storeId}` (60s)
- GET `/api/orders?storeId={storeId}&limit=5` (30s)

---

#### MyShiftsScreen (Shared — all roles)

**State:** `activeSession`, `history`, `clockingIn`, `clockingOut`

**Features:**
1. **Clock-In Card:**
   - If active: green dot + "Clocked In" + "Since HH:MM" + live duration + red "Clock Out" button
   - If not: timer icon + "Not clocked in" + role-coloured "Clock In" button

2. **Recent Sessions list:**
   - Per row: date, time range (login→logout), total hours (bold, role colour), status badge

**API calls:**
- GET `/api/sessions?employeeId={employeeId}&active=true` — active session
- GET `/api/sessions?employeeId={employeeId}&limit=10` — history
- POST `/api/sessions` with `{employeeId, storeId}` — clock in
- POST `/api/sessions/end` with `{sessionId}` — clock out

---

#### MyScheduleScreen (Shared)

**State:** `shifts: Shift[]`

**Features:**
- Cards per upcoming shift
- If today's shift: left border (4px, role colour) + "TODAY" badge
- Shift time range + duration (bold, role colour)
- Notes (grey italic if present)

**API:** GET `/api/shifts?employeeId={id}&storeId={id}&upcoming=true`

---

#### MyEarningsScreen (Shared)

**State:** `earnings: WeeklyEarnings`

**Sections:**
1. Week header: "Jan 15 – Jan 21"
2. Stats grid (2×2): Total This Week ₹, Hours Worked, Base Pay ₹, Tips Received ₹
3. Hourly rate row (if configured): "₹XXX / hr"
4. If rate not set: info banner "Pay rate not configured. Contact your manager."

**API polling:** GET `/api/staff/earnings/weekly?employeeId={id}` (300s / 5 min)

---

#### MyProfileScreen (Shared — all roles)

**Sections:**
1. Avatar (initials on role-coloured circle) + name + role pill + store ID
2. MY DETAILS: email, phone, employee ID (first 8 chars), store
3. SETTINGS: Push Notifications toggle (role colour when on)
4. APP: version 1.0.0, role label
5. Log Out button (red, confirmation alert)

**Role label mappings:**
```
DRIVER → 'Driver'
KITCHEN_STAFF | STAFF → 'Kitchen Staff'
CASHIER | KIOSK → 'Cashier'
MANAGER → 'Manager'
ASSISTANT_MANAGER → 'Asst. Manager'
```

**On logout:** clears `driver_online_{userId}`, `driver_session_start_{userId}`, `driver_default_location_{userId}` from AsyncStorage

---

#### OtpVerificationScreen (Driver)

**Props:** `{orderId, onVerified, onCancel}`
**State:** `otp: string (4 digits)`, `error`, `loading`

**Features:**
- Modal overlay (50% black transparent)
- 4-digit numeric OTP input (centred, large)
- "Verify & Complete Delivery" button
- "Cancel" button

**API:** POST `/api/delivery/verify` with `{orderId, otp}` → `{verified: boolean}`

---

### 13.9 Services

#### locationService.ts

```typescript
class LocationService (singleton) {
  requestLocationPermission(): Promise<boolean>
    // Android: ACCESS_FINE_LOCATION + ACCESS_BACKGROUND_LOCATION

  getCurrentLocation(): Promise<Location>
    // enableHighAccuracy: true, timeout: 15s, maxAge: 10s

  startTracking(onUpdate, options?): Promise<void>
    // Geolocation.watchPosition(), distanceFilter: 10m, interval: 5s

  stopTracking(): void

  saveDefaultLocation(userId, location): Promise<void>
  getDefaultLocation(userId): Promise<Location | null>
    // AsyncStorage: `driver_default_location_{userId}`

  calculateDistance(loc1, loc2): number
    // Haversine formula, returns km

  formatForApi(driverId, location): LocationUpdate
    // GeoJSON Point: {driverId, location: {type: 'Point', coordinates: [lon, lat]}, timestamp}
}
```

#### websocketService.ts (STOMP/SockJS)

```typescript
class WebSocketService (singleton) {
  connect(): Promise<void>
    // SockJS to {WS_URL}/delivery, reconnectDelay: 5s, heartbeat: 4s

  disconnect(): void

  sendLocationUpdate(driverId, location)
    // Publishes to /app/location-update

  subscribeToDriverLocation(driverId, callback)
    // Topic: /topic/driver/{driverId}/location

  subscribeToOrderTracking(orderId, callback)
    // Topic: /topic/order/{orderId}/tracking

  subscribeToDriverOrders(driverId, callback)
    // Topic: /topic/driver/{driverId}/orders
    // Auto-shows push notification on new assignment
}
```

**Disconnect handling:**
- Warning after 30s disconnected
- Auto-logout after 60s disconnected
- Callbacks: `onConnectionLost()`, `onAutoLogout()`

#### notificationService.ts (@notifee/react-native)

```typescript
class NotificationService (singleton) {
  initialize(): Promise<void>
    // Creates Android channel "masova-driver-channel"
    // Importance: HIGH, Visibility: PUBLIC, Vibration: [300, 500]ms

  notifyNewDelivery(orderNumber, customerName, address, orderId)
    // Title: "New Delivery Assignment"
    // Actions: "View Details" | "Navigate"

  notifyDeliveryUpdate(orderNumber, status, orderId)
    // Status-specific messages: PICKED_UP / IN_TRANSIT / DELIVERED / CANCELLED

  notifyCustomerMessage(orderNumber, customerName, message, orderId)

  cancelNotification(notificationId)
  cancelAllNotifications()
  areNotificationsEnabled(): Promise<boolean>
}
```

#### cameraService.ts (react-native-image-picker)

```typescript
class CameraService (singleton) {
  takePhoto(options?): Promise<CapturedImage | null>
    // Defaults: quality 0.8, maxWidth 1920, maxHeight 1080, back camera

  pickFromGallery(options?): Promise<CapturedImage | null>
  selectPhoto(options?): Promise<CapturedImage | null>
    // Shows alert: Camera | Gallery | Cancel

  isValidSize(image, maxSizeMB=5): boolean
  createFormData(image, fieldName='photo'): FormData
    // Filename: `delivery-proof-{timestamp}.jpg`
}
```

#### photoUploadService.ts

```typescript
class PhotoUploadService (singleton) {
  uploadProofOfDelivery(orderId, photo, token): Promise<PhotoUploadResult>
    // POST /delivery/{orderId}/proof (multipart/form-data), timeout 30s
    // On network error: enqueues via offlineQueueService

  validatePhotoSize(photo, maxSizeMB=5): boolean
  estimateUploadTime(photo, uploadSpeedKBps=100): number
}
```

#### backgroundLocationService.ts (native Android module)

```typescript
class BackgroundLocationService (singleton) {
  startTracking(driverId): Promise<{success, message}>
    // Calls native BackgroundLocationModule.startTracking() (Android only)

  stopTracking(): Promise<{success, message}>
  isTracking(): Promise<boolean>

  onLocationUpdate(callback): {remove: () => void}
    // NativeEventEmitter 'onLocationUpdate' event
    // BackgroundLocation: {latitude, longitude, accuracy, altitude, speed, bearing, timestamp}

  onLocationError(callback): {remove: () => void}
  removeAllListeners(): void
  formatForAPI(location): GeoJSON Point
  isSupported(): boolean  // Android only
}
```

#### offlineQueueService.ts

```typescript
class OfflineQueueService (singleton) {
  // QueueActionTypes: LOCATION_UPDATE, ORDER_STATUS_UPDATE, DELIVERY_COMPLETE, PHOTO_UPLOAD

  enqueue(type, payload, maxRetries=3): Promise<void>
    // Adds to queue, saves to AsyncStorage '@masova_offline_queue'
    // Queue limit: 1000 items
    // Tries to process immediately if online

  processQueue(): Promise<void>
    // Per-type handler: locationUpdate → websocket, others → API
    // Increments retryCount on failure, removes on success or maxRetries exceeded

  getQueueSize(): number
  isNetworkOnline(): boolean
  clearQueue(): void
  stop(): void
}
```

**Network monitoring:** `NetInfo.addEventListener()` — auto-processes queue on reconnect, periodic sync every 30s

---

### 13.10 Shared Components

#### ActionButton
```typescript
Props: { title, onPress, variant?: 'primary'|'secondary'|'outline'|'danger',
         size?: 'small'|'medium'|'large', disabled?, loading?, icon?, fullWidth? }

Variants: primary=green, secondary=alt bg, outline=transparent+border, danger=red
Heights: small 36, medium 48, large 56
```

#### MetricCard
```typescript
Props: { label, value, icon?, trend?: 'up'|'down'|'neutral', trendValue?,
         variant?: 'default'|'success'|'warning'|'error' }

Features: icon with 20% opacity coloured bg, trend indicator (↑ green, ↓ red)
```

#### DeliveryCard
```typescript
Props: { delivery: Delivery, onPress?, showActions? }
// Shows: order number, status badge, customer name+address+phone, ETA, distance, total
```

#### StatusBadge
```typescript
Props: { status: 'online'|'offline'|'delivering'|'idle', label?, showPulse?, size? }
Colors: online=#00B14F, offline=#AFAFAF, delivering=#2196F3, idle=#FFA726
```

#### ErrorBoundary
```typescript
Props: { children, fallback?, onError? }
// Fallback: error icon + "Try Again" button
```

#### LocationMapModal
```typescript
Props: { visible, onClose, location }
// Shows: coordinates, OpenStreetMap embed (300px), Google Maps + OSM buttons, My Location recenter
```

---

### 13.11 Design Tokens (driverDesignTokens.ts)

#### Colours
```
Primary: black #000, white #FFF, green #00B14F, greenDark #009640, greenLight #E8F5E9
Surface: background #FFF, backgroundAlt #F6F6F6, border #E8E8E8
Text: primary #000, secondary #5E5E5E, tertiary #8E8E8E, disabled #AFAFAF, inverse #FFF
Semantic: success, error, warning, info (+ light backgrounds)
Status: online #00B14F, offline #AFAFAF, delivering #2196F3, idle #FFA726
Roles: driver #00B14F, kitchen #FF6B35, kiosk #2196F3, manager #7B1FA2, assistantManager #FF9800
```

#### Typography
```
Families: System (iOS), Roboto (Android)
Sizes: tiny 10, small 12, body 16, h2 18, h1 24, hero 32
Weights: regular 400, medium 500, semibold 600, bold 700
Line heights: tight 1.2, normal 1.5, relaxed 1.75
```

#### Spacing
```
xs 4, sm 8, md 12, base 16, lg 24, xl 32, xxl 48, xxxl 64
```

#### Border Radius
```
xs 4, sm 8, md 12, lg 16, xl 24, full 9999
```

#### Shadows
```
none (0 elevation)
subtle: shadow offset (0,2), opacity 0.08, radius 8, elevation 2
card: offset (0,4), opacity 0.10, radius 12, elevation 4
elevated: offset (0,8), opacity 0.12, radius 24, elevation 8
greenGlow: special driver online status
```

#### Animations
```
fast 150ms, normal 300ms, slow 500ms
```

#### Component Sizes
```
button heights: small 36, medium 48, large 56
avatar: small 32, medium 48, large 64, hero 120
statusBadge: height 32, dot 8px
bottomNav: height 64
topBar: height 64
```

**Helper:** `getRoleColor(type?)` → returns role-specific hex colour

---

### 13.12 Constants

#### Allergens (allergens.ts)
All 14 EU Regulation 1169/2011 mandatory allergens:
```
CELERY → 'Cel'     CEREALS_GLUTEN → 'Glu'   CRUSTACEANS → 'Cru'
EGGS → 'Egg'       FISH → 'Fish'             LUPIN → 'Lup'
MILK → 'Milk'      MOLLUSCS → 'Mol'          MUSTARD → 'Mus'
NUTS → 'Nuts'      PEANUTS → 'Pnt'           SESAME → 'Ses'
SOYA → 'Soy'       SULPHUR_DIOXIDE → 'SO₂'
```

#### Error Messages (errorMessages.ts)
Centralised UX error strings for all scenarios:
- Network: NETWORK_UNAVAILABLE, WEBSOCKET_CONNECTION_FAILED
- Location: LOCATION_PERMISSION_DENIED, GPS_UNAVAILABLE, GPS_TIMEOUT, GPS_SIGNAL_WEAK
- Camera: CAMERA_PERMISSION_DENIED, CAMERA_UNAVAILABLE, PHOTO_TOO_LARGE (max 5MB)
- Upload: UPLOAD_FAILED, UPLOAD_QUEUED (offline retry message)
- Auth: UNAUTHORIZED ("Session Expired"), SESSION_REQUIRED ("Clock In Required")

---

### 13.13 AsyncStorage Keys

```
auth_accessToken
auth_refreshToken
auth_user
driver_online_{userId}
driver_session_start_{userId}
driver_default_location_{userId}
@masova_offline_queue
```

---

### 13.14 Android Permissions

```xml
ACCESS_FINE_LOCATION (foreground GPS)
ACCESS_BACKGROUND_LOCATION (background GPS for drivers)
ACCESS_COARSE_LOCATION
CAMERA
POST_NOTIFICATIONS (Android 13+)
INTERNET
ACCESS_NETWORK_STATE
```

### iOS Permissions (Info.plist)
```
NSLocationWhenInUseUsageDescription
NSLocationAlwaysAndWhenInUseUsageDescription
NSCameraUsageDescription
NSPhotoLibraryUsageDescription
NSUserNotificationsUsageDescription
```

---

### 13.15 Role-Based Feature Matrix

| Feature                      | Driver | Kitchen | Cashier | Manager | Generic |
| ---------------------------- | :----: | :-----: | :-----: | :-----: | :-----: |
| Delivery Home (GPS tracking) |   ✓    |    —    |    —    |    —    |    —    |
| Active Deliveries            |   ✓    |    —    |    —    |    —    |    —    |
| Delivery History             |   ✓    |    —    |    —    |    —    |    —    |
| Kitchen Queue                |   —    |    ✓    |    —    |    —    |    —    |
| Quick Order (POS)            |   —    |    —    |    ✓    |    —    |    —    |
| Analytics Dashboard          |   —    |    —    |    —    |    ✓    |    —    |
| My Shifts (clock in/out)     |   ✓    |    ✓    |    ✓    |    ✓    |    ✓    |
| My Schedule                  |   ✓    |    —    |    —    |    —    |    ✓    |
| My Earnings                  |   ✓    |    —    |    —    |    —    |    ✓    |
| My Profile                   |   ✓    |    ✓    |    ✓    |    ✓    |    ✓    |
| GPS Tracking                 |   ✓    |    —    |    —    |    —    |    —    |
| Push Notifications           |   ✓    |    ✓    |    ✓    |    ✓    |    ✓    |

---

### 13.16 WebSocket Topics Summary

| Topic                               | Direction | Content                                                                |
| ----------------------------------- | --------- | ---------------------------------------------------------------------- |
| `/topic/driver/{driverId}/location` | Subscribe | `{driverId, lat, lng, accuracy, ...}`                                  |
| `/topic/order/{orderId}/tracking`   | Subscribe | `{orderId, status, driverName, driverLocation, eta, ...}`              |
| `/topic/driver/{driverId}/orders`   | Subscribe | `{orderId, orderNumber, customer, address, total, items, timestamp}`   |
| `/app/location-update`              | Publish   | `{driverId, latitude, longitude, accuracy, speed, heading, timestamp}` |

---

*Continued in Part 4: Customer Mobile App (masova-mobile)*


# MaSoVa Platform — Master Reference Document
## Part 4 of 5: Customer Mobile App (masova-mobile)

---

## 14. MASOVA CUSTOMER MOBILE APP

**Location:** `/Users/souravamseekarmarti/Projects/masova-mobile`
**App Name:** MaSoVa
**Package:** `com.masovamobile`
**Platform:** React Native 0.81.5, React 19.1.0, Expo 54.0.33 (bare workflow — NOT Expo Go)
**Metro port:** 8888 (`npm run start`)
**State Management:** React Context API (Auth, Cart, Store, Theme) + TanStack React Query v5
**Real-time:** STOMP WebSocket (native, not SockJS — Hermes limitation)

---

### 14.1 Project Dependencies

```json
"react-native": "0.81.5",
"react": "19.1.0",
"expo": "54.0.33",
"@react-navigation/bottom-tabs": "7.9.0",
"@react-navigation/native": "7.1.26",
"@react-navigation/native-stack": "7.9.0",
"@tanstack/react-query": "5.90.16",
"axios": "1.13.2",
"expo-linear-gradient": "latest",
"expo-blur": "latest",
"expo-haptics": "latest",
"expo-location": "latest",
"react-native-maps": "1.20.1",
"@stomp/stompjs": "7.2.1",
"suncalc": "1.9.0",
"@react-native-async-storage/async-storage": "2.2.0"
```

**Scripts:** `npm run android`, `npm run ios`, `npm start` (port 8888), `npm run build:android`, `npm run clean`

---

### 14.2 App Configuration (app.json)

```json
{
  "name": "MaSoVa",
  "package": "com.masovamobile",
  "splash": { "backgroundColor": "#0F0F0F" },
  "extra": {
    "apiUrl": "https://api.masova.app",
    "agentUrl": "https://agent.masova.app",
    "easProjectId": "masova-customer"
  },
  "android": { "edgeToEdgeEnabled": true, "adaptiveIcon": { "backgroundColor": "#0F0F0F" } },
  "ios": { "bundleIdentifier": "com.masovamobile", "supportsTablet": true }
}
```

---

### 14.3 Root Application (App.tsx)

**Provider stack (outer → inner):**
```
QueryClientProvider (staleTime: 5min, retry: 2)
  → ThemeProvider (sunrise/sunset-based dark/light switching)
    → AuthProvider (JWT + AsyncStorage persistence)
      → StoreProvider (selected store + AsyncStorage)
        → CartProvider (cart items + AsyncStorage)
          → RootNavigator (navigationRef)
```

**Font loading:** PlusJakartaSans-Regular, Medium, SemiBold, Bold, ExtraBold

**StatusBar:** Dynamic style (light-content for dark theme, dark-content for light theme)

---

### 14.4 Contexts

#### AuthContext

```typescript
interface User {
  id: string
  name: string
  email: string
  phone: string
  type: string    // NOTE: Backend returns 'type', not 'role'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email, password): Promise<void>
  loginWithGoogle(idToken): Promise<void>
  register(data: {name, email, phone, password}): Promise<void>
  logout(): Promise<void>
  refreshUser(): Promise<void>
}
```

**AsyncStorage keys:** `masova_auth_token`, `masova_refresh_token`, `masova_user`

**Features:** Token persistence on mount, auto-login after registration, Google Sign-In support

#### CartContext

```typescript
interface CartItem {
  id: string              // Generated: menuItemId_vVARIANT_cCUSTOM1_CUSTOM2 (sorted)
  menuItem: MenuItem
  quantity: number
  selectedVariant?: MenuVariant
  selectedCustomizations?: Map<string, CustomizationOption[]>
  specialInstructions?: string
  itemTotal: number       // price × quantity (all modifiers applied)
}

interface CartContextType {
  items: CartItem[]
  itemCount: number
  subtotal: number
  deliveryFee: number     // ₹0 if subtotal ≥ ₹500, else ₹40
  taxes: number           // 5% GST on subtotal
  total: number           // subtotal + taxes (delivery added at checkout)
  addItem(menuItem, quantity, variant?, customizations?, specialInstructions?): void
  removeItem(cartItemId): void
  updateQuantity(cartItemId, quantity): void
  clearCart(): void
  getItemById(cartItemId): CartItem | undefined
}
```

**Price calculation:**
```
itemPrice = basePrice OR discountedPrice
          + variant.priceModifier
          + sum(selectedCustomizations.options.priceModifier)

Cart ID = menuItemId_v{variantId}_c{sorted(customizationOptionIds).join('_')}
```

**Persistence:** AsyncStorage with Map↔Object serialisation

#### StoreContext

```typescript
interface StoreContextType {
  selectedStore: Store | null
  selectedStoreId: string | null    // Prefers storeCode (DOM001) over id
  isLoading: boolean
  setSelectedStore(store): Promise<void>
  refreshStore(): Promise<void>
}
```

**AsyncStorage key:** `@masova_selected_store`

**On store change:** Invalidates all menu React Query caches

**Header added to API requests:** `X-Selected-Store-Id: {storeCode || storeId}`

#### ThemeContext (useTheme hook)

```typescript
interface ThemeContextType {
  theme: Theme
  themeMode: 'light' | 'dark'
  isDark: boolean
  toggleTheme(): void     // No-op (kept for compatibility)
  setThemeMode(mode): void  // No-op
}
```

**Theme switching:** Automatic via `useSunriseTheme` — uses SunCalc + expo-location to calculate actual sunrise/sunset for user's coordinates. Falls back to 6am–8pm (light) / 8pm–6am (dark) if location denied.

---

### 14.5 Navigation

#### RootNavigator (RootStackParamList)

**Main Screens (always available):**
```
Main → MainTabNavigator
ItemDetail({ itemId }) — modal, slide_from_bottom
CheckoutOptions — modal, slide_from_bottom
GuestCheckout({ returnFromAuth? })
Checkout({ guestInfo? })
Search — fade animation
```

**Auth Screen:**
```
Auth → AuthNavigator — modal, presentation: modal
```

**Payment Flows:**
```
PaymentSuccess({ orderId }) — no gesture, no header
PaymentFailed({ orderId, error? })
```

**Protected Screens (require auth):**
```
OrderTracking({ orderId }) — fullScreenModal
OrderHistory
OrderDetail({ orderId })
OrderReview({ orderId }) — modal
AddressManagement
AddAddress({ address? }) — modal
Notifications
Chat — modal
```

#### AuthNavigator (AuthStackParamList)
```
Login → LoginScreen
Register → RegisterScreen
```

#### MainTabNavigator (5 tabs)

| Tab     | Screen             | Icon (active/inactive)    | Active Tint                   |
| ------- | ------------------ | ------------------------- | ----------------------------- |
| Home    | HomeScreen         | home / home-outline       | dark: #FFD000, light: #0F0F0F |
| Search  | SearchScreen       | search / search-outline   |                               |
| Orders  | OrderHistoryScreen | receipt / receipt-outline |                               |
| Saved   | SavedScreen        | heart / heart-outline     |                               |
| Account | ProfileScreen      | person / person-outline   |                               |

**Tab bar:** Height 56px + safe area, inactive tint: #606060, font: PlusJakartaSans-Medium 12px

---

### 14.6 API Service (src/services/api.ts)

**Base config:**
```typescript
DEV_URL:  'http://192.168.50.88:8080/api'
PROD_URL: 'https://api.masova.com/api'
TIMEOUT:  30000ms
```

**Request interceptor adds:**
```
Authorization: Bearer {masova_auth_token}
X-Selected-Store-Id: {storeCode || storeId}
X-User-Type: CUSTOMER
Content-Type: application/json
Accept: application/json
```

**Response interceptor:** On 401 — attempts token refresh, clears auth on failure

---

### 14.7 All API Endpoints

#### Auth API (`/api/auth/*`)

| Method | Path                 | Auth   | Rate Limit |
| ------ | -------------------- | ------ | ---------- |
| POST   | `/api/auth/login`    | Public | 10/min     |
| POST   | `/api/auth/register` | Public | 5/min      |
| POST   | `/api/auth/refresh`  | Public | 20/min     |
| POST   | `/api/auth/logout`   | JWT    | —          |
| POST   | `/api/auth/google`   | Public | —          |

**Login response:** `{accessToken, refreshToken, user: {id, email, name, phone, type, profilePicture, storeId}}`

#### Menu API (`/api/menu/*`)

| Method | Path                           | Auth   | Notes                                              |
| ------ | ------------------------------ | ------ | -------------------------------------------------- |
| GET    | `/api/menu/public`             | Public | Query: category?, cuisine?, dietary?, page?, size? |
| GET    | `/api/menu/public/{id}`        | Public | Item detail                                        |
| GET    | `/api/menu/public/recommended` | Public | Recommended items                                  |
| GET    | `/api/menu/public/search`      | Public | Query: q (search string)                           |
| GET    | `/api/menu/items`              | Public | All items                                          |

#### Order API (`/api/orders/*`)

| Method | Path                                | Auth   | Rate Limit |
| ------ | ----------------------------------- | ------ | ---------- |
| POST   | `/api/orders`                       | JWT    | 200/min    |
| GET    | `/api/orders/{orderId}`             | JWT    | —          |
| GET    | `/api/orders/track/{orderId}`       | Public | 100/min    |
| GET    | `/api/orders/customer/{customerId}` | JWT    | —          |
| DELETE | `/api/orders/{orderId}`             | JWT    | —          |
| PATCH  | `/api/orders/{orderId}/status`      | JWT    | —          |

**Create order payload:**
```typescript
{
  items: [{menuItemId, quantity, variant?, customizations?, specialInstructions?}]
  deliveryAddress?: {street, city, coordinates?, instructions?}
  paymentMethod: 'ONLINE' | 'CASH' | 'CARD' | 'UPI'
  orderType: 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN'
  customerId?: string
  storeId: string
  customerName, customerEmail, customerPhone
}
```

#### Payment API (`/api/payments/*`)

| Method | Path                            | Auth | Rate Limit |
| ------ | ------------------------------- | ---- | ---------- |
| POST   | `/api/payments/initiate`        | JWT  | 50/min     |
| POST   | `/api/payments/verify`          | JWT  | —          |
| POST   | `/api/payments/cash`            | JWT  | —          |
| GET    | `/api/payments/{transactionId}` | JWT  | —          |
| GET    | `/api/payments/order/{orderId}` | JWT  | —          |

**Initiate response:** `{razorpayOrderId, razorpayKeyId, amount, currency}`
**Verify payload:** `{orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature}`

#### Delivery API (`/api/delivery/*`)

| Method | Path                                   | Auth | Rate Limit |
| ------ | -------------------------------------- | ---- | ---------- |
| GET    | `/api/delivery/track/{orderId}`        | JWT  | 150/min    |
| GET    | `/api/delivery/eta/{orderId}`          | JWT  | —          |
| POST   | `/api/delivery/{orderId}/generate-otp` | JWT  | —          |
| POST   | `/api/delivery/verify-otp`             | JWT  | —          |

#### Customer API (`/api/customers/*`)

| Method | Path                                                            | Auth              |
| ------ | --------------------------------------------------------------- | ----------------- |
| POST   | `/api/customers/get-or-create`                                  | Public (internal) |
| GET    | `/api/customers/{customerId}`                                   | JWT               |
| GET    | `/api/customers/user/{userId}`                                  | JWT               |
| PATCH  | `/api/customers/{customerId}`                                   | JWT               |
| POST   | `/api/customers/{customerId}/addresses`                         | JWT               |
| PATCH  | `/api/customers/{customerId}/addresses/{addressId}`             | JWT               |
| DELETE | `/api/customers/{customerId}/addresses/{addressId}`             | JWT               |
| PATCH  | `/api/customers/{customerId}/addresses/{addressId}/set-default` | JWT               |

**Address schema:**
```typescript
{
  id, label, addressLine1, addressLine2?, city, state, postalCode,
  country?, latitude?, longitude?, landmark?, instructions?, isDefault?
}
```

#### Notification API (`/api/notifications/*`)

| Method | Path                                        | Auth |
| ------ | ------------------------------------------- | ---- |
| GET    | `/api/notifications/user/{userId}`          | JWT  |
| GET    | `/api/notifications/user/{userId}/unread`   | JWT  |
| PATCH  | `/api/notifications/{id}/read`              | JWT  |
| PATCH  | `/api/notifications/user/{userId}/read-all` | JWT  |
| DELETE | `/api/notifications/{id}`                   | JWT  |
| POST   | `/api/notifications/device-token`           | JWT  |

#### Review API (`/api/reviews/*`)

| Method | Path                                | Auth   |
| ------ | ----------------------------------- | ------ |
| GET    | `/api/reviews/public/{orderId}`     | Public |
| POST   | `/api/reviews`                      | JWT    |
| GET    | `/api/reviews/public/item/{itemId}` | Public |

#### Store API (`/api/stores/*`)

| Method | Path                           | Auth   | Notes                      |
| ------ | ------------------------------ | ------ | -------------------------- |
| GET    | `/api/stores/public`           | Public |                            |
| GET    | `/api/stores/public/{storeId}` | Public |                            |
| GET    | `/api/stores/public/nearest`   | Public | Query: latitude, longitude |

---

### 14.8 WebSocket Configuration

```typescript
// Development
ordersUrl:   'ws://192.168.50.88:8083/ws/orders'
deliveryUrl: 'ws://192.168.50.88:8090/ws/delivery'

// Production
ordersUrl:   'wss://api.masova.com/ws/orders'
deliveryUrl: 'wss://api.masova.com/ws/delivery'

// Main gateway WS
wsUrl:       'ws://192.168.50.88:8080/ws'  // dev
             'wss://api.masova.com/ws'       // prod
```

**WebSocket implementation:** Native WebSocket (not SockJS — Hermes JS engine limitation)

**STOMP topics subscribed:**
```
/topic/store/{storeId}/orders       — new orders for store
/queue/customer/{customerId}/orders — customer-specific order updates
/topic/store/{storeId}/kitchen      — kitchen display updates
/topic/delivery/{orderId}           — delivery tracking updates
```

**Connection config:**
- Max reconnection attempts: 5
- Reconnect delay: 5000ms
- Heartbeat: 4000ms incoming/outgoing
- Auth header: `Authorization: Bearer {token}`

---

### 14.9 Payment Service (paymentService.ts)

**Razorpay flow:**
```
1. initiatePayment(orderId, amount, customerId, email, phone, storeId)
   → POST /api/payments/initiate
   → Returns {razorpayOrderId, razorpayKeyId, amount, currency}

2. openRazorpayCheckout(options)
   → Opens native Razorpay checkout modal
   → Returns {razorpay_payment_id, razorpay_order_id, razorpay_signature}

3. verifyPayment({orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature})
   → POST /api/payments/verify
   → Backend verifies HMAC signature
   → Returns {status: 'SUCCESS' | 'FAILED'}
```

---

### 14.10 Screens — Complete Specifications

#### LoginScreen (auth/LoginScreen.tsx)

**State:** `email`, `password`, `loading`, `googleLoading`, `error`

**Features:**
- Email/password form
- Google Sign-In (@react-native-google-signin)
- Social login buttons (Google, Facebook placeholder)
- Forgot password link (not implemented)
- Haptic feedback on login/error
- Navigate to Register

---

#### RegisterScreen (auth/RegisterScreen.tsx)

**State:** `name`, `email`, `phone`, `password`, `loading`, `error`

**Validations:** All fields required, password ≥ 6 chars, email regex, terms acknowledgement

**On success:** Auto-login (calls `login()` after successful register)

---

#### HomeScreen (home/HomeScreen.tsx)

**State:** `currentSlide` (hero carousel), animated values

**Sections:**
1. **Hero Carousel** — 3 slides, 4s auto-advance, animated dot indicators
2. **Categories** (6): Biryani, Pizza, Burger, Dosa, Noodles, Beverages (spring animations)
3. **Store Cards** (3 mock): name, rating, ETA, delivery fee (slide-up entrance animations)
4. **Floating Chat Bubble** (FloatingChatBubble component)

---

#### SearchScreen (home/SearchScreen.tsx)

**State:** `searchQuery`, `searchResults`, `recentSearches`

**Features:**
- SearchBar component
- Recent searches history
- Results as items grid (useMenuSearch hook, enabled when query.length > 2)
- Tap item → navigate('ItemDetail', {itemId})

---

#### MenuScreen (menu/MenuScreen.tsx)

**State:** `selectedCuisine`, `selectedCategory`, `filteredItems`

**Cuisine → Category mapping:**
```
SOUTH_INDIAN:  DOSA, IDLY_VADA, SOUTH_INDIAN_MEALS, RICE_VARIETIES, BIRYANI
NORTH_INDIAN:  CURRY_GRAVY, DAL_DISHES, NORTH_INDIAN_MEALS, RICE_VARIETIES, CHAPATI_ROTI, NAAN_KULCHA
INDO_CHINESE:  FRIED_RICE, NOODLES, MANCHURIAN
ITALIAN:       PIZZA, PASTA, SIDES
AMERICAN:      BURGER, SANDWICH, SIDES
CONTINENTAL:   GRILLED, BAKED, SIZZLERS
BEVERAGES:     HOT_DRINKS, COLD_DRINKS, TEA_CHAI, JUICES
DESSERTS:      COOKIES_BROWNIES, ICE_CREAM, DESSERT_SPECIALS
```

**Features:**
- StoreSelector at top (store picker with modal)
- Horizontal cuisine scroll
- Category chips for selected cuisine
- Items grid with dietary badge, price, rating

---

#### ItemDetailScreen (menu/ItemDetailScreen.tsx)

**Props:** `{itemId}` via route

**State:** `quantity`, `selectedVariant`, `selectedOptions: Map<customizationId, options[]>`, `isFavorite`

**Sections:**
1. Full-screen item image with gradient overlay
2. Header: close button, wishlist heart
3. Item name + dietary badges (VEG/NON-VEG indicator dot)
4. Description, spice level indicator
5. Nutritional info (calories, protein, carbs, fat)
6. Allergen declarations (all 14 EU allergens)
7. Rating + review count
8. Variants section (single selection, radio-style)
9. Customisations section:
   - Grouped by customizationId
   - `maxSelections = 1` → radio buttons
   - `maxSelections > 1` → checkboxes
   - Price modifiers displayed per option
10. Quantity selector
11. Price total (calculated with all modifiers)
12. "Add to Cart" button + haptic feedback

---

#### CartScreen (cart/CartScreen.tsx)

**State:** `couponCode`, `appliedCoupon`, `couponDiscount`

**Cart Item Display:**
- Image, name, variant name, customisation names
- Price per item, quantity selector (delete at 0), remove button

**Pricing summary:**
```
Subtotal:          ₹{subtotal}
Delivery Fee:      ₹{deliveryFee}
Taxes (5% GST):    ₹{taxes}
Coupon Discount:  -₹{couponDiscount}
─────────────────
Total:             ₹{total}
```

**Features:**
- Coupon input (demo: `WELCOME50` → 50% off, max ₹200 discount)
- Empty cart state with "Browse Menu" CTA
- Floating chat bubble
- "Checkout" button → navigate('CheckoutOptions')

---

#### CheckoutOptionsScreen (cart/CheckoutOptionsScreen.tsx)

**Logic:** If `isAuthenticated` → immediately navigate('Checkout')

**3 options shown to guests:**
1. **Login** → navigate('Auth', {screen: 'Login'})
2. **Create Account** → navigate('Auth', {screen: 'Register'})
3. **Continue as Guest** (primary, #FFD000) → navigate('GuestCheckout')

---

#### GuestCheckoutScreen (cart/GuestCheckoutScreen.tsx)

**For guests:** firstName, lastName, email, phone, street, city, state, pincode, deliveryInstructions

**For authenticated users:** Saved addresses list + "Add New" option

**Validations:**
- Email: regex
- Phone: 10-digit Indian mobile (first digit 6–9)
- PIN: 6 digits
- All required fields

**On continue:** Validate → construct GuestInfo → navigate('Checkout', {guestInfo})

---

#### CheckoutScreen (cart/CheckoutScreen.tsx)

**Props:** `guestInfo?` (from route.params)

**State:** `savedAddresses`, `selectedAddress`, `paymentMethod: 'ONLINE'|'CASH'|'UPI'`, `orderType: 'DELIVERY'|'TAKEAWAY'`

**Pricing:**
```typescript
actualDeliveryFee = orderType === 'TAKEAWAY' ? 0 : deliveryFee
actualTaxes       = Math.round((subtotal + actualDeliveryFee) * 0.05)
actualTotal       = subtotal + actualDeliveryFee + actualTaxes
```

**Order placement flow:**
```
1. Validate (cart not empty, address if DELIVERY)
2. Guest: POST /api/customers/get-or-create → customerId
   Auth: use user.id
3. POST /api/orders → {orderId}
4. If ONLINE/UPI: paymentService.processPayment()
   → navigate('PaymentSuccess') or navigate('PaymentFailed')
5. If CASH: navigate('OrderTracking', {orderId})
6. clearCart()
```

---

#### OrderTrackingScreen (order/OrderTrackingScreen.tsx)

**Props:** `{orderId}` via route

**Hooks used:** `useOrderTracking({orderId, enableWebSocket: true})`
- Returns: `{order, isLoading, error, wsConnected, wsState, refetch}`
- Combines WebSocket (real-time) + React Query polling (fallback, 5s)

**Order stages by type:**

| Status     | DELIVERY       | TAKEAWAY         | DINE_IN        |
| ---------- | -------------- | ---------------- | -------------- |
| RECEIVED   | Order Received | Order Received   | Order Received |
| PREPARING  | Preparing      | Preparing        | Preparing      |
| OVEN       | In Oven        | In Oven          | In Oven        |
| BAKED      | Ready          | Ready for Pickup | Ready to Serve |
| DISPATCHED | On the Way     | —                | —              |
| DELIVERED  | Delivered      | —                | —              |
| COMPLETED  | —              | Picked Up        | —              |
| SERVED     | —              | —                | Served         |

**Features:**
- Progress bar with connected dots + lines
- Current stage: highlighted + pulsing animation (Animated.Value)
- Completed stages: green with checkmark
- ETA countdown (updates every 60s)
- Delivery map (if DISPATCHED) — DeliveryMap component with driver marker
- Driver info card: name, phone (call button), vehicle
- Order summary with items
- Floating chat bubble

---

#### OrderHistoryScreen (order/OrderHistoryScreen.tsx)

**Guest prompt:** "Sign in to view your past orders"

**Order list:** FlatList, sorted by createdAt desc, pull-to-refresh

**Status display:**
- Active: RECEIVED, PREPARING, OVEN, BAKED, DISPATCHED
- Completed: DELIVERED, COMPLETED, SERVED, CANCELLED

**Date formatting:** "Today", "Yesterday", "X days ago", "DD MMM"

**API:** GET `/api/orders/customer/{customerId}`

---

#### PaymentSuccessScreen (payment/PaymentSuccessScreen.tsx)

**Props:** `{orderId}` via route

**Features:**
- Scale + fade entrance animation
- Large green checkmark
- Order ID (selectable, #FFD000 colour)
- Haptic feedback on mount
- Stores active order ID for 60 seconds
- "Track Order" → navigate('OrderTracking', {orderId})
- "Continue Shopping" → navigate('Main', {screen: 'Menu'})

---

#### ProfileScreen (profile/ProfileScreen.tsx)

**Guest prompt:** GuestPromptView with sign-in/register buttons

**Loyalty info** (if customer data available):
- Tier badge: BRONZE/SILVER/GOLD/PLATINUM with colours
- Total points
- Progress bar to next tier
- Order stats: total orders, total spent, average order value

**Menu items:**
1. My Addresses → navigate('AddressManagement')
2. Order History → navigate('OrderHistory')
3. Saved Items → navigate('Saved')
4. Notifications → navigate('Notifications')
5. Chat with Support → navigate('Chat')
6. Theme Toggle (visual only, sunrise auto-switching)
7. Logout (confirmation alert)

---

#### AddressManagementScreen (profile/AddressManagementScreen.tsx)

**Features:**
- List all saved addresses
- Each: label, full address, default badge
- Set default, Edit (→ AddAddressScreen with address param), Delete buttons
- Add new address button

**API:** GET `/api/customers/user/{userId}` → addresses[]

---

#### AddAddressScreen (profile/AddAddressScreen.tsx)

**Fields:** Label (Home/Work/Other), Street (addressLine1), addressLine2?, City, State, PIN code, Landmark?, Set as default checkbox

**Modes:** Create (no params) or Edit (address param → pre-fill)

**API:** POST `/api/customers/{customerId}/addresses` or PATCH `/api/customers/{customerId}/addresses/{addressId}`

---

### 14.11 React Query Hooks

#### useMenuQueries.ts

```typescript
useMenuItems(params?) → MenuItem[]
  // QueryKey: ['menu', 'items', selectedStoreId, params]
  // staleTime: 5min

useMenuItem(id) → MenuItem
  // QueryKey: ['menu', 'item', id], enabled: !!id

useRecommendedItems() → MenuItem[]
  // QueryKey: ['menu', 'recommended', selectedStoreId], staleTime: 10min

useMenuSearch(query) → MenuItem[]
  // QueryKey: ['menu', 'search', query], enabled: query.length > 2, staleTime: 2min

useMenuByCategory(category) → MenuItem[]
useMenuByCuisine(cuisine) → MenuItem[]
```

#### useOrderQueries.ts

```typescript
useOrder(orderId) → Order
  // refetchInterval: 5000ms, staleTime: 0

useTrackOrder(orderId) → Order
  // refetchInterval: 15000ms, public endpoint

useCustomerOrders(customerId, page?) → Order[]
  // staleTime: 2min

useDeliveryTracking(orderId) → DeliveryTracking
  // refetchInterval: 10000ms

// Mutations:
useCreateOrder() → useMutation
  // Invalidates: ['orders', 'customer'], sets cache for new order

useCancelOrder() → useMutation
  // Invalidates: ['orders', orderId], ['orders', 'customer']
```

#### useOrderTracking.ts

```typescript
interface UseOrderTrackingOptions {
  orderId: string
  enableWebSocket?: boolean
  pollingInterval?: number
}

interface UseOrderTrackingResult {
  order: Order | undefined
  isLoading: boolean
  error: Error | null
  wsConnected: boolean
  wsState: 'disconnected' | 'connecting' | 'connected' | 'error'
  refetch(): void
}
```

**Behaviour:** WebSocket takes priority; falls back to React Query polling when disconnected. Tracks status changes, fires notifications on transition.

#### useSunriseTheme.ts

- Requests expo-location ForegroundPermission
- Uses SunCalc to get actual sunrise/sunset coordinates for user
- Switches theme automatically at sunrise/sunset
- Fallback: 6am–8pm = light, 8pm–6am = dark (if location denied)
- Schedules next transition via setTimeout, cleans up on unmount

---

### 14.12 Type Definitions (src/types/index.ts)

#### MenuItem (complete)
```typescript
interface MenuItem {
  id, name, description
  cuisine: Cuisine           // 8 types
  category: Category         // 40+ types
  basePrice: number          // in paise
  discountedPrice?: number
  variants: MenuVariant[]    // [{id, name, priceModifier}]
  customizations: MenuCustomization[]
  dietaryInfo: DietaryType[] // VEGETARIAN | VEGAN | NON_VEGETARIAN | JAIN | HALAL | GLUTEN_FREE | DAIRY_FREE
  spiceLevel?: SpiceLevel    // MILD | MEDIUM | HOT | EXTRA_HOT
  nutritionalInfo?: { calories, protein, carbs, fat }
  imageUrl, isAvailable, preparationTime (minutes), isRecommended
  rating?, reviewCount?, allergens?, allergensDeclared?
}
```

#### Order (complete)
```typescript
interface Order {
  id, orderNumber, customerId, storeId
  items: OrderItem[]
  subtotal, deliveryFee, tax, total
  status: OrderStatus        // PENDING|RECEIVED|PREPARING|OVEN|BAKED|READY|DISPATCHED|DELIVERED|COMPLETED|SERVED|CANCELLED
  paymentStatus: PaymentStatus  // PENDING|SUCCESS|FAILED|REFUNDED
  paymentMethod: 'ONLINE'|'CASH'|'CARD'|'UPI'
  orderType: 'DINE_IN'|'DELIVERY'|'TAKEAWAY'|'COLLECTION'
  preparationTime, estimatedDeliveryTime?
  deliveryAddress?: DeliveryAddress
  assignedDriverId?
  createdAt, updatedAt, completedAt?
  deliveryOtp?
}
```

#### DeliveryTracking (complete)
```typescript
interface DeliveryTracking {
  id, orderId, driverId, driverName, driverPhone, driverPhoto?
  status: 'PENDING_ASSIGNMENT'|'ASSIGNED'|'ACCEPTED'|'PICKED_UP'|'IN_TRANSIT'|'ARRIVED'|'DELIVERED'|'CANCELLED'
  currentLocation?: {latitude, longitude}
  restaurantLocation?: {latitude, longitude}
  estimatedDeliveryMinutes, distanceKm
  assignedAt, acceptedAt?, pickedUpAt?, deliveredAt?
  // Flat field aliases (backend compatibility):
  driverLat?, driverLon?, restaurantLat?, restaurantLon?
}
```

#### Store (complete)
```typescript
interface Store {
  id
  storeCode?: string         // DOM001, DOM002 (preferred for menu filtering)
  name, address: StoreAddress
  phone, email
  isOpen, openingTime, closingTime
  deliveryRadius, minimumOrderAmount, deliveryFee
  coordinates?: {latitude, longitude}
}
```

#### Customer (complete)
```typescript
interface Customer {
  id, userId, name, email, phone?
  profilePicture?, addresses: DeliveryAddress[]
  loyaltyInfo?: {
    totalPoints, pointsEarned, pointsRedeemed
    tier: 'BRONZE'|'SILVER'|'GOLD'|'PLATINUM'
    tierExpiryDate?, lastPointsUpdate?
  }
  orderStats?: {totalOrders, completedOrders, cancelledOrders, totalSpent, averageOrderValue}
  isActive
  preferences?: CustomerPreferences
}
```

---

### 14.13 UI Components

#### Button
```typescript
Props: { title, onPress, variant?: 'primary'|'secondary'|'ghost'|'danger',
         size?: 'sm'|'md'|'lg', disabled?, loading?, fullWidth?, leftIcon?, rightIcon? }

primary:   #FFD000 bg, #000 text
secondary: transparent bg, #FFD000 border
ghost:     transparent bg
danger:    error colour bg, white text

Heights: sm=36, md=48, lg=56
```

#### QuantitySelector
```typescript
Props: { value, onChange, size?, min?, max? }
// At value=0 with min=0: shows delete/remove icon
// Haptic feedback on every change
```

#### StoreSelector
```typescript
Props: { onStoreChange? }
// Button → modal with scrollable store list
// Each store: name, open/closed status, address, hours, delivery fee, checkmark if selected
// Saves to AsyncStorage, fires onStoreChange callback, invalidates menu queries
```

#### GuestPromptView
```typescript
Props: { screenName, icon, description }
// Large icon + heading + description + "Sign In" button + "Create Account" button
```

#### DeliveryMap (order/DeliveryMap.tsx)
```typescript
Props: { deliveryInfo: DeliveryTracking, order: Order }
// MapView (Google Maps provider)
// Markers: restaurant, driver (moves in real-time), delivery address
// Polyline: restaurant → delivery address
```

#### FloatingChatBubble
- FAB (floating action button) for chat support → navigate('Chat')
- Visible on HomeScreen, CartScreen, OrderTrackingScreen

---

### 14.14 Design System (src/styles/tokens.ts)

#### Brand Colour
```
accent:    #FFD000 (yellow gold)
onAccent:  #000000
```

#### Dark Mode Surfaces
```
bg:        #0F0F0F
surface1:  #1A1A1A
surface2:  #242424
surface3:  #2E2E2E
surface4:  #383838
text1:     #FFFFFF
text2:     #A0A0A0
text3:     #606060
border:    rgba(255,255,255,0.08)
```

#### Light Mode Surfaces
```
bg:        #FFFFFF
surface1:  #F5F5F5
surface2:  #EFEFEF
surface3:  #E5E5E5
surface4:  #DCDCDC
text1:     #0F0F0F
text2:     #606060
text3:     #A0A0A0
border:    rgba(0,0,0,0.08)
```

#### Semantic Colours
```
error:   dark=#FF4444, light=#D32F2F
success: dark=#22C55E, light=#2E7D32
warning: #F59E0B
```

#### Typography (PlusJakartaSans font family)
```
Weights: regular 400, medium 500, semibold 600, bold 700, extrabold 800

Sizes:
  display:  36px  (line-height 44)
  headline: 28px  (36)
  title:    22px  (28)
  titleSm:  18px  (24)
  body:     16px  (24)
  bodySm:   14px  (20)
  label:    12px  (16)
  caption:  11px  (14)
```

#### Spacing (4px grid)
```
xs=4, sm=8, md=12, lg=16, xl=24, xxl=32, xxxl=48, xxxxl=64
screenPadding=16, cardPadding=16, sectionGap=24, listItemGap=12, touchTarget=48

Numeric aliases: 0=0, 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64, 20=80
```

#### Border Radius
```
sm=8, md=12, lg=16, xl=20, xxl=24, pill=9999
card=16, button=12, input=12, chip=20, image=12, bottomSheet=24
```

#### Shadows
```
sm:  shadowOpacity 0.10, radius 2, elevation 1
md:  shadowOpacity 0.12, radius 4, elevation 2
lg:  shadowOpacity 0.15, radius 8, elevation 4
xl:  shadowOpacity 0.18, radius 16, elevation 8
```

#### Z-Index
```
base=0, dropdown=10, sticky=20, overlay=30, modal=40, toast=50
```

#### Tab Bar
```
height: 56px
iconSize: 24px
labelSize: 12px
activeTint:   dark=#FFD000, light=#0F0F0F
inactiveTint: #606060
```

---

### 14.15 Allergens (constants/allergens.ts)

Same 14 EU Regulation 1169/2011 allergens as Crew app:
```
CELERY, CEREALS_GLUTEN, CRUSTACEANS, EGGS, FISH, LUPIN,
MILK, MOLLUSCS, MUSTARD, NUTS, PEANUTS, SESAME, SOYA, SULPHUR_DIOXIDE
```

Full names displayed: Celery, Gluten, Crustaceans, Eggs, Fish, Lupin, Milk, Molluscs, Mustard, Tree Nuts, Peanuts, Sesame, Soya, Sulphur Dioxide

---

### 14.16 Build & Dev Commands

```bash
# Start Metro (port 8888)
npm start

# Run on device/emulator
npm run android
npm run ios

# Build release APK
npm run build:android

# Clean (clear Metro cache + build artefacts)
npm run clean

# Install APK to connected device
npm run install:android
```

---

*Continued in Part 5: Security, Events, Operations & Cross-Cutting Concerns*





# MaSoVa Platform — Master Reference Document
## Part 5 of 5: Security, Events, Operations, Testing & Cross-Cutting Concerns

---

## 15. SECURITY ARCHITECTURE

### 15.1 Authentication Overview

The platform uses three authentication mechanisms:

| Mechanism     | Used for            | Notes                     |
| ------------- | ------------------- | ------------------------- |
| JWT (HS512)   | All API calls       | Primary method            |
| PIN-based     | Kiosk/POS terminals | 6-digit + 2-digit suffix  |
| Google OAuth2 | Customer login      | RS256 ID token validation |

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
| Token                | Access                | Refresh                 |
| -------------------- | --------------------- | ----------------------- |
| Customer             | 1 hour (3,600,000 ms) | 7 days (604,800,000 ms) |
| Staff/Manager/Driver | 1 hour                | 7 days                  |
| Kiosk                | 8 hours               | 24 hours                |

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

| Right          | Endpoint                                         | Implementation                   |
| -------------- | ------------------------------------------------ | -------------------------------- |
| Access (SAR)   | POST `/api/gdpr/data-request` (type=ACCESS)      | Export all personal data as JSON |
| Deletion (DPR) | POST `/api/gdpr/data-request` (type=DELETION)    | Soft-delete with cascading       |
| Portability    | POST `/api/gdpr/data-request` (type=PORTABILITY) | Standard format export           |
| Objection      | POST `/api/gdpr/data-request` (type=OBJECTION)   | Opt-out of processing            |

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

| Event                   | Routing Key           | Producer         | Consumers                                                                 |
| ----------------------- | --------------------- | ---------------- | ------------------------------------------------------------------------- |
| OrderCreatedEvent       | order.created         | commerce-service | logistics, intelligence, core (notifications)                             |
| OrderStatusChangedEvent | order.status.{status} | commerce-service | logistics (dispatch), intelligence (analytics), core (notifications), KDS |
| OrderCancelledEvent     | order.cancelled       | commerce-service | payment, logistics, intelligence                                          |

**Exchange 2: masova.notifications.exchange**
```
Type:    topic
Durable: true
Routing: notification.*
```

| Event                  | Routing Key        | Producer     | Consumers             |
| ---------------------- | ------------------ | ------------ | --------------------- |
| EmailNotificationEvent | notification.email | core-service | Email service (Brevo) |
| SmsNotificationEvent   | notification.sms   | core-service | SMS service (Twilio)  |
| PushNotificationEvent  | notification.push  | core-service | Push service (FCM)    |

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

| Country          | Currency | Tax                               | Payment Gateway |
| ---------------- | -------- | --------------------------------- | --------------- |
| India (IN)       | INR      | GST 5%                            | Razorpay        |
| Germany (DE)     | EUR      | VAT 7-19% context-aware           | Stripe          |
| France (FR)      | EUR      | VAT 5.5-20% context-aware         | Stripe          |
| Italy (IT)       | EUR      | VAT 10% food                      | Stripe          |
| Netherlands (NL) | EUR      | VAT 9% food                       | Stripe          |
| Belgium (BE)     | EUR      | VAT 6% food                       | Stripe          |
| Hungary (HU)     | EUR      | VAT 5% food                       | Stripe          |
| Luxembourg (LU)  | EUR      | VAT 3% food                       | Stripe          |
| Ireland (IE)     | EUR      | VAT 9% food                       | Stripe          |
| Switzerland (CH) | CHF      | VAT 2.5% food                     | Stripe          |
| UK (GB)          | GBP      | VAT 0% food, 20% alcohol          | Stripe          |
| USA (US)         | USD      | 0% (state-based, not implemented) | Stripe          |
| Canada (CA)      | CAD      | 0% (provincial, not implemented)  | Stripe          |

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

| Cache               | TTL          | Store                      |
| ------------------- | ------------ | -------------------------- |
| Menu items          | 5 minutes    | Redis                      |
| Store data          | 10 minutes   | Redis                      |
| User sessions       | 24 hours     | Redis                      |
| JWT blacklist       | Token expiry | Redis DB 0 (auto-expires)  |
| Agent sessions      | 1 hour       | Redis DB 1                 |
| Geolocation (agent) | 1 hour       | In-memory (masova-support) |

**Cache invalidation:**
- Menu: On `MenuService.updateItem()` or `storeId` change (mobile app)
- Store: On `StoreService.update()`
- User session: On logout (blacklist) or token expiry

### 18.2 Connection Pooling

| Component             | Config                                        |
| --------------------- | --------------------------------------------- |
| MongoDB               | 10 min, 100 max connections                   |
| PostgreSQL (HikariCP) | 2 min idle, 10 max connections                |
| Redis (Lettuce)       | 25 max idle, 50 max active                    |
| API Gateway (Netty)   | 500 max connections, 3s acquire, 10s response |

### 18.3 Resilience4j Circuit Breakers

**Configured for:** `deliveryService`, `customerService`, `orderService` Feign clients

| Setting                   | Value                           |
| ------------------------- | ------------------------------- |
| Failure rate threshold    | 50% (60% for delivery/customer) |
| Slow call threshold       | 80% calls > 3s                  |
| Sliding window            | 20 calls                        |
| Wait in open state        | 30s (15s for delivery)          |
| Half-open permitted calls | 5                               |

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

**Applied migrations (as of Global-5 merge):**

| Version | File                                   | Description                                                                                                     |
| ------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| V1      | `V1__initial_schema.sql`               | core_schema.users, commerce_schema.orders, base tables                                                          |
| V2      | `V2__add_order_items.sql`              | commerce_schema.order_items                                                                                     |
| V3      | `V3__add_payment_tables.sql`           | payment_schema.transactions, refunds                                                                            |
| V4      | `V4__add_logistics_tables.sql`         | logistics_schema.inventory, purchase_orders                                                                     |
| V5      | `V5__add_currency_columns.sql`         | currency field to orders (Global-3)                                                                             |
| V6      | `V6__add_fiscal_signatures_table.sql`  | payment_schema.fiscal_signatures (Global-5)                                                                     |
| V7      | `V7__add_fiscal_columns_to_orders.sql` | fiscal_signature_id, fiscal_signer_system, fiscal_signing_failed, fiscal_signed_at columns on orders (Global-5) |
| V8      | `V8__add_compliance_indexes.sql`       | Indexes on fiscal_signatures for compliance queries (Global-5)                                                  |

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

| Wrong                           | Correct                             | Status                                               |
| ------------------------------- | ----------------------------------- | ---------------------------------------------------- |
| `/api/kitchen-equipment`        | `/api/equipment`                    | Fixed — gateway remaps                               |
| `/api/ratings/token/{token}`    | `/api/reviews/public/token/{token}` | Fixed — RatingController deleted                     |
| `/api/v1/orders/...`            | `/api/orders/...`                   | Fixed — no /v1/ prefix anywhere                      |
| `/api/users/login`              | `/api/auth/login`                   | Fixed — AuthController split in Phase 1              |
| `/api/users/register`           | `/api/auth/register`                | Fixed                                                |
| `/api/dispatch/*`               | `/api/delivery/*`                   | Fixed — 3 controllers merged into DeliveryController |
| `/api/intelligence/*`           | `/api/bi/*`                         | Fixed — BIController path changed                    |
| `/api/responses/**`             | `/api/reviews/{id}/response`        | Fixed — ResponseController deleted                   |
| `/api/sessions/employee/{id}`   | `/api/sessions?employeeId={id}`     | Fixed — collapsed to query param                     |
| `/api/delivery/verify-otp`      | `/api/delivery/verify`              | Fixed — path simplified                              |
| `/api/delivery/location-update` | `/api/delivery/location`            | Fixed — path simplified                              |

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

| Issue                       | Severity | Notes                                                                                                                                        |
| --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Dual-write consistency      | Medium   | MongoDB write can succeed while PostgreSQL fails — no compensating transaction                                                               |
| No dead letter queue        | Medium   | Failed RabbitMQ messages lost — need DLQ for critical events                                                                                 |
| Multi-tenancy at DB level   | Low      | Relies on application-level `storeId` filtering, no row-level security                                                                       |
| Circuit breaker fallback    | Low      | Returns 503 with no fallback content — UX could degrade                                                                                      |
| Swagger sync                | Low      | Auto-generated Swagger may lag behind code changes                                                                                           |
| Agents 6/7/8 are stubs      | Info     | Shift optimisation, kitchen coach, dynamic pricing need Phase 2 PostgreSQL data                                                              |
| masova-mobile mock data     | Info     | HomeScreen uses hardcoded mock stores — not live API                                                                                         |
| SavedScreen mock data       | Info     | Saved items use hardcoded mock — wishlist API not wired                                                                                      |
| MaSoVaCrewApp ChatScreen    | Info     | Stub — not implemented                                                                                                                       |
| EU allergens on older items | Info     | Legacy menu items may not have allergensDeclared=true — they cannot be re-enabled without declaring via PATCH /api/menu/items/{id}/allergens |
| Fiscal signing passthrough  | Info     | Countries without a configured FiscalSigner use PassthroughFiscalSigner — fiscal_signer_system="PASSTHROUGH", fiscalSigningFailed=false      |

---

## 24. DEVELOPMENT RULES & HARD CONSTRAINTS

### Backend (Spring Boot Services)
- Controllers handle HTTP only — no business logic, no direct repository calls
- Every new endpoint: `@PreAuthorize` annotation + input validation + error response body
- New service methods calling other services: use existing Feign clients — never raw `RestTemplate`
- Any `try/catch` swallowing an exception MUST log `log.warn(...)` with order/user context
- Before removing any endpoint: use search to find all callers first
- `OrderService` state transitions MUST publish to `masova.orders.exchange` via `OrderEventPublisher`
- Menu items: `allergensDeclared` MUST be true before `isAvailable=true` — enforced by `MenuService.enforceAllergenGate()`
- Copied menu items reset `allergensDeclared=false` — managers must re-declare allergens before making copy live
- Fiscal signing: `FiscalSigningService.signOrder()` triggered async on DELIVERED/COMPLETED/SERVED — never blocks the status update response
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

| Service                  | Purpose                                   | Config Keys                                  |
| ------------------------ | ----------------------------------------- | -------------------------------------------- |
| Google Maps API          | ETA calc, route optimisation, geocoding   | `GOOGLE_MAPS_API_KEY`                        |
| Google OAuth2            | Customer login (mobile + web)             | `GOOGLE_OAUTH_CLIENT_ID`                     |
| Google GenAI (Gemini)    | AI support agent, review responses        | `GOOGLE_API_KEY`                             |
| Google Cloud Run         | Backend deployment                        | GCP project, service account                 |
| Firebase Hosting         | Frontend deployment                       | Firebase project config                      |
| Firebase Cloud Messaging | Push notifications (mobile)               | `FIREBASE_CREDENTIALS_PATH`                  |
| Stripe                   | EU/Global payment processing              | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Razorpay                 | India payment processing                  | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`     |
| Brevo (SendinBlue)       | Transactional email                       | `BREVO_API_KEY`                              |
| Twilio                   | SMS notifications, OTP delivery           | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`    |
| ip-api.com               | IP geolocation (masova-support)           | No key required (free tier)                  |
| SunCalc                  | Sunrise/sunset calculation (customer app) | Library, no API key                          |

---

## 26. COMPLETE FILE COUNT REFERENCE

| Component                 | Language       | File Count |
| ------------------------- | -------------- | ---------- |
| api-gateway               | Java           | 10         |
| core-service              | Java           | 124        |
| commerce-service          | Java           | 69         |
| payment-service           | Java           | 49         |
| logistics-service         | Java           | 73         |
| intelligence-service      | Java           | 34         |
| shared-models             | Java           | 96         |
| shared-security           | Java           | 3          |
| **Total Java**            |                | **458**    |
| frontend/src              | TypeScript/TSX | 395+       |
| masova-support/src        | Python         | ~40        |
| MaSoVaCrewApp/src         | TypeScript/TSX | ~120       |
| masova-mobile/src         | TypeScript/TSX | ~100       |
| **Total frontend/mobile** |                | **~755**   |

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



# MaSoVa Platform — Canonical API Endpoint Reference
## Reflects live code on `main` as of 2026-05-05

> **Source of truth:** Derived directly from controller source files on `main`.
> Verified via `grep` of `@*Mapping` annotations across all 5 services.

---

## Endpoint Count Summary (Live Code)

| Service              | Controllers | Endpoints |
| -------------------- | ----------- | --------- |
| core-service         | 15          | **105**   |
| commerce-service     | 6           | **32**    |
| payment-service      | 4           | **12**    |
| logistics-service    | 5           | **42**    |
| intelligence-service | 2           | **4**     |
| **TOTAL**            | **32**      | **195**   |

> **Note:** Phase 1 plan targeted 175. Live code has 195 — the difference is from
> `AggregatorController` (Global-6, +2), `SystemInfoController` (+5), `RatingController` (+1),
> GDPR anonymise endpoints per service (+3), `PATCH /api/menu/items/{id}/allergens` (Global-1, +1),
> and minor additions. All intentional.

---

## CORE-SERVICE — 105 Endpoints, 15 Controllers

### AuthController — 7 (`/api/auth`)
| Method | Path                        | Auth          |
| ------ | --------------------------- | ------------- |
| POST   | `/api/auth/login`           | Public        |
| POST   | `/api/auth/register`        | Public        |
| POST   | `/api/auth/logout`          | JWT           |
| POST   | `/api/auth/refresh`         | JWT (refresh) |
| POST   | `/api/auth/google`          | Public        |
| POST   | `/api/auth/change-password` | JWT           |
| POST   | `/api/auth/validate-pin`    | Public        |

### UserController — 14 (`/api/users`)
| Method | Path                                        | Auth        |
| ------ | ------------------------------------------- | ----------- |
| GET    | `/api/users`                                | JWT         |
| GET    | `/api/users/{userId}`                       | JWT         |
| PUT    | `/api/users/{userId}`                       | JWT         |
| GET    | `/api/users/{userId}/status`                | JWT         |
| PUT    | `/api/users/{userId}/status`                | JWT         |
| POST   | `/api/users/{userId}/activate`              | JWT+MANAGER |
| POST   | `/api/users/{userId}/deactivate`            | JWT+MANAGER |
| POST   | `/api/users/{userId}/generate-pin`          | JWT+MANAGER |
| GET    | `/api/users/{userId}/can-take-orders`       | JWT         |
| POST   | `/api/users/kiosk`                          | JWT+MANAGER |
| GET    | `/api/users/kiosk`                          | JWT+MANAGER |
| POST   | `/api/users/kiosk/{kioskUserId}/regenerate` | JWT+MANAGER |
| POST   | `/api/users/kiosk/{kioskUserId}/deactivate` | JWT+MANAGER |
| POST   | `/api/users/kiosk/auto-login`               | Public      |

### CustomerController — 14 (`/api/customers`)
| Method | Path                                        | Auth                               |
| ------ | ------------------------------------------- | ---------------------------------- |
| GET    | `/api/customers`                            | JWT                                |
| POST   | `/api/customers`                            | JWT                                |
| GET    | `/api/customers/stats`                      | JWT+MANAGER                        |
| GET    | `/api/customers/{id}`                       | JWT                                |
| PUT    | `/api/customers/{id}`                       | JWT                                |
| POST   | `/api/customers/{id}/activate`              | JWT+MANAGER                        |
| POST   | `/api/customers/{id}/deactivate`            | JWT+MANAGER                        |
| POST   | `/api/customers/{id}/loyalty`               | JWT                                |
| POST   | `/api/customers/{id}/addresses`             | JWT                                |
| PUT    | `/api/customers/{id}/addresses/{addressId}` | JWT                                |
| DELETE | `/api/customers/{id}/addresses/{addressId}` | JWT                                |
| POST   | `/api/customers/{id}/tags`                  | JWT+MANAGER                        |
| POST   | `/api/customers/get-or-create`              | Internal only — blocked at gateway |
| DELETE | `/api/customers/{id}/gdpr/anonymize`        | JWT+MANAGER                        |

### ShiftController — 10 (`/api/shifts`)
| Method | Path                             | Auth        |
| ------ | -------------------------------- | ----------- |
| GET    | `/api/shifts`                    | JWT         |
| POST   | `/api/shifts`                    | JWT+MANAGER |
| POST   | `/api/shifts/bulk`               | JWT+MANAGER |
| POST   | `/api/shifts/copy-week`          | JWT+MANAGER |
| GET    | `/api/shifts/{shiftId}`          | JWT         |
| PUT    | `/api/shifts/{shiftId}`          | JWT+MANAGER |
| DELETE | `/api/shifts/{shiftId}`          | JWT+MANAGER |
| POST   | `/api/shifts/{shiftId}/confirm`  | JWT         |
| POST   | `/api/shifts/{shiftId}/start`    | JWT         |
| POST   | `/api/shifts/{shiftId}/complete` | JWT         |

### WorkingSessionController — 9 (`/api/sessions`)
| Method | Path                                | Auth        |
| ------ | ----------------------------------- | ----------- |
| POST   | `/api/sessions`                     | JWT         |
| POST   | `/api/sessions/end`                 | JWT         |
| POST   | `/api/sessions/clock-in`            | Public      |
| POST   | `/api/sessions/clock-out`           | JWT+MANAGER |
| GET    | `/api/sessions`                     | JWT         |
| GET    | `/api/sessions/pending`             | JWT+MANAGER |
| POST   | `/api/sessions/{sessionId}/approve` | JWT+MANAGER |
| POST   | `/api/sessions/{sessionId}/reject`  | JWT+MANAGER |
| POST   | `/api/sessions/{sessionId}/break`   | JWT         |

### ReviewController — 10 (`/api/reviews`)
| Method | Path                                | Auth        |
| ------ | ----------------------------------- | ----------- |
| GET    | `/api/reviews`                      | JWT         |
| POST   | `/api/reviews`                      | JWT         |
| GET    | `/api/reviews/stats`                | JWT         |
| GET    | `/api/reviews/public/token/{token}` | Public      |
| POST   | `/api/reviews/public/submit`        | Public      |
| GET    | `/api/reviews/{reviewId}`           | JWT         |
| PUT    | `/api/reviews/{reviewId}`           | JWT         |
| DELETE | `/api/reviews/{reviewId}`           | JWT+MANAGER |
| POST   | `/api/reviews/{reviewId}/response`  | JWT+MANAGER |
| GET    | `/api/reviews/response-templates`   | JWT+MANAGER |

### GdprController — 8 (`/api/gdpr`)
| Method | Path                                    | Auth        |
| ------ | --------------------------------------- | ----------- |
| GET    | `/api/gdpr/consent`                     | JWT         |
| POST   | `/api/gdpr/consent`                     | JWT         |
| DELETE | `/api/gdpr/consent`                     | JWT         |
| POST   | `/api/gdpr/request`                     | JWT         |
| GET    | `/api/gdpr/request`                     | JWT         |
| POST   | `/api/gdpr/request/{requestId}/process` | JWT+MANAGER |
| GET    | `/api/gdpr/export/{userId}`             | JWT         |
| GET    | `/api/gdpr/audit/{userId}`              | JWT+MANAGER |

### CampaignController — 8 (`/api/campaigns`)
| Method | Path                           | Auth        |
| ------ | ------------------------------ | ----------- |
| GET    | `/api/campaigns`               | JWT+MANAGER |
| POST   | `/api/campaigns`               | JWT+MANAGER |
| GET    | `/api/campaigns/{id}`          | JWT+MANAGER |
| PUT    | `/api/campaigns/{id}`          | JWT+MANAGER |
| DELETE | `/api/campaigns/{id}`          | JWT+MANAGER |
| POST   | `/api/campaigns/{id}/schedule` | JWT+MANAGER |
| POST   | `/api/campaigns/{id}/execute`  | JWT+MANAGER |
| POST   | `/api/campaigns/{id}/cancel`   | JWT+MANAGER |

### NotificationController — 5 (`/api/notifications`)
| Method | Path                           | Auth |
| ------ | ------------------------------ | ---- |
| GET    | `/api/notifications`           | JWT  |
| POST   | `/api/notifications/send`      | JWT  |
| PATCH  | `/api/notifications/{id}/read` | JWT  |
| PATCH  | `/api/notifications/read-all`  | JWT  |
| DELETE | `/api/notifications/{id}`      | JWT  |

### StoreController — 4 (`/api/stores`)
| Method | Path                    | Auth        |
| ------ | ----------------------- | ----------- |
| GET    | `/api/stores`           | Public      |
| GET    | `/api/stores/{storeId}` | Public      |
| POST   | `/api/stores`           | JWT+MANAGER |
| PUT    | `/api/stores/{storeId}` | JWT+MANAGER |

### EarningsController — 4 (`/api/staff`)
| Method | Path                          | Auth        |
| ------ | ----------------------------- | ----------- |
| GET    | `/api/staff/earnings/weekly`  | JWT         |
| GET    | `/api/staff/earnings/history` | JWT         |
| GET    | `/api/staff/pay-rates`        | JWT+MANAGER |
| POST   | `/api/staff/pay-rates`        | JWT+MANAGER |

### SystemInfoController — 5 (`/api/system`)
| Method | Path                         | Auth        |
| ------ | ---------------------------- | ----------- |
| GET    | `/api/system/health`         | Public      |
| GET    | `/api/system/version`        | Public      |
| GET    | `/api/system/info`           | Public      |
| GET    | `/api/system/updates/check`  | JWT+MANAGER |
| GET    | `/api/system/updates/status` | JWT+MANAGER |

### UserPreferencesController — 3 (`/api/preferences`)
| Method | Path                        | Auth |
| ------ | --------------------------- | ---- |
| GET    | `/api/preferences/{userId}` | JWT  |
| PUT    | `/api/preferences/{userId}` | JWT  |
| DELETE | `/api/preferences/{userId}` | JWT  |

### RatingController — 1 (`/api/notifications/rating`)
| Method | Path                             | Auth        |
| ------ | -------------------------------- | ----------- |
| POST   | `/api/notifications/rating/send` | JWT+MANAGER |

### TestDataController — 3 (`/api/test-data`) — `@Profile("dev")` only
| Method | Path                                        | Auth     |
| ------ | ------------------------------------------- | -------- |
| POST   | `/api/test-data/create-default-store`       | Dev only |
| POST   | `/api/test-data/create-test-stores`         | Dev only |
| POST   | `/api/test-data/migrate-users-to-storecode` | Dev only |

---

## COMMERCE-SERVICE — 32 Endpoints, 6 Controllers

### OrderController — 13 (`/api/orders`)
| Method | Path                                                        | Auth        |
| ------ | ----------------------------------------------------------- | ----------- |
| GET    | `/api/orders`                                               | JWT         |
| POST   | `/api/orders`                                               | JWT         |
| GET    | `/api/orders/kitchen`                                       | JWT+STAFF   |
| GET    | `/api/orders/track/{orderId}`                               | Public      |
| GET    | `/api/orders/{orderId}`                                     | JWT         |
| PUT    | `/api/orders/{orderId}`                                     | JWT         |
| POST   | `/api/orders/{orderId}/status`                              | JWT+STAFF   |
| DELETE | `/api/orders/{orderId}`                                     | JWT+MANAGER |
| PATCH  | `/api/orders/{orderId}/next-stage`                          | JWT+STAFF   |
| PATCH  | `/api/orders/{orderId}/payment`                             | Internal    |
| GET    | `/api/orders/{orderId}/quality-checkpoint`                  | JWT         |
| POST   | `/api/orders/{orderId}/quality-checkpoint`                  | JWT+STAFF   |
| PATCH  | `/api/orders/{orderId}/quality-checkpoint/{checkpointName}` | JWT+STAFF   |

### MenuController — 9 (`/api/menu`)
| Method | Path                             | Auth        |
| ------ | -------------------------------- | ----------- |
| GET    | `/api/menu`                      | Public      |
| GET    | `/api/menu/{id}`                 | Public      |
| POST   | `/api/menu`                      | JWT+MANAGER |
| POST   | `/api/menu/bulk`                 | JWT+MANAGER |
| POST   | `/api/menu/copy`                 | JWT+MANAGER |
| PUT    | `/api/menu/{id}`                 | JWT+MANAGER |
| PATCH  | `/api/menu/items/{id}/allergens` | JWT+MANAGER |
| DELETE | `/api/menu/{id}`                 | JWT+MANAGER |
| GET    | `/api/menu/stats`                | JWT+MANAGER |

### KitchenEquipmentController — 6 (`/api/equipment`)
| Method | Path                                       | Auth        |
| ------ | ------------------------------------------ | ----------- |
| GET    | `/api/equipment`                           | JWT         |
| POST   | `/api/equipment`                           | JWT+MANAGER |
| GET    | `/api/equipment/{equipmentId}`             | JWT         |
| PATCH  | `/api/equipment/{equipmentId}`             | JWT+MANAGER |
| DELETE | `/api/equipment/{equipmentId}`             | JWT+MANAGER |
| POST   | `/api/equipment/{equipmentId}/maintenance` | JWT+STAFF   |

### AggregatorController — 2 (`/api/aggregators`) — Global-6
| Method | Path                           | Auth        |
| ------ | ------------------------------ | ----------- |
| GET    | `/api/aggregators/connections` | JWT+MANAGER |
| POST   | `/api/aggregators/connections` | JWT+MANAGER |

### TipController — 1 (`/api/orders`)
| Method | Path                        | Auth        |
| ------ | --------------------------- | ----------- |
| POST   | `/api/orders/{orderId}/tip` | JWT+CASHIER |

### StaffTipController — 1 (`/api/staff/tips`)
| Method | Path                      | Auth        |
| ------ | ------------------------- | ----------- |
| GET    | `/api/staff/tips/pending` | JWT+MANAGER |

---

## PAYMENT-SERVICE — 12 Endpoints, 4 Controllers

### PaymentController — 7 (`/api/payments`)
| Method | Path                                      | Auth        |
| ------ | ----------------------------------------- | ----------- |
| POST   | `/api/payments/initiate`                  | JWT         |
| POST   | `/api/payments/verify`                    | JWT         |
| POST   | `/api/payments/cash`                      | JWT+CASHIER |
| GET    | `/api/payments`                           | JWT         |
| GET    | `/api/payments/{transactionId}`           | JWT         |
| POST   | `/api/payments/{transactionId}/reconcile` | JWT+MANAGER |
| DELETE | `/api/payments/gdpr/anonymize`            | JWT+MANAGER |

### RefundController — 3 (`/api/payments/refund`)
| Method | Path                              | Auth |
| ------ | --------------------------------- | ---- |
| POST   | `/api/payments/refund`            | JWT  |
| GET    | `/api/payments/refund`            | JWT  |
| GET    | `/api/payments/refund/{refundId}` | JWT  |

### WebhookController — 1 (`/api/payments/webhook`)
| Method | Path                    | Auth                                   |
| ------ | ----------------------- | -------------------------------------- |
| POST   | `/api/payments/webhook` | Public (Razorpay — signature-verified) |

### StripeWebhookController — 1 (`/api/payments/webhook/stripe`)
| Method | Path                           | Auth                                 |
| ------ | ------------------------------ | ------------------------------------ |
| POST   | `/api/payments/webhook/stripe` | Public (Stripe — signature-verified) |

---

## LOGISTICS-SERVICE — 42 Endpoints, 5 Controllers

### DeliveryController — 17 (`/api/delivery`)
| Method | Path                                          | Auth        |
| ------ | --------------------------------------------- | ----------- |
| POST   | `/api/delivery/dispatch`                      | Internal    |
| POST   | `/api/delivery/accept`                        | JWT+DRIVER  |
| POST   | `/api/delivery/reject`                        | JWT+DRIVER  |
| POST   | `/api/delivery/location`                      | JWT+DRIVER  |
| POST   | `/api/delivery/verify`                        | JWT+DRIVER  |
| POST   | `/api/delivery/route`                         | JWT+MANAGER |
| GET    | `/api/delivery/track/{orderId}`               | JWT         |
| GET    | `/api/delivery/zones`                         | JWT         |
| GET    | `/api/delivery/drivers/available`             | JWT+MANAGER |
| GET    | `/api/delivery/driver/{driverId}/pending`     | JWT+DRIVER  |
| GET    | `/api/delivery/driver/{driverId}/performance` | JWT         |
| GET    | `/api/delivery/driver/{driverId}/status`      | JWT         |
| PUT    | `/api/delivery/driver/{driverId}/status`      | JWT+DRIVER  |
| POST   | `/api/delivery/{orderId}/otp`                 | JWT+DRIVER  |
| PATCH  | `/api/delivery/{trackingId}/status`           | JWT+DRIVER  |
| GET    | `/api/delivery/analytics`                     | JWT+MANAGER |
| GET    | `/api/delivery/metrics`                       | JWT+MANAGER |

### InventoryController — 7 (`/api/inventory`)
| Method | Path                        | Auth        |
| ------ | --------------------------- | ----------- |
| GET    | `/api/inventory`            | JWT         |
| POST   | `/api/inventory`            | JWT+MANAGER |
| GET    | `/api/inventory/{id}`       | JWT         |
| PATCH  | `/api/inventory/{id}`       | JWT+MANAGER |
| DELETE | `/api/inventory/{id}`       | JWT+MANAGER |
| GET    | `/api/inventory/{id}/stock` | JWT         |
| GET    | `/api/inventory/value`      | JWT+MANAGER |

### SupplierController — 6 (`/api/suppliers`)
| Method | Path                     | Auth        |
| ------ | ------------------------ | ----------- |
| GET    | `/api/suppliers`         | JWT         |
| POST   | `/api/suppliers`         | JWT+MANAGER |
| GET    | `/api/suppliers/{id}`    | JWT         |
| PUT    | `/api/suppliers/{id}`    | JWT+MANAGER |
| DELETE | `/api/suppliers/{id}`    | JWT+MANAGER |
| GET    | `/api/suppliers/compare` | JWT+MANAGER |

### PurchaseOrderController — 6 (`/api/purchase-orders`)
| Method | Path                                 | Auth                |
| ------ | ------------------------------------ | ------------------- |
| GET    | `/api/purchase-orders`               | JWT                 |
| POST   | `/api/purchase-orders`               | JWT+MANAGER         |
| GET    | `/api/purchase-orders/{id}`          | JWT                 |
| PUT    | `/api/purchase-orders/{id}`          | JWT+MANAGER         |
| DELETE | `/api/purchase-orders/{id}`          | JWT+MANAGER         |
| POST   | `/api/purchase-orders/auto-generate` | Internal (AI agent) |

### WasteController — 6 (`/api/waste`)
| Method | Path                      | Auth        |
| ------ | ------------------------- | ----------- |
| GET    | `/api/waste`              | JWT         |
| POST   | `/api/waste`              | JWT+STAFF   |
| GET    | `/api/waste/{id}`         | JWT         |
| PUT    | `/api/waste/{id}`         | JWT+MANAGER |
| POST   | `/api/waste/{id}/approve` | JWT+MANAGER |
| GET    | `/api/waste/stats`        | JWT+MANAGER |

---

## INTELLIGENCE-SERVICE — 4 Endpoints, 2 Controllers

### AnalyticsController — 3 (`/api/analytics`)
| Method | Path                         | Auth        |
| ------ | ---------------------------- | ----------- |
| GET    | `/api/analytics`             | JWT+MANAGER |
| GET    | `/api/analytics/cache/clear` | JWT+MANAGER |
| POST   | `/api/analytics/cache/clear` | JWT+MANAGER |

### BIController — 1 (`/api/bi`)
| Method | Path              | Auth        |
| ------ | ----------------- | ----------- |
| GET    | `/api/bi`         | JWT+MANAGER |
| GET    | `/api/bi/reports` | JWT+MANAGER |

> **Known gap:** Intelligence-service has only 4 live routes. The analytics query params
> (`period`, `view`, `type` etc) are handled by the single `GET /api/analytics` endpoint.
> The plan's 11-endpoint breakdown is the intended final state pending further wiring.

---

## Structural Changes from Pre-Merge (what changed in the merges)

| Before                                                                | After                                                       | Reason           |
| --------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------- |
| `ResponseController` at `/api/responses`                              | Deleted — merged into `ReviewController`                    | Phase 1 collapse |
| `BIController` at `/api/intelligence`                                 | Now at `/api/bi`                                            | Phase 1 path fix |
| `DispatchController` + `TrackingController` + `PerformanceController` | Merged → single `DeliveryController` at `/api/delivery`     | Phase 1 collapse |
| `UserController` handled all auth                                     | `AuthController` split out at `/api/auth/*`                 | Phase 1 + hotfix |
| Commerce `RatingController`                                           | Deleted — rating token endpoints in core `ReviewController` | Phase 1          |
| No aggregator support                                                 | `AggregatorController` at `/api/aggregators`                | Global-6         |

## Gateway Dual-Path Auth Routes (backward compat)
```
/api/auth/login      ← also /api/users/login
/api/auth/register   ← also /api/users/register
/api/auth/logout     ← also /api/users/logout
/api/auth/refresh    ← also /api/users/refresh
/api/auth/google     ← also /api/users/auth/google, /api/users/google
```

---

*Generated: 2026-05-05 — from live `main` branch source code*
