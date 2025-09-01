# Health endpoints and schemas

Goal

- Define consistent shapes for liveness and readiness. Keep payloads minimal and cache-safe.

Endpoints

- GET `/api/v1/live` — process is running; no external checks.
- GET `/api/v1/ready` — checks DB and critical integrations; short timeouts.

Schemas (TypeBox)

```ts
// src/features/health/health.schema.ts
import { Type } from '@sinclair/typebox'

export const LiveResponse = Type.Object({
  status: Type.Literal('ok'),
  uptime: Type.Number(), // seconds
  timestamp: Type.String({ format: 'date-time' }),
}, { $id: 'LiveResponse' })

export const ReadyResponse = Type.Object({
  status: Type.Union([Type.Literal('ok'), Type.Literal('degraded')]),
  checks: Type.Object({
    db: Type.Union([Type.Literal('up'), Type.Literal('down')]),
    external: Type.Optional(Type.Union([Type.Literal('up'), Type.Literal('down')]))
  }),
  version: Type.Optional(Type.String()),
  timestamp: Type.String({ format: 'date-time' }),
}, { $id: 'ReadyResponse' })
```

Routes (example)

```ts
// src/features/health/health.routes.ts
import type { FastifyPluginAsync } from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import * as S from './health.schema'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<TypeBoxTypeProvider>()

  app.get('/live', {
    schema: { tags: ['health'], response: { 200: S.LiveResponse } }
  }, async (req, reply) => {
    reply.header('Cache-Control', 'no-store')
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }
  })

  app.get('/ready', {
    schema: { tags: ['health'], response: { 200: S.ReadyResponse } }
  }, async (req, reply) => {
    const start = Date.now()
    const checks = { db: 'down' as const }
    try {
      await app.prisma.$queryRaw`SELECT 1`
      checks.db = 'up'
    } catch {}
    const status = checks.db === 'up' ? 'ok' : 'degraded'
    reply.header('Cache-Control', 'no-store')
    return { status, checks, version: process.env.APP_VERSION, timestamp: new Date().toISOString() }
  })
}
```

OpenAPI

- Register the plugin under `/api/v1` base so the above routes are served as `/api/v1/live` and `/api/v1/ready`.
- No inline schemas; reuse `LiveResponse` and `ReadyResponse` via TypeBox.

Notes

- Keep readiness checks fast (<500 ms). Do not call slow externals here; prefer a lightweight “ping.”
- Always set `Cache-Control: no-store`.
