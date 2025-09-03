# Authentication — JWT and OAuth2 (Google/GitHub)

This spec explains how clients authenticate and how we wire it server‑side. Keep
it predictable and minimal.

---

## Summary

- Two auth modes: username/password with JWT; OAuth2 login via Google/GitHub
- Single user table; OAuth accounts link to user via `(oauthProvider, oauthId)`
- Access token (JWT) short‑lived; Refresh token rotates; Logout revokes refresh

---

## Endpoints (see endpoints.md for full list)

- Local (JWT):
  - POST /api/auth/register → create user (email, password)
  - POST /api/auth/login → returns accessToken + refreshToken
  - POST /api/auth/refresh → returns new accessToken (+ optionally new
    refreshToken)
  - POST /api/auth/logout → revoke refresh token
  - GET /api/auth/profile, PUT /api/auth/profile, PUT /api/auth/password
- OAuth2 (Google/GitHub):
  - GET /api/auth/oauth/:provider/start → redirect to provider (provider ∈
    {google, github})
  - GET /api/auth/oauth/:provider/callback → finalize login; set/return tokens
  - Optional: POST /api/auth/oauth/link → link provider to logged‑in user
  - Optional: POST /api/auth/oauth/unlink → unlink provider from logged‑in user

---

## Tokens and lifetimes

- Access token: JWT signed (HS256); lifetime 15 minutes
- Refresh token: opaque UUIDv7 stored in DB (RefreshToken model); lifetime 30
  days; rotate on use
- Where to send:
  - Access token: Authorization: Bearer `<jwt>`
  - Refresh token: HTTP‑only cookie (preferred) or body on refresh/logout
- JWT claims:
  - sub: userId
  - role: Role
  - iat/exp: issuedAt/expiry
  - jti: token id (optional; useful for blacklisting)

### JWT claims — types (copy/paste)

TypeScript (one-line type):

```ts
export type JwtClaims = {
  sub: string
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  iat: number
  exp: number
  jti?: string
}
```

TypeBox schema (for route validation / docs):

```ts
import { Type } from '@sinclair/typebox'

export const JwtClaimsSchema = Type.Object({
  sub: Type.String(),
  role: Type.Union([
    Type.Literal('USER'),
    Type.Literal('MODERATOR'),
    Type.Literal('ADMIN'),
  ]),
  iat: Type.Integer(),
  exp: Type.Integer(),
  jti: Type.Optional(Type.String()),
})
```

Note: always verify the JWT signature and `exp` server-side; use
`jti`+revocation list when you need immediate token invalidation.

---

## Local flow (JWT)

1. Register
   - Input: email, password (min length; strong hashing via Argon2)
   - If email already used with OAuth only, allow setting password to enable
     both modes

2. Login
   - Verify password; deny if user.isBanned or !isActive
   - Issue accessToken (JWT) + refreshToken (DB row)
   - Store token device info (ip, userAgent)

3. Refresh
   - Validate refresh token (not revoked, not expired)
   - Rotate: revoke old, issue new refresh + access tokens
   - Return new access token (and optionally set cookie for refresh)

4. Logout
   - Revoke the refresh token; access token expires naturally

---

## OAuth2 flow (Google/GitHub)

1. Start
   - Client hits /oauth/:provider/start → Fastify redirects to provider with
     scopes:
     - Google: openid email profile
     - GitHub: read:user user:email

2. Callback
   - Exchange code for provider tokens
   - Fetch user profile (id, email, name, avatar)
   - Link or create user:
     - If a user exists with (oauthProvider, oauthId) → use it
     - Else if email matches an existing user → link provider to that user
     - Else create new user (email verified = true)
   - Apply business checks: isBanned/isActive
   - Issue access + refresh tokens as in local login

3. Optional link/unlink
   - Link requires logged‑in user; store oauthProvider+oauthId in user record
   - Unlink allowed when user still has another login method (password or other
     provider)

---

## Fastify integration (ready-for-@fastify/oauth2)

Environment variables

- OAUTH_ENABLED=false
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- GITHUB_CALLBACK_URL

Quick register snippet (scaffold — see `src/features/auth/oauth.plugin.ts` in
the repo):

```ts
// plugin registers providers behind feature flag; start/callback routes are exposed only when enabled
import fastifyOauth2 from '@fastify/oauth2'
export default async function oauthPlugin(fastify) {
  const disabled = process.env.OAUTH_ENABLED !== 'true'
  if (disabled) return

  // Google
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
    startRedirectPath: '/api/auth/oauth/google/start',
    callbackUri: process.env.GOOGLE_CALLBACK_URL,
  })

  // GitHub (similar)
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
    startRedirectPath: '/api/auth/oauth/github/start',
    callbackUri: process.env.GITHUB_CALLBACK_URL,
  })

  // Callback routes: exchange code, fetch profile, link/create user, set HttpOnly refresh cookie and redirect to SPA
  // See scaffold for implementation details and helpers (jwtSign, createRefreshToken)
}
```

Notes

- Plugin is a scaffold: real logic must create/lookup users, check
  `isBanned`/`isActive`, persist refresh token, and set cookie.
- Keep providers disabled by default (`OAUTH_ENABLED=false`) so enabling is a
  config change only.
- We prefer server-side exchange (no client secret in browser). Use PKCE if you
  later move the exchange to the client.

## Account model alignment (see data-models.md)

- User.oauthProvider (String?) and User.oauthId (String?)
- RefreshToken model for rotating tokens
- Ban fields: isBanned, banReason, bannedUntil (RBAC governs who can set)

---

## Server wiring (Fastify)

- Access token verification middleware on protected routes
- Decorate request with req.user (id, role) from JWT
- OAuth start/callback via provider SDKs or simple OAuth client
- Refresh/logout endpoints operate only on the presented refresh token

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

## Minimal contracts (for juniors/AI)

Inputs

- register: { email, password }
- login: { email, password }
- refresh: cookie.refreshToken or { refreshToken }
- oauth start: GET redirect
- oauth callback: provider code in query

Outputs

- login/refresh/callback: { accessToken } (+ set-cookie: refreshToken)
- logout: 204 or { requestId, timestamp }
- profile: user JSON (filtered by role)

Errors

- 400 validation; 401 invalid credentials/token; 403 banned/inactive; 429 rate
  limit

---

## Testing checklist

- Register/login → 200 with JWT, cookie refresh
- Refresh rotates token; old refresh is revoked
- Logout revokes refresh; refresh again → 401/400
- OAuth callback creates/links account and issues tokens
- Banned user cannot login/OAuth (403)
- Profile requires valid access token; role is present in JWT claims
