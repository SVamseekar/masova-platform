# MaSoVa Platform — Master Reference Document
## Part 1 of 5: Business Overview & Backend Architecture

---

## 1. BUSINESS OVERVIEW

### What is MaSoVa?

MaSoVa is a full-stack, multi-channel restaurant management platform for a multi-branch restaurant chain (with EU/US multi-region architecture built in). It covers the complete restaurant lifecycle: customer ordering (web + mobile), kitchen operations, delivery, staff management, analytics, and AI-powered decision support.

### Business Capabilities

| Capability | Channel | Status |
|-----------|---------|--------|
| Customer ordering | Web, iOS, Android | Live |
| Kitchen display & prep tracking | Web (staff), Crew app | Live |
| Delivery assignment & live tracking | Crew app (driver), Customer app | Live |
| POS / Cashier order creation | Web (kiosk mode), Crew app | Live |
| Manager analytics dashboard | Web | Live |
| AI customer support | Web chat, mobile chat | Live |
| Demand forecasting | Background agent | Live (scheduled) |
| Churn prevention campaigns | Background agent | Live (scheduled) |
| Inventory reorder automation | Background agent | Live (scheduled) |
| Review response drafting | Background agent (RabbitMQ trigger) | Live |
| Shift optimisation | Background agent | Stub (needs Phase 2 data) |
| Dynamic pricing | Background agent | Stub (needs Phase 2 data) |

### Cuisines & Menu Structure

8 cuisine categories: **South Indian**, **North Indian**, **Indo-Chinese**, **Italian**, **American**, **Continental**, **Beverages**, **Desserts**

40+ menu categories (DOSA, IDLY_VADA, PIZZA, PASTA, BURGER, BIRYANI, HOT_DRINKS, etc.)

### Store Locations

3 operational stores (dev seeded):
- MaSoVa Store 1 (DOM001) — 4.7★, 25 min ETA, ₹29 delivery
- MaSoVa Store 2 (DOM002) — 4.5★, 35 min ETA, ₹49 delivery
- MaSoVa Store 3 (DOM003) — 4.6★, 45 min ETA, ₹79 delivery

### Delivery Zone Pricing

| Zone | Radius | Fee |
|------|--------|-----|
| ZONE_A | 0–3 km | ₹29 |
| ZONE_B | 3–6 km | ₹49 |
| ZONE_C | 6–10 km | ₹79 |
| Out of area | >10 km | Rejected |

Free delivery threshold: ₹500+ order value

---

## 2. INFRASTRUCTURE OVERVIEW

### Dev Environment Split

| Machine | Runs | Notes |
|---------|------|-------|
| Mac M1 | Frontend (:3000), Mobile apps, Claude Code, masova-support (:8000) | LAN IP auto-detected |
| Dell i3 Windows | All 6 backend services + Docker | IP: 192.168.50.88 |

### Service Ports

| Service | Port | Technology |
|---------|------|-----------|
| API Gateway | 8080 | Spring Cloud Gateway (reactive) |
| Core Service | 8085 | Spring Boot 3, Java 21 |
| Commerce Service | 8084 | Spring Boot 3, Java 21 |
| Payment Service | 8089 | Spring Boot 3, Java 21 |
| Logistics Service | 8086 | Spring Boot 3, Java 21 |
| Intelligence Service | 8087 | Spring Boot 3, Java 21 |
| Frontend | 3000 | React 19, Vite |
| AI Support Agent | 8000 | FastAPI, Python |

### Infrastructure Services (Docker, Dell)

| Service | Port | Database |
|---------|------|---------|
| MongoDB | 27017 | masova_core, masova_commerce, masova_payment, masova_logistics, masova_analytics |
| PostgreSQL | 5432 | masova_db (core_schema, commerce_schema, payment_schema, logistics_schema) |
| Redis | 6379 | DB 0: JWT blacklist · DB 1: Agent sessions · Cache: menu/store/users |
| RabbitMQ | 5672 (AMQP), 15672 (Management UI) | masova.orders.exchange, masova.notifications.exchange |

### Production (GCP)

| Component | Platform |
|-----------|----------|
| Backend (6 services) | GCP Cloud Run (auto-scaling 1–10 instances) |
| Frontend | Firebase Hosting |
| Databases | Cloud-managed MongoDB Atlas + Cloud SQL PostgreSQL |
| Monitoring | Cloud Logging, Cloud Monitoring, Cloud Trace |
| CI/CD | GitHub Actions → Artifact Registry → Cloud Run deploy |

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

| Class | Purpose |
|-------|---------|
| `ApiGatewayApplication` | Bootstrap |
| `GatewayConfig` | Route registration — maps paths to 5 downstream services |
| `JwtAuthenticationFilter` | Gateway-level JWT validation (HS512), extracts claims |
| `RateLimitingFilter` | 1000 req/min per IP (raised for POS concurrency) |
| `ForwardedHeaderFilter` | Manages X-Forwarded-* headers for downstream |
| `CorsConfig` | CORS policy (all origins in dev, specific in prod) |
| `NettyConfig` | Connection pool: 500 max, 3s acquire timeout, 10s response timeout |
| `OpenApiConfig` | Aggregates Swagger UI from all 5 services |

### JWT Validation Logic

1. Extract Bearer token from `Authorization` header
2. Validate signature (HS512, secret from env `JWT_SECRET`)
3. Check if token is blacklisted in Redis DB 0
4. Extract `sub` (userId), `userType`, `storeId` claims
5. For staff roles (MANAGER, ASSISTANT_MANAGER, STAFF, DRIVER, KIOSK): validate `storeId` is present
6. Set `X-User-Id`, `X-User-Type`, `X-User-Store-Id` headers on routed request
7. Return 401 on invalid token, 403 on missing storeId for staff

### Route Table (Gateway → Service)

| Path Pattern | Downstream | Notes |
|-------------|-----------|-------|
| `/api/users/**`, `/api/auth/**` | Core Service :8085 | Auth, user management |
| `/api/sessions/**`, `/api/shifts/**` | Core Service :8085 | Working sessions, shift scheduling |
| `/api/customers/**`, `/api/reviews/**` | Core Service :8085 | Customer management |
| `/api/notifications/**`, `/api/campaigns/**` | Core Service :8085 | Notifications, campaigns |
| `/api/stores/**` | Core Service :8085 | Store management |
| `/api/orders/**`, `/api/menu/**` | Commerce Service :8084 | Orders, menu items |
| `/api/equipment/**` | Commerce Service :8084 | Kitchen equipment |
| `/api/payments/**` | Payment Service :8089 | Payment processing |
| `/api/delivery/**`, `/api/dispatch/**` | Logistics Service :8086 | Delivery tracking, dispatch |
| `/api/inventory/**`, `/api/suppliers/**` | Logistics Service :8086 | Inventory, suppliers |
| `/api/analytics/**`, `/api/intelligence/**` | Intelligence Service :8087 | Analytics, BI |
| `/api/purchase-orders/**`, `/api/waste/**` | Logistics Service :8086 | POs, waste records |

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

#### UserController — 35 endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/users/register` | Public | Customer registration |
| POST | `/api/users/login` | Public | Email/password login → JWT |
| POST | `/api/auth/google` | Public | Google OAuth2 → JWT |
| POST | `/api/users/validate-pin` | Public | PIN-based login (kiosk) |
| POST | `/api/users/logout` | JWT | Blacklist token in Redis |
| POST | `/api/users/refresh` | JWT (refresh) | Issue new access token |
| GET | `/api/users/{userId}` | JWT | Get user details |
| PUT | `/api/users/{userId}` | JWT | Update user |
| DELETE | `/api/users/{userId}` | JWT+MANAGER | Soft-delete user |
| POST | `/api/users/activate` | JWT+MANAGER | Activate user |
| POST | `/api/users/deactivate` | JWT+MANAGER | Deactivate user |
| POST | `/api/users/kiosk/create` | JWT+MANAGER | Create kiosk account |
| GET | `/api/users/kiosk/list` | JWT+MANAGER | List kiosk accounts |
| POST | `/api/users/kiosk/{id}/regenerate-tokens` | JWT+MANAGER | Regenerate kiosk PIN |
| POST | `/api/users/kiosk/auto-login` | Public | PIN-based kiosk auto-login |

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

| Class | Notes |
|-------|-------|
| `StoreEntity` (MongoDB) | Name, address, operatingHours, deliveryRadius, deliveryFee, storeType, countryCode |
| `StoreController` | 25+ endpoints: CRUD, working hours, validation |
| `StoreService` | Operating hours check, delivery radius validation |
| `CountryProfileService` | Multi-country config (India, EU, US, Canada) |

**Store endpoints:**

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/stores/public` | Public |
| GET | `/api/stores/public/{storeId}` | Public |
| GET | `/api/stores/public/nearest` | Public (lat/lng params) |
| POST | `/api/stores` | JWT+MANAGER |
| PUT | `/api/stores/{storeId}` | JWT+MANAGER |

### 5.3 Shift & Working Sessions

| Class | Notes |
|-------|-------|
| `ShiftController` | 10+ endpoints: schedule shifts, list by employee/store/date |
| `ShiftService` (180 lines) | Overlap detection, 4h minimum shift duration rule |
| `ShiftViolationException` | Detects early checkout, working outside assigned shift |
| `WorkingSessionController` | Clock-in/clock-out lifecycle |
| `WorkingSessionService` | Active session tracking, session history |

**Key endpoints:**

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/sessions` | JWT | Clock in |
| POST | `/api/sessions/end` | JWT | Clock out |
| GET | `/api/sessions/employee/{employeeId}` | JWT | Session history |
| GET | `/api/sessions/store/{storeId}/active` | JWT+MANAGER | Active sessions |
| PATCH | `/api/sessions/{id}/approve` | JWT+MANAGER | Approve session |
| GET | `/api/shifts` | JWT | Upcoming shifts |
| POST | `/api/shifts` | JWT+MANAGER | Schedule shift |

### 5.4 Customer Management

| Class | Notes |
|-------|-------|
| `CustomerEntity` (MongoDB) | Profile, addresses[], loyaltyPoints, tier, preferences, GDPR consent |
| `CustomerController` | 15+ endpoints: CRUD, loyalty, addresses, preferences |
| `CustomerService` (500+ lines) | Signup bonus 100 pts, birthday bonus 200 pts, tier calculation |
| `CustomerAuditService` | GDPR data access logging |
| `CustomerDataRetentionService` | Auto soft-delete per retention policy |

**Loyalty Tiers:**
- BRONZE: 0–499 pts
- SILVER: 500–1999 pts
- GOLD: 2000–4999 pts
- PLATINUM: 5000+ pts

**Key endpoints:**

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/customers/get-or-create` | Internal only (NOT via gateway) |
| GET | `/api/customers/{customerId}` | JWT |
| PATCH | `/api/customers/{customerId}` | JWT |
| POST | `/api/customers/{customerId}/addresses` | JWT |
| PATCH | `/api/customers/{customerId}/addresses/{addressId}` | JWT |
| DELETE | `/api/customers/{customerId}/addresses/{addressId}` | JWT |
| PATCH | `/api/customers/{customerId}/addresses/{addressId}/set-default` | JWT |
| GET | `/api/customers/{customerId}/stats` | JWT | Loyalty points, tier, order stats |

### 5.5 Notifications & Communications

| Class | Notes |
|-------|-------|
| `NotificationService` | Fan-out to email/SMS/push |
| `EmailService` | Brevo API (transactional: order confirm, OTP, receipts) |
| `SmsService` | Twilio (OTP delivery, delivery alerts) |
| `PushService` | Firebase Cloud Messaging (FCM) |
| `CampaignService` | Marketing campaign management (WIN_BACK, PROMOTIONAL) |
| `RatingRequestService` | Post-delivery rating token workflow |
| `OrderEventListener` | RabbitMQ consumer → triggers notifications on order events |

**Notification types:** ORDER_UPDATE, PAYMENT_SUCCESS, DRIVER_ASSIGNED, DELIVERY_OTP, PROMOTION, CHURN_ALERT, INVENTORY_ALERT, REVIEW_DRAFT_RESPONSE

### 5.6 Reviews & Ratings

| Class | Notes |
|-------|-------|
| `Review` (MongoDB) | reviewId, orderId, customerId, storeId, rating(1-5), text, type(DINE_IN/DELIVERY/DRIVER/ITEM), flagged, createdAt |
| `ReviewResponse` (MongoDB) | reviewId, responseText, respondedBy, isAutoGenerated |
| `ReviewController` | 150+ lines — public rating, create, read, flag |
| `ReviewService` | Creation, analytics by category/item/driver |
| `ReviewResponseService` | AI-draft replies (delegates to masova-support) |
| `ModerationService` | Content moderation (keyword filter) |
| `SentimentAnalysisService` | NLP-based sentiment scoring |

**Key endpoints:**

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/reviews` | JWT |
| GET | `/api/reviews/public/token/{token}` | Public (rating token) |
| GET | `/api/reviews/public/item/{itemId}` | Public |
| POST | `/api/reviews/complaints` | JWT |

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

| Class | Notes |
|-------|-------|
| `StaffEarningsSummaryEntity` | Weekly earnings rollup per employee |
| `StaffPayRateEntity` | Store-specific hourly pay rates (₹/hour) |
| `EarningsController` | GET `/weekly/{staffId}`, POST `/pay-rate` |
| `EarningsService` | Calculates from working sessions + tips |

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

### 6.3 OrderController — 40+ endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/orders` | JWT | Create order |
| GET | `/api/orders/{orderId}` | JWT | Order details |
| GET | `/api/orders/track/{orderId}` | Public | Real-time tracking |
| GET | `/api/orders/kitchen` | JWT+STAFF | Active kitchen orders |
| PATCH | `/api/orders/{orderId}/status` | JWT+STAFF | Status transition |
| POST | `/api/orders/{orderId}/status` | JWT+STAFF | Alternate status path |
| PATCH | `/api/orders/{orderId}/next-stage` | JWT+STAFF | Sequential stage advance |
| PATCH | `/api/orders/{orderId}/assign-driver` | JWT+MANAGER | Driver assignment |
| PATCH | `/api/orders/{orderId}/payment` | Internal | Payment status update |
| POST | `/api/orders/{orderId}/quality-checkpoint` | JWT+STAFF | Quality check |
| PATCH | `/api/orders/{orderId}/delivery-otp` | JWT+DRIVER | OTP verification |
| PATCH | `/api/orders/{orderId}/delivery-proof` | JWT+DRIVER | Proof of delivery (photo) |
| PATCH | `/api/orders/{orderId}/mark-delivered` | JWT+DRIVER | Mark as delivered |
| GET | `/api/orders/analytics/prep-time` | JWT+MANAGER | Preparation time analytics |

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

| Country | Context | Category | Rate |
|---------|---------|----------|------|
| France | TAKEAWAY | FOOD | 5.5% |
| France | TAKEAWAY | ALCOHOL | 20% |
| Germany | DINE_IN | FOOD | 19% |
| Germany | TAKEAWAY | FOOD | 7% |
| Germany | TAKEAWAY | ALCOHOL | 19% |
| UK | any | FOOD | 0% |
| UK | any | ALCOHOL | 20% |

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

**Allergen enforcement:** All 14 EU Regulation 1169/2011 allergens tracked and displayed

### 6.8 Kitchen Equipment

| Class | Notes |
|-------|-------|
| `KitchenEquipment` (MongoDB) | Equipment type, status (OPERATIONAL/MAINTENANCE/BROKEN), capacity |
| `KitchenEquipmentController` | GET `/api/equipment`, POST, PATCH status |
| `KitchenEquipmentService` | Equipment state management, impacts prep time modeling |

**Note:** Path is `/api/equipment` — NOT `/api/kitchen-equipment`

### 6.9 Tips & Gratuity

| Class | Notes |
|-------|-------|
| `OrderTipEntity` (PostgreSQL) | Tip amount, orderId, staffId, createdAt |
| `TipController` | POST `/api/tips`, GET `/api/tips/order/{orderId}`, GET `/api/tips/staff/{staffId}` |
| `TipService` | Staff attribution, gratuity calculation |

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

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/payments/refund` | JWT |
| POST | `/api/payments/refund/request` | JWT | (AI agent path) |
| GET | `/api/payments/{transactionId}` | JWT |
| GET | `/api/payments/order/{orderId}` | JWT |
| POST | `/api/payments/cash` | JWT+CASHIER | Cash payment record |
| POST | `/api/payments/reconcile` | JWT+MANAGER | Manual reconciliation |

**Refund reasons:** CUSTOMER_REQUEST, ORDER_CANCELLED, QUALITY_ISSUE, DUPLICATE_CHARGE, PAYMENT_ERROR

**Processing time:** 3–5 business days (surface to customer via masova-support agent)

### 7.5 Security

- `PiiEncryptionService` — AES-256 encryption for PAN (card numbers — last 4 only stored)
- Stripe webhook signature validation (Stripe-Signature header)
- Razorpay webhook HMAC validation

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

#### DispatchController — 10 endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/dispatch/auto-dispatch` | Internal | AI driver assignment |
| POST | `/api/dispatch/route-optimize` | JWT+MANAGER | Multi-stop route optimization |
| GET | `/api/dispatch/zone/check` | JWT | Delivery feasibility |
| GET | `/api/dispatch/zone/fee` | JWT | Zone delivery fee |
| PUT | `/api/dispatch/driver/status` | JWT+DRIVER | Update driver status |
| GET | `/api/dispatch/driver/{driverId}/status` | JWT | Driver current status |

#### Auto-Dispatch Algorithm (AutoDispatchService)
1. Get all AVAILABLE drivers in store area
2. Filter: not currently on delivery, is online
3. Calculate Haversine distance from each driver to store
4. Select closest driver (load-balance: minimize cumulative distance)
5. Assign via RabbitMQ event or direct DB write

### 8.2 Tracking

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/delivery/tracking/{orderId}` | JWT |
| GET | `/api/delivery/eta/{orderId}` | JWT |
| GET | `/api/delivery/track/{orderId}` | JWT |

**WebSocket:** `/ws/delivery/{customerId}` — Real-time delivery updates (STOMP)

**ETACalculationService:** Google Maps Distance Matrix API → predicted delivery minutes

### 8.3 Proof of Delivery

- `ProofOfDeliveryService` — Photo upload + OTP verification
- Photo stored in Cloud Storage
- OTP: 4-digit, generated on order dispatch, verified on delivery
- POST `/api/delivery/{orderId}/generate-otp` — Generate OTP
- POST `/api/delivery/verify-otp` — Verify OTP (`{orderId, otp}`)

### 8.4 Driver Performance

| Metric | Source |
|--------|--------|
| Total deliveries | Completed delivery count |
| On-time % | Estimated vs actual delivery time |
| Average delivery time | Minutes per delivery |
| Rating | Customer ratings on delivered orders |
| Distance | GPS tracking (accumulated km) |

GET `/api/dispatch/performance/{driverId}` — Full performance metrics

### 8.5 Inventory Management

#### InventoryItem (MongoDB)
```
itemId, itemName, storeId, currentStock, minStock
reorderQuantity, unit, lastRestockDate
supplier (supplierId, name), cost
```

**Auto-reorder trigger:** `currentStock < minStock` → notify manager + background agent creates PO

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/inventory/items` | JWT |
| POST | `/api/inventory/reserve` | Internal | Reserve stock for order |
| POST | `/api/inventory/release` | Internal | Release reservation |
| POST | `/api/inventory/adjust` | JWT+MANAGER | Manual adjustment |
| GET | `/api/inventory/value` | JWT+MANAGER | Inventory value report |

### 8.6 Purchase Orders & Suppliers

#### PurchaseOrder (MongoDB)
```
poNumber, supplierId, storeId, items[]
totalAmount, status: DRAFT|SUBMITTED|APPROVED|RECEIVED|CANCELLED
expectedDeliveryDate, actualDeliveryDate, notes
autoGenerated (boolean — from AI agent), generatedAt
```

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/purchase-orders` | JWT+MANAGER |
| POST | `/api/purchase-orders/auto-generate` | Internal (AI agent) |
| PATCH | `/api/purchase-orders/{poId}/approve` | JWT+MANAGER |
| PATCH | `/api/purchase-orders/{poId}/receive` | JWT+MANAGER |
| GET | `/api/purchase-orders/supplier/{supplierId}/performance` | JWT+MANAGER |

### 8.7 Waste Tracking

#### WasteRecord (MongoDB)
```
wasteId, storeId, date
category: SPOILAGE|DAMAGED|EXPIRED|RETURNED
quantity, unit, reason, cost
approvedByManager, createdByStaffId
```

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/waste/record` | JWT+STAFF |
| PATCH | `/api/waste/approve` | JWT+MANAGER |
| GET | `/api/waste/summary` | JWT+MANAGER |

---

## 9. INTELLIGENCE SERVICE (Port 8087)

**Location:** `/intelligence-service`
**Primary DB:** MongoDB (`masova_analytics`)
**Java Files:** 34

### AnalyticsController + BIController — 11 endpoints total

> **Note:** After Phase 1 API reduction, BIController was merged into AnalyticsController. All 11 canonical endpoints live under `/api/analytics`. There is no separate `/api/bi` or `/api/intelligence` prefix.

| Method | Path | Auth | Returns |
|--------|------|------|---------|
| GET | `/api/analytics/sales` | JWT+MANAGER | Sales (query: period=today\|week\|month, view=breakdown\|trend\|peak-hours) |
| GET | `/api/analytics/products` | JWT+MANAGER | Top products |
| GET | `/api/analytics/staff` | JWT+MANAGER | Staff performance (query: staffId, view=leaderboard) |
| GET | `/api/analytics/staff/{id}/hours` | JWT+MANAGER | Working hours report |
| GET | `/api/analytics/orders` | JWT+MANAGER | Order metrics (avg prep time, avg value, distribution) |
| GET | `/api/analytics/drivers` | JWT+MANAGER | Driver status + performance metrics |
| GET | `/api/analytics/customers` | JWT+MANAGER | Customer behaviour analytics |
| GET | `/api/analytics/cost` | JWT+MANAGER | Cost analysis (COGS, margins) |
| GET | `/api/analytics/forecast` | JWT+MANAGER | Forecasts (query: type=sales\|demand\|churn) |
| GET | `/api/analytics/executive` | JWT+MANAGER | Executive summary dashboard (P&L, KPIs) |
| GET | `/api/analytics/benchmarking` | JWT+MANAGER | Store benchmarking (multi-store comparison) |

### Event Consumption

`AnalyticsEventListener` consumes from RabbitMQ:
- `OrderStatusChangedEvent` → updates order analytics
- `PaymentCompletedEvent` → updates revenue metrics

All processing is async, failures logged but do not affect business flow.

---

## 10. SHARED MODULES

### shared-models (`/shared-models`) — 96 Java files

**Enums (14):** OrderStatus, PaymentStatus, PaymentMethod, UserType, ShiftType, ShiftStatus, StoreStatus, MenuCategory, Cuisine, DietaryType, SpiceLevel, ConsentType, GdprRequestType, GdprRequestStatus

**OrderStatus values:** RECEIVED, PREPARING, OVEN, BAKED, READY, DISPATCHED, OUT_FOR_DELIVERY, DELIVERED, SERVED, COMPLETED, CANCELLED

**Key DTOs:**
- `ApiResponse<T>` — Standardized wrapper: `{success, data, message, timestamp}`
- `ErrorResponse` — `{errorCode, message, details, timestamp}`
- `PagedResponse<T>` — `{page, size, total, data}`

**Domain Events:**
- `OrderCreatedEvent`
- `OrderStatusChangedEvent` — `{eventId, orderId, storeId, timestamp, previousStatus, newStatus, orderType, customerId, assignedDriverId}`
- `PaymentCompletedEvent`
- `PaymentFailedEvent`

**RabbitMQ Config:**
- `masova.orders.exchange` (topic, durable) — routing: `order.*`
- `masova.notifications.exchange` (topic, durable) — routing: `notification.*`

**Security (shared-security):**
- `JwtTokenProvider` — HS512 generation/validation
- `SecurityConfigurationBase` — Base Spring Security config
- `JwtAuthenticationFilter` — Servlet filter (legacy; gateway uses reactive)

**Cache Config (AdvancedCacheConfig):**
- Redis caching with per-key TTL patterns
- Menu: 5 min, Store: 10 min, User sessions: 24h

### Database Summary

| DB | Type | Schemas/Collections |
|----|------|---------------------|
| masova_core | MongoDB | users, customers, reviews, notifications, campaigns, shifts, workinksessions |
| masova_commerce | MongoDB | menu_items, orders, kitchen_equipment, rating_tokens |
| masova_payment | MongoDB | transactions, refunds |
| masova_logistics | MongoDB | delivery_tracking, driver_locations, inventory_items, purchase_orders, suppliers, waste_records |
| masova_analytics | MongoDB | analytics snapshots (denormalized) |
| masova_db | PostgreSQL | core_schema.users, commerce_schema.orders, payment_schema.transactions, payment_schema.refunds, logistics_schema.inventory |

**Redis:**
- DB 0: JWT blacklist (`token:{jti}` → expiration)
- DB 1: Agent sessions (conversation state, 1h TTL)
- Cache: Menu items (5 min), store data (10 min), user sessions (24h)

**Key MongoDB Indexes:**
- Orders: `{storeId:1, status:1}`, `{customerId:1, createdAt:-1}`, `{assignedDriverId:1, status:1}`
- Users: `{email:1 unique}`, `{phone:1 unique}`, `{storeId:1}`
- Menu: `{storeId:1, category:1}`, `{name:1}`

---

*Continued in Part 2: Frontend, AI Support Agent, Mobile Apps*
