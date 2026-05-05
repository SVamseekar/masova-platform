# MaSoVa Platform — Canonical API Endpoint Reference
## Reflects live code on `main` as of 2026-05-05

> **Source of truth:** Derived directly from controller source files on `main`.
> Verified via `grep` of `@*Mapping` annotations across all 5 services.

---

## Endpoint Count Summary (Live Code)

| Service | Controllers | Endpoints |
|---------|------------|-----------|
| core-service | 15 | **105** |
| commerce-service | 6 | **31** |
| payment-service | 4 | **12** |
| logistics-service | 5 | **42** |
| intelligence-service | 2 | **4** |
| **TOTAL** | **32** | **194** |

> **Note:** Phase 1 plan targeted 175. Live code has 194 — the difference is from
> `AggregatorController` (Global-6, +2), `SystemInfoController` (+5), `RatingController` (+1),
> GDPR anonymise endpoints per service (+3), and minor additions. All intentional.

---

## CORE-SERVICE — 105 Endpoints, 15 Controllers

### AuthController — 7 (`/api/auth`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/logout` | JWT |
| POST | `/api/auth/refresh` | JWT (refresh) |
| POST | `/api/auth/google` | Public |
| POST | `/api/auth/change-password` | JWT |
| POST | `/api/auth/validate-pin` | Public |

### UserController — 14 (`/api/users`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/users` | JWT |
| GET | `/api/users/{userId}` | JWT |
| PUT | `/api/users/{userId}` | JWT |
| GET | `/api/users/{userId}/status` | JWT |
| PUT | `/api/users/{userId}/status` | JWT |
| POST | `/api/users/{userId}/activate` | JWT+MANAGER |
| POST | `/api/users/{userId}/deactivate` | JWT+MANAGER |
| POST | `/api/users/{userId}/generate-pin` | JWT+MANAGER |
| GET | `/api/users/{userId}/can-take-orders` | JWT |
| POST | `/api/users/kiosk` | JWT+MANAGER |
| GET | `/api/users/kiosk` | JWT+MANAGER |
| POST | `/api/users/kiosk/{kioskUserId}/regenerate` | JWT+MANAGER |
| POST | `/api/users/kiosk/{kioskUserId}/deactivate` | JWT+MANAGER |
| POST | `/api/users/kiosk/auto-login` | Public |

### CustomerController — 14 (`/api/customers`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/customers` | JWT |
| POST | `/api/customers` | JWT |
| GET | `/api/customers/stats` | JWT+MANAGER |
| GET | `/api/customers/{id}` | JWT |
| PUT | `/api/customers/{id}` | JWT |
| POST | `/api/customers/{id}/activate` | JWT+MANAGER |
| POST | `/api/customers/{id}/deactivate` | JWT+MANAGER |
| POST | `/api/customers/{id}/loyalty` | JWT |
| POST | `/api/customers/{id}/addresses` | JWT |
| PUT | `/api/customers/{id}/addresses/{addressId}` | JWT |
| DELETE | `/api/customers/{id}/addresses/{addressId}` | JWT |
| POST | `/api/customers/{id}/tags` | JWT+MANAGER |
| POST | `/api/customers/get-or-create` | Internal only — blocked at gateway |
| DELETE | `/api/customers/{id}/gdpr/anonymize` | JWT+MANAGER |

### ShiftController — 10 (`/api/shifts`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/shifts` | JWT |
| POST | `/api/shifts` | JWT+MANAGER |
| POST | `/api/shifts/bulk` | JWT+MANAGER |
| POST | `/api/shifts/copy-week` | JWT+MANAGER |
| GET | `/api/shifts/{shiftId}` | JWT |
| PUT | `/api/shifts/{shiftId}` | JWT+MANAGER |
| DELETE | `/api/shifts/{shiftId}` | JWT+MANAGER |
| POST | `/api/shifts/{shiftId}/confirm` | JWT |
| POST | `/api/shifts/{shiftId}/start` | JWT |
| POST | `/api/shifts/{shiftId}/complete` | JWT |

### WorkingSessionController — 9 (`/api/sessions`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/sessions` | JWT |
| POST | `/api/sessions/end` | JWT |
| POST | `/api/sessions/clock-in` | Public |
| POST | `/api/sessions/clock-out` | JWT+MANAGER |
| GET | `/api/sessions` | JWT |
| GET | `/api/sessions/pending` | JWT+MANAGER |
| POST | `/api/sessions/{sessionId}/approve` | JWT+MANAGER |
| POST | `/api/sessions/{sessionId}/reject` | JWT+MANAGER |
| POST | `/api/sessions/{sessionId}/break` | JWT |

### ReviewController — 10 (`/api/reviews`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/reviews` | JWT |
| POST | `/api/reviews` | JWT |
| GET | `/api/reviews/stats` | JWT |
| GET | `/api/reviews/public/token/{token}` | Public |
| POST | `/api/reviews/public/submit` | Public |
| GET | `/api/reviews/{reviewId}` | JWT |
| PUT | `/api/reviews/{reviewId}` | JWT |
| DELETE | `/api/reviews/{reviewId}` | JWT+MANAGER |
| POST | `/api/reviews/{reviewId}/response` | JWT+MANAGER |
| GET | `/api/reviews/response-templates` | JWT+MANAGER |

### GdprController — 8 (`/api/gdpr`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/gdpr/consent` | JWT |
| POST | `/api/gdpr/consent` | JWT |
| DELETE | `/api/gdpr/consent` | JWT |
| POST | `/api/gdpr/request` | JWT |
| GET | `/api/gdpr/request` | JWT |
| POST | `/api/gdpr/request/{requestId}/process` | JWT+MANAGER |
| GET | `/api/gdpr/export/{userId}` | JWT |
| GET | `/api/gdpr/audit/{userId}` | JWT+MANAGER |

### CampaignController — 8 (`/api/campaigns`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/campaigns` | JWT+MANAGER |
| POST | `/api/campaigns` | JWT+MANAGER |
| GET | `/api/campaigns/{id}` | JWT+MANAGER |
| PUT | `/api/campaigns/{id}` | JWT+MANAGER |
| DELETE | `/api/campaigns/{id}` | JWT+MANAGER |
| POST | `/api/campaigns/{id}/schedule` | JWT+MANAGER |
| POST | `/api/campaigns/{id}/execute` | JWT+MANAGER |
| POST | `/api/campaigns/{id}/cancel` | JWT+MANAGER |

### NotificationController — 5 (`/api/notifications`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/notifications` | JWT |
| POST | `/api/notifications/send` | JWT |
| PATCH | `/api/notifications/{id}/read` | JWT |
| PATCH | `/api/notifications/read-all` | JWT |
| DELETE | `/api/notifications/{id}` | JWT |

### StoreController — 4 (`/api/stores`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/stores` | Public |
| GET | `/api/stores/{storeId}` | Public |
| POST | `/api/stores` | JWT+MANAGER |
| PUT | `/api/stores/{storeId}` | JWT+MANAGER |

### EarningsController — 4 (`/api/staff`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/staff/earnings/weekly` | JWT |
| GET | `/api/staff/earnings/history` | JWT |
| GET | `/api/staff/pay-rates` | JWT+MANAGER |
| POST | `/api/staff/pay-rates` | JWT+MANAGER |

### SystemInfoController — 5 (`/api/system`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/system/health` | Public |
| GET | `/api/system/version` | Public |
| GET | `/api/system/info` | Public |
| GET | `/api/system/updates/check` | JWT+MANAGER |
| GET | `/api/system/updates/status` | JWT+MANAGER |

### UserPreferencesController — 3 (`/api/preferences`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/preferences/{userId}` | JWT |
| PUT | `/api/preferences/{userId}` | JWT |
| DELETE | `/api/preferences/{userId}` | JWT |

### RatingController — 1 (`/api/notifications/rating`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/notifications/rating/send` | JWT+MANAGER |

### TestDataController — 3 (`/api/test-data`) — `@Profile("dev")` only
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/test-data/create-default-store` | Dev only |
| POST | `/api/test-data/create-test-stores` | Dev only |
| POST | `/api/test-data/migrate-users-to-storecode` | Dev only |

---

## COMMERCE-SERVICE — 31 Endpoints, 6 Controllers

### OrderController — 13 (`/api/orders`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/orders` | JWT |
| POST | `/api/orders` | JWT |
| GET | `/api/orders/kitchen` | JWT+STAFF |
| GET | `/api/orders/track/{orderId}` | Public |
| GET | `/api/orders/{orderId}` | JWT |
| PUT | `/api/orders/{orderId}` | JWT |
| POST | `/api/orders/{orderId}/status` | JWT+STAFF |
| DELETE | `/api/orders/{orderId}` | JWT+MANAGER |
| PATCH | `/api/orders/{orderId}/next-stage` | JWT+STAFF |
| PATCH | `/api/orders/{orderId}/payment` | Internal |
| GET | `/api/orders/{orderId}/quality-checkpoint` | JWT |
| POST | `/api/orders/{orderId}/quality-checkpoint` | JWT+STAFF |
| PATCH | `/api/orders/{orderId}/quality-checkpoint/{checkpointName}` | JWT+STAFF |

### MenuController — 8 (`/api/menu`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/menu` | Public |
| GET | `/api/menu/{id}` | Public |
| POST | `/api/menu` | JWT+MANAGER |
| POST | `/api/menu/bulk` | JWT+MANAGER |
| POST | `/api/menu/copy` | JWT+MANAGER |
| PUT | `/api/menu/{id}` | JWT+MANAGER |
| DELETE | `/api/menu/{id}` | JWT+MANAGER |
| GET | `/api/menu/stats` | JWT+MANAGER |

### KitchenEquipmentController — 6 (`/api/equipment`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/equipment` | JWT |
| POST | `/api/equipment` | JWT+MANAGER |
| GET | `/api/equipment/{equipmentId}` | JWT |
| PATCH | `/api/equipment/{equipmentId}` | JWT+MANAGER |
| DELETE | `/api/equipment/{equipmentId}` | JWT+MANAGER |
| POST | `/api/equipment/{equipmentId}/maintenance` | JWT+STAFF |

### AggregatorController — 2 (`/api/aggregators`) — Global-6
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/aggregators/connections` | JWT+MANAGER |
| POST | `/api/aggregators/connections` | JWT+MANAGER |

### TipController — 1 (`/api/orders`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/orders/{orderId}/tip` | JWT+CASHIER |

### StaffTipController — 1 (`/api/staff/tips`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/staff/tips/pending` | JWT+MANAGER |

---

## PAYMENT-SERVICE — 12 Endpoints, 4 Controllers

### PaymentController — 7 (`/api/payments`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/payments/initiate` | JWT |
| POST | `/api/payments/verify` | JWT |
| POST | `/api/payments/cash` | JWT+CASHIER |
| GET | `/api/payments` | JWT |
| GET | `/api/payments/{transactionId}` | JWT |
| POST | `/api/payments/{transactionId}/reconcile` | JWT+MANAGER |
| DELETE | `/api/payments/gdpr/anonymize` | JWT+MANAGER |

### RefundController — 3 (`/api/payments/refund`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/payments/refund` | JWT |
| GET | `/api/payments/refund` | JWT |
| GET | `/api/payments/refund/{refundId}` | JWT |

### WebhookController — 1 (`/api/payments/webhook`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/payments/webhook` | Public (Razorpay — signature-verified) |

### StripeWebhookController — 1 (`/api/payments/webhook/stripe`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/payments/webhook/stripe` | Public (Stripe — signature-verified) |

---

## LOGISTICS-SERVICE — 42 Endpoints, 5 Controllers

### DeliveryController — 17 (`/api/delivery`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/delivery/dispatch` | Internal |
| POST | `/api/delivery/accept` | JWT+DRIVER |
| POST | `/api/delivery/reject` | JWT+DRIVER |
| POST | `/api/delivery/location` | JWT+DRIVER |
| POST | `/api/delivery/verify` | JWT+DRIVER |
| POST | `/api/delivery/route` | JWT+MANAGER |
| GET | `/api/delivery/track/{orderId}` | JWT |
| GET | `/api/delivery/zones` | JWT |
| GET | `/api/delivery/drivers/available` | JWT+MANAGER |
| GET | `/api/delivery/driver/{driverId}/pending` | JWT+DRIVER |
| GET | `/api/delivery/driver/{driverId}/performance` | JWT |
| GET | `/api/delivery/driver/{driverId}/status` | JWT |
| PUT | `/api/delivery/driver/{driverId}/status` | JWT+DRIVER |
| POST | `/api/delivery/{orderId}/otp` | JWT+DRIVER |
| PATCH | `/api/delivery/{trackingId}/status` | JWT+DRIVER |
| GET | `/api/delivery/analytics` | JWT+MANAGER |
| GET | `/api/delivery/metrics` | JWT+MANAGER |

### InventoryController — 7 (`/api/inventory`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/inventory` | JWT |
| POST | `/api/inventory` | JWT+MANAGER |
| GET | `/api/inventory/{id}` | JWT |
| PATCH | `/api/inventory/{id}` | JWT+MANAGER |
| DELETE | `/api/inventory/{id}` | JWT+MANAGER |
| GET | `/api/inventory/{id}/stock` | JWT |
| GET | `/api/inventory/value` | JWT+MANAGER |

### SupplierController — 6 (`/api/suppliers`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/suppliers` | JWT |
| POST | `/api/suppliers` | JWT+MANAGER |
| GET | `/api/suppliers/{id}` | JWT |
| PUT | `/api/suppliers/{id}` | JWT+MANAGER |
| DELETE | `/api/suppliers/{id}` | JWT+MANAGER |
| GET | `/api/suppliers/compare` | JWT+MANAGER |

### PurchaseOrderController — 6 (`/api/purchase-orders`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/purchase-orders` | JWT |
| POST | `/api/purchase-orders` | JWT+MANAGER |
| GET | `/api/purchase-orders/{id}` | JWT |
| PUT | `/api/purchase-orders/{id}` | JWT+MANAGER |
| DELETE | `/api/purchase-orders/{id}` | JWT+MANAGER |
| POST | `/api/purchase-orders/auto-generate` | Internal (AI agent) |

### WasteController — 6 (`/api/waste`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/waste` | JWT |
| POST | `/api/waste` | JWT+STAFF |
| GET | `/api/waste/{id}` | JWT |
| PUT | `/api/waste/{id}` | JWT+MANAGER |
| POST | `/api/waste/{id}/approve` | JWT+MANAGER |
| GET | `/api/waste/stats` | JWT+MANAGER |

---

## INTELLIGENCE-SERVICE — 4 Endpoints, 2 Controllers

### AnalyticsController — 3 (`/api/analytics`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/analytics` | JWT+MANAGER |
| GET | `/api/analytics/cache/clear` | JWT+MANAGER |
| POST | `/api/analytics/cache/clear` | JWT+MANAGER |

### BIController — 1 (`/api/bi`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/bi` | JWT+MANAGER |
| GET | `/api/bi/reports` | JWT+MANAGER |

> **Known gap:** Intelligence-service has only 4 live routes. The analytics query params
> (`period`, `view`, `type` etc) are handled by the single `GET /api/analytics` endpoint.
> The plan's 11-endpoint breakdown is the intended final state pending further wiring.

---

## Structural Changes from Pre-Merge (what changed in the merges)

| Before | After | Reason |
|--------|-------|--------|
| `ResponseController` at `/api/responses` | Deleted — merged into `ReviewController` | Phase 1 collapse |
| `BIController` at `/api/intelligence` | Now at `/api/bi` | Phase 1 path fix |
| `DispatchController` + `TrackingController` + `PerformanceController` | Merged → single `DeliveryController` at `/api/delivery` | Phase 1 collapse |
| `UserController` handled all auth | `AuthController` split out at `/api/auth/*` | Phase 1 + hotfix |
| Commerce `RatingController` | Deleted — rating token endpoints in core `ReviewController` | Phase 1 |
| No aggregator support | `AggregatorController` at `/api/aggregators` | Global-6 |

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
