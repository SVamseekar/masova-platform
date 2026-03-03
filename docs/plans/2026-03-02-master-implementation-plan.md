there are# MaSoVa Master Implementation Plan
**Perspective:** Senior Java Architect + Senior UI/UX + Senior DB Admin + Senior DevOps + Senior Android + Senior AI/ML
**Date:** 2026-03-02
**Updated:** 2026-03-02 (this session — full senior architect version)
**Author:** Architecture Review
**Status:** Active — supersedes all prior task lists
**Purpose:** Single source of truth for all pending work, branching strategy, and execution order.

---

## Context

MaSoVa is a full-stack restaurant management platform with 6 Spring Boot microservices (471 endpoints today → target ~75), a React 19 frontend, two React Native mobile apps, and a Python AI agent layer (Google ADK). The backend runs on a Dell i3 (192.168.50.88), frontend/mobile on Mac M1.

This plan covers all remaining work across 6 phases (A–F) in the exact order of execution with system-design intent baked into every task.

**Current state summary:**
- API has 471 endpoints across 5 services — needs consolidation to ~75
- MongoDB-only today — must migrate ACID data to PostgreSQL (dual-write → cutover)
- 1 AI support agent running — needs 7 total with scheduled triggers
- Frontend store selection not implemented (deliveryFee hardcoded at 29/50 in cartSlice.ts)
- Product site 80% done — SupportChat is a stub (SupportFAB.tsx), needs real chat widget
- 3 controllers still have /api/v1/* dual paths (ApiVersionConfig.V1 + .LEGACY)
- Resilience4j installed but NOT used — need to wire it
- APScheduler NOT installed — needed for scheduled AI agents
- InMemorySessionService in agent core/agent.py (inconsistent with Redis session in main.py)
- No distributed tracing (Spring Cloud Sleuth not installed)

---

## Codebase Reality Check (as of 2026-03-02)

| Area                                                    | Status                |
| ------------------------------------------------------- | --------------------- |
| Order flow (RabbitMQ events, OrderStatus enum, DINE_IN) | ✅ Complete            |
| API Gateway `/api/sessions/**` route                    | ✅ Done                |
| GitHub repo cleanup (archive/, scripts/, templates)     | ✅ Done                |
| Product site base (OrderFlowSection, constants, CSS)    | ✅ ~80% done           |
| Vite proxy reads `VITE_API_BASE_URL` env var            | ✅ Done (this session) |
| `ProductTourTab` interface + product-site.css committed | ✅ Done (this session) |
| `.worktrees/` in .gitignore                             | ✅ Done (this session) |
| Store selection (AddressGate, deliveryFeeINR)           | ❌ Not started         |
| Dual-path `/api/v1/*` still in 3 controllers            | ❌ Needs removal       |
| API reduction (471 → ~75 endpoints)                     | ❌ Not started         |
| PostgreSQL migration (polyglot DB)                      | ❌ Not started         |
| Redis DriverStatusService + OTP                         | ❌ Not started         |
| Pact contract tests                                     | ❌ Not started         |
| Unit tests (104 Vitest files)                           | ❌ Not started         |
| E2E tests (13 Playwright specs)                         | ❌ Not started         |
| AI agents (masova-support)                              | ⚠️ 1 agent, needs 7    |

---

## Part 1: Branching Strategy

### Model: GitHub Flow + Trunk-Based (Hybrid)

We use **GitHub Flow** (feature branches → PR → merge to `main`) with a structured naming convention, protected `main`, and no long-lived branches. This is the right model for a 2-person Mac+Dell team with frequent cross-machine work.

### Branch Naming Convention

| Prefix       | Use Case                                    | Examples                                                      |
| ------------ | ------------------------------------------- | ------------------------------------------------------------- |
| `feat/`      | New features, new endpoints, new components | `feat/store-selection`, `feat/address-gate`                   |
| `fix/`       | Bug fixes, broken behaviour                 | `fix/delivery-fee-hardcode`, `fix/kds-ready-status`           |
| `refactor/`  | Restructuring without behaviour change      | `refactor/api-reduction-core`, `refactor/customer-controller` |
| `chore/`     | Tooling, deps, config, CI                   | `chore/flyway-setup`, `chore/docker-postgres`                 |
| `docs/`      | Documentation only                          | `docs/architecture-update`                                    |
| `test/`      | Test files only                             | `test/pact-contracts`, `test/e2e-specs`                       |
| `migration/` | Database migration work                     | `migration/users-to-postgres`, `migration/orders-to-postgres` |
| `release/`   | Version bump + changelog prep               | `release/v3.0.0`                                              |
| `agent/`     | AI agent development                        | `agent/inventory-manager`, `agent/shift-scheduler`            |

### Branch Ownership (Mac vs Dell)

| Machine     | Branch Focus                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mac M1**  | `feat/store-selection` (FE tasks A1.3–A1.8), `feat/product-site-overhaul`, `chore/github-final-cleanup`, `test/*`, `agent/*`, `feat/mobile-*` |
| **Dell i3** | `feat/store-selection` (BE tasks A1.1–A1.3), `refactor/*`, `migration/*`, `chore/postgres-setup`, `feat/redis-driver-status`                  |
| **Either**  | `fix/*` (small fixes)                                                                                                                         |

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

---

## Part 2: Execution Order (All Plans)

Work is ordered by: **dependencies first, highest user impact second, risk last.**

```
Phase A: Foundation (no dependencies, unblocks everything)
  A1 → Store selection backend + frontend          [feat/store-selection]
  A2 → Product site overhaul completion            [feat/product-site-overhaul]
  A3 → GitHub repo final cleanup                   [chore/github-final-cleanup]

Phase B: API Reduction (471 → ~75 endpoints)
  B1 → core-service        238 → ~28 endpoints     [refactor/api-reduction-core]
  B2 → commerce-service     99 → ~20 endpoints     [refactor/api-reduction-commerce]
  B3 → logistics-service    91 → ~15 endpoints     [refactor/api-reduction-logistics]
  B4 → payment-service      24 →  ~6 endpoints     [refactor/api-reduction-payment]
  B5 → intelligence-service 19 →  ~5 endpoints     [refactor/api-reduction-intel]
  B6 → API Gateway         ~47 → ~20 routes        [refactor/api-reduction-gateway]
  B7 → test-api-full.js update for ~75 endpoints   [test/api-spec-update]

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

Phase F: Mobile Apps
  F1 → Customer Mobile: AddressGate equivalent     [feat/mobile-address-gate]
  F2 → Customer Mobile: Update API paths (Phase B) [fix/mobile-api-paths]
  F3 → Driver App: WebSocket real-time dispatch    [feat/driver-dispatch-ws]
```

---

## Part 3: All Tasks (Priority Order)

---

### PHASE A — FOUNDATION

**System design intent:** Domino's-style AddressGate pattern — customer must confirm location before seeing menu. This resolves storeId at the edge (frontend), not mid-order. deliveryFee and zone are Redux state, never hardcoded.

---

#### A1.1 — Backend: LocationQueryResult DTO + StoreService.findByLocation()
**Branch:** `feat/store-selection`
**Machine:** Dell
**Service:** core-service
**File:** `core-service/src/main/java/com/MaSoVa/core/user/dto/LocationQueryResult.java` (CREATE)
**Fields:** `storeId`, `storeName`, `distanceKm`, `deliveryZone` (ZONE_A/B/C/PREMIUM), `deliveryFeeINR` (int), `withinDeliveryArea` (boolean), `estimatedDeliveryMinutes` (int)
**StoreService:** Add `findByLocation(lat, lng)` — Haversine on all active stores. Zone resolution: 0–3km=ZONE_A ₹29, 3–6km=ZONE_B ₹49, 6–10km=ZONE_C ₹79, >10km=out of area.
**Test:** `curl "http://192.168.50.88:8085/api/stores/public/find-by-location?latitude=17.395&longitude=78.491"`
**Commit:** `feat(core): add LocationQueryResult DTO and findByLocation with Haversine + zone fee`

#### A1.2 — Backend: GET /api/stores/public/find-by-location endpoint
**Branch:** `feat/store-selection`
**Machine:** Dell
**Service:** core-service → StoreController
**What:** Add `@GetMapping("/public/find-by-location")` — public, no auth. `@RequestParam Double latitude, longitude`. Returns `LocationQueryResult`.
**⚠️ PRESERVE this endpoint when Phase B consolidates StoreController — explicitly protected in api-reduction-plan.md**
**Test:** Same curl as A1.1, verify JSON shape matches LocationQueryResult.
**Commit:** `feat(core): expose GET /stores/public/find-by-location`

#### A1.3 — Frontend: storeApi.ts — findByLocation RTK Query endpoint
**Branch:** `feat/store-selection`
**Machine:** Mac
**File:** `frontend/src/store/api/storeApi.ts`
**What:** Add `LocationQueryResult` TypeScript interface. Add `findByLocation` builder.query with `latitude` + `longitude` params. Export `useFindByLocationQuery` + `useLazyFindByLocationQuery`.
**Test:** `npx tsc --noEmit` — no errors

#### A1.4 — Frontend: cartSlice.ts — delivery location state
**Branch:** `feat/store-selection`
**Machine:** Mac
**File:** `frontend/src/store/slices/cartSlice.ts`
**What:** Add to CartState: `deliveryFeeINR: number` (default 0), `deliveryZone: string | null`, `deliveryLocation: {lat, lng, address} | null`, `withinDeliveryArea: boolean`, `estimatedDeliveryMinutes: number | null`, `addressGateConfirmed: boolean`. Add `setDeliveryLocation` reducer (populates all fields from LocationQueryResult). Add `clearDeliveryLocation` reducer (resets all). **Remove hardcoded `29` and `50`** — replace with `state.cart.deliveryFeeINR`.
**Test:** `npx tsc --noEmit` — no errors

#### A1.5 — Frontend: AddressGate component
**Branch:** `feat/store-selection`
**Machine:** Mac
**File:** `frontend/src/components/common/AddressGate.tsx` (CREATE)
**What:** Full-screen overlay (neumorphic style, matches design system). Google Places autocomplete input. On address select → calls `useLazyFindByLocationQuery`. Shows zone + fee result card with estimated delivery time. "Confirm & See Menu" button dispatches `setDeliveryLocation`. Out-of-area shows message + option to change address. Persists to localStorage so gate doesn't re-show on refresh.
**Test:** `npx tsc --noEmit` — no errors

#### A1.6 — Frontend: Wire AddressGate into App.tsx (customer routes only)
**Branch:** `feat/store-selection`
**Machine:** Mac
**File:** `frontend/src/App.tsx`
**What:** Wrap customer-facing routes in `<CustomerGate>` wrapper that renders AddressGate when `!addressGateConfirmed`. Manager/staff/kitchen/driver/POS routes MUST NOT show the gate — check user role before showing. Import AddressGate synchronously (not lazy — it's the first thing customer sees).
**Test:** Navigate to `/order` → gate appears. Navigate to `/manager` → gate does NOT appear.

#### A1.7 — Frontend: CartPage uses Redux deliveryFeeINR
**Branch:** `feat/store-selection`
**Machine:** Mac
**File:** `frontend/src/pages/customer/CartPage.tsx`
**What:** Replace hardcoded fee display with `useSelector(selectDeliveryFeeINR)`. Show delivery zone badge. Show ETA from `estimatedDeliveryMinutes`. Add "Change delivery address" link that dispatches `clearDeliveryLocation`.
**Test:** Add item to cart, confirm address in gate, verify fee shown matches zone fee.

#### A1.8 — Frontend: StoreSelector simplification
**Branch:** `feat/store-selection`
**Machine:** Mac
**File:** `frontend/src/components/StoreSelector.tsx` (if exists) or wherever GPS auto-select lives
**What:** Remove GPS auto-select `useEffect` from customer variant. Add "Change" link that dispatches `clearDeliveryLocation` to re-open gate. Keep manager dropdown unchanged.
**Commit:** `feat: Dominos-style address gate with zone-based delivery pricing — complete`

---

#### A2.1 — Product site: SupportChat glassmorphism widget
**Branch:** `feat/product-site-overhaul`
**Machine:** Mac
**File:** `frontend/src/apps/ProductSite/components/SupportChat.tsx` (CREATE — replaces SupportFAB.tsx stub)
**What:** Dark glassmorphism floating button (bottom-right). Expands to full chat panel (not just links). Connects to `POST http://localhost:8000/agent/chat` (masova-support). Shows message history, loading state, error state. Matches ProductSite dark theme — NOT the neumorphic design system used in main app.
**Commit:** `feat(product-site): glassmorphism support chat widget`

#### A2.2 — Product site: Real app screenshots in HeroSection + FeaturesGrid
**Branch:** `feat/product-site-overhaul`
**Machine:** Mac
**Files:** `HeroSection.tsx`, `FeaturesGrid.tsx`
**What:** Capture screenshots of live app at `localhost:3000/order`, `/manager/dashboard`, `/kitchen`. Save to `frontend/public/screenshots/`. Embed in browser mockup frames. (HeroSection already references `/screenshots/customer-home.png` etc — just need actual files.)
**Commit:** `feat(product-site): real app screenshots in hero and features sections`

#### A2.3 — Product site: Expand AI agents 5 → 7 in AIAgentsSection
**Branch:** `feat/product-site-overhaul`
**Machine:** Mac
**File:** `frontend/src/apps/ProductSite/constants.ts`
**What:** Add 2 new AI agent cards to the existing 5. Add: Inventory Manager Agent, Shift Scheduler Agent. (Current 5: Customer, Manager, Kitchen, Driver, Store Selection → 7 total.) Update AIAgentsSection layout to handle 7 cards. Update `AgentIconKey` type.
**Commit:** `feat(product-site): 7 AI agents in AIAgentsSection`

#### A2.4 — Product site: Resolve all dead links in Footer
**Branch:** `feat/product-site-overhaul`
**Machine:** Mac
**File:** `frontend/src/apps/ProductSite/components/Footer.tsx`
**What:** Current `FOOTER_LINK_MAP` has many `#` anchors that go nowhere (Blog, Careers, Press, Status, Changelog, Privacy Policy, Terms, GDPR, Cookie Policy). Fix: GitHub repo → `https://github.com/SVamseekar/masova-platform`, product demo → `/order`, API Reference → `/api-docs` (already correct), Contact → `mailto:hello@masova.com` (already correct). For links with no real destination yet: add `pointer-events: none; opacity: 0.4` styling instead of dead `#` links.
**Commit:** `feat: product site overhaul — screenshots, 7 AI agents, support chat, live links`

---

#### A3.1 — GitHub: Move remaining stray files at root
**Branch:** `chore/github-final-cleanup`
**Machine:** Mac
**What:** Check for PNG screenshots, PDF files at root → move to `archive/misc/`. (GitHub revamp plan says phases 1-4, 6, 8-9 are done — only stray files remain.)

#### A3.2 — GitHub: Update .gitignore for remaining gaps
**Branch:** `chore/github-final-cleanup`
**Machine:** Mac
**What:** Add to `.gitignore`: `*.pdf`, `*.bak`, `scroll*.png`, `current-state.png`, `fixed-state.png`, `fullpage.png`, `homepage-hero.png`, `dribbble-ref.png`, `.masova-config`, `.masova-config.bak`
**Note:** `.worktrees/` already added this session.

#### A3.3 — GitHub: Write docs/ARCHITECTURE.md
**Branch:** `chore/github-final-cleanup`
**Machine:** Mac
**File:** `docs/ARCHITECTURE.md` (CREATE)
**What:** ASCII diagram of 6 services + ports. Key data flows: order placement, delivery tracking, payment. Tech stack table. Links to each service README.
**Commit:** `chore: final repo cleanup — stray files, .gitignore, architecture doc`

---

### PHASE B — API REDUCTION (471 → ~75 ENDPOINTS)

**Expert Lens: Senior Java Architect**

**System design intent:** 7 consolidation techniques applied systematically. No feature is removed — all behaviour preserved through query params, action-in-body, and polymorphic body patterns. All `/api/v1/*` dual paths removed. `@Profile("dev")` gates test endpoints. Resilience4j circuit breaker wired on inter-service HTTP calls.

**Prerequisite:** All Phase A complete. Work B1–B7 in order on Dell.

**Key techniques:**
1. Query params replace filter endpoints (`GET /menu?category=PIZZA&dietary=VEG`)
2. Action-in-body replaces separate action endpoints (`PATCH /shifts/{id}` with `{action: "confirm"}`)
3. Polymorphic body replaces variant endpoints (`POST /delivery/verify` with `{method: "otp"}`)
4. Nested resource merge (ResponseController merged into ReviewController)
5. Analytics unified (`GET /analytics?metric=sales` replaces 7 separate analytics endpoints)
6. GDPR collapse (4 request-type endpoints → 1 with `{type: "ERASURE"}`)
7. Remove /api/v1 dual paths (ApiVersionConfig.V1 + .LEGACY eliminated)

---

#### B1 — core-service API reduction (238 → ~28 endpoints)
**Branch:** `refactor/api-reduction-core`
**Machine:** Dell

**Key changes:**
- `TestDataController.java` → add `@Profile("dev")` (keeps it off production)
- `UserController` → remove 9 filter sub-paths, add `?type=&storeId=&available=` query params
- `StoreController` → remove /public/* duplicates, ⚠️ keep `find-by-location` (A1.2), add `?code=&region=` query params
- `WorkingSessionController` → rename `/api/users/sessions` → `/api/sessions` (gateway already has `core_sessions` route), merge start/end variants
- `CustomerController` → remove `/api/v1/customers` dual path, replace 12 filter sub-paths with `?filter=&tag=&email=` query params, merge loyalty POST endpoints
- `ReviewController` + `ResponseController` → merge into ReviewController, add `?status=&entityType=&entityId=` query params
- `NotificationController` → merge 3 list variants into `?userId=&unread=&recent=`
- `UserPreferencesController` → merge 3 PATCH variants into single PATCH body
- `GdprController` → collapse 4 request-type endpoints into `POST /request/{id}/process` with `{type: "ACCESS|ERASURE|PORTABILITY|RECTIFICATION"}`
- `ShiftController` → add `{action: "confirm|start|complete"}` to PATCH body
- `SystemInfoController` → remove updates/check + updates/status, merge info into health response
- **Wire Resilience4j** on inter-service calls (e.g., core → intelligence for analytics). Add `@CircuitBreaker(name="analyticsService")` on HTTP client calls. Config: `slidingWindowSize: 10`, `failureRateThreshold: 50`, `waitDurationInOpenState: 30s`. Fallback: return cached data, not 500.

**Commit:** `refactor(core): reduce 238 → 28 endpoints, wire Resilience4j circuit breakers`

---

#### B2 — commerce-service API reduction (99 → ~20 endpoints)
**Branch:** `refactor/api-reduction-commerce`
**Machine:** Dell

**Key changes:**
- `MenuController` → remove /public/cuisine/*, /public/category/*, /public/dietary/*, /public/tag/*, /public/recommended → replace with `GET /api/menu?cuisine=&category=&dietary=&tag=&recommended=`
- `OrderController` → remove `/api/v1/orders` dual path. Replace 10 filter sub-paths with `?storeId=&status=&customerId=&from=&to=&number=` query params.
- `KitchenEquipmentController` → merge `PATCH /{id}/status`, `PATCH /{id}/power`, `PATCH /{id}/temperature` into single `PATCH /{id}` with `{status?, power?, temperature?}` body
- **Update frontend RTK Query in same PR** — any MenuController/OrderController paths changed here must be updated in `frontend/src/store/api/` in the same branch.
- **Add Idempotency Key** on `POST /api/orders`: accept `Idempotency-Key` header, store key → response in Redis (TTL 24h). Prevents double-orders.

**Commit:** `refactor(commerce): reduce 99 → 20 endpoints, remove /api/v1 dual paths, idempotency`

---

#### B3 — logistics-service API reduction (91 → ~15 endpoints)
**Branch:** `refactor/api-reduction-logistics`
**Machine:** Dell

**Key changes:**
- Delivery verify: merge `POST /verify-signature` + `/verify-photo` + `/contactless` → `POST /delivery/verify` with `{method: "SIGNATURE|PHOTO|CONTACTLESS|OTP", proof: url}` body
- Zones: merge `/zone/validate` + `/zone/list` + `/zone/fee` + `/zone/check` → `GET /delivery/zone?storeId=&lat=&lng=`
- Remove `/delivery/eta/{orderId}` → include ETA in `GET /delivery/track/{orderId}` response
- Remove `GET /drivers/available` → use core-service `GET /api/users?type=DRIVER&available=true`
- `InventoryController` → add `PATCH /{id}` with `{action: "UPDATE_STOCK|RECORD_WASTE|RESERVE|RELEASE|CONSUME", quantity, reason}` body
- Mark `PurchaseOrderController` + `WasteController` as `@Deprecated` (AI agents will call internal service methods, not HTTP endpoints)

**Commit:** `refactor(logistics): reduce 91 → 15 endpoints, polymorphic delivery proof`

---

#### B4 — payment-service API reduction (24 → ~6 endpoints)
**Branch:** `refactor/api-reduction-payment`
**Machine:** Dell

**Key changes:**
- Remove `/api/v1/payments` dual path
- Remove `/customer/{customerId}` → use `GET /api/payments?customerId={id}`
- Remove `/reconciliation` + `POST /{id}/reconcile` → scheduled job, not frontend endpoint
- Merge refund lookups → `GET /api/payments/refunds?orderId=&transactionId=&customerId=`
- `POST /api/payments/refund` keeps its path (used by AI agent E7)
- **Add Idempotency Key** on `POST /api/payments/initiate`: same pattern as orders
- **⚠️ payment-service is PostgreSQL-primary from day 1 (Phase C5) — no MongoDB dual-write here**

**Commit:** `refactor(payment): reduce 24 → 6 endpoints, remove /api/v1 dual paths, idempotency`

---

#### B5 — intelligence-service API reduction (19 → ~5 endpoints)
**Branch:** `refactor/api-reduction-intel`
**Machine:** Dell

**Key changes:**
- Merge `GET /analytics/sales/today` + `/analytics/sales/trends` → `GET /api/analytics?storeId=&metric=sales&period=today|week|month`
- Full query param design: `GET /api/analytics?metric=sales|trends|breakdown|peak-hours|staff|products|drivers`
- `GET /api/bi?report=forecast|behavior|churn|demand|cost|benchmarking|executive`
- Keep `POST /api/analytics/cache/clear` (used by AI agents)
- Remove `/bi/health` → use `/actuator/health`
- Add `GET /api/analytics/staff/{staffId}/hours` (moved from sessions endpoint)

**Commit:** `refactor(intel): reduce 19 → 5 endpoints, unified analytics query params`

---

#### B6 — API Gateway routes update
**Branch:** `refactor/api-reduction-gateway`
**Machine:** Dell
**File:** `api-gateway/src/main/java/com/MaSoVa/gateway/config/GatewayConfig.java`

**What:**
- Remove routes for all deleted paths (~47 routes → ~20 routes)
- ✅ `core_sessions` already exists — do NOT duplicate
- Remove `/api/v1/**` routes for commerce and payment
- Remove individual filter routes (users/type, users/drivers, stores/public, customers/active etc.)
- Add aggregated health route `GET /api/health` that calls all 5 services' `/actuator/health`
- Block `POST /api/customers/get-or-create` from public gateway (internal service-to-service only)

**Commit:** `refactor(gateway): reduce routes for ~75-endpoint API, add aggregated /api/health`

---

#### B7 — test-api-full.js update for ~75-endpoint spec
**Branch:** `test/api-spec-update`
**Machine:** Mac
**File:** `scripts/test-api-full.js`

**What:**
- Update `SPEC_ENDPOINTS`: core ~28, commerce ~20, logistics ~15, payment ~6, intel ~5
- Replace all `/api/v1/*` paths
- Update filter calls to query params
- Fix inventory, review, delivery endpoints to new paths
- **Target: high pass rate on all ~75 endpoints**

**Commit:** `test: update test-api-full.js for ~75-endpoint reduced API spec`

---

### PHASE C — DATABASE MIGRATION (PostgreSQL + Redis)

**Expert Lens: Senior DB Administrator**

**System design intent:** Zero-downtime 4-phase migration. Phase 1: dual-write (MongoDB primary, PostgreSQL best-effort). Phase 2: switch reads to PostgreSQL (after 1 week dual-write with consistent counts). Phase 3: cut over. Phase 4: cleanup. Flyway manages schema-as-code. HikariCP connection pooling tuned. Payment-service is PostgreSQL-primary from day 1 — financial data never MongoDB-primary.

**CRITICAL RULES:**
- ⚠️ `stores` collection STAYS in MongoDB — all `store_id` FK constraints removed from Flyway DDL (use VARCHAR for store_id references, not a FK)
- ⚠️ `menu` items, `campaigns`, `reviews` STAY in MongoDB (schema flexibility needed)
- ⚠️ `intelligence-service` EXCLUDED from JPA/Flyway — it reads via HTTP clients only
- ⚠️ `order_items.menu_item_id` is VARCHAR MongoDB ObjectId ref — NOT a FK to a PostgreSQL table
- Optimistic locking: add `@Version Long version` on all JPA entities with concurrent update risk (Order, InventoryItem)
- Soft deletes: `deleted_at TIMESTAMP` on users, customers, menu items (never hard-delete user data)
- All timestamps: `TIMESTAMP WITH TIME ZONE` — never bare `TIMESTAMP`

**Can run in parallel with Phase B on Dell.**

---

#### C1 — PostgreSQL + Flyway infrastructure
**Branch:** `chore/postgres-setup`
**Machine:** Dell

**What:**
- Add PostgreSQL 16 container to `docker-compose.yml`
- Add to pom.xml (core, commerce, payment, logistics): `spring-boot-starter-data-jpa`, `flyway-core`, `postgresql` driver
- Add `spring-cloud-starter-sleuth` to core, commerce, logistics, payment pom.xml (distributed tracing — NOT installed today)
- Add `net.logstash.logback:logstash-logback-encoder` to each service (structured JSON logs)
- `application.yml` for each: `spring.datasource` block + `spring.jpa` + `spring.flyway`
- `PostgresConfig.java` + `MongoConfig.java` per service (dual-database Spring config)
- HikariCP tuning: `maximum-pool-size: 10`, `minimum-idle: 2`, `connection-timeout: 30000`

**Commit:** `chore: add PostgreSQL 16 + Flyway + JPA + Sleuth + structured logging`

---

#### C2 — Users + Auth schema (Phase 1 dual-write)
**Branch:** `migration/users-to-postgres`
**Machine:** Dell

**File:** `core-service/src/main/resources/db/migration/V1__create_users_schema.sql`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id VARCHAR(24) UNIQUE,  -- migration bridge
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  store_id VARCHAR(24),  -- VARCHAR, NOT a FK — stores stays in MongoDB
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version BIGINT DEFAULT 0
);
```
- `UserEntity.java` + `UserJpaRepository.java`
- Dual-write in `UserService.java`: MongoDB primary (all reads+writes), PostgreSQL best-effort (write in try/catch, log on failure)
- `UserMigrationService.java` with `@Profile("migration")`: backfill all existing MongoDB users to PostgreSQL in batches of 500

**Commit:** `migration: dual-write users to PostgreSQL (Phase 1)`

---

#### C3 — Customers schema (Phase 1 dual-write)
**Branch:** `migration/customers-to-postgres`
**Machine:** Dell

**Flyway:** `V2__create_customers_schema.sql` — customers, customer_addresses, loyalty_transactions tables
- `CustomerEntity.java`, `CustomerAddressEntity.java`, `LoyaltyTransactionEntity.java`
- Soft deletes on customers (`deleted_at`)
- Optimistic locking on LoyaltyTransaction (`@Version`)

**Commit:** `migration: dual-write customers to PostgreSQL (Phase 1)`

---

#### C4 — Orders schema (Phase 1 dual-write)
**Branch:** `migration/orders-to-postgres`
**Machine:** Dell

**Flyway:** `commerce-service/V1__create_orders_schema.sql` — orders, order_items, order_quality_checkpoints
- `order_items.menu_item_id VARCHAR(24)` — NOT a FK
- `orders.store_id VARCHAR(24)` — NOT a FK
- Optimistic locking on `orders` (`@Version`)
- `OrderEntity.java`, `OrderItemEntity.java`, `OrderQualityCheckpointEntity.java`
- **Outbox Pattern:** Add `outbox_events` table in same migration. `POST /api/orders` writes order to DB AND outbox in same transaction. Separate scheduler reads outbox and publishes to RabbitMQ. Prevents dual-failure (write DB + publish RabbitMQ).

**Commit:** `migration: dual-write orders to PostgreSQL (Phase 1), add outbox pattern`

---

#### C5 — Payments + Transactions schema (PostgreSQL-primary from day 1)
**Branch:** `migration/payments-to-postgres`
**Machine:** Dell

**Flyway:** `payment-service/V1__create_transactions_schema.sql`
- `transactions`, `refunds` tables
- `transactions.order_id VARCHAR(24)` — NOT a FK
- **No dual-write — payment-service writes directly to PostgreSQL**
- Foreign key: `refunds.transaction_id → transactions(id)` (both in PostgreSQL, FK is valid)

**Commit:** `migration: payment-service writes to PostgreSQL as primary (no dual-write)`

---

#### C6 — Delivery + Sessions + Inventory + Supporting schemas
**Branch:** `migration/logistics-to-postgres`
**Machine:** Dell

**Flyway files:**
- `logistics/V1__create_delivery_schema.sql` — delivery_trackings, delivery_events
- `logistics/V2__create_inventory_schema.sql` — inventory_items, inventory_transactions
- `core/V3__create_sessions_schema.sql` — working_sessions
- `core/V4__create_notifications_schema.sql` — notifications
- `core/V5__create_gdpr_schema.sql` — gdpr_requests, gdpr_consent_logs
- `core/V6__create_shifts_schema.sql` — shifts

All tables: soft deletes + optimistic locking where applicable. All timestamps: `TIMESTAMP WITH TIME ZONE`.

**Commit:** `migration: create delivery/inventory/sessions/GDPR/notification/shifts schemas`

---

#### C7 — Redis DriverStatusService + OTP + Rate Limiting
**Branch:** `feat/redis-driver-status`
**Machine:** Dell
**Files:** `DriverStatusService.java` (CREATE), `DeliveryOtpService.java` (CREATE)

**What:**
- `DriverStatusService`: Redis key `driver:online:{driverId}` (TTL 300s = 5 min). Driver location update refreshes TTL. `isOnline(driverId)`, `updateStatus(driverId, lat, lng)`, `getOnlineDrivers(storeId)`.
- `DeliveryOtpService`: Redis key `otp:{orderId}` (TTL 1800s = 30 min). `generate(orderId)` → 6-digit OTP. `verify(orderId, otp)` → boolean + delete on success.
- Replace DB-based OTP storage in existing `DeliveryController` with Redis calls.
- **Rate limiting upgrade**: Replace Guava in-memory rate limit in UserController with Redis token bucket. `/api/orders` → 100 req/min per IP. `/api/auth/login` → 10 req/min per IP.

**Commit:** `feat(logistics): Redis driver online status + OTP, upgrade rate limiting to Redis`

---

#### C8 — Phase 2: Switch reads to PostgreSQL
**Branch:** `migration/postgres-phase2-reads`
**Machine:** Dell
**Prerequisite:** 1 week of dual-write, row counts match between MongoDB and PostgreSQL

**What:** In each service, flip reads from MongoDB to PostgreSQL. Keep MongoDB writes running for safety. Monitor for 48 hours.

**Commit:** `migration: Phase 2 — switch reads to PostgreSQL`

---

#### C9 — Phase 3+4: Cut over + cleanup
**Branch:** `migration/postgres-cutover`
**Machine:** Dell
**Prerequisite:** 2 weeks of Phase 2 with zero errors

**What:** Stop MongoDB writes. Verify final row counts. Drop migrated MongoDB collections (keep: stores, menu, campaigns, reviews, analytics cache). Update docker-compose to remove MongoDB for migrated services.

**Commit:** `migration: Phase 3+4 — cut over to PostgreSQL, remove migrated MongoDB collections`

---

### PHASE D — TESTING

**Expert Lens: Senior UI/UX Developer + Senior Java Architect**

**System design intent:** Consumer-driven contract tests (Pact) validate API shapes before integration. Unit tests verify component + service logic. E2E tests validate critical user journeys. Test in this order: Pact first (catches contract breaks early), unit (fast feedback), E2E last (slow but full-coverage).

**Prerequisite for D1:** Phase B complete — Pact contracts written against clean ~75-endpoint API.

---

#### D1 — Pact contract tests (rewrite 7 files)
**Branch:** `test/pact-contracts`
**Machine:** Mac
**Files:** `frontend/src/pact/` (7 files — rewrite from jest-pact → `@pact-foundation/pact` v16 + Vitest)

**Key contracts to write:**
- `authConsumer.pact.ts` — login, refresh, logout shapes
- `ordersConsumer.pact.ts` — POST /api/orders, GET /api/orders/{id} shapes
- `menuConsumer.pact.ts` — GET /api/menu with query params
- `deliveryConsumer.pact.ts` — tracking, zone check
- `paymentsConsumer.pact.ts` — initiate, verify

**Test:** `npx vitest run src/pact/` — all 7 pass

**Commit:** `test: rewrite Pact contracts for @pact-foundation/pact v16 + Vitest`

---

#### D2 — Unit tests fix (104 Vitest files, 1374 tests)
**Branch:** `test/unit-fix`
**Machine:** Mac
**Target:** ≥90% pass rate

**What:** Fix stale mocks broken by Phase A/B state shape changes. Update RTK Query path changes. Fix cartSlice tests to use new delivery location state (not hardcoded fees). Fix AddressGate tests.

**Commit:** `test: fix unit tests for Phase A/B changes — 90%+ pass rate`

---

#### D3 — E2E tests fix (13 Playwright specs)
**Branch:** `test/e2e-fix`
**Machine:** Mac
**Target:** All 13 specs pass

**What:** Fix navigation flows broken by AddressGate (now intercepts customer routes). Fix API paths in fixtures after B1–B5 reduction.

**Key fix:** All customer journey specs need to mock `useLazyFindByLocationQuery` or dispatch `setDeliveryLocation` before navigating to customer pages.

**Commit:** `test: fix E2E Playwright specs for AddressGate + API reduction`

---

### PHASE E — AI AGENTS (masova-support overhaul)

**Expert Lens: Senior AI/ML Developer**

**System design intent:** Google ADK multi-agent system. Root orchestrator (MaSoVa) routes to 7 specialized sub-agents. All agents use `gemini-2.0-flash` via Google AI Studio key (`use_vertex_ai: false`). APScheduler drives cron agents. RabbitMQ event drives reactive agents. Redis-backed session throughout (main.py already has Redis session — wire core/agent.py to use it instead of InMemorySessionService).

**Repository:** `/Users/souravamseekarmarti/Projects/masova-support`

**Prerequisite (ALL Phase E tasks):** Install APScheduler: `pip install apscheduler` → add to `requirements.txt`. Fix InMemorySessionService → RedisSessionService in `core/agent.py`.

**Architecture:**
```
masova-support/
├── src/masova_agent/
│   ├── core/agent.py              ← root orchestrator (upgrade)
│   ├── agents/
│   │   ├── customer_support/      ← E1 (upgrade existing)
│   │   ├── inventory_manager/     ← E2 (NEW)
│   │   ├── shift_scheduler/       ← E3 (NEW)
│   │   ├── revenue_insights/      ← E4 (NEW)
│   │   ├── dispatch_optimizer/    ← E5 (NEW)
│   │   ├── menu_performance/      ← E6 (NEW)
│   │   └── waste_reduction/       ← E7 (NEW)
│   ├── tools/backend_tools.py     ← upgrade: more tools
│   └── scheduler/                 ← NEW: APScheduler cron jobs
```

---

#### E1 — Customer Support Agent upgrade
**Branch:** `agent/customer-support`
**Machine:** Mac
**Trigger:** User message (conversational, existing)

**Current tools (confirmed from backend_tools.py):** get_order_status, get_menu_items, get_store_hours, submit_complaint, request_refund, get_loyalty_points, get_store_wait_time, cancel_order

**Add to backend_tools.py:**
- `get_order_history(customer_id, limit)` — last N orders for reorder suggestions
- `get_delivery_otp(order_id)` — help customer with OTP issues
- `get_live_tracking(order_id)` — real-time delivery status

**Fix:** Replace `InMemorySessionService` in `core/agent.py` with Redis-backed session (consistent with main.py Redis session).

**Commit:** `feat(agent): upgrade customer support with tracking + history + Redis sessions`

---

#### E2 — Inventory Manager Agent
**Branch:** `agent/inventory-manager`
**Machine:** Mac
**Trigger:** APScheduler cron every 6 hours + inventory webhook from logistics-service

**Tools (add to backend_tools.py):**
- `get_inventory_status(store_id)` — GET /api/inventory?storeId={id}&lowStock=true
- `get_supplier_for_item(item_id)` — internal call to supplier reference data
- `create_purchase_order(supplier_id, items)` — POST /api/inventory/purchase-orders
- `notify_manager(manager_id, message)` — POST /api/notifications

**Value:** Manager never manually checks stock again. Auto-raises POs when stock < minimum.

**Commit:** `feat(agent): inventory manager — autonomous 6-hour stock monitoring + auto-reorder`

---

#### E3 — Shift Scheduler Agent
**Branch:** `agent/shift-scheduler`
**Machine:** Mac
**Trigger:** APScheduler cron every Monday 9am

**Tools:**
- `get_sales_forecast(store_id, date_range)` — GET /api/analytics?metric=sales&period=week
- `get_current_shifts(store_id, date_range)` — GET /api/shifts?storeId={id}&from={d}&to={d}
- `get_available_staff(store_id)` — GET /api/users?type=STAFF&storeId={id}&available=true
- `create_shift(employee_id, date, type)` — POST /api/shifts
- `notify_employee(employee_id, message)` — POST /api/notifications

**Value:** No manager builds weekly schedules manually. Staffing aligned to forecast demand.

**Commit:** `feat(agent): shift scheduler — Monday 9am autonomous weekly staffing`

---

#### E4 — Revenue Insights Agent
**Branch:** `agent/revenue-insights`
**Machine:** Mac
**Trigger:** APScheduler cron daily 8am

**Tools:**
- `get_sales_summary(store_id, date)` — GET /api/analytics?metric=sales&period=today
- `get_top_items(store_id, limit)` — GET /api/analytics?metric=products&period=today
- `get_peak_hours(store_id, date)` — GET /api/analytics?metric=peak-hours&period=today
- `compare_vs_last_week(store_id)` — GET /api/analytics?metric=trends&period=week
- `send_manager_briefing(manager_id, report)` — POST /api/notifications

**Value:** Manager wakes up knowing yesterday's performance without checking dashboards.

**Commit:** `feat(agent): revenue insights — daily 8am manager briefing`

---

#### E5 — Dispatch Optimizer Agent
**Branch:** `agent/dispatch-optimizer`
**Machine:** Mac
**Trigger:** Event-driven — consumes RabbitMQ `order.created` event (delivery orders only)

**Tools:**
- `get_pending_deliveries(store_id)` — GET /api/orders?storeId={id}&status=BAKED&type=DELIVERY
- `get_available_drivers(store_id)` — Redis: DriverStatusService.getOnlineDrivers(storeId)
- `assign_driver(order_id, driver_id)` — PATCH /api/orders/{id}/assign-driver
- `notify_driver(driver_id, order_details)` — POST /api/notifications

**Integration:** Add `aio_pika` to requirements.txt for async RabbitMQ consumer. Consume from existing `order.events` exchange.

**Value:** No manual dispatch. Average assignment time < 30s from order creation.

**Commit:** `feat(agent): dispatch optimizer — event-driven autonomous driver assignment`

---

#### E6 — Menu Performance Agent
**Branch:** `agent/menu-performance`
**Machine:** Mac
**Trigger:** APScheduler cron every Sunday 11pm

**Tools:**
- `get_menu_analytics(store_id, period)` — GET /api/analytics?metric=products&period=week
- `get_complaints_by_item(store_id)` — GET /api/reviews?entityType=item&status=flagged
- `flag_menu_item(item_id, reason, suggestion)` — PATCH /api/menu/{id}/availability with note
- `send_report(manager_id, report)` — POST /api/notifications

**Value:** Data-driven menu decisions. No manual cross-referencing of sales + complaints.

**Commit:** `feat(agent): menu performance — Sunday night automated menu analysis`

---

#### E7 — Waste Reduction Agent
**Branch:** `agent/waste-reduction`
**Machine:** Mac
**Trigger:** APScheduler cron daily after closing (11pm)

**Tools:**
- `get_waste_logs(store_id, date_range)` — GET /api/inventory?storeId={id}
- `get_purchase_history(store_id)` — GET /api/inventory (purchase order data)
- `suggest_reorder_quantity(item_id, current, avg_consumption)` — internal calculation
- `alert_manager(store_id, waste_summary)` — POST /api/notifications if waste > 5% threshold

**Value:** Direct cost saving. Restaurants lose 4–10% revenue to food waste. Agent targets <3%.

**Commit:** `feat(agent): waste reduction — daily closing waste tracking + reorder optimization`

---

### PHASE F — MOBILE APPS

**Expert Lens: Senior Android Developer**

**System design intent:** Customer mobile app (masova-mobile) uses Expo bare workflow with RN 0.81. Driver app (MaSoVaDriverApp) uses RN 0.83. Both need updates for Phase A/B API changes. Driver app needs WebSocket for real-time dispatch notifications.

---

#### F1 — Customer Mobile: AddressGate equivalent
**Branch:** `feat/mobile-address-gate`
**Machine:** Mac
**Repo:** `/Users/souravamseekarmarti/Projects/masova-mobile`
**Metro port:** 8888

**What:** Implement address selection screen using React Native + Google Places API before customer reaches menu. Mirror the web AddressGate logic. Dispatch to Redux store with same state shape as web (deliveryFeeINR, deliveryZone, withinDeliveryArea). Show zone badge in cart screen.

**Commit:** `feat(mobile): address gate with zone-based delivery fee`

---

#### F2 — Customer Mobile: Update API paths for Phase B changes
**Branch:** `fix/mobile-api-paths`
**Machine:** Mac

**What:** Update all RTK Query hooks in masova-mobile to match new consolidated API paths from Phase B. Replace `/api/v1/*` paths. Update filter calls to query params.

**Commit:** `fix(mobile): update API paths for Phase B reduced endpoint spec`

---

#### F3 — Driver App: WebSocket real-time dispatch
**Branch:** `feat/driver-dispatch-ws`
**Machine:** Mac
**Repo:** `/Users/souravamseekarmarti/Projects/MaSoVaDriverApp`

**What:** Add STOMP WebSocket client (Spring already has WebSocket config). Subscribe to `/topic/dispatch/{driverId}`. Show incoming order notification with accept/reject. Update driver online status every 4 minutes (keep Redis TTL fresh). Update /api/sessions/* path (renamed in B1 from /api/users/sessions).

**Commit:** `feat(driver-app): WebSocket real-time dispatch notifications + session path update`

---

## Part 4: Cross-Cutting Concerns (apply during Phases B–E)

These patterns must be applied as you work through each phase — not deferred.

### 1. Idempotency Keys
- `POST /api/orders` and `POST /api/payments/initiate` must accept `Idempotency-Key` header
- Store key → response in Redis (TTL 24h) before processing
- If key seen again, return cached response — prevents double-orders/double-charges
- **Implement in B2 (commerce) and B4 (payment)**

### 2. Circuit Breakers (Resilience4j — INSTALLED BUT UNUSED)
- Wire in B1 on all inter-service `HttpClient`/`RestTemplate`/`WebClient` calls
- Config: `slidingWindowSize: 10`, `failureRateThreshold: 50`, `waitDurationInOpenState: 30s`
- Fallback: return cached data or degrade gracefully (not 500)

### 3. Outbox Pattern (event-driven reliability)
- `POST /api/orders` writes order to DB AND an `outbox_events` table in same transaction
- Separate scheduler reads outbox and publishes to RabbitMQ
- Prevents the "write DB + publish RabbitMQ" dual-failure problem
- **Implement in C4 (orders schema)**

### 4. Distributed Tracing (Spring Cloud Sleuth — NOT INSTALLED)
- Add `spring-cloud-starter-sleuth` to core, commerce, logistics, payment pom.xml
- Adds `X-B3-TraceId` header propagation automatically
- Correlates logs across services for a single order flow
- **Add in C1 (postgres-setup) alongside JPA dependencies**

### 5. Structured Logging
- Add `net.logstash.logback:logstash-logback-encoder` to each service
- Output JSON logs: `{"timestamp":"...", "traceId":"...", "service":"commerce", "event":"order.created", "orderId":"..."}`
- **Add in C1**

### 6. Soft Deletes
- JPA `@Where(clause = "deleted_at IS NULL")` on all user/customer/order entities
- Never hard-delete user data (GDPR compliance + audit trail)
- **Apply in all Flyway schemas in Phase C**

### 7. Optimistic Locking
- `@Version Long version` on Order, InventoryItem, WorkingSession
- Prevents lost updates when kitchen staff and manager update same order simultaneously
- **Apply in all Flyway schemas in Phase C**

---

## Part 5: Corrections to Existing Plan Docs

### `2026-03-02-api-reduction-plan.md`
- **Task 4 (Sessions):** Gateway `core_sessions` route ALREADY EXISTS — skip "add route" step
- **Task 3 (Stores):** Do NOT remove `/public/` prefix — `find-by-location` is a new public endpoint
- **All endpoint counts:** Updated to ~75-endpoint targets (not 50)

### `2026-02-23-store-selection-implementation.md`
- **Task 7:** Port corrected from `5173` → `3000`
- **Task 3:** `find-by-location` endpoint must be explicitly preserved when B1 consolidates StoreController

### `2026-02-27-github-revamp-plan.md`
- Phases 1-4, 6, 8-9 are DONE. Remaining: stray PNG/PDF files + `ARCHITECTURE.md`

### `2026-03-02-db-migration-plan.md`
- Remove all `REFERENCES stores(id)` FK constraints — `stores` stays in MongoDB
- intelligence-service excluded from JPA/Flyway scope

---

## Part 6: Summary Table

| Phase             | Tasks        | Branches                                                                                                                        | Primary Machine             |
| ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| A — Foundation    | 14 tasks     | feat/store-selection, feat/product-site-overhaul, chore/github-final-cleanup                                                    | Mac (FE) + Dell (BE)        |
| B — API Reduction | 7 tasks      | refactor/api-reduction-{core,commerce,logistics,payment,intel,gateway}, test/api-spec-update                                    | Dell (BE) + Mac (FE for B7) |
| C — DB Migration  | 9 tasks      | chore/postgres-setup, migration/*, feat/redis-driver-status                                                                     | Dell                        |
| D — Testing       | 3 tasks      | test/pact-contracts, test/unit-fix, test/e2e-fix                                                                                | Mac                         |
| E — AI Agents     | 7 tasks      | agent/{customer-support,inventory-manager,shift-scheduler,revenue-insights,dispatch-optimizer,menu-performance,waste-reduction} | Mac                         |
| F — Mobile        | 3 tasks      | feat/mobile-address-gate, fix/mobile-api-paths, feat/driver-dispatch-ws                                                         | Mac                         |
| **Total**         | **43 tasks** | **25 branches**                                                                                                                 |                             |

---

## Part 7: API Design Reference (~75 endpoints)

| #   | Method | Path                                     | Service   | Auth    |
| --- | ------ | ---------------------------------------- | --------- | ------- |
| 1   | POST   | /api/auth/login                          | core      | Public  |
| 2   | POST   | /api/auth/register                       | core      | Public  |
| 3   | POST   | /api/auth/refresh                        | core      | Public  |
| 4   | POST   | /api/auth/logout                         | core      | Bearer  |
| 5   | GET    | /api/users/{userId}                      | core      | Bearer  |
| 6   | PUT    | /api/users/{userId}                      | core      | Bearer  |
| 7   | PATCH  | /api/users/{userId}/status               | core      | Manager |
| 8   | GET    | /api/users                               | core      | Manager |
| 9   | GET    | /api/customers                           | core      | Manager |
| 10  | GET    | /api/customers/{id}                      | core      | Bearer  |
| 11  | PUT    | /api/customers/{id}                      | core      | Bearer  |
| 12  | POST   | /api/sessions/start                      | core      | Bearer  |
| 13  | POST   | /api/sessions/end                        | core      | Bearer  |
| 14  | GET    | /api/shifts                              | core      | Bearer  |
| 15  | POST   | /api/shifts                              | core      | Manager |
| 16  | PATCH  | /api/shifts/{shiftId}                    | core      | Manager |
| 17  | GET    | /api/stores                              | core      | Public  |
| 18  | GET    | /api/stores/{storeId}                    | core      | Public  |
| 19  | PUT    | /api/stores/{storeId}                    | core      | Manager |
| 20  | GET    | /api/stores/public/find-by-location      | core      | Public  |
| 21  | GET    | /api/notifications                       | core      | Bearer  |
| 22  | PATCH  | /api/notifications/{id}/read             | core      | Bearer  |
| 23  | GET    | /api/gdpr/consent                        | core      | Bearer  |
| 24  | POST   | /api/gdpr/request/{id}/process           | core      | Manager |
| 25  | GET    | /api/reviews                             | core      | Manager |
| 26  | PATCH  | /api/reviews/{id}                        | core      | Manager |
| 27  | GET    | /api/menu                                | commerce  | Public  |
| 28  | POST   | /api/menu                                | commerce  | Manager |
| 29  | PUT    | /api/menu/{itemId}                       | commerce  | Manager |
| 30  | PATCH  | /api/menu/{itemId}/availability          | commerce  | Manager |
| 31  | POST   | /api/orders                              | commerce  | Bearer  |
| 32  | GET    | /api/orders/{orderId}                    | commerce  | Public  |
| 33  | GET    | /api/orders                              | commerce  | Bearer  |
| 34  | PATCH  | /api/orders/{orderId}/status             | commerce  | Bearer  |
| 35  | PATCH  | /api/orders/{orderId}/assign-driver      | commerce  | Manager |
| 36  | PATCH  | /api/orders/{orderId}/quality-checkpoint | commerce  | Staff   |
| 37  | PATCH  | /api/orders/{orderId}/delivery           | commerce  | Driver  |
| 38  | GET    | /api/orders/analytics                    | commerce  | Manager |
| 39  | GET    | /api/kitchen-equipment                   | commerce  | Staff   |
| 40  | PATCH  | /api/kitchen-equipment/{equipmentId}     | commerce  | Staff   |
| 41  | GET    | /api/ratings/token/{token}               | commerce  | Public  |
| 42  | POST   | /api/delivery/dispatch                   | logistics | Manager |
| 43  | POST   | /api/delivery/accept                     | logistics | Driver  |
| 44  | POST   | /api/delivery/location-update            | logistics | Driver  |
| 45  | GET    | /api/delivery/track/{orderId}            | logistics | Public  |
| 46  | POST   | /api/delivery/verify                     | logistics | Driver  |
| 47  | PATCH  | /api/delivery/{trackingId}/status        | logistics | Driver  |
| 48  | GET    | /api/delivery/zone                       | logistics | Public  |
| 49  | GET    | /api/delivery/drivers/available          | logistics | Manager |
| 50  | GET    | /api/delivery/performance                | logistics | Manager |
| 51  | GET    | /api/inventory                           | logistics | Manager |
| 52  | POST   | /api/inventory                           | logistics | Manager |
| 53  | PATCH  | /api/inventory/{itemId}                  | logistics | Manager |
| 54  | GET    | /api/inventory/suppliers                 | logistics | Manager |
| 55  | POST   | /api/inventory/purchase-orders           | logistics | Manager |
| 56  | POST   | /api/payments/initiate                   | payment   | Bearer  |
| 57  | POST   | /api/payments/verify                     | payment   | Bearer  |
| 58  | GET    | /api/payments/{transactionId}            | payment   | Bearer  |
| 59  | GET    | /api/payments                            | payment   | Manager |
| 60  | POST   | /api/payments/refund                     | payment   | Manager |
| 61  | POST   | /api/payments/webhook                    | payment   | Public  |
| 62  | GET    | /api/analytics                           | intel     | Manager |
| 63  | GET    | /api/analytics/staff/{staffId}/hours     | intel     | Manager |
| 64  | GET    | /api/bi                                  | intel     | Manager |
| 65  | POST   | /api/analytics/cache/clear               | intel     | Manager |

---

## Part 8: Verification Checklist (per phase)

**Phase A done when:**
- `curl http://192.168.50.88:8085/api/stores/public/find-by-location?latitude=17.395&longitude=78.491` returns `{deliveryFeeINR, deliveryZone, withinDeliveryArea}`
- Navigate to `localhost:3000/order` → AddressGate appears before menu
- Navigate to `localhost:3000/manager` → AddressGate does NOT appear
- Cart shows Redux-driven delivery fee (not 29/50 hardcoded)
- ProductSite SupportChat opens a real chat panel (not just links)
- Footer GitHub link goes to `https://github.com/SVamseekar/masova-platform`

**Phase B done when:**
- `node scripts/test-api-full.js` → ~75 endpoints, high pass rate
- No `/api/v1/*` paths remain in any service
- `grep -c "\.route(" api-gateway/.../GatewayConfig.java` → ~20 routes

**Phase C done when:**
- PostgreSQL has row counts matching MongoDB for users, customers, orders (after Phase 2 switch)
- `GET /api/payments/verify` writes to PostgreSQL only (never MongoDB)
- Redis `driver:online:{id}` keys expire after 5 min
- Flyway migrations run cleanly on fresh DB: `flyway migrate` → no errors

**Phase D done when:**
- `npx vitest run src/pact/` → all 7 Pact contracts pass
- `npx vitest run` → ≥90% of 1374 unit tests pass
- `npx playwright test` → all 13 E2E specs pass

**Phase E done when:**
- `POST http://localhost:8000/agent/chat` with `{message: "what's my order status?", sessionId: "test"}` responds correctly
- APScheduler logs show cron agents firing at scheduled times
- Dispatch optimizer picks up `order.created` RabbitMQ event within 5s

**Phase F done when:**
- masova-mobile address gate screen shows correct zone + fee for test coordinates
- Driver app receives WebSocket dispatch notification within 10s of order creation
