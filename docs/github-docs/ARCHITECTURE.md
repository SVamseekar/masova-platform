# MaSoVa Architecture

## Service Map

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 8080 | Request routing, JWT validation (HS512), rate limiting, CORS |
| `core-service` | 8085 | Auth, users, stores, sessions, shifts, customers, reviews, notifications, campaigns, earnings, GDPR |
| `commerce-service` | 8084 | Orders, menu, KDS, kitchen equipment, tips, aggregator hub |
| `payment-service` | 8089 | Stripe (primary, SCA), Razorpay (India legacy), transactions, refunds, EU fiscal signing (DE/FR/IT/BE/HU/GB) |
| `logistics-service` | 8086 | Delivery, driver dispatch, OTP, inventory, suppliers, purchase orders, waste |
| `intelligence-service` | 8087 | Analytics, BI forecasting, reports |

## Infrastructure

| Component | Port | Purpose |
|---|---|---|
| MongoDB | 27017 | Primary data store (5 databases: masova_core, masova_commerce, masova_payment, masova_logistics, masova_analytics) |
| PostgreSQL | 5432 | Financial/relational data (dual-write target for orders, transactions, users) |
| Redis | 6379 | DB 0: JWT blacklist · DB 1: Agent sessions · Cache: menu (5 min), store (10 min), users (24h) |
| RabbitMQ | 5672 | Async messaging — `masova.orders.exchange`, `masova.notifications.exchange` |
| Firebase Hosting | — | Frontend CDN (production) |

> **Dev environment:** All infrastructure + backend services run on Dell (`192.168.50.88`). Frontend, mobile apps, and AI agent run on Mac M1.

---

## Request Flow

### Customer places an order

```
Browser/App → api-gateway:8080
  → JWT validated (HS512 signature, Redis DB 0 blacklist check)
  → Routed to commerce-service:8084
    → StoreService (core-service:8085 via Feign) validates delivery radius
    → Order created in MongoDB (masova_commerce) + PostgreSQL (commerce_schema.orders) dual-write
    → deliveryFee calculated server-side by Haversine distance zone (ZONE_A/B/C), fee amounts in store's local currency
    → tax calculated: EU VAT by EuVatEngine (country + order context: DINE_IN/TAKEAWAY/DELIVERY, FOOD/ALCOHOL/BEVERAGE)
    → RabbitMQ event published (masova.orders.exchange) → logistics-service (driver assignment)
    → RabbitMQ event published → intelligence-service (analytics update)
  → WebSocket broadcast (STOMP) to Kitchen Display + Manager Dashboard + Customer tracking
```

### Authentication flow

```
POST /api/auth/login → api-gateway → core-service:8085
  → Credentials validated, bcrypt password check
  → JWT issued (HS512, 1h access token / 7d refresh token / 8h kiosk)
  → Stored in localStorage (web, rememberMe=true) / sessionStorage (web, rememberMe=false)
             / AsyncStorage (mobile apps)

POST /api/auth/logout → core-service
  → JWT added to Redis blacklist (DB 0, TTL = remaining token lifetime)
  → All subsequent requests with that token rejected at api-gateway
```

### Order state machine

```
RECEIVED → PREPARING → OVEN → BAKED → READY → DISPATCHED → OUT_FOR_DELIVERY → DELIVERED
                                                                               → SERVED (dine-in)
                                                                               → COMPLETED (takeaway)
CANCELLED (any state, manager only)
```

Every transition: publishes `OrderStatusChangedEvent` to RabbitMQ + WebSocket broadcast.

---

## Frontend Apps

All 6 web apps live in `/frontend/src/` and are served from the same Vite build on :3000:

```
frontend/src/
├── pages/
│   ├── customer/          # Customer ordering — dark-premium theme (--dp-* vars)
│   ├── manager/           # Manager dashboard — neumorphic theme (design-tokens.ts)
│   ├── kitchen/           # KDS — public route, no auth
│   ├── driver/            # Driver view — role: DRIVER
│   └── auth/              # Login, register
├── components/
│   ├── common/            # ProtectedRoute, ErrorBoundary, LoadingSpinner
│   └── ui/neumorphic/     # Neumorphic design system components (staff pages)
├── store/
│   ├── slices/            # authSlice, cartSlice, uiSlice, notificationSlice
│   └── api/               # 19 RTK Query slices (authApi, orderApi, menuApi, etc.)
└── styles/
    ├── design-tokens.ts   # Neumorphic tokens for staff pages
    └── index.css          # .dark-premium-theme CSS vars (--bg, --gold, --red, --dp-*)
```

**Routing:** React Router — role-based via `ProtectedRoute` (checks `user.type` from JWT).
**Design split:** `.dark-premium-theme` class on `CustomerLayout` for customer pages; `design-tokens.ts` for staff.

---

## Mobile Apps

### masova-mobile (Customer) — React Native 0.81, Expo v54, Metro :8888
- TanStack Query for data fetching, Stripe (EU) / Razorpay (India legacy) payments, STOMP WebSocket, Google Maps
- Connects to `http://192.168.50.88:8080/api` in dev
- Key screens: Home, Menu, Cart, Checkout, OrderTracking (live map), ChatScreen (AI support)

### MaSoVa Crew (Staff) — React Native 0.83, Redux Toolkit + RTK Query
- Role-based navigator from `user.type`: DRIVER → DriverTabNavigator, KITCHEN_STAFF → KitchenTabNavigator, CASHIER → CashierTabNavigator, MANAGER → ManagerTabNavigator
- Offline queue (AsyncStorage, max 1000 items, 30s sync interval, 3 retries)
- Background location tracking for drivers (Notifee push notifications)
- Connects to `http://192.168.50.88:8080/api` + WS `http://192.168.50.88:8090/ws` in dev

---

## AI Agent (masova-support)

- **Port:** 8000 (FastAPI + Google ADK + Gemini 2.0 Flash)
- **Support Agent:** On-demand chat via `POST /agent/chat` — 8 tool functions calling Spring backend
- **Scheduled agents:** 3 live (demand forecasting 2am, inventory reorder every 6h, churn prevention 10am) + 3 stubs (shift optimisation, kitchen coach, dynamic pricing)
- **Event-driven:** Review response agent triggered by RabbitMQ `review.created` events (rating ≤ 3)
- **Sessions:** Redis DB 1, `masova:session:{id}`, 1h TTL, 10 turns max
- **Propose-then-approve:** No agent writes to the database autonomously

---

## Shared Libraries

### `shared-models/`
Common enums, DTOs, and events used across all 6 services:
- **Enums:** `OrderStatus` (11 values), `UserType` (CUSTOMER/STAFF/DRIVER/MANAGER/ASSISTANT_MANAGER/KIOSK), `PaymentStatus`, `AllergenType` (14 EU mandatory), `MenuCategory` (40+), `Cuisine` (8)
- **Events:** `OrderCreatedEvent`, `OrderStatusChangedEvent`, `PaymentCompletedEvent`, `PaymentFailedEvent`, `ReceiptSignedEvent`
- **DTOs:** `ApiResponse<T>`, `ErrorResponse`, `PagedResponse<T>`

### `shared-security/`
- `JwtTokenProvider` — HS512 generation/validation (claims: sub, userType, storeId, iat, exp)
- `SecurityConfigurationBase` — reused Spring Security base config
- `JwtAuthenticationFilter` — servlet filter for individual services

---

## Data Model Summary

### MongoDB Collections

| Database | Key collections |
|---|---|
| `masova_core` | users, customers, stores, reviews, notifications, campaigns, shifts, workingsessions |
| `masova_commerce` | menu_items, orders, kitchen_equipment, rating_tokens |
| `masova_payment` | transactions, refunds |
| `masova_logistics` | delivery_tracking, driver_locations, inventory_items, purchase_orders, suppliers, waste_records |
| `masova_analytics` | analytics snapshots (denormalized) |

### PostgreSQL Schemas

| Schema | Key tables |
|---|---|
| `core_schema` | users (dual-write) |
| `commerce_schema` | orders (dual-write), with fiscal_signature_id FK |
| `payment_schema` | transactions, refunds, fiscal_signatures |
| `logistics_schema` | inventory |

**Dual-write rule:** PostgreSQL first (synchronous), MongoDB second (async try/catch with `log.warn`).
**Financial data:** Soft delete only — `deleted_at` field, 7-year PCI retention.

### Redis Key Patterns

| DB | Key pattern | Purpose |
|---|---|---|
| DB 0 | `token:{jti}` | JWT blacklist (TTL = token remaining lifetime) |
| DB 1 | `masova:session:{id}` | Agent chat sessions (1h TTL) |
| Cache | `menu:*`, `store:*`, `user:*` | Read cache (5/10/24h TTL) |

---

## Inter-Service Communication

| Pattern | Used for |
|---|---|
| REST (via api-gateway) | All client-facing requests |
| Feign Client (internal) | Synchronous service-to-service (e.g. OrderService → StoreService) |
| RabbitMQ events | Async business events (order lifecycle, payment, reviews) |
| WebSocket (STOMP) | Real-time frontend updates (KDS, tracking, driver location) |
| `X-Internal-Service` header | GDPR anonymisation, payment status updates (blocked at gateway from external) |

**Rule:** commerce-service never imports from logistics-service or vice versa — use RabbitMQ.

---

## EU Compliance Layer

MaSoVa is built EU-first. These systems are all live or Phase 1 scaffolded:

### VAT Engine (`EuVatEngine`)
12-country, context-aware VAT calculation. Rates vary by country, order type (DINE_IN/TAKEAWAY/DELIVERY), and item category (FOOD/ALCOHOL/BEVERAGE/PACKAGING). Examples:

| Country | Takeaway food | Dine-in food | Alcohol |
|---|---|---|---|
| DE | 7% | 19% | 19% |
| FR | 5.5% | 10% | 20% |
| GB | 0% | 20% | 20% |
| IE | 13.5% | 13.5% | 23% |
| HU | 5% | 27% | 27% |

VatBreakdown stored per order: net/VAT/gross per category. Currency per store from `CountryProfileService` (DE/FR/IT/NL/BE/LU/IE → EUR, HU → HUF, CH → CHF, GB → GBP).

### Fiscal Signing (`FiscalSigningService`)
Runs `@Async` at order completion. Registered signers:

| Country | Signer | System | Phase |
|---|---|---|---|
| DE | `GermanyTseFiscalSigner` | TSE | 1 stub → Phase 2: local TSE REST API |
| FR | `FranceNf525FiscalSigner` | NF525 | 1 stub → Phase 2: NF525 certified API |
| IT | `ItalyRtFiscalSigner` | RT | 1 stub → Phase 2: RT device API |
| BE | `BelgiumFdmFiscalSigner` | FDM | 1 stub → Phase 2: FDM black box |
| HU | `HungaryNtcaFiscalSigner` | NTCA | 1 stub → Phase 2: OSCAR API + Redis retry |
| GB | `UkMtdFiscalSigner` | MTD | Ledger passthrough, quarterly HMRC submission |
| Others | `PassthroughFiscalSigner` | — | No legal requirement |

Signatures stored in PostgreSQL `payment_schema.fiscal_signatures`. Manager sees status on `FiscalCompliancePage` (`/manager/fiscal-compliance`).

### Allergen Compliance (EU Regulation 1169/2011)
14 mandatory allergens as `AllergenType` enum. Hard gate: `isAvailable=true` blocked until allergens declared via `PATCH /api/menu/items/{id}/allergens`. Copied menu items reset `allergensDeclared=false`.

### GDPR (EU Data Protection)
Full data subject rights: access (SAR), deletion (DPR), portability, objection. Cascading anonymisation across all 5 services via `X-Internal-Service` header. Retention: customer data 2 years, financial data 7 years (PCI DSS). GDPR endpoints blocked at gateway from external access.

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
    ├── Cloud SQL PostgreSQL
    ├── Redis (Upstash)
    └── RabbitMQ (CloudAMQP)
```

See [docs/plans/2026-03-03-phase7-deployment-plan.md](plans/2026-03-03-phase7-deployment-plan.md) for deployment setup.
