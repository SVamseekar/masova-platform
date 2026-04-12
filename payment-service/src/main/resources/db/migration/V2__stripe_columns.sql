-- V2: Add Stripe payment gateway fields to transactions (Global-4)
-- Existing Razorpay rows get NULL values (backward-compatible)

ALTER TABLE payment_schema.transactions
    ADD COLUMN IF NOT EXISTS payment_gateway         VARCHAR(20),
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS stripe_fee_minor_units  BIGINT;

CREATE INDEX IF NOT EXISTS idx_transactions_stripe_pi
    ON payment_schema.transactions (stripe_payment_intent_id)
    WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_payment_gateway
    ON payment_schema.transactions (payment_gateway)
    WHERE payment_gateway IS NOT NULL;
