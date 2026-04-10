-- V4: EU VAT columns on orders table (Global-2)
-- These columns are nullable — India orders remain unchanged (vat_country_code IS NULL)

ALTER TABLE commerce_schema.orders
    ADD COLUMN IF NOT EXISTS vat_country_code    VARCHAR(2),
    ADD COLUMN IF NOT EXISTS total_net_amount    DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS total_vat_amount    DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS total_gross_amount  DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS vat_breakdown       JSONB;

-- Index for VAT reporting queries (filter by country + date range)
CREATE INDEX IF NOT EXISTS idx_orders_vat_country_created
    ON commerce_schema.orders (vat_country_code, created_at)
    WHERE vat_country_code IS NOT NULL;

COMMENT ON COLUMN commerce_schema.orders.vat_country_code   IS 'ISO 3166-1 alpha-2 — NULL for India GST orders';
COMMENT ON COLUMN commerce_schema.orders.total_net_amount   IS 'Order total before VAT — NULL for India orders';
COMMENT ON COLUMN commerce_schema.orders.total_vat_amount   IS 'Total VAT charged — NULL for India orders';
COMMENT ON COLUMN commerce_schema.orders.total_gross_amount IS 'total_net_amount + total_vat_amount';
COMMENT ON COLUMN commerce_schema.orders.vat_breakdown      IS 'Per-line-item VAT as JSONB (VatBreakdown)';
