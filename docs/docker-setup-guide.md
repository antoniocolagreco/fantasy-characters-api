# 🐳 Docker Setup Guide - Fantasy Characters API

Complete guide for junior developers on Docker, Docker Compose, and package.json
integration for the Fantasy Characters API.

## 📋 Table of Contents

1. [General Overview](#-general-overview)
2. [Project Docker Structure](#-project-docker-structure)
3. [Main Dockerfile](#-main-dockerfile)
4. [Custom PostgreSQL](#-custom-postgresql)
5. [Docker Compose Configurations](#-docker-compose-configurations)
6. [Package.json Scripts](#-packagejson-scripts)
7. [Development Workflow](#-development-workflow)

---

## 🎯 General Overview

The project uses **Docker** and **Docker Compose** for:

- **Consistent environment**: Same setup across all machines (dev, staging,
  prod)
- **Managed database**: PostgreSQL with automatic configuration
- **Zero manual setup**: One command and everything works
- **Isolation**: Each service in its own container
- **Scalability**: Easy to add Redis, pgAdmin, etc.

### Container Architecture

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Node.js   │────│   PostgreSQL    │    │     pgAdmin     │
│   (Port 3000)   │    │   (Port 5432)   │    │   (Port 8080)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                        fantasy_network
```

---

## 📁 Project Docker Structure

```text
fantasy-characters-api/
├── Dockerfile                          # API Node.js build
├── docker-compose.dev.yml              # Local development
├── docker-compose.prod.yml             # Production
├── docker-compose.integration.yml      # Integration testing
└── docker/
    └── postgres/
        ├── Dockerfile                   # Custom PostgreSQL
        └── init/
            └── 01-init-db.sql          # DB initialization script
```

---

## 🚀 Main Dockerfile

### Multi-Stage Build Strategy

The `Dockerfile` uses **4 stages** to optimize size and security:

```dockerfile
# 1. BASE: Node.js 24 + pnpm + utilities
FROM node:24-alpine AS base
RUN corepack enable pnpm
RUN apk add --no-cache openssl wget  # For Prisma and health checks

# 2. DEPS: Production dependencies only
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# 3. BUILD: Compile TypeScript and generate Prisma
FROM base AS build
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm db:generate && pnpm build

# 4. RUNTIME: Minimal final image
FROM base AS runtime
# Create non-root user for security
RUN adduser --system --uid 1001 apiuser
COPY --from=build --chown=apiuser:nodejs /app/dist ./dist
USER apiuser
CMD ["node", "dist/server.js"]
```

### Key Features

- **Alpine Linux**: Lightweight base image (vs Ubuntu)
- **Multi-stage**: Removes build tools from final image
- **Non-root user**: Container security
- **Health checks**: Automatic monitoring
- **Prisma-ready**: Includes OpenSSL for database

---

## 🐘 Custom PostgreSQL

### PostgreSQL Dockerfile

```dockerfile
FROM postgres:17.6-alpine

# Install UUID extension automatically
RUN echo 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' > /docker-entrypoint-initdb.d/01-uuid-extension.sql

ENV TZ=UTC
EXPOSE 5432

# PostgreSQL health check
HEALTHCHECK --interval=30s --timeout=10s \
    CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || exit 1
```

### Initialization Script

The file `docker/postgres/init/01-init-db.sql` is executed **automatically** on
first startup:

```sql
-- Enable UUID v7 (required by Prisma models)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Force UTC timezone
SET timezone = 'UTC';
```

### Why Custom?

- **UUID v7 support**: Required by Prisma models
- **Consistent timezone**: Always UTC
- **Zero manual configuration**: Everything automatic
- **Same setup everywhere**: Dev, test, production

---

## 🔧 Docker Compose Configurations

### docker-compose.dev.yml (Development)

**Purpose**: Local development with persistent database

```yaml
services:
  postgres:
    build: ./docker/postgres # Uses custom PostgreSQL
    environment:
      POSTGRES_DB: fantasy_characters_dev
      POSTGRES_USER: fantasy_user
      POSTGRES_PASSWORD: fantasy_password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data # Persists data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d

  pgadmin: # Graphical database interface
    image: dpage/pgadmin4:latest
    ports:
      - '8080:80'
    profiles: [admin] # Start only with --profile admin
```

**Command**: `pnpm docker:compose:dev` → PostgreSQL + pgAdmin only

### docker-compose.prod.yml (Production)

**Purpose**: Complete API + Database deployment

```yaml
services:
  api:
    build: . # Uses main Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://fantasy_user:fantasy_password@postgres:5432/fantasy_characters_dev
    ports:
      - '3000:3000'
    depends_on:
      postgres:
        condition: service_healthy # Wait for postgres to be ready

  postgres:
    # Same setup as dev
```

**Command**: `pnpm docker:compose:prod` → API + PostgreSQL + pgAdmin

### docker-compose.integration.yml (Testing)

**Purpose**: Automated testing with temporary database

```yaml
services:
  api:
    # Setup for testing with LOG_LEVEL: debug
    volumes:
      - ./src:/app/src:ro # Read-only mount for debugging

  redis: # Cache for advanced testing
    image: redis:7-alpine
    profiles: [cache]
```

**Command**: `pnpm docker:compose:integration` → Complete setup for CI/CD

---

## 📜 Package.json Scripts

### Main Docker Scripts

```json
{
  "scripts": {
    // Build API image
    "docker:build": "docker build -t fantasy-characters-api .",

    // Run single API container
    "docker:run": "docker run -p 3000:3000 fantasy-characters-api",

  // Docker Compose for development (DB only)
  "docker:compose:dev": "docker compose -f docker-compose.dev.yml up -d",

    // Docker Compose production (API + DB)
  "docker:compose:prod": "docker compose -f docker-compose.prod.yml up -d",

    // Docker Compose for CI/CD testing
  "docker:compose:integration": "docker compose -f docker-compose.integration.yml up -d",

  // Stop all containers
  "docker:compose:dev:down": "docker compose -f docker-compose.dev.yml down",

  // Stop ALL environments
  "docker:compose:all:down": "docker compose -f docker-compose.dev.yml down && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.integration.yml down"
  }
}
```

### Related Scripts

```json
{
  "scripts": {
    // Database management (works with containers)
    "db:migrate": "prisma migrate dev", // Create/apply migrations
    "db:generate": "prisma generate", // Generate Prisma client
    "db:seed": "tsx src/infrastructure/database/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "db:studio": "prisma studio", // Database GUI

    // Development
    "dev": "tsx watch src/server.ts", // Local development
    "build": "tsc && tsc-alias -p tsconfig.json", // Build for Docker

    // CI/CD integration
    "smoke:test": "tsx scripts/smoke-tests.ts" // Test after deployment
  }
}
```

---

## 🔄 Development Workflow

### 1. Initial Project Setup

```bash
# Clone repository
git clone <repo-url>
cd fantasy-characters-api

# Install dependencies
pnpm install

# Start PostgreSQL database
pnpm docker:compose:dev

# Generate Prisma client
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Seed test data
pnpm db:seed
```

### 2. Daily Development

```bash
# Morning: Start database
pnpm docker:compose:dev

# Development: API in watch mode (outside Docker)
pnpm dev

# Database GUI (optional)
pnpm docker compose -f docker-compose.dev.yml --profile admin up -d
# Open http://localhost:8080
```

### 3. Integration Testing

```bash
# Setup test environment
pnpm docker:compose:integration

# Run test suite
pnpm test:e2e

# Cleanup
pnpm docker:compose:dev:down
```

### 4. Build and Deploy

```bash
# Build Docker image
pnpm docker:build

# Test in production-like environment
pnpm docker:compose:prod

# Smoke test
pnpm smoke:test

# Cleanup
pnpm docker:compose:all:down
```

---

## 🎯 Quick Commands

### Quick Setup

```bash
pnpm docker:compose:dev          # Start database only
pnpm dev                         # Start API in development
```

### Complete Test

```bash
pnpm docker:compose:prod         # Start everything (API + DB)
pnpm smoke:test                  # Verify it works
pnpm docker:compose:dev:down     # Stop everything (dev)
```

### Debug Database

```bash
pnpm docker compose -f docker-compose.dev.yml --profile admin up -d  # Start pgAdmin
# Go to http://localhost:8080
# Login: admin@fantasy-api.dev / admin123
```

### Complete Reset

```bash
pnpm docker:compose:all:down     # Stop all environments
docker system prune -f           # Clean images/cache
pnpm docker:compose:dev          # Restart from scratch
```

---

**Note**: This Docker configuration ensures every developer has the same
environment, simplifies deployment, and reduces "works on my machine" problems
🚀
