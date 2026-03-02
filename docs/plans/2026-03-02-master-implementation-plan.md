# MaSoVa Master Implementation Plan
**Date:** 2026-03-02
**Updated:** 2026-03-02 (post-architecture review)
**Author:** Architecture Review
**Status:** Active — supersedes all prior task lists
**Purpose:** Single source of truth for all pending work, branching strategy, and execution order.

---

## Codebase Reality Check (as of 2026-03-02)

| Area | Status |
|---|---|
| Order flow (RabbitMQ events, OrderStatus enum, DINE_IN) | ✅ Complete |
| API Gateway `/api/sessions/**` route | ✅ Done |
| GitHub repo cleanup (archive/, scripts/, templates) | ✅ Done |
| Product site base (OrderFlowSection, constants, CSS) | ✅ ~80% done |
| Store selection (AddressGate, deliveryFeeINR) | ❌ Not started |
| Dual-path `/api/v1/*` still in 3 controllers | ❌ Needs removal |
| API reduction (471 → 50 endpoints) | ❌ Not started |
| PostgreSQL migration (polyglot DB) | ❌ Not started |
| Redis DriverStatusService + OTP | ❌ Not started |
| Pact contract tests | ❌ Not started |
| Unit tests (104 Vitest files) | ❌ Not started |
| E2E tests (13 Playwright specs) | ❌ Not started |
| AI agents (masova-support) | ⚠️ 1 agent, needs 7 |

---

## Part 1: Branching Strategy

### Model: GitHub Flow + Trunk-Based (Hybrid)

We use **GitHub Flow** (feature branches → PR → merge to `main`) with a structured naming convention, protected `main`, and no long-lived branches. This is the right model for a 2-person Mac+Dell team with frequent cross-machine work.

### Branch Naming Convention

| Prefix | Use Case | Examples |
|---|---|---|
| `feat/` | New features, new endpoints, new components | `feat/store-selection`, `feat/address-gate` |
| `fix/` | Bug fixes, broken behaviour | `fix/delivery-fee-hardcode`, `fix/kds-ready-status` |
| `refactor/` | Restructuring without behaviour change | `refactor/api-reduction-core`, `refactor/customer-controller` |
| `chore/` | Tooling, deps, config, CI | `chore/flyway-setup`, `chore/docker-postgres` |
| `docs/` | Documentation only | `docs/architecture-update` |
| `test/` | Test files only | `test/pact-contracts`, `test/e2e-specs` |
| `migration/` | Database migration work | `migration/users-to-postgres`, `migration/orders-to-postgres` |
| `release/` | Version bump + changelog prep | `release/v3.0.0` |
| `agent/` | AI agent development | `agent/inventory-manager`, `agent/shift-scheduler` |

### Branch Ownership (Mac vs Dell)

| Machine | Branch Focus |
|---|---|
| **Mac M1** | `feat/frontend-*`, `feat/mobile-*`, `test/*`, `docs/*`, `agent/*` |
| **Dell i3** | `feat/backend-*`, `refactor/*`, `migration/*`, `chore/*` |
| **Either** | `fix/*` (small) |

### Rules

1. **Never commit directly to `main`** — always branch + PR
2. **One feature per branch** — no combining store-selection + API reduction in one branch
3. **Squash merge into main** — keeps history clean, one commit per feature
4. **Delete branch after merge** — run `git branch -d` locally, delete on GitHub
5. **Sync before starting work**: always `git pull origin main` before creating a new branch
6. **Cross-machine handoff**: `git push` on current machine, `git pull` on other machine — never both machines on same branch simultaneously
7. **PR even when solo** — forces you to review your own diff; CI must pass before merge

### Protected `main` Rules (set on GitHub)

- Require PR before merging: ✅
- Required status checks: `ci / backend` + `ci / frontend`
- Require branches up to date: ✅
- No force pushes: ✅
- No deletions: ✅

### Branch Lifecycle Example

```
git checkout main && git pull
git checkout -b feat/store-selection
# ... work, commit often ...
git push -u origin feat/store-selection
# Open PR → GitHub → main
# CI passes → Squash merge → Delete branch
git checkout main && git pull
git branch -d feat/store-selection
```

---

## Part 2: Execution Order (All Plans)

Work is ordered by: **dependencies first, highest user impact second, risk last.**

```
Phase A: Foundation (no dependencies, unblocks everything)
  A1 → Store selection backend + frontend          [feat/store-selection]
  A2 → Product site overhaul completion            [feat/product-site-overhaul]
  A3 → GitHub repo final cleanup                   [chore/github-final-cleanup]

Phase B: API Reduction (471 → 50 endpoints)
  B1 → core-service        238 → 15 endpoints      [refactor/api-reduction-core]
  B2 → commerce-service     53 → 15 endpoints      [refactor/api-reduction-commerce]
  B3 → logistics-service    51 → 12 endpoints      [refactor/api-reduction-logistics]
  B4 → payment-service      15 →  5 endpoints      [refactor/api-reduction-payment]
  B5 → intelligence-service 19 →  3 endpoints      [refactor/api-reduction-intel]
  B6 → API Gateway         ~47 → ~15 routes        [refactor/api-reduction-gateway]
  B7 → test-api-full.js update for 50 endpoints    [test/api-spec-update]

Phase C: Database Migration (independent of API reduction, can run in parallel on Dell)
  C1 → PostgreSQL + Flyway setup                   [chore/postgres-setup]
  C2 → Users + Auth schema + dual-write            [migration/users-to-postgres]
  C3 → Customers schema + dual-write               [migration/customers-to-postgres]
  C4 → Orders schema + dual-write                  [migration/orders-to-postgres]
  C5 → Payments + Transactions schema              [migration/payments-to-postgres]
  C6 → Delivery + Sessions + Inventory schemas     [migration/logistics-to-postgres]
  C7 → Redis DriverStatusService + OTP             [feat/redis-driver-status]
  C8 → Phase 2: switch reads to PostgreSQL         [migration/postgres-phase2-reads]
  C9 → Phase 3: cut over + Phase 4: cleanup        [migration/postgres-cutover]

Phase D: Testing (after API reduction + DB stable)
  D1 → Pact contract tests (7 files, Vitest)       [test/pact-contracts]
  D2 → Unit tests fix (104 Vitest files)           [test/unit-fix]
  D3 → E2E tests fix (13 Playwright specs)         [test/e2e-fix]

Phase E: AI Agents (masova-support overhaul)
  E1 → Customer Support Agent upgrade              [agent/customer-support]
  E2 → Inventory Manager Agent                     [agent/inventory-manager]
  E3 → Shift Scheduler Agent                       [agent/shift-scheduler]
  E4 → Revenue Insights Agent                      [agent/revenue-insights]
  E5 → Dispatch Optimizer Agent                    [agent/dispatch-optimizer]
  E6 → Menu Performance Agent                      [agent/menu-performance]
  E7 → Waste Reduction Agent                       [agent/waste-reduction]
```

---

## Part 3: All Tasks (Priority Order)

---

### PHASE A — FOUNDATION

---

#### A1.1 — Backend: LocationQueryResult DTO + StoreService.findByLocation()
**Branch:** `feat/store-selection`
**Service:** core-service
**What:** Create `LocationQueryResult.java` DTO. Add `findByLocation(lat, lng)` method to `StoreService.java` using Haversine distance + zone-based fee resolution.
**Test:** `curl "http://192.168.50.88:8085/api/stores/public/find-by-location?latitude=17.395&longitude=78.491"`
**Commit:** `feat(core): add findByLocation endpoint with zone-based delivery fee`

#### A1.2 — Backend: GET /api/stores/public/find-by-location endpoint
**Branch:** `feat/store-selection`
**Service:** core-service → StoreController
**What:** Add `@GetMapping("/public/find-by-location")` to StoreController — public, no auth.
**Test:** Same curl as A1.1, verify JSON shape matches LocationQueryResult.
**Commit:** `feat(core): expose GET /stores/public/find-by-location`

#### A1.3 — Frontend: storeApi.ts — findByLocation RTK Query endpoint
**Branch:** `feat/store-selection`
**File:** `frontend/src/store/api/storeApi.ts`
**What:** Add `LocationQueryResult` TypeScript interface, `findByLocation` builder.query, export `useFindByLocationQuery` + `useLazyFindByLocationQuery`.
**Test:** `npx tsc --noEmit` — no errors

#### A1.4 — Frontend: cartSlice.ts — delivery location state
**Branch:** `feat/store-selection`
**File:** `frontend/src/store/slices/cartSlice.ts`
**What:** Add `deliveryFeeINR`, `deliveryZone`, `deliveryLocation`, `withinDeliveryArea`, `estimatedDeliveryMinutes`, `addressGateConfirmed` to CartState. Add `setDeliveryLocation` and `clearDeliveryLocation` reducers. Replace hardcoded `29` and `50` with defaults driven by Redux.
**Test:** `npx tsc --noEmit` — no errors

#### A1.5 — Frontend: AddressGate component
**Branch:** `feat/store-selection`
**File:** `frontend/src/components/common/AddressGate.tsx` (CREATE)
**What:** Full-screen overlay with Google Places autocomplete, calls `useLazyFindByLocationQuery`, shows zone/fee result card, dispatches `setDeliveryLocation` on confirm.
**Test:** `npx tsc --noEmit` — no errors

#### A1.6 — Frontend: Wire AddressGate into App.tsx (customer routes only)
**Branch:** `feat/store-selection`
**File:** `frontend/src/App.tsx`
**What:** Import AddressGate synchronously. Wrap customer-facing routes in `<CustomerGate>` wrapper. Manager/staff/kitchen/driver/POS routes must NOT show the gate.
**Test:** Navigate to `/` in browser — gate appears. Navigate to `/manager` — gate does NOT appear.

#### A1.7 — Frontend: CartPage uses Redux deliveryFeeINR
**Branch:** `feat/store-selection`
**File:** `frontend/src/pages/customer/CartPage.tsx`
**What:** Replace hardcoded `₹50` / `deliveryFee: 29` with `selectDeliveryFeeINR` selector. Show ETA if `withinDeliveryArea`.
**Test:** Add item to cart, confirm address in gate, verify fee shown matches zone fee.

#### A1.8 — Frontend: StoreSelector simplification
**Branch:** `feat/store-selection`
**File:** `frontend/src/components/StoreSelector.tsx`
**What:** Remove GPS auto-select `useEffect` from customer variant. Add "Change" link that dispatches `clearDeliveryLocation` to re-open gate. Keep manager dropdown unchanged.
**Commit:** `feat: Dominos-style address gate with zone-based delivery pricing — complete`

---

#### A2.1 — Product site: SupportChat glassmorphism widget
**Branch:** `feat/product-site-overhaul`
**File:** `frontend/src/apps/ProductSite/components/SupportChat.tsx` (CREATE)
**What:** Replace `SupportFAB.tsx` stub with full glassmorphism chat widget. Dark floating button bottom-right. Expands to chat panel. Connects to `/agent/chat` on masova-support FastAPI (port 8000).

#### A2.2 — Product site: Real app screenshots in HeroSection + FeaturesGrid
**Branch:** `feat/product-site-overhaul`
**Files:** `frontend/src/apps/ProductSite/components/HeroSection.tsx`, `FeaturesGrid.tsx`
**What:** Capture screenshots from the live running app at `localhost:3000/order`. Save as static assets in `frontend/public/screenshots/`. Embed in browser mockup.

#### A2.3 — Product site: Expand AI agents 3 → 5 in AIAgentsSection
**Branch:** `feat/product-site-overhaul`
**File:** `frontend/src/apps/ProductSite/constants.ts`
**What:** Add 2 new AI agent cards. Current 3: Order Status, Refund, Menu. Add: Complaint Handler, Store Hours.

#### A2.4 — Product site: Resolve all dead links in Footer
**Branch:** `feat/product-site-overhaul`
**File:** `frontend/src/apps/ProductSite/components/Footer.tsx`
**What:** Every link must go somewhere real. GitHub repo link, product demo link, privacy policy. Remove or disable links with no destination.
**Commit:** `feat: product site overhaul — screenshots, 5 AI agents, support chat, live links`

---

#### A3.1 — GitHub: Move remaining stray files at root
**Branch:** `chore/github-final-cleanup`
**What:** Move 13 PNG screenshots, MaSoVa.pdf → `archive/misc/`. Add `.masova-config` + `.masova-config.bak` to `.gitignore`.

#### A3.2 — GitHub: Update .gitignore for all remaining gaps
**Branch:** `chore/github-final-cleanup`
**What:** Add: `*.pdf`, `*.bak`, `scroll*.png`, `current-state.png`, `fixed-state.png`, `fullpage.png`, `homepage-hero.png`, `dribbble-ref.png`, `.masova-config`, `.masova-config.bak`

#### A3.3 — GitHub: Write docs/ARCHITECTURE.md
**Branch:** `chore/github-final-cleanup`
**File:** `docs/ARCHITECTURE.md` (CREATE)
**What:** ASCII diagram of 6 services + ports. Key data flows: order placement, delivery tracking, payment. Links to each service README.
**Commit:** `chore: final repo cleanup — stray files, .gitignore, architecture doc`

---

### PHASE B — API REDUCTION (471 → 50 ENDPOINTS)

**Prerequisite:** All Phase A complete. Work in order B1→B7.

**Key consolidation techniques:**
- Query params replace filter endpoints (`GET /menu?category=PIZZA&dietary=VEG`)
- Action in body replaces separate endpoints (`PATCH /shifts/{id}` with `{action: "confirm"}`)
- Polymorphic body replaces variant endpoints (`POST /delivery/verify` with `{method: "otp"}`)

---

#### B1 — core-service API reduction (238 → 15 endpoints)
**Branch:** `refactor/api-reduction-core`

Target endpoints:
1. `POST /api/auth/login`
2. `POST /api/auth/register`
3. `POST /api/auth/refresh`
4. `POST /api/auth/logout`
5. `GET /api/users/{userId}`
6. `PUT /api/users/{userId}`
7. `PATCH /api/users/{userId}/status`
8. `GET /api/users?type=DRIVER&storeId=X`
9. `POST /api/sessions/start`
10. `POST /api/sessions/end`
11. `GET /api/shifts?employeeId=X&startDate=Y`
12. `PATCH /api/shifts/{shiftId}` (action in body)
13. `GET /api/stores?active=true`
14. `GET /api/stores/{storeId}`
15. `PUT /api/stores/{storeId}`

**Sub-tasks:**
- Add `@Profile("dev")` to TestDataController
- UserController — query params replace 9 filter endpoints
- StoreController — remove duplicates, ⚠️ keep `find-by-location`
- WorkingSessionController — merge start/end (gateway route already exists)
- CustomerController — remove `/api/v1/customers` dual path
- ReviewController + merge ResponseController
- Notification, UserPreferences, GDPR, Campaign, SystemInfo → query params
**Commit:** `refactor(core): reduce from 238 to 15 endpoints`

#### B2 — commerce-service API reduction (53 → 15 endpoints)
**Branch:** `refactor/api-reduction-commerce`

Target endpoints:
1. `GET /api/menu?storeId=X&category=PIZZA`
2. `POST /api/menu`
3. `PUT /api/menu/{itemId}`
4. `PATCH /api/menu/{itemId}/availability`
5. `POST /api/orders`
6. `GET /api/orders/{orderId}`
7. `GET /api/orders?storeId=X&status=PREPARING`
8. `PATCH /api/orders/{orderId}/status`
9. `PATCH /api/orders/{orderId}/assign-driver`
10. `PATCH /api/orders/{orderId}/quality-checkpoint`
11. `PATCH /api/orders/{orderId}/delivery`
12. `GET /api/orders/analytics?metric=prep-time`
13. `GET /api/kitchen-equipment?storeId=X`
14. `PATCH /api/kitchen-equipment/{equipmentId}`
15. `GET /api/ratings/token/{token}`

**Note:** Removing `/api/v1/orders` is breaking — update frontend RTK Query hooks in same PR.
**Commit:** `refactor(commerce): reduce from 53 to 15 endpoints`

#### B3 — logistics-service API reduction (51 → 12 endpoints)
**Branch:** `refactor/api-reduction-logistics`

Target endpoints:
1. `POST /api/delivery/dispatch`
2. `POST /api/delivery/accept`
3. `POST /api/delivery/location-update`
4. `GET /api/delivery/track/{orderId}`
5. `GET /api/delivery/eta/{orderId}`
6. `POST /api/delivery/verify` (method in body: otp/photo/signature/contactless)
7. `PATCH /api/delivery/{trackingId}/status`
8. `GET /api/delivery/zone?storeId=X&lat=Y&lng=Z`
9. `GET /api/delivery/drivers/available?storeId=X`
10. `GET /api/delivery/performance?driverId=X`
11. `GET /api/inventory?storeId=X`
12. `PATCH /api/inventory/{itemId}` (action in body: adjust/reserve/consume)

**Commit:** `refactor(logistics): reduce from 51 to 12 endpoints`

#### B4 — payment-service API reduction (15 → 5 endpoints)
**Branch:** `refactor/api-reduction-payment`

Target endpoints:
1. `POST /api/payments/initiate`
2. `POST /api/payments/verify`
3. `GET /api/payments/{transactionId}`
4. `GET /api/payments?storeId=X&date=Y`
5. `POST /api/payments/refund`

**Commit:** `refactor(payment): reduce from 15 to 5 endpoints`

#### B5 — intelligence-service API reduction (19 → 3 endpoints)
**Branch:** `refactor/api-reduction-intel`

Target endpoints:
1. `GET /api/analytics?storeId=X&metric=sales` (metric: sales/trends/breakdown/peak-hours/staff/products/drivers)
2. `GET /api/bi?storeId=X&report=forecast` (report: forecast/behavior/churn/demand/cost/benchmarking/executive)
3. `POST /api/analytics/cache/clear`

**Commit:** `refactor(intel): reduce from 19 to 3 endpoints`

#### B6 — API Gateway routes update (~47 → ~15 routes)
**Branch:** `refactor/api-reduction-gateway`
**What:** Remove routes for all deleted paths. Clean up to match the 50-endpoint canonical API.
**Note:** `core_sessions` route already exists — do not duplicate.
**Commit:** `refactor(gateway): update routes for 50-endpoint API`

#### B7 — test-api-full.js update for 50-endpoint spec
**Branch:** `test/api-spec-update`
**What:** Update SPEC_ENDPOINTS (core:15, commerce:15, logistics:12, payment:5, intel:3). Replace all `/api/v1/*` paths. Update filter calls to query params.
**Target:** 50/50 pass rate.
**Commit:** `test: update test-api-full.js for 50-endpoint reduced API spec`

---

### PHASE C — DATABASE MIGRATION

**Important:** Phase C can run in parallel with Phase B on the Dell. Zero-downtime 4-phase migration.
**⚠️ All `store_id` FK constraints must be removed from Flyway DDL — `stores` stays in MongoDB.**
**⚠️ intelligence-service excluded — it reads via HTTP clients, no PostgreSQL needed.**

---

#### C1 — PostgreSQL + Flyway infrastructure setup
**Branch:** `chore/postgres-setup`
- Add PostgreSQL 16 to `docker-compose.yml`
- Add JPA + Flyway + PG driver to pom.xml (core, commerce, payment, logistics)
- Add `spring.datasource` to each `application.yml`
- Create `PostgresConfig.java` + `MongoConfig.java` (dual-database Spring setup)
**Commit:** `chore: add PostgreSQL 16 + Flyway + JPA dual-database setup`

#### C2 — Users + Auth schema + dual-write (Phase 1)
**Branch:** `migration/users-to-postgres`
- `V1__create_users_schema.sql`
- `UserEntity.java` + `UserJpaRepository.java`
- Dual-write in `UserService.java` (MongoDB primary, PostgreSQL best-effort)
- `UserMigrationService.java` with `@Profile("migration")` to backfill
**Commit:** `migration: dual-write users to PostgreSQL (Phase 1)`

#### C3 — Customers schema + dual-write
**Branch:** `migration/customers-to-postgres`
- `V2__create_customers_schema.sql`
- CustomerEntity, CustomerAddressEntity, LoyaltyTransactionEntity
**Commit:** `migration: dual-write customers to PostgreSQL (Phase 1)`

#### C4 — Orders schema + dual-write
**Branch:** `migration/orders-to-postgres`
- `V1__create_orders_schema.sql` (commerce-service)
- OrderEntity + OrderItemEntity + OrderQualityCheckpointEntity
- ⚠️ `order_items.menu_item_id` is VARCHAR MongoDB ObjectId ref — NOT a FK
**Commit:** `migration: dual-write orders to PostgreSQL (Phase 1)`

#### C5 — Payments + Transactions schema
**Branch:** `migration/payments-to-postgres`
- `V1__create_transactions_schema.sql`
- TransactionEntity + RefundEntity
- ⚠️ Payment-service is PostgreSQL-primary from day 1 — financial data never MongoDB-primary
**Commit:** `migration: payment-service writes to PostgreSQL as primary`

#### C6 — Delivery + Sessions + Inventory + GDPR + Notifications schemas
**Branch:** `migration/logistics-to-postgres`
- `logistics/V1__create_delivery_schema.sql`
- `logistics/V2__create_inventory_schema.sql`
- `core/V3__create_sessions_schema.sql`
- `core/V4__create_notifications_schema.sql`
- `core/V5__create_gdpr_schema.sql`
- `core/V6__create_review_responses_schema.sql`
**Commit:** `migration: create delivery/inventory/sessions/GDPR/notification schemas`

#### C7 — Redis DriverStatusService + OTP
**Branch:** `feat/redis-driver-status`
- `DriverStatusService.java`: Redis `driver:online:{driverId}` (TTL 5min)
- OTP: Redis `otp:{orderId}` (TTL 30min)
- Move OTP generation/verification from DB to Redis
**Commit:** `feat(logistics): Redis-backed driver online status and delivery OTP`

#### C8 — Phase 2: Switch reads to PostgreSQL
**Branch:** `migration/postgres-phase2-reads`
**Prerequisite:** 1 week of dual-write with consistent row counts
**Commit:** `migration: Phase 2 — switch reads to PostgreSQL`

#### C9 — Phase 3+4: Cut over + cleanup
**Branch:** `migration/postgres-cutover`
**Prerequisite:** 2 weeks of Phase 2 with zero errors
**Commit:** `migration: Phase 3+4 — cut over to PostgreSQL, remove migrated MongoDB collections`

---

### PHASE D — TESTING

**Prerequisite for D1:** Phase B complete — Pact contracts written against clean 50-endpoint API.

---

#### D1 — Pact contract tests (rewrite 7 files for Vitest + pact v16)
**Branch:** `test/pact-contracts`
**What:** Rewrite all 7 files in `frontend/src/pact/` using `@pact-foundation/pact` v16 + Vitest runner.
**Test:** `npx vitest run src/pact/` — all 7 pass

#### D2 — Unit tests fix (104 Vitest files, 1374 tests)
**Branch:** `test/unit-fix`
**What:** Fix stale mocks, RTK Query path changes, Redux state shape changes from Phase A/B.
**Target:** ≥90% pass rate

#### D3 — E2E tests fix (13 Playwright specs)
**Branch:** `test/e2e-fix`
**What:** Fix navigation flows broken by AddressGate, API paths changed after reduction.
**Target:** All 13 specs pass

---

### PHASE E — AI AGENTS (masova-support overhaul)

**Architecture:** Google ADK multi-agent system. Root orchestrator routes to 7 sub-agents.
**Model:** `gemini-2.0-flash` via Gemini API (existing `GOOGLE_API_KEY`)
**Repo:** `/Users/souravamseekarmarti/Projects/masova-support`

```
masova-support/
├── agents/
│   ├── customer_support/     ← E1 (upgrade existing)
│   ├── inventory_manager/    ← E2 (NEW)
│   ├── shift_scheduler/      ← E3 (NEW)
│   ├── revenue_insights/     ← E4 (NEW)
│   ├── dispatch_optimizer/   ← E5 (NEW)
│   ├── menu_performance/     ← E6 (NEW)
│   └── waste_reduction/      ← E7 (NEW)
├── orchestrator/             ← root agent, routes to sub-agents
└── scheduler/                ← cron triggers for scheduled agents
```

---

#### E1 — Customer Support Agent upgrade
**Branch:** `agent/customer-support`
**Trigger:** User message (conversational)
**Current tools:** order status, menu, store hours, complaint, refund, loyalty, cancel, wait time
**Add:** proactive tracking updates, reorder from history, delivery OTP issues, live queue updates
**Commit:** `feat(agent): upgrade customer support agent with extended tools`

#### E2 — Inventory Manager Agent
**Branch:** `agent/inventory-manager`
**Trigger:** Schedule (every 6 hours) + inventory update webhook
**Tools:**
- `get_inventory_status(store_id)` — check all items vs minimum stock
- `get_supplier_for_item(item_id)` — find preferred supplier
- `create_purchase_order(supplier_id, items)` — raise PO automatically
- `send_notification(manager_id, message)` — alert manager
**Value:** Manager never manually checks stock again
**Commit:** `feat(agent): inventory manager — autonomous stock monitoring and auto-reordering`

#### E3 — Shift Scheduler Agent
**Branch:** `agent/shift-scheduler`
**Trigger:** Schedule (every Monday 9am)
**Tools:**
- `get_sales_forecast(store_id, date_range)` — from intelligence-service
- `get_shifts(store_id, date_range)` — current schedule
- `get_available_staff(store_id)` — who can work
- `create_shift(employee_id, date, type)` — auto-create shift
- `notify_employee(employee_id, message)` — send notification
**Value:** No manager builds weekly schedules manually
**Commit:** `feat(agent): shift scheduler — autonomous weekly staffing from sales forecast`

#### E4 — Revenue Insights Agent
**Branch:** `agent/revenue-insights`
**Trigger:** Schedule (daily 8am)
**Tools:**
- `get_sales_summary(store_id, date)` — daily sales
- `get_top_items(store_id, limit)` — bestsellers
- `get_peak_hours(store_id, date)` — busiest times
- `compare_vs_last_week(store_id)` — week-over-week delta
- `send_manager_briefing(manager_id, report)` — push summary notification
**Value:** Manager wakes up already knowing yesterday's performance
**Commit:** `feat(agent): revenue insights — daily automated morning briefing`

#### E5 — Dispatch Optimizer Agent
**Branch:** `agent/dispatch-optimizer`
**Trigger:** Event-driven — RabbitMQ fires when new delivery order created
**Tools:**
- `get_pending_deliveries(store_id)` — unassigned orders
- `get_available_drivers(store_id)` — online drivers + locations
- `calculate_optimal_assignment(orders, drivers)` — matching logic
- `assign_driver(order_id, driver_id)` — dispatch
- `notify_driver(driver_id, order_details)` — push to app
**Value:** No manual dispatch, faster delivery, fewer errors
**Commit:** `feat(agent): dispatch optimizer — event-driven autonomous driver assignment`

#### E6 — Menu Performance Agent
**Branch:** `agent/menu-performance`
**Trigger:** Schedule (every Sunday night)
**Tools:**
- `get_menu_analytics(store_id, period)` — sales per item
- `get_complaints_by_item(store_id)` — complaint patterns
- `get_review_sentiment(store_id)` — review analysis
- `flag_menu_item(item_id, reason, suggestion)` — create manager task
**Value:** Data-driven menu decisions, no manual analysis
**Commit:** `feat(agent): menu performance — weekly automated menu analysis and flagging`

#### E7 — Waste Reduction Agent
**Branch:** `agent/waste-reduction`
**Trigger:** Schedule (daily after closing)
**Tools:**
- `get_waste_logs(store_id, date_range)` — what was wasted
- `get_purchase_history(store_id)` — what was ordered
- `suggest_reorder_quantity(item_id)` — optimised quantity
- `alert_manager(store_id, waste_summary)` — if threshold crossed
**Value:** Direct cost saving — restaurants lose 4-10% revenue to food waste
**Commit:** `feat(agent): waste reduction — daily autonomous waste tracking and reorder optimization`

---

## Part 4: Corrections to Existing Plan Docs

### `2026-03-02-api-reduction-plan.md`
- **Task 4 (Sessions):** Gateway `core_sessions` route ALREADY EXISTS — skip "add route" step
- **Task 3 (Stores):** Do NOT remove `/public/` prefix — `find-by-location` is a new public endpoint
- **All endpoint counts:** Update to match new 50-endpoint targets

### `2026-02-23-store-selection-implementation.md`
- **Task 7:** Port corrected from `5173` → `3000`
- **Task 3:** `find-by-location` endpoint must be explicitly preserved when B1 consolidates StoreController

### `2026-02-27-github-revamp-plan.md`
- Phases 1-4, 6, 8-9 are DONE. Remaining: stray PNG/PDF files + `ARCHITECTURE.md`

### `2026-03-02-db-migration-plan.md`
- Remove all `REFERENCES stores(id)` FK constraints — `stores` stays in MongoDB
- intelligence-service excluded from JPA/Flyway scope

---

## Part 5: Summary Table

| Phase | Tasks | Branches | Owner |
|---|---|---|---|
| A — Foundation | 14 tasks | feat/store-selection, feat/product-site-overhaul, chore/github-final-cleanup | Mac (FE) + Dell (BE) |
| B — API Reduction | 7 tasks | refactor/api-reduction-{core,commerce,logistics,payment,intel,gateway}, test/api-spec-update | Dell (BE) + Mac (FE for B7) |
| C — DB Migration | 9 tasks | chore/postgres-setup, migration/*, feat/redis-driver-status | Dell |
| D — Testing | 3 tasks | test/pact-contracts, test/unit-fix, test/e2e-fix | Mac |
| E — AI Agents | 7 tasks | agent/{customer-support,inventory-manager,shift-scheduler,revenue-insights,dispatch-optimizer,menu-performance,waste-reduction} | Mac |
| **Total** | **40 tasks** | **22 branches** | |

---

## Part 6: API Design Reference (50 endpoints)

| # | Method | Path | Service | Auth |
|---|---|---|---|---|
| 1 | POST | /api/auth/login | core | Public |
| 2 | POST | /api/auth/register | core | Public |
| 3 | POST | /api/auth/refresh | core | Public |
| 4 | POST | /api/auth/logout | core | Bearer |
| 5 | GET | /api/users/{userId} | core | Bearer |
| 6 | PUT | /api/users/{userId} | core | Bearer |
| 7 | PATCH | /api/users/{userId}/status | core | Manager |
| 8 | GET | /api/users | core | Manager |
| 9 | POST | /api/sessions/start | core | Bearer |
| 10 | POST | /api/sessions/end | core | Bearer |
| 11 | GET | /api/shifts | core | Bearer |
| 12 | PATCH | /api/shifts/{shiftId} | core | Manager |
| 13 | GET | /api/stores | core | Public |
| 14 | GET | /api/stores/{storeId} | core | Public |
| 15 | PUT | /api/stores/{storeId} | core | Manager |
| 16 | GET | /api/menu | commerce | Public |
| 17 | POST | /api/menu | commerce | Manager |
| 18 | PUT | /api/menu/{itemId} | commerce | Manager |
| 19 | PATCH | /api/menu/{itemId}/availability | commerce | Manager |
| 20 | POST | /api/orders | commerce | Bearer |
| 21 | GET | /api/orders/{orderId} | commerce | Public |
| 22 | GET | /api/orders | commerce | Bearer |
| 23 | PATCH | /api/orders/{orderId}/status | commerce | Bearer |
| 24 | PATCH | /api/orders/{orderId}/assign-driver | commerce | Manager |
| 25 | PATCH | /api/orders/{orderId}/quality-checkpoint | commerce | Staff |
| 26 | PATCH | /api/orders/{orderId}/delivery | commerce | Driver |
| 27 | GET | /api/orders/analytics | commerce | Manager |
| 28 | GET | /api/kitchen-equipment | commerce | Staff |
| 29 | PATCH | /api/kitchen-equipment/{equipmentId} | commerce | Staff |
| 30 | GET | /api/ratings/token/{token} | commerce | Public |
| 31 | POST | /api/delivery/dispatch | logistics | Manager |
| 32 | POST | /api/delivery/accept | logistics | Driver |
| 33 | POST | /api/delivery/location-update | logistics | Driver |
| 34 | GET | /api/delivery/track/{orderId} | logistics | Public |
| 35 | GET | /api/delivery/eta/{orderId} | logistics | Public |
| 36 | POST | /api/delivery/verify | logistics | Driver |
| 37 | PATCH | /api/delivery/{trackingId}/status | logistics | Driver |
| 38 | GET | /api/delivery/zone | logistics | Public |
| 39 | GET | /api/delivery/drivers/available | logistics | Manager |
| 40 | GET | /api/delivery/performance | logistics | Manager |
| 41 | GET | /api/inventory | logistics | Manager |
| 42 | PATCH | /api/inventory/{itemId} | logistics | Manager |
| 43 | POST | /api/payments/initiate | payment | Bearer |
| 44 | POST | /api/payments/verify | payment | Bearer |
| 45 | GET | /api/payments/{transactionId} | payment | Bearer |
| 46 | GET | /api/payments | payment | Manager |
| 47 | POST | /api/payments/refund | payment | Manager |
| 48 | GET | /api/analytics | intel | Manager |
| 49 | GET | /api/bi | intel | Manager |
| 50 | POST | /api/analytics/cache/clear | intel | Manager |
