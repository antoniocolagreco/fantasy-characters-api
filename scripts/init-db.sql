-- PostgreSQL initialization script for development
-- This script sets up the database with proper permissions and extensions

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create additional indexes for performance (if needed)
-- These will be created by Prisma migrations, but can be added here for custom optimizations

-- Set up connection limits and performance settings for development
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '128MB';
ALTER SYSTEM SET effective_cache_size = '512MB';

-- Reload configuration
SELECT pg_reload_conf();

-- Create a read-only user for analytics (optional)
-- CREATE USER analytics_user WITH PASSWORD 'analytics_password';
-- GRANT CONNECT ON DATABASE fantasy_character_api TO analytics_user;
-- GRANT USAGE ON SCHEMA public TO analytics_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analytics_user;
