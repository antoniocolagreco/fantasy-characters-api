# Project Structure

## Directory Organization

```typescript
src/
├── features/                    # Feature modules
│   ├── feature-name/
│   │   ├── v1/                  # Versioned API layer
│   │   │   ├── feature-name.controller.ts
│   │   │   ├── feature-name.http.schema.ts
│   │   │   └── feature-name.routes.ts
│   │   ├── feature-name.service.ts
│   │   ├── feature-name.repository.ts
│   │   ├── feature-name.domain.schema.ts
│   │   ├── feature-name.type.ts
│   │   └── index.ts
├── infrastructure/               # Technical infrastructure
│   ├── config.ts
│   ├── database/
│   └── logging/
├── shared/                      # Reusable utilities
│   ├── constants/
│   ├── errors/
│   ├── plugins/
│   ├── schemas/
│   ├── types/
│   ├── utils/
│   └── index.ts
├── app.ts
├── server.ts
└── tests/
```

## Architecture Principles

- **Feature isolation**: Organize by business domain
- **Layer separation**: HTTP, business, and data layers
- **Version isolation**: Version HTTP layer only (`v1/`, `v2/`)
- **Type safety**: Schema-first development with TypeBox
- **Dependency direction**: Controllers → Services → Repositories

## File Responsibilities

### HTTP Layer (Versioned)

- **Routes**: Endpoint registration with middleware and validation
- **Controllers**: HTTP request/response handling  
- **HTTP Schemas**: Request/response validation schemas

### Business Layer

- **Services**: Business logic and authorization
- **Repositories**: Database access and queries
- **Domain Schemas**: Business entity definitions

### Type Management

- **Type files**: Centralized type exports to prevent circular dependencies

### Utilities

- **Middleware**: Authentication, RBAC, validation
- **Helpers**: Pure utility functions
- **Policies**: Authorization decision logic

## Implementation Workflow

1. **Schema Definition**: Create TypeBox validation schemas
2. **Type Generation**: Derive TypeScript types from schemas
3. **Repository Layer**: Database access with Prisma
4. **Service Layer**: Business logic implementation
5. **Controller Layer**: HTTP request handling
6. **Testing**: Unit and integration test coverage

## File Splitting Policy

When files exceed 500 lines, split by operation/responsibility:

**Generic Pattern**: `feature-name.layer.operation.ts`

**Services**: Split by HTTP operation

- `feature-name.list.service.ts` (list/search operations)
- `feature-name.get.service.ts` (read by ID)
- `feature-name.create.service.ts` (create operations)
- `feature-name.update.service.ts` (update operations)
- `feature-name.delete.service.ts` (delete operations)

**Repositories**: Split by entity operation

- `feature-name.query.repository.ts` (complex queries)
- `feature-name.mutation.repository.ts` (create/update/delete)

## Versioning Policy

- Default: version only the HTTP layer (`v1/`) to evolve the public contract
  without duplicating domain logic
- Services and repositories remain version-agnostic and shared across versions
- Use transformation in repositories when you need to change the response shapes
  between versions
- Consider placing authentication/session-related persistence (e.g., refresh
  tokens) under the `auth` feature to respect SRP and keep `users` focused on
  user domain data

**Note**: Currently only v1 is implemented. Future versions (v2, etc.) will
follow the same pattern.
