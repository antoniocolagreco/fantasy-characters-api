# AI CI/CD

Essential CI/CD pipeline configuration for automated quality checks and safe deployments.

## Critical CI/CD Rules

1. **Always run lint and typecheck** - Block merge on any warnings
2. **Always require test coverage** - Minimum 80% per file  
3. **Always validate OpenAPI schema** - Ensure API documentation accuracy
4. **Always test Docker builds** - Verify containerized deployment
5. **Always run smoke tests** - Basic health checks on built artifacts

## Required GitHub Actions Workflow

Complete CI/CD pipeline with quality gates and Docker deployment.

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_USER: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint check
        run: pnpm lint
      
      - name: Type check
        run: pnpm type-check
      
      - name: Run tests with coverage
        run: pnpm test:coverage
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          JWT_SECRET: test-secret-for-ci-only
      
      - name: Validate OpenAPI schema
        run: |
          pnpm build
          timeout 30s pnpm start &
          sleep 10
          curl -f http://localhost:3000/docs/json > openapi.json
          npx @apidevtools/swagger-parser validate openapi.json
      
      - name: Upload coverage reports
        uses: actions/upload-artifact@v4
        with:
          name: coverage-reports
          path: coverage/
      
      - name: Upload OpenAPI schema
        uses: actions/upload-artifact@v4
        with:
          name: openapi-schema
          path: openapi.json

  docker-build:
    runs-on: ubuntu-latest
    needs: quality-checks
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: fantasy-api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Run smoke tests
        run: |
          docker run -d --name api-test 
            -p 3000:3000 
            -e NODE_ENV=production 
            -e DATABASE_URL=postgresql://test:test@host.docker.internal:5432/test 
            -e JWT_SECRET=test-secret 
            fantasy-api:${{ github.sha }}
          
          sleep 15
          
          # Health check
          curl -f http://localhost:3000/api/health
          
          # Basic API test
          curl -f http://localhost:3000/api/v1/characters
          
          docker stop api-test
```

## Required Package.json Scripts

Essential scripts for local development and CI/CD pipeline.

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write "src/**/*.{ts,tsx,json,md}"",
    "format:check": "prettier --check "src/**/*.{ts,tsx,json,md}"",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  }
}
```

## Required Docker Configuration

Multi-stage Dockerfile optimized for production deployment.

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM base AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.js"]
```

## Required Test Configuration

Vitest configuration with coverage thresholds and proper test environment.

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        '**/*.config.*',
        '**/*.test.*'
      ]
    },
    setupFiles: ['./src/test/setup.ts']
  }
})
```

## Required Environment Setup

Test environment configuration for CI and local development.

```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/test
JWT_SECRET=test-secret-for-development-only
JWT_REFRESH_SECRET=test-refresh-secret
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Required Quality Gates

Pipeline stages that must pass before code can be merged or deployed.

| Stage           | Command             | Threshold       | Blocking |
|-----------------|---------------------|-----------------|----------|
| **Lint**        | `pnpm lint`         | 0 warnings      | ✅       |
| **Type Check**  | `pnpm type-check`   | 0 errors        | ✅       |
| **Tests**       | `pnpm test:coverage`| 80% coverage    | ✅       |
| **OpenAPI**     | Schema validation   | Valid spec      | ✅       |
| **Docker Build**| Multi-stage build   | Successful      | ✅       |
| **Smoke Test**  | Health + API calls  | All pass        | ✅       |
