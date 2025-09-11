# Code Style

## Critical Rules for Initial Code

### File & Formatting

- **Files**: kebab-case.ts (e.g., `users.service.ts`,
  `refresh-token.repository.ts`) - see
  [project-structure.md](./project-structure.md) for complete file organization
- **Indentation**: 4 spaces, never tabs
- **Semicolons**: None at line endings
- **Line length**: 100 characters max
- **Quotes**: Single quotes

### TypeScript Strictness

- **Forbidden**: `any`, `as`, `<Type>`, `!` (type assertions)
- **Required**: Strict typing with library-native types
- **Prefer**: `type` over `interface` for better composition
- **Exception**: Type assertions allowed in type guards with proper validation
  (e.g., `obj as Record<string, unknown>` after `isRecord(obj)` check)

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
  name: Type.String(),
})

export type User = Static<typeof UserSchema>
export const CreateUserSchema = Type.Omit(UserSchema, ['id'])
export type CreateUserRequest = Static<typeof CreateUserSchema>
```

#### Type Guards Over Assertions

```ts
// ✅ Runtime validation with controlled assertions
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasStringProp<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, string> {
  return (
    isRecord(obj) && typeof (obj as Record<string, unknown>)[key] === 'string'
  )
}

// ❌ Never use naked assertions
// const user = data as User
```

#### Object Literal Wrappers

```ts
// ✅ Organize pure functions with object literals
export const userService = {
  async getById(id: string): Promise<User> {
    // Implementation
  },

  async create(data: CreateUserInput): Promise<User> {
    // Implementation
  },
} as const

export const userController = {
  async getUser(request: FastifyRequest, reply: FastifyReply) {
    // Implementation
  },
} as const
```

## ESLint Configuration

The project uses strict ESLint rules enforced in `eslint.config.js`:

- **`@typescript-eslint/no-explicit-any: 'error'`** - Forbids `any` types
- **`@typescript-eslint/no-non-null-assertion: 'error'`** - Forbids `!`
  assertions
- **`@typescript-eslint/prefer-as-const: 'error'`** - Enforces `as const`
- **`no-console: 'warn'`** - Warns on console usage (allowed in scripts/tests)
- **`prettier/prettier: 'error'`** - Enforces Prettier formatting

## Prettier Configuration

Formatting rules in `.prettierrc`:

- **`tabWidth: 4`** - 4 spaces for TypeScript files
- **`tabWidth: 2`** - 2 spaces for JSON/Markdown overrides
- **`semi: false`** - No semicolons
- **`singleQuote: true`** - Single quotes
- **`printWidth: 100`** - 100 character line limit
