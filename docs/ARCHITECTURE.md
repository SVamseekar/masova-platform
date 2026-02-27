# MaSoVa Architecture

## Service Map

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 8080 | Request routing, JWT validation, rate limiting |
| `core-service` | 8085 | Auth, users, stores, sessions, staff |
| `commerce-service` | 8084 | Orders, menu, cart, inventory |
| `payment-service` | 8089 | Payment processing, refunds, receipts |
| `logistics-service` | 8086 | Delivery management, drivers, tracking |
| `intelligence-service` | 8087 | Analytics, reports, AI recommendations |

## Infrastructure

| Component | Port | Purpose |
|---|---|---|
| MongoDB | 27017 | Primary data store |
| Redis | 6379 | JWT blacklist, session cache, rate limiting |
| RabbitMQ | 5672 | Async messaging between services |
| Firebase Hosting | — | Frontend CDN |

---

## Request Flow

### Customer places an order

```
Browser → api-gateway:8080
  → JWT validated (Redis blacklist check)
  → routed to commerce-service:8084
    → StoreService (core-service:8085) validates delivery radius
    → Order created in MongoDB
    → RabbitMQ event published → logistics-service (driver assignment)
    → RabbitMQ event published → intelligence-service (analytics)
  → WebSocket broadcast to Kitchen Display + Manager Dashboard
```

### Authentication flow

```
POST /api/auth/login → api-gateway → core-service
  → Credentials validated against MongoDB
  → JWT issued (HS512, 24h expiry)
  → Stored in localStorage (web) / SecureStore (mobile)

POST /api/auth/logout → core-service
  → JWT added to Redis blacklist (TTL = remaining token lifetime)
  → All subsequent requests with that token rejected at api-gateway
```

---

## Frontend Apps

All 6 apps live in `/frontend/src/` and are served from the same Vite build:

```
frontend/src/
├── apps/
│   ├── PublicWebsite/     # Landing, menu browse, promotions
│   ├── POSSystem/         # In-store POS with PIN auth
│   └── DriverApp/         # Delivery management
├── pages/
│   ├── customer/          # Customer ordering flow
│   ├── kitchen/           # Kitchen Display System
│   └── manager/           # Manager Dashboard
└── components/
    ├── common/            # Shared components
    └── ui/neumorphic/     # Design system components
```

**Routing:** React Router — role-based routing via `ProtectedRoute` component.

---

## Shared Libraries

### `shared-models/`
Common DTOs used across services:
- `OrderDTO`, `UserDTO`, `StoreDTO`, `MenuItemDTO`
- Event models for RabbitMQ messages

### `shared-security/`
- `JwtService` — token generation, validation, Redis blacklist
- `SecurityConfig` base — reused across all services

---

## Data Model Summary

### MongoDB Collections (masova_db)

| Collection | Owned by | Key fields |
|---|---|---|
| `users` | core-service | email, phone, role, storeId |
| `stores` | core-service | name, location, deliveryRadius |
| `sessions` | core-service | userId, token, expiresAt |
| `menu_items` | commerce-service | name, price, category, storeId |
| `orders` | commerce-service | status, items, customerId, storeId |
| `inventory` | commerce-service | itemId, quantity, storeId |
| `payments` | payment-service | orderId, amount, status, gateway |
| `deliveries` | logistics-service | orderId, driverId, status, location |
| `drivers` | logistics-service | userId, status, currentLocation |

---

## Inter-Service Communication

| Pattern | Used for |
|---|---|
| REST (via api-gateway) | Client-facing requests |
| Feign Client (direct) | Service-to-service sync calls |
| RabbitMQ | Async events (order created, payment confirmed, delivery assigned) |
| WebSocket (STOMP) | Real-time frontend updates |

---

## Deployment (GCP)

```
GCP Project
├── Cloud Run
│   ├── masova-api-gateway
│   ├── masova-core-service
│   ├── masova-commerce-service
│   ├── masova-payment-service
│   ├── masova-logistics-service
│   └── masova-intelligence-service
├── Firebase Hosting
│   └── frontend (React SPA)
└── External
    ├── MongoDB Atlas
    ├── Redis (Upstash)
    └── RabbitMQ (CloudAMQP)
```

See [docs/plans/2026-02-21-phase-5-deployment.md](plans/2026-02-21-phase-5-deployment.md) for deployment setup.
