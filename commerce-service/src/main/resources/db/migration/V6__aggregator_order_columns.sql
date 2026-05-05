-- Global-6: add aggregator fields to orders_jpa
-- order_source: 'MASOVA' for all direct orders (backfill), platform name for aggregator orders
ALTER TABLE commerce_schema.orders
    ADD COLUMN IF NOT EXISTS order_source       VARCHAR(20) NOT NULL DEFAULT 'MASOVA',
    ADD COLUMN IF NOT EXISTS aggregator_order_id   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS aggregator_commission  NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS aggregator_net_payout  NUMERIC(10,2);

COMMENT ON COLUMN commerce_schema.orders.order_source
    IS 'Originating platform: MASOVA (direct) | WOLT | DELIVEROO | JUST_EAT | UBER_EATS';

CREATE INDEX IF NOT EXISTS idx_orders_order_source
    ON commerce_schema.orders (store_id, order_source, created_at DESC);
