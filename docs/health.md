# Health and Readiness Checks

Essential patterns for API monitoring with health and readiness endpoints.

## Critical Rules

1. **Always implement health endpoint** at `/api/health` for basic monitoring
2. **Always implement readiness endpoint** at `/api/ready` for orchestration
3. **Health checks should be fast** with short timeout (3s max)
4. **Readiness checks can be thorough** with longer timeout (5s max)
5. **Never cache responses** - use `Cache-Control: no-store`

## Health Endpoint (`/api/health`)

Basic health check for monitoring and load balancers. Returns `200` if service
is alive, `503` if database is unreachable.

```ts
app.get('/api/health', async (req, reply) => {
  try {
    // Quick DB check with timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 3000)
      ),
    ])

    reply.header('Cache-Control', 'no-store')
    return reply.code(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  } catch (error) {
    reply.header('Cache-Control', 'no-store')
    return reply.code(503).send({
      status: 'error',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  }
})
```

## Readiness Endpoint (`/api/ready`)

Comprehensive readiness check for container orchestration. Returns `200` if
service is ready to accept traffic, `503` if not ready (missing migrations, etc).

```ts
app.get('/api/ready', async (req, reply) => {
  let isReady = true
  const checks = {
    database: { status: 'not_ready', responseTime: 0 },
    migrations: { status: 'not_ready' }
  }

  // Check database connectivity
  try {
    const dbStart = Date.now()
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      ),
    ])
    checks.database = { 
      status: 'ready', 
      responseTime: Date.now() - dbStart 
    }
  } catch (error) {
    isReady = false
  }

  // Check migrations (simplified - check if tables exist)
  try {
    await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`
    checks.migrations.status = 'ready'
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      isReady = false
    }
  }

  const statusCode = isReady ? 200 : 503
  reply.header('Cache-Control', 'no-store')
  return reply.code(statusCode).send({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks
  })
})
```

## Required Schemas

TypeBox schemas for consistent health and readiness response validation.

```ts
import { Type } from '@sinclair/typebox'

export const HealthResponseSchema = Type.Object(
  {
    status: Type.Union([Type.Literal('ok'), Type.Literal('error')]),
    timestamp: Type.String({ format: 'date-time' }),
    uptime: Type.Number(),
    error: Type.Optional(Type.String()),
  },
  { $id: 'HealthResponse' }
)

export const ReadinessResponseSchema = Type.Object(
  {
    status: Type.Union([Type.Literal('ready'), Type.Literal('not_ready')]),
    timestamp: Type.String({ format: 'date-time' }),
    checks: Type.Object({
      database: Type.Object({
        status: Type.Union([Type.Literal('ready'), Type.Literal('not_ready')]),
        responseTime: Type.Number(),
      }),
      migrations: Type.Object({
        status: Type.Union([Type.Literal('ready'), Type.Literal('not_ready')]),
      }),
    }),
  },
  { $id: 'ReadinessResponse' }
)
```

## Route Registration

Register both endpoints with proper schema validation and documentation.

```ts
// Health endpoint
app.get('/api/health', {
  schema: {
    tags: ['Health'],
    description: 'Basic health check for monitoring and load balancers',
    response: {
      200: HealthResponseSchema,
      503: HealthResponseSchema,
    },
  },
}, healthHandler)

// Readiness endpoint  
app.get('/api/ready', {
  schema: {
    tags: ['Health'],
    description: 'Readiness check for container orchestration',
    response: {
      200: ReadinessResponseSchema,
      503: ReadinessResponseSchema,
    },
  },
}, readinessHandler)
```

## Required Health Schema

TypeBox schema for consistent health response validation.

```ts
import { Type } from '@sinclair/typebox'

export const HealthResponseSchema = Type.Object(
  {
    status: Type.Union([Type.Literal('ok'), Type.Literal('error')]),
    timestamp: Type.String({ format: 'date-time' }),
    uptime: Type.Number(),
    error: Type.Optional(Type.String()),
  },
  { $id: 'HealthResponseSchema' }
)

export type HealthResponse = Static<typeof HealthResponseSchema>
```

## Required Route Registration

Register health endpoint with proper schema validation and documentation.

```ts
app.get(
  '/health',
  {
    schema: {
      tags: ['health'],
      description: 'Health check endpoint for monitoring and load balancers',
      response: {
        200: HealthResponseSchema,
        503: HealthResponseSchema,
      },
    },
  },
  async (req, reply) => {
    // Implementation above
  }
)
```
