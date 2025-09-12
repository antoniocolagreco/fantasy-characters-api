# Authentication — JWT (implemented) and OAuth2 (planned)

This spec explains how clients authenticate and how we wire it server‑side. Keep
it predictable and minimal.

---

## Current Implementation Status

**✅ Implemented:**

- Username/password authentication with JWT
- Access token (15 minutes) and refresh token system (refresh defaults to 7 days
  in code; configurable)
- Token rotation on refresh
- Password hashing with Argon2
- User model with OAuth fields prepared
- JWT middleware for route protection
- Complete auth endpoints: register, login, logout, logout-all, refresh,
  change-password
- Email verification flow: send verification email, confirm token, and RBAC gate
  blocking CREATE for unverified regular users (toggle via
  EMAIL_VERIFICATION_ENABLED)

**📋 Planned (Not Yet Implemented):**

- OAuth2 integration with Google/GitHub providers
- OAuth start/callback endpoints
- Provider linking/unlinking functionality
- OAuth-specific business logic

---

## Summary

- Primary mode: username/password with JWT (fully implemented)
- OAuth2 login via Google/GitHub (planned, infrastructure ready)
- Single user table with OAuth fields prepared: `oauthProvider`, `oauthId`
- Access token (JWT) short‑lived; Refresh token rotates; Logout revokes refresh

---

## Endpoints (see endpoints.md for full list)

**✅ Implemented (JWT endpoints):**

- `POST /api/v1/auth/register` — Register new user (email, password)
- `POST /api/v1/auth/login` — User login (returns accessToken + refreshToken)
- `POST /api/v1/auth/refresh` — Refresh JWT token (rotates refresh token)
- `POST /api/v1/auth/logout` — User logout (revoke refresh token)
- `POST /api/v1/auth/logout-all` — Logout from all devices
- `PUT /api/v1/auth/change-password` — Change user password
- `POST /api/v1/auth/verify/send` — Send verification email (requires auth)
- `GET /api/v1/auth/verify/confirm?token=...` — Confirm email verification
  (public)

**📋 Planned (OAuth2 endpoints):**

- `GET /api/v1/auth/oauth/:provider/start` — Redirect to provider (google,
  github)
- `GET /api/v1/auth/oauth/:provider/callback` — Handle OAuth callback
- `POST /api/v1/auth/oauth/link` — Link provider to logged‑in user
- `POST /api/v1/auth/oauth/unlink` — Unlink provider from logged‑in user

---

## Tokens and lifetimes

- **Access token**: JWT signed (HS256); lifetime 15 minutes (configurable via
  `JWT_ACCESS_EXPIRES_IN`)
- **Refresh token**: opaque 64-character hex string (32 random bytes) stored in
  DB (RefreshToken model); default lifetime 7 days in service; recommended to
  align with `JWT_REFRESH_EXPIRES_IN` configuration; rotates on use
- **Where to send**:
  - Access token: `Authorization: Bearer <jwt>`
  - Refresh token: Request body for refresh/logout operations
- **JWT claims**:
  - sub: userId (UUID format)
  - role: Role (USER|MODERATOR|ADMIN)
  - iat/exp: issuedAt/expiry timestamps
  - jti: token id (optional; useful for blacklisting)

### JWT claims — types (copy/paste)

TypeScript (actual implementation):

```ts
export type JwtClaims = {
  sub: string // UUID format user ID
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  iat: number // Issued at timestamp
  exp: number // Expiration timestamp
  jti?: string // Optional JWT ID (UUID format)
}
```

TypeBox schema (actual implementation):

```ts
import { Type } from '@sinclair/typebox'

export const JwtClaimsSchema = Type.Object({
  sub: Type.String({ format: 'uuid' }),
  role: Type.Union([
    Type.Literal('USER'),
    Type.Literal('MODERATOR'),
    Type.Literal('ADMIN'),
  ]),
  iat: Type.Integer(),
  exp: Type.Integer(),
  jti: Type.Optional(Type.String({ format: 'uuid' })),
})
```

Note: always verify the JWT signature and `exp` server-side; use
`jti`+revocation list when you need immediate token invalidation.

---

## Local flow (JWT) — Implemented

### Register

- Input: email, password, optional name
- Password must be 8+ characters; hashed with Argon2
- Creates user with role USER and isActive=true
- Sets isEmailVerified=false (user must verify email before creating content)
- Returns user data with access + refresh tokens

### Login

- Verify email/password; deny if user.isBanned or !isActive
- Issue accessToken (JWT) + refreshToken (64-hex string in DB)
- Store token device info (ip, userAgent)
- Returns user data with tokens

### Email verification gate

- Non-verified users can authenticate and read public data, but cannot CREATE
  domain entities
- Enforcement happens in RBAC middleware for all create actions (see
  Authorization doc)
- Error: 403 FORBIDDEN with message "Email not verified"
- Feature flag: set `EMAIL_VERIFICATION_ENABLED=false` to disable this gate
  (useful for tests/dev)

### Email verification flow

- On register, if `EMAIL_VERIFICATION_ENABLED=true`, the server attempts to send
  a verification email with a short‑lived tokenized link
- Users can request a new link via `POST /api/v1/auth/verify/send` (auth
  required)
- The confirmation endpoint `GET /api/v1/auth/verify/confirm?token=...` verifies
  the token and marks the user as verified
- If the feature flag is disabled, the server won’t send emails and the gate is
  not enforced

### Refresh

- Validate refresh token (not revoked, not expired)
- Rotate: revoke old, issue new refresh + access tokens
- Return new access token and new refresh token

### Logout

- Revoke the specific refresh token; access token expires naturally
- Returns success message

### Logout All

- Revoke all refresh tokens for the user
- Requires valid access token for authentication

---

## OAuth2 flow (Google/GitHub) — Planned Implementation

**Note**: This section describes the planned OAuth2 implementation. The
infrastructure is ready (config vars, dependencies, user model fields), but the
actual OAuth endpoints and business logic are not yet implemented.

1. **Start** (Planned)
   - Client hits `/oauth/:provider/start` → Fastify redirects to provider with
     scopes:
     - Google: openid email profile
     - GitHub: read:user user:email

2. **Callback** (Planned)
   - Exchange code for provider tokens
   - Fetch user profile (id, email, name, avatar)
   - Link or create user:
     - If a user exists with (oauthProvider, oauthId) → use it
     - Else if email matches an existing user → link provider to that user
     - Else create new user (email verified = true)
   - Apply business checks: isBanned/isActive
   - Issue access + refresh tokens as in local login

3. **Optional link/unlink** (Planned)
   - Link requires logged‑in user; store oauthProvider+oauthId in user record
   - Unlink allowed when user still has another login method (password or other
     provider)

---

## Fastify integration

**✅ Current Implementation:**

Environment variables (configured):

- `JWT_SECRET` — JWT signing secret
- `JWT_REFRESH_SECRET` — Refresh token secret (optional)
- `JWT_ACCESS_EXPIRES_IN` — Access token TTL (default: "15m")
- `JWT_REFRESH_EXPIRES_IN` — Refresh token TTL (default: "30d")
- `OAUTH_ENABLED` — OAuth feature flag (default: false)

**📋 OAuth Configuration (Ready for Implementation):**

Environment variables (ready but not used):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`

OAuth plugin scaffold (guidance for future implementation):

```ts
// Future OAuth plugin implementation
import fastifyOauth2 from '@fastify/oauth2'

export default async function oauthPlugin(fastify) {
  const disabled = process.env.OAUTH_ENABLED !== 'true'
  if (disabled) return // Currently always disabled

  // Google configuration
  await fastify.register(fastifyOauth2, {
    name: 'googleOAuth2',
    scope: ['openid', 'email', 'profile'],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET,
      },
      auth: fastifyOauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/api/v1/auth/oauth/google/start',
    callbackUri: process.env.GOOGLE_CALLBACK_URL,
  })

  // GitHub configuration
  await fastify.register(fastifyOauth2, {
    name: 'githubOAuth2',
    scope: ['read:user', 'user:email'],
    credentials: {
      client: {
        id: process.env.GITHUB_CLIENT_ID,
        secret: process.env.GITHUB_CLIENT_SECRET,
      },
      auth: fastifyOauth2.GITHUB_CONFIGURATION,
    },
    startRedirectPath: '/api/v1/auth/oauth/github/start',
    callbackUri: process.env.GITHUB_CALLBACK_URL,
  })

  // TODO: Implement callback routes with user creation/linking logic
}
```

Notes:

- OAuth infrastructure is ready but not implemented
- Keep providers disabled by default (`OAUTH_ENABLED=false`)
- User model includes `oauthProvider` and `oauthId` fields
- `@fastify/oauth2` dependency is already installed
- JWT implementation uses `jsonwebtoken` and custom middleware

## Account model alignment (see data-models.md)

**✅ Implemented User model fields:**

- Core auth: `id`, `email`, `passwordHash`, `role`, `isActive`
- OAuth ready: `oauthProvider` (String?), `oauthId` (String?)
- Security: `isEmailVerified`, `lastPasswordChange`, `lastLogin`
- Moderation: `isBanned`, `banReason`, `bannedUntil`, `bannedById`
- RefreshToken model: separate table for rotating tokens with device info

**Database schema (actual):**

```prisma
model User {
  id              String  @id @db.Uuid
  email           String  @unique
  passwordHash    String
  role            Role    @default(USER)
  isEmailVerified Boolean @default(false)
  isActive        Boolean @default(true)

  // OAuth fields (ready for implementation)
  oauthProvider   String?
  oauthId         String?

  // Security & moderation
  isBanned        Boolean   @default(false)
  banReason       String?
  bannedUntil     DateTime?
  bannedById      String?

  // ... other fields
}
```

---

## Server wiring (Fastify)

**✅ Current Implementation:**

- JWT middleware (`createAuthMiddleware`) for protected routes
- Request decoration with `req.user` (id, role) from JWT
- Complete auth service with password hashing, token management
- Refresh token repository with device tracking
- Route protection via `preHandler` middleware

**📋 Planned:**

- OAuth start/callback routes via provider SDKs
- Provider-specific user profile fetching
- Account linking/unlinking business logic
- Email verification delivery: token email + verify endpoint (planned). For now,
  admins can verify via internal tooling or a future endpoint using
  users.service.markEmailAsVerified()

### Minimal enforcement example (current)

```ts
// RBAC middleware enforces the verification gate for all create actions
if (action === 'create') {
  const client = request.prisma
  const userId = request.user?.id
  const role = request.user?.role
  if (client && userId && role !== 'ADMIN' && role !== 'MODERATOR') {
    const row = await client.user.findUnique({
      where: { id: userId },
      select: { isEmailVerified: true },
    })
    if (!row?.isEmailVerified) throw err('FORBIDDEN', 'Email not verified')
  }
}
```

---

## Security notes

- Always HTTP‑only, Secure cookies for refresh tokens (sameSite=lax/strict)
- Rate‑limit login, refresh, and callback endpoints
- Hash passwords with Argon2
- Rotate refresh tokens on each refresh; revoke on logout and suspicious
  activity
- Do not trust provider email unless `email_verified` is true (Google) or
  confirmed via API (GitHub primary verified email)
- Enforce JWT audience/issuer if used across services

---

## Minimal contracts

**✅ Implemented Inputs:**

- register: `{ email, password, name? }`
- login: `{ email, password }`
- refresh: `{ refreshToken }` (64-character hex string)
- logout: `{ refreshToken }` (64-character hex string)
- change-password: `{ currentPassword, newPassword }`

**✅ Implemented Outputs:**

- login/register: `{ data: { id, email, role, accessToken, refreshToken } }`
- refresh: `{ data: { accessToken, refreshToken } }`
- logout/change-password: `{ message, timestamp, requestId }`

**📋 Planned (OAuth):**

- oauth start: GET redirect
- oauth callback: provider code in query
- oauth link/unlink: provider management

**Error codes:**

- 400 validation errors
- 401 invalid credentials/token
- 403 banned/inactive user
- 409 email already exists (register)
- 429 rate limit exceeded

---

## Testing checklist

**✅ Implemented & Testable:**

- Register/login → 201/200 with JWT and refresh token in response body
- Refresh rotates token; old refresh token is revoked
- Logout revokes specific refresh token; using it again → 401
- Logout-all revokes all user tokens
- Change password requires valid current password
- Banned user cannot login (403)
- JWT contains correct user data (sub=userId, role, iat, exp)
- Password hashing uses Argon2
- Access token expires in 15 minutes
- Refresh token expires in 30 days

**📋 Planned (OAuth):**

- OAuth callback creates/links account and issues tokens
- Provider linking respects existing accounts
- Provider unlinking maintains login methods
