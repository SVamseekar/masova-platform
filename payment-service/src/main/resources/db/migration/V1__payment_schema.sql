-- V1: Payment schema for payment-service (Phase 2 dual-write)
-- Schema: payment_schema  (created by infrastructure/postgres/01-init.sql)
-- Financial data uses soft-delete only (deleted_at), never physical DELETE

CREATE TABLE IF NOT EXISTS payment_schema.transactions (
    id                      VARCHAR(36)     PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mongo_id                VARCHAR(36)     UNIQUE,                         -- MongoDB ObjectId for migration tracking
    order_id                VARCHAR(36),                                    -- one transaction per order (see partial unique index below)
    razorpay_order_id       VARCHAR(100),                                   -- see partial unique index below
    razorpay_payment_id     VARCHAR(100),
    razorpay_signature      TEXT,
    amount                  DECIMAL(12,2)   NOT NULL,                       -- INR, 2 d.p.
    status                  VARCHAR(50)     NOT NULL,                       -- PaymentStatus enum
    payment_method          VARCHAR(50),                                    -- PaymentMethod enum
    customer_id             VARCHAR(36),
    customer_email          VARCHAR(255),
    customer_phone          VARCHAR(20),
    store_id                VARCHAR(36)     NOT NULL,
    -- Error details (populated on failure)
    error_code              VARCHAR(100),
    error_description       TEXT,
    error_source            VARCHAR(100),
    error_step              VARCHAR(100),
    error_reason            TEXT,
    -- Metadata
    receipt                 VARCHAR(100),
    currency                VARCHAR(10)     NOT NULL DEFAULT 'INR',
    -- Reconciliation
    reconciled              BOOLEAN         NOT NULL DEFAULT FALSE,
    reconciled_at           TIMESTAMPTZ,
    reconciled_by           VARCHAR(36),
    -- Soft-delete (financial records kept forever)
    deleted_at              TIMESTAMPTZ,
    -- Audit timestamps
    paid_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    -- Optimistic locking (Hibernate @Version)
    version                 BIGINT          NOT NULL DEFAULT 0
);

-- Partial unique indexes: enforce uniqueness on nullable gateway IDs while allowing NULL values
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_order_id        ON payment_schema.transactions (order_id) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_razorpay_order  ON payment_schema.transactions (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
-- Covering indexes matching MongoDB compound indexes
CREATE INDEX IF NOT EXISTS idx_transactions_store_status      ON payment_schema.transactions (store_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_store_created     ON payment_schema.transactions (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_created  ON payment_schema.transactions (customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_customer_status   ON payment_schema.transactions (customer_id, status) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_status_created    ON payment_schema.transactions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_payment  ON payment_schema.transactions (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_reconciled        ON payment_schema.transactions (reconciled, created_at DESC) WHERE reconciled = FALSE;
-- NOTE: mongo_id UNIQUE constraint creates an implicit B-tree index

CREATE TABLE IF NOT EXISTS payment_schema.refunds (
    id                      VARCHAR(36)     PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mongo_id                VARCHAR(36)     UNIQUE,                         -- MongoDB ObjectId for migration tracking
    transaction_id          VARCHAR(36)     NOT NULL REFERENCES payment_schema.transactions(id) ON DELETE RESTRICT,
    order_id                VARCHAR(36)     NOT NULL,
    store_id                VARCHAR(36)     NOT NULL,
    razorpay_refund_id      VARCHAR(100)    UNIQUE,
    razorpay_payment_id     VARCHAR(100),
    amount                  DECIMAL(12,2)   NOT NULL,                       -- refund amount in INR
    status                  VARCHAR(50)     NOT NULL,                       -- RefundStatus enum
    type                    VARCHAR(20)     NOT NULL,                       -- FULL | PARTIAL
    reason                  TEXT,
    initiated_by            VARCHAR(36),                                    -- userId of initiator
    customer_id             VARCHAR(36),
    -- Error details (if refund failed)
    error_code              VARCHAR(100),
    error_description       TEXT,
    -- Speed (normal / optimum)
    speed                   VARCHAR(20),
    notes                   TEXT,
    -- Soft-delete (financial records kept forever)
    deleted_at              TIMESTAMPTZ,
    -- Timestamps
    processed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    -- Optimistic locking (Hibernate @Version)
    version                 BIGINT          NOT NULL DEFAULT 0
);

-- Covering indexes matching MongoDB compound indexes
CREATE INDEX IF NOT EXISTS idx_refunds_store_status           ON payment_schema.refunds (store_id, status);
CREATE INDEX IF NOT EXISTS idx_refunds_store_created          ON payment_schema.refunds (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_transaction_created    ON payment_schema.refunds (transaction_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_order                  ON payment_schema.refunds (order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_customer               ON payment_schema.refunds (customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_refunds_razorpay_payment       ON payment_schema.refunds (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
-- NOTE: razorpay_refund_id UNIQUE constraint creates an implicit B-tree index
-- NOTE: mongo_id UNIQUE constraint creates an implicit B-tree index

-- updated_at trigger for transactions (version BIGINT used for @Version — trigger on updated_at is safe)
CREATE OR REPLACE FUNCTION payment_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON payment_schema.transactions
    FOR EACH ROW EXECUTE FUNCTION payment_schema.update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
    BEFORE UPDATE ON payment_schema.refunds
    FOR EACH ROW EXECUTE FUNCTION payment_schema.update_updated_at_column();
