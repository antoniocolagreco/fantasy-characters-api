# Roadmap

Goal: go from initial setup to final optimizations with milestones ordered by dependencies and difficulty. Each milestone lists which other milestones it depends on. Tasks aim to be independent; recommended execution is sequential, but di## M12 — Equipment (character equipment)

Legend: Mx = Milestone x, Tyy = Task number within milestone, Gyy = Test gate

Global rule

- After each implementation task, write or update tests for that scope and run the full test suite before proceeding to the next task. Gates are explicitly listed as [ ] Gxx items.

## M0 — Project base and infrastructure

Depends on: none

- [ ] M0-T01: Initialize repo (pnpm, strict TS, tsx) and folders (`docs`, `src`)
- [ ] M0-T02: Configure Prettier + ESLint per `docs/code-style.md`
- [ ] M0-T03: Minimal Fastify app with TypeBox provider; register base plugins: cors, helmet, sensible, swagger + swagger-ui, type-provider-typebox, etag
  - [ ] M0-T03-A: Services setup
  - [ ] M0-T03-B: Controllers setup
  - [ ] M0-T03-C: Routes registration
  - [ ] M0-T03-D: Tests for app bootstrap
- [ ] M0-T04: Health endpoints `/api/v1/live` and `/api/v1/ready` with TypeBox schemas (`docs/health.md`)
  - [ ] M0-T04-A: Schemas (LiveResponse, ReadyResponse)
  - [ ] M0-T04-B: Controllers (health handlers)
  - [ ] M0-T04-C: Routes registration
  - [ ] M0-T04-D: Tests (unit + integration)
- [ ] M0-T05: Config and secrets — `.env.example`, startup validation (`docs/secrets-and-config.md`)
  - [ ] M0-T05-A: Config loader
  - [ ] M0-T05-B: Validation schemas
  - [ ] M0-T05-C: Tests for config validation
- [ ] M0-T06: Minimal CI/CD (lint, typecheck, test, OpenAPI `/docs/json` validation) (`docs/ci-cd.md`)
  - [ ] M0-T06-A: Lint configuration
  - [ ] M0-T06-B: Typecheck setup
  - [ ] M0-T06-C: Test runner setup
  - [ ] M0-T06-D: OpenAPI validation job
- [ ] M0-T07: Dockerize application — `Dockerfile` and `.dockerignore`
  - [ ] M0-T07-A: Build image configuration
  - [ ] M0-T07-B: Runtime environment wiring
- [ ] M0-T08: Docker Compose — App + Postgres services
  - [ ] M0-T08-A: `docker-compose.yml` with healthchecks
  - [ ] M0-T08-B: `.env` integration for local development
- [ ] M0-T09: Database bootstrap — Prisma init and seed scaffold
  - [ ] M0-T09-A: Prisma init (empty schema allowed in M0)
  - [ ] M0-T09-B: Seed framework + command wired (`pnpm seed`)
  - [ ] M0-T09-C: Seed script placeholder (no-op or minimal defaults)
- [ ] M0-T10: Container smoke test — build and run, verify health endpoints inside container
  - [ ] M0-T10-A: GET `/api/v1/live` returns 200 with JSON
  - [ ] M0-T10-B: GET `/api/v1/ready` returns 200 with JSON (may stub readiness in M0)
  - [ ] M0-T10-C: CI job runs container smoke test
- [ ] M0-T11: Swagger docs baseline online at `/docs`
- [ ] M0-G12: Gate — all checks green (lint, typecheck, tests, container smoke) before M1

## M1 — Errors, logging, minimal observability

Depends on: M0

- [ ] M1-T01: Global error handler + stable error codes (`docs/error-handling.md`)
  - [ ] M1-T01-A: Services (error mapping helpers)
  - [ ] M1-T01-B: Controllers (onError handler)
  - [ ] M1-T01-C: Tests for error mapping
- [ ] M1-T02: Pino logger with redaction and requestId (`docs/observability.md`)
  - [ ] M1-T02-A: Logger configuration
  - [ ] M1-T02-B: Redaction list setup
  - [ ] M1-T02-C: Tests (redaction, requestId)
- [ ] M1-T03: Health handlers hardening
  - [ ] M1-T03-A: Add `Cache-Control: no-store` headers to health endpoints (prevents browser caching)
  - [ ] M1-T03-B: Implement short timeouts
  - [ ] M1-T03-C: Add onError logging
  - [ ] M1-T03-D: Tests (timeouts, headers)
- [ ] M1-T04: Swagger docs updated for M1
- [ ] M1-G05: Gate — tests pass before M2

## M2 — Authentication (JWT) + RBAC baseline

Depends on: M0, M1

- [ ] M2-T01: Auth endpoints (login/refresh/logout): short-lived access + rotating refresh cookie
  - [ ] M2-T01-A: Schemas (login request/response, refresh, logout)
  - [ ] M2-T01-B: Services (issue/rotate tokens)
  - [ ] M2-T01-C: Controllers (auth handlers)
  - [ ] M2-T01-D: Routes registration
  - [ ] M2-T01-E: Tests (happy/expired/invalid flows)
- [ ] M2-T02: Auth hook (Bearer token validation) and token error mapping
  - [ ] M2-T02-A: Create PreHandler function to validate Bearer tokens
  - [ ] M2-T02-B: Map JWT errors to user-friendly error messages
  - [ ] M2-T02-C: Tests for auth validation
- [ ] M2-T03: Role-based access control (RBAC) + policy system, deny-by-default
  - [ ] M2-T03-A: Define permission rules (who can do what)
  - [ ] M2-T03-B: Create PreHandler functions to check user permissions
  - [ ] M2-T03-C: Tests (unit + integration)
- [ ] M2-T04: Stricter rate limits on `/auth/*` (`docs/rate-limiting.md`)
  - [ ] M2-T04-A: Rate limit configuration
  - [ ] M2-T04-B: Tests (429 responses)
- [ ] M2-T05: Swagger docs updated for M2
- [ ] M2-G06: Gate — tests pass before M3

## M3 — Users

Depends on: M2

- [ ] M3-T01: Prisma model + migration (profile fields, roles)
  - [ ] M3-T01-A: Database migration
  - [ ] M3-T01-B: Seed data (admin user)
  - [ ] M3-T01-C: Tests (migration runs successfully)
- [ ] M3-T02: Profile management
  - [ ] M3-T02-A: Schemas (get profile, update profile, change password)
  - [ ] M3-T02-B: Services (profile operations)
  - [ ] M3-T02-C: Controllers (profile handlers)
  - [ ] M3-T02-D: Routes (get/update profile, change password)
  - [ ] M3-T02-E: Tests (unit/integration/E2E)
- [ ] M3-T03: Admin role change; Moderator/Admin ban/unban with policy enforcement
  - [ ] M3-T03-A: Schemas (role change, ban/unban)
  - [ ] M3-T03-B: Services (admin operations)
  - [ ] M3-T03-C: Controllers (admin handlers)
  - [ ] M3-T03-D: Routes (role management, moderation)
  - [ ] M3-T03-E: Tests (policy enforcement)
- [ ] M3-T04: Swagger docs updated for M3 (no inline schemas)
- [ ] M3-G05: Gate — tests pass before M4

## M4 — Images

Depends on: M2, M1

- [ ] M4-T01: Upload functionality
  - [ ] M4-T01-A: Schemas (multipart limits, validation)
  - [ ] M4-T01-B: Services (upload validation)
  - [ ] M4-T01-C: Controllers (upload handlers)
  - [ ] M4-T01-D: Routes (upload endpoints)
  - [ ] M4-T01-E: Tests (validation, limits)
- [ ] M4-T02: Sharp pipeline — always WebP, resize 350x450, strip EXIF (`docs/photos.md`)
  - [ ] M4-T02-A: Services (image processing pipeline)
  - [ ] M4-T02-B: Tests (format conversion, resize, EXIF removal)
- [ ] M4-T03: Storage system for processed images; fast retrieval with caching
  - [ ] M4-T03-A: File storage operations (save/retrieve images)
  - [ ] M4-T03-B: Image retrieval controllers
  - [ ] M4-T03-C: GET routes for serving images
  - [ ] M4-T03-D: Tests (verify cache headers, ETag behavior)
- [ ] M4-T04: Swagger docs updated for M4
- [ ] M4-G05: Gate — tests pass before M5

## M5 — Tags (taxonomy)

Depends on: M1, M2

- [ ] M5-T01: Prisma model + migration
  - [ ] M5-T01-A: Database migration
  - [ ] M5-T01-B: Seed data (sample tags)
  - [ ] M5-T01-C: Tests (migration runs)
- [ ] M5-T02: CRUD with pagination and basic filters
  - [ ] M5-T02-A: Schemas (create, read, update, delete, list)
  - [ ] M5-T02-B: Services (tag operations)
  - [ ] M5-T02-C: Controllers (tag handlers)
  - [ ] M5-T02-D: Routes (CRUD endpoints)
  - [ ] M5-T02-E: Tests (unit/integration)
- [ ] M5-T03: Public GET caching headers; list limits
  - [ ] M5-T03-A: Cache headers implementation
  - [ ] M5-T03-B: Pagination limits
  - [ ] M5-T03-C: Tests (headers, limits)
- [ ] M5-T04: Swagger docs updated for M5
- [ ] M5-G05: Gate — tests pass before M6

## M6 — Skills (taxonomy)

Depends on: M5

- [ ] M6-T01: CRUD implementation
  - [ ] M6-T01-A: Schemas (create, read, update, delete, list)
  - [ ] M6-T01-B: Services (skill operations)
  - [ ] M6-T01-C: Controllers (skill handlers)
  - [ ] M6-T01-D: Routes (CRUD endpoints)
  - [ ] M6-T01-E: Tests (unit/integration)
- [ ] M6-T02: Swagger docs updated for M6
- [ ] M6-G03: Gate — tests pass before M7

## M7 — Perks (taxonomy)

Depends on: M5

- [ ] M7-T01: CRUD implementation
  - [ ] M7-T01-A: Schemas (create, read, update, delete, list)
  - [ ] M7-T01-B: Services (perk operations)
  - [ ] M7-T01-C: Controllers (perk handlers)
  - [ ] M7-T01-D: Routes (CRUD endpoints)
  - [ ] M7-T01-E: Tests (unit/integration)
- [ ] M7-T02: Swagger docs updated for M7
- [ ] M7-G03: Gate — tests pass before M8

## M8 — Races (taxonomy)

Depends on: M5

- [ ] M8-T01: CRUD implementation
  - [ ] M8-T01-A: Schemas (create, read, update, delete, list)
  - [ ] M8-T01-B: Services (race operations)
  - [ ] M8-T01-C: Controllers (race handlers)
  - [ ] M8-T01-D: Routes (CRUD endpoints)
  - [ ] M8-T01-E: Tests (unit/integration)
- [ ] M8-T02: Swagger docs updated for M8
- [ ] M8-G03: Gate — tests pass before M9

## M9 — Archetypes (taxonomy)

Depends on: M5

- [ ] M9-T01: CRUD implementation
  - [ ] M9-T01-A: Schemas (create, read, update, delete, list)
  - [ ] M9-T01-B: Services (archetype operations)
  - [ ] M9-T01-C: Controllers (archetype handlers)
  - [ ] M9-T01-D: Routes (CRUD endpoints)
  - [ ] M9-T01-E: Tests (unit/integration)
- [ ] M9-T02: Swagger docs updated for M9
- [ ] M9-G03: Gate — tests pass before M10

## M10 — Items

Depends on: M5

- [ ] M10-T01: CRUD + filters implementation
  - [ ] M10-T01-A: Schemas (create, read, update, delete, list with filters)
  - [ ] M10-T01-B: Services (item operations)
  - [ ] M10-T01-C: Controllers (item handlers)
  - [ ] M10-T01-D: Routes (CRUD endpoints)
  - [ ] M10-T01-E: Tests (unit/integration)
- [ ] M10-T02: Swagger docs updated for M10
- [ ] M10-G03: Gate — tests pass before M11

## M11 — Characters (depends on taxonomies)

Depends on: M4, M5, M6, M7, M8, M9, M10

- [ ] M11-T01: Prisma model with relations (tags/skills/perks/race/archetype), optional image association
  - [ ] M11-T01-A: Database migration
  - [ ] M11-T01-B: Seed data (sample characters)
  - [ ] M11-T01-C: Tests (migration, relations)
- [ ] M11-T02: CRUD with filters/pagination; stable sorting
  - [ ] M11-T02-A: Schemas (create, read, update, delete, list with filters)
  - [ ] M11-T02-B: Services (character operations)
  - [ ] M11-T02-C: Controllers (character handlers)
  - [ ] M11-T02-D: Routes (CRUD endpoints)
  - [ ] M11-T02-E: Tests (unit + integration + E2E)
- [ ] M11-T03: User permissions for character ownership and visibility
  - [ ] M11-T03-A: Define permission rules (PUBLIC/PRIVATE/HIDDEN character visibility)
  - [ ] M11-T03-B: Create permission check functions (who can access what)
  - [ ] M11-T03-C: Tests (verify access control works correctly)
- [ ] M11-T04: Performance optimizations
  - [ ] M11-T04-A: Add micro-cache for expensive public character LIST endpoints
  - [ ] M11-T04-B: Add ETag headers to GET character endpoint for browser caching
  - [ ] M11-T04-C: Tests (verify cache headers present, check cache behavior)
- [ ] M11-T05: Swagger docs updated for M11
- [ ] M11-G06: Gate — tests pass before M12

## M12 — Equipment (character equipment)

Depends on: M10, M11

- [ ] M12-T01: GET/PUT routes for a character's equipment
  - [ ] M12-T01-A: Schemas (equipment assignment, updates)
  - [ ] M12-T01-B: Services (equipment operations)
  - [ ] M12-T01-C: Controllers (equipment handlers)
  - [ ] M12-T01-D: Routes (equipment endpoints)
  - [ ] M12-T01-E: Tests (integration scenarios)
- [ ] M12-T02: User permissions for equipment access (consistent with character permissions)
  - [ ] M12-T02-A: Extend permission rules for equipment
  - [ ] M12-T02-B: Create equipment access control functions
  - [ ] M12-T02-C: Tests (verify permission scenarios work)
- [ ] M12-T03: Swagger docs updated for M12
- [ ] M12-G04: Gate — tests pass before M13

## M13 — Rate limiting & quotas (finalization)

Depends on: M2

- [ ] M13-T01: Confirm globals (anon 100/min per IP, auth 600/min per userId)
  - [ ] M13-T01-A: Global rate limit configuration
  - [ ] M13-T01-B: Tests (global limits enforcement)
- [ ] M13-T02: Per-route overrides (search), `/auth/login` 10/min
  - [ ] M13-T02-A: Route-specific configurations
  - [ ] M13-T02-B: Tests (429 responses, override behavior)
- [ ] M13-T03: Expose X-RateLimit-* headers
  - [ ] M13-T03-A: Header implementation
  - [ ] M13-T03-B: Tests (header presence and values)
- [ ] M13-T04: Swagger docs updated for M13
- [ ] M13-G05: Gate — tests pass before M14

## M14 — Performance, caching, DB indexes

Depends on: M11

- [ ] M14-T01: Enable automatic browser caching for API responses
  - [ ] M14-T01-A: Configure ETag headers (for cache validation)
  - [ ] M14-T01-B: Tests (verify caching headers are present)
- [ ] M14-T02: Server-side caching for expensive operations (10-60 second cache)
  - [ ] M14-T02-A: Implement temporary caching system
  - [ ] M14-T02-B: Tests (verify cache hits and cache clearing)
- [ ] M14-T03: DB indexes for frequent queries; slow-query analysis
  - [ ] M14-T03-A: Index migrations
  - [ ] M14-T03-B: Tests (query performance validation)
- [ ] M14-T04: Swagger docs updated for M14
- [ ] M14-G05: Gate — tests pass before M15

## M15 — OpenAPI completeness + Versioning/Deprecation

Depends on: M0..M14

- [ ] M15-T01: Verify all routes use exported TypeBox schemas (no inline)
  - [ ] M15-T01-A: Schema audit and cleanup
  - [ ] M15-T01-B: Tests (schema validation)
- [ ] M15-T02: Validate `/docs/json` in CI; stable `$id` names
  - [ ] M15-T02-A: CI validation step
  - [ ] M15-T02-B: Tests (OpenAPI spec validation)
- [ ] M15-T03: Versioning policy (`docs/versioning.md`): stable `/api/v1`, lightweight deprecation + Sunset
  - [ ] M15-T03-A: Deprecation headers implementation
  - [ ] M15-T03-B: Documentation updates
  - [ ] M15-T03-C: Tests (versioning behavior)
- [ ] M15-T04: Swagger docs updated for M15
- [ ] M15-G05: Gate — tests pass before M16

## M16 — Security and final hardening

Depends on: M0..M15

- [ ] M16-T01: Helmet policy + HSTS when safe
  - [ ] M16-T01-A: Security headers configuration
  - [ ] M16-T01-B: Tests (headers presence)
- [ ] M16-T02: CORS allowlist in prod; SameSite/HttpOnly/Secure for refresh cookie
  - [ ] M16-T02-A: CORS and cookie configuration
  - [ ] M16-T02-B: Tests (CORS behavior, cookie security)
- [ ] M16-T03: Audit-log sensitive events; PII scrub; backups and log rotation
  - [ ] M16-T03-A: Audit logging implementation
  - [ ] M16-T03-B: Tests (audit trail, PII redaction)
- [ ] M16-T04: Swagger docs updated for M16
- [ ] M16-G05: Gate — tests pass before M17

## M17 — Observability and operations

Depends on: M1..M16

- [ ] M17-T01: Basic dashboard (RPS, error rate, p95, top endpoints by errors/latency)
  - [ ] M17-T01-A: Dashboard implementation
  - [ ] M17-T01-B: Tests/smoke checks
- [ ] M17-T02: Minimal alerts (readiness down, sustained 5xx)
  - [ ] M17-T02-A: Alerting implementation
  - [ ] M17-T02-B: Tests/smoke checks
- [ ] M17-T03: Swagger docs updated for M17
- [ ] M17-G04: Gate — tests/smoke checks pass

---

## Ideal feature workflow

1. Planning

- Define contract (inputs/outputs, expected errors, limits, required RBAC)

1. Schemas and contracts

- Write TypeBox schemas (request/response) with `$id` and limits (min/max, patterns)
- Add/adjust Prisma migrations (additive phase); backfill if needed
- [ ] WF-T-SCHEMAS: Tests — schema validations and example payloads

1. Tests first

- Unit: RBAC policy, services
- Integration: routes via `fastify.inject`, happy and edge cases
- [ ] WF-G-TESTS-1: Gate — tests run (expected to fail until implementation) before coding controllers/services

1. Implementation

- Services/DAO with clear timeouts; map errors to stable codes
- Controllers/routes: wire schemas, auth/RBAC preHandlers, per-route rate-limits
- Caching: Cache-Control/ETag; micro-cache only if public and expensive
- [ ] WF-T-IMPL: Tests — update/add tests for implementation details
- [ ] WF-G-IMPL: Gate — all tests green before docs

1. Documentation and quality

- OpenAPI: no inline schemas; `/docs/json` yields stable refs
- Update docs (endpoints, RBAC notes, limits, examples)
- Lint + typecheck; coverage ≥ 80% per file
- [ ] WF-G-DOCS: Gate — linters/typecheck/coverage thresholds met before ops

1. Operations

- Structured logs with requestId/userId; redaction active
- Health/ready no-store; probes updated
- Feature flag/deprecation if the feature replaces existing routes
- [ ] WF-G-OPS: Gate — smoke tests/health checks pass

Note: Steps 2–4 can be parallelized by different people (schemas/migrations, services, API/tests) while respecting the integration order (schemas → services → routes). Gates enforce "tests first/green before next" at each boundary.

---

## Dependencies summary

- M0 → base for everything
- M1 → requires M0
- M2 → requires M0, M1
- M3 → requires M2
- M4 → requires M1, M2
- M5 → requires M1, M2
- M6, M7, M8, M9 → require M5 (can run in parallel)
- M10 → requires M5
- M11 → requires M4–M10 (Images before Characters, as requested)
- M12 → requires M10, M11
- M13 → requires M2
- M14 → requires M11
- M15 → requires M0..M14
- M16 → requires M0..M15
- M17 → requires M1..M16

---

Estimates: to be defined together after scope validation per milestone.
