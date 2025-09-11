# CORS

Essential CORS configuration for browser-based API access with explicit origin
allow-listing and credential support.

## Critical CORS Rules

1. **Always use explicit origin allow-list** - Never use "\*" in production
2. **Always allow Authorization header** - Required for JWT authentication
3. **Always allow Content-Type header** - Required for JSON requests
4. **Enable credentials only when needed** - For cookie-based refresh tokens
5. **Set reasonable preflight cache** - Reduce OPTIONS request overhead

## Required CORS Plugin

Safe CORS configuration with environment-based origin allow-listing and dev
defaults.

```ts
import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

function parseOrigins(envString?: string): string[] {
  if (!envString) return []
  return envString
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

export default fp(async (fastify: FastifyInstance) => {
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
import corsPlugin from '@/shared/plugins/cors.plugin'

const app = Fastify({ logger: true })

// Register CORS after security plugins but before routes
await app.register(helmetPlugin)
await app.register(corsPlugin)
await app.register(rateLimitPlugin)

// Register other plugins and routes after CORS
await app.register(multipartPlugin)
await app.register(healthCheckPlugin)
```

## Required Environment Configuration

Set allowed origins and credential policy through environment variables.

```bash
# .env.example
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

| Scenario     | Origin Policy       | Credentials | Headers                            |
| ------------ | ------------------- | ----------- | ---------------------------------- |
| JWT Only     | Explicit allow-list | false       | Authorization, Content-Type        |
| Cookie + JWT | Explicit allow-list | true        | Authorization, Content-Type        |
| File Upload  | Explicit allow-list | true        | Authorization, (Content-Type auto) |
| Public API   | Explicit allow-list | false       | Content-Type only                  |

## Common CORS Issues

**Problem**: "CORS error" in browser console

- **Solution**: Check origin is in CORS_ORIGINS environment variable
- **Debug**: Verify exact protocol/host/port match (http vs https)

**Problem**: Authorization header blocked

- **Solution**: Ensure 'Authorization' is in allowedHeaders array
- **Debug**: Check preflight OPTIONS response includes Authorization

**Problem**: Credentials not sent

- **Solution**: Set credentials: 'include' in frontend fetch calls
- **Debug**: Verify CORS_CREDENTIALS=true in backend environment
