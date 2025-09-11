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
import prismaService from '@/infrastructure/database/prisma.service'

app.get('/api/health', async (request, reply) => {
  try {
    // Quick DB check with timeout (skip in test environment)
    if (
      process.env.NODE_ENV !== 'test' &&
      process.env.SKIP_DB_CHECK !== 'true'
    ) {
      await Promise.race([
        prismaService.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          globalThis.setTimeout(
            () => reject(new Error('DB health timeout')),
            3000
          )
        ),
      ])
    }

    reply.header('Cache-Control', 'no-store')
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  } catch (error) {
    request.log.warn({ error }, 'Health check failed')
    reply.header('Cache-Control', 'no-store')
    return reply.status(503).send({
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
service is ready to accept traffic, `503` if not ready (missing migrations,
etc).

```ts
import prismaService from '@/infrastructure/database/prisma.service'

app.get('/api/ready', async (request, reply) => {
  const startTime = Date.now()
  let isReady = true

  // Check database connectivity
  let dbStatus: 'ready' | 'not_ready' = 'not_ready'
  let dbResponseTime = 0

  if (process.env.NODE_ENV === 'test' || process.env.SKIP_DB_CHECK === 'true') {
    dbStatus = 'ready'
    dbResponseTime = 0
  } else {
    try {
      const dbStartTime = Date.now()
      await Promise.race([
        prismaService.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          globalThis.setTimeout(
            () => reject(new Error('DB readiness timeout')),
            5000
          )
        ),
      ])
      dbResponseTime = Date.now() - dbStartTime
      dbStatus = 'ready'
    } catch (error) {
      request.log.warn({ error }, 'Database readiness check failed')
      dbResponseTime = Date.now() - startTime
      isReady = false
    }
  }

  // Check migrations (simplified check - in real app would check _prisma_migrations table)
  let migrationsStatus: 'ready' | 'not_ready' = 'ready'
  if (process.env.NODE_ENV === 'production') {
    try {
      // This will fail if migrations haven't been run
      await prismaService.$queryRaw`SELECT 1 FROM "User" LIMIT 1`
    } catch (error) {
      request.log.warn({ error }, 'Migration readiness check failed')
      migrationsStatus = 'not_ready'
      isReady = false
    }
  }

  const readinessData = {
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      migrations: {
        status: migrationsStatus,
      },
    },
  }

  const statusCode = isReady ? 200 : 503
  reply.header('Cache-Control', 'no-store')
  return reply.status(statusCode).send(readinessData)
})
```

## TypeBox Schemas

Health and readiness response schemas for validation and OpenAPI documentation.

```ts
import { type Static, Type } from '@sinclair/typebox'

export const HealthResponseSchema = Type.Object(
  {
    status: Type.String({
      enum: ['ok', 'error'],
      description: 'Overall health status of the application',
    }),
    timestamp: Type.String({
      format: 'date-time',
      description: 'When the health check was performed',
    }),
    uptime: Type.Number({
      description: 'Application uptime in seconds',
    }),
    error: Type.Optional(
      Type.String({
        description: 'Error message if status is error',
      })
    ),
  },
  {
    $id: 'HealthResponse',
    title: 'Health Response',
    description: 'Application health check response',
  }
)

export const ReadinessResponseSchema = Type.Object(
  {
    status: Type.String({
      enum: ['ready', 'not_ready'],
      description: 'Overall readiness status of the application',
    }),
    timestamp: Type.String({
      format: 'date-time',
      description: 'When the readiness check was performed',
    }),
    checks: Type.Object({
      database: Type.Object({
        status: Type.String({
          enum: ['ready', 'not_ready'],
          description: 'Database connection status',
        }),
        responseTime: Type.Number({
          description: 'Database response time in milliseconds',
        }),
      }),
      migrations: Type.Object({
        status: Type.String({
          enum: ['ready', 'not_ready'],
          description: 'Database migrations status',
        }),
      }),
    }),
  },
  {
    $id: 'ReadinessResponse',
    title: 'Readiness Response',
    description:
      'Application readiness check response with detailed component status',
  }
)

// Export TypeScript types
export type HealthResponse = Static<typeof HealthResponseSchema>
export type ReadinessResponse = Static<typeof ReadinessResponseSchema>
```

## Route Registration

Register both endpoints with proper schema validation and documentation.

```ts
import {
  HealthResponseSchema,
  ReadinessResponseSchema,
} from '@/shared/schemas/health.schema'

// Health endpoint
app.get(
  '/api/health',
  {
    schema: {
      tags: ['Health'],
      summary: 'Health check endpoint',
      description: 'Basic health check for monitoring and load balancers',
      response: {
        200: HealthResponseSchema,
        503: HealthResponseSchema,
      },
    },
  },
  healthHandler
)

// Readiness endpoint
app.get(
  '/api/ready',
  {
    schema: {
      tags: ['Health'],
      summary: 'Readiness check endpoint',
      description: 'Returns whether the service is ready to accept traffic',
      response: {
        200: ReadinessResponseSchema,
        503: ReadinessResponseSchema,
      },
    },
  },
  readinessHandler
)
```

## Plugin Implementation

The recommended approach is to implement health checks as a Fastify plugin for
better organization and reusability.

```ts
import type { FastifyInstance } from 'fastify'
import {
  HealthResponseSchema,
  ReadinessResponseSchema,
} from '@/shared/schemas/health.schema'
import prismaService from '@/infrastructure/database/prisma.service'

export async function healthCheckPlugin(
  fastify: FastifyInstance
): Promise<void> {
  // Register both health endpoints
  fastify.get(
    '/api/health',
    {
      schema: {
        /* ... */
      },
    },
    healthHandler
  )
  fastify.get(
    '/api/ready',
    {
      schema: {
        /* ... */
      },
    },
    readinessHandler
  )
}

// Register the plugin
await app.register(healthCheckPlugin)
```
