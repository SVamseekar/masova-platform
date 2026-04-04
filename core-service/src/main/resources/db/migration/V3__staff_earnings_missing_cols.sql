-- V3__staff_earnings_missing_cols.sql
-- Adds mongo_id and deleted_at to staff financial tables (CLAUDE.md compliance)
-- Flyway migrations are append-only — never edit V2

ALTER TABLE core_schema.staff_pay_rates
    ADD COLUMN IF NOT EXISTS mongo_id   VARCHAR(24),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE core_schema.staff_earnings_summary
    ADD COLUMN IF NOT EXISTS mongo_id   VARCHAR(24),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
