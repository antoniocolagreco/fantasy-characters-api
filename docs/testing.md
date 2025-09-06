# Testing Guide

Practical testing standards for the Fantasy Characters API.

## Test Types

- **Unit**: Business logic, no DB (< 50ms)
- **Integration**: API + database (< 500ms)
- **E2E**: Full workflows (< 5s)

## File Structure

```text
tests/
├── unit/           # Pure business logic
├── integration/    # API endpoints
├── e2e/           # User workflows
├── helpers/       # Test utilities
└── fixtures/      # Test data
```

**Naming**: `{feature}.{operation}.{type}.test.ts`

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

## Best Practices

- **Arrange/Act/Assert** pattern
- One behavior per test
- Generate test data, no hardcoded values
- Clean slate for each test
- Test behavior, not implementation

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
