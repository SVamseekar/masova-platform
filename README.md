# MaSoVa Restaurant OS

**A full-stack restaurant operating system** — from customer ordering and live kitchen display, to AI-driven demand forecasting, multi-gateway payments, delivery management, and third-party aggregator integration.

Built across a microservices backend (Java 21 · Spring Boot 3), six React web apps, two React Native mobile apps, and a Python AI agent layer (Google ADK · FastAPI).

---

## What is MaSoVa?

MaSoVa is a complete restaurant management platform built to handle the full lifecycle of a restaurant business at scale. Customers browse menus, place orders, and track deliveries in real time. Kitchen staff manage order queues on a live display. Drivers receive assignments and update delivery status via mobile. Managers get AI-powered forecasting, staff scheduling, and revenue analytics — all from a unified platform.

The system supports multiple stores simultaneously, with store-scoped menus, staff, and analytics. Orders flow through a 6-stage lifecycle with event-driven status propagation across all connected clients via RabbitMQ and WebSockets.

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
  │ Auth · Users│          │ Orders · Menu│          │Stripe·Razorpay│
  │ Stores · PIN│          │ Cart · KDS   │          │ Refunds · Tx  │
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

The `masova-support` service (Python · Google ADK 1.25 · FastAPI) runs 8 AI agents, each with a dedicated purpose:

| Agent | What it does |
|---|---|
| **Support Agent** | Customer-facing chat — answers order status, menu queries, handles complaints and refund requests |
| **Demand Forecasting** | Predicts item-level demand by store using historical order patterns |
| **Dynamic Pricing** | Recommends time-based price adjustments based on demand signals |
| **Inventory Reorder** | Monitors stock levels and triggers reorder suggestions before stockout |
| **Kitchen Coach** | Analyses prep times and throughput to surface kitchen efficiency gaps |
| **Churn Prevention** | Identifies at-risk customers by order frequency drop and triggers retention offers |
| **Review Response** | Auto-drafts personalised responses to customer reviews (manager approves before sending) |
| **Shift Optimisation** | Recommends staff scheduling based on forecasted footfall and historical throughput |

All agents follow a **propose-then-approve** model — no agent writes to the database autonomously. Every action is surfaced to a manager for confirmation. Agents are triggerable manually via `POST /agents/{name}/trigger` and run on APScheduler for automated cadences.

The Support Agent is embedded in both the customer web app (ChatWidget) and the customer mobile app (ChatScreen), with session state persisted in Redis.

---

## Feature Surface

### Web Applications (React 19 · TypeScript · Vite)

| App | Audience | Key Features |
|---|---|---|
| **Customer App** | Customers | Menu browsing, cart, online ordering, live order tracking, AI chat |
| **POS / Kiosk** | In-store staff | Touch-first ordering, PIN auth, dine-in/takeaway, receipt printing |
| **Kitchen Display** | Kitchen staff | Live order queue, per-item timers, READY/PREPARING columns, KDS |
| **Driver App** | Delivery drivers | Active delivery view, OTP proof-of-delivery, delivery history |
| **Manager Dashboard** | Managers | Revenue analytics, staff management, inventory, AI insights, reports |
| **Public Website** | Everyone | Landing page, public menu, store locator, promotions |

### Mobile Applications

| App | Stack | Audience |
|---|---|---|
| **masova-mobile** (Customer) | React Native 0.81 · bare workflow | Customers — ordering, tracking, Google Sign-In, Razorpay, Google Maps |
| **MaSoVa Crew** (Staff) | React Native 0.83 | Kitchen, Driver, Cashier, Manager — role-based via JWT `user.type` |

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
| **Mobile** | React Native 0.81 / 0.83, STOMP WebSocket, Google Maps SDK |
| **AI Agents** | Python 3.11, Google ADK 1.25, FastAPI, APScheduler, Gemini |
| **Auth** | JWT (RS256), Redis blacklist for logout, PIN auth for POS |
| **Payments** | Stripe (EU — PaymentElement), Razorpay (India) — gateway-routed by store country |
| **Deployment** | GCP Cloud Run, Firebase Hosting, Docker Compose |
| **Testing** | JUnit 5, Mockito, Vitest, React Testing Library, Pact (contract tests) |

---

## System Design Highlights

- **Dual-write persistence** — financial data writes to PostgreSQL first (synchronous), then MongoDB (async). Guarantees relational integrity for transactions while preserving document flexibility for queries.

- **Event-driven order lifecycle** — every order state transition publishes to `masova.orders.exchange`. Kitchen display, driver app, and customer tracking all update in real time without polling.

- **Multi-gateway payment routing** — `PaymentGatewayResolver` selects Stripe or Razorpay at runtime based on store `countryCode`. Adding a new market requires one config line, not new code paths.

- **JWT + Redis blacklist** — logout immediately invalidates the token server-side (Redis DB 0). No waiting for token expiry. Agent sessions use a separate Redis DB 1 to avoid key collisions.

- **Zone-based delivery pricing** — delivery fee computed server-side by distance band (0–3km / 3–6km / 6–10km), propagated to Redux and rendered across all clients from a single source of truth. Never hardcoded.

- **Aggregator Hub** — inbound orders from Wolt, Deliveroo, Just Eat, and Uber Eats are normalised into the internal `Order` model and flow through the same order lifecycle as direct orders.

- **Allergen compliance** — 14 EU allergen types enforced as a typed enum. Menu items cannot be set to `available` until a manager makes an explicit allergen declaration, preventing accidental non-compliance.

- **Multi-tenancy** — all customer, order, and menu data is scoped to `storeId`. Indexes, unique constraints, and query filters enforce store isolation at the database layer.

---

## Screenshots

<table>
  <tr>
    <td><img src="screenshot-customer-home.png" alt="Customer Home" /></td>
    <td><img src="homepage-hero.png" alt="Homepage Hero" /></td>
  </tr>
  <tr>
    <td><img src="scroll1.png" alt="Customer App" /></td>
    <td><img src="scroll2.png" alt="Manager Dashboard" /></td>
  </tr>
  <tr>
    <td><img src="scroll3.png" alt="Kitchen Display" /></td>
    <td><img src="scroll4.png" alt="Driver App" /></td>
  </tr>
</table>

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
| [DOCUMENTATION.md](DOCUMENTATION.md) | Full system documentation |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development setup and contribution guide |
| [docs/plans/](docs/plans/) | Phased implementation plans (8 phases) |

---

