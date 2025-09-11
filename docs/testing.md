# Testing Guide

Comprehensive testing practices for the Fantasy Characters API using Vitest.

## Test Types & Organization

The project uses **feature-based test organization** rather than test-type
separation:

```text
tests/
├── features/           # Feature-based tests (main)
│   ├── characters/     # Character-related tests
│   ├── auth/          # Authentication tests
│   ├── users/         # User management tests
│   ├── images/        # Image processing tests
│   └── ...            # Other feature tests
├── shared/            # Shared utility tests
├── infrastructure/    # Infrastructure tests
├── helpers/           # Test utilities & factories
├── setup/            # Test setup utilities
└── setup.ts          # Global test configuration
```

**Test Categories by Suffix:**

- **`.test.ts`** - Standard feature tests (integration + some unit)
- **`.unit.test.ts`** - Pure unit tests with mocked dependencies
- **`.integration.test.ts`** - API endpoint tests with real database
- **`.service.test.ts`** - Service layer tests (usually unit with mocks)
- **`.repository.test.ts`** - Repository layer tests (integration with database)

## Actual Testing Architecture

### **Integration-First Approach**

Most tests are integration tests that use a real test database, providing
confidence in the full stack while maintaining reasonable speed.

### **Unified Configuration**

Single `vitest.config.ts` configuration handles all test types with:

- **Global setup**: Database initialization, mocking, environment
- **Single-threaded execution**: Prevents database conflicts
- **Comprehensive coverage**: 80% global threshold with detailed exclusions

### **Database Strategy**

- **Shared test database**: PostgreSQL with full schema
- **Global cleanup**: Automated cleanup between tests
- **Seed utilities**: Comprehensive test data factories
- **Transactional isolation**: Each test gets clean state

## Test Template

```typescript
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '@/app'
import {
  cleanupTestData,
  createAuthHeaders,
  HTTP_STATUS,
} from '@/tests/helpers'

describe('Users API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()
  })

  afterAll(async () => await app.close())
  beforeEach(async () => await cleanupTestData())

  it('creates user with valid data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: {
        'content-type': 'application/json',
        ...createAuthHeaders({ role: 'ADMIN' }),
      },
      payload: { email: 'test@example.com', name: 'Test User' },
    })

    expect(response.statusCode).toBe(HTTP_STATUS.CREATED)
    expect(response.json().data).toMatchObject({
      id: expect.any(String),
      email: 'test@example.com',
    })
  })

  it('returns 403 for non-admin users', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: createAuthHeaders({ role: 'USER' }),
    })

    expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN)
  })
})
```

## Test Helpers

```typescript
// tests/helpers/test.helper.ts
export const HTTP_STATUS = { OK: 200, CREATED: 201, BAD_REQUEST: 400 } as const

// tests/helpers/auth.helper.ts
export function createAuthHeaders(options: { role?: 'USER' | 'ADMIN' } = {}) {
  return { Authorization: `Bearer ${generateTestToken(options)}` }
}

// tests/helpers/data.helper.ts
export async function cleanupTestData() {
  await prisma.user.deleteMany()
}
```

## Configuration

**Main**: `vitest.config.ts` - Unified configuration for all test types

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

**Note**: Previous specialized configurations (unit/integration/e2e) have been
consolidated into the unified setup for simplicity.

**Coverage**: 80% global, 95% for auth/validation/errors

## Test Utilities & Helpers

The project provides comprehensive testing utilities organized in
`tests/helpers/`:

### **Authentication Helpers** (`tests/helpers/auth.helper.ts`)

```typescript
// Get auth tokens for different user roles
const { accessToken, refreshToken } = await getValidTokens('admin')

// Register test users with specific roles
const user = await registerTestUser(registerData, 'moderator')

// Clean authentication state
await cleanupAuthTestData()
```

### **User Management** (`tests/helpers/user.helper.ts`)

```typescript
// Create users with permissions
const adminUser = await createTestUserWithPermissions([
  'users:read',
  'users:write',
])

// Clean user test data
await cleanupUserTestData()
```

### **Data Factories** (`tests/helpers/character.helper.ts`, etc.)

```typescript
// Create test characters with relationships
const character = await createTestCharacter({
  name: 'Test Hero',
  race: 'human',
  archetype: 'warrior',
})

// Clean feature test data
await cleanupCharacterTestData()
```

### **Database Helpers** (`tests/helpers/database.helper.ts`)

```typescript
// Reset database to clean state
await resetTestDatabase()

// Seed specific test data
await seedTestData(['users', 'characters'])
```

### **Request Helpers** (`tests/helpers/request.helper.ts`)

```typescript
// Make authenticated requests
const response = await makeAuthenticatedRequest(app, {
  method: 'GET',
  url: '/api/v1/characters',
  token: userToken,
})
```

## Mocking Strategy

### **External Services**

External dependencies are mocked at the module level using Vitest's `vi.mock()`:

```typescript
// Mock file storage
vi.mock('../../../src/infrastructure/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue({ url: 'mock-url' }),
  deleteFile: vi.fn().mockResolvedValue(undefined),
}))

// Mock email service
vi.mock('../../../src/infrastructure/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}))
```

### **Repository Layer**

Repository methods are mocked for unit tests:

```typescript
const mockRepository = {
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}
```

### **Service Dependencies**

Services are mocked using dependency injection:

```typescript
const mockCharacterService = {
  createCharacter: vi.fn().mockResolvedValue(mockCharacter),
  getCharacter: vi.fn(),
}
```

## Test Patterns

### **Integration Test Pattern**

Most feature tests follow this integration pattern:

```typescript
describe('Characters API', () => {
  let app: FastifyInstance
  let userToken: string

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()

    // Setup test user and auth
    const { accessToken } = await getValidTokens('user')
    userToken = accessToken
  })

  afterAll(async () => {
    await cleanupCharacterTestData()
    await app.close()
  })

  test('should create character', async () => {
    const response = await makeAuthenticatedRequest(app, {
      method: 'POST',
      url: '/api/v1/characters',
      token: userToken,
      payload: characterData,
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({
      id: expect.any(String),
      name: characterData.name,
    })
  })
})
```

### **Unit Test Pattern**

Pure unit tests with full mocking:

```typescript
describe('CharacterService', () => {
  let service: CharacterService
  let mockRepository: MockProxy<CharacterRepository>

  beforeEach(() => {
    mockRepository = mock<CharacterRepository>()
    service = new CharacterService(mockRepository)
  })

  test('should create character', async () => {
    const characterData = { name: 'Test' }
    const expectedCharacter = { id: '1', ...characterData }

    mockRepository.create.mockResolvedValue(expectedCharacter)

    const result = await service.createCharacter(characterData)

    expect(mockRepository.create).toHaveBeenCalledWith(characterData)
    expect(result).toEqual(expectedCharacter)
  })
})
```

## Test Configuration

### **Global Setup** (`tests/setup.ts`)

```typescript
// Database initialization
beforeAll(async () => {
  await setupTestDatabase()
  await runMigrations()
})

// Cleanup between tests
afterEach(async () => {
  await resetTestDatabase()
})

// Global mocks
vi.mock('../src/infrastructure/storage')
vi.mock('../src/infrastructure/email')
```

### **Coverage Configuration** (`vitest.config.ts`)

- **Global threshold**: 80% coverage required
- **Per-file thresholds**: Functions, lines, branches, statements
- **Excluded files**: Config files, type definitions, database migrations
- **Coverage directory**: `coverage/` with HTML reports

## Running Tests

### **All Tests**

```bash
# Run complete test suite
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

### **Specific Tests**

```bash
# Run feature tests
pnpm test tests/features/characters/

# Run specific test file
pnpm test tests/features/auth/auth.integration.test.ts

# Run tests matching pattern
pnpm test --grep "character creation"
```

### **Test Types**

```bash
# Unit tests only
pnpm test --grep "\.unit\.test\.ts$"

# Integration tests only
pnpm test --grep "\.integration\.test\.ts$"

# Service layer tests
pnpm test --grep "\.service\.test\.ts$"
```

## Performance Standards

- **Unit tests**: < 50ms per test
- **Integration tests**: < 500ms per test
- **Total suite**: < 5 minutes
- **Database operations**: Optimized with cleanup helpers
- **Parallel execution**: Disabled to prevent database conflicts

## Best Practices

### **Test Organization**

- Group tests by feature, not by type
- Use descriptive test names following "should {action} when {condition}"
- Keep tests focused and independent

### **Database Testing**

- Use real database for integration confidence
- Clean state between tests using helpers
- Avoid cross-test dependencies

### **Mocking Guidelines**

- Mock external services (email, storage, APIs)
- Use real database for repository/service integration
- Mock at module boundaries, not internal implementations

### **Assertions**

- Use specific matchers (`toMatchObject`, `toHaveLength`)
- Verify both success and error cases
- Test edge cases and validation

### **Maintenance**

- Update tests with feature changes
- Remove obsolete tests promptly
- Keep test data factories current

## Anti-Patterns

❌ Multiple behaviors in one test  
❌ Hardcoded IDs or data  
❌ Testing implementation details  
❌ Order-dependent tests

## Commands

```bash
pnpm test users.test.ts     # Run specific test
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report
```
