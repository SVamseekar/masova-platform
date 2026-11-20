# MaSoVa Demo Guide

> Written for the person running the demo. Plain language — every step is exact: what URL to open, what to click, what to say.

---

## Pre-Demo Setup

### 1. Start all services

```bash
# From the project root
docker compose up -d mongodb redis rabbitmq postgres

# Backend services (each in its own terminal)
cd api-gateway      && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8080
cd core-service     && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8085
cd commerce-service && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8084
cd payment-service  && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8089
cd logistics-service && mvn spring-boot:run "-Dmaven.test.skip=true"  # :8086
cd intelligence-service && mvn spring-boot:run "-Dmaven.test.skip=true" # :8087

# Frontend
cd frontend && npm run dev   # :3000

# AI agent (separate repo — optional)
cd ../masova-support
uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Verify health

```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8085/actuator/health
curl http://localhost:8084/actuator/health
```

### 3. Seed demo data (first time)

```bash
# Seed demo data using your local dev tooling (not published in this repo)
```

### 4. Pre-open browser tabs

| Tab | URL | Logged in as |
|---|---|---|
| Public site | http://localhost:3000 | — |
| Customer | http://localhost:3000/customer-login | customer@masova.com |
| KDS | http://localhost:3000/kitchen | — |
| POS | http://localhost:3000/pos | PIN: 1234 |
| Driver | http://localhost:3000/driver | driver@masova.com |
| Manager | http://localhost:3000/manager?section=dashboard | manager@masova.com |

---

## Demo Credentials

| Role | Login | Notes |
|---|---|---|
| Customer | customer@masova.com / password123 | Web + mobile |
| Manager | manager@masova.com / password123 | Full dashboard |
| Driver | driver@masova.com / password123 | Web + Crew app |
| POS / Kiosk | PIN: `1234` | Per-order PIN auth |

---

## Three Wow Moments

**1. Live order → KDS** — Customer places order; KDS updates instantly with no refresh.

**2. Unified aggregator queue** — Wolt, Deliveroo, Just Eat, Uber Eats, and direct orders in one kitchen screen.

**3. AI shift draft** — Manager reviews a proposed weekly schedule based on forecasted demand.

---

## 25-Minute Walkthrough

1. **Public site** — Landing page, menu, store info, promotions
2. **Customer order** — Browse menu, allergens, cart with zone-based delivery fee, Stripe checkout
3. **Kitchen display** — Live order queue, item timers, quality checkpoints
4. **POS** — In-store dine-in / takeaway ordering
5. **Aggregator orders** — Unified queue with source badges in manager dashboard
6. **Analytics** — Revenue, top items, channel breakdown
7. **AI insights** — Demand forecast, inventory alerts, churn prevention, review drafts
8. **Support chat** — Order status, allergen queries, refund routing
9. **Driver flow** — Active delivery, map, OTP proof-of-delivery
10. **Mobile apps** — Customer app (ordering + tracking) and Crew app (role-based staff views)
11. **Multi-store** — Store selector, per-store menus and analytics

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Order doesn't appear on KDS | Check RabbitMQ: `docker compose ps`. Restart commerce-service. |
| Payment screen errors | Stripe test card: `4242 4242 4242 4242`, any future date, any CVV |
| Mobile won't connect | Update `API_BASE_URL` in masova-mobile `src/services/api.ts` |
| Service health fails | Ensure all 6 backend services are running on expected ports |

---

## Common Owner Questions

**"How is this different from a POS?"**
> MaSoVa covers the full operation — customer app, kitchen, delivery, VAT, fiscal signing, and analytics — all connected. A POS only handles in-store billing.

**"Do I need to replace Wolt/Deliveroo?"**
> No. MaSoVa pulls aggregator orders into your own queue while you build direct-order traffic with zero commission.

**"What about offline?"**
> POS and Crew app queue operations locally and sync when connectivity returns.

Full startup details: see README Quick Start section.