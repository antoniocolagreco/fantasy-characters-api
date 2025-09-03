# AI Health Check

Essential patterns for basic API health monitoring with a single endpoint.

## Critical Health Check Rules

1. **Always implement single health endpoint** at `/health`
2. **Always check database connectivity** with short timeout
3. **Always return consistent JSON format** with status and timestamp
4. **Never cache health responses** - use `Cache-Control: no-store`

## Required Health Endpoint

Simple health check with database connectivity test for monitoring and load
balancers.

```ts
app.get('/health', async (req, reply) => {
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
