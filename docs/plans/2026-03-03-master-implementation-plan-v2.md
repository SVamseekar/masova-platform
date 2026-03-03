# MaSoVa Master Implementation Plan v2
**Date:** 2026-03-03
**Status:** Active — supersedes `2026-03-02-master-implementation-plan.md`
**Author:** Architecture Review (Senior Java + UI/UX + DBA + Android + AI/ML)
**Purpose:** Single source of truth for all remaining work across backend, database, frontend, mobile, AI agents, and deployment.

---

## System Overview

MaSoVa is a full-stack restaurant management platform:
- **Backend:** 6 Spring Boot microservices (471 endpoints → 175 after reduction)
- **Web Frontend:** React 19, TypeScript, Vite, MUI — neumorphic (staff) + dark premium (customer)
- **Staff Mobile:** Single React Native 0.81 app — role-based (Manager, Kitchen, Driver, Cashier)
- **Customer Mobile:** React Native 0.81 (masova-mobile)
- **AI Agents:** Python, Google ADK 1.25, FastAPI — 8 agents total
- **Infrastructure:** Dell i3 (backend dev), Mac M1 (frontend dev), GCP (production)

---

## Current Reality (as of 2026-03-03)

### What Works
- 6 consolidated Spring Boot services running on Dell
- JWT auth via API Gateway, Redis JWT blacklist
- MongoDB for all data (28 collections)
- RTK Query frontend, role-based routing
- Customer mobile: menu, cart, Razorpay, STOMP WebSocket, Google Maps, Google Sign-In
- AI Support Agent: FastAPI, 7 tools, web ChatWidget, mobile ChatScreen
- RabbitMQ: PaymentEventPublisher wired correctly
- Delivery radius check: endpoint + frontend warning

### Production Blockers (broken right now)
- `OrderEventPublisher` never wired into `OrderService` — all order events silent
- `OrderStatus` enum has 2 conflicting definitions — inter-service deserialization fails on READY/SERVED/COMPLETED/CANCELLED
- `InMemorySessionService` in masova-support conflicts with Redis session in main.py
- `customers.email/phone` has global unique index — violates multi-tenancy (should be store-scoped)
- `notifications` collection has no `userId` index — full collection scans on every notification fetch
- `reviews` collection has no deduplication index — duplicate reviews possible

### Open Order Flow Gaps
- Inventory never decrements on order creation or completion
- DINE_IN removed from all frontends (POS, customer web, customer mobile)
- KDS missing READY column — orders get stuck after BAKED
- Manager "Mark as Completed" always sets DELIVERED regardless of order type
- Delivery fee: 3 different hardcoded values (₹29 frontend, ₹40 POS, dynamic backend)
- Tax: hardcoded 5% on frontend vs dynamic backend
- Driver rating submission is console.log() — no API call
- Driver assignment uses window.prompt — no UI
- OTP proof-of-delivery fields exist but never used
- DeliveryManagementPage + DriverManagementPage routed correctly (both .tsx exist + .bak versions — verify routing)

---

## API Design (471 → 175 endpoints)

### Design Principles
1. One canonical path per resource — no `/api/v1/x` duplicates
2. Query params for all filtering — not separate endpoints per filter
3. CRUD only where the resource is genuinely managed
4. State transitions are explicit POST actions — never buried in PATCH body
5. Internal service-to-service calls not exposed via API Gateway
6. Analytics endpoints live only in intelligence-service
7. `TestDataController` behind `@Profile("dev")` only

### Final 175-Endpoint Canonical API

#### CORE-SERVICE

**Auth — 7**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/google` | Google sign-in (login + register, backend detects) |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/validate-pin` | Validate employee PIN |

**Users — 11**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/users` | List users (query: type, storeId, available, search) |
| GET | `/api/users/{id}` | Get user |
| PATCH | `/api/users/{id}` | Update user (any field including status) |
| POST | `/api/users/{id}/activate` | Activate user |
| POST | `/api/users/{id}/deactivate` | Deactivate user |
| POST | `/api/users/{id}/generate-pin` | Generate PIN (body: bulk=true for all) |
| POST | `/api/users/kiosk` | Create kiosk |
| GET | `/api/users/kiosk` | List kiosks (query: storeId) |
| POST | `/api/users/kiosk/{id}/regenerate` | Regenerate kiosk tokens |
| POST | `/api/users/kiosk/{id}/deactivate` | Deactivate kiosk |
| POST | `/api/users/kiosk/auto-login` | Kiosk auto-login |

**Stores — 4**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/stores` | List stores (query: code, region, near=lat,lng, radius, lat, lng → returns withinDeliveryRadius field) |
| GET | `/api/stores/{id}` | Get store |
| POST | `/api/stores` | Create store |
| PATCH | `/api/stores/{id}` | Update store |

**Shifts — 10**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/shifts` | List (query: storeId, employeeId, week, date, view=coverage) |
| POST | `/api/shifts` | Create shift |
| POST | `/api/shifts/bulk` | Bulk create |
| POST | `/api/shifts/copy-week` | Copy previous week schedule |
| GET | `/api/shifts/{id}` | Get shift |
| PATCH | `/api/shifts/{id}` | Update shift |
| DELETE | `/api/shifts/{id}` | Cancel shift |
| POST | `/api/shifts/{id}/confirm` | Confirm attendance |
| POST | `/api/shifts/{id}/start` | Start shift |
| POST | `/api/shifts/{id}/complete` | Complete shift |

**Sessions — 9**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/sessions` | Start session (body: optional location) |
| POST | `/api/sessions/end` | End session (body: optional location) |
| POST | `/api/sessions/clock-in` | Clock in with PIN |
| POST | `/api/sessions/clock-out` | Clock out employee (manager action) |
| GET | `/api/sessions` | List (query: storeId, employeeId, active, date) |
| GET | `/api/sessions/pending` | Sessions pending approval |
| POST | `/api/sessions/{id}/approve` | Approve session |
| POST | `/api/sessions/{id}/reject` | Reject session |
| POST | `/api/sessions/{id}/break` | Add break |

**Customers — 13**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/customers` | List (query: filter, email, phone, userId, tag, tier, search) |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/stats` | Customer statistics |
| GET | `/api/customers/{id}` | Get customer (includes loyalty + max redeemable) |
| PATCH | `/api/customers/{id}` | Update customer |
| POST | `/api/customers/{id}/activate` | Activate |
| POST | `/api/customers/{id}/deactivate` | Deactivate |
| POST | `/api/customers/{id}/loyalty` | Add/redeem points (body: type, amount) |
| POST | `/api/customers/{id}/addresses` | Add address |
| PATCH | `/api/customers/{id}/addresses/{aid}` | Update address (includes isDefault flag) |
| DELETE | `/api/customers/{id}/addresses/{aid}` | Remove address |
| POST | `/api/customers/{id}/tags` | Add/remove tags (body: add[], remove[]) |
| DELETE | `/api/customers/{id}` | GDPR anonymise |

**Notifications — 5**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/notifications` | List (query: userId, unread, recent) |
| POST | `/api/notifications` | Send notification |
| PATCH | `/api/notifications/{id}/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all as read (query: userId) |
| DELETE | `/api/notifications/{id}` | Delete |

**Preferences — 3**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/preferences/{userId}` | Get preferences |
| PATCH | `/api/preferences/{userId}` | Update (any field: channel, deviceToken, contact, preferredPaymentMethod) |
| DELETE | `/api/preferences/{userId}` | Delete preferences |

**Campaigns — 8**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/{id}` | Get campaign |
| PATCH | `/api/campaigns/{id}` | Update campaign |
| DELETE | `/api/campaigns/{id}` | Delete campaign |
| POST | `/api/campaigns/{id}/schedule` | Schedule |
| POST | `/api/campaigns/{id}/execute` | Execute |
| POST | `/api/campaigns/{id}/cancel` | Cancel |

**Reviews — 10**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/reviews` | List (query: status, entityType, entityId, rating, flagged) |
| POST | `/api/reviews` | Create review |
| GET | `/api/reviews/stats` | Stats (query: entityType, entityId) |
| GET | `/api/reviews/public/token/{token}` | Rating page via token |
| POST | `/api/reviews/public/submit` | Submit public rating |
| GET | `/api/reviews/{id}` | Get review |
| PATCH | `/api/reviews/{id}` | Update review (status, flag, approve, reject via body) |
| DELETE | `/api/reviews/{id}` | Delete review |
| POST | `/api/reviews/{id}/response` | Add/update manager response |
| GET | `/api/reviews/response-templates` | Get response templates |

**GDPR — 8**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/gdpr/consent` | Get consents (query: userId) |
| POST | `/api/gdpr/consent` | Grant consent |
| DELETE | `/api/gdpr/consent` | Revoke consent |
| POST | `/api/gdpr/request` | Submit GDPR request |
| GET | `/api/gdpr/request` | Get user's requests (query: userId) |
| POST | `/api/gdpr/request/{id}/process` | Process (body: type=access\|erasure\|portability\|rectification) |
| GET | `/api/gdpr/export/{userId}` | Export user data |
| GET | `/api/gdpr/audit/{userId}` | Audit log |

**System — 1**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Aggregated health (gateway level) |

*Core-service subtotal: 89*

---

#### COMMERCE-SERVICE

**Menu — 8**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/menu` | List (query: storeId, cuisine, category, dietary, tag, search, recommended, available) |
| GET | `/api/menu/{id}` | Get menu item |
| POST | `/api/menu` | Create menu item |
| POST | `/api/menu/bulk` | Bulk create |
| POST | `/api/menu/copy` | Copy menu from another store |
| PATCH | `/api/menu/{id}` | Update item (includes availability) |
| DELETE | `/api/menu/{id}` | Delete item |
| GET | `/api/menu/stats` | Menu statistics |

**Orders — 12**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/orders` | List (query: storeId, status, customerId, staffId, from, to, number) |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/kitchen` | Kitchen queue (KDS) |
| GET | `/api/orders/track/{id}` | Public tracking (no auth) |
| GET | `/api/orders/{id}` | Get order |
| PATCH | `/api/orders/{id}` | Update mutable fields (items, priority, driver, make-table, delivery proof/OTP) |
| POST | `/api/orders/{id}/status` | Explicit status transition (body: status, reason) |
| DELETE | `/api/orders/{id}` | Cancel order |
| POST | `/api/orders/{id}/next-stage` | Advance KDS stage |
| GET | `/api/orders/{id}/checkpoints` | Quality checkpoints |
| POST | `/api/orders/{id}/checkpoints` | Add checkpoint |
| PATCH | `/api/orders/{id}/checkpoints/{name}` | Update checkpoint |

**Equipment — 6**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/equipment` | List (query: storeId, status, needsMaintenance) |
| POST | `/api/equipment` | Add equipment |
| GET | `/api/equipment/{id}` | Get equipment |
| PATCH | `/api/equipment/{id}` | Update (status, power, temperature, resetUsage in body) |
| DELETE | `/api/equipment/{id}` | Remove equipment |
| POST | `/api/equipment/{id}/maintenance` | Record maintenance |

*Commerce-service subtotal: 26*

---

#### LOGISTICS-SERVICE

**Delivery — 11**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/delivery/dispatch` | Auto-dispatch driver |
| POST | `/api/delivery/accept` | Driver accepts delivery |
| POST | `/api/delivery/reject` | Driver rejects delivery |
| POST | `/api/delivery/location` | Driver location update |
| POST | `/api/delivery/verify-otp` | Verify delivery OTP |
| GET | `/api/delivery/track/{orderId}` | Track order (includes ETA) |
| GET | `/api/delivery/zones` | Delivery zones + fee (query: storeId, lat, lng) |
| GET | `/api/delivery/driver/{id}/pending` | Driver's pending deliveries |
| GET | `/api/delivery/driver/{id}/performance` | Driver performance metrics |
| POST | `/api/delivery/{id}/otp` | Generate/regenerate OTP |
| POST | `/api/delivery/{id}/advance` | Advance state: pickup→transit→arrived→delivered (body: status, proofType, proofUrl) |

**Inventory — 7**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/inventory` | List (query: storeId, category, search, lowStock, outOfStock, expiring) |
| POST | `/api/inventory` | Create item |
| GET | `/api/inventory/{id}` | Get item |
| PATCH | `/api/inventory/{id}` | Update/adjust/reserve/release/consume (body: operation, quantity) |
| DELETE | `/api/inventory/{id}` | Delete item |
| GET | `/api/inventory/alerts` | Alerts (query: type=lowStock\|outOfStock\|expiring) |
| GET | `/api/inventory/value` | Total value (query: byCategory=true) |

**Suppliers — 6**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/suppliers` | List (query: status, preferred, reliable, category, city, search) |
| POST | `/api/suppliers` | Create supplier |
| GET | `/api/suppliers/{id}` | Get supplier |
| PATCH | `/api/suppliers/{id}` | Update (status, preferred, performance metrics in body) |
| DELETE | `/api/suppliers/{id}` | Delete supplier |
| GET | `/api/suppliers/compare` | Compare suppliers (query: category) |

**Purchase Orders — 10**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/purchase-orders` | List (query: storeId, supplierId, status, overdue, dateFrom, dateTo) |
| POST | `/api/purchase-orders` | Create PO |
| GET | `/api/purchase-orders/{id}` | Get PO |
| PATCH | `/api/purchase-orders/{id}` | Update PO |
| DELETE | `/api/purchase-orders/{id}` | Delete PO |
| POST | `/api/purchase-orders/{id}/approve` | Approve |
| POST | `/api/purchase-orders/{id}/reject` | Reject |
| POST | `/api/purchase-orders/{id}/send` | Mark as sent to supplier |
| POST | `/api/purchase-orders/{id}/receive` | Receive (line-item confirmation, triggers inventory update) |
| POST | `/api/purchase-orders/auto-generate` | Trigger auto-generation (Agent 3 / manual) |

**Waste — 6**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/waste` | List (query: storeId, category, dateFrom, dateTo) |
| POST | `/api/waste` | Record waste |
| GET | `/api/waste/{id}` | Get waste record |
| PATCH | `/api/waste/{id}` | Update waste record |
| POST | `/api/waste/{id}/approve` | Approve waste record |
| GET | `/api/waste/stats` | Stats (query: view=cost\|trend\|top-items\|preventable, category) |

*Logistics-service subtotal: 40*

---

#### PAYMENT-SERVICE — 8

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/payments/cash` | Record cash payment |
| POST | `/api/payments/initiate` | Initiate Razorpay payment |
| POST | `/api/payments/verify` | Verify payment after completion |
| GET | `/api/payments` | List payments (query: storeId, orderId, customerId) |
| GET | `/api/payments/{id}` | Get transaction |
| POST | `/api/payments/refund` | Initiate refund |
| GET | `/api/payments/refunds` | List refunds (query: orderId, transactionId, customerId) |
| POST | `/api/payments/webhook` | Razorpay webhook |

*Payment-service subtotal: 8*

---

#### INTELLIGENCE-SERVICE — 11

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/analytics/sales` | Sales (query: period=today\|week\|month, view=breakdown\|trend\|peak-hours) |
| GET | `/api/analytics/products` | Top products |
| GET | `/api/analytics/staff` | Staff performance (query: staffId, view=leaderboard) |
| GET | `/api/analytics/staff/{id}/hours` | Working hours report |
| GET | `/api/analytics/orders` | Order metrics (avg prep time, avg value, distribution) |
| GET | `/api/analytics/drivers` | Driver status + performance metrics |
| GET | `/api/analytics/customers` | Customer behaviour analytics |
| GET | `/api/analytics/cost` | Cost analysis |
| GET | `/api/analytics/forecast` | Forecasts (query: type=sales\|demand\|churn) |
| GET | `/api/analytics/executive` | Executive summary dashboard |
| GET | `/api/analytics/benchmarking` | Store benchmarking (multi-store) |

*Intelligence-service subtotal: 11*

---

#### API GATEWAY — 1

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Aggregated health of all 5 services |

---

### Endpoint Count Summary

| Service | Endpoints |
|---------|-----------|
| core-service | 89 |
| commerce-service | 26 |
| logistics-service | 40 |
| payment-service | 8 |
| intelligence-service | 11 |
| api-gateway | 1 |
| **TOTAL** | **175** |

---

## Database Architecture

### Polyglot Persistence

**PostgreSQL** — relational, ACID, financial data
- users, user_auth_providers
- customers, customer_addresses, customer_store_memberships, customer_tags, loyalty_transactions
- orders, order_items, order_quality_checkpoints
- transactions, refunds
- delivery_trackings
- shifts, working_sessions, session_violations
- inventory_items, suppliers, supplier_categories, purchase_orders, purchase_order_items, waste_records
- notifications
- review_responses
- gdpr_consents, gdpr_data_requests, gdpr_audit_logs

**MongoDB** — flexible schema, geospatial, variable structure
- stores (delivery zones, operating hours — shapes vary per store)
- menu_items (variants, customizations, allergens — schema varies per item)
- driver_locations (GeoJSON + TTL — MongoDB's native strength)
- reviews (nested itemReviews[], sentiment — variable per review)
- campaigns (dynamic segment filters — Map varies per type)
- templates (per-channel structure varies)
- user_preferences (typePreferences Map — dynamic)
- kitchen_equipment (operational state + maintenance notes)
- customer_loyalty_history (new — split unbounded pointHistory array)
- customer_preferences (new — dietary, favorites, allergens)

**Redis** — ephemeral, sub-millisecond, cache
- `jwt:blacklist:{token}` — JWT revocation
- `session:{sessionId}` — user session
- `driver:online:{driverId}` — driver status (TTL 5min)
- `driver:location:{driverId}` — latest location (TTL 10min)
- `store:status:{storeId}` — operational status cache (TTL 1min)
- `order:status:{orderId}` — status for fast polling (TTL 30min)
- `otp:{orderId}` — delivery OTP (TTL 30min)
- `rate:limit:{userId}:{endpoint}` — rate limiting

### MongoDB Index Fixes Required

**P0 — Data Integrity (fix before anything else)**
- Drop `customers.email` global unique → add `{ storeId: 1, email: 1 }` unique
- Drop `customers.phone` global unique → add `{ storeId: 1, phone: 1 }` unique
- Add `reviews { orderId: 1, customerId: 1 }` unique (deduplication)
- Add `notifications { userId: 1 }` index
- Remove cross-store queries without storeId in OrderRepository + DeliveryTrackingRepository

**P1 — Missing Compound Indexes**
See `2026-02-19-mongodb-dba-audit.md` for full list of 61 indexes across all services.
Priority order: orders → customers → delivery_trackings → transactions → notifications

**P2 — TTL Indexes**
- `working_sessions` — 180 days after clockOutTime
- `driver_locations` — 7 days after timestamp
- `notifications` — 90 days after createdAt
- `orders` (CANCELLED only) — 1 year
- `gdpr_audit_logs` — 7 years (legal requirement)
- `rating_tokens` — immediate at expiresAt
- `customer_loyalty_history` — 3 years

### Migration Strategy
1. Stand up PostgreSQL alongside MongoDB (dual-write, PostgreSQL primary)
2. Write to both, read from PostgreSQL, MongoDB is read fallback
3. Verify consistency 1 week
4. Switch all reads to PostgreSQL for migrated collections
5. Stop MongoDB writes for migrated collections
6. Drop migrated MongoDB collections

---

## Phase Execution Plan

---

### Phase 0 — Production Blockers
*Do this before anything else. Nothing downstream works correctly until these are fixed.*

**0.1 — OrderStatus Enum**
- Reconcile into single canonical enum in `shared-models`:
  `RECEIVED, PREPARING, OVEN, BAKED, READY, DISPATCHED, OUT_FOR_DELIVERY, DELIVERED, SERVED, COMPLETED, CANCELLED`
- Delete inner enum from `Order.java`, import from shared-models
- Update all services that use either enum

**0.2 — Wire OrderEventPublisher**
- In `OrderService.java`: `@Autowired OrderEventPublisher orderEventPublisher`
- `createOrder()`: call `publishOrderCreated()` after save
- `updateOrderStatus()` + `moveToNextStage()`: call `publishOrderStatusChanged()` after each transition
- `AutoDispatchService.autoDispatch()`: publish `delivery.assigned` event
- `updateOrderStatus()` when status=DELIVERED: publish `delivery.completed` event

**0.3 — Fix masova-support Session**
- Replace `InMemorySessionService` in `core/agent.py` with Redis
- Keep last 10 conversation turns, TTL 1 hour
- Add `REDIS_URL=redis://localhost:6379/1` to `.env`
- Graceful fallback if Redis unavailable

**0.4 — MongoDB P0 Index Fixes**
- Drop global unique indexes on customers.email + customers.phone
- Add store-scoped compound unique indexes
- Add reviews deduplication index
- Add notifications.userId index

---

### Phase 1 — Backend API Reduction (471 → 175)

**1.1 — Controller Rewrites**
For each service, rewrite controllers to canonical paths:
- Remove all `/api/v1/` mappings
- Collapse all filter variants into query params
- Move `TestDataController` behind `@Profile("dev")`
- Consolidate ResponseController into ReviewController (responses as sub-resource)
- Consolidate RatingController (commerce) into OrderController
- Move all order analytics to intelligence-service
- Move staff working hours report to intelligence-service

**1.2 — Resilience4j**
- Wire `@CircuitBreaker` on all Feign client methods in all services
- Configure fallback methods for each client
- Properties: slidingWindowSize=10, failureRateThreshold=50, waitDurationInOpenState=10s

**1.3 — Internal Endpoint Guard**
- `POST /api/customers/get-or-create` — mark as internal only, not exposed via API Gateway security filter

**1.4 — Regenerate OpenAPI Specs**
- `mvn springdoc:generate` for each service
- Update `specs/` directory
- Update `test-api-full.js` endpoint counts

---

### Phase 2 — Database Migration

**2.1 — PostgreSQL Setup**
- Add PostgreSQL to `docker-compose.yml` on Dell
- Add Spring Data JPA + PostgreSQL driver to all affected services
- Create `schema.sql` with all 22 tables (see database-architecture-design.md)
- Create Flyway migration scripts (V1__initial_schema.sql)

**2.2 — Dual-Write Implementation**
- For each migrated entity: write to PostgreSQL first (transactional), then MongoDB (async, best-effort)
- New JPA repositories alongside existing Mongo repositories
- Services read from PostgreSQL for migrated entities

**2.3 — TTL + Index Migration**
- Run all P0 MongoDB index fixes (from Phase 0.4)
- Add all P1 compound indexes (61 from audit doc)
- Add all P2 TTL indexes

**2.4 — Cut Over**
- After 1 week dual-write with no discrepancies: stop Mongo writes for migrated collections
- Remove Mongo repositories for migrated entities
- Drop migrated MongoDB collections

---

### Phase 3 — Order Flow + Feature Fixes

**3.1 — Inventory Auto-Decrement**
- `OrderService.java`: on status transition to `PREPARING`, call `inventoryService.decrementStock()` for each order item
- On `CANCELLED`: call `inventoryService.restoreStock()`
- Decision: decrement on PREPARING (not order creation) to avoid decrementing immediately-cancelled orders

**3.2 — DINE_IN Restoration**
- `OrderPanel.tsx` (POS): restore DINE_IN option, show tableNumber input + guestCount when selected
- `KitchenDisplayPage.tsx`: add SERVED status column for DINE_IN orders
- `OrderManagementPage.tsx`: correct terminal status by order type:
  - DELIVERY → DELIVERED
  - TAKEAWAY → COMPLETED
  - DINE_IN → SERVED

**3.3 — Checkout Price Accuracy**
- `PaymentPage.tsx`: on DELIVERY + address entered, fetch real fee via `GET /api/delivery/zones?storeId=&lat=&lng=`
- Show estimated fee before order creation
- `cartSlice.ts`: default `deliveryFee: 0` (not hardcoded 29)
- Tax: fetch rate from `GET /api/menu/stats?storeId=` (which includes tax config) or expose dedicated tax endpoint
- After `POST /api/orders` succeeds: update displayed totals with actuals from response

**3.4 — KDS Full Revamp**
- Add READY column between BAKED and DISPATCHED/SERVED
- Summary bar (fixed top): Active Orders, Avg Wait, Longest Wait (real-time WebSocket)
- Color urgency on card left border (4px): green 0–5min, amber 5–10min, red 10+ min (pulsing @keyframes animation)
- Sound alert: base64 WAV chime on new order, mute toggle button
- Full-screen: `F` key + button → `document.requestFullscreen()`
- One-click bump button (►): 48×48px minimum, advances status
- Typography: +2px base, order number 24px bold, items 16px

**3.5 — Driver Assignment Modal**
- Replace `window.prompt` in `OrderManagementPage.tsx`
- Modal: search drivers by name, show availability, assign via `PATCH /api/orders/{id}` with `assignedDriverId`

**3.6 — Customer Delivery Rating**
- `LiveTrackingPage.tsx`: replace `console.log` with `POST /api/reviews` call
- Body: `{ orderId, entityType: DRIVER, entityId: driverId, rating, comment }`

**3.7 — OTP Proof-of-Delivery**
- On order → DISPATCHED: backend generates OTP, stores in `otp:{orderId}` Redis key (TTL 30min), sends to customer via notification
- Customer sees OTP on `LiveTrackingPage.tsx` when order status is DISPATCHED
- Driver App: before marking DELIVERED, show OTP input screen
- Backend: `POST /api/delivery/verify-otp` validates before allowing status advance to DELIVERED

---

### Phase 4 — Frontend Revamp

**4.1 — Customer Web Dark Premium Design**

New design system (customer-facing pages only, staff pages keep neumorphic):

CSS custom properties in `index.css`:
```css
:root {
  --bg: #0A0908;
  --surface: #141210;
  --surface-2: #1C1916;
  --surface-3: #242018;
  --gold: #D4A843;
  --gold-light: #E8C060;
  --red: #C62A09;
  --red-light: #E53E3E;
  --border: rgba(212,168,67,0.15);
  --border-strong: rgba(212,168,67,0.35);
  --text-1: #FDFCF8;
  --text-2: #B0A898;
  --text-3: #6C6458;
}
```

Typography: Playfair Display (headlines) + DM Sans (UI) — Google Fonts import in `index.html`

Pages to redesign:
- `HomePage.tsx` — oversized Playfair hero, circular food images, category pills, Most Popular carousel
- `MenuPage.tsx` — fixed sidebar filters, sticky search bar, dark menu cards with gold price
- `CartDrawer` — slide from right 420px, surface-2 bg, gold dividers
- `PromotionsPage.tsx` — 3-column promo grid, red discount badges
- `CustomerLoginPage.tsx` + `RegisterPage.tsx` — centered card, gold top border, Google OAuth dark button
- `CheckoutPage.tsx` — 2-column layout, section cards with gold left border
- `OrderTrackingPage.tsx` + `LiveTrackingPage.tsx` — gold timeline, dark map tiles

**4.2 — Store Selection (AddressGate)**
- `StoreSelector.tsx`: `navigator.geolocation.getCurrentPosition` on mount
- Haversine distance to each store, sort by distance, show "0.8 km away" label
- Open/closed badge from `operatingHours`
- Auto-select nearest open store if nothing saved
- Persist to `localStorage` key `masova_selected_store` + Redux `cartSlice`
- Zone-based delivery fee in Redux (not hardcoded):
  - 0–3km → ₹29 (ZONE_A)
  - 3–6km → ₹49 (ZONE_B)
  - 6–10km → ₹79 (ZONE_C)
  - >10km → out of area (block checkout)
- AddressGate blocks customer routes — manager/staff/kitchen/driver/POS routes skip it

**4.3 — Staff Login Revamp**
- `LoginPage.tsx`: remove all emojis → MUI icons
- Expand demo roles to 5: Manager, Kitchen Staff, Driver, Cashier, Assistant Manager
- Left panel: dark `#1a1a1a`, MaSoVa logo, tagline, decorative grid pattern
- Forgot password: toggle form within right panel, success message, no navigation
- Mobile: single column <768px, top banner
- Show password toggle: InputAdornment + Visibility/VisibilityOff icons
- Loading state on submit: CircularProgress + "Signing in..."

**4.4 — Manager Metrics Template**
- Create `ManagerMetricTemplate.tsx`: props: `kpis[]`, `chartComponent`, `tableComponent`, `actions[]`
- Pattern: KPI Row → Recharts chart + filter bar → data table → action buttons
- Apply to: `DashboardPage.tsx`, `ProductAnalyticsPage.tsx`, `KitchenAnalyticsPage.tsx`, `AdvancedReportsPage.tsx`
- Uses `manager-tokens.ts`, Recharts v3.2.1 (already installed)

**4.5 — Google Places Autocomplete**
- `CheckoutPage.tsx` / `PaymentPage.tsx`: Google Places Autocomplete for delivery address input
- Replace plain text input with Places Autocomplete component
- On select: auto-fill address fields + set lat/lng for delivery fee calculation

**4.6 — Voice Input in ChatWidget**
- `ChatWidget.tsx`: mic button next to send button
- Web Speech API: `SpeechRecognition` (or `webkitSpeechRecognition`), `lang: 'en-IN'`
- On result: `setInput(transcript)`
- Mic icon: normal → red pulsing animation when listening
- `speech.d.ts` TypeScript declaration
- Graceful fallback alert if browser doesn't support

**4.7 — Payment Preference Pre-selection**
- `PaymentPage.tsx`: read `customerProfile.preferences.preferredPaymentMethod` on mount
- `useEffect`: auto-select if valid (CASH/CARD/UPI) and not CASH+DELIVERY
- After successful payment: call `PATCH /api/preferences/{userId}` with `{ preferredPaymentMethod }` (fire-and-forget)

**4.8 — DeliveryManagementPage + DriverManagementPage**
- Verify both are correctly routed in `ManagerShell.tsx`
- Remove `.bak` versions once verified
- Ensure sidebar navigation links to both pages

---

### Phase 5 — Staff App (Consolidated React Native)

*Single app from `MaSoVaDriverApp` base, replacing Driver App + any separate Kitchen/Staff apps*

**5.1 — Role-Based Navigation**
- `AppNavigator.tsx`: `RoleRouter` reads `user.type` from JWT → dispatches to role navigator
- Remove driver-only login block from `LoginScreen.tsx`
- 4 navigators:
  - `DriverTabNavigator` (existing, keep)
  - `KitchenTabNavigator` (new)
  - `CashierTabNavigator` (new)
  - `ManagerTabNavigator` (new)

**5.2 — New Screens**
- `KitchenQueueScreen.tsx` — order queue, bump button, color urgency
- `OrderDetailScreen.tsx` — full order detail, advance status
- `QuickOrderScreen.tsx` (Cashier/POS) — create order, select items, cash payment
- `QuickDashboardScreen.tsx` (Manager) — KPI snapshot, recent orders, active staff

**5.3 — Shared Components**
- `NotificationBell.tsx` — unread count badge, tap opens notifications
- `ProfileHeader.tsx` — avatar, name, role badge, store name
- `StoreSelector.tsx` — shared with web (geolocation, distance)
- `StatusBadge.tsx` — colour-coded status pill

**5.4 — Driver Improvements**
- WebSocket subscription for new order assignment (replace 30s polling)
- FCM push notification for backgrounded driver assignment (device token stored per user)
- OTP input screen: before marking DELIVERED, show PIN input → `POST /api/delivery/verify-otp`
- Full route polyline via Google Directions API in `NavigationMap.tsx`
- `assignedDriverId` — single check only, remove 3 fallback field name checks

**5.5 — Design Tokens**
- Extend `driverDesignTokens.ts` with role accent colours:
  - DRIVER: `#00B14F`
  - KITCHEN_STAFF: `#FF6B35`
  - CASHIER: `#2196F3`
  - MANAGER: `#7B1FA2`

**5.6 — Conditional Permissions**
- GPS / foreground location service: DRIVER only
- Camera: DRIVER + KITCHEN_STAFF
- Push notifications: all roles

**5.7 — Customer Mobile Additions**
- `LiveTrackingPage` / `OrderTrackingScreen`: show OTP when order status is DISPATCHED
- Google Maps dark tiles, real-time driver marker via WebSocket
- `ChatScreen.tsx`: voice input (if device supports)

**5.8 — Expo EAS Build Config**
- `masova-mobile/eas.json` + `app.json`: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_AGENT_URL` for dev/preview/production
- MaSoVaDriverApp (Staff App): same EAS config pattern

---

### Phase 6 — AI Agents

**6.1 — Infrastructure**
- Install `APScheduler` in masova-support: `pip install apscheduler`
- Redis session memory for Agent 1 (existing customer support agent) — already done in Phase 0.3
- All scheduled agents use `AsyncIOScheduler` with `AsyncIOExecutor`

**6.2 — Existing Agent Enhancements (Agent 1)**
- 3 tools already built (get_loyalty_points, get_store_wait_time, cancel_order) — verify wired in agent.py
- Voice input in ChatWidget — Phase 4.6

**6.3 — Agent 2: Demand Forecasting**
- Schedule: nightly 2am via APScheduler
- Input: 90 days order history (per item, per hour, per day-of-week) from PostgreSQL
- Method: weighted moving average + day-of-week seasonality adjustment
- Output: writes to `daily_forecasts` table (PostgreSQL) — storeId, date, menuItemId, hourSlot, predictedQuantity
- Manager sees forecast on Dashboard for tomorrow
- All downstream agents (3, 6) depend on this data

**6.4 — Agent 3: Inventory Reorder**
- Schedule: every 6 hours via APScheduler
- Input: current stock levels + Agent 2 demand forecast
- Logic: if (currentStock - predictedConsumption) < minimumStock before next expected supplier delivery → draft PO
- Uses supplier performance data (lead time, reliability rating) to choose supplier
- Output: `POST /api/purchase-orders/auto-generate` — creates DRAFT purchase orders
- Manager gets notification: "3 items need reordering — approve POs"
- Manager reviews and approves — one tap

**6.5 — Agent 4: Churn Prevention**
- Schedule: daily 10am via APScheduler
- Input: customers with >3 orders in last 60 days + no order in last 14 days (PostgreSQL query)
- Output: creates campaign targeting churned customers, personalised with their top 3 ordered items + recovery offer (configurable discount %)
- Pushes campaign to campaigns system as DRAFT — manager reviews + one-click execute

**6.6 — Agent 5: Smart Review Response**
- Trigger: RabbitMQ event on new review with rating ≤ 3
- Input: review text + order details + item names + complaint keywords
- Output: draft personalised response (not a template) pushed to manager's notification feed
- Manager reviews + one-click send via `POST /api/reviews/{id}/response`

**6.7 — Agent 6: Shift Optimisation**
- Schedule: Sunday 8pm via APScheduler (for coming week)
- Input: Agent 2 forecast for next week + historical shift efficiency + staff availability flags
- Output: draft shift schedule written to shifts system as DRAFT status
- Manager reviews via `StaffSchedulingPage.tsx`, adjusts if needed, confirms

**6.8 — Agent 7: Kitchen Performance Coach**
- Schedule: nightly 11pm via APScheduler
- Input: order timestamps (receivedAt → preparingStartedAt → readyAt) per kitchen staff per dish from PostgreSQL
- Requires: Phase 3 order flow fixes complete (clean timestamps)
- Output: nightly brief pushed to manager — specific staff, specific dish, time gap vs baseline, recommendation
- Plain text notification — no UI changes needed

**6.9 — Agent 8: Dynamic Pricing Suggestions**
- Schedule: every 30 minutes during open hours via APScheduler
- Input: current kitchen load (active orders count) + order volume trend (last 30min) + time-to-close
- Logic:
  - Overloaded (>15 active orders, trending up): suggest 10–15% price increase on top 5 demand items
  - Underloaded (<3 orders in last 30min, >2hrs to close): suggest limited-time discount on slow items
- Output: notification to manager with one-tap approve/dismiss — agent NEVER changes prices automatically
- On approve: `PATCH /api/menu/{id}` updates price, reverts automatically at scheduled time

---

### Phase 7 — Deployment + DevOps

**7.1 — masova-support Dockerfile**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -m -u 1001 masova && chown -R masova:masova /app
USER masova
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"
CMD ["uvicorn", "masova_agent.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**7.2 — Per-Service .dockerignore**
- Each Java service: `target/, *.md, .git/, src/test/, *.bak`
- masova-support: `__pycache__, *.pyc, .venv, .env*, tests/`
- Root: `.git/, node_modules/, */target/, docs/, backups/, *.bak`

**7.3 — Multi-Stage Docker Builds**
- Update all 6 Java Dockerfiles to multi-stage:
  - Stage 1 (builder): `maven:3.9-eclipse-temurin-21` — build JAR
  - Stage 2 (runtime): `eclipse-temurin:21-jre-jammy` — copy JAR, non-root user, HEALTHCHECK

**7.4 — Firebase Hosting**
- `frontend/firebase.json`: hosting config, SPA rewrites, cache headers, security headers
- `frontend/.firebaserc`: `{ "projects": { "default": "masova-app" } }`

**7.5 — GitHub Actions**
- `.github/workflows/deploy.yml`:
  - Trigger: push to main
  - build-backend: matrix strategy (6 services) → Maven build → Docker push to Artifact Registry
  - deploy-backend: matrix strategy → Cloud Run deploy with service-specific memory
  - deploy-frontend: npm build → Firebase deploy
- `.github/workflows/ci.yml`:
  - Backend tests: spin up MongoDB, Redis, RabbitMQ via services → mvn test
  - Frontend tests: npm ci + vitest
  - TypeScript check: tsc --noEmit

**7.6 — GCP Production Setup**
- Cloud Run: 6 Java services + masova-support Python service
- Firebase Hosting: web frontend (SPA)
- MongoDB Atlas M0 (Mumbai ap-south-1) — free tier
- Upstash Redis (ap-south-1, TLS enabled)
- CloudAMQP Little Lemur — free RabbitMQ
- Budget alert: $10/month
- Secrets in GCP Secret Manager (JWT secret, Razorpay keys, Google OAuth client ID)
- Service account `masova-deploy` with minimal permissions
- Custom domain optional (api.masova.app, masova.app)
- `docs/deployment/GCP-SETUP.md`: step-by-step one-time setup

**7.7 — Seed Database**
- `scripts/seed-database.js`: 5 stores, 15 users (3/role), 20 customers, 50 menu items, 30 orders (all statuses), 25 payments, 20 deliveries, 15 reviews, 10 campaigns, 20 notifications
- `scripts/clear-database.js`: drops seeded collections only
- npm scripts in `package.json`: `"seed": "node scripts/seed-database.js"`, `"seed:clear": "node scripts/clear-database.js"`
- Idempotent via upsert (no duplicate errors on re-run)
- `docs/development/SEED_DATA.md`: credentials, test scenarios

**7.8 — GitHub Repo Revamp**
- `README.md`: architecture diagram, tech stack badges, local setup, deployed URLs
- Branch protection on `main`: require PR, require CI pass, no force push
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/` (bug report, feature request)
- `.github/CODEOWNERS`

---

### Phase 8 — Quality + Hardening

**8.1 — Pact Contract Tests**
- Pact files in `frontend/src/pact/` (already present)
- Write/update consumer contracts for all 175 endpoints
- Provider verification in each Spring Boot service CI job

**8.2 — Distributed Tracing**
- Add Spring Cloud Sleuth + Zipkin to all 6 Java services
- Add Zipkin to `docker-compose.yml` (port 9411)
- Trace spans visible across service boundaries for order lifecycle

**8.3 — Unit Tests**
- Fix 1374 Vitest tests (many stale after API path changes)
- Update all RTK Query mocks to new canonical paths
- Target: 90% pass rate before Phase 8 complete

**8.4 — E2E Tests (Playwright)**
- Fix/update 13 existing Playwright specs in `frontend/tests/`
- Critical flows: full checkout, order tracking, driver delivery + OTP, manager order management

**8.5 — Product Website Completion**
- `frontend/src/pages/product-site/`: finish all sections (Hero, Features, How It Works, Pricing, Screenshots, CTA)
- Wire `SupportFAB.tsx` → real `ChatWidget` (not stub)
- `ProductTourTab` interface already partially implemented — complete it

---

## Sequencing Diagram

```
Phase 0 (Production Blockers) — FIRST, BLOCKING
    │
    ├── Phase 1 (API Reduction) ─────────────────────────┐
    │       │                                             │
    │   Phase 2 (DB Migration)                           │
    │       │                                             │
    │   Phase 3 (Order Flow Fixes)                       │
    │       │                                             │
    │   Phase 4 (Frontend Revamp) ◄───────────────────── Phase 1 complete
    │       │
    │   Phase 5 (Staff App) ◄───── Phase 3 complete
    │       │
    ├── Phase 6 Agents 2-4 ◄──── Phase 1 complete (can start early)
    │       │
    │   Phase 6 Agents 5-8 ◄──── Phase 3 complete
    │       │
    └── Phase 7 (Deployment) ◄── Phases 1-6 stable
            │
        Phase 8 (Quality) ◄──── Phase 7 deployed
```

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| API count | 175 endpoints | Honest minimum with supplier mgmt + full features |
| DB strategy | Polyglot (PG + Mongo + Redis) | Right tool per data shape/consistency need |
| Staff apps | Single consolidated RN app | One codebase, role-based navigation |
| Customer app | Separate (masova-mobile) | Customers and staff never share an app |
| AI scheduling | APScheduler (Python) | Already in masova-support stack, lightweight |
| Agent pricing | Manager approves, agent never auto-changes prices | Legal + reputational safety |
| Agent PO drafting | Auto-draft, manager approves | Autonomous but human-in-the-loop |
| Delivery state | Single `advance` endpoint with status body | Cleaner for mobile, same audit trail |
| Customer design | Dark premium (gold/red/dark) | Distinct from staff neumorphic |
| Staff design | Keep neumorphic | Already built, no reason to change |
| Deployment | GCP Cloud Run + Firebase | Within $10/month, scales to zero |

---

## Files Referenced From Previous Plans

- `2026-02-19-mongodb-dba-audit.md` — full 61-index P1 list
- `2026-02-19-rabbitmq-phase0.md` — RabbitMQ setup details
- `2026-02-18-customer-web-revamp-design.md` — complete dark design spec per page
- `2026-02-23-store-selection-design.md` — AddressGate + zone pricing details
- `2026-02-22-order-flow-gaps.md` — 14 order flow issues with exact fixes
- `2026-03-02-database-architecture-design.md` — PostgreSQL schema (22 tables)
- `2026-03-02-api-reduction-design.md` — superseded by this document (175 not 125)
- `phase5-env-vars.md` — environment variable reference per service

---

*This document supersedes: `2026-03-02-master-implementation-plan.md`, `2026-03-02-api-reduction-plan.md`*
*This document is consistent with and references: `2026-03-02-database-architecture-design.md`, `2026-02-19-mongodb-dba-audit.md`, `2026-02-22-order-flow-gaps.md`, `2026-02-18-customer-web-revamp-design.md`, `2026-02-23-store-selection-design.md`*
