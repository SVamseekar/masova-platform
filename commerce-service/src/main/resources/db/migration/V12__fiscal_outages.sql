-- V12: fiscal_outages — one open row per (store_id, signer_system) while a certified
-- signer is failing; opened on the first failure, closed on the next success (#126).
-- KassenSichV/AEAO zu §146a Nr. 7 requires the start, end and cause of each TSE outage
-- to be documented — this table is that log, not just an in-memory flag.

CREATE TABLE IF NOT EXISTS commerce_schema.fiscal_outages (
    id             BIGSERIAL       PRIMARY KEY,
    store_id       VARCHAR(100)    NOT NULL,
    signer_system  VARCHAR(20)     NOT NULL,
    opened_at      TIMESTAMPTZ     NOT NULL,
    closed_at      TIMESTAMPTZ,
    cause          TEXT
);

-- One open outage per store+signer at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_fiscal_outages_open
    ON commerce_schema.fiscal_outages (store_id, signer_system)
    WHERE closed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_fiscal_outages_store_opened
    ON commerce_schema.fiscal_outages (store_id, opened_at);

COMMENT ON TABLE commerce_schema.fiscal_outages IS
    'Per-store, per-signer fiscal outage log (start/end/cause) — KassenSichV/AEAO §146a Nr. 7.';
