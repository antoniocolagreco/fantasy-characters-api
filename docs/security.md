# Security

Essential security patterns for initial API code development with Fastify +
TypeScript.

## 🏗️ **Actual Security Architecture**

Your API request flows through layers with specific security responsibilities:

```text
1. MIDDLEWARE  →  2. CONTROLLER  →  3. SERVICE  →  4. REPOSITORY
   "Can this      "Extract HTTP    "What can THIS    "Execute with
    user access    data and         user do with      pre-secured
    this route?"   delegate"        THIS data?"       filters"
```

### **What Each Layer Does**

| Layer          | Primary Job                           | Security Role                         |
| -------------- | ------------------------------------- | ------------------------------------- |
| **MIDDLEWARE** | Check if user's role can use endpoint | Block unauthorized role access        |
| **CONTROLLER** | Handle HTTP request/response          | Pure HTTP coordination, no security   |
| **SERVICE**    | Apply business rules                  | Granular permissions & data filtering |
| **REPOSITORY** | Execute database operations           | Use pre-filtered, secure queries      |

**Note**: Only 3 layers perform actual security checks (Middleware, Service,
Repository). Controllers are security-agnostic coordinators.

### **Security Strategy**

- **Middleware**: Route-level permission checks using `rbac.middleware.ts`
- **Controller**: Security-agnostic HTTP coordination - just extract data and
  delegate
- **Service**: All business-level security decisions and data filtering
- **Repository**: Execute queries with security filters pre-built by services

### **Key Principle**

Controllers do **NO security checks**. They are pure HTTP handlers that extract
request data and delegate everything to services. Security happens in middleware
(route-level) and services (business-level).

## Critical Web Application Security Risks

Understanding and mitigating the most critical web application security risks.

### 1. Broken Access Control

**Problem**: Users can access resources they shouldn't have permission to view
or modify.  
**Solution**: Implement RBAC with deny-by-default policy, check permissions in
middleware (route-level) and services (business-level). Controllers should not
perform security checks.

### 2. Cryptographic Failures

**Problem**: Sensitive data exposed due to weak encryption, missing HTTPS, or
poor key management.  
**Solution**: HTTPS enforcement, secure JWT secrets, encrypted cookies, proper
TLS configuration.

### 3. Injection

**Problem**: Untrusted data sent to interpreters as part of commands or queries
(SQL, XSS, etc.).  
**Solution**: TypeBox input validation + sanitization + parameterized queries
(Prisma handles SQL).

### 4. Insecure Design

**Problem**: Missing or ineffective security controls in application
architecture.  
**Solution**: Security-by-default configurations, fail-safe patterns, security
review in design phase.

### 5. Security Misconfiguration

**Problem**: Insecure default configurations, incomplete setups, or exposed
error messages.  
**Solution**: Helmet security headers, CSP, remove debug endpoints in
production, proper environment separation.

### 6. Vulnerable and Outdated Components

**Problem**: Using components with known vulnerabilities or outdated versions.  
**Solution**: Automated dependency scanning, lockfile management, regular
updates, CI/CD security pipeline.

### 7. Identification and Authentication Failures

**Problem**: Weak authentication mechanisms, session management flaws,
credential stuffing.  
**Solution**: Short JWT TTL, rotating refresh tokens, secure session cookies,
rate limiting login attempts.

### 8. Software and Data Integrity Failures

**Problem**: Code and infrastructure that doesn't protect against integrity
violations.  
**Solution**: Input validation, audit logging, integrity checks, secure CI/CD
pipeline.

### 9. Security Logging and Monitoring Failures

**Problem**: Insufficient logging and monitoring to detect and respond to
breaches.  
**Solution**: Structured audit logs with correlation IDs, security event
monitoring, alerting.

### 10. Server-Side Request Forgery (SSRF)

**Problem**: Web application fetches remote resources without validating
user-supplied URLs.  
**Solution**: URL validation, blocked private networks, external request
filtering.

## Critical Setup Rules

1. **Always use HTTPS** in production environments
2. **Always validate all inputs** with TypeBox schemas
3. **Always set security headers** via @fastify/helmet
4. **Always implement rate limiting** per IP and user
5. **Always use parameterized queries** (Prisma handles this)
6. **Never expose secrets** in logs or error responses

## Required Security Headers

```ts
import helmet from '@fastify/helmet'

await fastify.register(helmet, {
  noSniff: true,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  strictTransportSecurity: {
    maxAge: 15552000, // 180 days
    includeSubDomains: true,
    preload: process.env.HSTS_PRELOAD === 'true',
  },
})
```

## Recommended HTTPS Enforcement (not enabled by default)

Always redirect HTTP to HTTPS and enforce secure connections.

```ts
import { fastify } from 'fastify'

// HTTP to HTTPS redirect server
const redirectApp = fastify({ logger: true })

redirectApp.addHook('onRequest', async (request, reply) => {
  const httpsUrl = `https://${request.hostname}${request.url}`
  return reply.code(301).redirect(httpsUrl)
})

// Start redirect server on port 80
if (process.env.NODE_ENV === 'production') {
  redirectApp.listen({ port: 80, host: '0.0.0.0' })
}

// Main HTTPS app with enforced TLS
const app = fastify({
  logger: true,
  https:
    process.env.NODE_ENV === 'production'
      ? {
          key: fs.readFileSync(process.env.TLS_KEY_PATH),
          cert: fs.readFileSync(process.env.TLS_CERT_PATH),
        }
      : undefined,
})

// Enforce HTTPS in production (for reverse proxy setups)
app.addHook('onRequest', async (request, reply) => {
  if (
    process.env.NODE_ENV === 'production' &&
    !request.headers['x-forwarded-proto']?.includes('https')
  ) {
    const httpsUrl = `https://${request.hostname}${request.url}`
    return reply.code(301).redirect(httpsUrl)
  }
})
```

## Rate Limiting (implemented by default)

```ts
import rateLimit from '@fastify/rate-limit'

await fastify.register(rateLimit, {
  global: true,
  keyGenerator: req =>
    (req as any).user?.id ? `user:${(req as any).user.id}` : `ip:${req.ip}`,
  max: (_req, key) => (key.startsWith('user:') ? 500 : 150),
  timeWindow: '1 minute',
})
```

## Required Server Limits

```ts
const app = fastify({
  bodyLimit: 1_000_000, // 1 MB
  requestTimeout: 15_000, // 15 seconds
})
```

## Required Input Validation

Always include `maxLength` and `additionalProperties: false` for all schemas.

```ts
import { Type } from '@sinclair/typebox'

export const CreateCharacterBody = Type.Object(
  {
    name: Type.String({ minLength: 1, maxLength: 80 }),
    bio: Type.Optional(Type.String({ maxLength: 2000 })),
    avatarUrl: Type.Optional(Type.String({ format: 'uri', maxLength: 2048 })),
  },
  { additionalProperties: false }
)
```

## Required JWT Configuration

Access tokens: 5-15 minutes. Refresh tokens: rotate on every use, store only
hash in DB. Cookies: HttpOnly, Secure, SameSite=None for cross-site.

```ts
const jwtOptions = {
  secret: process.env.JWT_SECRET,
  sign: { expiresIn: '15m', audience: 'api', issuer: 'fantasy-api' },
}
```

## Required Error Handling

Never expose stack traces or internal details in production. Always use generic
error messages for client responses. Always log full details server-side with
request ID.

```ts
const logger = pino({
  redact: {
    paths: [
      'req.headers.authorization',
      'res.headers.set-cookie',
      'password',
      'token',
    ],
    remove: true,
  },
})
```

## Required Authorization Pattern

Always deny by default, allow only what policy grants. Use centralized security
helpers for consistency.

```ts
// ✅ CORRECT: Use centralized security helpers in services
import { canViewResource, canModifyResource } from '@/shared/utils/rbac.helpers'

export async function enforceViewPermission(
  user: AuthenticatedUser | undefined,
  resource: { ownerId?: string; visibility?: string; ownerRole?: string }
) {
  if (!canViewResource(user, resource)) {
    // Concealment policy: return 404 to hide existence
    throw err('RESOURCE_NOT_FOUND', 'Resource not found')
  }
}

export async function enforceModifyPermission(
  user: AuthenticatedUser,
  resource: { ownerId?: string; visibility?: string; ownerRole?: string }
) {
  // First check if user can view the resource
  enforceViewPermission(user, resource)

  // Then check modify permissions
  if (!canModifyResource(user, resource)) {
    throw err('FORBIDDEN', 'You do not have permission to modify this resource')
  }
}
```

## Required Environment Validation

Validate all required config at startup, fail fast if missing.

```ts
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV']

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}
```

## Required RBAC Implementation

Security is handled in **middleware** and **services**, not controllers.
Controllers are pure HTTP coordinators. Deny by default, allow only what policy
grants.

```ts
// ✅ CORRECT: Middleware handles route-level permissions
// In routes file
app.put(
  '/characters/:id',
  {
    preHandler: [toFastifyPreHandler(rbac.update('characters'))],
  },
  characterController.updateCharacter
)

// ✅ CORRECT: Controller is security-agnostic, delegates to service
export const characterController = {
  async updateCharacter(req: FastifyRequest, reply: FastifyReply) {
    if (!req.user) throw err('UNAUTHORIZED', 'Login required')
    const character = await characterService.update(
      req.params.id,
      req.body,
      req.user
    )
    return reply.code(200).send(success(character, req.id))
  },
} as const

// ✅ CORRECT: Service handles granular business security
export const characterService = {
  async update(
    id: string,
    data: any,
    user: AuthenticatedUser
  ): Promise<Character> {
    const current = await characterRepository.findByIdWithOwnerRole(id)
    if (!current) throw err('RESOURCE_NOT_FOUND', 'Character not found')

    // Check view permission (concealment: return 404 if not viewable)
    if (!canViewResource(user, current))
      throw err('RESOURCE_NOT_FOUND', 'Character not found')

    // Check modify permission (403 if visible but not modifiable)
    if (!canModifyResource(user, current))
      throw err(
        'FORBIDDEN',
        'You do not have permission to modify this character'
      )

    return characterRepository.update(id, data)
  },
} as const
```

## Required Input Sanitization

Policy: l'API non accetta HTML. Qualsiasi markup viene convertito in testo
semplice. La sanitizzazione avviene in due livelli:

1. Schemi JSON (TypeBox + Ajv) come source of truth per tipi e vincoli
2. Normalizzazione testo nel middleware (preValidation) per JSON body

### 1) Ajv Keywords (transform)

Usa `ajv-keywords` per normalizzare stringhe durante la validazione (es. trim,
toLowerCase per email). Esempio con TypeBox:

```ts
import { Type } from '@sinclair/typebox'

export const LoginBody = Type.Object(
  {
    email: Type.String({
      format: 'email',
      transform: ['trim', 'toLowerCase'] as any,
    }),
    password: Type.String({
      minLength: 8,
      maxLength: 128,
      transform: ['trim'] as any,
    }),
  },
  { additionalProperties: false }
)
```

Nel bootstrap dell'app configura Ajv con `ajv-formats` e `ajv-keywords`.

### 2) Normalizzazione testo (no HTML)

Middleware di sanitizzazione (preValidation) applicato a JSON body per
POST/PUT/PATCH:

Caratteristiche:

- rimuove script/style e tag HTML (striptags) → testo semplice
- rimuove caratteri di controllo (validator.stripLow)
- normalizza whitespace (collapse + trim)
- clamp lunghezza (difesa da input eccessivi)

Nota: la sanitizzazione è “safe by default” e non muta richieste non-JSON.

Vedi `src/shared/plugins/sanitization.plugin.ts` per l'implementazione.

### Best Practices

- Definisci sempre `additionalProperties: false` nei tuoi schemi
- Usa `transform` per campi utente (email: trim+lowercase; name: trim)
- Convalida formati con `ajv-formats` (email, uuid, uri, ecc.)
- Non accettare HTML: convertilo a testo semplice lato server

## Prototype Poisoning Protection

Abilita le protezioni Fastify contro prototype/constructor poisoning:

```ts
const app = fastify({
  // ...
  onProtoPoisoning: 'remove',
  onConstructorPoisoning: 'remove',
})
```

Queste opzioni rimuovono chiavi pericolose come `__proto__` e `constructor` da
input JSON.

## Recommended CSRF Protection (not enabled by default)

Protect state-changing operations from cross-site request forgery.

```ts
import csrf from '@fastify/csrf-protection'

// For cookie-based refresh tokens
await fastify.register(csrf, {
  sessionPlugin: '@fastify/secure-session',
  cookieOpts: { signed: true, httpOnly: true, sameSite: 'none', secure: true },
})

// Double-submit cookie pattern for SPA clients
export function validateCSRFToken(req: any) {
  const headerToken = req.headers['x-csrf-token']
  const cookieToken = req.cookies['csrf-token']

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    throw err('FORBIDDEN', 'Invalid CSRF token')
  }
}
```

## Required Content Security Policy

Prevent XSS attacks with strict CSP headers.

```ts
await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
})
```

## Required SSRF Protection

Prevent server-side request forgery in URL validation and external API calls.

```ts
import { URL } from 'url'

const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1']
const BLOCKED_PORTS = [22, 23, 25, 53, 80, 110, 143, 443, 993, 995]

export function validateExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)

    // Block private/internal networks
    if (BLOCKED_HOSTS.includes(url.hostname)) return false
    if (url.hostname.startsWith('192.168.')) return false
    if (url.hostname.startsWith('10.')) return false
    if (url.hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) return false

    // Block dangerous ports
    const port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80)
    if (BLOCKED_PORTS.includes(port)) return false

    return true
  } catch {
    return false
  }
}
```

## Required Audit Logging

Log all security-sensitive events with structured format and correlation IDs.

```ts
export function auditLog(event: string, details: any, req: any) {
  req.log.info({
    audit: true,
    event,
    userId: req.user?.id,
    userRole: req.user?.role,
    requestId: req.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    details,
  })
}

// Usage examples
auditLog('USER_LOGIN', { userId: user.id }, req)
auditLog(
  'CHARACTER_DELETE',
  { characterId: id, ownerId: character.ownerId },
  req
)
auditLog('ROLE_CHANGE', { targetUserId: id, oldRole, newRole }, req)
auditLog('AUTH_FAILURE', { reason: 'invalid_token' }, req)
```

## File Upload Security (If Enabled)

Always limit size, validate MIME type, generate random filenames, and scan for
malware.

```ts
import sharp from 'sharp'
import { generateUUIDv7 } from '../utils/uuid'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

await fastify.register(multipart, {
  limits: { fileSize: MAX_FILE_SIZE },
})

export async function processImageUpload(
  data: Buffer,
  mimetype: string
): Promise<string> {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    throw err('VALIDATION_ERROR', 'Invalid file type')
  }

  // Generate secure filename using UUIDv7
  const filename = generateUUIDv7() + '.webp'

  // Re-encode image to strip metadata and ensure format
  const processedImage = await sharp(data)
    .webp({ quality: 85 })
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .toBuffer()

  // Save to secure location outside web root
  await fs.writeFile(`/secure/uploads/${filename}`, processedImage)

  return filename
}
```

## Required Dependency Scanning

Implement automated vulnerability scanning in development and CI/CD.

```ts
// package.json scripts
{
  "scripts": {
    "security:audit": "pnpm audit --audit-level moderate",
    "security:check": "pnpm audit --fix && pnpm outdated",
    "security:scan": "snyk test",
    "precommit": "pnpm run security:audit"
  },
  "devDependencies": {
    "snyk": "^1.1200.0"
  }
}
```

```dockerfile
# Multi-stage Dockerfile with security scanning
FROM node:20-alpine AS security
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm snyk
RUN pnpm install --frozen-lockfile
RUN pnpm audit --audit-level moderate
RUN snyk test

FROM node:20-alpine AS production
# Only copy clean, scanned dependencies
COPY --from=security /app/node_modules ./node_modules
```

## Quick Security Checklist

**Implementation Checklist:**

- [ ] HTTPS enforcement: redirect server running on port 80, TLS certificates
      configured
- [ ] Helmet security headers enabled with CSP
- [ ] Rate limiting configured (150/min anon, 500/min auth)
- [ ] Body size limit set (1MB default) and request timeout (15s)
- [ ] All TypeBox schemas have `additionalProperties: false` and `maxLength`
- [ ] Input sanitization for all user content (HTML and strings)
- [ ] RBAC middleware configured on all routes with `rbac.read()`,
      `rbac.create()`, etc.
- [ ] Controllers are security-agnostic and delegate all business logic to
      services
- [ ] Services use centralized `canViewResource()` and `canModifyResource()`
      helpers
- [ ] Service concealment policy: return 404 for unauthorized access, 403 for
      visible but non-modifiable
- [ ] CSRF protection for cookie-based authentication
- [ ] JWT tokens have short TTL (15min) with proper aud/iss claims
- [ ] Refresh tokens rotate and store only hashes in database
- [ ] Error responses are generic, full details logged server-side with request
      ID
- [ ] All secrets loaded from environment variables with startup validation
- [ ] Audit logging for security events (auth, RBAC, admin actions)
- [ ] File uploads validated, re-encoded, and stored outside web root
- [ ] External URL validation prevents SSRF attacks
- [ ] Automated dependency scanning: `pnpm audit`, Snyk integration, CI/CD
      security pipeline
- [ ] Multi-stage Docker build with security scanning
- [ ] Package lockfile committed and frozen installs in production

## Integration with Other Docs

- Follow [response-templates.md](./response-templates.md) for error response
  format
- Use [error-handling.md](./error-handling.md) patterns for security exceptions
- Apply [query-templates.md](./query-templates.md) validation for all endpoints
- Follow [development-principles.md](./development-principles.md) schema-first
  approach
- Implement detailed RBAC from [authorization.md](./authorization.md)
