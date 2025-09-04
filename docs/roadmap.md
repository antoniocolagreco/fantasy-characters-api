# Fantasy Characters API — Development Roadmap (v1)

This roadmap is structured as independent, junior-friendly tasks with clear
milestones. It follows the project’s documented principles and uses the same
checkbox style as the original.

Notes

- Durations are estimates for a single developer, sequential work
- Dependencies indicate the minimal prior milestones required
- All work must pass Quality Gates before a milestone can be marked complete

## Overall Estimate

- Total effort (sequential, 1 developer): 60–90 working days (~12–18 weeks)

### Assumptions

- Solo developer, 5-day weeks; scope limited to this roadmap and linked docs
- PostgreSQL via local Docker; no cloud infra or production orchestration
- CI/CD via GitHub Actions as specified in docs
- Test coverage enforced globally at ~80%; per-file dips allowed with rationale
- OAuth is optional and behind a feature flag; TLS handled outside this repo

### Milestone completion gates

- [ ] Zero type-check errors (TypeScript strict)
- [ ] Zero lint errors (ESLint) and formatted (Prettier)
- [ ] All tests pass with ≥ 80% global coverage (aim for ≥ 80% per file)

---

## 1. Project Setup and Tooling (Dependencies: none)

Duration: 1–2 days

- [x] 1.01 Initialize repository with proper Git configuration
- [x] 1.02 Create base directory structure following
      [project-structure.md](./project-structure.md)
- [x] 1.03 Set up package.json with dependencies from
      [technology-stack.md](./technology-stack.md)
- [x] 1.04 Configure TypeScript (strict) and path aliases
- [x] 1.05 Configure ESLint and Prettier per [code-style.md](./code-style.md)
- [x] 1.06 Add Vitest setup for unit/integration testing
- [x] 1.07 Implement environment configuration loader with validation
      ([secrets-and-config.md](./secrets-and-config.md))
- [x] 1.08 Add package scripts from [package-scripts.md](./package-scripts.md)
      (dev, build, test, lint, type-check, docker)
- [x] 1.09 Document local setup in README.md

---

## 2. Database & Prisma (Dependencies: M1)

Duration: 3–5 days

- [x] 2.01 Add Docker configuration for PostgreSQL (docker-compose + Dockerfile)
- [x] 2.02 Initialize Prisma with base configuration
- [x] 2.03 Implement all Prisma models and enums from
      [data-models.md](./data-models.md) (including indexes)
- [x] 2.04 Apply initial migration and commit migrations
- [x] 2.05 Implement shared cursor pagination/query helpers in shared
      ([query-templates.md](./query-templates.md))
- [x] 2.06 Create seed data scripts covering all models
- [x] 2.07 Create test data generation utilities
- [x] 2.08 Document DB workflow (migrations, generate, reset) in
      docs/[migrations-and-rollback.md](./migrations-and-rollback.md) notes

---

## 3. Security Baseline (Dependencies: M1, M2)

Duration: 2–3 days

- [x] 3.01 Register Helmet security headers ([security.md](./security.md))
- [x] 3.02 Configure CORS according to [cors.md](./cors.md) (explicit allowlist)
- [x] 3.03 Configure global rate limiting
      ([rate-limiting.md](./rate-limiting.md))
- [x] 3.04 Create request validation pipeline with TypeBox + Ajv
      ([development-principles.md](./development-principles.md))
- [x] 3.05 Add input sanitization utilities (strings + HTML only where needed)
- [ ] 3.06 Write security tests (80%+ coverage target) ✅

---

## 4. Core API Platform (Fastify) (Dependencies: M1–M3)

Duration: 4–6 days

- [x] 4.01 Initialize Fastify server with TypeBox type provider
- [x] 4.02 Register global plugins: logging (Pino), error handler plugin
      ([error-handling.md](./error-handling.md))
- [x] 4.03 Register Swagger/OpenAPI plugin and expose /docs and /docs/json (see
      [documentation.md](./documentation.md))
- [x] 4.04 Enable response compression (gzip/brotli)
- [x] 4.05 Setup multipart file upload handling
- [x] 4.06 Add health check endpoint at /api/health (align with
      [endpoints.md](./endpoints.md) and CI)
- [x] 4.07 Implement graceful shutdown
- [x] 4.08 Add TypeBox base response schemas
      ([response-templates.md](./response-templates.md))
- [x] 4.09 Add pagination schemas and query helpers
      ([query-templates.md](./query-templates.md))
- [x] 4.10 Setup centralized error handling
      ([error-handling.md](./error-handling.md))
- [x] 4.11 Implement UUID v7 utility in shared/utils
- [x] 4.12 Configure base logging with Pino (redaction, requestId)
- [ ] 4.13 Write server integration tests (≥ 80% coverage) ✅

---

## 5. CI/CD & Deployment (Dependencies: M1–M4)

Duration: 3–5 days

- [ ] 5.01 Create multi-stage production Dockerfile and image
- [ ] 5.02 Add Docker Compose for app + database for local integration
- [ ] 5.03 Implement container health/readiness checks hitting /api/health
- [ ] 5.04 Add GitHub Actions workflow per [ci-cd.md](./ci-cd.md) (lint,
      type-check, tests with coverage, OpenAPI validate, Docker build, smoke
      tests)
- [ ] 5.05 Validate environment via config loader; commit .env.example
      ([secrets-and-config.md](./secrets-and-config.md))
- [ ] 5.06 Add deployment smoke tests (start container, hit /api/health and one
      read endpoint when available)
- [ ] 5.07 Document deploy assumptions (HTTPS/TLS via reverse proxy)

---

## 6. User Management (Dependencies: M1–M5)

Duration: 4–6 days

- [ ] 6.01 Scaffold user feature structure
- [ ] 6.02 Create User and RefreshToken schemas (types derived from schemas)
- [ ] 6.03 Implement User repository layer
- [ ] 6.04 Implement RefreshToken repository layer
- [ ] 6.05 Create user service layer
- [ ] 6.06 Implement `GET /api/v1/users` (pagination, filtering)
- [ ] 6.07 Implement `GET /api/v1/users/:id`
- [ ] 6.08 Implement `GET /api/v1/users/stats`
- [ ] 6.09 Implement `POST /api/v1/users`
- [ ] 6.10 Implement `PUT /api/v1/users/:id`
- [ ] 6.11 Implement `DELETE /api/v1/users/:id`
- [ ] 6.12 Implement POST /api/v1/users/:id/ban
- [ ] 6.13 Add error handling for all user operations
- [ ] 6.14 Write user tests (≥ 80% coverage)
- [ ] 6.15 Update OpenAPI docs for all user endpoints

---

## 7. Authentication System (Dependencies: M1–M6)

Duration: 4–5 days

- [ ] 7.01 Scaffold authentication feature structure
- [ ] 7.02 Create authentication schemas (types derived from schemas)
- [ ] 7.03 Implement JWT token system ([authentication.md](./authentication.md))
- [ ] 7.04 Implement password hashing with Argon2
- [ ] 7.05 Setup JWT middleware for route protection
- [ ] 7.06 Implement authentication service layer
- [ ] 7.07 Implement `POST /api/v1/auth/register`
- [ ] 7.08 Implement `POST /api/v1/auth/login`
- [ ] 7.09 Implement `POST /api/v1/auth/logout`
- [ ] 7.10 Implement `POST /api/v1/auth/refresh` (rotation)
- [ ] 7.11 Implement `GET /api/v1/auth/profile`
- [ ] 7.12 Implement `PUT /api/v1/auth/profile`
- [ ] 7.13 Implement PUT /api/v1/auth/password
- [ ] 7.14 Add error handling for all auth operations
- [ ] 7.15 Write auth tests (≥ 80% coverage)
- [ ] 7.16 Update OpenAPI docs for all auth endpoints
- [ ] 7.17 Gate OAuth providers behind OAUTH_ENABLED flag and env vars
      (optional)

---

## 8 🛂 RBAC Authorization (Dependencies: M1-M7)

Duration: 2-3 days

Cross-links: [feature-dependencies.md](./feature-dependencies.md),
[authorization.md](./authorization.md)

- [x] 8.01 Implement RBAC: policy function, ownership resolver, and preHandler
      per [authorization.md](./authorization.md)
- [ ] 8.02 Apply RBAC checks in routes (preHandler)
- [ ] 8.03 Enforce RBAC again in services (defense in depth)
- [ ] 8.04 Write comprehensive RBAC tests (80%+ coverage) (policy unit tests
      exist; middleware/route tests pending)
- [ ] 8.05 Update authorization docs and note protected endpoints in
      [endpoints.md](./endpoints.md)

---

## 9 🔑 OAuth2 Integration (Dependencies: M1-M7)

Duration: 3-5 days

- [ ] 9.01 Scaffold OAuth2 feature structure
- [ ] 9.02 Create OAuth2 schemas (types derived from schemas)
- [ ] 9.03 Implement OAuth2 service layer
- [ ] 9.04 Implement `GET /api/v1/auth/oauth/:provider/start` - Redirect to
      provider
- [ ] 9.05 Implement `GET /api/v1/auth/oauth/:provider/callback` - Handle
      callback
- [ ] 9.06 Implement `POST /api/v1/auth/oauth/link` - Link provider to account
- [ ] 9.07 Implement `POST /api/v1/auth/oauth/unlink` - Unlink provider
- [ ] 9.08 Implement error handling for OAuth operations
- [ ] 9.09 Write comprehensive OAuth tests (80%+ coverage)
- [ ] 9.10 Update OpenAPI docs for all OAuth endpoints (schemas, params,
      responses)

---

## 10 🖼️ Image Processing (Dependencies: M1-M8)

Duration: 5-7 days

- [ ] 10.01 Scaffold image management feature structure
- [ ] 10.02 Create Image schemas (types derived from schemas)
- [ ] 10.03 Implement Image repository layer
- [ ] 10.04 Create image processing service with Sharp
- [ ] 10.05 Implement WebP conversion pipeline
- [ ] 10.06 Create image validation and security
- [ ] 10.07 Implement `GET /api/v1/images` - List image metadata
- [ ] 10.08 Implement `GET /api/v1/images/:id` - Get image metadata by ID
- [ ] 10.09 Implement `GET /api/v1/images/:id/file` - Get image binary (WebP)
- [ ] 10.10 Implement `GET /api/v1/images/stats` - Image statistics
- [ ] 10.11 Implement `POST /api/v1/images` - Upload new image
- [ ] 10.12 Implement `PUT /api/v1/images/:id` - Update image metadata or
      replace file
- [ ] 10.13 Implement `DELETE /api/v1/images/:id` - Delete image
- [ ] 10.14 Implement error handling for all image operations
- [ ] 10.15 Write comprehensive tests (80%+ coverage)
- [ ] 10.16 Update OpenAPI docs for all image endpoints (schemas, params,
      responses)

---

## 11 🏷️ Tags System (Dependencies: M1-M10)

Duration: 2-3 days

- [ ] 11.01 Scaffold tags feature structure
- [ ] 11.02 Create Tag schemas (types derived from schemas)
- [ ] 11.03 Implement Tag repository layer
- [ ] 11.04 Create tag service layer
- [ ] 11.05 Implement `GET /api/v1/tags` - List tags
- [ ] 11.06 Implement `GET /api/v1/tags/:id` - Get tag by ID
- [ ] 11.07 Implement `GET /api/v1/tags/stats` - Tag statistics
- [ ] 11.08 Implement `POST /api/v1/tags` - Create tag
- [ ] 11.09 Implement `PUT /api/v1/tags/:id` - Update tag
- [ ] 11.10 Implement `DELETE /api/v1/tags/:id` - Delete tag
- [ ] 11.11 Implement error handling for all tag operations
- [ ] 11.12 Write comprehensive tests (80%+ coverage)
- [ ] 11.13 Update OpenAPI docs for all tag endpoints (schemas, params,
      responses)

---

## 12 ⚡ Skills System (Dependencies: M1-M11)

Duration: 2-3 days

- [ ] 12.01 Scaffold skills feature structure
- [ ] 12.02 Create Skill schemas (types derived from schemas)
- [ ] 12.03 Implement Skill repository layer
- [ ] 12.04 Create skill service layer
- [ ] 12.05 Implement `GET /api/v1/skills` - List skills
- [ ] 12.06 Implement `GET /api/v1/skills/:id` - Get skill by ID
- [ ] 12.07 Implement `GET /api/v1/skills/stats` - Skill statistics
- [ ] 12.08 Implement `POST /api/v1/skills` - Create skill
- [ ] 12.09 Implement `PUT /api/v1/skills/:id` - Update skill
- [ ] 12.10 Implement `DELETE /api/v1/skills/:id` - Delete skill
- [ ] 12.11 Implement error handling for all skill operations
- [ ] 12.12 Write comprehensive tests (80%+ coverage)
- [ ] 12.13 Update OpenAPI docs for all skill endpoints (schemas, params,
      responses)

---

## 13 🎯 Perks System (Dependencies: M1-M12)

Duration: 2-3 days

- [ ] 13.01 Scaffold perks feature structure
- [ ] 13.02 Create Perk schemas (types derived from schemas)
- [ ] 13.03 Implement Perk repository layer
- [ ] 13.04 Create perk service layer
- [ ] 13.05 Implement `GET /api/v1/perks` - List perks
- [ ] 13.06 Implement `GET /api/v1/perks/:id` - Get perk by ID
- [ ] 13.07 Implement `GET /api/v1/perks/stats` - Perk statistics
- [ ] 13.08 Implement `POST /api/v1/perks` - Create perk
- [ ] 13.09 Implement `PUT /api/v1/perks/:id` - Update perk
- [ ] 13.10 Implement `DELETE /api/v1/perks/:id` - Delete perk
- [ ] 13.11 Implement error handling for all perk operations
- [ ] 13.12 Write comprehensive tests (80%+ coverage)
- [ ] 13.13 Update OpenAPI docs for all perk endpoints (schemas, params,
      responses)

---

## 14 🧬 Races System (Dependencies: M1-M13)

Duration: 2-3 days

- [ ] 14.01 Scaffold races feature structure
- [ ] 14.02 Create Race schemas (types derived from schemas)
- [ ] 14.03 Implement Race repository layer
- [ ] 14.04 Create race service layer
- [ ] 14.05 Implement `GET /api/v1/races` - List races
- [ ] 14.06 Implement `GET /api/v1/races/:id` - Get race by ID
- [ ] 14.07 Implement `GET /api/v1/races/stats` - Race statistics
- [ ] 14.08 Implement `POST /api/v1/races` - Create race
- [ ] 14.09 Implement `PUT /api/v1/races/:id` - Update race
- [ ] 14.10 Implement `DELETE /api/v1/races/:id` - Delete race
- [ ] 14.11 Implement error handling for all race operations
- [ ] 14.12 Write comprehensive tests (80%+ coverage)
- [ ] 14.13 Update OpenAPI docs for all race endpoints (schemas, params,
      responses)

---

## 15 🎭 Archetypes System (Dependencies: M1-M14)

Duration: 2-3 days

- [ ] 15.01 Scaffold archetypes feature structure
- [ ] 15.02 Create Archetype schemas (types derived from schemas)
- [ ] 15.03 Implement Archetype repository layer
- [ ] 15.04 Create archetype service layer
- [ ] 15.05 Implement `GET /api/v1/archetypes` - List archetypes
- [ ] 15.06 Implement `GET /api/v1/archetypes/:id` - Get archetype by ID
- [ ] 15.07 Implement `GET /api/v1/archetypes/stats` - Archetype statistics
- [ ] 15.08 Implement `POST /api/v1/archetypes` - Create archetype
- [ ] 15.09 Implement `PUT /api/v1/archetypes/:id` - Update archetype
- [ ] 15.10 Implement `DELETE /api/v1/archetypes/:id` - Delete archetype
- [ ] 15.11 Implement error handling for all archetype operations
- [ ] 15.12 Write comprehensive tests (80%+ coverage)
- [ ] 15.13 Update OpenAPI docs for all archetype endpoints (schemas, params,
      responses)

---

## 16 🗡️ Items System (Dependencies: M1-M15)

Duration: 4-6 days

- [ ] 16.01 Scaffold items feature structure
- [ ] 16.02 Create Item schemas (types derived from schemas)
- [ ] 16.03 Implement Item repository layer
- [ ] 16.04 Create item service layer
- [ ] 16.05 Implement `GET /api/v1/items` - List items
- [ ] 16.06 Implement `GET /api/v1/items/:id` - Get item by ID
- [ ] 16.07 Implement `GET /api/v1/items/stats` - Item statistics
- [ ] 16.08 Implement `POST /api/v1/items` - Create item
- [ ] 16.09 Implement `PUT /api/v1/items/:id` - Update item
- [ ] 16.10 Implement `DELETE /api/v1/items/:id` - Delete item
- [ ] 16.11 Implement error handling for all item operations
- [ ] 16.12 Write comprehensive tests (80%+ coverage)
- [ ] 16.13 Update OpenAPI docs for all item endpoints (schemas, params,
      responses)

---

## 17 👥 Characters Management (Dependencies: M1-M16)

Duration: 5-7 days

- [ ] 17.01 Scaffold characters feature structure
- [ ] 17.02 Create Character schemas (types derived from schemas)
- [ ] 17.03 Implement Character repository layer
- [ ] 17.04 Create character service layer (prepare for derived stats later)
- [ ] 17.05 Implement `GET /api/v1/characters` - List characters
- [ ] 17.06 Implement `GET /api/v1/characters/:id` - Get character by ID
- [ ] 17.07 Implement `GET /api/v1/characters/stats` - Character statistics
- [ ] 17.08 Implement `POST /api/v1/characters` - Create character
- [ ] 17.09 Implement `PUT /api/v1/characters/:id` - Update character
- [ ] 17.10 Implement `DELETE /api/v1/characters/:id` - Delete character
- [ ] 17.11 Implement error handling for all character operations
- [ ] 17.12 Write comprehensive tests (80%+ coverage)
- [ ] 17.13 Update OpenAPI docs for all character endpoints (schemas, params,
      responses)

---

## 18 ⚔️ Equipment System (Dependencies: M1-M17)

Duration: 4-6 days

- [ ] 18.01 Scaffold equipment feature structure
- [ ] 18.02 Create Equipment schemas (types derived from schemas)
- [ ] 18.03 Implement Equipment repository layer
- [ ] 18.04 Create equipment service layer with slot validation
- [ ] 18.05 Implement `GET /api/v1/characters/:id/equipment` - Get character
      equipment
- [ ] 18.06 Implement `PUT /api/v1/characters/:id/equipment` - Update character
      equipment
- [ ] 18.07 Implement `GET /api/v1/equipment/stats` - Equipment statistics
- [ ] 18.08 Implement error handling for all equipment operations
- [ ] 18.09 Write comprehensive tests (80%+ coverage)
- [ ] 18.10 Update OpenAPI docs for all equipment endpoints (schemas, params,
      responses)

---

## 19 📊 Caching (Dependencies: M1-M18)

Duration: 2-3 days

- [ ] 19.01 Implement ETag generation for cacheable responses following
      [caching.md](./caching.md) (exclude auth/non-cacheable endpoints)
- [ ] 19.02 Create Cache-Control header management
- [ ] 19.03 Add conditional request handling
- [ ] 19.04 Implement cache invalidation strategies
- [ ] 19.05 Write comprehensive caching tests (80%+ coverage)
- [ ] 19.06 Document caching strategy

---

## 📋 Development Guidelines

### Mandatory Workflow for Each Feature

1. **Scaffold** → Create feature directory structure
2. **Schema** → Create TypeBox validation schemas (types derived automatically)
3. **Repository** → Set up Prisma models and database access
4. **Service** → Implement business logic
5. **Controller** → Create HTTP handlers
6. **Errors** → Add custom error handling
7. **Tests** → Write unit and integration tests (minimum 80% coverage)
8. **Documentation** → Update API docs and guides

### Quality Gates

- [ ] All TypeScript types are strict (no `any` types)
- [ ] All endpoints have comprehensive TypeBox schemas
- [ ] Global coverage ≥ 80% (CI enforces); critical services aim for 80%+
- [ ] All endpoints have integration tests
- [ ] All features have proper error handling
- [ ] OpenAPI schema validated in CI
- [ ] RBAC checks applied in routes and services
- [ ] All API changes are documented
- [ ] All security requirements are met
- [ ] All performance requirements are met
