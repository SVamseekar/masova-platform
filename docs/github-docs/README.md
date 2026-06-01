# MaSoVa Restaurant OS

<div align="center">

**The complete operating system for modern restaurants.**

*Customer ordering · Kitchen display · Delivery management · AI analytics · Multi-store*

![Java](https://img.shields.io/badge/Java_21-Spring_Boot_3-orange?logo=spring&logoColor=white)
![React](https://img.shields.io/badge/React_19-TypeScript-blue?logo=react)
![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react)
![Python](https://img.shields.io/badge/Python_3.12-Google_ADK-green?logo=python)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Financial_Data-4169E1?logo=postgresql&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Event_Driven-FF6600?logo=rabbitmq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-Infrastructure-2496ED?logo=docker&logoColor=white)

**6 microservices · 8 AI agents · 6 web apps · 2 mobile apps · 8+ months of development**

</div>

---

## What is MaSoVa?

MaSoVa is a **production-grade, full-stack restaurant operating system** built for multi-store operations. It covers the entire restaurant lifecycle end-to-end: customers browse menus, place orders and track deliveries in real time. Kitchen staff manage live order queues on a dedicated display. Drivers receive assignments and confirm delivery via OTP on mobile. Managers get AI-powered demand forecasting, staff scheduling, revenue analytics and aggregator order normalisation — all from one unified platform.

**Built for EU restaurant owners who need more than a POS.** MaSoVa handles everything aggregators (Wolt, Deliveroo, Just Eat, Uber Eats), legacy POS terminals, and manual spreadsheets can't — unified, compliant, and scalable across Europe.

---

## For Restaurant Owners

> **"One platform to run everything."**

| Problem you have today | How MaSoVa solves it |
|---|---|
| Orders from Wolt, Deliveroo, Just Eat, and Uber Eats are in separate tablets | All aggregator orders land in one unified queue, same screen as your own orders |
| Kitchen doesn't know which order is urgent | Live KDS with per-item timers, preparation columns, and automatic status updates |
| You find out about stockouts after it's too late | AI Inventory Agent alerts you before stockout and triggers reorder suggestions |
| No idea which items to prep more of on weekends | Demand Forecasting Agent predicts item-level demand from your own history |
| Reviewing customer feedback takes hours | AI Review Response Agent drafts personalised replies — you just approve or edit |
| Staff scheduling is a guess every week | Shift Optimisation Agent recommends staffing levels from forecasted footfall |
| Delivery fees vary but no one keeps track | Zone-based pricing computed server-side (0–3km / 3–6km / 6–10km), displayed consistently in the store's local currency |
| VAT compliance is a manual headache | EU VAT calculated automatically per country, order type, and item category — 12 countries supported |
| Fiscal signing obligations differ by country | Automated fiscal signing for DE, FR, IT, BE, HU, GB — receipts signed at order completion |
| Running 2+ locations means double the chaos | Full multi-store support — each store has its own menu, staff, and analytics |

👉 **[See the demo guide →](DEMO.md)**

---

## Architecture

```
                        ┌─────────────────────┐
                        │     API Gateway      │  :8080
                        │  JWT · Rate Limiting │
                        │  Spring Cloud Gateway│
                        └──────────┬──────────┘
                                   │
         ┌─────────────────────────┼──────────────────────────┐
         │                         │                          │
  ┌──────▼──────┐          ┌───────▼──────┐          ┌───────▼──────┐
  │    Core     │          │   Commerce   │          │   Payment    │
  │   Service   │          │   Service    │          │   Service    │
  │   :8085     │          │   :8084      │          │   :8089      │
  │ Auth · Users│          │ Orders · Menu│          │Stripe · EU VAT│
  │ Stores · PIN│          │ Cart · KDS   │          │ Fiscal · Tx   │
  └─────────────┘          └──────────────┘          └──────────────┘
         │                         │                          │
  ┌──────▼──────┐          ┌───────▼──────┐
  │  Logistics  │          │ Intelligence │
  │   Service   │          │   Service    │
  │   :8086     │          │   :8087      │
  │Delivery·OTP │          │ Analytics    │
  │ Aggregators │          │ AI Insights  │
  └─────────────┘          └──────────────┘
         │
  ┌──────▼──────────────────────────────────────────┐
  │                  Infrastructure                  │
  │  MongoDB :27017 · PostgreSQL · Redis :6379       │
  │  RabbitMQ :5672 · Docker · GCP Cloud Run         │
  └──────────────────────────────────────────────────┘
```

Event-driven communication between services via RabbitMQ (`masova.orders.exchange`, `masova.notifications.exchange`). No direct service-to-service HTTP calls for business events — only Feign clients for synchronous internal queries.

---

## AI & Intelligence Layer

The `masova-support` service (Python 3.12 · Google ADK · Gemini 2.0 Flash · FastAPI :8000) runs 8 AI agents:

| Agent | Schedule | What it does |
|---|---|---|
| **Support Agent** | On-demand (chat) | Customer-facing chat — order status, menu queries, complaints, refund requests via 8 registered tools |
| **Demand Forecasting** | Daily 2am IST | 90-day moving average + day-of-week seasonality to predict item-level demand per store |
| **Dynamic Pricing** | Every 30 min, 9am–10pm IST | Drafts time-based price adjustment suggestions based on live demand signals |
| **Inventory Reorder** | Every 6 hours | Monitors stock levels, auto-drafts purchase orders when stock falls below threshold |
| **Kitchen Coach** | Nightly 11pm IST | Analyses prep times and throughput, surfaces efficiency gaps as a nightly brief |
| **Churn Prevention** | Daily 10am IST | Identifies high-value customers with dropping order frequency, triggers retention offers |
| **Review Response** | Event-driven (RabbitMQ `review.created`) | Drafts personalised manager responses for ratings ≤ 3 stars |
| **Shift Optimisation** | Every Sunday 8pm IST | Drafts the week-ahead staff schedule (KITCHEN_STAFF, CASHIER, DRIVER roles) |

All agents follow a **propose-then-approve** model — no agent writes to the database autonomously. Every action is surfaced to a manager for confirmation. Agents are triggerable manually via `POST /agents/{name}/trigger` and run on APScheduler sharing the FastAPI event loop.

The Support Agent is embedded in both the customer web app (ChatWidget) and the customer mobile app (ChatScreen), with session state persisted in Redis (in-memory fallback).

---

## Feature Surface

### Web Applications (React 19 · TypeScript · Vite)

| App | Audience | Key Features |
|---|---|---|
| **Customer App** | Customers | Menu browsing, cart, online ordering, live order tracking, AI chat |
| **POS / Kiosk** | In-store staff | Touch-first ordering, PIN auth, dine-in/takeaway, receipt printing |
| **Kitchen Display (KDS)** | Kitchen staff | Live order queue, per-item timers, PREPARING/READY columns, quality checkpoints, make-table station assignment |
| **Driver App** | Delivery drivers | Active delivery view, OTP proof-of-delivery, delivery history |
| **Manager Dashboard** | Managers | Revenue analytics, staff management, inventory, AI insights, reports |
| **Public Website** | Everyone | Landing page, public menu, store locator, promotions |

### Mobile Applications

**masova-mobile** — Customer app (React Native 0.81 · Expo v54 · TanStack Query)

| Screen group | Screens |
|---|---|
| Auth | Login, Register |
| Home | Home, Search, Notifications |
| Menu | Menu browse, Item detail |
| Cart & Checkout | Cart, Checkout, Guest checkout, Payment options |
| Orders | Order history, Live order tracking (STOMP WebSocket), Order detail, Review |
| Payments | Payment success / failed |
| Profile | Profile, Address management, Saved items |
| Support | ChatScreen — live AI support agent |

Payments via Stripe (EU/international) or Razorpay (India legacy stores). Real-time order tracking via STOMP WebSocket + Google Maps. Sunrise theme system. Store selection context for multi-store support.

---

**MaSoVa Crew** — Staff app (React Native 0.83 · Redux Toolkit + RTK Query)

Role-based navigation — the app reads `user.type` from the JWT and routes to the correct experience:

| Role | Key screens | Colour |
|---|---|---|
| **Driver** | Delivery home, Active delivery (map + OTP), Delivery history, Profile | `#00B14F` |
| **Kitchen** | Kitchen queue (live KDS), Order detail | `#FF6B35` |
| **Cashier** | Quick order (POS) | `#2196F3` |
| **Manager** | Quick dashboard, Shifts, Earnings | `#7B1FA2` |

Shared screens: My Profile, My Shifts, My Schedule, My Earnings. Background location tracking for drivers. Offline queue for operations during connectivity loss. Push notifications via Notifee. STOMP WebSocket for real-time order updates.

---

## Screenshots

<table>
  <tr>
    <td align="center"><img src="screenshot-customer-home.png" alt="Customer Home" /><br/><sub><b>Customer Home</b></sub></td>
    <td align="center"><img src="homepage-hero.png" alt="Homepage Hero" /><br/><sub><b>Public Landing Page</b></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="scroll1.png" alt="Customer Ordering" /><br/><sub><b>Customer Ordering</b></sub></td>
    <td align="center"><img src="scroll2.png" alt="Manager Dashboard" /><br/><sub><b>Manager Dashboard</b></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="scroll3.png" alt="Kitchen Display" /><br/><sub><b>Kitchen Display (KDS)</b></sub></td>
    <td align="center"><img src="scroll4.png" alt="Driver App" /><br/><sub><b>Driver App</b></sub></td>
  </tr>
</table>

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 21, Spring Boot 3.x, Spring Security 6, Spring Cloud Gateway |
| **ORM / Data** | Spring Data MongoDB, Spring Data JPA (Hibernate 6), Flyway |
| **Database** | MongoDB 7 (primary), PostgreSQL (financial/relational), Redis 7 (sessions, blacklist) |
| **Messaging** | RabbitMQ 3.12 — event-driven order and notification flows |
| **Frontend** | React 19, TypeScript, Vite, MUI, RTK Query, Redux Toolkit |
| **Design System** | Neumorphic UI (staff), Dark-Premium (customer web), Glassmorphism (customer mobile) |
| **Customer Mobile** | React Native 0.81, Expo v54, TanStack Query, STOMP WebSocket, Stripe / Razorpay, Google Maps |
| **Staff Mobile** | React Native 0.83, Redux Toolkit + RTK Query, Notifee, Background Location, Offline Queue |
| **AI Agents** | Python 3.12, Google ADK, Gemini 2.0 Flash, FastAPI, APScheduler, RabbitMQ consumer, httpx |
| **Auth** | JWT (HS512), Redis blacklist for logout (DB 0), agent sessions (DB 1), PIN auth for POS, rate-limited login (5 attempts / 15 min lockout) |
| **Payments** | Stripe (primary — SCA/3D Secure, PaymentElement, EU/international), Razorpay (India legacy stores) — gateway-routed automatically by store `countryCode` |
| **Deployment** | GCP Cloud Run, Firebase Hosting, Docker Compose |
| **Testing** | JUnit 5, Mockito, Vitest, React Testing Library, Pact (contract tests), Playwright (E2E) |

---

## System Design Highlights

- **Dual-write persistence** — financial data writes to PostgreSQL first (synchronous), then MongoDB (async). Guarantees relational integrity for transactions while preserving document flexibility for queries.

- **11-state order lifecycle** — `RECEIVED → PREPARING → OVEN → BAKED → READY → DISPATCHED → OUT_FOR_DELIVERY → DELIVERED` (plus `SERVED` for dine-in, `COMPLETED` for takeaway, `CANCELLED`). Every transition publishes to `masova.orders.exchange`. Each state has its own audit timestamp on the Order entity. Quality checkpoints and make-table station assignment are embedded in the flow.

- **Multi-gateway payment routing** — `PaymentGatewayResolver` selects Stripe (SCA/3D Secure) for all stores with a `countryCode` set, and Razorpay for legacy India stores with no `countryCode`. Stripe supports EUR, GBP, CHF, HUF, USD, CAD. Adding a new market is one config line, not a code change.

- **JWT + Redis blacklist** — logout immediately invalidates the token server-side (Redis DB 0). No waiting for token expiry. Agent sessions use a separate Redis DB 1 to avoid key collisions.

- **Zone-based delivery pricing** — delivery fee computed server-side by distance band (0–3km / 3–6km / 6–10km), propagated to Redux and rendered across all clients from a single source of truth. Never hardcoded.

- **Aggregator Hub** — inbound orders from Wolt, Deliveroo, Just Eat, and Uber Eats are normalised into the internal `Order` model. The `orderSource` field (`MASOVA | WOLT | DELIVEROO | JUST_EAT | UBER_EATS`) is preserved for commission tracking and reporting. All aggregator orders flow through the same 11-state lifecycle as direct orders.

- **EU VAT engine** — 12-country, context-aware VAT calculation (`EuVatEngine`). Rates vary by country, order type (DINE_IN/TAKEAWAY/DELIVERY), and item category (FOOD/ALCOHOL/BEVERAGE). Examples: UK food 0%, Germany takeaway food 7%, France dine-in 10%, Hungary 5%. VAT breakdown stored per order with net/VAT/gross amounts.

- **Fiscal compliance** — EU fiscal signing for DE (TSE), FR (NF525), IT (RT), BE (FDM), HU (NTCA), GB (HMRC MTD). Triggered asynchronously at order completion. Signatures stored in PostgreSQL with full audit trail. `FiscalCompliancePage` in the manager dashboard.

- **Allergen compliance (EU Regulation 1169/2011)** — 14 mandatory allergens enforced as a typed enum. Menu items cannot be set to `available` until a manager explicitly declares every allergen. Copied items reset allergen declaration — re-confirmation required before going live.

- **Multi-tenancy** — all customer, order, and menu data is scoped to `storeId`. Indexes, unique constraints, and query filters enforce store isolation at the database layer. Staff JWT tokens carry `storeId` as a claim; the gateway validates this for all non-customer roles (MANAGER, ASSISTANT_MANAGER, STAFF, DRIVER, KIOSK).

- **GDPR compliance** — built-in data erasure flow. Core-service receives a deletion request and orchestrates anonymisation calls to commerce, payment, and logistics services via the internal `X-Internal-Service` header. GDPR endpoints are blocked at the gateway from external access.

- **Consumer-driven contract tests** — Pact contracts between the React frontend and all backend services prevent API regressions from reaching production.

- **175 canonical API endpoints** — reduced from 471 in a dedicated API reduction phase. Every endpoint is documented in `docs/api-contracts/`.

---

## Quick Start

**Prerequisites:** Java 21, Node 20+, Docker, Maven 3.9+

### 1. Start infrastructure (Docker)
```bash
docker compose up -d mongodb redis rabbitmq postgres
```

### 2. Start backend services (run each in a separate terminal)
```bash
# On Dell / any machine with Java 21
cd api-gateway     && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8080
cd core-service    && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8085
cd commerce-service && mvn spring-boot:run "-Dmaven.test.skip=true"  # :8084
cd payment-service  && mvn spring-boot:run "-Dmaven.test.skip=true"  # :8089
cd logistics-service && mvn spring-boot:run "-Dmaven.test.skip=true" # :8086
cd intelligence-service && mvn spring-boot:run "-Dmaven.test.skip=true" # :8087
```

### 3. Start the frontend
```bash
cd frontend && npm install && npm run dev   # :3000
```

### 4. (Optional) Start the AI agent
```bash
# From /Users/souravamseekarmarti/Projects/masova-support (separate repo)
pip install -r requirements.txt
uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. (Optional) Start mobile apps

**Customer app** (Metro on :8888):
```bash
# From /Users/souravamseekarmarti/Projects/masova-mobile
npx react-native start --port 8888
npx react-native run-android   # or run-ios
```

**Staff/Crew app:**
```bash
# From /Users/souravamseekarmarti/Projects/MaSoVaCrewApp
npx react-native start
npx react-native run-android   # or run-ios
```

> Mobile apps expect the backend at `192.168.50.88:8080` (Dell LAN IP). Update `src/config/api.config.ts` / `src/services/api.ts` if running on a different machine.

### Verify everything is running
```bash
curl http://localhost:8080/actuator/health   # API Gateway
curl http://localhost:8085/actuator/health   # Core Service
curl http://localhost:8084/actuator/health   # Commerce Service
```

Full setup guide: [docs/STARTUP-GUIDE.md](docs/STARTUP-GUIDE.md)

---

## Project Structure

```
masova/
├── api-gateway/           # Spring Cloud Gateway — routing, JWT, rate limiting
├── core-service/          # Auth, users, stores, sessions, PIN validation
├── commerce-service/      # Orders, menu, cart, inventory, KDS, aggregator hub
├── payment-service/       # Stripe + Razorpay, transactions, refunds, webhooks
├── logistics-service/     # Delivery assignments, driver tracking, OTP, zones
├── intelligence-service/  # Analytics, reports, AI-powered recommendations
├── shared-models/         # Shared enums, events, and domain DTOs
├── shared-security/       # JWT utilities, security config
├── frontend/              # React 19 — all 6 web applications
├── infrastructure/        # Docker Compose, GCP configs
├── scripts/               # DB seeding, dev utilities, deployment helpers
├── docs/                  # Architecture docs, API contracts, implementation plans
└── masova-support/        # Python AI agents — Google ADK, FastAPI (separate repo)
```

---

## Documentation

| Document | Description |
|---|---|
| [DEMO.md](DEMO.md) | Demo guide for restaurant clients — feature walkthrough, credentials |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Full system documentation index |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development setup, branching, commit format |
| [docs/plans/](docs/plans/) | Phased implementation plans (Phase 0–8) |
| [docs/api-contracts/](docs/api-contracts/) | OpenAPI specs, API contract validation |

---

## Implementation Roadmap

The system was built in 8 structured phases, each with a detailed plan in `docs/plans/`:

| Phase | Name | Status |
|---|---|---|
| 0 | Foundation fixes | ✅ Complete |
| 1 | API reduction (471 → 175 endpoints) | ✅ Complete |
| 2 | Database migration (MongoDB → PostgreSQL for financials) | ✅ Complete |
| 3 | Order flow hardening | ✅ Complete |
| 4 | Frontend revamp (dark-premium design system) | ✅ Complete |
| 5 | Staff app (MaSoVa Crew) | ✅ Complete |
| 6 | AI agents (Google ADK) | ✅ Complete |
| 7 | Deployment (GCP Cloud Run) | ✅ Complete |
| 8 | Quality & testing | ✅ Complete |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branching strategy, commit format, and PR checklist.

---

## License

MIT © 2025 MaSoVa
