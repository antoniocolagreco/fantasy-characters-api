# CORS configuration (simple, safe, copy/paste)

This API is called from a browser app (SPA) and external tools. Cross‑Origin Resource Sharing (CORS) must be explicit, minimal, and safe.

Goals

- Only allow known frontends to call the API from a browser.
- Support Authorization header and JSON bodies.
- Support cookies when needed (for refresh token) without weakening security.
- Keep preflight noise low with caching (maxAge) while staying correct.

## What to configure

### 1. Allowed origins (allowlist)

- Dev: <http://localhost:5173>, <http://localhost:3000>, <http://localhost:4321> (typical Vite/Next/Astro ports).
- Staging/Prod: your exact app domains, e.g., <https://app.example.com>.
- Never use "*" in production, especially if credentials are enabled.

### 2. Credentials (cookies)

- If using cookies (e.g., refresh token): set credentials: true and use an explicit origin (not "*").
- The browser must send credentials: 'include' on requests that need cookies.
- Cookies carrying refresh tokens must be SameSite=None; Secure in production.

### 3. Headers and methods

- Allow: Authorization, Content-Type, X-Requested-With, X-Request-Id (if used).
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS.
- Expose pagination/metadata headers if you use them, e.g., X-Next-Cursor, X-Total-Count.

### 4. Preflight caching

- Set maxAge to reduce OPTIONS traffic (e.g., 600–86400 seconds). Some browsers cap this; it is still helpful.

## Fastify config (ready to paste)

Uses @fastify/cors. Reads allowlist from env CORS_ORIGINS (comma separated). Provides safe dev defaults when NODE_ENV !== 'production'.

```ts
// src/plugins/cors.ts
import fp from 'fastify-plugin'
import cors from '@fastify/cors'

function parseOrigins(fromEnv?: string): string[] {
 if (!fromEnv) return []
 return fromEnv
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
}

export default fp(async function corsPlugin(fastify) {
 const isProd = process.env.NODE_ENV === 'production'

 // Dev defaults for local apps
 const devOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
 ]

 const envOrigins = parseOrigins(process.env.CORS_ORIGINS)
 const allowlist = (isProd ? envOrigins : [...envOrigins, ...devOrigins])
  .filter((v, i, a) => a.indexOf(v) === i)

 // If using cookies for refresh tokens, keep credentials: true.
 // If you never use cookies, you can set credentials: false.
 const enableCredentials = (process.env.CORS_CREDENTIALS ?? 'true') === 'true'

 await fastify.register(cors, {
  origin: (origin, cb) => {
   // Allow non-browser tools (no origin) like curl/Postman
   if (!origin) return cb(null, true)

   // Block "null" origins (file://, sandboxed iframes) unless explicitly allowed
   if (origin === 'null') return cb(new Error('CORS: null origin not allowed'), false)

   const ok = allowlist.includes(origin)
   cb(ok ? null : new Error(`CORS: origin not allowed: ${origin}`), ok)
  },
  credentials: enableCredentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
   'Authorization',
   'Content-Type',
   'X-Requested-With',
   'X-Request-Id',
  ],
  exposedHeaders: [
   // Add only if you use them
   'X-Next-Cursor',
   'X-Total-Count',
  ],
  maxAge: 600, // seconds (10 minutes). Consider higher in production (e.g., 86400).
 })
})
```

Register the plugin

```ts
// src/app.ts
import corsPlugin from './plugins/cors'
// ... after you create fastify instance
await fastify.register(corsPlugin)
```

## Environment variables

- CORS_ORIGINS: comma-separated list of allowed origins. Example: <https://app.example.com>,<https://staging.example.com>
- CORS_CREDENTIALS: "true" or "false" (default "true"). Set to false only if you never use cookies.

Example .env

```dotenv
# Production
NODE_ENV=production
CORS_ORIGINS=https://app.example.com,https://staging.example.com
CORS_CREDENTIALS=true
```

## Frontend usage tips

When calling endpoints that rely on cookies (refresh token), send credentials.

```ts
await fetch('https://api.example.com/auth/refresh', {
 method: 'POST',
 credentials: 'include', // send cookies
})
```

## Common mistakes to avoid

- Using origin "*" with credentials: true (not allowed by browsers).
- Forgetting Authorization in allowedHeaders, causing 401 on preflight instead of request.
- Missing Content-Type in allowedHeaders when sending JSON (application/json) or multipart/form-data.
- Allowing all origins by reflecting origin blindly; always enforce an allowlist.
- Not setting SameSite=None; Secure on refresh-token cookies when API and UI are on different origins.

## Quick checklist (for PR reviews)

- Origin allowlist is explicit and matches the deployed frontends.
- credentials is true only if cookies are used; otherwise false.
- allowedHeaders includes Authorization and Content-Type.
- exposedHeaders only contains needed metadata headers (optional).
- maxAge set to a reasonable value; no app logic depends on preflight.
