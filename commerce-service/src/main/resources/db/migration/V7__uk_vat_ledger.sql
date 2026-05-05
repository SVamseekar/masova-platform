-- V7: UK MTD VAT ledger — quarterly aggregation for HMRC Making Tax Digital submission
-- Each GB order's VAT amounts are recorded here. Manager submits quarterly via FiscalCompliancePage.

CREATE TABLE IF NOT EXISTS commerce_schema.uk_vat_ledger (
    id                   BIGSERIAL       PRIMARY KEY,
    order_id             VARCHAR(100)    NOT NULL,
    store_id             VARCHAR(100)    NOT NULL,
    vat_period_key       VARCHAR(10)     NOT NULL,  -- e.g. "2026-Q1"
    order_date           DATE            NOT NULL,
    net_amount           DECIMAL(12,2)   NOT NULL,
    vat_amount           DECIMAL(12,2)   NOT NULL,
    gross_amount         DECIMAL(12,2)   NOT NULL,
    vat_rate_pct         DECIMAL(5,2),
    uk_vat_category      VARCHAR(50),               -- STANDARD / REDUCED / ZERO / EXEMPT
    mtd_transaction_id   VARCHAR(200),
    submitted_at         TIMESTAMPTZ,               -- NULL = not yet submitted
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Index for quarterly submission queries
CREATE INDEX IF NOT EXISTS idx_uk_vat_period_store
    ON commerce_schema.uk_vat_ledger (store_id, vat_period_key);

-- Index for unsubmitted entries
CREATE INDEX IF NOT EXISTS idx_uk_vat_unsubmitted
    ON commerce_schema.uk_vat_ledger (store_id, submitted_at)
    WHERE submitted_at IS NULL;

COMMENT ON TABLE commerce_schema.uk_vat_ledger IS
    'UK Making Tax Digital VAT ledger — records per-order VAT for quarterly HMRC submission';
