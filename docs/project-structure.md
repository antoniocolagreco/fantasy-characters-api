# Project Structure

## Directory Structure (Feature-Based)

This file is an example of a feature-based directory structure and the project can differ from it.
Every feature should encapsulate all related files, including controllers, services, schemas, and
tests. The folder `shared` contains code that is shared across multiple features, such as utility
functions, middleware, and common types.

IMPORTANT: DO NOT CREATE FILES OR FOLDERS BEFORE THEY ARE NEEDED.

```text
root
├── src/
│   ├── features/                         # All CRUD features / business modules
│   │   ├── featureName/
│   │   │   ├── index.ts                  # Barrel exports for the feature
│   │   │   ├── controller.ts             # HTTP request handling
│   │   │   ├── service.ts                # Business logic and data access
│   │   │   ├── route.ts                  # Fastify route definitions
│   │   │   ├── schema.ts                 # TypeBox/Ajv schemas for validation
│   │   │   └── types.ts                  # Feature-specific TypeScript types
│   │   │
│   │   └── ...                           # Other features
│   │
│   ├── common/                           # Reusable code
│   │   ├── config/                       # Configuration and env
│   │   │   └── index.ts
│   │   ├── constants/                    # Constants and enums
│   │   ├── errors/                       # Error handling
│   │   │   ├── base.error.ts
│   │   │   ├── handlers.ts               # Fastify error handlers
│   │   │   ├── factories.ts              # Error factories
│   │   │   └── classes.ts                # Custom classes
│   │   ├── middleware/                   # Generic middleware
│   │   │   └── index.ts
│   │   ├── utils/                        # General utilities
│   │   └── plugins/                      # Fastify plugins (Swagger, CORS, Health)
│   │
│   ├── infrastructure/                   # Technical layer (DB, cache, etc.)
│   │   ├── database/
│   │   │   ├── prisma.service.ts
│   │   │   ├── connection.ts
│   │   │   └── transaction.ts
│   │   ├── cache/
│   │   │   ├── redis.service.ts
│   │   │   ├── cache.service.ts
│   │   │   └── strategies.ts
│   │   └── logging/                      # Audit/logging
│   │
│   └── tests/                            # General tests
│       ├── features/                     # Feature unit & integration tests
│       │   └── characters/               # Example feature tests
│       │       ├── characters.service.test.ts
│       │       ├── characters.route.test.ts
│       │       └── feature.layer.test.ts
│       ├── common/                       # Shared test utilities
│       │   ├── setup.ts                  # Global test setup (spies, env)
│       │   └── test-helpers.ts           # Helpers (e.g., buildServer)
│       └── infrastructure/               # Infra-level tests/mocks
│           └── prisma.mock.ts            # Prisma mock/factory
│
├── prisma/                               # Prisma schema & migrations
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── vitest.config.ts                      # Test runner config (example)
├── .github/
├── assets/
├── docs/
└── coverage/
```

## Request Flow (Fastify → TypeBox/Ajv → Prisma)

- route.ts: registers endpoints and attaches schemas
- schema.ts: defines TypeBox request/response schemas validated by Ajv
- controller.ts: adapts HTTP to service calls; no DB access
- service.ts: business logic; uses Prisma/infrastructure DB helpers
- global error handler: maps domain errors to HTTP JSON

## File Responsibilities (Glossary)

- route.ts: registers the feature routes; no business logic.
- schema.ts: TypeBox schemas; export TS types via `Static<typeof Schema>`.
- controller.ts: calls the service; does not use Prisma; does not craft error JSON.
- service.ts: business logic and data access; no Fastify types here.
- types.ts: feature-only TypeScript types.
- index.ts: barrel exports; no logic.

## Create a New Feature (Checklist)

1. Create `src/features/<name>/`: `route.ts`, `controller.ts`, `service.ts`, `schema.ts`, `index.ts`.
2. In `schema.ts`, define params/query/body/response with TypeBox; export TS types.
3. In `controller.ts`, call the service; leave error formatting to the global handler.
4. In `service.ts`, implement logic and use Prisma (or a thin repository) for DB.
5. Register the feature’s route plugin in the app bootstrap.
6. Add tests: unit (service with mocked Prisma), integration (routes using `fastify.inject`).

## Conventions

- Always use `kebab-case` for folders and files.
- Route prefix per feature: `/<feature>`; one `route.ts` per feature.
- Barrel `index.ts` files only re-export symbols.
- Keep files small and single-responsibility.

### Splitting Large Files

When a file grows too large (>500 lines), split it by HTTP request/operation.
Example:

```bash
feature.service.list.ts` (list/search)
feature.service.get.ts` (read by id)
feature.service.post.ts` (create)
feature.service.put.ts` (update)
feature.service.delete.ts` (delete)
feature_name.layer_name.operation_name.ts (generic example)
```

## Error Handling Rules

- Services throw typed errors from `common/errors/*`; never throw strings.
- Controllers do not build error JSON; delegate to the global error handler.
- Only map the HTTP status when necessary; don’t duplicate the error format.

## Data Access Rules

- Only services (or repositories in the infra layer) access Prisma.
- Use transactions for multi-step writes (`infrastructure/database/transaction.ts`).
- No DB access in controllers, middleware, or route files.

## Testing Quickstart

- Location: `src/tests/features/<feature>/`.
- Unit: test services with Prisma mocked.
- Integration: use `fastify.inject` on routes; verify success and validation errors.
- Cover one happy path and at least one error/validation case.

## Guardrails for Junior/AI Coders

- Don’t add dependencies or modify Prisma schema/auth without approval.
- Don’t create files/folders “for later”; create only when needed.
- Reuse existing utilities; don’t duplicate helpers.
- Keep PRs small and focused; use semantic commits: feat/fix/docs/test/chore.
- If unsure where logic belongs, put it in the service, not the controller.
