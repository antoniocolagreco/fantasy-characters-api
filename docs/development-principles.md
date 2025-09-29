# Development Standards

## Core Principles

1. **Schema-First Development**: Define TypeBox schemas, derive TypeScript types
2. **Single Source of Truth**: Centralized type definitions in `src/shared/schemas`
3. **Functional Architecture**: Pure functions organized in object literals
4. **Type Safety**: Strict TypeScript with no `any` types or assertions

## Implementation Workflow

1. **Schema Definition**: Create TypeBox validation schemas
2. **Type Generation**: Derive TypeScript types from schemas
3. **Repository Layer**: Database access with Prisma
4. **Service Layer**: Business logic implementation
5. **Controller Layer**: HTTP request handling
6. **Testing**: Unit and integration test coverage

```ts
// 1. Import centralized schemas (ALWAYS required first step)
import {
  PaginationQuerySchema,
  SortQuerySchema,
  VisibilitySchema,
  BaseEntitySchema,
  OwnedEntitySchema,
  createSuccessResponseSchema,
  createPaginatedResponseSchema,
} from '../shared/schemas'

// 2. Define Schema (in feature-name.schema.ts)
export const UserSchema = Type.Intersect(
  [
    BaseEntitySchema, // Always extend from base
    Type.Object({
      email: Type.String({ format: 'email' }),
      name: Type.String({ minLength: 1, maxLength: 100 }),
    }),
  ],
  { $id: 'User' }
)

// 2. Derive Types (in feature-name.types.ts)
export type User = Static<typeof UserSchema>
export const CreateUserPersistSchema = Type.Omit(UserSchema, [
  'id',
  'lastLogin',
  'isBanned',
  'banReason',
  'bannedUntil',
  'bannedById',
  'createdAt',
  'updatedAt',
])
export type CreateUserPersist = Static<typeof CreateUserPersistSchema>

// 3. Repository Layer (in feature-name.repository.ts)
export async function createUserInDb(data: CreateUserPersist): Promise<User> {
  const id = generateUUIDv7()
  return prisma.user.create({
    data: {
      id,
      ...data,
      lastLogin: new Date().toISOString(),
    },
  })
}

// 4. Service Layer (in feature-name.service.ts) - Object literal wrapper
export const userService = {
  async createUser(data: CreateUserPersist): Promise<User> {
    // Business logic validation
    const existingUser = await findUserByEmail(data.email)
    if (existingUser) throw err('EMAIL_ALREADY_EXISTS', 'Email already exists') // See error-handling.md

    return createUserInDb(data)
  },

  async getUserById(id: string): Promise<User | null> {
    return findUserByIdInDb(id)
  },

  // ... other user operations
} as const

// 5. Controller (in feature-name.controller.ts) - Object literal wrapper
export const userController = {
  async create(req: FastifyRequest, reply: FastifyReply) {
    const user = await userService.createUser(req.body) // req.body is typed automatically
    return reply.code(201).send(success(user, req.id)) // See response-templates.md for success()
  },

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const user = await userService.getUserById(req.params.id)
    return reply.send(success(user, req.id))
  },

  // ... other controller methods
} as const

// 6. Register Routes (in feature-name.routes.ts)
app.post(
  '/users',
  {
    schema: {
      body: CreateUserRequestSchema, // Validates input (HTTP layer)
      response: {
        201: createSuccessResponseSchema(PublicUserSchema, 'UserResponse'),
      }, // Centralized response helper
    },
  },
  userController.create // Clean object method reference
)
```

## General Instructions

- **Always validate inputs** using TypeBox schemas (see
  [query-templates.md](./query-templates.md))
- **Keep business logic in services**, not controllers
- **Use repositories for database access**, keep services clean
- **Use transactions** for multi-step database operations
- **Follow response patterns** from
  [response-templates.md](./response-templates.md)
- **Handle errors properly** using patterns from
  [error-handling.md](./error-handling.md)
- **Prefer explicit over implicit** - be clear about intentions
- **Write code that fails fast** in development but handles errors gracefully in
  production
- **Use object literal wrappers** for services and controllers to maintain clean
  namespaces
- **Export pure functions wrapped in `const` objects** with `as const` for type
  safety
