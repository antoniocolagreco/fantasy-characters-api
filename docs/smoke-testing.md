# Smoke Testing

Smoke tests verify basic API functionality in deployed environments or during
integration testing. They test core endpoints for health, readiness, and basic
functionality.

## Purpose

- **Deployment validation**: Verify API works after deployment
- **Environment testing**: Test integration between containers/services
- **Health monitoring**: Quick verification that all systems are operational
- **Post-deployment checks**: Ensure API is ready for production traffic

## Complete Setup (From Zero)

**⚠️ Important**: Smoke tests require a running API server with a properly setup
database (migrations + seed data).

```bash
# 1. Start Docker environment
pnpm docker:compose:integration

# 2. Apply database migrations (REQUIRED)
docker exec fantasy-characters-api-api-1 npx prisma migrate deploy

# 3. Seed the database with test data (REQUIRED for most endpoints)
docker exec fantasy-characters-api-api-1 npx prisma db seed

# 4. Run smoke tests
pnpm smoke:test
```

**Alternative with auto-start** (starts API server automatically):

```bash
# Ensure database is running first
pnpm docker:compose:integration

# Apply migrations manually (auto-start doesn't handle this)
docker exec fantasy-characters-api-api-1 npx prisma migrate deploy
docker exec fantasy-characters-api-api-1 npx prisma db seed

# Then run with auto-start
pnpm smoke:test --start
```

> **💡 Note**: The `--start` option starts the API server but doesn't handle
> database setup. You must apply migrations and seed data manually first.

## Quick Usage

```bash
# Run against a running API (default: localhost:3000)
pnpm smoke:test

# Or with auto-start (starts API server automatically)
pnpm smoke:test --start
```

## Configuration via Environment Variables

```bash
# Target different environments
SMOKE_TEST_URL=https://your-api.com pnpm smoke:test

# Adjust timeouts and retries
SMOKE_TEST_TIMEOUT=5000 pnpm smoke:test
SMOKE_TEST_RETRIES=5 pnpm smoke:test
SMOKE_TEST_SLOW_MS=2000 pnpm smoke:test

# Include authenticated endpoints (requires admin token)
SMOKE_TEST_TOKEN=your-jwt-token pnpm smoke:test
```

## What Smoke Tests Check

- **Health & Readiness**: `/api/health`, `/api/ready`
- **OpenAPI Documentation**: `/docs/json`
- **Public Endpoints**: All v1 API endpoints (characters, races, skills, etc.)
- **Admin Endpoints**: User management (when token provided)

## Expected Behavior

- **✅ Pass**: All endpoints return expected HTTP status codes
- **🔄 Retry**: Failed requests are retried up to 3 times with exponential
  backoff
- **⏱️ Performance**: Reports response times and warns on slow responses (>1s)
- **🚨 Fail**: Any endpoint returning unexpected status causes overall failure

## Integration with Docker

```bash
# Test integration environment
pnpm docker:compose:integration
pnpm smoke:test    # Test against running containers

# Test production build
pnpm docker:compose:prod
SMOKE_TEST_URL=http://localhost:3000 pnpm smoke:test
```

## Troubleshooting

- **Database not ready**: Ensure migrations are applied
  (`docker exec container npx prisma migrate deploy`)
- **Connection refused**: API server not running or wrong URL
- **500 errors**: Check database connection and seeded data
- **Timeout**: Increase `SMOKE_TEST_TIMEOUT` for slow environments

## Use Cases

### **Local Development**

```bash
pnpm docker:compose:integration
pnpm smoke:test
```

### **CI/CD Pipeline**

```bash
# In GitHub Actions or similar
docker run -d --name api-test my-api:latest
sleep 15
SMOKE_TEST_URL=http://localhost:3000 pnpm smoke:test
```

### **Production Deployment**

```bash
# After deployment
SMOKE_TEST_URL=https://api.myapp.com pnpm smoke:test
```

### **Staging Environment**

```bash
SMOKE_TEST_URL=https://staging-api.myapp.com \
SMOKE_TEST_TOKEN=$ADMIN_TOKEN \
pnpm smoke:test
```

## Commands Reference

```bash
pnpm smoke:test                              # Test localhost:3000
pnpm smoke:test --start                      # Auto-start API and test
SMOKE_TEST_URL=https://api.com pnpm smoke:test  # Test remote API
```
