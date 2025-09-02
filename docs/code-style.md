# AI Code Style Essentials

## Critical Rules for Initial Code

### File & Formatting

- **Files**: kebab-case.ts (e.g., `user-service.ts`) - see [project-structure.md](./project-structure.md) for complete file organization
- **Indentation**: 4 spaces, never tabs
- **Semicolons**: None at line endings
- **Line length**: 100 characters max
- **Quotes**: Single quotes

### TypeScript Strictness

- **Forbidden**: `any`, `as`, `<Type>`, `!` (type assertions)
- **Required**: Strict typing with library-native types
- **Prefer**: `type` over `interface` for better composition

### Type Patterns

#### Use Library Types

```ts
// ✅ Fastify native types
import type { FastifyRequest, FastifyReply } from 'fastify'

interface RouteParams {
  Params: { id: string }
  Querystring: { limit?: number }
  Body: { name: string }
}

export async function handler(
  request: FastifyRequest<RouteParams>,
  reply: FastifyReply
) {
  // Fully typed
}
```

#### Schema-First Types

```ts
// ✅ Extract types from TypeBox schemas
import { Type, type Static } from '@sinclair/typebox'

export const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  name: Type.String()
})

export type User = Static<typeof UserSchema>
export const CreateUserSchema = Type.Omit(UserSchema, ['id'])
export type CreateUserRequest = Static<typeof CreateUserSchema>
```

#### Type Guards Over Assertions

```ts
// ✅ Runtime validation
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as any).id === 'string'
  )
}

// ❌ Never use assertions
// const user = data as User
```
