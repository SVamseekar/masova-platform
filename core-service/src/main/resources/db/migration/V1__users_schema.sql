-- V1: Users + Auth Providers schema for core-service (Phase 2 dual-write)
-- Schema: core_schema
-- All financial/user data uses soft-delete only (deleted_at column, no physical DELETE)

CREATE TABLE IF NOT EXISTS users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mongo_id                VARCHAR(24) UNIQUE,          -- MongoDB ObjectId for migration tracking
    user_type               VARCHAR(30)  NOT NULL,       -- UserType enum: CUSTOMER, STAFF, DRIVER, etc.
    name                    VARCHAR(255) NOT NULL,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    phone                   VARCHAR(20)  NOT NULL UNIQUE,
    password_hash           VARCHAR(255),
    store_id                VARCHAR(24),                  -- EmployeeDetails.storeId
    employee_role           VARCHAR(50),                  -- EmployeeDetails.role
    employee_status         VARCHAR(20),                  -- AVAILABLE, ON_DUTY, OFF_DUTY, BUSY
    employee_pin_hash       VARCHAR(255),
    pin_suffix              VARCHAR(2),
    terminal_id             VARCHAR(50),                  -- Kiosk terminalId
    is_kiosk_account        BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login              TIMESTAMPTZ,
    deleted_at              TIMESTAMPTZ,                  -- soft delete only
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_auth_providers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    provider    VARCHAR(50)  NOT NULL,   -- e.g. GOOGLE
    provider_id VARCHAR(255) NOT NULL,   -- Google sub / uid
    email       VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_user_type        ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_store_id         ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_users_store_id_type    ON users(store_id, user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active        ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login       ON users(last_login);
-- NOTE: idx_users_mongo_id omitted — the UNIQUE constraint creates an implicit B-tree index
CREATE INDEX IF NOT EXISTS idx_users_pin_suffix       ON users(pin_suffix) WHERE pin_suffix IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_providers_user_id ON user_auth_providers(user_id);

-- NOTE: No updated_at trigger — this column is managed by Hibernate @Version for optimistic locking.
-- A DB trigger would conflict with @Version's WHERE updated_at = <old_value> clause and cause
-- spurious OptimisticLockException on every second write.
