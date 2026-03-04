-- MaSoVa PostgreSQL initialization script
-- Runs once on first container start

-- Enable UUID generation (uuid_generate_v4() available in public schema)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- Enable trigram-based text search (for fuzzy search on names/emails)
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA public;

