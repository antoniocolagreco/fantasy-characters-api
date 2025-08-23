# Testing with PostgreSQL

## Overview

The Fantasy Character API now uses PostgreSQL for all environments, including testing. This ensures
consistency across development, testing, and production environments.

## Test Database Setup

### Docker Compose Test Database

The project includes a dedicated PostgreSQL test database:

```yaml
# docker-compose.yml
database-test:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: fantasy_character_api_test
    POSTGRES_USER: developer
    POSTGRES_PASSWORD: password
  ports:
    - '5433:5432' # Different port to avoid conflicts
```

### Test Environment Configuration

```bash
# Test database URL (port 5433 for test database)
DATABASE_URL=postgresql://developer:password@localhost:5433/fantasy_character_api_test
```

## Running Tests

### Start Test Database

```bash
# Start only the test database
docker-compose up -d database-test

# Or start both development and test databases
docker-compose up -d database database-test
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/users/tests/user.service.test.ts

# Run tests in watch mode
pnpm test:watch
```

## Test Database Management

### Reset Test Database

The test database is automatically reset before each test run:

```bash
# Manual reset (done automatically by vitest.setup.ts)
DATABASE_URL=postgresql://developer:password@localhost:5433/fantasy_character_api_test pnpm prisma db push --force-reset
```

### Seed Test Data

```bash
# Manual seed (if needed)
DATABASE_URL=postgresql://developer:password@localhost:5433/fantasy_character_api_test pnpm prisma db seed
```

## Benefits of PostgreSQL Testing

### Consistency

- **Same Database Engine**: Tests run against the same PostgreSQL engine used in production
- **Same SQL Features**: Full PostgreSQL feature set available in tests
- **Same Constraints**: Foreign key constraints and data validation work identically

### Performance

- **Connection Pooling**: PostgreSQL handles concurrent test connections efficiently
- **Parallel Testing**: Multiple test files can run simultaneously
- **Transaction Isolation**: Each test can run in isolation

### Reliability

- **ACID Compliance**: Full transaction support ensures test data integrity
- **Concurrency**: Better handling of concurrent test execution
- **Data Types**: Native support for UUIDs, JSON, and other PostgreSQL types

## Test Architecture

### Test Database Isolation

Each test suite gets a clean database state:

```typescript
// Automatic in vitest.setup.ts
beforeAll(async () => {
  await execSync('pnpm prisma db push --force-reset', {
    env: {
      DATABASE_URL: 'postgresql://developer:password@localhost:5433/fantasy_character_api_test',
    },
  })
})
```

### Test Data Management

```typescript
// Example test setup
beforeEach(async () => {
  // Clean up before each test
  await db.character.deleteMany({})
  await db.user.deleteMany({})

  // Create test user
  const testUser = await db.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      role: 'USER',
    },
  })
})
```

## Migration from SQLite

### What Changed

- **Database URL**: Changed from `file:./test.db` to PostgreSQL connection string
- **Test Setup**: Removed file cleanup, added PostgreSQL database reset
- **Docker Services**: Added dedicated test database service
- **Health Checks**: Updated to use PostgreSQL-specific health checks

### Benefits

- **Production Parity**: Tests now run against the same database engine as production
- **Better Concurrency**: Multiple test processes can run simultaneously
- **Full SQL Support**: Access to all PostgreSQL features in tests
- **Consistent Behavior**: No more differences between test and production database behavior

## Troubleshooting

### Database Connection Issues

```bash
# Check if test database is running
docker-compose ps database-test

# View test database logs
docker-compose logs database-test

# Test connection manually
psql -h localhost -p 5433 -U developer -d fantasy_character_api_test
```

### Port Conflicts

If port 5433 is already in use:

```yaml
# Change port in docker-compose.yml
database-test:
  ports:
    - '5434:5432' # Use different port
```

Update test configuration accordingly:

```bash
DATABASE_URL=postgresql://developer:password@localhost:5434/fantasy_character_api_test
```

### Test Data Cleanup

If tests leave orphaned data:

```bash
# Manual cleanup
DATABASE_URL=postgresql://developer:password@localhost:5433/fantasy_character_api_test pnpm prisma db push --force-reset
```

## Performance Tips

### Faster Test Execution

- **Parallel Execution**: Vitest runs tests in parallel by default
- **Connection Pooling**: PostgreSQL efficiently manages test connections
- **Transaction Rollbacks**: Use transactions for faster test cleanup when possible

### Memory Management

- **Connection Limits**: PostgreSQL handles connection limits automatically
- **Resource Cleanup**: Proper cleanup in test teardown prevents memory leaks
- **Database Reset**: Full database reset ensures clean state between test runs

## CI/CD Considerations

### GitHub Actions

```yaml
# .github/workflows/test.yml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_DB: fantasy_character_api_test
      POSTGRES_USER: developer
      POSTGRES_PASSWORD: password
    ports:
      - 5433:5432
    options: >-
      --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
```

### Environment Variables

```bash
# CI/CD environment variables
DATABASE_URL=postgresql://developer:password@localhost:5433/fantasy_character_api_test
NODE_ENV=test
```

This setup ensures consistent, reliable testing across all environments while maintaining the
performance and features of PostgreSQL.
