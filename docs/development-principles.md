# Development principles (practical guide)

Purpose

- Align on how we build and review code.
- Prefer simple choices; avoid accidental complexity.
- Make assumptions explicit and easy to change.

## Core principles

- KISS, YAGNI, DRY. Start simple, extract when needed.
- Single source of truth for data and schemas (TypeBox).
- Fail fast in dev; be quiet and predictable in prod.
- Small, cohesive modules; clear ownership per feature.

## Defaults we chose

- Runtime: Node 24+, Fastify 5+, TypeScript strict.
- Validation: TypeBox + Ajv. No ad‑hoc validators.
- Auth: short‑lived access JWT + rotating refresh cookie. OAuth2 optional.
- RBAC: central policy function; deny by default (see `docs/api-rbac.md`).
- Docs: OpenAPI from TypeBox; no inline Swagger (see `docs/documentation.md`).
- CORS: allowlist + credentials only if needed (see `docs/cors.md`).
- Caching: HTTP headers first; tiny micro‑cache for public GETs only (see `docs/caching.md`).
- Code style: 4 spaces, no semicolons, 100 chars, kebab‑case, no `any` or assertions (see `docs/code-style.md`).

## API design

- Resource‑oriented, nouns for paths; verbs only for actions that are not CRUD.
- Use cursor pagination with caps (see `docs/api-query-templates.md`).
- Consistent 2xx/4xx/5xx and typed error body (see `docs/error-handling.md`).
- Idempotent PUT/PATCH where applicable; avoid magic.

## Schemas and contracts

- Define TypeBox once; reuse in routes, services, and tests.
- Disallow additional properties unless explicitly needed.
- Add `$id` to shared schemas to stabilize OpenAPI refs.

## Errors

- Don’t leak internals; map domain/service errors to typed HTTP errors.
- Log details with requestId; return safe messages to clients.

## Security

- Helmet headers, rate limits, timeouts, body size limits (see `docs/security.md`).
- Cookies: HttpOnly, Secure, SameSite=None when cross‑site.
- No `console.*` in source; use Pino with redaction.

## Data & persistence

- Prisma as single DB access. No raw SQL unless reviewed.
- Migrations per change; no drift. Backwards‑compatible deploys.
- Soft delete only if required by product; otherwise hard delete with constraints.

## Performance

- Measure before optimizing. Add indexes before caches.
- Use streaming/partial responses only when needed and test them.

## Testing

- Unit tests for policy and services; integration via Fastify.inject.
- Fixtures live close to tests; keep tests deterministic and fast.
- Minimum coverage: 80% per file (lines/branches/functions). Critical auth/security code should target 90%+.

## Observability

- Structured logs with correlation ids. Minimal health checks. No secrets in logs.

## Documentation

- Keep feature docs close to code. Update docs with code changes in the same PR.
- Swagger reflects the code; avoid hand‑edited OpenAPI.

## Code splitting for large files

When to split

- File grows beyond ~300–400 lines, or mixes multiple responsibilities.
- More than ~8–10 exports, or deep nesting/complex functions (> 50 lines).
- Imports balloon and become hard to reason about, or you see circular deps.

How to split (by layers)

- Schemas: `*.schema.ts` — TypeBox request/response/shared models only.
- Routes: `*.routes.ts` — Fastify route defs; no business logic, no DB calls.
- Controllers: `*.controller.ts` — HTTP orchestration; parse ctx, call services, map errors.
- Services: `*.service.ts` — domain logic; call Prisma/repos; no HTTP types.
- Repos (optional): `*.repo.ts` — complex DB access isolated behind functions.
- Utils: `*.utils.ts` — pure helpers; keep in feature folder if used only there.

Structure and naming

- Keep files in the feature folder: `src/features/<feature>/...` in kebab-case.
- Prefer named exports; avoid default exports to make refactors easier.
- Use an `index.ts` per feature to re-export public API (schemas, routes, main service).

Dependency rules (avoid tangles)

- Controllers may depend on services and schemas. Services must not import controllers.
- Services may depend on repos and shared utils, never on web/server code.
- No file should import from a sibling's `index.ts` inside the same feature (import concrete files).
- Break cycles immediately; introduce small interfaces if needed.

Refactor steps (safe iteration)

- Extract smallest cohesive part first (e.g., move TypeBox schemas to `*.schema.ts`).
- Update imports; keep names the same to reduce churn.
- Add/adjust tests that cover the moved code before and after the split.
- Repeat for controllers/services until responsibilities are clean.

Size targets (guidelines)

- Route files: 100–300 lines.
- Controller files: 150–400 lines.
- Service files: 200–500 lines.
- Schema files: 50–150 lines.
- Utility files: 100–250 lines.
