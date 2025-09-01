# API security hardening (practical spec)

This document lists the security measures we expect across the API. It is written to be easy to apply and review.

Goals

- Reduce common web risks (OWASP Top 10) with simple defaults.
- Make unsafe configurations hard to slip in.
- Provide copy/paste code and a short review checklist.

Scope

- Fastify + TypeScript, TypeBox + Ajv, Prisma/PostgreSQL, JWT (access) + refresh cookie, optional OAuth2.
- For CORS, see `docs/cors.md`.

## Transport and TLS

- Only serve HTTPS in all environments that face the internet.
- Redirect HTTP to HTTPS at the edge/load balancer.
- Enable HSTS with preload only when all subdomains are HTTPS.

Example (via @fastify/helmet)

```ts
import helmet from '@fastify/helmet'

await fastify.register(helmet, {
 strictTransportSecurity: {
  maxAge: 15552000, // 180 days
  includeSubDomains: true,
  preload: process.env.HSTS_PRELOAD === 'true',
 },
})
```

## HTTP security headers

Use @fastify/helmet to set safe defaults.

```ts
import helmet from '@fastify/helmet'

await fastify.register(helmet, {
 // MIME sniffing protection
 noSniff: true,
 // Clickjacking protection (APIs should not be framed)
 frameguard: { action: 'deny' },
 // Referrer policy: do not leak full URLs
 referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
 // Permissions Policy: disable powerful features by default
 permissionsPolicy: {
  features: {
   geolocation: ["'none'"],
   camera: ["'none'"],
   microphone: ["'none'"],
   payment: ["'none'"],
  },
 },
 // Cross-origin resource policy: API is same-site only
 crossOriginResourcePolicy: { policy: 'same-site' },
})
```

Also set:

- Remove framework banners (no x-powered-by). Fastify does not send it by default.
- ETag/Cache-Control per endpoint. Avoid caching authenticated responses unless intended.

## DoS and abuse protection

- Rate limit per IP and per authenticated user/token.
- Bound request sizes and execution time.
- Use pagination and caps on list endpoints.

```ts
import rateLimit from '@fastify/rate-limit'

await fastify.register(rateLimit, {
  global: true,
  // See docs/rate-limiting.md for defaults (anon 100/min, auth 600/min)
  keyGenerator: (req) => ((req as any).user?.id ? `user:${(req as any).user.id}` : `ip:${req.ip}`),
  max: (_req, key) => (key.startsWith('user:') ? 600 : 100),
  timeWindow: '1 minute',
})

// Server bounds (fastify instance options)
const app = fastify({
  bodyLimit: 1_000_000, // 1 MB
  requestTimeout: 15_000, // ms
})

// Pagination caps (example contract)
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 20
```

## Input validation and sanitization

Validate everything with TypeBox + Ajv. Reject unknown properties and enforce field limits.

```ts
import { Type } from '@sinclair/typebox'

export const CreateCharacterBody = Type.Object({
 name: Type.String({ minLength: 1, maxLength: 80 }),
 bio: Type.Optional(Type.String({ maxLength: 2000 })),
 avatarUrl: Type.Optional(Type.String({ format: 'uri', maxLength: 2048 })),
}, { additionalProperties: false })
```

Ajv setup notes

- Use strict mode. Consider removeAdditional only if you want to drop unknowns; otherwise reject.
- Normalize/trim strings in controllers/services if needed (e.g., name = name.trim()).

```ts
import Ajv from 'ajv'
const ajv = new Ajv({
 allErrors: process.env.NODE_ENV !== 'production',
 strict: true,
 // removeAdditional: 'all', // optional: drop unknown props instead of 400
})
```

Sanitization tips

- Define maxLength on all strings.
- For identifiers: validate as UUID/ULID/CUID pattern; never accept free-form.
- For free text that might be rendered in a browser later, store as-is and sanitize on render. If you must sanitize on input, strip control characters and disallow embedded nulls.
- Never parse JSON from untrusted strings unless validated by schema.

## Authentication and session security

- Access token: short TTL (5–15 min). Include jti and aud.
- Refresh tokens: rotate on every use. Store only a hash in DB; revoke on logout/compromise.
- Cookies for refresh token only: HttpOnly, Secure, SameSite=None (when cross-site), narrow Path and Domain.
- Enforce device/session limits if needed (e.g., max active refresh tokens per user).

CSRF

- Stateless Authorization header (Bearer) is not CSRF-prone.
- If you use refresh cookies, protect refresh endpoints:
  - Use SameSite=None; Secure.
  - Optionally require a double-submit token or Origin check on refresh/credentialed endpoints.

## Authorization and RBAC

- Deny by default. Allow only what the policy grants.
- Centralize checks in a policy function (see `docs/api-rbac.md`).
- Re-check ownership/visibility inside services before mutating data.
- For admin/mod actions (ban, role changes), always audit-log the actor, target, and reason.

## Error handling and responses

- Do not leak stack traces or SQL queries in production responses.
- Return typed error shapes (see error-handling doc) with generic messages.
- Log full details server-side with correlation ids.

## Logging and audit

- Use structured logs (Pino). Include: time, level, msg, requestId, userId (if any), route, status.
- Redact PII, secrets, and tokens.
- Audit log security-sensitive events: login, logout, refresh, failed auth, RBAC denies, resource deletions, role changes, bans/unbans.
- Protect audit logs from tampering; set retention and rotation.

```ts
import pino from 'pino'

const logger = pino({
 redact: {
  paths: ['req.headers.authorization', 'res.headers.set-cookie', 'password', 'token', 'refreshToken'],
  remove: true,
 },
})
```

## File uploads (if enabled)

- Limit size, count, and types. Verify MIME and extension; do not trust either.
- Store outside the web root. Generate random filenames; do not use user-provided names.
- For images, consider processing (re-encode) to strip active content.
- Optionally run antivirus scanning on uploads.

## Database and queries

- Use parameterized queries (Prisma does this by default). Never build SQL strings from user input.
- Apply row-level access in services (owner checks, visibility filters) in addition to controller guards.
- Use least-privilege DB credentials; avoid superuser in application.

## Secrets and configuration

- Do not hardcode secrets. Load from environment or a secret manager.
- Rotate keys regularly (JWT signing keys, OAuth client secrets).
- Validate config at startup; fail fast if required variables are missing.

## Dependency and build hygiene

- Pin versions and commit a lockfile.
- Regularly scan for vulnerabilities (npm audit, Snyk, etc.).
- Avoid unused dependencies. Keep devDependencies out of runtime containers.

## Operational hardening

- Health endpoints should not expose environment or secrets.
- Admin/debug endpoints disabled in production.
- Set proper process/user permissions for the runtime; avoid running as root in containers.
- Backups tested and restore procedure documented.

## Quick review checklist

- [ ] HTTPS only; HSTS configured when safe.
- [ ] Helmet headers enabled (noSniff, frameguard, referrerPolicy, permissionsPolicy, HSTS).
- [ ] CORS allowlist matches frontends; credentials only if needed.
- [ ] Rate limit enabled; bodyLimit and timeouts set; pagination caps enforced.
- [ ] TypeBox/Ajv schemas with additionalProperties: false and length limits.
- [ ] Auth: short-lived access token; rotating refresh token (HttpOnly, Secure, SameSite=None if cross-site).
- [ ] RBAC enforced in controllers and services; deny by default.
- [ ] Errors are generic; logs contain details with requestId; PII and secrets redacted.
- [ ] Audit logs for auth, admin, and destructive actions.
- [ ] Upload limits and type checks (if uploads exist).
- [ ] DB least-privilege; no string-built queries.
- [ ] Secrets not hardcoded; config validated at startup.
- [ ] Dependencies scanned; lockfile committed.
