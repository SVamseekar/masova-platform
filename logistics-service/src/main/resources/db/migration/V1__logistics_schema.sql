-- V1: Logistics schema for logistics-service (Phase 2 dual-write)
-- Schema: logistics_schema  (created by infrastructure/postgres/01-init.sql)
-- Financial data (purchase_orders, waste_records): soft-delete only (deleted_at), never physical DELETE

-- ─────────────────────────────────────────────────────────────────────────────
-- suppliers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logistics_schema.suppliers (
    id                          VARCHAR(36)     PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mongo_id                    VARCHAR(36)     UNIQUE,                         -- MongoDB ObjectId for migration tracking
    supplier_code               VARCHAR(50)     NOT NULL UNIQUE,
    supplier_name               VARCHAR(255)    NOT NULL,
    contact_person              VARCHAR(255),
    phone_number                VARCHAR(20),
    email                       VARCHAR(255),
    alternate_phone             VARCHAR(20),
    -- Address
    address_line1               VARCHAR(255),
    address_line2               VARCHAR(255),
    city                        VARCHAR(100),
    state                       VARCHAR(100),
    pincode                     VARCHAR(10),
    country                     VARCHAR(100)                DEFAULT 'India',
    -- Business details
    gst_number                  VARCHAR(20),
    pan_number                  VARCHAR(20),
    business_type               VARCHAR(50),                                    -- WHOLESALER, MANUFACTURER, DISTRIBUTOR, etc.
    -- Payment terms
    payment_terms               VARCHAR(20),                                    -- COD, NET_15, NET_30, NET_60
    credit_days                 INTEGER,
    credit_limit                DECIMAL(14,2),
    -- Banking details
    bank_name                   VARCHAR(100),
    account_number              VARCHAR(50),
    ifsc_code                   VARCHAR(20),
    bank_branch                 VARCHAR(100),
    -- Categories supplied (stored as JSON array of strings)
    categories_supplied         JSONB,
    -- Performance metrics
    total_orders                INTEGER         NOT NULL DEFAULT 0,
    completed_orders            INTEGER         NOT NULL DEFAULT 0,
    cancelled_orders            INTEGER         NOT NULL DEFAULT 0,
    on_time_delivery_rate       DECIMAL(5,2)             DEFAULT 100.00,        -- percentage 0-100
    quality_rating              DECIMAL(3,1)             DEFAULT 5.0,           -- rating 0-5
    total_purchase_value        DECIMAL(16,2)            DEFAULT 0.00,
    -- Lead time
    average_lead_time_days      INTEGER,
    minimum_order_quantity      INTEGER,
    -- Status
    status                      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',      -- ACTIVE, INACTIVE, BLOCKED
    is_preferred                BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Metadata
    notes                       TEXT,
    website                     VARCHAR(255),
    last_order_date             TIMESTAMPTZ,
    -- Soft-delete
    deleted_at                  TIMESTAMPTZ,
    -- Audit timestamps
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by                  VARCHAR(36),
    last_updated_by             VARCHAR(36),
    -- Optimistic locking (Hibernate @Version)
    version                     BIGINT          NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_suppliers_status           ON logistics_schema.suppliers (status);
CREATE INDEX IF NOT EXISTS idx_suppliers_name             ON logistics_schema.suppliers (supplier_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_preferred     ON logistics_schema.suppliers (is_preferred) WHERE is_preferred = TRUE;
CREATE INDEX IF NOT EXISTS idx_suppliers_categories       ON logistics_schema.suppliers USING GIN (categories_supplied);
-- NOTE: supplier_code UNIQUE and mongo_id UNIQUE constraints create implicit B-tree indexes

-- ─────────────────────────────────────────────────────────────────────────────
-- inventory_items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logistics_schema.inventory_items (
    id                          VARCHAR(36)     PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mongo_id                    VARCHAR(36)     UNIQUE,                         -- MongoDB ObjectId for migration tracking
    store_id                    VARCHAR(36)     NOT NULL,
    item_name                   VARCHAR(255)    NOT NULL,
    item_code                   VARCHAR(100),                                   -- SKU or internal code
    category                    VARCHAR(50),                                    -- RAW_MATERIAL, INGREDIENT, PACKAGING, BEVERAGE, etc.
    unit                        VARCHAR(20)     NOT NULL,                       -- kg, liters, pieces, boxes, etc.
    -- Stock levels (NUMERIC for precision; Double in Java maps to NUMERIC here)
    current_stock               NUMERIC(12,4)   NOT NULL DEFAULT 0,
    reserved_stock              NUMERIC(12,4)   NOT NULL DEFAULT 0,
    minimum_stock               NUMERIC(12,4),
    maximum_stock               NUMERIC(12,4),
    reorder_quantity            NUMERIC(12,4),
    -- Costing (INR)
    unit_cost                   DECIMAL(12,4),
    average_cost                DECIMAL(12,4),
    last_purchase_cost          DECIMAL(12,4),
    -- Supplier
    primary_supplier_id         VARCHAR(36)     REFERENCES logistics_schema.suppliers(id) ON DELETE SET NULL,
    alternative_supplier_ids    JSONB,                                          -- JSON array of supplier IDs
    -- Perishable tracking
    is_perishable               BOOLEAN         NOT NULL DEFAULT FALSE,
    expiry_date                 DATE,
    shelf_life_days             INTEGER,
    -- Batch tracking
    batch_tracked               BOOLEAN         NOT NULL DEFAULT FALSE,
    current_batch_number        VARCHAR(100),
    -- Status
    status                      VARCHAR(30)     NOT NULL DEFAULT 'AVAILABLE',   -- AVAILABLE, LOW_STOCK, OUT_OF_STOCK, DISCONTINUED
    auto_reorder                BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Metadata
    description                 TEXT,
    storage_location            VARCHAR(255),
    notes                       TEXT,
    last_updated_by             VARCHAR(36),
    -- Soft-delete
    deleted_at                  TIMESTAMPTZ,
    -- Audit timestamps
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    -- Optimistic locking (Hibernate @Version)
    version                     BIGINT          NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_inventory_store_status     ON logistics_schema.inventory_items (store_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_store_name       ON logistics_schema.inventory_items (store_id, item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_store_category   ON logistics_schema.inventory_items (store_id, category);
CREATE INDEX IF NOT EXISTS idx_inventory_store_stock      ON logistics_schema.inventory_items (store_id, status, current_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_perishable_expiry ON logistics_schema.inventory_items (is_perishable, expiry_date) WHERE is_perishable = TRUE;
CREATE INDEX IF NOT EXISTS idx_inventory_primary_supplier ON logistics_schema.inventory_items (primary_supplier_id) WHERE primary_supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_alt_suppliers    ON logistics_schema.inventory_items USING GIN (alternative_supplier_ids);
-- NOTE: mongo_id UNIQUE constraint creates an implicit B-tree index

-- ─────────────────────────────────────────────────────────────────────────────
-- purchase_orders + purchase_order_items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logistics_schema.purchase_orders (
    id                          VARCHAR(36)     PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mongo_id                    VARCHAR(36)     UNIQUE,                         -- MongoDB ObjectId for migration tracking
    order_number                VARCHAR(50)     NOT NULL UNIQUE,                -- PO-YYYYMMDD-XXXX
    store_id                    VARCHAR(36)     NOT NULL,
    supplier_id                 VARCHAR(36)     REFERENCES logistics_schema.suppliers(id) ON DELETE RESTRICT,
    supplier_name               VARCHAR(255),                                   -- denormalized for quick access
    -- Dates
    order_date                  DATE,
    expected_delivery_date      DATE,
    actual_delivery_date        DATE,
    -- Status
    status                      VARCHAR(30)     NOT NULL DEFAULT 'DRAFT',       -- DRAFT, PENDING_APPROVAL, APPROVED, SENT, RECEIVED, PARTIALLY_RECEIVED, CANCELLED
    -- Financial (all INR)
    subtotal                    DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
    tax_amount                  DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    shipping_cost               DECIMAL(10,2)            DEFAULT 0.00,
    discount_amount             DECIMAL(10,2)            DEFAULT 0.00,
    total_amount                DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
    payment_status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING',     -- PENDING, PARTIALLY_PAID, PAID
    -- Approval workflow
    requested_by                VARCHAR(36),
    approved_by                 VARCHAR(36),
    approved_at                 TIMESTAMPTZ,
    rejection_reason            TEXT,
    -- Receiving
    received_by                 VARCHAR(36),
    received_at                 TIMESTAMPTZ,
    receiving_notes             TEXT,
    -- Metadata
    auto_generated              BOOLEAN         NOT NULL DEFAULT FALSE,
    notes                       TEXT,
    -- Soft-delete (financial data)
    deleted_at                  TIMESTAMPTZ,
    -- Audit timestamps
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    -- Optimistic locking (Hibernate @Version)
    version                     BIGINT          NOT NULL DEFAULT 0,
    -- Supplier must be set for any non-DRAFT order
    CONSTRAINT chk_po_supplier_required CHECK (status = 'DRAFT' OR supplier_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_po_store_status            ON logistics_schema.purchase_orders (store_id, status);
CREATE INDEX IF NOT EXISTS idx_po_store_created           ON logistics_schema.purchase_orders (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_po_status_expected         ON logistics_schema.purchase_orders (status, expected_delivery_date) WHERE status NOT IN ('RECEIVED', 'CANCELLED');
CREATE INDEX IF NOT EXISTS idx_po_supplier                ON logistics_schema.purchase_orders (supplier_id) WHERE supplier_id IS NOT NULL;
-- NOTE: order_number UNIQUE and mongo_id UNIQUE constraints create implicit B-tree indexes

-- Purchase order line items (child of purchase_orders)
-- ON DELETE RESTRICT: a soft-deleted parent PO should have its items retained as-is.
-- Physical delete of a PO is never performed; items must be managed explicitly.
CREATE TABLE IF NOT EXISTS logistics_schema.purchase_order_items (
    id                          VARCHAR(36)     PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mongo_id                    VARCHAR(36),                                    -- MongoDB ObjectId for migration tracking
    purchase_order_id           VARCHAR(36)     NOT NULL REFERENCES logistics_schema.purchase_orders(id) ON DELETE RESTRICT,
    inventory_item_id           VARCHAR(36)     NOT NULL,
    item_name                   VARCHAR(255)    NOT NULL,
    item_code                   VARCHAR(100),
    quantity                    NUMERIC(12,4)   NOT NULL,
    unit                        VARCHAR(20),
    unit_price                  DECIMAL(12,4)   NOT NULL,
    total_price                 DECIMAL(14,2),                                  -- quantity * unit_price, matches parent subtotal precision
    received_quantity           NUMERIC(12,4)            DEFAULT 0,
    notes                       TEXT,
    -- Audit timestamps
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    -- Optimistic locking (Hibernate @Version)
    version                     BIGINT          NOT NULL DEFAULT 0
);

-- Partial unique index for mongo_id (nullable — only enforce uniqueness when present)
CREATE UNIQUE INDEX IF NOT EXISTS idx_po_items_mongo_id  ON logistics_schema.purchase_order_items (mongo_id) WHERE mongo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_po_items_order             ON logistics_schema.purchase_order_items (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_inventory         ON logistics_schema.purchase_order_items (inventory_item_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- waste_records
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logistics_schema.waste_records (
    id                          VARCHAR(36)     PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mongo_id                    VARCHAR(36)     UNIQUE,                         -- MongoDB ObjectId for migration tracking
    store_id                    VARCHAR(36)     NOT NULL,
    inventory_item_id           VARCHAR(36)     REFERENCES logistics_schema.inventory_items(id) ON DELETE RESTRICT,
    item_name                   VARCHAR(255)    NOT NULL,                       -- denormalized
    item_code                   VARCHAR(100),
    quantity                    NUMERIC(12,4)   NOT NULL,
    unit                        VARCHAR(20)     NOT NULL,
    unit_cost                   DECIMAL(12,4),
    total_cost                  DECIMAL(14,4),
    -- Waste details
    waste_category              VARCHAR(50)     NOT NULL,                       -- EXPIRED, DAMAGED, SPOILED, CONTAMINATED, OVERPRODUCTION, OTHER
    waste_reason                TEXT,
    waste_date                  DATE            NOT NULL DEFAULT CURRENT_DATE,
    -- Responsibility
    reported_by                 VARCHAR(36),
    approved_by                 VARCHAR(36),
    approved_at                 TIMESTAMPTZ,
    -- Preventability
    preventable                 BOOLEAN         NOT NULL DEFAULT FALSE,
    prevention_notes            TEXT,
    -- Batch tracking
    batch_number                VARCHAR(100),
    notes                       TEXT,
    -- Soft-delete (financial/audit record)
    deleted_at                  TIMESTAMPTZ,
    -- Audit timestamps
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    -- Optimistic locking (Hibernate @Version)
    version                     BIGINT          NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_waste_store_category       ON logistics_schema.waste_records (store_id, waste_category);
CREATE INDEX IF NOT EXISTS idx_waste_store_date           ON logistics_schema.waste_records (store_id, waste_date DESC);
CREATE INDEX IF NOT EXISTS idx_waste_store_preventable    ON logistics_schema.waste_records (store_id, preventable);
CREATE INDEX IF NOT EXISTS idx_waste_inventory_item       ON logistics_schema.waste_records (inventory_item_id) WHERE inventory_item_id IS NOT NULL;
-- NOTE: mongo_id UNIQUE constraint creates an implicit B-tree index

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger (shared function for all mutable tables in this schema)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION logistics_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON logistics_schema.suppliers
    FOR EACH ROW EXECUTE FUNCTION logistics_schema.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON logistics_schema.inventory_items
    FOR EACH ROW EXECUTE FUNCTION logistics_schema.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON logistics_schema.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION logistics_schema.update_updated_at_column();

CREATE TRIGGER update_purchase_order_items_updated_at
    BEFORE UPDATE ON logistics_schema.purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION logistics_schema.update_updated_at_column();

CREATE TRIGGER update_waste_records_updated_at
    BEFORE UPDATE ON logistics_schema.waste_records
    FOR EACH ROW EXECUTE FUNCTION logistics_schema.update_updated_at_column();
