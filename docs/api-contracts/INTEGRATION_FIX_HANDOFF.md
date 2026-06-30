# Integration Fix Handoff (2026-06-30)

## Status: **COMPLETE**

All checklist items below are `[x]`. Success criteria verified (see §Success criteria).  
**Gaps workstream (`INTEGRATION_GAPS_COMPLETE.md`):** **COMPLETE** (2026-06-30) — `frontendOnlyPaths=0`, `unwiredBackendPublic=18` (internal/low-priority).  
**Remaining:** Dell live probe / deploy only.

**Purpose (historical):** Canonical path / gateway / RTK wiring for P0 mismatches. Ground truth = Java controllers + `GatewayConfig.java` + `frontend/src/store/api/*.ts`. Do NOT trust `docs/MASOVA_MASTER_REFERENCE.md` or `API_MISMATCH_REPORT.json` (Jan 2026).

## DB required?

**No** for this workstream. Path/wiring fixes are HTTP-contract only. Mongo/Postgres schemas unchanged. Only revisit DB if live tests show request **body** mismatches (e.g. session start body shape).

## Audit tooling

```bash
node scripts/integration-matrix-audit.js
node scripts/integration-matrix-audit.js --live http://192.168.50.88:8080
```

Outputs: `docs/api-contracts/INTEGRATION_MATRIX.json`, `INTEGRATION_MATRIX.md`

**Complete gap inventory (all issues, not just P0):** `docs/api-contracts/INTEGRATION_GAPS_COMPLETE.md`

## Fix checklist (update `[x]` as done)

### Gateway (`api-gateway/.../GatewayConfig.java`)
- [x] `/api/staff/**` → core 8085 (exclude `/api/staff/tips/**`)
- [x] `/api/staff/tips/**` → commerce 8084
- [x] `/api/aggregators/**` → commerce 8084
- [x] `/api/system/updates/**` → core 8085
- [x] Verify compile on Dell: `cd api-gateway && mvn compile -q` (verified locally)

### RTK slices — canonical paths
- [x] `sessionApi.ts` → `/api/sessions/*`
- [x] `menuApi.ts` → `/api/menu?…`, PATCH `/api/menu/{id}`, POST `/api/menu/bulk`
- [x] `menuApi.ts` — `copyMenu` endpoint + remove `deleteAllMenuItems` (no backend)
- [x] `equipmentApi.ts` → `/api/equipment`
- [x] `orderApi.ts` → kitchen + analytics canonical
- [x] `notificationApi.ts` → canonical list/read paths
- [x] `authApi.ts` / `userApi.ts` / `baseQueryWithAuth` → `/api/auth/*`
- [x] `gdprApi.ts` — leading `/` on paths
- [x] `analyticsApi.ts` — leading `/` on paths
- [x] `deliveryApi.ts`, `inventoryApi.ts` — canonical paths (staleWiring = 0)
- [x] `earningsApi.ts`, `tipApi.ts`, `systemApi.ts` — wired to StaffManagement, StaffLeaderboard, ManagerShell
- [x] `fiscalApi.ts` — no backend; kept as frontend-only stub (FiscalCompliancePage)

### Raw axios → RTK or canonical paths
- [x] `GdprRequests.tsx` — canonical GET path (hooks migration optional)
- [x] `CookieConsent.tsx` — `POST /api/gdpr/consent`
- [x] `ExecutiveDashboardPage.tsx` → `useGetExecutiveSummaryQuery`
- [x] `CostAnalysisPage.tsx` → `useGetCostAnalysisQuery`
- [x] `useTokenRefresh.ts` → `/api/auth/refresh`
- [x] `useKioskMode.ts` — verified `POST /api/users/kiosk/auto-login` (canonical)

### MSW handlers (`frontend/src/test/mocks/handlers/`)
- [x] `sessionHandlers.ts`, `menuHandlers.ts`, `orderHandlers.ts`, `notificationHandlers.ts`
- [x] `userHandlers.ts` — `/auth/change-password`, `/auth/validate-pin`
- [x] Add: equipment, shift, gdpr, earnings, tip, system handlers

### Integration tests
- [x] `order-creation-flow.test.ts`, `delivery-dispatch-flow.test.ts`

### Unit tests (`frontend/src/store/api/*.test.ts`)
- [x] Update MSW URLs in menu, session, notification, equipment tests
- [x] Run: `cd frontend && npm test -- --run`

### UI wiring (slices in store, zero imports)
- [x] `earningsApi` → StaffManagementPage + StaffLeaderboardPage
- [x] `tipApi` → StaffManagementPage
- [x] `systemApi` → ManagerShell sidebar version footer
- [x] `gdprApi` → GdprRequests, CookieConsent (RTK hooks)

## Canonical path quick reference

| Area | Canonical | Deprecated |
|------|-----------|------------|
| Sessions | `POST /api/sessions`, `POST /api/sessions/end`, `GET /api/sessions?…` | `/api/users/sessions/*` |
| Menu | `GET /api/menu?category=&search=` | `/api/menu/public/*`, `/api/menu/items` |
| Equipment | `GET /api/equipment?status=` | `/api/kitchen-equipment/*` |
| Orders KDS | `GET /api/orders?kitchen=true` | `/api/orders/kitchen` |
| Notifications | `GET /api/notifications?userId=&unread=` | `/api/notifications/user/{id}/*` |
| Auth | `POST /api/auth/refresh` | `/api/users/refresh` |
| GDPR | `POST /api/gdpr/consent` | `/api/gdpr/consent/grant` |
| BI | `GET /api/bi/reports?type=executive-summary&period=` | `/api/bi/executive-summary` |

## Out of scope (separate repos)
- MaSoVaCrewApp, masova-mobile, masova-support agent paths

## Success criteria

| Criterion | Target | Verified |
|-----------|--------|----------|
| `staleFrontendWiring` | 0 | **0** |
| `unwiredSlices` | 0 | **0** |
| `gatewayGaps` | ≤ 3 (test-data only) | **3** |
| `npm test -- --run` | all pass | **104 files, 1415 passed** (3 skipped) |

## Latest audit snapshot (2026-06-30)

| Metric | Value | In handoff scope? |
|--------|------:|-------------------|
| gatewayGaps | 3 | ✅ (test-data only) |
| staleFrontendWiring | 0 | ✅ |
| unwiredSlices | 0 | ✅ |
| unwiredBackendPublic | 33 | ❌ — see gaps doc |
| frontendOnlyPaths | 56 | ❌ — see gaps doc |
| noMswCoverage | 56 | ❌ — see gaps doc |
| noTestCoverage | 60 | ❌ — see gaps doc |

**Not run:** live probe `node scripts/integration-matrix-audit.js --live http://192.168.50.88:8080`  
**Not verified on Dell:** `cd api-gateway && mvn compile -q` (Mac compile only)

## Post-gaps snapshot (2026-06-30)

| Metric | Value |
|--------|------:|
| frontendOnlyPaths | **0** |
| staleFrontendWiring | **0** |
| unwiredBackendPublic | **18** (webhooks, internal GDPR, test-data) |
| gatewayGaps | **3** (test-data dev-only) |
| frontend tests | **1425** passed |

Full history: **`INTEGRATION_GAPS_COMPLETE.md`** §1.

## Still open (Dell / hardware / external)

- Live probe: `node scripts/integration-matrix-audit.js --live http://192.168.50.88:8080`
- Dell gateway compile + service deploy
- Fiscal hardware signers (Phase 2), `uk_vat_ledger` / `stripe_tax` persistence
- `agentApi` → `masova-support` (separate repo)
- Aggregator third-party order ingestion

## Git state

`main` pushed to `origin/main` — integration + gaps workstream commits on GitHub.