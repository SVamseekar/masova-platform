-- Global-3: add currency column to orders_jpa
-- Existing rows left NULL (India legacy orders — INR assumed when null)
-- New EU orders will have currency set from store.currency at creation time.
ALTER TABLE commerce_schema.orders
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

COMMENT ON COLUMN commerce_schema.orders.currency
    IS 'ISO 4217 currency code. NULL = India legacy order (INR). Set from store.currency at creation.';

CREATE INDEX IF NOT EXISTS idx_orders_currency ON commerce_schema.orders (currency)
    WHERE currency IS NOT NULL;
