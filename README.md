# MaSoVa Restaurant OS

A full-stack restaurant operating system built for multi-store operations — covering everything from customer ordering to kitchen display, driver delivery, POS, and manager analytics.

---

## Architecture

```
                        ┌─────────────────┐
                        │   API Gateway   │  :8080
                        │  (JWT + Rate    │
                        │   Limiting)     │
                        └────────┬────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
   ┌──────▼──────┐       ┌──────▼──────┐       ┌──────▼──────┐
   │    Core     │       │  Commerce   │       │   Payment   │
   │  Service   │       │   Service   │       │   Service   │
   │   :8085    │       │   :8084    │       │   :8089    │
   │  Auth/Users │       │ Orders/Menu │       │  Payments   │
   └─────────────┘       └─────────────┘       └─────────────┘
          │                      │                      │
   ┌──────▼──────┐       ┌──────▼──────┐
   │  Logistics  │       │Intelligence │
   │   Service   │       │   Service   │
   │   :8086    │       │   :8087    │
   │  Delivery   │       │ Analytics   │
   └─────────────┘       └─────────────┘
          │
   ┌──────▼──────────────────────────────────┐
   │         Infrastructure                   │
   │  MongoDB :27017 · Redis :6379            │
   │  RabbitMQ :5672 · Firebase Hosting       │
   └──────────────────────────────────────────┘
```

**6 Frontend Apps** (all in `/frontend`):

| App | Audience | Key Features |
|---|---|---|
| Public Website | Customers | Landing page, menu browse, promotions |
| Customer App | Customers | Online ordering, live tracking, cart |
| POS System | In-store staff | Touch ordering, PIN auth, receipts |
| Kitchen Display | Kitchen staff | Order queue, timer, status updates |
| Driver App | Delivery drivers | Active delivery, navigation, history |
| Manager Dashboard | Managers | Analytics, staff, inventory, reports |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.x, Spring Security 6 |
| Database | MongoDB 7, Redis 7 |
| Messaging | RabbitMQ 3.12 |
| Frontend | React 19, TypeScript, Vite, MUI + Neumorphic UI |
| Mobile | React Native 0.81 (Customer), React Native 0.83 (Driver) |
| AI Agent | Python, Google ADK, FastAPI |
| Deployment | GCP Cloud Run, Firebase Hosting, Docker |

---

## Quick Start

### Prerequisites
- Java 21
- Node.js 20+
- MongoDB 7
- Redis 7
- RabbitMQ 3.12
- Maven 3.9+

### 1. Clone and configure environment
```bash
git clone https://github.com/SVamseekar/masova-platform.git
cd masova-platform
cp .env.example .env
# Fill in your values in .env
```

### 2. Start infrastructure
```bash
docker-compose up -d mongodb redis rabbitmq
```

### 3. Start backend services
```bash
./start-all.sh
# Or individually:
cd api-gateway     && mvn spring-boot:run   # :8080
cd core-service    && mvn spring-boot:run   # :8085
cd commerce-service && mvn spring-boot:run  # :8084
cd payment-service && mvn spring-boot:run   # :8089
cd logistics-service && mvn spring-boot:run # :8086
cd intelligence-service && mvn spring-boot:run # :8087
```

### 4. Start frontend
```bash
cd frontend && npm install && npm run dev   # :5173
```

### 5. Seed the database (first time only)
```bash
node scripts/db/seed-database.js
```

Access at: **http://localhost:5173**

**Default credentials:**
| Role | Email | Password |
|---|---|---|
| Manager | manager@masova.com | Manager@123 |
| Staff | staff@masova.com | Staff@123 |
| Driver | driver@masova.com | Driver@123 |

For full setup details see [docs/STARTUP-GUIDE.md](docs/STARTUP-GUIDE.md).

---

## Project Structure

```
masova/
├── api-gateway/           # Spring Cloud Gateway — routing, JWT, rate limiting
├── core-service/          # Auth, users, stores, sessions
├── commerce-service/      # Orders, menu, cart, inventory
├── payment-service/       # Payment processing, refunds
├── logistics-service/     # Delivery, drivers, tracking
├── intelligence-service/  # Analytics, reports, AI recommendations
├── shared-models/         # Shared DTOs and domain models
├── shared-security/       # JWT utilities, security config
├── frontend/              # React 19 — all 6 web apps
├── infrastructure/        # Docker, CI/CD configs
├── scripts/
│   ├── db/                # Database seeding and maintenance
│   ├── dev/               # Development utilities
│   ├── ci/                # CI/CD helpers
│   └── deploy/            # Deployment scripts
└── docs/                  # Plans, API contracts, architecture docs
```

---

## Key Features

- **Multi-store** — store-level filtering, per-store menus and staff
- **Real-time** — WebSocket order updates across all frontends
- **6-stage order lifecycle** — RECEIVED → PREPARING → READY → DISPATCHED → DELIVERED
- **JWT + Redis blacklist** — secure logout, token invalidation
- **Delivery radius validation** — distance-based delivery eligibility
- **AI support agent** — customer chat powered by Google ADK
- **Multi-role** — Customer, Staff, Driver, Manager, Admin

---

## Documentation

| Document | Description |
|---|---|
| [STARTUP-GUIDE.md](docs/STARTUP-GUIDE.md) | Full local setup walkthrough |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Service design and data flows |
| [GITHUB_REVAMP_PLAN.md](GITHUB_REVAMP_PLAN.md) | Repository structure and branching strategy |
| [docs/plans/](docs/plans/) | Implementation plans per feature |
| [docs/api-contracts/](docs/api-contracts/) | Frontend–backend API alignment |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT
