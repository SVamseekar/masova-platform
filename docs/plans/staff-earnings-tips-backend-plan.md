# Staff Earnings & Tips Backend Plan

> **Context:** MaSoVa Crew app has an Earnings screen (currently "Coming Soon").
> This document plans the backend work to make it functional.
> Tips from customer orders should be distributable to specific staff members.

---

## Feature Summary

1. **Staff Earnings** — weekly/monthly pay based on hourly rate × hours worked (from sessions)
2. **Tips** — customer can tip at order completion; tip routed to a specific staff member or pool

---

## 1. Staff Earnings

### Data Model (PostgreSQL)

```sql
-- V10__staff_earnings.sql
CREATE TABLE staff_pay_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     VARCHAR(36) NOT NULL,
    store_id        VARCHAR(36) NOT NULL,
    hourly_rate_inr NUMERIC(10,2) NOT NULL,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pay_rates_employee ON staff_pay_rates(employee_id, effective_from DESC);

CREATE TABLE staff_earnings_summary (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     VARCHAR(36) NOT NULL,
    store_id        VARCHAR(36) NOT NULL,
    week_start      DATE NOT NULL,
    week_end        DATE NOT NULL,
    hours_worked    NUMERIC(6,2) NOT NULL DEFAULT 0,
    base_pay_inr    NUMERIC(10,2) NOT NULL DEFAULT 0,
    tips_inr        NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_inr       NUMERIC(10,2) GENERATED ALWAYS AS (base_pay_inr + tips_inr) STORED,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, week_start)
);
CREATE INDEX idx_earnings_employee_week ON staff_earnings_summary(employee_id, week_start DESC);
```

### API Endpoints (core-service)

```
GET  /api/staff/earnings/weekly?employeeId={id}&weekStart={date}   → WeeklyEarnings
GET  /api/staff/earnings/history?employeeId={id}&months=3          → List<WeeklyEarnings>
GET  /api/staff/pay-rate?employeeId={id}                           → PayRate (manager only)
POST /api/staff/pay-rate                                           → Set rate (manager only)
```

### Computation (scheduled job — Sunday midnight)
- For each active employee: sum `totalHours` from `working_sessions` for the week
- Multiply by their `hourly_rate_inr` from `staff_pay_rates`
- Store in `staff_earnings_summary`
- APScheduler job in masova-support OR Spring `@Scheduled` in core-service

---

## 2. Tips

### Flow
1. Customer places order → order contains `tipAmountINR` (optional, default 0)
2. Customer can specify `tipRecipientStaffId` (e.g., the cashier who served them)
3. If no recipient specified → tips go to a store tip pool distributed equally at week end

### Data Model

```sql
-- V11__tips.sql
CREATE TABLE order_tips (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            VARCHAR(36) NOT NULL UNIQUE,
    store_id            VARCHAR(36) NOT NULL,
    amount_inr          NUMERIC(10,2) NOT NULL,
    tip_type            VARCHAR(20) NOT NULL CHECK (tip_type IN ('DIRECT', 'POOL')),
    recipient_staff_id  VARCHAR(36),   -- NULL = pool tip
    distributed         BOOLEAN NOT NULL DEFAULT FALSE,
    distributed_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ    -- soft delete only (financial data)
);
CREATE INDEX idx_tips_order ON order_tips(order_id);
CREATE INDEX idx_tips_recipient ON order_tips(recipient_staff_id, distributed);
CREATE INDEX idx_tips_store_undistributed ON order_tips(store_id, distributed) WHERE distributed = FALSE;
```

### Order Request Change

Add to `CreateOrderRequest`:
```json
{
  "tipAmountINR": 20,
  "tipRecipientStaffId": "staff-uuid-or-null"
}
```

### API Endpoints (commerce-service)

```
POST /api/orders/{id}/tip                    → Add/update tip on existing order
GET  /api/staff/tips/pending?employeeId={id} → My undistributed direct tips
```

### Distribution Job (Sunday midnight, same as earnings)
- Direct tips → credited to `recipient_staff_id`'s `staff_earnings_summary.tips_inr`
- Pool tips → split equally among all staff who worked that week at the store
- Mark `order_tips.distributed = true`

---

## 3. Frontend (Crew App — MyEarningsScreen)

Once backend is live, replace "Coming Soon" cards with:

```
┌─────────────────────────────────┐
│  This Week (Mon 3 – Sun 9 Mar)  │
│  ₹2,400 base + ₹180 tips        │
│  = ₹2,580 total                 │
├────────┬────────┬────────┬──────┤
│ Mon    │ Tue    │ Wed    │ ...  │
│ 8h     │ 8h     │ 0h     │      │
│ ₹20 tip│        │        │      │
└────────┴────────┴────────┴──────┘
```

RTK Query endpoint: `GET /api/staff/earnings/weekly?employeeId={id}` already stubbed in `crewApi.ts`.

---

## 4. Implementation Order

| Step | Service | Phase |
|------|---------|-------|
| Add `tipAmountINR` + `tipRecipientStaffId` to order model | commerce-service | Phase 6 |
| Create `order_tips` table (Flyway migration) | commerce-service | Phase 6 |
| Create `staff_pay_rates` + `staff_earnings_summary` tables | core-service | Phase 6 |
| `POST /api/orders/{id}/tip` endpoint | commerce-service | Phase 6 |
| `GET /api/staff/earnings/weekly` endpoint | core-service | Phase 6 |
| Weekly distribution scheduled job | core-service @Scheduled | Phase 6 |
| Manager UI — set pay rates per staff | frontend/manager | Phase 6 |
| Crew app — MyEarningsScreen go live | MaSoVaCrewApp | Phase 6 |

---

## Hard Rules (from CLAUDE.md)
- Financial data (`order_tips`, `staff_earnings_summary`) → soft delete only, never `DELETE`
- PostgreSQL write first → MongoDB async second (dual-write pattern)
- `commerce-service` never calls `core-service` directly → use RabbitMQ event for tip distribution trigger
- Every new query field needs `@Indexed` annotation in MongoDB equivalent
