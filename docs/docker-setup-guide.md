# Docker Setup Guide

Docker and Docker Compose configuration for the Fantasy Characters API

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Dockerfile](#dockerfile)
4. [PostgreSQL Configuration](#postgresql-configuration)
5. [Docker Compose](#docker-compose)
6. [Package Scripts](#package-scripts)
7. [Usage](#usage)

---

## Overview

The project uses Docker and Docker Compose for containerized development and deployment with PostgreSQL database management.

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

## Project Structure

```text
fantasy-characters-api/
├── Dockerfile
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── docker-compose.integration.yml
└── docker/
    └── postgres/
        ├── Dockerfile
        └── init/
            └── 01-init-db.sql
```

---

## Dockerfile

### Multi-Stage Build

```dockerfile
FROM node:24-alpine AS base
RUN corepack enable pnpm
RUN apk add --no-cache openssl wget

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm db:generate && pnpm build

FROM base AS runtime
RUN adduser --system --uid 1001 apiuser
COPY --from=build --chown=apiuser:nodejs /app/dist ./dist
USER apiuser
CMD ["node", "dist/server.js"]
```

---

## PostgreSQL Configuration

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

### Features

- UUID v7 extension support
- UTC timezone configuration
- Automated initialization

---

## Docker Compose

### Development Configuration

```yaml
services:
  postgres:
    build: ./docker/postgres
    environment:
      POSTGRES_DB: fantasy_characters_dev
      POSTGRES_USER: fantasy_user
      POSTGRES_PASSWORD: fantasy_password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d

  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - '8080:80'
    profiles: [admin]
```

### Production Configuration

```yaml
services:
  api:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://fantasy_user:fantasy_password@postgres:5432/fantasy_characters_dev
    ports:
      - '3000:3000'
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    # Same configuration as development
```

### Integration Testing Configuration

```yaml
services:
  api:
    volumes:
      - ./src:/app/src:ro

  redis:
    image: redis:7-alpine
    profiles: [cache]
```

---

## Package Scripts

### Docker Commands

```json
{
  "scripts": {
    "docker:build": "docker build -t fantasy-characters-api .",
    "docker:run": "docker run -p 3000:3000 fantasy-characters-api",
    "docker:compose:dev": "docker compose -f docker-compose.dev.yml up -d",
    "docker:compose:prod": "docker compose -f docker-compose.prod.yml up -d",
    "docker:compose:integration": "docker compose -f docker-compose.integration.yml up -d",
    "docker:compose:dev:down": "docker compose -f docker-compose.dev.yml down",
    "docker:compose:all:down": "docker compose -f docker-compose.dev.yml down && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.integration.yml down"
  }
}
```

### Database Management

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "tsx src/infrastructure/database/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "db:studio": "prisma studio"
  }
}
```

---

## Usage

### Setup

```bash
pnpm install
pnpm docker:compose:dev
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### Development

```bash
pnpm docker:compose:dev
pnpm dev
```

### Testing

```bash
pnpm docker:compose:integration
pnpm test:e2e
```

### Production

```bash
pnpm docker:build
pnpm docker:compose:prod
```

---

## Commands

### Local Development

```bash
pnpm docker:compose:dev
pnpm dev
```

### Production Deployment

```bash
pnpm docker:compose:prod
pnpm smoke:test
```

### Database Admin

```bash
pnpm docker compose -f docker-compose.dev.yml --profile admin up -d
# Access pgAdmin at http://localhost:8080
```

### Cleanup

```bash
pnpm docker:compose:all:down
docker system prune -f
```
