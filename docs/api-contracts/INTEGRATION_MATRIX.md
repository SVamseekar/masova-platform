# MaSoVa Integration Matrix

Generated: 2026-06-30T05:29:21.782Z

## Summary

| Metric | Count |
|--------|-------|
| backendEndpoints | 202 |
| gatewayRoutes | 75 |
| gatewayBlocked | 4 |
| rtkSlices | 24 |
| rtkUrls | 768 |
| rawHttpCalls | 6 |
| mswHandlers | 178 |
| apiTestFiles | 10 |
| gatewayGaps | 3 |
| staleFrontendWiring | 0 |
| unwiredBackendPublic | 33 |
| frontendOnlyPaths | 56 |
| unwiredSlices | 0 |
| noMswCoverage | 56 |
| noTestCoverage | 60 |

## Gateway gaps (backend exists, no gateway route)

| Method | Path | Controller |
|--------|------|------------|
| POST | /api/test-data/create-default-store | TestDataController |
| POST | /api/test-data/create-test-stores | TestDataController |
| POST | /api/test-data/migrate-users-to-storecode | TestDataController |

## Stale frontend wiring (calls wrong path)

_None_

## RTK slices with zero UI usage


## Frontend paths with no backend controller

- GET /api/agent/chat [agentApi.ts]
- GET /api/agents/demand-forecast/trigger [agentApi.ts]
- GET /api/agents/inventory-reorder/trigger [agentApi.ts]
- GET /api/agents/churn-prevention/trigger [agentApi.ts]
- GET /api/agents/review-response/trigger [agentApi.ts]
- GET /api/agents/shift-optimisation/trigger [agentApi.ts]
- GET /api/agents/kitchen-coach/trigger [agentApi.ts]
- GET /api/agents/dynamic-pricing/trigger [agentApi.ts]
- GET /api/health [agentApi.ts]
- POST /api/agent/chat [agentApi.ts]
- POST /api/agents/demand-forecast/trigger [agentApi.ts]
- POST /api/agents/inventory-reorder/trigger [agentApi.ts]
- POST /api/agents/churn-prevention/trigger [agentApi.ts]
- POST /api/agents/review-response/trigger [agentApi.ts]
- POST /api/agents/shift-optimisation/trigger [agentApi.ts]
- POST /api/agents/kitchen-coach/trigger [agentApi.ts]
- POST /api/agents/dynamic-pricing/trigger [agentApi.ts]
- GET /api/customers/:param/preferences [customerApi.ts]
- GET /api/customers/:param/order-stats [customerApi.ts]
- GET /api/customers/:param/notes [customerApi.ts]
- GET /api/customers/:param/verify-email [customerApi.ts]
- GET /api/customers/:param/verify-phone [customerApi.ts]
- PUT /api/customers/:param/preferences [customerApi.ts]
- POST /api/customers/:param/order-stats [customerApi.ts]
- POST /api/customers/:param/notes [customerApi.ts]
- PATCH /api/customers/:param/verify-email [customerApi.ts]
- PATCH /api/customers/:param/verify-phone [customerApi.ts]
- GET /api/delivery/auto-dispatch [deliveryApi.ts]
- GET /api/delivery/route-optimize [deliveryApi.ts]
- GET /api/delivery/location-update [deliveryApi.ts]

_...and 26 more_

## Full matrix

See `INTEGRATION_MATRIX.json` for per-endpoint detail.

Columns: gateway | RTK | raw HTTP | UI | MSW | test | wiring status

### Critical rows (33)

| Method | Backend path | Gateway | RTK | UI | MSW | Test | Wiring |
|--------|--------------|---------|-----|----|----|------|--------|
| PATCH | /api/campaigns/{id} | routed | — | — | — | — | none |
| GET | /api/customers | routed | — | — | customerHandlers.ts | — | none |
| POST | /api/customers | routed | — | — | customerHandlers.ts | — | none |
| POST | /api/delivery/{orderId}/otp | routed | — | — | — | — | none |
| POST | /api/delivery/{trackingId}/status | routed | — | — | — | — | none |
| POST | /api/delivery/dispatch | routed | — | — | — | — | none |
| POST | /api/delivery/location | routed | — | — | — | — | none |
| GET | /api/delivery/metrics | routed | — | — | deliveryHandlers.ts | — | none |
| POST | /api/delivery/route | routed | — | — | — | — | none |
| GET | /api/delivery/zones | routed | — | — | — | 1 | none |
| DELETE | /api/orders/{orderId} | routed | — | — | orderHandlers.ts | 1 | none |
| PATCH | /api/orders/{orderId} | routed | — | — | — | 1 | none |
| POST | /api/orders/{orderId}/cancel-request | routed | — | — | — | — | none |
| POST | /api/orders/{orderId}/cancel-request/approve | routed | — | — | — | — | none |
| POST | /api/orders/{orderId}/cancel-request/reject | routed | — | — | — | — | none |
| POST | /api/orders/{orderId}/next-stage | routed | — | — | — | — | none |
| POST | /api/orders/{orderId}/status | routed | — | — | — | 1 | none |
| GET | /api/payments | routed | — | — | — | — | none |
| POST | /api/payments/refund/{refundId}/approve | routed | — | — | — | — | none |
| POST | /api/payments/refund/{refundId}/reject | routed | — | — | — | — | none |
| POST | /api/payments/refund/request | routed | — | — | — | — | none |
| DELETE | /api/preferences/{userId} | routed | — | — | — | — | none |
| PATCH | /api/stores/{storeId} | routed | — | — | — | — | none |
| DELETE | /api/suppliers/{id} | routed | — | — | — | — | none |
| POST | /api/test-data/create-default-store | missing | — | — | — | — | none |
| POST | /api/test-data/create-test-stores | missing | — | — | — | — | none |
| POST | /api/test-data/migrate-users-to-storecode | missing | — | — | — | — | none |
| PATCH | /api/users/{userId} | routed | — | — | — | — | none |
| POST | /api/users/{userId}/generate-pin | routed | — | — | — | — | none |
| PATCH | /api/users/{userId}/status | routed | — | — | — | — | none |
| POST | /api/users/kiosk | routed | — | — | — | — | none |
| POST | /api/users/kiosk/{kioskUserId}/regenerate | routed | — | — | — | — | none |
| POST | /api/users/kiosk/auto-login | routed | — | — | — | — | none |
