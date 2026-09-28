-- V3: Widen customer_phone to fit AES-256-GCM ciphertext (Base64: IV[12] + data + tag[16])
-- customer_phone has stored encrypt(request.getCustomerPhone()) since PaymentService started
-- encrypting PII for GDPR compliance, but the column was never widened past the size needed
-- for a raw phone number. Every payment initiation with a non-null phone number fails with
-- "value too long for type character varying(20)" once the real cipher runs.

ALTER TABLE payment_schema.transactions
    ALTER COLUMN customer_phone TYPE VARCHAR(255);
