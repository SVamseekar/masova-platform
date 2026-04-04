-- V2__order_tips.sql
-- Tips recorded against orders in commerce-service
-- Schema: commerce_schema
-- Financial data: soft delete only

CREATE TABLE IF NOT EXISTS order_tips (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id           VARCHAR(36) NOT NULL UNIQUE,
    order_number       VARCHAR(50) NOT NULL,
    store_id           VARCHAR(36) NOT NULL,
    amount_inr         NUMERIC(10,2) NOT NULL,
    tip_type           VARCHAR(10) NOT NULL CHECK (tip_type IN ('DIRECT', 'POOL')),
    recipient_staff_id VARCHAR(36),
    distributed        BOOLEAN     NOT NULL DEFAULT FALSE,
    distributed_at     TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tips_order       ON order_tips(order_id);
CREATE INDEX IF NOT EXISTS idx_tips_recipient   ON order_tips(recipient_staff_id, distributed);
CREATE INDEX IF NOT EXISTS idx_tips_undistrib   ON order_tips(store_id, distributed) WHERE distributed = FALSE;
