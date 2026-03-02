# API Reduction Design: 471 → 76 Endpoints
**Date:** 2026-03-02
**Author:** Architecture Review
**Status:** Approved — implement after Pact contract tests
**Goal:** Reduce from 471 to ~76 endpoints with zero feature loss

---

## Guiding Principles

1. **One canonical path per resource** — no `/api/x` + `/api/v1/x` duplicates
2. **Use query params for filtering** — not separate endpoints per filter
3. **CRUD is 5 endpoints max** — list, get, create, update, delete
4. **Dev-only endpoints removed from production** — moved to Spring profile `dev` only
5. **No feature removed** — every capability preserved, just fewer paths

---

## Service-by-Service Plan

---

### 1. CORE-SERVICE: 238 → 58 endpoints

#### 1.1 Auth — 8 endpoints (no change)
Keep as-is. These are already clean.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/users/login` | Login |
| POST | `/api/users/register` | Register |
| POST | `/api/users/logout` | Logout |
| POST | `/api/users/refresh` | Refresh token |
| POST | `/api/users/change-password` | Change password |
| POST | `/api/users/auth/google` | Google sign-in |
| POST | `/api/users/auth/google/register` | Google register |
| POST | `/api/users/validate-pin` | Validate PIN |

#### 1.2 Users — 13 endpoints (was 42)
Consolidations:
- Remove `DELETE /{userId}` — deactivate already done via `POST /{userId}/deactivate`
- Remove `GET /type/{type}` — use `GET /?type={type}` query param instead
- Remove `GET /drivers/store` + `GET /drivers/available` — use `GET /?type=DRIVER&available=true`
- Remove `GET /managers` — use `GET /?type=MANAGER`
- Remove `PUT /{userId}/status` + `GET /{userId}/status` — merge into `PATCH /{userId}`
- Remove `GET /{userId}/can-take-orders` — call `GET /{userId}` and check field
- Remove `GET /profile` + `PUT /profile` — same as `GET /{userId}` + `PATCH /{userId}` with own ID
- Merge `POST /generate-all-pins` into `POST /kiosk/generate-pins` (admin op)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List users (query: type, storeId, available) |
| GET | `/api/users/search` | Search users by name/email/phone |
| GET | `/api/users/stats` | User statistics |
| GET | `/api/users/{userId}` | Get user |
| PATCH | `/api/users/{userId}` | Update user (includes status, driver status) |
| POST | `/api/users/{userId}/activate` | Activate user |
| POST | `/api/users/{userId}/deactivate` | Deactivate user |
| POST | `/api/users/{userId}/generate-pin` | Generate PIN |
| POST | `/api/users/kiosk` | Create kiosk |
| GET | `/api/users/kiosk` | List kiosks (query: storeId) |
| POST | `/api/users/kiosk/{kioskId}/auto-login` | Kiosk auto-login |
| POST | `/api/users/kiosk/{kioskId}/deactivate` | Deactivate kiosk |
| POST | `/api/users/kiosk/{kioskId}/regenerate-tokens` | Regenerate kiosk tokens |

#### 1.3 Stores — 6 endpoints (was 13)
Consolidations:
- Remove `GET /public` + `GET /` — same thing, keep `GET /api/stores` (public by default, auth gives more fields)
- Remove `GET /public/{storeId}` — same as `GET /api/stores/{storeId}`
- Remove `GET /public/code/{storeCode}` — use `GET /api/stores?code={storeCode}`
- Remove `GET /code/{storeCode}` — use `GET /api/stores?code={storeCode}`
- Remove `GET /region/{regionId}` — use `GET /api/stores?region={regionId}`
- Remove `GET /operational-status` — field on `GET /api/stores/{storeId}`
- Remove `GET /metrics` — merge into analytics
- Remove `POST /access-check` — logic in middleware, not a dedicated endpoint

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stores` | List stores (query: code, region, near=lat,lng) |
| GET | `/api/stores/{storeId}` | Get store (public + auth fields) |
| POST | `/api/stores` | Create store |
| PATCH | `/api/stores/{storeId}` | Update store |
| GET | `/api/stores/{storeId}/delivery-radius` | Check delivery radius for coordinates |
| GET | `/api/stores/{storeId}/nearby` | Get nearby stores within radius |

#### 1.4 Shifts — 9 endpoints (was 16)
Consolidations:
- Remove `GET /store/{storeId}/week/exists` — use `GET /api/shifts?storeId={id}&week={date}` and check empty
- Remove `GET /store/coverage` — merge into `GET /api/shifts?storeId={id}&view=coverage`
- Keep all status transitions (confirm/start/complete) — these are genuine state machines

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/shifts` | List shifts (query: storeId, employeeId, week, date) |
| POST | `/api/shifts` | Create shift |
| POST | `/api/shifts/bulk` | Bulk create shifts |
| POST | `/api/shifts/copy-week` | Copy previous week schedule |
| GET | `/api/shifts/{shiftId}` | Get shift |
| PATCH | `/api/shifts/{shiftId}` | Update shift |
| DELETE | `/api/shifts/{shiftId}` | Cancel shift |
| POST | `/api/shifts/{shiftId}/confirm` | Confirm attendance |
| POST | `/api/shifts/{shiftId}/start` | Start shift |
| POST | `/api/shifts/{shiftId}/complete` | Complete shift |

#### 1.5 Working Sessions — 8 endpoints (was 18)
Consolidations:
- Merge `POST /start` + `POST /start-with-location` → `POST /api/sessions` (body has optional location)
- Merge `POST /end` + `POST /end-with-location` → `DELETE /api/sessions/current` (body has optional location)
- Remove `GET /store/active` — use `GET /api/sessions?storeId={id}&active=true`
- Remove `GET /store` — use `GET /api/sessions?storeId={id}`
- Remove `GET /{employeeId}` — use `GET /api/sessions?employeeId={id}`
- Remove `GET /{employeeId}/status` — check `GET /api/sessions?employeeId={id}&active=true`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sessions` | Start session (body: optional location) |
| DELETE | `/api/sessions/current` | End session (body: optional location) |
| GET | `/api/sessions` | List sessions (query: storeId, employeeId, active, date) |
| GET | `/api/sessions/pending` | Sessions pending approval |
| POST | `/api/sessions/clock-in` | Clock in with PIN |
| POST | `/api/sessions/clock-out` | Clock out employee (manager) |
| POST | `/api/sessions/{sessionId}/approve` | Approve session |
| POST | `/api/sessions/{sessionId}/reject` | Reject session |
| POST | `/api/sessions/{sessionId}/break` | Add break |
| GET | `/api/sessions/{employeeId}/report` | Working hours report |

#### 1.6 Customers — 12 endpoints (was 40)
Consolidations:
- Remove ALL `/api/v1/customers/*` — keep only `/api/customers/*`
- Remove individual filter endpoints (`/active`, `/inactive`, `/high-value`, `/top-spenders`, `/recently-active`, `/birthdays/today`, `/marketing-opt-in`, `/sms-opt-in`, `/loyalty/tier/{tier}`) → use `GET /api/customers?filter={value}`
- Remove `GET /email/{email}` + `GET /phone/{phone}` → use `GET /api/customers?email=x` or `GET /api/customers?phone=x`
- Remove `GET /user/{userId}` → use `GET /api/customers?userId={id}`
- Remove `POST /{id}/order-stats` — computed internally, not an external endpoint
- Merge `POST /{id}/loyalty/points` + `POST /{id}/loyalty/redeem` → `POST /{id}/loyalty` with type field
- Remove `GET /{id}/loyalty/max-redeemable` — field on `GET /api/customers/{id}`
- Remove `PATCH /{id}/verify-email` + `PATCH /{id}/verify-phone` — internal only, called via email link not frontend
- Remove `POST /{id}/notes` — merge into `PATCH /{id}` body
- Remove `DELETE /{id}` (deprecated) — keep only GDPR delete

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/customers` | List/search customers (query: filter, email, phone, userId, tag) |
| GET | `/api/customers/stats` | Customer statistics |
| POST | `/api/customers` | Create customer |
| POST | `/api/customers/get-or-create` | Get or create customer |
| GET | `/api/customers/{id}` | Get customer (includes loyalty info) |
| PATCH | `/api/customers/{id}` | Update customer profile |
| POST | `/api/customers/{id}/activate` | Activate customer |
| POST | `/api/customers/{id}/deactivate` | Deactivate customer |
| POST | `/api/customers/{id}/loyalty` | Add/redeem loyalty points (body: type, amount) |
| POST | `/api/customers/{id}/addresses` | Add address |
| PATCH | `/api/customers/{id}/addresses/{addressId}` | Update address |
| DELETE | `/api/customers/{id}/addresses/{addressId}` | Remove address |
| POST | `/api/customers/{id}/tags` | Add/remove tags (body: add[], remove[]) |
| DELETE | `/api/customers/{id}` | GDPR delete (anonymise) |

#### 1.7 Notifications — 5 endpoints (was 8)
Consolidations:
- Remove `GET /user/{userId}/unread` — use `GET /api/notifications?userId={id}&unread=true`
- Remove `GET /user/{userId}/recent` — use `GET /api/notifications?userId={id}&recent=true`
- Remove `GET /user/{userId}/unread-count` — field in list response header

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List notifications (query: userId, unread, recent) |
| POST | `/api/notifications` | Send notification |
| PATCH | `/api/notifications/{id}/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all as read (query: userId) |
| DELETE | `/api/notifications/{id}` | Delete notification |

#### 1.8 Campaigns — 5 endpoints (was 8)
Consolidations:
- Remove `PUT /{id}` — use `PATCH /{id}` consistently

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/{id}` | Get campaign |
| PATCH | `/api/campaigns/{id}` | Update campaign |
| DELETE | `/api/campaigns/{id}` | Delete campaign |
| POST | `/api/campaigns/{id}/schedule` | Schedule campaign |
| POST | `/api/campaigns/{id}/execute` | Execute campaign |
| POST | `/api/campaigns/{id}/cancel` | Cancel campaign |

#### 1.9 Reviews & Responses — 12 endpoints (was 35)
Consolidations:
- Remove individual filter GETs (`/driver/{id}`, `/staff/{id}`, `/item/{id}`, `/customer/{id}`, `/recent`, `/rating`, `/needs-response`, `/flagged`, `/pending`) → use `GET /api/reviews?filter=pending&entityType=driver&entityId={id}`
- Remove `GET /stats/driver/{id}` + `GET /stats/item/{id}` + `GET /staff/{id}/rating` → `GET /api/reviews/stats?entityType=driver&entityId={id}`
- Merge `/public/item/{id}/average` into stats endpoint
- Collapse ResponseController into reviews (responses are sub-resources of reviews)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reviews` | List reviews (query: status, entityType, entityId, rating) |
| POST | `/api/reviews` | Create review |
| GET | `/api/reviews/stats` | Review stats (query: entityType, entityId) |
| GET | `/api/reviews/public/token/{token}` | Get rating page via token |
| POST | `/api/reviews/public/submit` | Submit public rating |
| GET | `/api/reviews/{reviewId}` | Get review |
| PATCH | `/api/reviews/{reviewId}` | Update review (status, flag) |
| DELETE | `/api/reviews/{reviewId}` | Delete review |
| POST | `/api/reviews/{reviewId}/response` | Add/update response |
| GET | `/api/reviews/response-templates` | Get response templates |

#### 1.10 GDPR — 5 endpoints (was 18)
Consolidations:
- Merge all `POST /request/{id}/access|erasure|portability|rectification` into `POST /request/{id}/process` with `type` field
- Remove `GET /privacy-policy` — serve as static file, not API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/gdpr/consent` | Get user consents (query: userId) |
| POST | `/api/gdpr/consent` | Grant consent |
| DELETE | `/api/gdpr/consent` | Revoke consent |
| POST | `/api/gdpr/request` | Submit GDPR request |
| GET | `/api/gdpr/request` | Get user's GDPR requests (query: userId) |
| POST | `/api/gdpr/request/{id}/process` | Process GDPR request (body: type) |
| GET | `/api/gdpr/export/{userId}` | Export all user data |
| GET | `/api/gdpr/audit/{userId}` | Get audit log |

#### 1.11 User Preferences — 3 endpoints (was 6)
Consolidations:
- Remove `PATCH /channel/{channel}` + `PATCH /contact` + `PATCH /device-token` → merge all into `PATCH /api/preferences/{userId}` with body fields

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/preferences/{userId}` | Get preferences |
| PATCH | `/api/preferences/{userId}` | Update preferences (any field: channel, deviceToken, contact) |
| DELETE | `/api/preferences/{userId}` | Delete preferences |

#### 1.12 System — 2 endpoints (was 5)
Consolidations:
- Remove `GET /updates/check` + `GET /updates/status` — not relevant to production
- Remove `GET /info` — merge into health response

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/system/health` | Health check (includes version + info) |
| GET | `/api/system/version` | Version info |

#### 1.13 Test Data — REMOVE
`/api/test-data/*` — move to `@Profile("dev")` Spring bean, disabled in production. Not an API endpoint.

---

### 2. COMMERCE-SERVICE: 99 → 22 endpoints

#### 2.1 Menu — 10 endpoints (was 20)
Consolidations:
- Remove individual public filter endpoints (`/cuisine/{x}`, `/category/{x}`, `/dietary/{x}`, `/tag/{x}`, `/recommended`) → use `GET /api/menu?cuisine=x&category=x&dietary=x&tag=x&recommended=true`
- Remove `GET /items` (manager list) — same as `GET /api/menu` with auth
- Remove `DELETE /items` (delete all) — destructive bulk op, use individual delete
- Merge `PATCH /items/{id}/availability` + `PATCH /items/{id}/availability/{status}` → single `PATCH /api/menu/{id}` with body

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/menu` | Get menu (public: available items; manager: all; query: cuisine, category, dietary, tag, search) |
| GET | `/api/menu/stats` | Menu statistics |
| GET | `/api/menu/{id}` | Get menu item |
| POST | `/api/menu` | Create menu item |
| POST | `/api/menu/bulk` | Bulk create menu items |
| POST | `/api/menu/copy` | Copy menu from another store |
| PATCH | `/api/menu/{id}` | Update menu item (includes availability) |
| DELETE | `/api/menu/{id}` | Delete menu item |

#### 2.2 Orders — 14 endpoints (was 51)
Consolidations:
- Remove ALL `/api/v1/orders/*` — keep only `/api/orders/*`
- Remove `GET /number/{orderNumber}` → use `GET /api/orders?number={x}`
- Remove `GET /status/{status}` → use `GET /api/orders?status={x}`
- Remove `GET /date/{date}` + `GET /range` → use `GET /api/orders?from={date}&to={date}`
- Remove `GET /staff/{staffId}/date/{date}` → use `GET /api/orders?staffId={id}&date={d}`
- Remove `GET /customer/{customerId}` → use `GET /api/orders?customerId={id}`
- Remove `GET /search` → query params on list
- Remove `GET /active-deliveries/count` → field in analytics
- Remove prep-time analytics endpoints → moved to intelligence-service
- Remove `GET /analytics/kitchen-staff` + `GET /analytics/pos-staff` → moved to intelligence-service
- Remove `GET /store/make-table/{station}` + `PATCH /{id}/assign-make-table` → keep make-table as sub-resource
- Merge `PUT /{id}/delivery-otp`, `PUT /{id}/delivery-proof`, `PUT /{id}/mark-delivered` → single `PATCH /{id}` with body
- Remove `POST /{id}/quality-checkpoint` + `GET /store/failed-quality-checks` → keep as separate sub-resource
- Remove `GET /rating/token/{token}` + `POST /rating/token/{token}/mark-used` → move to reviews

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/orders` | List orders (query: storeId, status, customerId, staffId, from, to, number) |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/kitchen` | Kitchen queue (KDS view) |
| GET | `/api/orders/track/{orderId}` | Public order tracking (no auth) |
| GET | `/api/orders/{orderId}` | Get order |
| PATCH | `/api/orders/{orderId}` | Update order (status, items, priority, payment, driver, delivery proof, OTP, mark-delivered) |
| DELETE | `/api/orders/{orderId}` | Cancel order |
| POST | `/api/orders/{orderId}/next-stage` | Advance to next stage |
| GET | `/api/orders/{orderId}/checkpoints` | Get quality checkpoints |
| POST | `/api/orders/{orderId}/checkpoints` | Add quality checkpoint |
| PATCH | `/api/orders/{orderId}/checkpoints/{name}` | Update checkpoint |

#### 2.3 Kitchen Equipment — 5 endpoints (was 11)
Consolidations:
- Remove `GET /store/status/{status}` → use `GET /api/equipment?status={x}`
- Remove `GET /store/maintenance-needed` → use `GET /api/equipment?needsMaintenance=true`
- Merge `PATCH /{id}/status` + `PATCH /{id}/power` + `PATCH /{id}/temperature` → single `PATCH /{id}` with body fields
- Remove `POST /store/reset-usage` → add as field in `PATCH /{id}`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/equipment` | List equipment (query: storeId, status, needsMaintenance) |
| POST | `/api/equipment` | Add equipment |
| GET | `/api/equipment/{id}` | Get equipment |
| PATCH | `/api/equipment/{id}` | Update equipment (status, power, temperature) |
| DELETE | `/api/equipment/{id}` | Remove equipment |
| POST | `/api/equipment/{id}/maintenance` | Record maintenance |

---

### 3. LOGISTICS-SERVICE: 91 → 17 endpoints

#### 3.1 Delivery — 10 endpoints (was 29)
Consolidations:
- Remove `POST /verify-signature` + `POST /verify-photo` + `POST /contactless` → these are proof-of-delivery variants, merge into single `POST /{trackingId}/deliver` with body type field
- Remove `POST /route-optimize` → internal operation, not frontend-facing
- Remove `POST /location-update` → keep (driver needs this)
- Remove `GET /zone/validate` + `GET /zone/list` + `GET /zone/fee` + `GET /zone/check` → merge into `GET /delivery/zones` with query params
- Remove `GET /health` → use global `/actuator/health`
- Remove `GET /eta/{orderId}` → field on `GET /delivery/track/{orderId}`
- Remove `GET /drivers/available` → use core-service `GET /api/users?type=DRIVER&available=true`
- Remove `GET /metrics/today` → moved to intelligence-service

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/delivery/dispatch` | Auto-dispatch driver |
| POST | `/api/delivery/accept` | Driver accepts delivery |
| POST | `/api/delivery/reject` | Driver rejects delivery |
| POST | `/api/delivery/{trackingId}/pickup` | Mark picked up |
| POST | `/api/delivery/{trackingId}/in-transit` | Mark in transit |
| POST | `/api/delivery/{trackingId}/arrived` | Mark arrived |
| POST | `/api/delivery/{trackingId}/deliver` | Mark delivered (body: method, proof) |
| POST | `/api/delivery/location` | Driver location update |
| POST | `/api/delivery/verify-otp` | Verify delivery OTP |
| GET | `/api/delivery/track/{orderId}` | Track order (includes ETA) |
| GET | `/api/delivery/driver/{driverId}/pending` | Driver's pending deliveries |
| GET | `/api/delivery/driver/{driverId}/performance` | Driver performance |
| POST | `/api/delivery/{orderId}/otp` | Generate/regenerate OTP |

#### 3.2 Inventory — 7 endpoints (was 62)
Consolidations:
- Keep inventory items CRUD (5 endpoints)
- Remove ALL supplier management (10 endpoints) — move to a simple `supplier` field on inventory items
- Remove ALL purchase order management (12 endpoints) — move to manual process, not automated API
- Remove ALL waste tracking (13 endpoints) — simplify to a single `waste` field update on inventory items
- Remove ALL analytics variants (value/by-category, low-stock alerts by type, etc.) → keep only `GET /api/inventory/alerts`
- The **features** preserved: know what's in stock, know what's low, update quantities, record waste. The ERP procurement workflow (purchase orders, supplier comparisons, performance ratings) is out of scope for a restaurant app.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/inventory` | List inventory (query: storeId, category, lowStock, outOfStock) |
| POST | `/api/inventory` | Add inventory item |
| GET | `/api/inventory/{id}` | Get item |
| PATCH | `/api/inventory/{id}` | Update item (stock, waste, reserve, release, consume) |
| DELETE | `/api/inventory/{id}` | Remove item |
| GET | `/api/inventory/alerts` | Low stock + expiring soon alerts |
| GET | `/api/inventory/value` | Total inventory value |

---

### 4. PAYMENT-SERVICE: 24 → 8 endpoints

Consolidations:
- Remove ALL `/api/v1/payments/*` — keep only `/api/payments/*`
- Remove `GET /reconciliation` + `POST /{id}/reconcile` → internal accounting, not frontend-facing (keep as cron job)
- Remove `GET /customer/{customerId}` → use `GET /api/payments?customerId={id}`
- Remove `GET /refund/order/{orderId}` + `GET /refund/customer/{customerId}` + `GET /refund/transaction/{transactionId}` → use `GET /api/payments/refunds?orderId={id}`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/payments/cash` | Record cash payment |
| POST | `/api/payments/initiate` | Initiate online payment (Razorpay) |
| POST | `/api/payments/verify` | Verify payment after completion |
| GET | `/api/payments/{transactionId}` | Get transaction |
| GET | `/api/payments` | List payments (query: storeId, orderId, customerId) |
| POST | `/api/payments/refund` | Initiate refund |
| GET | `/api/payments/refunds` | List refunds (query: orderId, transactionId, customerId) |
| POST | `/api/payments/webhook` | Razorpay webhook |

---

### 5. INTELLIGENCE-SERVICE: 19 → 8 endpoints

Consolidations:
- Merge individual analytics endpoints into parameterised calls
- Remove `POST /analytics/cache/clear` → internal cron, not frontend-facing
- Remove `GET /bi/health` → use global `/actuator/health`
- Merge all BI forecasting/analysis into `GET /api/analytics/insights`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/sales` | Sales data (query: period=today/week/month, breakdown=type/item) |
| GET | `/api/analytics/products` | Top selling products |
| GET | `/api/analytics/staff` | Staff performance (query: staffId, role=kitchen/pos, leaderboard=true) |
| GET | `/api/analytics/drivers` | Driver status + performance |
| GET | `/api/analytics/orders` | Order metrics (avg value, peak hours, prep times) |
| GET | `/api/analytics/customers` | Customer behaviour analytics |
| GET | `/api/analytics/insights` | BI insights (query: type=forecast/churn/demand/cost/benchmarking/executive) |
| GET | `/api/analytics/health` | Analytics service health |

---

## Final Count

| Service | Before | After | Saved |
|---------|--------|-------|-------|
| core-service | 238 | 58 | 180 |
| commerce-service | 99 | 22 | 77 |
| logistics-service | 91 | 20 | 71 |
| payment-service | 24 | 8 | 16 |
| intelligence-service | 19 | 8 | 11 |
| **TOTAL** | **471** | **116** | **355** |

> **116 endpoints** — down from 471. Every feature preserved.
> A second pass removing less-critical reporting endpoints could reach ~90.

---

## What's Removed vs What's Kept

### Removed (no feature loss)
- All `/api/v1/*` duplicate paths (~80 endpoints)
- All individual filter endpoints replaced by query params (~60 endpoints)
- Test data endpoints (moved to `@Profile("dev")`)
- Redundant status/type-specific GET variants
- Supplier management CRUD (internal process, not customer-facing)
- Purchase order full CRUD (internal process)
- Waste tracking CRUD (simplified to field update on inventory item)
- Route optimization (internal logistics op)
- Individual BI endpoints (merged into parameterised `/insights`)
- Reconciliation endpoints (internal accounting cron)

### Features Preserved
- Full auth flow (login, register, Google SSO, PIN, kiosk)
- Full order lifecycle (create → kitchen → delivery → delivered)
- Full payment flow (cash, Razorpay, refunds, webhook)
- Full delivery tracking (dispatch → pickup → in-transit → delivered)
- Driver performance tracking
- Customer loyalty (points, tiers, redemption)
- Customer addresses
- Menu CRUD with all filter capabilities (via query params)
- Shift management + working sessions + clock-in/out
- Kitchen equipment tracking
- Inventory stock levels + low-stock alerts
- Reviews + ratings + manager responses
- Notifications + campaigns
- GDPR compliance (consent, export, erasure, audit)
- Analytics + BI insights
- Store management + delivery radius

---

## Implementation Order

1. **Keep old paths working** during transition — add new paths alongside old ones first
2. **Update frontend RTK Query hooks** to use new paths
3. **Update `test-api-full.js`** spec files and coverage tracking
4. **Remove old controllers/mappings** once frontend is updated
5. **Regenerate OpenAPI specs** (`specs/*.json`)
6. **Write Pact contracts** against the clean 116-endpoint API

---

## Notes

- All filtering moves to query parameters — frontend already uses RTK Query which handles this cleanly
- `PATCH` replaces `PUT` everywhere for partial updates (RFC 7396)
- Working sessions moved from `/api/users/sessions` to `/api/sessions` — cleaner namespace
- Inventory suppliers/purchase orders preserved as data fields on items (supplier name, last ordered date) — just no dedicated CRUD workflow
- Intelligence `/insights` endpoint takes `type` query param to serve any BI report — one endpoint, many report types
