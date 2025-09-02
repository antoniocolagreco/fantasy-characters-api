# AI Code Generation

## Complete Directory Structure with Versioning

```typescript
src/
├── features/                                # Feature-based modules
│   ├── feature-name/
│   │   ├── v1/                              # Version 1 API
│   │   │   ├── feature-name.controller.ts   # v1 HTTP handling
│   │   │   ├── feature-name.schema.ts       # v1 validation schemas
│   │   │   ├── feature-name.route.ts        # v1 route definitions
│   │   │   └── feature-name.adapter.ts      # Domain → v1 API conversion
│   │   ├── v2/                              # Version 2 API
│   │   │   ├── feature-name.controller.ts   # v2 HTTP handling
│   │   │   ├── feature-name.schema.ts       # v2 validation schemas
│   │   │   ├── feature-name.route.ts        # v2 route definitions
│   │   │   └── feature-name.adapter.ts      # Domain → v2 API conversion
│   │   ├── feature-name.service.ts          # Shared business logic (version-agnostic)
│   │   ├── feature-name.repository.ts       # Database access layer
│   │   ├── feature-name.types.ts            # Domain types
│   │   └── index.ts                         # Barrel exports
│   └── ...                                  # Other features
├── infrastructure/                          # Technical layer
│   ├── database/
│   │   ├── prisma.service.ts
│   │   └── connection.ts
│   ├── cache/
│   │   └── redis.service.ts
│   ├── logging/
│   │   ├── logger.service.ts
│   │   └── log-transport.ts
│   └── middleware/                          # App-specific middleware
├── shared/                                  # Generic, reusable mini-toolbox
│   ├── utils/                               # Pure helper functions
│   ├── errors/                              # Custom error classes
│   ├── types/                               # Shared TypeScript types
│   ├── constants/                           # Shared constants
│   └── plugins/                             # Generic wrappers only
└── tests/
    ├── features/
    └── shared/
```

## Key Rules

- Use `kebab-case` for files/folders, include feature name in files
- Only repositories access Prisma directly
- Services coordinate business logic and call repositories
- Controllers don't build error JSON
- Keep files <500 lines
- shared/ contains only generic, reusable utilities

## Core File Responsibilities

- **feature-name.route.ts**: Register endpoints, attach schemas
- **feature-name.schema.ts**: TypeBox validation schemas, export TS types  
- **feature-name.controller.ts**: HTTP → service calls, no DB access
- **feature-name.service.ts**: Business logic, coordinates repositories
- **feature-name.repository.ts**: Database access layer (Prisma operations)
- **feature-name.adapter.ts**: Transform domain models to API responses
- **feature-name.types.ts**: Domain TypeScript types

## Feature Creation Workflow

### Plan → Scaffold → Schema → Types → Repo → Service → Controller → Errors → Tests → Docs

1. **Plan**: Define feature requirements and API endpoints
2. **Scaffold**: Generate versioned folders (`v1/`, `v2/`) + shared files
3. **Schema**: Create TypeBox validation schemas in each version
4. **Types**: Define domain TypeScript types
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

- `feature-name.service.list.ts` (list/search operations)
- `feature-name.service.get.ts` (read by ID)
- `feature-name.service.post.ts` (create operations)
- `feature-name.service.put.ts` (update operations)
- `feature-name.service.delete.ts` (delete operations)

**Repositories**: Split by entity operation

- `feature-name.repository.query.ts` (complex queries)
- `feature-name.repository.mutation.ts` (create/update/delete)
