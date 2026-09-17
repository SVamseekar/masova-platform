# Changelog

All notable changes to MaSoVa are documented here.

---

## [Unreleased]

Nothing yet.

---

## [3.0.0] — 2026-09-17

### MaSoVa 3.0 — The European Restaurant Operating System

Nine months of continuous delivery, consolidated into MaSoVa's landmark release: a production-grade operating system for multi-store European restaurant groups, spanning regulatory compliance, delivery marketplace integration, in-store operations, and the diner experience.

### European Expansion & Regulatory Compliance
- EU 14-Allergen Safety Management — menu item tagging and diner-facing safety filtering across every ordering surface
- Intelligent EU VAT Engine — automatic dine-in vs. takeaway/delivery tax rate differentials, applied per order line
- Certified Fiscal Signing across 7 European jurisdictions — German TSE/KassenSichV, Austrian RKSV, French NF525, Spanish TicketBAI, Italian RT, Poland, and Portugal
- True multi-currency and locale engine — native support for EUR, GBP, HUF, and other regional currencies, driven by store country configuration

### Third-Party Delivery Aggregator Hub
- Direct two-way order ingestion and webhook synchronization for Wolt, Deliveroo, Just Eat, and Uber Eats
- Single-screen operations — marketplace orders flow straight into kitchen display and POS, eliminating aggregator tablet clutter

### Next-Gen In-Store POS & Kitchen Display System
- High-speed cashier POS (`/pos`) with table assignment, split billing, and fast modifier flows
- Live-shift KDS (`/kitchen`) with order urgency timers, station routing, and a dedicated `SERVED` status column
- Table and cover management for dine-in operations
- Digital tip collection with staff attribution and payout reporting

### Enterprise Store Operations & Controls
- Truthful, real-time manager analytics — gross/net revenue, average order value, top items
- Manager authorization gates requiring sign-off on refunds, order cancellations, and complaints
- Interactive driver dispatch with delivery radius boundary validation
- Fast PIN-based staff switching for shared front-of-house terminals

### Elevated Diner Experience
- Dark-luxury customer ordering web app (`/order`) with curated promotional deals and food photography
- Frictionless European guest checkout (order without account creation), plus Google Sign-In
- Google Places address autocomplete
- Real-time visual order tracking from kitchen prep to courier handoff
- Integrated AI dining concierge for menu recommendations and order queries

### Commercial B2B Showcase
- Dedicated enterprise marketing site (`/`) featuring live interactive AI agent previews and tiered subscription plans
- GDPR-compliant cookie consent and privacy controls

---

## [2.2.0] — 2026-02-22

### Fixed
- 14 order-flow gaps identified in full API audit
- Full API test suite added (`scripts/dev/test-api-full.js`)

---

## [2.1.0] — 2026-02-20

### Added
- **Phase 2.1** — Redis JWT blacklist in `core-service` JwtService
- **Phase 2.2** — Logout blacklists token; fixed axios storage key; fixed authApi endpoint
- **Phase 2.3** — Delivery radius validation: core-service endpoint + StoreServiceClient + OrderService check + frontend warning
- **Phase 2.4** — CI/CD rewritten: `release.yml` for 6 services, new `ci.yml`
- **Phase 2.5** — `docker-compose.yml` for all 6 services + 5 Dockerfiles

---

## [2.0.0] — 2026-02-18

### Changed
- **Consolidated** 12 microservices into 6: api-gateway, core-service, commerce-service, payment-service, logistics-service, intelligence-service
- Shared models extracted into `shared-models/`
- Shared security extracted into `shared-security/`

### Added
- GCP Cloud Run deployment pipeline
- Firebase Hosting for frontend
- GitHub Actions CI/CD workflows
- AI support agent (`masova-support`) — Google ADK + FastAPI

---

## [1.5.0] — 2026-02-15

### Added
- Manager Dashboard consolidation — unified shell with sections
- Customer web revamp — neumorphic design system
- Store selector component with distance filtering
- Database seeding script (`scripts/db/seed-database.js`)

---

## [1.0.0] — 2026-01-05

### Added
- Initial 12-service microservice architecture
- Core order lifecycle (6 stages)
- JWT authentication with Spring Security
- React frontend with 6 apps (Public, Customer, POS, KDS, Driver, Manager)
- MongoDB + Redis + RabbitMQ infrastructure
- WebSocket real-time order updates
- Multi-store, multi-role system
