# Changelog

All notable changes to MaSoVa are documented here.

---

## [Unreleased]

All 8 phases complete. Current focus: demo preparation and data seeding for capacity testing.

---

## [4.0.0] — 2026-05-17

### Added (Phase 8 — Quality Gate)
- Backend unit + integration test coverage: core 80.77%, commerce 85%, payment 86%, logistics 81.9%, intelligence 96%
- Pact provider tests for all 6 services (RabbitMQ event contracts + HTTP contract tests)
- SonarQube integration for all services — ANALYSIS SUCCESSFUL on all services
- JaCoCo coverage enforcement in parent pom (80% line, 60% branch minimums)
- JaCoCo exclusions for untestable external integrations (EmailService, SmsService, PushService)
- Frontend Vitest test suite — 107 test files, 80%+ coverage thresholds

---

## [3.5.0] — 2026-04-06

### Added (Phase 7 — GCP Cloud Run Deployment)
- GCP Cloud Run deployment for all 6 services
- Firebase Hosting for React frontend (SPA)
- CI/CD pipeline via GitHub Actions (`release.yml`, `deploy.yml`)
- MongoDB Atlas (production), Cloud SQL PostgreSQL, Upstash Redis, CloudAMQP RabbitMQ

### Added (Phase 6 — AI Agents)
- 8 AI agents fully operational: Support, Demand Forecasting, Dynamic Pricing, Inventory Reorder, Kitchen Coach, Churn Prevention, Review Response, Shift Optimisation
- All agents follow propose-then-approve model — no autonomous database writes
- `POST /agents/{name}/trigger` for manual agent triggering
- APScheduler sharing FastAPI event loop for all background agents

### Added (Phase 5 — MaSoVa Crew)
- MaSoVa Crew staff app (React Native 0.83, com.masovacrew)
- Role-based navigation from JWT `user.type`: Driver, Kitchen, Cashier, Manager
- Offline queue (AsyncStorage, 1000 items max, 30s sync, 3 retries)
- Background location tracking for drivers (Notifee push notifications)
- Role colour scheme: Driver `#00B14F`, Kitchen `#FF6B35`, Cashier `#2196F3`, Manager `#7B1FA2`

---

## [3.0.0] — 2026-05-30

### Added (Phase 4 — Frontend Revamp)
- Dark-premium design system for all customer-facing pages (`--bg: #0A0908`, `--gold: #D4A843`, `--red: #C62A09`)
- Neumorphic design system tokens for staff/manager pages (`design-tokens.ts`)
- `CustomerLayout` component applying `.dark-premium-theme` CSS class
- Voice input/output in ChatWidget (Web Speech API, locale configurable per store)
- Google Places autocomplete on checkout address input
- `AddressGate` store selector with Haversine distance calculation
- `FloatingChatBubble` — fixed-position AI chat widget on customer pages
- Payment preference pre-selection on checkout
- `FiscalCompliancePage` at `/manager/fiscal-compliance` (EU fiscal signing status)
- `fiscalApi` RTK slice for fiscal compliance endpoints

### Added (Phase 3 — Order Flow Hardening)
- Quality checkpoint system on orders (7 types: INGREDIENT_QUALITY, PORTION_SIZE, TEMPERATURE, PRESENTATION, TASTE_TEST, PACKAGING, FINAL_INSPECTION)
- Make-table station assignment for kitchen staff
- OTP proof-of-delivery (4-digit, 15 min expiry) + alternative proof types (SIGNATURE, PHOTO, CONTACTLESS)
- `POST /api/orders/{id}/status` — explicit state transition endpoint
- `PATCH /api/orders/{id}/next-stage` — KDS bump endpoint
- `POST /api/orders/{id}/quality-checkpoint` — checkpoint management
- EU VAT engine — 12 countries, context-aware rates (DINE_IN vs TAKEAWAY, FOOD vs ALCOHOL)
- Fiscal signing service — 7 country signers (DE/TSE, FR/NF525, IT/SDI, ES/VeriFactu, UK/MTD, US, passthrough)
- `ReceiptSignedEvent` published to `masova.compliance.order-events` queue
- Flyway migrations: V6–V8 (fiscal_signatures table, fiscal columns on orders, compliance indexes)
- Tip management (PostgreSQL `payment_schema`, `TipController`, `TipService`)
- Staff earnings & payroll (`StaffEarningsSummaryEntity`, `StaffPayRateEntity`, `EarningsController`)

---

## [2.5.0] — 2026-03-03

### Added (Phase 2 — PostgreSQL Migration)
- Dual-write persistence: all financial data writes to PostgreSQL first (synchronous), MongoDB second (async)
- PostgreSQL schemas: `core_schema.users`, `commerce_schema.orders`, `payment_schema.transactions`, `payment_schema.refunds`, `logistics_schema.inventory`
- Flyway migrations: V1–V5 (schema creation, indexes, covering indexes)
- `@JdbcTypeCode(SqlTypes.JSON)` for Hibernate 6 JSONB fields
- Soft-delete pattern on all financial entities (`deleted_at` — 7-year PCI retention)
- `micrometer-tracing-bridge-brave` (replaces Spring Cloud Sleuth)
- Redis DB split: DB 0 = JWT blacklist, DB 1 = agent sessions

---

## [2.4.0] — 2026-03-02

### Added (Phase 1 — API Reduction)
- Consolidated 471 endpoints to 175 canonical endpoints (32 controllers)
- All filter variants collapsed to query params (e.g. `GET /api/orders?storeId=&status=&customerId=`)
- `DispatchController` + `TrackingController` + `PerformanceController` merged into `DeliveryController`
- `ResponseController` merged into `ReviewController`
- `POST /api/customers/get-or-create` blocked at gateway (internal-only)
- `GET /api/orders/track/{orderId}` made public (no auth required)
- `GET /api/delivery/track/{orderId}` made public
- `GET /api/reviews/public/token/{token}` public rating flow
- API contract validation: Pact consumer-driven contract tests added
- `docs/api-contracts/API_CONTRACT_SOLUTION.md` — API contract guide

---

## [2.3.0] — 2026-02-27

### Added
- Store selection with Haversine distance calculation + delivery zone validation
- Distance-based delivery pricing: ZONE_A (0–3km), ZONE_B (3–6km), ZONE_C (6–10km) — fee amounts configurable per store in local currency (EUR/GBP/CHF/etc.), free delivery above a configurable threshold
- `selectDeliveryFeeINR` Redux selector — single source of truth for delivery fee across all clients (selector name is a legacy artefact; value is currency-neutral at runtime)
- `StoreContext` in masova-mobile for multi-store customer experience
- Aggregator Hub: normalised order ingestion from Wolt, Deliveroo, Just Eat, Uber Eats (`orderSource` enum)
- `aggregatorOrderId`, `aggregatorCommission`, `aggregatorNetPayout` on Order entity

---

## [2.2.0] — 2026-02-22

### Fixed
- 14 order-flow gaps identified in full API audit
- Full API test suite added (`scripts/dev/test-api-full.js`)

---

## [2.1.0] — 2026-02-20

### Added
- Redis JWT blacklist in `core-service` JwtService
- Logout blacklists token; fixed axios storage key; fixed authApi endpoint
- Delivery radius validation: core-service endpoint + StoreServiceClient + OrderService check + frontend warning
- CI/CD rewritten: `release.yml` for 6 services, new `ci.yml`
- `docker-compose.yml` for all 6 services + 5 Dockerfiles

---

## [2.0.0] — 2026-02-18

### Changed
- Consolidated 12 microservices into 6: api-gateway, core-service, commerce-service, payment-service, logistics-service, intelligence-service
- Shared models extracted into `shared-models/`
- Shared security extracted into `shared-security/`

### Added
- GCP Cloud Run deployment pipeline
- Firebase Hosting for frontend
- GitHub Actions CI/CD workflows
- AI support agent (`masova-support`) — Google ADK + Gemini 2.0 Flash + FastAPI
- 3 live background agents: demand forecasting (2am), inventory reorder (every 6h), churn prevention (10am)
- Review response agent (RabbitMQ event-driven, rating ≤ 3)
- GDPR compliance: data access, deletion, portability, objection + cascading anonymisation across services
- Allergen compliance: 14 EU mandatory allergens enforced at API level (items blocked from `isAvailable=true` until declared)
- Multi-gateway payment routing: Stripe (primary — SCA/3D Secure, EUR/GBP/CHF/HUF/USD/CAD) for EU/international stores, Razorpay for India legacy stores — routed automatically by `PaymentGatewayResolver` on `store.countryCode`
- `PiiEncryptionService` (AES-256) for card data
- Loyalty programme: BRONZE/SILVER/GOLD/PLATINUM tiers, signup bonus 100pts, birthday bonus 200pts
- Rate limiting: 5 login attempts / 15 min lockout (IP-based brute force protection)
- GDPR endpoints blocked at gateway from external access (`X-Internal-Service` header required)

---

## [1.5.0] — 2026-02-15

### Added
- Manager Dashboard consolidation — unified shell with 8 sections at `/manager?section=X&tab=Y`
- Customer web revamp — neumorphic design system
- Store selector component with distance filtering
- Database seeding script

---

## [1.0.0] — 2026-01-05

### Added
- Initial 12-service microservice architecture
- Core order lifecycle (6 stages)
- JWT authentication with Spring Security (HS512)
- React frontend with 6 apps (Public, Customer, POS, KDS, Driver, Manager)
- MongoDB + Redis + RabbitMQ infrastructure
- WebSocket real-time order updates (STOMP)
- Multi-store, multi-role system
- masova-mobile customer app (React Native, bare workflow)
