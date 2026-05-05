-- Global-6: aggregator commission configuration per store per platform
CREATE TABLE IF NOT EXISTS commerce_schema.aggregator_connections (
    id                  BIGSERIAL PRIMARY KEY,
    store_id            VARCHAR(255) NOT NULL,
    platform            VARCHAR(20)  NOT NULL,   -- WOLT | DELIVEROO | JUST_EAT | UBER_EATS
    commission_percent  NUMERIC(5,2) NOT NULL,   -- e.g. 30.00
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_aggregator_store_platform UNIQUE (store_id, platform)
);

COMMENT ON TABLE commerce_schema.aggregator_connections
    IS 'Per-store commission % per aggregator platform. Soft-disabled via is_active.';

CREATE INDEX IF NOT EXISTS idx_agg_conn_store
    ON commerce_schema.aggregator_connections (store_id);
