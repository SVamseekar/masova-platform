# Canonical API Endpoints (207 total)

Generated from INTEGRATION_MATRIX.json.

## commerce (39)

| Method | Path | Controller | Gateway | Frontend |
|--------|------|------------|---------|----------|
| GET | /api/aggregators/connections | AggregatorController | routed | canonical |
| PUT | /api/aggregators/connections | AggregatorController | routed | canonical |
| GET | /api/equipment | KitchenEquipmentController | routed | canonical |
| POST | /api/equipment | KitchenEquipmentController | routed | canonical |
| DELETE | /api/equipment/{equipmentId} | KitchenEquipmentController | routed | canonical |
| GET | /api/equipment/{equipmentId} | KitchenEquipmentController | routed | canonical |
| PATCH | /api/equipment/{equipmentId} | KitchenEquipmentController | routed | canonical |
| POST | /api/equipment/{equipmentId}/maintenance | KitchenEquipmentController | routed | canonical |
| GET | /api/fiscal/failures | FiscalController | routed | canonical |
| GET | /api/fiscal/summary | FiscalController | routed | canonical |
| GET | /api/menu | MenuController | routed | canonical |
| POST | /api/menu | MenuController | routed | canonical |
| DELETE | /api/menu/{id} | MenuController | routed | canonical |
| GET | /api/menu/{id} | MenuController | routed | canonical |
| PATCH | /api/menu/{id} | MenuController | routed | canonical |
| POST | /api/menu/bulk | MenuController | routed | canonical |
| POST | /api/menu/copy | MenuController | routed | canonical |
| PATCH | /api/menu/items/{id}/allergens | MenuController | routed | canonical |
| GET | /api/menu/stats | MenuController | routed | canonical |
| GET | /api/orders | OrderController | routed | canonical |
| POST | /api/orders | OrderController | routed | canonical |
| DELETE | /api/orders/{orderId} | OrderController | routed | none |
| GET | /api/orders/{orderId} | OrderController | routed | canonical |
| PATCH | /api/orders/{orderId} | OrderController | routed | canonical |
| POST | /api/orders/{orderId}/cancel-request | OrderController | routed | canonical |
| POST | /api/orders/{orderId}/cancel-request/approve | OrderController | routed | canonical |
| POST | /api/orders/{orderId}/cancel-request/reject | OrderController | routed | canonical |
| POST | /api/orders/{orderId}/next-stage | OrderController | routed | none |
| PATCH | /api/orders/{orderId}/payment | OrderController | routed | canonical |
| POST | /api/orders/{orderId}/quality-checkpoint | OrderController | routed | canonical |
| PATCH | /api/orders/{orderId}/quality-checkpoint/{checkpointName} | OrderController | routed | canonical |
| POST | /api/orders/{orderId}/status | OrderController | routed | none |
| POST | /api/orders/{orderId}/tip | TipController | routed | canonical |
| GET | /api/orders/analytics | OrderController | routed | canonical |
| POST | /api/orders/gdpr/anonymize | OrderController | blocked | none |
| GET | /api/orders/rating-token/{token} | RatingTokenController | routed | canonical |
| POST | /api/orders/rating-token/{token}/mark-used | RatingTokenController | routed | none |
| GET | /api/orders/track/{orderId} | OrderController | routed | canonical |
| GET | /api/staff/tips/pending | StaffTipController | routed | canonical |

## core (107)

| Method | Path | Controller | Gateway | Frontend |
|--------|------|------------|---------|----------|
| POST | /api/auth/change-password | AuthController | routed | canonical |
| POST | /api/auth/google | AuthController | routed | canonical |
| POST | /api/auth/login | AuthController | routed | canonical |
| POST | /api/auth/logout | AuthController | routed | canonical |
| POST | /api/auth/refresh | AuthController | routed | canonical |
| POST | /api/auth/register | AuthController | routed | canonical |
| POST | /api/auth/validate-pin | AuthController | routed | canonical |
| GET | /api/campaigns | CampaignController | routed | canonical |
| POST | /api/campaigns | CampaignController | routed | canonical |
| DELETE | /api/campaigns/{id} | CampaignController | routed | canonical |
| GET | /api/campaigns/{id} | CampaignController | routed | canonical |
| PATCH | /api/campaigns/{id} | CampaignController | routed | canonical |
| POST | /api/campaigns/{id}/cancel | CampaignController | routed | canonical |
| POST | /api/campaigns/{id}/execute | CampaignController | routed | canonical |
| POST | /api/campaigns/{id}/schedule | CampaignController | routed | canonical |
| GET | /api/customers | CustomerController | routed | none |
| POST | /api/customers | CustomerController | routed | none |
| DELETE | /api/customers/{id} | CustomerController | routed | canonical |
| GET | /api/customers/{id} | CustomerController | routed | canonical |
| PATCH | /api/customers/{id} | CustomerController | routed | canonical |
| POST | /api/customers/{id}/activate | CustomerController | routed | canonical |
| POST | /api/customers/{id}/addresses | CustomerController | routed | canonical |
| DELETE | /api/customers/{id}/addresses/{addressId} | CustomerController | routed | canonical |
| PATCH | /api/customers/{id}/addresses/{addressId} | CustomerController | routed | canonical |
| POST | /api/customers/{id}/deactivate | CustomerController | routed | canonical |
| POST | /api/customers/{id}/loyalty | CustomerController | routed | canonical |
| POST | /api/customers/{id}/tags | CustomerController | routed | canonical |
| POST | /api/customers/get-or-create | CustomerController | blocked | canonical |
| GET | /api/customers/stats | CustomerController | routed | canonical |
| GET | /api/gdpr/audit/{userId} | GdprController | routed | canonical |
| DELETE | /api/gdpr/consent | GdprController | routed | canonical |
| GET | /api/gdpr/consent | GdprController | routed | canonical |
| POST | /api/gdpr/consent | GdprController | routed | canonical |
| GET | /api/gdpr/export/{userId} | GdprController | routed | canonical |
| GET | /api/gdpr/request | GdprController | routed | canonical |
| POST | /api/gdpr/request | GdprController | routed | canonical |
| POST | /api/gdpr/request/{requestId}/process | GdprController | routed | canonical |
| GET | /api/notifications | NotificationController | routed | canonical |
| POST | /api/notifications | NotificationController | routed | canonical |
| DELETE | /api/notifications/{id} | NotificationController | routed | canonical |
| PATCH | /api/notifications/{id}/read | NotificationController | routed | canonical |
| POST | /api/notifications/rating/send | RatingController | routed | canonical |
| PATCH | /api/notifications/read-all | NotificationController | routed | canonical |
| DELETE | /api/preferences/{userId} | UserPreferencesController | routed | none |
| GET | /api/preferences/{userId} | UserPreferencesController | routed | canonical |
| PATCH | /api/preferences/{userId} | UserPreferencesController | routed | canonical |
| GET | /api/reviews | ReviewController | routed | canonical |
| POST | /api/reviews | ReviewController | routed | canonical |
| DELETE | /api/reviews/{reviewId} | ReviewController | routed | canonical |
| GET | /api/reviews/{reviewId} | ReviewController | routed | canonical |
| PATCH | /api/reviews/{reviewId} | ReviewController | routed | canonical |
| DELETE | /api/reviews/{reviewId}/response | ReviewController | routed | canonical |
| POST | /api/reviews/{reviewId}/response | ReviewController | routed | canonical |
| POST | /api/reviews/complaints | ReviewController | routed | none |
| POST | /api/reviews/public/submit | ReviewController | routed | none |
| GET | /api/reviews/public/token/{token} | ReviewController | routed | canonical |
| GET | /api/reviews/response-templates | ReviewController | routed | canonical |
| GET | /api/reviews/stats | ReviewController | routed | canonical |
| GET | /api/sessions | WorkingSessionController | routed | canonical |
| POST | /api/sessions | WorkingSessionController | routed | canonical |
| POST | /api/sessions/{sessionId}/approve | WorkingSessionController | routed | canonical |
| POST | /api/sessions/{sessionId}/break | WorkingSessionController | routed | canonical |
| POST | /api/sessions/{sessionId}/reject | WorkingSessionController | routed | canonical |
| POST | /api/sessions/clock-in | WorkingSessionController | routed | canonical |
| POST | /api/sessions/clock-out | WorkingSessionController | routed | canonical |
| POST | /api/sessions/end | WorkingSessionController | routed | canonical |
| GET | /api/sessions/pending | WorkingSessionController | routed | canonical |
| GET | /api/shifts | ShiftController | routed | canonical |
| POST | /api/shifts | ShiftController | routed | canonical |
| DELETE | /api/shifts/{shiftId} | ShiftController | routed | canonical |
| GET | /api/shifts/{shiftId} | ShiftController | routed | canonical |
| PATCH | /api/shifts/{shiftId} | ShiftController | routed | canonical |
| POST | /api/shifts/{shiftId}/complete | ShiftController | routed | canonical |
| POST | /api/shifts/{shiftId}/confirm | ShiftController | routed | canonical |
| POST | /api/shifts/{shiftId}/start | ShiftController | routed | canonical |
| POST | /api/shifts/bulk | ShiftController | routed | canonical |
| POST | /api/shifts/copy-week | ShiftController | routed | canonical |
| GET | /api/staff/earnings/history | EarningsController | routed | canonical |
| GET | /api/staff/earnings/weekly | EarningsController | routed | none |
| GET | /api/staff/pay-rates | EarningsController | routed | canonical |
| POST | /api/staff/pay-rates | EarningsController | routed | canonical |
| GET | /api/stores | StoreController | routed | canonical |
| POST | /api/stores | StoreController | routed | canonical |
| GET | /api/stores/{storeId} | StoreController | routed | canonical |
| PATCH | /api/stores/{storeId} | StoreController | routed | canonical |
| GET | /api/system/health | SystemInfoController | routed | canonical |
| GET | /api/system/info | SystemInfoController | routed | canonical |
| GET | /api/system/updates/check | SystemInfoController | routed | canonical |
| GET | /api/system/updates/status | SystemInfoController | routed | canonical |
| GET | /api/system/version | SystemInfoController | routed | canonical |
| POST | /api/test-data/create-default-store | TestDataController | missing | none |
| POST | /api/test-data/create-test-stores | TestDataController | missing | none |
| POST | /api/test-data/migrate-users-to-storecode | TestDataController | missing | none |
| GET | /api/users | UserController | routed | canonical |
| GET | /api/users/{userId} | UserController | routed | canonical |
| PATCH | /api/users/{userId} | UserController | routed | none |
| POST | /api/users/{userId}/activate | UserController | routed | canonical |
| GET | /api/users/{userId}/can-take-orders | UserController | routed | canonical |
| POST | /api/users/{userId}/deactivate | UserController | routed | canonical |
| POST | /api/users/{userId}/generate-pin | UserController | routed | none |
| GET | /api/users/{userId}/status | UserController | routed | canonical |
| PATCH | /api/users/{userId}/status | UserController | routed | none |
| GET | /api/users/kiosk | UserController | routed | canonical |
| POST | /api/users/kiosk | UserController | routed | canonical |
| POST | /api/users/kiosk/{kioskUserId}/deactivate | UserController | routed | canonical |
| POST | /api/users/kiosk/{kioskUserId}/regenerate | UserController | routed | canonical |
| POST | /api/users/kiosk/auto-login | UserController | routed | none |

## intelligence (4)

| Method | Path | Controller | Gateway | Frontend |
|--------|------|------------|---------|----------|
| GET | /api/analytics | AnalyticsController | routed | canonical |
| POST | /api/analytics/cache/clear | AnalyticsController | routed | canonical |
| GET | /api/bi | AnalyticsController | routed | canonical |
| GET | /api/bi/reports | AnalyticsController | routed | canonical |

## logistics (42)

| Method | Path | Controller | Gateway | Frontend |
|--------|------|------------|---------|----------|
| POST | /api/delivery/{orderId}/otp | DeliveryController | routed | canonical |
| POST | /api/delivery/{trackingId}/status | DeliveryController | routed | none |
| POST | /api/delivery/accept | DeliveryController | routed | canonical |
| POST | /api/delivery/dispatch | DeliveryController | routed | canonical |
| GET | /api/delivery/driver/{driverId}/pending | DeliveryController | routed | canonical |
| GET | /api/delivery/driver/{driverId}/performance | DeliveryController | routed | canonical |
| GET | /api/delivery/driver/{driverId}/status | DeliveryController | routed | canonical |
| PATCH | /api/delivery/driver/{driverId}/status | DeliveryController | routed | canonical |
| GET | /api/delivery/drivers/available | DeliveryController | routed | canonical |
| POST | /api/delivery/gdpr/anonymize | DeliveryController | blocked | none |
| POST | /api/delivery/location | DeliveryController | routed | canonical |
| GET | /api/delivery/metrics | DeliveryController | routed | none |
| POST | /api/delivery/reject | DeliveryController | routed | canonical |
| POST | /api/delivery/route | DeliveryController | routed | canonical |
| GET | /api/delivery/track/{orderId} | DeliveryController | routed | canonical |
| POST | /api/delivery/verify | DeliveryController | routed | canonical |
| GET | /api/delivery/zones | DeliveryController | routed | canonical |
| GET | /api/inventory | InventoryController | routed | canonical |
| POST | /api/inventory | InventoryController | routed | canonical |
| DELETE | /api/inventory/{id} | InventoryController | routed | canonical |
| GET | /api/inventory/{id} | InventoryController | routed | canonical |
| PATCH | /api/inventory/{id} | InventoryController | routed | canonical |
| POST | /api/inventory/{id}/stock | InventoryController | routed | canonical |
| GET | /api/inventory/value | InventoryController | routed | canonical |
| GET | /api/purchase-orders | PurchaseOrderController | routed | canonical |
| POST | /api/purchase-orders | PurchaseOrderController | routed | canonical |
| DELETE | /api/purchase-orders/{id} | PurchaseOrderController | routed | canonical |
| GET | /api/purchase-orders/{id} | PurchaseOrderController | routed | canonical |
| PATCH | /api/purchase-orders/{id} | PurchaseOrderController | routed | canonical |
| POST | /api/purchase-orders/auto-generate | PurchaseOrderController | routed | canonical |
| GET | /api/suppliers | SupplierController | routed | canonical |
| POST | /api/suppliers | SupplierController | routed | canonical |
| DELETE | /api/suppliers/{id} | SupplierController | routed | none |
| GET | /api/suppliers/{id} | SupplierController | routed | canonical |
| PATCH | /api/suppliers/{id} | SupplierController | routed | canonical |
| GET | /api/suppliers/compare | SupplierController | routed | canonical |
| GET | /api/waste | WasteController | routed | canonical |
| POST | /api/waste | WasteController | routed | canonical |
| DELETE | /api/waste/{id} | WasteController | routed | canonical |
| GET | /api/waste/{id} | WasteController | routed | canonical |
| PATCH | /api/waste/{id} | WasteController | routed | canonical |
| GET | /api/waste/analytics | WasteController | routed | canonical |

## payment (15)

| Method | Path | Controller | Gateway | Frontend |
|--------|------|------------|---------|----------|
| GET | /api/payments | PaymentController | routed | none |
| GET | /api/payments/{transactionId} | PaymentController | routed | canonical |
| POST | /api/payments/{transactionId}/reconcile | PaymentController | routed | canonical |
| POST | /api/payments/cash | PaymentController | routed | canonical |
| POST | /api/payments/gdpr/anonymize | PaymentController | blocked | none |
| POST | /api/payments/initiate | PaymentController | routed | canonical |
| GET | /api/payments/refund | RefundController | routed | canonical |
| POST | /api/payments/refund | RefundController | routed | canonical |
| GET | /api/payments/refund/{refundId} | RefundController | routed | canonical |
| POST | /api/payments/refund/{refundId}/approve | RefundController | routed | canonical |
| POST | /api/payments/refund/{refundId}/reject | RefundController | routed | canonical |
| POST | /api/payments/refund/request | RefundController | routed | canonical |
| POST | /api/payments/verify | PaymentController | routed | canonical |
| POST | /api/payments/webhook | WebhookController | routed | none |
| POST | /api/payments/webhook/stripe | StripeWebhookController | routed | none |

