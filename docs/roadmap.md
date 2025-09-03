# Fantasy Characters API - Development Roadmap

## Overall Estimate

- Total effort (sequential, 1 developer): 57–85 working days (~11–17 weeks)
- Ranges include a small buffer for context switching and routine refactors

### Assumptions

- Solo developer, 5-day work weeks; no holidays or external blockers
- Scope is exactly what’s in this roadmap and linked docs (no new features
  mid-stream)
- Local Docker for PostgreSQL; no cloud infra or production orchestration work
- CI/CD uses GitHub Actions as outlined; no custom runners or compliance gates
- Test coverage enforced globally at ~80% via CI; per-file dips allowed when
  justified
- OAuth is optional and guarded by feature flag; TLS handled by a reverse proxy
  outside this repo
- No heavy analytics/observability beyond what’s described in docs

Testing and documentation are mandatory before any feature can be considered
complete (target 80%+ global coverage with CI thresholds; aim for high per-file
coverage without blocking delivery).

### Milestone completation gates

- Zero type check errors or warnings.
- Zero linting errors or warnings.
- All tests pass with a minimum 80% coverage per file.

### Note

- Update the checkboxes tasks as you complete each one.

---

## 1 🏗️ Project Setup and Infrastructure

Duration: 1-2 days

- [x] 1.01 Initialize repository with proper Git configuration
- [x] 1.02 Create base directory structure following
      [project-structure.md](./project-structure.md)
- [x] 1.03 Setup package.json with all required dependencies from
      [technology-stack.md](./technology-stack.md)
- [x] 1.04 Configure TypeScript with strict settings and path aliases
- [x] 1.05 Setup ESLint and Prettier with project standards from
      [code-style.md](./code-style.md)
- [x] 1.06 Set up Vitest for unit and integration testing
- [x] 1.07 Create environment configuration system with validation
- [x] 1.08 Document setup process in README.md
- [x] 1.09 Add package scripts from [package-scripts.md](./package-scripts.md)
      (dev, build, test, lint, type-check, docker)

---

## 2 🚢 Docker and Database Setup (Dependencies: M1)

Duration: 4-6 days

- [x] 2.01 Create Docker configuration for PostgreSQL database
- [x] 2.02 Setup Docker Compose (database-only) for local development
- [x] 2.03 Initialize Prisma ORM with base configuration
- [x] 2.04 Implement all Prisma models from [data-models.md](./data-models.md)
- [x] 2.05 Create database migration system setup
- [x] 2.06 Validate DATABASE_URL and Prisma client configuration; document
      `.env(.example)` per [secrets-and-config.md](./secrets-and-config.md)
- [x] 2.07 If needed, use `connection_limit` in the PostgreSQL connection
      string; note PgBouncer as a future option (no per-client min/timeout in
      Prisma)
- [x] 2.08 Apply indexes exactly as specified in
      [data-models.md](./data-models.md) (no generic slug/type indexes)
- [x] 2.09 Ensure composite indexes support cursor pagination stability
      (createdAt/level with id tie-breaker) as per models doc
- [x] 2.10 Wire Prisma migrate/dev workflow and commit migrations; add seed
      scaffolding
- [x] 2.11 Implement and test shared cursor pagination/query helpers in `common`
      (see [query-templates.md](./query-templates.md))
- [x] 2.12 Create comprehensive seed data scripts for all models
- [x] 2.13 Setup test data generation utilities
- [x] 2.14 Document database setup procedures

---

## 3 🔒 Security & Authorization Foundation (Dependencies: M1, M2)

Duration: 4-6 days

- [ ] 3.01 Implement JWT token system following
      [authentication.md](./authentication.md)
- [ ] 3.02 Implement password hashing with Argon2
- [ ] 3.03 Setup JWT middleware for route protection
- [ ] 3.04 Configure Helmet security headers
- [ ] 3.05 Setup CORS configuration following [cors.md](./cors.md)
- [ ] 3.06 Implement rate limiting system following
      [rate-limiting.md](./rate-limiting.md)
- [ ] 3.07 Create input sanitization middleware (use isomorphic-dompurify for
      HTML fields only; for plain strings prefer schema validation +
      normalization; avoid destructive sanitization)
- [ ] 3.08 Setup request validation pipeline
- [ ] 3.09 Implement RBAC: policy function, ownership resolver, and preHandler
      per [authorization.md](./authorization.md)
- [ ] 3.10 Enforce RBAC again in services (defense in depth) and add tests
- [ ] 3.11 Write comprehensive security and authorization tests (80%+ coverage
      target)

---

## 4 🌐 Core API Infrastructure (Dependencies: M1, M2, M3)

Duration: 4-6 days

- [ ] 4.01 Initialize Fastify server with plugins
- [ ] 4.02 Configure OpenAPI/Swagger documentation
- [ ] 4.03 Expose /docs and /docs/json with OpenAPI generated from TypeBox
      schemas
- [ ] 4.04 Setup multipart file upload handling
- [ ] 4.05 Create health check endpoint at `/api/health` (align with CI and
      [endpoints.md](./endpoints.md))
- [ ] 4.06 Implement graceful shutdown
- [ ] 4.07 Create TypeBox base response schemas from
      [response-templates.md](./response-templates.md)
- [ ] 4.08 Implement pagination schemas and helpers from
      [query-templates.md](./query-templates.md)
- [ ] 4.09 Enable response compression (gzip/brotli)
- [ ] 4.10 Setup error handling following
      [error-handling.md](./error-handling.md)
- [ ] 4.11 Implement UUID v7 generation utility
- [ ] 4.12 Create base logging configuration with Pino
- [ ] 4.13 Write server integration tests (80%+ coverage)

---

## 5 🚀 CI/CD & Deployment (Dependencies: M1, M2, M3, M4)

Duration: 3-5 days

- [ ] 5.01 Create multi-stage production Dockerfile and image
- [ ] 5.02 Add Docker Compose for app + database for local test/integration
      (production orchestration is out of scope)
- [ ] 5.03 Implement container health/readiness checks hitting `/api/health`
- [ ] 5.04 Add GitHub Actions workflow per [ci-cd.md](./ci-cd.md): lint,
      type-check, tests with coverage, OpenAPI validate, Docker build, smoke
      tests
- [ ] 5.05 Validate environment via config loader (see
      [secrets-and-config.md](./secrets-and-config.md)); commit `.env.example`
- [ ] 5.06 Add deployment smoke tests stage (start container, hit `/api/health`
      and one read endpoint like `GET /api/v1/tags?limit=1` when available)
- [ ] 5.07 Document deploy assumptions (HTTPS/TLS via reverse proxy;
      certificates managed outside app)

---

## 6 👤 User Management (Dependencies: M1-M5)

Duration: 4-6 days

- [ ] 6.01 Scaffold user management feature structure
- [ ] 6.02 Create User and RefreshToken schemas (types derived from schemas)
- [ ] 6.03 Implement User repository layer
- [ ] 6.04 Implement RefreshToken repository layer
- [ ] 6.05 Create user management service layer
- [ ] 6.06 Implement `GET /api/v1/users` - List users (pagination, filtering)
- [ ] 6.07 Implement `GET /api/v1/users/:id` - Get user by ID
- [ ] 6.08 Implement `GET /api/v1/users/stats` - User statistics
- [ ] 6.09 Implement `POST /api/v1/users` - Create user (admin flows)
- [ ] 6.10 Implement `PUT /api/v1/users/:id` - Update user
- [ ] 6.11 Implement `DELETE /api/v1/users/:id` - Delete user
- [ ] 6.12 Implement `POST /api/v1/users/:id/ban` - Ban/Unban user
- [ ] 6.13 Implement error handling for all user operations
- [ ] 6.14 Write comprehensive user tests (80%+ coverage)
- [ ] 6.15 Update OpenAPI docs for all user endpoints (schemas, params,
      responses)

---

## 7 🔐 Authentication System (Dependencies: M1-M6)

Duration: 4-5 days

- [ ] 7.01 Scaffold authentication feature structure
- [ ] 7.02 Create authentication schemas (types derived from schemas)
- [ ] 7.03 Implement authentication service layer
- [ ] 7.04 Implement `POST /api/v1/auth/register` - Register new user
- [ ] 7.05 Implement `POST /api/v1/auth/login` - User login
- [ ] 7.06 Implement `POST /api/v1/auth/logout` - User logout
- [ ] 7.07 Implement `POST /api/v1/auth/refresh` - Refresh JWT token with
      rotation (move from M3)
- [ ] 7.08 Implement `GET /api/v1/auth/profile` - Get current user profile
- [ ] 7.09 Implement `PUT /api/v1/auth/profile` - Update user profile
- [ ] 7.10 Implement `PUT /api/v1/auth/password` - Change password
- [ ] 7.11 Implement error handling for all auth operations
- [ ] 7.12 Write comprehensive auth tests (80%+ coverage)
- [ ] 7.13 Update OpenAPI docs for all authentication endpoints (schemas,
      params, responses)
  - [ ] 7.14 Gate OAuth providers behind `OAUTH_ENABLED` flag and env vars (see
        [authentication.md](./authentication.md)); initial providers: GitHub,
        Google

---

## 8 🔑 OAuth2 Integration (Dependencies: M1-M7)

Duration: 3-5 days

- [ ] 8.01 Scaffold OAuth2 feature structure
- [ ] 8.02 Create OAuth2 schemas (types derived from schemas)
- [ ] 8.03 Implement OAuth2 service layer
- [ ] 8.04 Implement `GET /api/v1/auth/oauth/:provider/start` - Redirect to
      provider
- [ ] 8.05 Implement `GET /api/v1/auth/oauth/:provider/callback` - Handle
      callback
- [ ] 8.06 Implement `POST /api/v1/auth/oauth/link` - Link provider to account
- [ ] 8.07 Implement `POST /api/v1/auth/oauth/unlink` - Unlink provider
- [ ] 8.08 Implement error handling for OAuth operations
- [ ] 8.09 Write comprehensive OAuth tests (80%+ coverage)
- [ ] 8.10 Update OpenAPI docs for all OAuth endpoints (schemas, params,
      responses)

---

## 9 🖼️ Image Processing (Dependencies: M1-M8)

Duration: 5-7 days

- [ ] 9.01 Scaffold image management feature structure
- [ ] 9.02 Create Image schemas (types derived from schemas)
- [ ] 9.03 Implement Image repository layer
- [ ] 9.04 Create image processing service with Sharp
- [ ] 9.05 Implement WebP conversion pipeline
- [ ] 9.06 Create image validation and security
- [ ] 9.07 Implement `GET /api/v1/images` - List image metadata
- [ ] 9.08 Implement `GET /api/v1/images/:id` - Get image metadata by ID
- [ ] 9.09 Implement `GET /api/v1/images/:id/file` - Get image binary (WebP)
- [ ] 9.10 Implement `GET /api/v1/images/stats` - Image statistics
- [ ] 9.11 Implement `POST /api/v1/images` - Upload new image
- [ ] 9.12 Implement `PUT /api/v1/images/:id` - Update image metadata or replace
      file
- [ ] 9.13 Implement `DELETE /api/v1/images/:id` - Delete image
- [ ] 9.14 Implement error handling for all image operations
- [ ] 9.15 Write comprehensive tests (80%+ coverage)
- [ ] 9.16 Update OpenAPI docs for all image endpoints (schemas, params,
      responses)

---

## 10 🏷️ Tags System (Dependencies: M1-M9)

Duration: 2-3 days

- [ ] 10.01 Scaffold tags feature structure
- [ ] 10.02 Create Tag schemas (types derived from schemas)
- [ ] 10.03 Implement Tag repository layer
- [ ] 10.04 Create tag service layer
- [ ] 10.05 Implement `GET /api/v1/tags` - List tags
- [ ] 10.06 Implement `GET /api/v1/tags/:id` - Get tag by ID
- [ ] 10.07 Implement `GET /api/v1/tags/stats` - Tag statistics
- [ ] 10.08 Implement `POST /api/v1/tags` - Create tag
- [ ] 10.09 Implement `PUT /api/v1/tags/:id` - Update tag
- [ ] 10.10 Implement `DELETE /api/v1/tags/:id` - Delete tag
- [ ] 10.11 Implement error handling for all tag operations
- [ ] 10.12 Write comprehensive tests (80%+ coverage)
- [ ] 10.13 Update OpenAPI docs for all tag endpoints (schemas, params,
      responses)

---

## 11 ⚡ Skills System (Dependencies: M1-M10)

Duration: 2-3 days

- [ ] 11.01 Scaffold skills feature structure
- [ ] 11.02 Create Skill schemas (types derived from schemas)
- [ ] 11.03 Implement Skill repository layer
- [ ] 11.04 Create skill service layer
- [ ] 11.05 Implement `GET /api/v1/skills` - List skills
- [ ] 11.06 Implement `GET /api/v1/skills/:id` - Get skill by ID
- [ ] 11.07 Implement `GET /api/v1/skills/stats` - Skill statistics
- [ ] 11.08 Implement `POST /api/v1/skills` - Create skill
- [ ] 11.09 Implement `PUT /api/v1/skills/:id` - Update skill
- [ ] 11.10 Implement `DELETE /api/v1/skills/:id` - Delete skill
- [ ] 11.11 Implement error handling for all skill operations
- [ ] 11.12 Write comprehensive tests (80%+ coverage)
- [ ] 11.13 Update OpenAPI docs for all skill endpoints (schemas, params,
      responses)

---

## 12 🎯 Perks System (Dependencies: M1-M11)

Duration: 2-3 days

- [ ] 12.01 Scaffold perks feature structure
- [ ] 12.02 Create Perk schemas (types derived from schemas)
- [ ] 12.03 Implement Perk repository layer
- [ ] 12.04 Create perk service layer
- [ ] 12.05 Implement `GET /api/v1/perks` - List perks
- [ ] 12.06 Implement `GET /api/v1/perks/:id` - Get perk by ID
- [ ] 12.07 Implement `GET /api/v1/perks/stats` - Perk statistics
- [ ] 12.08 Implement `POST /api/v1/perks` - Create perk
- [ ] 12.09 Implement `PUT /api/v1/perks/:id` - Update perk
- [ ] 12.10 Implement `DELETE /api/v1/perks/:id` - Delete perk
- [ ] 12.11 Implement error handling for all perk operations
- [ ] 12.12 Write comprehensive tests (80%+ coverage)
- [ ] 12.13 Update OpenAPI docs for all perk endpoints (schemas, params,
      responses)

---

## 13 🧬 Races System (Dependencies: M1-M12)

Duration: 2-3 days

- [ ] 13.01 Scaffold races feature structure
- [ ] 13.02 Create Race schemas (types derived from schemas)
- [ ] 13.03 Implement Race repository layer
- [ ] 13.04 Create race service layer
- [ ] 13.05 Implement `GET /api/v1/races` - List races
- [ ] 13.06 Implement `GET /api/v1/races/:id` - Get race by ID
- [ ] 13.07 Implement `GET /api/v1/races/stats` - Race statistics
- [ ] 13.08 Implement `POST /api/v1/races` - Create race
- [ ] 13.09 Implement `PUT /api/v1/races/:id` - Update race
- [ ] 13.10 Implement `DELETE /api/v1/races/:id` - Delete race
- [ ] 13.11 Implement error handling for all race operations
- [ ] 13.12 Write comprehensive tests (80%+ coverage)
- [ ] 13.13 Update OpenAPI docs for all race endpoints (schemas, params,
      responses)

---

## 14 🎭 Archetypes System (Dependencies: M1-M13)

Duration: 2-3 days

- [ ] 14.01 Scaffold archetypes feature structure
- [ ] 14.02 Create Archetype schemas (types derived from schemas)
- [ ] 14.03 Implement Archetype repository layer
- [ ] 14.04 Create archetype service layer
- [ ] 14.05 Implement `GET /api/v1/archetypes` - List archetypes
- [ ] 14.06 Implement `GET /api/v1/archetypes/:id` - Get archetype by ID
- [ ] 14.07 Implement `GET /api/v1/archetypes/stats` - Archetype statistics
- [ ] 14.08 Implement `POST /api/v1/archetypes` - Create archetype
- [ ] 14.09 Implement `PUT /api/v1/archetypes/:id` - Update archetype
- [ ] 14.10 Implement `DELETE /api/v1/archetypes/:id` - Delete archetype
- [ ] 14.11 Implement error handling for all archetype operations
- [ ] 14.12 Write comprehensive tests (80%+ coverage)
- [ ] 14.13 Update OpenAPI docs for all archetype endpoints (schemas, params,
      responses)

---

## 15 🗡️ Items System (Dependencies: M1-M14)

Duration: 4-6 days

- [ ] 15.01 Scaffold items feature structure
- [ ] 15.02 Create Item schemas (types derived from schemas)
- [ ] 15.03 Implement Item repository layer
- [ ] 15.04 Create item service layer
- [ ] 15.05 Implement `GET /api/v1/items` - List items
- [ ] 15.06 Implement `GET /api/v1/items/:id` - Get item by ID
- [ ] 15.07 Implement `GET /api/v1/items/stats` - Item statistics
- [ ] 15.08 Implement `POST /api/v1/items` - Create item
- [ ] 15.09 Implement `PUT /api/v1/items/:id` - Update item
- [ ] 15.10 Implement `DELETE /api/v1/items/:id` - Delete item
- [ ] 15.11 Implement error handling for all item operations
- [ ] 15.12 Write comprehensive tests (80%+ coverage)
- [ ] 15.13 Update OpenAPI docs for all item endpoints (schemas, params,
      responses)

---

## 16 👥 Characters Management (Dependencies: M1-M15)

Duration: 5-7 days

- [ ] 16.01 Scaffold characters feature structure
- [ ] 16.02 Create Character schemas (types derived from schemas)
- [ ] 16.03 Implement Character repository layer
- [ ] 16.04 Create character service layer (prepare for derived stats later)
- [ ] 16.05 Implement `GET /api/v1/characters` - List characters
- [ ] 16.06 Implement `GET /api/v1/characters/:id` - Get character by ID
- [ ] 16.07 Implement `GET /api/v1/characters/stats` - Character statistics
- [ ] 16.08 Implement `POST /api/v1/characters` - Create character
- [ ] 16.09 Implement `PUT /api/v1/characters/:id` - Update character
- [ ] 16.10 Implement `DELETE /api/v1/characters/:id` - Delete character
- [ ] 16.11 Implement error handling for all character operations
- [ ] 16.12 Write comprehensive tests (80%+ coverage)
- [ ] 16.13 Update OpenAPI docs for all character endpoints (schemas, params,
      responses)

---

## 17 ⚔️ Equipment System (Dependencies: M1-M16)

Duration: 4-6 days

- [ ] 17.01 Scaffold equipment feature structure
- [ ] 17.02 Create Equipment schemas (types derived from schemas)
- [ ] 17.03 Implement Equipment repository layer
- [ ] 17.04 Create equipment service layer with slot validation
- [ ] 17.05 Implement `GET /api/v1/characters/:id/equipment` - Get character
      equipment
- [ ] 17.06 Implement `PUT /api/v1/characters/:id/equipment` - Update character
      equipment
- [ ] 17.07 Implement `GET /api/v1/equipment/stats` - Equipment statistics
- [ ] 17.08 Implement error handling for all equipment operations
- [ ] 17.09 Write comprehensive tests (80%+ coverage)
- [ ] 17.10 Update OpenAPI docs for all equipment endpoints (schemas, params,
      responses)

---

## 18 📊 Caching (Dependencies: M1-M17)

Duration: 2-3 days

- [ ] 18.01 Implement ETag generation for cacheable responses following
      [caching.md](./caching.md) (exclude auth/non-cacheable endpoints)
- [ ] 18.02 Create Cache-Control header management
- [ ] 18.03 Add conditional request handling
- [ ] 18.04 Implement cache invalidation strategies
- [ ] 18.05 Write comprehensive caching tests (80%+ coverage)
- [ ] 18.06 Document caching strategy

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
