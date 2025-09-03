# 🤖 AI Development Quick Reference

## Key Principles

1. **Schema-First**: Define TypeBox schemas, derive TypeScript types
2. **Single Source of Truth**: Never duplicate type definitions
3. **Functional over OOP**: Pure functions for business logic
4. **KISS**: Simplest code that works
5. **YAGNI**: Only build what's needed right now
6. **DRY**: Extract common code, don't over-abstract

## Schema-First Development Workflow

This workflow aligns with our [project structure](./project-structure.md) and
ensures consistent implementation across all features.

### Plan → Scaffold → Schema → Types → Repository → Service → Controller → Errors → Tests → Docs

1. **Plan** - Define feature requirements and API endpoints
2. **Scaffold** - Generate versioned folders (`v1/`, `v2/`) + shared files
3. **Schema** - Create TypeBox validation schemas in each version
4. **Types** - Define domain TypeScript types
5. **Repository** - Set up Prisma models and database access layer
6. **Service** - Implement business logic and coordinate repositories
7. **Controller** - Create HTTP handlers calling services
8. **Errors** - Add custom error handling (see
   [error-handling.md](./error-handling.md))
9. **Tests** - Write unit and integration tests
10. **Docs** - Document API endpoints and usage

```ts
// 1. Define Schema (in feature-name.schema.ts)
export const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
})

// 2. Derive Types (in feature-name.types.ts)
export type User = Static<typeof UserSchema>
export const CreateUserSchema = Type.Omit(UserSchema, ['id'])
export type CreateUserInput = Static<typeof CreateUserSchema>

// 3. Repository Layer (in feature-name.repository.ts)
export async function createUserInDb(data: CreateUserInput): Promise<User> {
  return prisma.user.create({ data: { ...data, id: generateUUIDv7() } })
}

// 4. Service Layer (in feature-name.service.ts)
export async function createUser(data: CreateUserInput): Promise<User> {
  // Business logic validation
  const existingUser = await findUserByEmail(data.email)
  if (existingUser) throw err('EMAIL_ALREADY_EXISTS', 'Email already exists') // See error-handling.md

  return createUserInDb(data)
}

// 5. Controller (in feature-name.controller.ts)
export async function createUserHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const user = await createUser(req.body) // req.body is typed automatically
  return reply.code(201).send(success(user, req.id)) // See response-templates.md for success()
}

// 6. Register Routes (in feature-name.route.ts)
app.post(
  '/users',
  {
    schema: {
      body: CreateUserSchema, // Validates input
      response: { 201: createResponseSchema(UserSchema) }, // See response-templates.md
    },
  },
  createUserHandler
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
