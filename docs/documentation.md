# API documentation: OpenAPI and Swagger UI

Goal: single source of truth. The same schemas used by the API (TypeBox) generate OpenAPI. No inline Swagger schemas. No duplicates.

## Tools

- @fastify/swagger + @fastify/swagger-ui
- @fastify/type-provider-typebox (routes consume TypeBox and expose JSON Schema automatically)

## Principles

- Define request/response schemas in TypeBox next to each feature (no inline JSON in routes).
- Reuse the same exported TypeBox objects in Fastify route `schema`.
- Export a single index per feature that aggregates its schemas and route definitions.
- Do not redefine shapes in OpenAPI; let @fastify/swagger read them from Fastify.

## Minimal wiring

```ts
// src/plugins/swagger.ts
import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

export default fp(async function swaggerPlugin(app) {
  await app.register(swagger, {
    openapi: {
  info: { title: 'Fantasy Characters API', version: '1.0.0' },
  servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    hideUntagged: false,
    refResolver: {
      buildLocalReference(json, _baseUri, _fragment, i) {
        // Stable refs help deduplicate components
        return json.$id || json.title || `def-${i}`
      },
    },
  })

  await app.register(swaggerUi, { routePrefix: '/docs', staticCSP: true })
})
```

Register once in app bootstrap:

```ts
// src/app.ts
import swaggerPlugin from './plugins/swagger'
await app.register(swaggerPlugin)
```

## Route schemas (TypeBox as source of truth)

```ts
// src/features/characters/characters.schema.ts
import { Type } from '@sinclair/typebox'

export const Character = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 80 }),
  bio: Type.Optional(Type.String({ maxLength: 2000 })),
  ownerId: Type.String({ format: 'uuid' }),
}, { $id: 'Character' })

export const GetCharacterParams = Type.Object({ id: Type.String({ format: 'uuid' }) }, { $id: 'GetCharacterParams' })

export const ListCharactersQuery = Type.Object({
  cursor: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
}, { $id: 'ListCharactersQuery' })

export const GetCharacterResponse = Character
export const ListCharactersResponse = Type.Object({
  items: Type.Array(Character),
  nextCursor: Type.Optional(Type.String()),
}, { $id: 'ListCharactersResponse' })
```

```ts
// src/features/characters/characters.routes.ts
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'
import * as S from './characters.schema'

export const charactersRoutes: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<TypeBoxTypeProvider>()

  app.get('/characters/:id', {
    schema: {
      tags: ['characters'],
      security: [{ bearerAuth: [] }],
      params: S.GetCharacterParams,
      response: { 200: S.GetCharacterResponse },
    },
  }, async (req, reply) => {
    // handler
  })

  app.get('/characters', {
    schema: {
      tags: ['characters'],
      security: [{ bearerAuth: [] }],
      querystring: S.ListCharactersQuery,
      response: { 200: S.ListCharactersResponse },
    },
  }, async (req, reply) => {
    // handler
  })
}
```

Notes

- No inline schemas: only reference exported TypeBox objects.
- Prefer `$id` on shared schemas to get stable component names in the OpenAPI output.
- Use tags consistently to group endpoints. Security can be declared per-route or globally.
- Error responses should reuse the same error schema across the app (see `docs/error-handling.md`).

## Testing the docs

- OpenAPI JSON is available at `/docs/json` (from @fastify/swagger-ui). Use it for client generation/validation.
- Add a CI step that fetches it and validates with an OpenAPI validator.
- Keep Swagger UI for local use at `/docs`; hide sensitive server URLs in production.

## Avoid duplicates (how)

- One schema per shape (exported const) and reuse across routes.
- For variants, use TypeBox utilities (Type.Pick/Type.Partial/Type.Intersect) instead of new objects.
- Provide `$id` and/or `title` for common schemas so the ref resolver can deduplicate.
- Never paste JSON Schema into Swagger configs; always import the TypeBox schema.
