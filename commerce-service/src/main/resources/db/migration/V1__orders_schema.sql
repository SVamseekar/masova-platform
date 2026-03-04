-- V1: Orders schema for commerce-service (Phase 2 dual-write)
-- Schema: commerce_schema  (created by infrastructure/postgres/01-init.sql)
-- Financial data uses soft-delete only (no physical DELETE on orders)

CREATE TABLE IF NOT EXISTS commerce_schema.orders (
    id                      VARCHAR(36)      PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mongo_id                VARCHAR(36)      UNIQUE,                         -- MongoDB ObjectId for migration tracking
    order_number            VARCHAR(50)      NOT NULL UNIQUE,
    customer_id             VARCHAR(36),                                     -- MongoDB customer userId
    customer_name           VARCHAR(255)     NOT NULL,
    customer_phone          VARCHAR(20),
    customer_email          VARCHAR(255),
    store_id                VARCHAR(36)      NOT NULL,
    status                  VARCHAR(50)      NOT NULL,                       -- OrderStatus enum
    order_type              VARCHAR(20)      NOT NULL,                       -- DINE_IN, TAKEAWAY, DELIVERY
    payment_status          VARCHAR(50)      NOT NULL DEFAULT 'PENDING',
    payment_method          VARCHAR(50),
    payment_transaction_id  VARCHAR(255),
    priority                VARCHAR(20)                DEFAULT 'NORMAL',
    subtotal                DECIMAL(10,2)    NOT NULL,
    delivery_fee            DECIMAL(10,2)              DEFAULT 0.00,
    tax                     DECIMAL(10,2)              DEFAULT 0.00,
    total                   DECIMAL(10,2)    NOT NULL,
    special_instructions    TEXT,
    table_number            VARCHAR(20),                                     -- DINE_IN orders only
    guest_count             INTEGER,                                         -- DINE_IN orders only
    assigned_driver_id      VARCHAR(36),
    created_by_staff_id     VARCHAR(36),
    created_by_staff_name   VARCHAR(255),
    preparation_time        INTEGER,
    estimated_delivery_time TIMESTAMPTZ,
    delivery_address        JSONB,                                           -- DeliveryAddress object; varies per order
    delivery_otp            VARCHAR(10),
    delivery_proof_type     VARCHAR(50),
    delivery_proof_url      TEXT,
    cancellation_reason     TEXT,
    -- Kitchen workflow timestamps
    received_at             TIMESTAMPTZ,
    preparing_started_at    TIMESTAMPTZ,
    ready_at                TIMESTAMPTZ,
    dispatched_at           TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    deleted_at              TIMESTAMPTZ,                                     -- soft-delete only; never issue physical DELETE
    -- Audit timestamps
    created_at              TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    -- Optimistic locking (Hibernate @Version on BIGINT — NOT on updated_at)
    version                 BIGINT           NOT NULL  DEFAULT 0
);

-- Covering indexes matching MongoDB compound indexes
CREATE INDEX IF NOT EXISTS idx_orders_store_status        ON commerce_schema.orders (store_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_store_created       ON commerce_schema.orders (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer            ON commerce_schema.orders (customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_driver_status       ON commerce_schema.orders (assigned_driver_id, status) WHERE assigned_driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_number              ON commerce_schema.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status     ON commerce_schema.orders (customer_id, status) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_store_type_status   ON commerce_schema.orders (store_id, order_type, status);
-- NOTE: mongo_id UNIQUE constraint creates an implicit B-tree index; no separate idx_orders_mongo_id needed

CREATE TABLE IF NOT EXISTS commerce_schema.order_items (
    id              VARCHAR(36)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id        VARCHAR(36)   NOT NULL REFERENCES commerce_schema.orders(id) ON DELETE RESTRICT,
    menu_item_id    VARCHAR(36)   NOT NULL,
    name            VARCHAR(255)  NOT NULL,
    quantity        INTEGER       NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    variant         VARCHAR(255),
    customizations  TEXT,                                                    -- JSON-encoded List<String>
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON commerce_schema.order_items (order_id);

CREATE TABLE IF NOT EXISTS commerce_schema.order_quality_checkpoints (
    id                  VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id            VARCHAR(36)  NOT NULL REFERENCES commerce_schema.orders(id) ON DELETE RESTRICT,
    name                VARCHAR(100) NOT NULL,
    passed              BOOLEAN,
    notes               TEXT,
    checked_at          TIMESTAMPTZ,
    checked_by_staff_id VARCHAR(36),                                         -- split from checked_by to preserve staff ID + name separately
    checked_by_name     VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_order ON commerce_schema.order_quality_checkpoints (order_id);

-- updated_at trigger: orders use BIGINT version for @Version (optimistic locking),
-- so a DB trigger on updated_at is safe here (no conflict with Hibernate @Version).
-- NOTE: No trigger on order_items — child rows are immutable after insert (append-only line items).
CREATE OR REPLACE FUNCTION commerce_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON commerce_schema.orders
    FOR EACH ROW EXECUTE FUNCTION commerce_schema.update_updated_at_column();
