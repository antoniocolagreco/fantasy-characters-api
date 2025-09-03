# AI CORS

Essential CORS configuration for browser-based API access with explicit origin
allowlisting and credential support.

## Critical CORS Rules

1. **Always use explicit origin allowlist** - Never use "\*" in production
2. **Always allow Authorization header** - Required for JWT authentication
3. **Always allow Content-Type header** - Required for JSON requests
4. **Enable credentials only when needed** - For cookie-based refresh tokens
5. **Set reasonable preflight cache** - Reduce OPTIONS request overhead

## Required CORS Plugin

Safe CORS configuration with environment-based origin allowlisting and dev
defaults.

```ts
import fp from 'fastify-plugin'
import cors from '@fastify/cors'

function parseOrigins(envString?: string): string[] {
  if (!envString) return []
  return envString
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

export default fp(async function corsPlugin(fastify) {
  const isProd = process.env.NODE_ENV === 'production'

  // Development defaults for local frontends
  const devOrigins = [
    'http://localhost:5173', // Vite
    'http://localhost:3000', // Next.js
    'http://localhost:4321', // Astro
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ]

  const envOrigins = parseOrigins(process.env.CORS_ORIGINS)
  const allowedOrigins = isProd ? envOrigins : [...envOrigins, ...devOrigins]

  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow non-browser tools (Postman, curl, etc.)
      if (!origin) return callback(null, true)

      // Block null origins (file://, sandboxed frames)
      if (origin === 'null') {
        return callback(new Error('CORS: null origin not allowed'), false)
      }

      const isAllowed = allowedOrigins.includes(origin)
      if (!isAllowed) {
        return callback(new Error(`CORS: origin not allowed: ${origin}`), false)
      }

      callback(null, true)
    },
    credentials: process.env.CORS_CREDENTIALS !== 'false', // Default true
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization', // JWT tokens
      'Content-Type', // JSON requests
      'X-Requested-With', // AJAX requests
      'X-Request-Id', // Request tracking
    ],
    exposedHeaders: [
      // Only add if using custom pagination headers
      'X-Next-Cursor',
      'X-Total-Count',
    ],
    maxAge: 600, // 10 minutes preflight cache
  })
})
```

## Required Plugin Registration

Register CORS plugin early in the application setup before routes.

```ts
// src/app.ts
import corsPlugin from './plugins/cors'

const app = fastify({ logger: true })

// Register CORS before other plugins and routes
await app.register(corsPlugin)

// Register other plugins and routes after CORS
await app.register(authPlugin)
await app.register(routesPlugin)
```

## Required Environment Configuration

Set allowed origins and credential policy through environment variables.

```bash
# .env.development
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
CORS_CREDENTIALS=true

# .env.production
NODE_ENV=production
CORS_ORIGINS=https://app.example.com,https://admin.example.com
CORS_CREDENTIALS=true
```

## Required Frontend Configuration

Configure fetch requests to include credentials when using cookie-based auth.

```ts
// Frontend: Include credentials for cookie-based refresh tokens
await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  credentials: 'include', // Send cookies
})

// Frontend: Standard API calls with Authorization header
await fetch('/api/v1/characters', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include if using refresh token cookies
})

// Frontend: File uploads with credentials
const formData = new FormData()
formData.append('file', file)

await fetch('/api/v1/images', {
  method: 'POST',
  body: formData,
  headers: {
    Authorization: `Bearer ${accessToken}`,
    // Don't set Content-Type for FormData - browser sets it with boundary
  },
  credentials: 'include',
})
```

## Required CORS Strategy

Simple rules for different types of API access patterns.

| Scenario         | Origin Policy              | Credentials | Headers                            |
| ---------------- | -------------------------- | ----------- | ---------------------------------- |
| Solo JWT         | Lista esplicita di origini | false       | Authorization, Content-Type        |
| Cookie + JWT     | Lista esplicita di origini | true        | Authorization, Content-Type        |
| Caricamento file | Lista esplicita di origini | true        | Authorization, (Content-Type auto) |
| API pubblica     | Lista esplicita di origini | false       | Solo Content-Type                  |
