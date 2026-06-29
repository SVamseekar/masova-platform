-- V11: Add out_for_delivery_at timestamp for the OUT_FOR_DELIVERY order status
-- (driver assigned and en route, between DISPATCHED and DELIVERED for DELIVERY orders)

ALTER TABLE commerce_schema.orders
    ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMPTZ;
