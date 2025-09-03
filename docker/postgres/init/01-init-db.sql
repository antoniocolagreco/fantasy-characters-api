-- Initialize Fantasy Characters Database
-- This script runs during PostgreSQL container initialization

-- Create UUID v7 extension (if not already installed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create application user with appropriate permissions
-- Note: The main user is created via environment variables in docker-compose
-- This script adds any additional setup if needed

-- Log the setup completion
SELECT 'Fantasy Characters Database initialized successfully' AS status;
