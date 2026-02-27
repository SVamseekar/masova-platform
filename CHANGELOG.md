# Changelog

All notable changes to MaSoVa are documented here.

---

## [Unreleased]

### In Progress
- Store selection with Domino's-style delivery radius
- Distance-based delivery pricing

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
