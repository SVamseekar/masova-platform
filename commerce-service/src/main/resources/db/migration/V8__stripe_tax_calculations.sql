-- V8: Stripe Tax calculation cache — US and CA stores
-- Stripe Tax API is called at order creation for US/CA stores.
-- Results cached here (Redis 24h per store+item, this table = permanent record).

CREATE TABLE IF NOT EXISTS commerce_schema.stripe_tax_calculations (
    id                   BIGSERIAL       PRIMARY KEY,
    order_id             VARCHAR(100)    NOT NULL,
    store_id             VARCHAR(100)    NOT NULL,
    country_code         VARCHAR(2)      NOT NULL,  -- "US" or "CA"
    stripe_calculation_id VARCHAR(200)   NOT NULL,  -- Stripe Tax calculation ID
    taxable_amount       DECIMAL(12,2)   NOT NULL,
    tax_amount           DECIMAL(12,2)   NOT NULL,
    tax_rate_pct         DECIMAL(5,4),
    jurisdiction         VARCHAR(100),              -- e.g. "California" or "Ontario"
    calculation_date     DATE            NOT NULL,
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_tax_order
    ON commerce_schema.stripe_tax_calculations (order_id);

CREATE INDEX IF NOT EXISTS idx_stripe_tax_store_date
    ON commerce_schema.stripe_tax_calculations (store_id, calculation_date);

COMMENT ON TABLE commerce_schema.stripe_tax_calculations IS
    'Stripe Tax calculation records for US/CA stores — permanent audit trail';
