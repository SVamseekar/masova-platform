-- MaSoVa PostgreSQL initialization script
-- Runs once on first container start

-- Enable UUID generation (uuid_generate_v4() available in public schema)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- Enable trigram-based text search (for fuzzy search on names/emails)
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA public;

-- Per-service schemas (one schema per service, shared masova_db database)
CREATE SCHEMA IF NOT EXISTS core_schema;
CREATE SCHEMA IF NOT EXISTS commerce_schema;
CREATE SCHEMA IF NOT EXISTS payment_schema;
CREATE SCHEMA IF NOT EXISTS logistics_schema;
CREATE SCHEMA IF NOT EXISTS intel_schema;

