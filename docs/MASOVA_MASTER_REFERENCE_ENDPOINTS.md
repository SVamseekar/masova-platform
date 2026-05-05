# MaSoVa Platform — Canonical API Endpoint Reference
## Supplementary to Master Reference Parts 1–5

> **Source of truth:** `docs/plans/2026-03-03-master-implementation-plan-v2.md` — "Final 175-Endpoint Canonical API"
>
> **Phase 1 reduced the backend from 471 raw annotations to 175 canonical endpoints** by removing `/api/v1/` duplicate path mappings, collapsing per-filter endpoints into query params, and merging sub-resources into parent controllers.

---

## Endpoint Count Summary

| Service | Controllers | Canonical Endpoints |
|---------|------------|-------------------|
| core-service | 13 | **89** |
| commerce-service | 6 | **26** |
| logistics-service | 7 | **40** |
| payment-service | 4 | **8** |
| intelligence-service | 2 | **11** |
| api-gateway | — | **1** |
| **TOTAL** | **32** | **175** |

---

## CORE-SERVICE — 89 Endpoints

### Auth — 7
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/login` | Public | Email/password login → JWT |
| POST | `/api/auth/register` | Public | Customer registration |
| POST | `/api/auth/logout` | JWT | Blacklist token in Redis |
| POST | `/api/auth/refresh` | JWT (refresh) | Issue new access token |
| POST | `/api/auth/google` | Public | Google sign-in (login + register, backend detects) |
| POST | `/api/auth/change-password` | JWT | Change password |
| POST | `/api/auth/validate-pin` | Public | Validate employee PIN (kiosk) |

### Users — 11
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/users` | JWT | List users (query: type, storeId, available, search) |
| GET | `/api/users/{id}` | JWT | Get user |
| PATCH | `/api/users/{id}` | JWT | Update user (any field including status) |
| POST | `/api/users/{id}/activate` | JWT+MANAGER | Activate user |
| POST | `/api/users/{id}/deactivate` | JWT+MANAGER | Deactivate user |
| POST | `/api/users/{id}/generate-pin` | JWT+MANAGER | Generate PIN (body: bulk=true for all) |
| POST | `/api/users/kiosk` | JWT+MANAGER | Create kiosk account |
| GET | `/api/users/kiosk` | JWT+MANAGER | List kiosks (query: storeId) |
| POST | `/api/users/kiosk/{id}/regenerate` | JWT+MANAGER | Regenerate kiosk tokens |
| POST | `/api/users/kiosk/{id}/deactivate` | JWT+MANAGER | Deactivate kiosk |
| POST | `/api/users/kiosk/auto-login` | Public | Kiosk PIN-based auto-login |

### Stores — 4
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/stores` | Public | List stores (query: code, region, near=lat,lng, radius → returns withinDeliveryRadius) |
| GET | `/api/stores/{id}` | Public | Get store |
| POST | `/api/stores` | JWT+MANAGER | Create store |
| PATCH | `/api/stores/{id}` | JWT+MANAGER | Update store |

### Shifts — 10
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/shifts` | JWT | List (query: storeId, employeeId, week, date, view=coverage) |
| POST | `/api/shifts` | JWT+MANAGER | Create shift |
| POST | `/api/shifts/bulk` | JWT+MANAGER | Bulk create shifts |
| POST | `/api/shifts/copy-week` | JWT+MANAGER | Copy previous week schedule |
| GET | `/api/shifts/{id}` | JWT | Get shift |
| PATCH | `/api/shifts/{id}` | JWT+MANAGER | Update shift |
| DELETE | `/api/shifts/{id}` | JWT+MANAGER | Cancel shift |
| POST | `/api/shifts/{id}/confirm` | JWT | Confirm attendance |
| POST | `/api/shifts/{id}/start` | JWT | Start shift |
| POST | `/api/shifts/{id}/complete` | JWT | Complete shift |

### Sessions — 9
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/sessions` | JWT | Start session / clock in (body: optional location) |
| POST | `/api/sessions/end` | JWT | End session / clock out (body: optional location) |
| POST | `/api/sessions/clock-in` | Public | Clock in with PIN |
| POST | `/api/sessions/clock-out` | JWT+MANAGER | Clock out employee (manager action) |
| GET | `/api/sessions` | JWT | List (query: storeId, employeeId, active, date) |
| GET | `/api/sessions/pending` | JWT+MANAGER | Sessions pending approval |
| POST | `/api/sessions/{id}/approve` | JWT+MANAGER | Approve session |
| POST | `/api/sessions/{id}/reject` | JWT+MANAGER | Reject session |
| POST | `/api/sessions/{id}/break` | JWT | Add break record |

### Customers — 13
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/customers` | JWT | List (query: filter, email, phone, userId, tag, tier, search) |
| POST | `/api/customers` | JWT | Create customer |
| GET | `/api/customers/stats` | JWT+MANAGER | Customer statistics |
| GET | `/api/customers/{id}` | JWT | Get customer (includes loyalty + max redeemable) |
| PATCH | `/api/customers/{id}` | JWT | Update customer |
| POST | `/api/customers/{id}/activate` | JWT+MANAGER | Activate |
| POST | `/api/customers/{id}/deactivate` | JWT+MANAGER | Deactivate |
| POST | `/api/customers/{id}/loyalty` | JWT | Add/redeem points (body: type=ADD\|REDEEM, amount) |
| POST | `/api/customers/{id}/addresses` | JWT | Add address |
| PATCH | `/api/customers/{id}/addresses/{aid}` | JWT | Update address (includes isDefault flag) |
| DELETE | `/api/customers/{id}/addresses/{aid}` | JWT | Remove address |
| POST | `/api/customers/{id}/tags` | JWT+MANAGER | Add/remove tags (body: add[], remove[]) |
| DELETE | `/api/customers/{id}` | JWT+MANAGER | GDPR anonymise (soft delete) |

> ⚠️ `POST /api/customers/get-or-create` is internal service-to-service only — **blocked at API Gateway**, never accessible externally.

### Notifications — 5
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/notifications` | JWT | List (query: userId, unread, recent) |
| POST | `/api/notifications` | JWT | Send notification |
| PATCH | `/api/notifications/{id}/read` | JWT | Mark as read |
| PATCH | `/api/notifications/read-all` | JWT | Mark all as read (query: userId) |
| DELETE | `/api/notifications/{id}` | JWT | Delete |

### Preferences — 3
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/preferences/{userId}` | JWT | Get preferences |
| PATCH | `/api/preferences/{userId}` | JWT | Update (channel, deviceToken, contact, preferredPaymentMethod) |
| DELETE | `/api/preferences/{userId}` | JWT | Delete preferences |

### Campaigns — 8
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/campaigns` | JWT+MANAGER | List campaigns |
| POST | `/api/campaigns` | JWT+MANAGER | Create campaign |
| GET | `/api/campaigns/{id}` | JWT+MANAGER | Get campaign |
| PATCH | `/api/campaigns/{id}` | JWT+MANAGER | Update campaign |
| DELETE | `/api/campaigns/{id}` | JWT+MANAGER | Delete campaign |
| POST | `/api/campaigns/{id}/schedule` | JWT+MANAGER | Schedule campaign |
| POST | `/api/campaigns/{id}/execute` | JWT+MANAGER | Execute campaign |
| POST | `/api/campaigns/{id}/cancel` | JWT+MANAGER | Cancel campaign |

### Reviews — 10
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/reviews` | JWT | List (query: status, entityType, entityId, rating, flagged) |
| POST | `/api/reviews` | JWT | Create review |
| GET | `/api/reviews/stats` | JWT | Stats (query: entityType, entityId) |
| GET | `/api/reviews/public/token/{token}` | Public | Rating page via token (NOT /api/ratings/token/{token}) |
| POST | `/api/reviews/public/submit` | Public | Submit public rating |
| GET | `/api/reviews/{id}` | JWT | Get review |
| PATCH | `/api/reviews/{id}` | JWT | Update review (status, flag, approve, reject via body) |
| DELETE | `/api/reviews/{id}` | JWT+MANAGER | Delete review |
| POST | `/api/reviews/{id}/response` | JWT+MANAGER | Add/update manager response |
| GET | `/api/reviews/response-templates` | JWT+MANAGER | Get response templates |

### GDPR — 8
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/gdpr/consent` | JWT | Get consents (query: userId) |
| POST | `/api/gdpr/consent` | JWT | Grant consent |
| DELETE | `/api/gdpr/consent` | JWT | Revoke consent |
| POST | `/api/gdpr/request` | JWT | Submit GDPR request |
| GET | `/api/gdpr/request` | JWT | Get user's requests (query: userId) |
| POST | `/api/gdpr/request/{id}/process` | JWT+MANAGER | Process (body: type=access\|erasure\|portability\|rectification) |
| GET | `/api/gdpr/export/{userId}` | JWT | Export user data (SAR) |
| GET | `/api/gdpr/audit/{userId}` | JWT+MANAGER | Audit log |

### Earnings — 4 (included in core-service total)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/staff/earnings/weekly` | JWT | Weekly earnings (query: employeeId) |
| GET | `/api/staff/earnings/history` | JWT | Earnings history (query: employeeId, weeks) |
| GET | `/api/staff/pay-rates` | JWT+MANAGER | List pay rates |
| POST | `/api/staff/pay-rates` | JWT+MANAGER | Set pay rate |

> **Core-service total: 89**

---

## COMMERCE-SERVICE — 26 Endpoints

### Menu — 8
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/menu` | Public | List (query: storeId, cuisine, category, dietary, tag, search, recommended, available) |
| GET | `/api/menu/{id}` | Public | Get menu item |
| POST | `/api/menu` | JWT+MANAGER | Create menu item |
| POST | `/api/menu/bulk` | JWT+MANAGER | Bulk create menu items |
| POST | `/api/menu/copy` | JWT+MANAGER | Copy menu from another store |
| PATCH | `/api/menu/{id}` | JWT+MANAGER | Update item (includes availability toggle) |
| DELETE | `/api/menu/{id}` | JWT+MANAGER | Delete item |
| GET | `/api/menu/stats` | JWT+MANAGER | Menu statistics |

### Orders — 12
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/orders` | JWT | List (query: storeId, status, customerId, staffId, from, to, number) |
| POST | `/api/orders` | JWT | Create order |
| GET | `/api/orders/kitchen` | JWT+STAFF | Kitchen queue (KDS) |
| GET | `/api/orders/track/{id}` | Public | Public tracking — no auth required |
| GET | `/api/orders/{id}` | JWT | Get order |
| PATCH | `/api/orders/{id}` | JWT | Update mutable fields (items, priority, driver, make-table, delivery proof/OTP) |
| POST | `/api/orders/{id}/status` | JWT+STAFF | Explicit status transition (body: status, reason) |
| DELETE | `/api/orders/{id}` | JWT+MANAGER | Cancel order |
| POST | `/api/orders/{id}/next-stage` | JWT+STAFF | Advance KDS stage |
| GET | `/api/orders/{id}/checkpoints` | JWT | Get quality checkpoints |
| POST | `/api/orders/{id}/checkpoints` | JWT+STAFF | Add quality checkpoint |
| PATCH | `/api/orders/{id}/checkpoints/{name}` | JWT+STAFF | Update checkpoint |

### Equipment — 6
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/equipment` | JWT | List (query: storeId, status, needsMaintenance) |
| POST | `/api/equipment` | JWT+MANAGER | Add equipment |
| GET | `/api/equipment/{id}` | JWT | Get equipment |
| PATCH | `/api/equipment/{id}` | JWT+MANAGER | Update (status, power, temperature, resetUsage in body) |
| DELETE | `/api/equipment/{id}` | JWT+MANAGER | Remove equipment |
| POST | `/api/equipment/{id}/maintenance` | JWT+STAFF | Record maintenance |

> ⚠️ Path is `/api/equipment` — NOT `/api/kitchen-equipment` (the gateway remaps the internal controller path)

> **Commerce-service total: 26**

---

## LOGISTICS-SERVICE — 40 Endpoints

### Delivery — 11
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/delivery/dispatch` | Internal | Auto-dispatch driver to order |
| POST | `/api/delivery/accept` | JWT+DRIVER | Driver accepts delivery |
| POST | `/api/delivery/reject` | JWT+DRIVER | Driver rejects delivery |
| POST | `/api/delivery/location` | JWT+DRIVER | Driver GPS location update |
| POST | `/api/delivery/verify-otp` | JWT+DRIVER | Verify delivery OTP |
| GET | `/api/delivery/track/{orderId}` | JWT | Track order (includes ETA) |
| GET | `/api/delivery/zones` | JWT | Delivery zones + fee (query: storeId, lat, lng) |
| GET | `/api/delivery/driver/{id}/pending` | JWT+DRIVER | Driver's pending deliveries |
| GET | `/api/delivery/driver/{id}/performance` | JWT | Driver performance metrics |
| POST | `/api/delivery/{id}/otp` | JWT+DRIVER | Generate/regenerate OTP |
| POST | `/api/delivery/{id}/advance` | JWT+DRIVER | Advance state: pickup→transit→arrived→delivered |

### Inventory — 7
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/inventory` | JWT | List (query: storeId, category, search, lowStock, outOfStock, expiring) |
| POST | `/api/inventory` | JWT+MANAGER | Create inventory item |
| GET | `/api/inventory/{id}` | JWT | Get item |
| PATCH | `/api/inventory/{id}` | JWT+MANAGER | Update/adjust/reserve/release/consume (body: operation, quantity) |
| DELETE | `/api/inventory/{id}` | JWT+MANAGER | Delete item |
| GET | `/api/inventory/alerts` | JWT+MANAGER | Alerts (query: type=lowStock\|outOfStock\|expiring) |
| GET | `/api/inventory/value` | JWT+MANAGER | Total inventory value (query: byCategory=true) |

### Suppliers — 6
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/suppliers` | JWT | List (query: status, preferred, reliable, category, city, search) |
| POST | `/api/suppliers` | JWT+MANAGER | Create supplier |
| GET | `/api/suppliers/{id}` | JWT | Get supplier |
| PATCH | `/api/suppliers/{id}` | JWT+MANAGER | Update (status, preferred, performance metrics) |
| DELETE | `/api/suppliers/{id}` | JWT+MANAGER | Delete supplier |
| GET | `/api/suppliers/compare` | JWT+MANAGER | Compare suppliers (query: category) |

### Purchase Orders — 10
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/purchase-orders` | JWT | List (query: storeId, supplierId, status, overdue, dateFrom, dateTo) |
| POST | `/api/purchase-orders` | JWT+MANAGER | Create PO |
| GET | `/api/purchase-orders/{id}` | JWT | Get PO |
| PATCH | `/api/purchase-orders/{id}` | JWT+MANAGER | Update PO |
| DELETE | `/api/purchase-orders/{id}` | JWT+MANAGER | Delete PO |
| POST | `/api/purchase-orders/{id}/approve` | JWT+MANAGER | Approve PO |
| POST | `/api/purchase-orders/{id}/reject` | JWT+MANAGER | Reject PO |
| POST | `/api/purchase-orders/{id}/send` | JWT+MANAGER | Mark as sent to supplier |
| POST | `/api/purchase-orders/{id}/receive` | JWT+MANAGER | Receive goods (triggers inventory update) |
| POST | `/api/purchase-orders/auto-generate` | Internal | Auto-generate POs (Agent 3 / manual trigger) |

### Waste — 6
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/waste` | JWT | List (query: storeId, category, dateFrom, dateTo) |
| POST | `/api/waste` | JWT+STAFF | Record waste |
| GET | `/api/waste/{id}` | JWT | Get waste record |
| PATCH | `/api/waste/{id}` | JWT+MANAGER | Update waste record |
| POST | `/api/waste/{id}/approve` | JWT+MANAGER | Approve waste record |
| GET | `/api/waste/stats` | JWT+MANAGER | Stats (query: view=cost\|trend\|top-items\|preventable, category) |

> **Logistics-service total: 40**

---

## PAYMENT-SERVICE — 8 Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/payments/cash` | JWT+CASHIER | Record cash payment (no gateway) |
| POST | `/api/payments/initiate` | JWT | Initiate Razorpay/Stripe payment → returns gateway order |
| POST | `/api/payments/verify` | JWT | Verify payment after gateway completion |
| GET | `/api/payments` | JWT | List payments (query: storeId, orderId, customerId) |
| GET | `/api/payments/{id}` | JWT | Get transaction |
| POST | `/api/payments/refund` | JWT | Initiate refund |
| GET | `/api/payments/refunds` | JWT | List refunds (query: orderId, transactionId, customerId) |
| POST | `/api/payments/webhook` | Public (signature-verified) | Razorpay + Stripe webhook receiver |

> **Payment-service total: 8**

---

## INTELLIGENCE-SERVICE — 11 Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/analytics/sales` | JWT+MANAGER | Sales (query: period=today\|week\|month, view=breakdown\|trend\|peak-hours) |
| GET | `/api/analytics/products` | JWT+MANAGER | Top products |
| GET | `/api/analytics/staff` | JWT+MANAGER | Staff performance (query: staffId, view=leaderboard) |
| GET | `/api/analytics/staff/{id}/hours` | JWT+MANAGER | Working hours report |
| GET | `/api/analytics/orders` | JWT+MANAGER | Order metrics (avg prep time, avg value, distribution) |
| GET | `/api/analytics/drivers` | JWT+MANAGER | Driver status + performance metrics |
| GET | `/api/analytics/customers` | JWT+MANAGER | Customer behaviour analytics |
| GET | `/api/analytics/cost` | JWT+MANAGER | Cost analysis |
| GET | `/api/analytics/forecast` | JWT+MANAGER | Forecasts (query: type=sales\|demand\|churn) |
| GET | `/api/analytics/executive` | JWT+MANAGER | Executive summary dashboard |
| GET | `/api/analytics/benchmarking` | JWT+MANAGER | Store benchmarking (multi-store comparison) |

> **Intelligence-service total: 11**

---

## API GATEWAY — 1 Endpoint

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | Public | Aggregated health of all 5 services |

---

## Canonical Path Rules

These corrections apply everywhere — frontend, mobile apps, tests, Feign clients:

| Wrong | Correct | Notes |
|-------|---------|-------|
| `/api/v1/orders/...` | `/api/orders/...` | No v1 prefix on any path |
| `/api/v1/auth/...` | `/api/auth/...` | |
| `/api/kitchen-equipment` | `/api/equipment` | Gateway remaps internally |
| `/api/ratings/token/{token}` | `/api/reviews/public/token/{token}` | Reviews, not ratings |
| `/api/sessions/start` | `/api/sessions` (POST) | Canonical session start |
| `/api/sessions/current/end` | `/api/sessions/end` (POST) | Canonical session end |
| `/api/customers/get-or-create` | Blocked at gateway | Internal only |
| `/api/analytics/bi/...` | `/api/analytics/...` | BIController merged into AnalyticsController |
| `/api/bi/...` | `/api/analytics/...` | Same — no separate /api/bi prefix |

---

## Per-Service Controller List

### Core-Service (13 controllers)
| Controller | Endpoints | Path prefix |
|-----------|-----------|-------------|
| UserController | Auth(7) + Users(11) = 18 | `/api/auth`, `/api/users` |
| StoreController | 4 | `/api/stores` |
| ShiftController | 10 | `/api/shifts` |
| WorkingSessionController | 9 | `/api/sessions` |
| CustomerController | 13 | `/api/customers` |
| NotificationController | 5 | `/api/notifications` |
| UserPreferencesController | 3 | `/api/preferences` |
| CampaignController | 8 | `/api/campaigns` |
| ReviewController | 10 | `/api/reviews` |
| GdprController | 8 | `/api/gdpr` |
| EarningsController | 4 | `/api/staff/earnings`, `/api/staff/pay-rates` |
| SystemInfoController | 1 | `/api/health` |
| TestDataController | (dev only — not counted) | `/api/test-data` |

### Commerce-Service (6 controllers)
| Controller | Endpoints | Path prefix |
|-----------|-----------|-------------|
| MenuController | 8 | `/api/menu` |
| OrderController | 12 | `/api/orders` |
| KitchenEquipmentController | 6 | `/api/equipment` (remapped from `/api/kitchen-equipment`) |
| RatingController | (merged into core ReviewController) | — |
| TipController | (internal — not in 175 canonical) | `/api/orders/{id}/tip` |
| StaffTipController | (internal) | `/api/staff/tips` |

### Logistics-Service (7 controllers → merged to 5)
| Controller | Endpoints | Path prefix |
|-----------|-----------|-------------|
| DeliveryController (merged from Dispatch+Tracking+Performance) | 11 | `/api/delivery` |
| InventoryController | 7 | `/api/inventory` |
| SupplierController | 6 | `/api/suppliers` |
| PurchaseOrderController | 10 | `/api/purchase-orders` |
| WasteController | 6 | `/api/waste` |

### Payment-Service (4 controllers)
| Controller | Endpoints | Path prefix |
|-----------|-----------|-------------|
| PaymentController | 5 | `/api/payments` |
| RefundController | 2 | `/api/payments/refund`, `/api/payments/refunds` |
| WebhookController | 1 | `/api/payments/webhook` |
| StripeWebhookController | (merged into WebhookController) | — |

### Intelligence-Service (2 controllers → merged to 1)
| Controller | Endpoints | Path prefix |
|-----------|-----------|-------------|
| AnalyticsController (merged from BIController) | 11 | `/api/analytics` |

---

*Generated: 2026-05-05*
*Source: `docs/plans/2026-03-03-master-implementation-plan-v2.md` — "Final 175-Endpoint Canonical API" section*
