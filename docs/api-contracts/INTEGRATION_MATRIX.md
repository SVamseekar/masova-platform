# MaSoVa Integration Matrix

Generated: 2026-06-30T06:31:10.792Z

## Summary

| Metric | Count |
|--------|-------|
| backendEndpoints | 207 |
| gatewayRoutes | 77 |
| gatewayBlocked | 4 |
| rtkSlices | 23 |
| rtkUrls | 763 |
| rawHttpCalls | 6 |
| mswHandlers | 207 |
| apiTestFiles | 10 |
| gatewayGaps | 3 |
| staleFrontendWiring | 0 |
| unwiredBackendPublic | 18 |
| frontendOnlyPaths | 0 |
| unwiredSlices | 0 |
| noMswCoverage | 18 |
| noTestCoverage | 63 |

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


## Full matrix

See `INTEGRATION_MATRIX.json` for per-endpoint detail.

Columns: gateway | RTK | raw HTTP | UI | MSW | test | wiring status

### Critical rows (18)

| Method | Backend path | Gateway | RTK | UI | MSW | Test | Wiring |
|--------|--------------|---------|-----|----|----|------|--------|
| GET | /api/customers | routed | — | — | customerHandlers.ts | — | none |
| POST | /api/customers | routed | — | — | customerHandlers.ts | — | none |
| POST | /api/delivery/{trackingId}/status | routed | — | — | — | — | none |
| GET | /api/delivery/metrics | routed | — | — | deliveryHandlers.ts | — | none |
| DELETE | /api/orders/{orderId} | routed | — | — | orderHandlers.ts | 1 | none |
| POST | /api/orders/{orderId}/next-stage | routed | — | — | — | — | none |
| POST | /api/orders/{orderId}/status | routed | — | — | — | 1 | none |
| POST | /api/orders/rating-token/{token}/mark-used | routed | — | — | — | — | none |
| GET | /api/payments | routed | — | — | — | — | none |
| DELETE | /api/preferences/{userId} | routed | — | — | — | — | none |
| DELETE | /api/suppliers/{id} | routed | — | — | — | — | none |
| POST | /api/test-data/create-default-store | missing | — | — | — | — | none |
| POST | /api/test-data/create-test-stores | missing | — | — | — | — | none |
| POST | /api/test-data/migrate-users-to-storecode | missing | — | — | — | — | none |
| PATCH | /api/users/{userId} | routed | — | — | — | — | none |
| POST | /api/users/{userId}/generate-pin | routed | — | — | — | — | none |
| PATCH | /api/users/{userId}/status | routed | — | — | — | — | none |
| POST | /api/users/kiosk/auto-login | routed | — | — | — | — | none |
