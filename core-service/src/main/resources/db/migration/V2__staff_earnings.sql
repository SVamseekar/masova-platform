-- V2__staff_earnings.sql
-- Staff pay rates and weekly earnings summary for core-service
-- Schema: core_schema
-- Financial data: soft delete only (no physical DELETE)

CREATE TABLE IF NOT EXISTS staff_pay_rates (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     VARCHAR(36) NOT NULL,
    store_id        VARCHAR(36) NOT NULL,
    hourly_rate_inr NUMERIC(10,2) NOT NULL,
    effective_from  DATE        NOT NULL,
    effective_to    DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pay_rates_employee ON staff_pay_rates(employee_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_pay_rates_store    ON staff_pay_rates(store_id);

CREATE TABLE IF NOT EXISTS staff_earnings_summary (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id  VARCHAR(36) NOT NULL,
    store_id     VARCHAR(36) NOT NULL,
    week_start   DATE        NOT NULL,
    week_end     DATE        NOT NULL,
    hours_worked NUMERIC(6,2) NOT NULL DEFAULT 0,
    base_pay_inr NUMERIC(10,2) NOT NULL DEFAULT 0,
    tips_inr     NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_earnings_employee_week ON staff_earnings_summary(employee_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_store_week    ON staff_earnings_summary(store_id, week_start DESC);
