-- LicenseServer Database Initialization Script
-- This script is automatically run by docker-compose / postgres init
-- It creates the database if it doesn't exist (handled by POSTGRES_DB env var)
-- and sets up required extensions.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Note: Actual table schema is managed by Prisma migrations.
-- Run `npm run prisma:migrate` from the backend folder after this script executes
-- to create all tables, indexes, and foreign keys defined in prisma/schema.prisma.
