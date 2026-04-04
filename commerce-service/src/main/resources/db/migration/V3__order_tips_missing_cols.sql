-- V3__order_tips_missing_cols.sql
-- Adds mongo_id to order_tips (CLAUDE.md compliance)
-- Flyway migrations are append-only — never edit V2

ALTER TABLE commerce_schema.order_tips
    ADD COLUMN IF NOT EXISTS mongo_id VARCHAR(24);
