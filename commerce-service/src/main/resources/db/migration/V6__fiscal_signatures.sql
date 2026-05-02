-- V6: fiscal_signatures table — append-only, soft-delete only, 10-year legal retention
-- Never DELETE from this table. Hard constraint from all fiscal laws.

CREATE TABLE IF NOT EXISTS commerce_schema.fiscal_signatures (
    id                   BIGSERIAL       PRIMARY KEY,
    order_id             VARCHAR(100)    NOT NULL,
    store_id             VARCHAR(100)    NOT NULL,
    country_code         VARCHAR(2),
    signer_system        VARCHAR(20)     NOT NULL,
    transaction_id       VARCHAR(200),
    signature_value      TEXT,
    qr_code_data         TEXT,
    signing_device_id    VARCHAR(100),
    signed_at            TIMESTAMPTZ     NOT NULL,
    is_required          BOOLEAN         NOT NULL DEFAULT FALSE,
    signing_failed       BOOLEAN         NOT NULL DEFAULT FALSE,
    signing_error        TEXT,
    extras               JSONB,
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Index for compliance reporting: all failures per country per day
CREATE INDEX IF NOT EXISTS idx_fiscal_country_failed
    ON commerce_schema.fiscal_signatures (country_code, signing_failed, created_at)
    WHERE signing_failed = TRUE;

-- Index for order lookup (checking if order has been signed)
CREATE INDEX IF NOT EXISTS idx_fiscal_order_id
    ON commerce_schema.fiscal_signatures (order_id);

-- Index for Z-report / daily queries per store
CREATE INDEX IF NOT EXISTS idx_fiscal_store_created
    ON commerce_schema.fiscal_signatures (store_id, created_at);

COMMENT ON TABLE commerce_schema.fiscal_signatures IS
    'Fiscal signing records — append-only, 10-year legal retention. Never DELETE.';
COMMENT ON COLUMN commerce_schema.fiscal_signatures.signed_at IS
    'Timestamp from signing system clock, never application clock';

-- Fiscal summary columns on orders table for quick filtering
-- Full details are in fiscal_signatures table
ALTER TABLE commerce_schema.orders
    ADD COLUMN IF NOT EXISTS fiscal_signature_id  VARCHAR(200),
    ADD COLUMN IF NOT EXISTS fiscal_signer_system VARCHAR(20),
    ADD COLUMN IF NOT EXISTS fiscal_signing_failed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS fiscal_signed_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_fiscal_failed
    ON commerce_schema.orders (store_id, fiscal_signing_failed, created_at)
    WHERE fiscal_signing_failed = TRUE;

COMMENT ON COLUMN commerce_schema.orders.fiscal_signing_failed IS
    'True when signing was required but failed — manager must resolve';
