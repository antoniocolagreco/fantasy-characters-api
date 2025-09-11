# Code Generation

## Complete Directory Structure with Versioning

```typescript
src/
├── features/                                # Feature-based modules
│   ├── feature-name/
│   │   ├── v1/                              # Version 1 API (HTTP layer only)
│   │   │   ├── feature-name.controller.ts   # v1 HTTP handling
│   │   │   ├── feature-name.http.schema.ts  # v1 request/response schemas (HTTP)
│   │   │   └── feature-name.routes.ts       # v1 route definitions (plural)
│   │   ├── feature-name.service.ts          # Shared business logic (version-agnostic)
│   │   ├── feature-name.repository.ts       # Database access layer
│   │   ├── feature-name.domain.schema.ts    # Domain schemas and types
│   │   ├── feature-name.type.ts             # Type exports barrel
│   │   └── index.ts                         # Feature barrel exports
│   └── ...                                  # Other features
├── infrastructure/                          # Technical layer
│   ├── config.ts                            # Application configuration
│   ├── database/
│   │   ├── index.ts                         # Database exports
│   │   ├── prisma.service.ts                # Prisma client setup
│   │   ├── seed.ts                          # Database seeding
│   │   ├── test-data.generator.ts           # Test data generation
│   │   └── seed/                            # Seed data files
│   └── logging/
│       └── logger.service.ts                # Pino logger configuration
├── shared/                                  # Generic, reusable utilities
│   ├── constants/                           # Shared constants
│   ├── errors/                              # Custom error classes
│   ├── plugins/                             # Fastify plugins
│   ├── schemas/                             # Shared TypeBox schemas
│   ├── types/                               # Shared TypeScript types
│   ├── utils/                               # Pure helper functions
│   ├── fastify.d.ts                         # Fastify type extensions
│   └── index.ts                             # Shared exports
├── app.ts                                   # Application setup
├── server.ts                                # Server entry point
└── tests/
    ├── features/                            # Feature-specific tests
    ├── helpers/                             # Test utilities
    ├── infrastructure/                      # Infrastructure tests
    ├── setup/                               # Test setup utilities
    └── shared/                              # Shared test utilities
```

## Key Rules

- Use `kebab-case` for files/folders, include feature name in files
- Only repositories access Prisma directly
- Services coordinate business logic and call repositories
- Controllers don't build error JSON
- Keep files <500 lines
- shared/ contains only generic, reusable utilities
- Version ONLY the HTTP layer (routes/controller/schema) inside `v1/` folder
- Use `.http.schema.ts` for HTTP layer schemas, `.domain.schema.ts` for domain
  schemas
- Use `.type.ts` files as type export barrels to avoid circular dependencies

## Core File Responsibilities

### **HTTP Layer (Versioned - in `v1/` folder)**

- **feature-name.routes.ts**: Register Fastify endpoints with schemas,
  middleware, and attach controllers
- **feature-name.http.schema.ts**: TypeBox validation schemas for HTTP
  requests/responses, API contracts
- **feature-name.controller.ts**: HTTP coordination layer - extract request
  data, call services, format responses. Exported as object literal wrapper with
  `as const`

### **Business Layer (Version-agnostic - at feature root)**

- **feature-name.service.ts**: Core business logic, granular authorization
  checks, coordinate repository calls. Handle RBAC filtering and permission
  validation. Exported as object literal wrapper with `as const`
- **feature-name.repository.ts**: Pure database access layer using Prisma.
  Execute queries with pre-secured filters from services. Transform Prisma
  models to domain types. Pure functions only
- **feature-name.domain.schema.ts**: Domain-level TypeBox schemas and business
  types. Mirrors Prisma models but with TypeScript types

### **Type Management**

- **feature-name.type.ts**: Type export barrel to avoid circular dependencies.
  Re-exports domain types and HTTP types cleanly

### **Specialized Files**

- **feature-name.middleware.ts**: Custom middleware for feature-specific
  concerns (auth, RBAC, validation)
- **feature-name.policy.ts**: Pure policy functions for authorization decisions
  (used by middleware)
- **feature-name.processing.ts**: Business logic processors (e.g., image
  processing, data transformation)
- **feature-name.helper.ts**: Pure utility functions specific to the feature
  domain

### **Shared Utilities (in `/shared/utils/`)**

- **name.helper.ts**: Reusable utility functions for specific domains (query
  building, RBAC, response formatting, caching)
- **type-guards.ts**: Runtime type validation functions for safe type assertions

### **Feature Exports**

- **index.ts**: Feature barrel exports - re-export public APIs from the feature
  (services, types, schemas)

**Note**: HTTP schemas are versioned in `v1/` folder for API evolution. Domain
schemas and business logic remain at feature root since they're
version-agnostic. Services handle granular authorization using RBAC helpers,
while repositories execute pre-filtered secure queries.

## Feature Creation Workflow

### Plan → Scaffold → Schema → Types → Repo → Service → Controller → Errors → Tests → Docs

1. **Plan**: Define feature requirements and API endpoints
2. **Scaffold**: Generate versioned folders (`v1/`) + shared files
3. **Schema**: Create TypeBox validation schemas in version folder (HTTP layer)
   and domain schemas at feature root
4. **Types**: Define domain TypeScript types in `.type.ts` export barrel
5. **Repository**: Set up Prisma models and database access layer
6. **Service**: Implement business logic and coordinate repositories
7. **Controller**: Create HTTP handlers calling services
8. **Errors**: Add custom error handling
9. **Tests**: Write unit and integration tests
10. **Docs**: Document API endpoints and usage

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
