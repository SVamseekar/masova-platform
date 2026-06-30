# MaSoVa Integration Gaps — Complete Inventory

**Generated:** 2026-06-30  
**Handoff workstream (`INTEGRATION_FIX_HANDOFF.md`):** **COMPLETE** — stale wiring 0, unwired slices 0, gateway gaps 3, frontend tests 1415/1415 passed.  
**Gaps E2E workstream:** **COMPLETE** (2026-06-30) — see §1 before/after. Dell deploy + hardware Phase 2 remain.  
**Ground truth:** Java `@RestController` classes, `GatewayConfig.java`, `frontend/src/store/api/*.ts`, page/hook imports, Flyway migrations, service-layer code.  
**Not authoritative:** `docs/MASOVA_MASTER_REFERENCE.md`, `API_MISMATCH_REPORT.json` (Jan 2026).

**Regenerate machine counts:**
```bash
node scripts/integration-matrix-audit.js
```

**Companion files:**
| File | Purpose |
|------|---------|
| `INTEGRATION_MATRIX.json` | Per-endpoint matrix (202 backend rows) |
| `INTEGRATION_MATRIX.md` | Summary + critical rows |
| `INTEGRATION_FIX_HANDOFF.md` | Fix checklist for active workstream |

---

## 1. Summary counts

**Session completed 2026-06-30** (integration-gaps E2E on Mac). Baseline → after:

| Metric | Before | After | Meaning |
|--------|-------:|------:|---------|
| Backend public endpoints | 202 | **207** | +fiscal, rating-token, review response DELETE |
| `frontendWiring: none` | 41 | **18** | Remaining unwired (webhooks, internal, low-priority) |
| `frontendOnly` paths | 56 | **0** | All dead RTK paths fixed; agentApi excluded (G7 external) |
| `staleFrontendWiring` | 0 | **0** | Still clean |
| Gateway gaps | 3 | **3** | TestDataController dev-only (expected) |
| RTK wired, no MSW | 29 | **18** | §6 handlers added |
| `noTestCoverage` (matrix) | 60 | **63** | New backend rows |
| Frontend tests | 1415 | **1425** | All passing |

**Completed:** §5 broken paths (delivery/kiosk/earnings/driver) · §4 refund/cancel/GDPR/kiosk/pay-rate/sessions · §3 dead RTK (order/store/customer/review) · §8 fiscal API + sessions/pending + rating tokens · §6–7 MSW + UI hooks.

| Metric | Count | Meaning |
|--------|------:|---------|
| Backend public endpoints | 207 | `@RestController` methods in 6 services |
| `frontendWiring: none` | 18 | Backend exists; no RTK slice and no detected UI |
| `frontendOnly` paths | 0 | RTK/raw HTTP calls with **no** Spring controller |
| `staleFrontendWiring` | 0 | Wrong path vs controller (file-level; currently clean) |
| Gateway gaps | 3 | Backend exists; no gateway route (all `TestDataController`) |
| RTK wired, no MSW | 18 | Slice exists; no mock handler for tests |
| `noTestCoverage` (matrix) | 63 | Backend endpoint with no unit/integration test reference |
| Unwired RTK hooks | 5+ | Remaining: systemApi health/updates (see §8) |

### Gap taxonomy

| Code | Definition | Fix type |
|------|------------|----------|
| **G1** | Backend stub / schema only | Implement service + persistence |
| **G2** | Backend complete, zero web wiring | Add RTK + UI (or mark internal-only) |
| **G3** | Frontend calls dead path | Fix RTK path or add controller |
| **G4** | UI shell, API 404 / wrong service | Add controller or re-point client |
| **G5** | Partial flow (one hop works) | Wire missing steps |
| **G6** | Test/MSW gap | Add handlers + tests |
| **G7** | Out of repo / separate process | Document dependency |

---

## 2. Feature domains (end-to-end status)

Each row is **web stack** unless noted. Status: ✅ E2E · ⚠️ Partial · ❌ Not E2E.

### 2.1 Fiscal & tax compliance

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Order-triggered signing | ⚠️ | G1 | `FiscalSigningService` runs `@Async` on DELIVERED/COMPLETED/SERVED; writes Mongo `Order.fiscalSignature` + PG `orders` fiscal columns |
| DE TSE signer | ❌ | G1 | `GermanyTseFiscalSigner` — `STUB-TSE-SIG-*`, Phase 2 hardware |
| IT RT signer | ❌ | G1 | `ItalyRtFiscalSigner` — `STUB-RT-SIG-*` |
| BE FDM signer | ❌ | G1 | `BelgiumFdmFiscalSigner` — `STUB-FDM-SIG-*` |
| FR NF525 signer | ❌ | G1 | `FranceNf525FiscalSigner` — `STUB-NF525-SIG-*` |
| HU NTCA signer | ❌ | G1 | `HungaryNtcaFiscalSigner` — Phase 1 stub, Phase 2 OSCAR API |
| UK MTD signer | ❌ | G1 | `UkMtdFiscalSigner` logs only; **does not insert** into `uk_vat_ledger` |
| Passthrough signers (NL/LU/IE/CH/US/CA) | ✅ | — | No hardware required |
| `fiscal_signatures` table (V8) | ❌ | G1 | Flyway migration only; no JPA entity/repository writes |
| `uk_vat_ledger` table (V9) | ❌ | G1 | Migration only; no application writes |
| `stripe_tax_calculations` table (V10) | ❌ | G1 | Migration only; zero Java references |
| `ReceiptSignedEvent` (RabbitMQ) | ✅ | — | Published on signing attempt |
| Fiscal REST API | ❌ | G2 | No `FiscalController`; `/api/fiscal/summary`, `/api/fiscal/failures` do not exist |
| Gateway `/api/fiscal/**` | ❌ | G2 | No route in `GatewayConfig.java` |
| `fiscalApi.ts` | ❌ | G3 | 2 dead paths (see §3.1) |
| `FiscalCompliancePage` | ❌ | G4 | Manager UI calls dead `fiscalApi` → 404 |
| Store fiscal device IP (TSE/RT/FDM) | ❌ | G5 | `StoreManagementPage` — React local state only; not saved to store API |
| NTCA credentials (HU) | ❌ | G5 | Local state only |
| “Test Connection” button | ❌ | G1 | `alert('Device connection test — Phase 2 feature')` |
| HMRC quarterly MTD submission | ❌ | G1 | Referenced in comments; no backend or UI |

**Files:** `commerce-service/.../fiscal/*`, `FiscalSigningService.java`, `frontend/.../fiscalApi.ts`, `FiscalCompliancePage.tsx`, `StoreManagementPage.tsx`, `V8__fiscal_signatures.sql`, `V9__uk_vat_ledger.sql`, `V10__stripe_tax_calculations.sql`

---

### 2.2 AI agents (manager)

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| `masova-support` Python agents | ⚠️ | G7 | Separate repo, FastAPI :8000 |
| `agentApi.ts` | ❌ | G7 | `baseUrl: VITE_AGENT_URL` (not api-gateway); 17 paths |
| `AIAgentsSection` (manager) | ⚠️ | G4 | UI exists; requires agent process + env var |
| Gateway routing for `/api/agents/**` | ❌ | G7 | Intentionally absent — not Spring services |
| Product site `AIAgentsSection` | ⚠️ | G4 | Marketing/demo; same dependency |

**Dead paths (all `agentApi.ts`):** see §3.1 rows 1–17.

---

### 2.3 GDPR & privacy

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Consent grant/revoke (backend) | ✅ | — | `GdprController` `/api/gdpr/consent` |
| Data request create/list (backend) | ✅ | — | `/api/gdpr/request` |
| Process request (backend) | ✅ | G2 | `POST /api/gdpr/request/{id}/process` — **manager only**; no manager UI |
| Export package (backend) | ✅ | G2 | `GET /api/gdpr/export/{userId}` — no customer/manager UI |
| Audit log (backend) | ✅ | G2 | `GET /api/gdpr/audit/{userId}` — no UI |
| `CookieConsent.tsx` | ✅ | — | `useGrantConsentMutation` |
| `GdprRequests.tsx` (customer) | ⚠️ | G5 | Create + list only; export/process buttons not wired to hooks |
| Manager GDPR console | ❌ | G2 | No page for process/export/audit |
| Cross-service erasure | ⚠️ | G5 | `GdprDataRequestService.anonymizeAllCustomerData` calls Feign clients; `CustomerService.anonymizeAndDeleteCustomer` still has TODO for cascade |
| GDPR export — payment methods | ⚠️ | G1 | `PaymentServiceClient.getCustomerPaymentMethods` returns empty (no Phase 1 endpoint) |
| GDPR export — deliveries | ⚠️ | G1 | `DeliveryServiceClient.getCustomerDeliveries` returns empty (no Phase 1 endpoint) |
| Internal anonymize (gateway blocked) | ✅ | — | `POST /api/orders/gdpr/anonymize`, `/api/payments/gdpr/anonymize`, `/api/delivery/gdpr/anonymize` — service-to-service via `X-Internal-Service`; not a UI gap |

**Unused hooks:** `useProcessGdprRequestMutation`, `useExportUserDataQuery`, `useLazyExportUserDataQuery`, `useGetGdprAuditLogQuery`, `useGetConsentsQuery`, `useRevokeConsentMutation`

---

### 2.4 Staff sessions & timekeeping

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Start/end session | ✅ | — | Canonical `/api/sessions`, `/api/sessions/end` |
| Break recording | ✅ | — | `POST /api/sessions/{id}/break` with `sessionId` |
| Approve/reject session | ⚠️ | G5 | RTK + `DashboardSection` wired; uses store sessions filter, not pending endpoint |
| `GET /api/sessions/pending` | ❌ | G1 | `WorkingSessionController` returns `List.of()` — “Phase 3” |
| `useGetPendingApprovalSessionsQuery` | ❌ | G5 | Exported in `sessionApi.ts`; **never imported** in any page |
| Enhanced break validation | ⚠️ | G1 | `WorkingSessionService` — “Phase 3: Enhanced break validation rules” |
| Session duration fields | ⚠️ | G1 | “Phase 3: Calculate and set enhanced duration fields” |

---

### 2.5 Staff earnings, pay rates & tips

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| `GET /api/staff/earnings/weekly` | ✅ | G6 | Backend + `StaffManagementPage`; matrix misses RTK match (path format) |
| `GET /api/staff/earnings/history` | ⚠️ | G5 | Backend + `StaffLeaderboardPage`; top performer only |
| `GET/POST /api/staff/pay-rates` | ⚠️ | G5 | Backend + RTK; `useSetPayRateMutation` **unused** in UI |
| `GET /api/staff/tips/pending` | ⚠️ | G5 | Backend + `StaffManagementPage` display; no tip approval/distribution UI |
| `POST /api/orders/{orderId}/tip` | ⚠️ | G2 | Backend + `tipApi`; limited POS wiring |
| `earningsApi` path style | ⚠️ | G3 | Uses `staff/earnings/...` without leading `/` (inconsistent vs `/api/...` slices; breaks matrix matching) |

---

### 2.6 Orders — lifecycle & admin

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Create order / status update (canonical) | ✅ | — | Core POS/customer flows |
| `POST /api/orders/{id}/status` | ⚠️ | G2 | Backend + tests; web uses other mutations; this canonical transition endpoint unwired |
| `POST /api/orders/{id}/next-stage` | ❌ | G2 | Backend only |
| `PATCH /api/orders/{id}` | ❌ | G2 | Backend only |
| `DELETE /api/orders/{id}` | ❌ | G2 | Backend only; MSW handler exists |
| Cancel-request workflow | ❌ | G2 | `POST .../cancel-request`, `/approve`, `/reject` — backend + tests; **zero frontend** |
| Quality checkpoint | ✅ | — | Wired in KDS/manager |
| Legacy order analytics paths | ❌ | G3 | 6 dead `orderApi` paths (§3.1) |
| Order WebSocket (KDS) | ⚠️ | G5 | `useOrderWebSocket` exists; E2E depends on commerce WS + gateway |
| Dual-write PG orders | ⚠️ | G1 | Phase 2 pattern in progress; Mongo primary |

**Dead `orderApi` paths:** `GET /api/orders/store/avg-prep-time`, `.../make-table/{id}`, `.../analytics/prep-time-by-item`, `.../analytics/prep-time-distribution`, `GET /api/orders/analytics/pos-staff/{id}/performance`, `GET /api/orders/staff/{id}/date/{date}`

---

### 2.7 Payments & refunds

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Initiate payment / cash | ✅ | — | Customer + POS flows |
| Initiate refund | ⚠️ | G5 | `OrdersSection`, `RefundManagementPage` — `useInitiateRefundMutation` only |
| Refund approve/reject | ❌ | G2 | `POST /api/payments/refund/{id}/approve|reject` — backend + tests; **no RTK, no UI** |
| `POST /api/payments/refund/request` | ❌ | G2 | Agent/manager approval queue endpoint; not wired (initiate uses different path) |
| `GET /api/payments` | ❌ | G2 | List all payments — unwired |
| Payment webhooks | ✅ | — | `POST /api/payments/webhook`, `/webhook/stripe` — external callers, not frontend |
| Razorpay prod webhook secret | ⚠️ | G1 | Placeholder rejected in prod profile (`RazorpayConfig`) |

---

### 2.8 Delivery & driver ops

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Driver accept / pending / status | ✅ | — | Driver app + `deliveryApi` |
| Auto-dispatch (manager UI) | ❌ | G3 | UI calls `POST /delivery/auto-dispatch`; backend is `POST /api/delivery/dispatch` |
| `POST /api/delivery/dispatch` | ❌ | G2 | Backend `AutoDispatchService`; not in RTK |
| `POST /api/delivery/location` | ⚠️ | G2 | Backend + WS `LiveTrackingService`; HTTP path unwired (driver uses WS + stale `location-update`) |
| `POST /api/delivery/{orderId}/otp` | ❌ | G2 | Delivery proof OTP — backend only |
| `POST /api/delivery/{trackingId}/status` | ❌ | G2 | Tracking status update — backend only |
| `POST /api/delivery/route` | ❌ | G2 | Route planning — backend only |
| `GET /api/delivery/zones` | ❌ | G3 | Canonical zones query exists; frontend uses dead `/delivery/zone/*` paths |
| `GET /api/delivery/metrics` | ❌ | G2 | MSW only; no UI |
| Driver performance (today) | ❌ | G3 | `GET /api/delivery/driver/{id}/performance/today` — dead RTK path |
| Driver last location (HTTP) | ❌ | G1 | Removed Phase 1; `UserServiceClient.getDriverLastLocation` warns Phase 3 WS cache |
| WebSocket location | ⚠️ | G5 | `websocketService`, `LiveMap`, driver app — partial; manager map store coords TODO |
| `ManagerDriverTrackingMap` | ⚠️ | G5 | TODO: fetch store coordinates for map center |
| SMS on delivery notification | ❌ | G1 | `CustomerNotificationService` TODO: SMS in production |

**Dead `deliveryApi` paths (11):** see §3.1.

---

### 2.9 Aggregator hub

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Commission config CRUD | ✅ | — | `AggregatorHubPage` + `aggregatorApi` + `AggregatorController` |
| Commission calculation on orders | ✅ | — | `AggregatorService` used in order pricing |
| Third-party order ingestion | ❌ | G1 | No Swiggy/Zomato/UberEats webhook/import; hub is config-only |
| Aggregator connection dual-write | ✅ | — | Mongo + PG with warn on PG failure |

---

### 2.10 Kiosk mode

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| `POST /api/users/kiosk/auto-login` | ⚠️ | G5 | `useKioskMode` raw `fetch` (not RTK); works if gateway routes |
| `POST /api/users/kiosk` (create) | ❌ | G2 | Backend exists; no admin UI |
| `POST /api/users/kiosk/{id}/regenerate` | ❌ | G2 | Backend exists; no admin UI |
| `kioskApi.ts` admin paths | ❌ | G3 | `/users/kiosk/create`, `/list`, `/regenerate-tokens` — wrong vs backend |
| `KioskSetupPage` | ⚠️ | G5 | Enables local storage mode; provisioning not wired |
| `POST /api/users/kiosk/{id}/deactivate` | ⚠️ | G6 | RTK in `kioskApi`; no MSW |

---

### 2.11 Customers & CRM

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| `GET/PATCH /api/customers/{id}` etc. | ✅ | — | Wired via `customerApi` in customer flows |
| `GET/POST /api/customers` (root) | ❌ | G2 | List/create at root — unwired in web (mobile/internal) |
| Phase 1 removed sub-resources | ❌ | G3 | 10 dead paths in `customerApi` (§3.1) |
| Loyalty GET sub-resource | ❌ | G1 | `CustomerServiceClient` — no canonical GET loyalty endpoint |
| Addresses GET sub-resource | ❌ | G1 | Client notes Phase 1 removal |
| `DELETE /api/preferences/{userId}` | ❌ | G2 | `UserPreferencesController` — unwired |
| Customer data retention job | ⚠️ | G1 | `CustomerDataRetentionService` — audit logs “placeholder” |

---

### 2.12 Reviews & ratings

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Manager review CRUD | ✅ | — | `reviewApi` + manager pages |
| Public rating page | ⚠️ | G5 | `PublicRatingPage` uses raw HTTP for token lookup |
| `POST /api/reviews/public/submit` | ⚠️ | G1 | Backend; `ReviewService` skips order token validation (TODOs) |
| Token details | ❌ | G1 | `getTokenDetails` returns hardcoded `{ valid: true }` |
| `POST /api/notifications/rating/send` | ❌ | G2 | `RatingController` — service trigger; no manager UI (RTK exists, unused) |
| `POST /api/reviews/complaints` | ❌ | G2 | Backend only |
| Dead `/api/responses/{id}` | ❌ | G3 | 2 paths in `reviewApi` — no controller |

---

### 2.13 Notifications & campaigns

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| List/read notifications | ✅ | — | Canonical query params |
| Campaign builder (create/list) | ✅ | — | Manager notifications section |
| `PATCH /api/campaigns/{id}` | ❌ | G2 | Edit campaign — backend only |
| `core NotificationService` | ❌ | G1 | `// TODO: Implement actual notification logic` |
| `ManagerNotificationService` | ❌ | G1 | `getManagerEmailsForStore` returns `List.of()` placeholder |
| Manager email digest / daily sales fetch | ⚠️ | G1 | Helper methods stubbed |

---

### 2.14 Menu management

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Canonical menu CRUD | ✅ | — | `/api/menu`, PATCH `/{id}`, bulk |
| `POST /api/menu/copy` | ⚠️ | G6 | RTK + backend; no MSW handler |
| `deleteAllMenuItems` | ❌ | G3 | Removed from public API; only in service/tests |
| Menu path overlap in matrix | ⚠️ | G6 | 10 menu rows flagged “stale” due to similar path tails (false-positive tail matching) |

---

### 2.15 Inventory & purchase orders

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Inventory CRUD / low stock | ✅ | — | Manager inventory section |
| Purchase orders | ✅ | — | `PurchaseOrderController` + `inventoryApi` + manager tabs |
| `DELETE /api/suppliers/{id}` | ❌ | G2 | Backend only |
| PO/shift/waste MSW gaps | ⚠️ | G6 | Several RTK endpoints lack handlers (§6) |

---

### 2.16 Stores & system ops

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Store read / create | ⚠️ | G5 | `storeApi` wired; manager uses subset |
| `PATCH /api/stores/{storeId}` | ❌ | G2 | Unwired |
| Dead store lookups | ❌ | G3 | `/stores/code/{code}`, `/region/{region}`, `/{id}/delivery-radius-check` |
| `useGetVersionQuery` | ✅ | — | ManagerShell footer |
| System health/info/updates | ❌ | G5 | `systemApi` hooks exported; only version used |
| Gateway system routes | ⚠️ | G5 | `/api/system/version` (gateway-local), `/api/system/updates/**` → core |

---

### 2.17 Analytics & BI

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Executive dashboard / cost analysis | ✅ | — | Wired to `analyticsApi` canonical BI paths |
| Staff leaderboard rank | ❌ | G1 | `AnalyticsService` — `rank(0)` TODO |
| Product trend | ❌ | G1 | Hardcoded `STABLE` TODO |
| Executive store performance | ❌ | G1 | `ExecutiveReportingService` TODO |
| Analytics event persistence | ❌ | G1 | “Phase 3 will persist to masova_analytics DB” |
| Intelligence Feign fallbacks | ⚠️ | G1 | Clients return empty lists on failure (order/inventory/user/customer) |

---

### 2.18 Users & admin

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Staff list / employees | ✅ | — | `userApi` + manager pages |
| `PATCH /api/users/{userId}` | ❌ | G2 | Unwired |
| `PATCH /api/users/{userId}/status` | ❌ | G2 | Unwired (deactivate uses different POST path) |
| `POST /api/users/{userId}/generate-pin` | ❌ | G2 | Unwired in UI (service supports bulk PIN migration) |
| User PG dual-write | ⚠️ | G1 | Phase 2 — Mongo primary, PG secondary |

---

### 2.19 Equipment & shifts

| Component | Status | Gap type | Detail |
|-----------|--------|----------|--------|
| Equipment CRUD | ✅ | — | Canonical `/api/equipment` |
| Shifts CRUD + bulk | ⚠️ | G6 | Wired; several shift endpoints lack MSW (§6) |

---

### 2.20 WebSockets

| Channel | Status | Detail |
|---------|--------|--------|
| Order updates (commerce) | ⚠️ | `useOrderWebSocket`, KDS; gateway route exists |
| Delivery location (logistics) | ⚠️ | Driver app + `LiveMap`; HTTP fallback removed |
| Customer order tracking | ⚠️ | `OrderTrackingPage`, `LiveTrackingPage` import WS types |
| Connection monitor | ⚠️ | `ConnectionMonitorProvider` watches `websocketService` |
| E2E verified against Dell | ❌ | Not live-probed in audit (`--live` unreachable in session) |

---

### 2.21 Test data (dev only)

| Endpoint | Status | Detail |
|----------|--------|--------|
| `POST /api/test-data/create-default-store` | ⚠️ | `@Profile("dev")`; gateway gap **expected** |
| `POST /api/test-data/create-test-stores` | ⚠️ | Same |
| `POST /api/test-data/migrate-users-to-storecode` | ⚠️ | Same |

---

### 2.22 Out of repo (not in web matrix)

| Surface | Status |
|---------|--------|
| MaSoVaCrewApp (RN 0.83) | Not audited in this pass |
| masova-mobile (RN 0.81) | Not audited |
| masova-support (Python ADK) | Required for manager AI section |

---

## 3. Dead frontend paths (56) — full list

RTK slices call these; **no** matching `@RestController` method exists in the Java monorepo.

| # | Method | Path | Source file |
|---|--------|------|-------------|
| 1 | GET | `/api/agent/chat` | agentApi.ts |
| 2 | POST | `/api/agent/chat` | agentApi.ts |
| 3 | GET | `/api/health` | agentApi.ts |
| 4 | GET | `/api/agents/demand-forecast/trigger` | agentApi.ts |
| 5 | POST | `/api/agents/demand-forecast/trigger` | agentApi.ts |
| 6 | GET | `/api/agents/inventory-reorder/trigger` | agentApi.ts |
| 7 | POST | `/api/agents/inventory-reorder/trigger` | agentApi.ts |
| 8 | GET | `/api/agents/churn-prevention/trigger` | agentApi.ts |
| 9 | POST | `/api/agents/churn-prevention/trigger` | agentApi.ts |
| 10 | GET | `/api/agents/review-response/trigger` | agentApi.ts |
| 11 | POST | `/api/agents/review-response/trigger` | agentApi.ts |
| 12 | GET | `/api/agents/shift-optimisation/trigger` | agentApi.ts |
| 13 | POST | `/api/agents/shift-optimisation/trigger` | agentApi.ts |
| 14 | GET | `/api/agents/kitchen-coach/trigger` | agentApi.ts |
| 15 | POST | `/api/agents/kitchen-coach/trigger` | agentApi.ts |
| 16 | GET | `/api/agents/dynamic-pricing/trigger` | agentApi.ts |
| 17 | POST | `/api/agents/dynamic-pricing/trigger` | agentApi.ts |
| 18 | GET | `/api/customers/:id/preferences` | customerApi.ts |
| 19 | PUT | `/api/customers/:id/preferences` | customerApi.ts |
| 20 | GET | `/api/customers/:id/order-stats` | customerApi.ts |
| 21 | POST | `/api/customers/:id/order-stats` | customerApi.ts |
| 22 | GET | `/api/customers/:id/notes` | customerApi.ts |
| 23 | POST | `/api/customers/:id/notes` | customerApi.ts |
| 24 | GET | `/api/customers/:id/verify-email` | customerApi.ts |
| 25 | PATCH | `/api/customers/:id/verify-email` | customerApi.ts |
| 26 | GET | `/api/customers/:id/verify-phone` | customerApi.ts |
| 27 | PATCH | `/api/customers/:id/verify-phone` | customerApi.ts |
| 28 | GET | `/api/delivery/auto-dispatch` | deliveryApi.ts |
| 29 | POST | `/api/delivery/auto-dispatch` | deliveryApi.ts |
| 30 | GET | `/api/delivery/route-optimize` | deliveryApi.ts |
| 31 | POST | `/api/delivery/route-optimize` | deliveryApi.ts |
| 32 | GET | `/api/delivery/location-update` | deliveryApi.ts |
| 33 | POST | `/api/delivery/location-update` | deliveryApi.ts |
| 34 | GET | `/api/delivery/driver/:id/performance/today` | deliveryApi.ts |
| 35 | GET | `/api/delivery/zone/check` | deliveryApi.ts |
| 36 | GET | `/api/delivery/zone/fee` | deliveryApi.ts |
| 37 | GET | `/api/delivery/zone/list` | deliveryApi.ts |
| 38 | GET | `/api/delivery/zone/validate` | deliveryApi.ts |
| 39 | GET | `/api/fiscal/summary` | fiscalApi.ts |
| 40 | GET | `/api/fiscal/failures` | fiscalApi.ts |
| 41 | GET | `/api/users/kiosk/create` | kioskApi.ts |
| 42 | POST | `/api/users/kiosk/create` | kioskApi.ts |
| 43 | GET | `/api/users/kiosk/list` | kioskApi.ts |
| 44 | GET | `/api/users/kiosk/:id/regenerate-tokens` | kioskApi.ts |
| 45 | POST | `/api/users/kiosk/:id/regenerate-tokens` | kioskApi.ts |
| 46 | GET | `/api/orders/store/avg-prep-time` | orderApi.ts |
| 47 | GET | `/api/orders/store/make-table/:id` | orderApi.ts |
| 48 | GET | `/api/orders/store/analytics/prep-time-by-item` | orderApi.ts |
| 49 | GET | `/api/orders/analytics/pos-staff/:id/performance` | orderApi.ts |
| 50 | GET | `/api/orders/store/analytics/prep-time-distribution` | orderApi.ts |
| 51 | GET | `/api/orders/staff/:id/date/:date` | orderApi.ts |
| 52 | GET | `/api/responses/:id` | reviewApi.ts |
| 53 | DELETE | `/api/responses/:id` | reviewApi.ts |
| 54 | GET | `/api/stores/code/:code` | storeApi.ts |
| 55 | GET | `/api/stores/region/:region` | storeApi.ts |
| 56 | GET | `/api/stores/:id/delivery-radius-check` | storeApi.ts |

### 3.2 Canonical replacements (where they exist)

| Dead path | Use instead |
|-----------|-------------|
| `POST /api/delivery/auto-dispatch` | `POST /api/delivery/dispatch` |
| `GET /api/delivery/zone/fee` | `GET /api/delivery/zones?fee=true&storeId=&lat=&lng=` |
| `GET /api/delivery/zone/validate` | `GET /api/delivery/zones?check=true&storeId=&lat=&lng=` |
| `GET /api/delivery/zone/list` | `GET /api/delivery/zones?storeId=` |
| `POST /api/users/kiosk/create` | `POST /api/users/kiosk` |
| `POST .../regenerate-tokens` | `POST /api/users/kiosk/{kioskUserId}/regenerate` |
| Customer sub-resources | `PATCH /api/customers/{id}` with fields; derive stats from orders query |
| Agent paths | `VITE_AGENT_URL` + `/agents/{name}/trigger` on Python service |

---

## 4. Backend endpoints with zero web wiring (41)

`frontendWiring: none` in matrix — no RTK slice match and no detected page import.

| Method | Path | Controller | Gateway | Notes |
|--------|------|------------|---------|-------|
| PATCH | `/api/campaigns/{id}` | CampaignController | routed | Edit campaign |
| GET | `/api/customers` | CustomerController | routed | MSW only |
| POST | `/api/customers` | CustomerController | routed | MSW only |
| POST | `/api/delivery/{orderId}/otp` | DeliveryController | routed | Delivery proof |
| POST | `/api/delivery/{trackingId}/status` | DeliveryController | routed | Tracking |
| POST | `/api/delivery/dispatch` | DeliveryController | routed | **Canonical auto-dispatch** |
| POST | `/api/delivery/gdpr/anonymize` | DeliveryController | **blocked** | Internal GDPR |
| POST | `/api/delivery/location` | DeliveryController | routed | Driver location HTTP |
| GET | `/api/delivery/metrics` | DeliveryController | routed | MSW only |
| POST | `/api/delivery/route` | DeliveryController | routed | Route plan |
| GET | `/api/delivery/zones` | DeliveryController | routed | Zone query |
| DELETE | `/api/orders/{orderId}` | OrderController | routed | MSW only |
| PATCH | `/api/orders/{orderId}` | OrderController | routed | |
| POST | `/api/orders/{orderId}/cancel-request` | OrderController | routed | |
| POST | `/api/orders/{orderId}/cancel-request/approve` | OrderController | routed | |
| POST | `/api/orders/{orderId}/cancel-request/reject` | OrderController | routed | |
| POST | `/api/orders/{orderId}/next-stage` | OrderController | routed | |
| POST | `/api/orders/{orderId}/status` | OrderController | routed | Canonical status transition |
| POST | `/api/orders/gdpr/anonymize` | OrderController | **blocked** | Internal GDPR |
| GET | `/api/payments` | PaymentController | routed | |
| POST | `/api/payments/gdpr/anonymize` | PaymentController | **blocked** | Internal GDPR |
| POST | `/api/payments/refund/{refundId}/approve` | RefundController | routed | |
| POST | `/api/payments/refund/{refundId}/reject` | RefundController | routed | |
| POST | `/api/payments/refund/request` | RefundController | routed | Approval queue |
| POST | `/api/payments/webhook` | WebhookController | routed | External |
| POST | `/api/payments/webhook/stripe` | StripeWebhookController | routed | External |
| DELETE | `/api/preferences/{userId}` | UserPreferencesController | routed | |
| POST | `/api/reviews/complaints` | ReviewController | routed | |
| POST | `/api/reviews/public/submit` | ReviewController | routed | UI: PublicRatingPage (token validation stub) |
| GET | `/api/staff/earnings/weekly` | EarningsController | routed | **Used in UI** via `earningsApi` (matrix path mismatch) |
| PATCH | `/api/stores/{storeId}` | StoreController | routed | |
| DELETE | `/api/suppliers/{id}` | SupplierController | routed | |
| POST | `/api/test-data/create-default-store` | TestDataController | **missing** | dev profile |
| POST | `/api/test-data/create-test-stores` | TestDataController | **missing** | dev profile |
| POST | `/api/test-data/migrate-users-to-storecode` | TestDataController | **missing** | dev profile |
| PATCH | `/api/users/{userId}` | UserController | routed | |
| POST | `/api/users/{userId}/generate-pin` | UserController | routed | |
| PATCH | `/api/users/{userId}/status` | UserController | routed | |
| POST | `/api/users/kiosk` | UserController | routed | Create kiosk user |
| POST | `/api/users/kiosk/{kioskUserId}/regenerate` | UserController | routed | |
| POST | `/api/users/kiosk/auto-login` | UserController | routed | Raw fetch in `useKioskMode` |

---

## 5. Broken or mismatched path wiring

These are especially damaging because **UI exists** and fails at runtime.

| # | UI / slice | Calls | Should call | Pages affected |
|---|------------|-------|-------------|----------------|
| 1 | `deliveryApi` `autoDispatch` | `POST /delivery/auto-dispatch` | `POST /api/delivery/dispatch` | `DeliveryManagementPage`, `OrdersSection` |
| 2 | `deliveryApi` zone helpers | `/delivery/zone/*` | `/api/delivery/zones?...` | Customer checkout / delivery fee |
| 3 | `deliveryApi` / `driverApi` | `POST /delivery/location-update` | WebSocket `/app/location-update` or `POST /api/delivery/location` | Driver app |
| 4 | `fiscalApi` | `/fiscal/summary`, `/fiscal/failures` | Needs new `FiscalController` | `FiscalCompliancePage` |
| 5 | `kioskApi` admin | `/users/kiosk/create`, `/list`, `/regenerate-tokens` | `/api/users/kiosk`, `/{id}/regenerate` | No page yet |
| 6 | `earningsApi` | `staff/earnings/...` (no leading `/`) | `/staff/earnings/...` or `/api/staff/earnings/...` per baseUrl convention | `StaffManagementPage`, `StaffLeaderboardPage` |
| 7 | `customerApi` | 10 sub-resource paths | Phase 1 canonical alternatives | Legacy CRM UI if any |
| 8 | `orderApi` | 6 legacy analytics paths | `/api/orders/analytics?type=...` | Legacy dashboards |
| 9 | `reviewApi` | `/api/responses/{id}` | Removed feature | Unknown |
| 10 | `storeApi` | code/region/radius-check | Phase 1 removals | Legacy store picker |

---

## 6. RTK endpoints without MSW handlers (29)

Tests using MSW will 404 or hit network for these:

| Method | Path | Slice |
|--------|------|-------|
| GET | `/api/aggregators/connections` | aggregatorApi |
| PUT | `/api/aggregators/connections` | aggregatorApi |
| POST | `/api/auth/google` | authApi |
| PATCH | `/api/delivery/driver/{driverId}/status` | deliveryApi |
| POST | `/api/delivery/verify` | deliveryApi |
| DELETE | `/api/equipment/{equipmentId}` | equipmentApi |
| POST | `/api/equipment/{equipmentId}/maintenance` | equipmentApi |
| GET | `/api/gdpr/audit/{userId}` | gdprApi |
| DELETE | `/api/gdpr/consent` | gdprApi |
| GET | `/api/gdpr/export/{userId}` | gdprApi |
| POST | `/api/gdpr/request/{requestId}/process` | gdprApi |
| POST | `/api/menu/copy` | menuApi |
| POST | `/api/notifications/rating/send` | notificationApi |
| DELETE | `/api/purchase-orders/{id}` | inventoryApi |
| GET | `/api/purchase-orders/{id}` | inventoryApi |
| PATCH | `/api/purchase-orders/{id}` | inventoryApi |
| DELETE | `/api/shifts/{shiftId}` | shiftApi |
| GET | `/api/shifts/{shiftId}` | shiftApi |
| POST | `/api/shifts/{shiftId}/complete` | shiftApi |
| POST | `/api/shifts/{shiftId}/confirm` | shiftApi |
| POST | `/api/shifts/{shiftId}/start` | shiftApi |
| POST | `/api/shifts/bulk` | shiftApi |
| POST | `/api/shifts/copy-week` | shiftApi |
| GET | `/api/stores` | storeApi |
| POST | `/api/stores` | storeApi |
| GET | `/api/stores/{storeId}` | storeApi |
| POST | `/api/users/kiosk/{kioskUserId}/deactivate` | kioskApi |
| DELETE | `/api/waste/{id}` | inventoryApi |
| PATCH | `/api/waste/{id}` | inventoryApi |

**Handlers that exist but are unused by RTK:** `earningsHandlers.ts`, `gdprHandlers.ts`, `tipHandlers.ts`, `systemHandlers.ts`, `equipmentHandlers.ts`, `shiftHandlers.ts` — created in handoff branch; verify all paths covered.

---

## 7. Exported RTK hooks with no page usage

Hooks defined in slice exports but **not imported** by any file under `frontend/src/pages/` or `frontend/src/apps/`:

| Hook | Slice | Backend ready? |
|------|-------|------------------|
| `useGetPendingApprovalSessionsQuery` | sessionApi | Yes (returns empty stub) |
| `useSetPayRateMutation` | earningsApi | Yes |
| `useProcessGdprRequestMutation` | gdprApi | Yes |
| `useExportUserDataQuery` / `useLazyExportUserDataQuery` | gdprApi | Yes |
| `useGetGdprAuditLogQuery` | gdprApi | Yes |
| `useGetConsentsQuery` | gdprApi | Yes |
| `useRevokeConsentMutation` | gdprApi | Yes |
| `useCheckForUpdatesQuery` | systemApi | Yes |
| `useGetUpdateStatusQuery` | systemApi | Yes |
| `useGetSystemHealthQuery` | systemApi | Yes |
| `useGetSystemInfoQuery` | systemApi | Yes |

**Missing entirely (no RTK mutation):** `approveRefund`, `rejectRefund`, `cancelRequest`, `approveCancelRequest`, `rejectCancelRequest`, `dispatchDriver` (canonical), `createKioskUser`, `regenerateKioskToken`.

---

## 8. Backend implementation stubs (non-HTTP)

| Location | Issue |
|----------|-------|
| `GermanyTseFiscalSigner` | Phase 1 stub; Phase 2 TSE hardware API |
| `ItalyRtFiscalSigner` | Hardware API stub |
| `BelgiumFdmFiscalSigner` | FDM stub |
| `HungaryNtcaFiscalSigner` | NTCA stub; Phase 2 OSCAR + Redis retry |
| `FranceNf525FiscalSigner` | NF525 stub |
| `UkMtdFiscalSigner` | No `uk_vat_ledger` write |
| `FiscalSigningService` | No `fiscal_signatures` table write |
| `WorkingSessionController.getPendingSessions` | Returns empty list |
| `ReviewService.createPublicReview` | 3× TODO for order token service |
| `ReviewService.getTokenDetails` | Hardcoded valid=true |
| `CustomerService.anonymizeAndDeleteCustomer` | TODO cascade to order/payment services |
| `CustomerDataRetentionService` | Audit log placeholder |
| `NotificationService` (core user) | TODO implement |
| `ManagerNotificationService` | Manager emails/stores return empty |
| `CustomerNotificationService` | TODO SMS in production |
| `AnalyticsService` | rank=0, trend=STABLE TODOs |
| `ExecutiveReportingService` | TODO real store performance |
| `AnalyticsService` (intel) | Phase 3 DB persistence comment |
| `PaymentServiceClient` (GDPR) | Payment methods → empty list |
| `DeliveryServiceClient` (GDPR) | Customer deliveries → empty list |
| `UserServiceClient` (logistics) | `getDriverLastLocation` removed |
| `commerce CustomerServiceClient` | `updateOrderStats` skipped — no Phase 1 endpoint |
| `OrderService` terminal transitions | Some paths return empty `List.of()` for allowed next states |
| `RazorpayConfig` | Prod rejects placeholder webhook secret |

---

## 9. Gateway gaps (3) — expected for dev

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/test-data/create-default-store` | `@Profile("dev")` — intentionally not routed in prod gateway |
| POST | `/api/test-data/create-test-stores` | Same |
| POST | `/api/test-data/migrate-users-to-storecode` | Same |

---

## 10. Internal-only endpoints (gateway blocked)

Not frontend gaps — called service-to-service with `X-Internal-Service`:

| Method | Path |
|--------|------|
| POST | `/api/orders/gdpr/anonymize` |
| POST | `/api/payments/gdpr/anonymize` |
| POST | `/api/delivery/gdpr/anonymize` |

---

## 11. Raw HTTP bypassing RTK

| File | Path | Issue |
|------|------|-------|
| `useKioskMode.ts` | `POST .../users/kiosk/auto-login` | Should migrate to `kioskApi` |
| `PublicRatingPage.tsx` | `GET /api/reviews/public/token/{token}` | Raw fetch; backend token validation stubbed |
| `useTokenRefresh.ts` | `/api/auth/refresh` | Fixed to canonical (handoff) |

---

## 12. Audit script limitations

The matrix **under-detects UI** when:
- Pages are lazy-loaded (`React.lazy` in `ManagerShell`, `OrdersSection`)
- Hooks are used in `apps/DriverApp` but audit scans limited paths
- `earningsApi` paths omit leading `/` so RTK ↔ backend matching fails

**Manually verified UI that matrix shows as “no UI”:**
- `AggregatorHubPage` → `aggregatorApi` ✅
- `StaffManagementPage` → `earningsApi`, `tipApi` ✅
- `FiscalCompliancePage` → `fiscalApi` (dead backend) ❌
- `AIAgentsSection` → `agentApi` (external service) ⚠️

---

## 13. Suggested fix order (reference only)

| Priority | Items | Count |
|----------|-------|------:|
| P0 | Auto-dispatch path, fiscal API or remove UI, refund approve/reject UI | 3 features |
| P1 | Cancel-request workflow, GDPR manager console, kiosk admin, delivery zones canonical | 4 features |
| P2 | Remove 56 dead RTK paths, MSW for 29 endpoints, session pending implementation | 85+ items |
| P3 | Fiscal hardware Phase 2, MTD ledger, stripe tax, aggregator ingestion | Long-horizon |

---

## 14. Status

**Software E2E on Mac: complete.** Commits on `main` (integration handoff + gaps session).

**Next (optional):** Dell live smoke — `docker compose` on Dell, `--live http://192.168.50.88:8080`, manager browser check.

---

*Historical inventory + session log. Live counts: `INTEGRATION_MATRIX.json`.*