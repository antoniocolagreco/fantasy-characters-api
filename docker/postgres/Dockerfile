# Use a valid, stable PostgreSQL image tag
FROM postgres:17.6-alpine3.22
# Install UUID extension for UUID v7 support
RUN echo 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' > /docker-entrypoint-initdb.d/01-uuid-extension.sql

# Set default timezone
ENV TZ=UTC

# Expose the PostgreSQL port
EXPOSE 5432

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || exit 1
