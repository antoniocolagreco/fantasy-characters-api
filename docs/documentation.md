# AI API Documentation

Comprehensive guide to create consistent OpenAPI documentation using TypeBox
schemas as the single source of truth.

## Documentation Philosophy

This system eliminates documentation drift by generating OpenAPI specs directly
from the same TypeBox schemas used for runtime validation. No manual JSON Schema
writing, no duplication, no inconsistencies.

**Core Principle**: Write schemas once in TypeBox → Auto-generate OpenAPI →
Auto-validate requests → Auto-type TypeScript

## Critical Documentation Rules

1. **Always use TypeBox as source of truth** - No inline JSON schemas in routes
2. **Always add $id to shared schemas** - Enables proper OpenAPI component refs
3. **Always reuse schemas** - Use Type.Pick/Omit instead of duplicating
4. **Always tag endpoints** - Group related operations for better organization
5. **Always validate OpenAPI output** - Include schema validation in CI/CD

## OpenAPI Plugin Setup

Install and configure Swagger with TypeBox integration for automatic schema
generation.

```ts
// src/plugins/swagger.ts
import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

export default fp(async function swaggerPlugin(app) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Fantasy Characters API',
        version: '1.0.0',
        description:
          'RESTful API for managing fantasy characters, items, and game data',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        { url: '/api/v1', description: 'API v1' },
        { url: 'https://api.example.com/v1', description: 'Production' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Access Token',
          },
        },
      },
    },
    hideUntagged: false,
    refResolver: {
      buildLocalReference(json, _baseUri, _fragment, i) {
        // Create stable component references for schema deduplication
        return json.$id || json.title || `schema-${i}`
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    staticCSP: true,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
      displayRequestDuration: true,
    },
  })
})
```

## Schema Organization Template

**File Structure**: Each feature gets its own schema file with consistent
exports.

```ts
// src/features/{feature}/{feature}.schema.ts
import { Type, Static } from '@sinclair/typebox'

// 1. Base Entity Schema (with $id for OpenAPI components)
export const {Feature}Schema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 80 }),
  description: Type.Optional(Type.String({ maxLength: 2000 })),
  ownerId: Type.String({ format: 'uuid' }),
  visibility: Type.Union([
    Type.Literal('PUBLIC'),
    Type.Literal('PRIVATE'),
    Type.Literal('HIDDEN')
  ]),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
}, { $id: '{Feature}' })

// 2. Request Schemas (derived from base)
export const Create{Feature}Schema = Type.Omit({Feature}Schema, [
  'id', 'ownerId', 'createdAt', 'updatedAt'
], { $id: 'Create{Feature}' })

export const Update{Feature}Schema = Type.Partial(
  Type.Omit({Feature}Schema, ['id', 'ownerId', 'createdAt', 'updatedAt'])
, { $id: 'Update{Feature}' })

// 3. Parameter Schemas
export const {Feature}ParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' })
}, { $id: '{Feature}Params' })

// 4. Query Schemas (use base query schemas from common)
export const {Feature}ListQuerySchema = Type.Intersect([
  Type.Object({
    visibility: Type.Optional(Type.Union([
      Type.Literal('PUBLIC'),
      Type.Literal('PRIVATE')
    ])),
    // Feature-specific filters here
  }),
  PaginationQuerySchema, // From common/schemas/query.schemas.ts
  SortQuerySchema,       // From common/schemas/query.schemas.ts
], { $id: '{Feature}ListQuery' })

// 5. Response Schemas (consistent envelope pattern)
export const {Feature}ResponseSchema = Type.Object({
  data: {Feature}Schema,
  requestId: Type.Optional(Type.String()),
  timestamp: Type.Optional(Type.String({ format: 'date-time' })),
}, { $id: '{Feature}Response' })

export const {Feature}ListResponseSchema = Type.Object({
  data: Type.Array({Feature}Schema),
  pagination: PaginationResponseSchema, // From common/schemas/response.schemas.ts
  requestId: Type.Optional(Type.String()),
  timestamp: Type.Optional(Type.String({ format: 'date-time' })),
}, { $id: '{Feature}ListResponse' })

// 6. Export TypeScript Types
export type {Feature} = Static<typeof {Feature}Schema>
export type Create{Feature} = Static<typeof Create{Feature}Schema>
export type Update{Feature} = Static<typeof Update{Feature}Schema>
export type {Feature}ListQuery = Static<typeof {Feature}ListQuerySchema>
```

## Route Documentation Template

**File Structure**: Each feature route file follows this exact pattern.

```ts
// src/features/{feature}/{feature}.routes.ts
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'
import * as schemas from './{feature}.schema'
import { ErrorResponseSchema } from '../../common/schemas/error.schema'

export const {feature}Routes: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<TypeBoxTypeProvider>()

  // GET /{features}/:id - Single resource
  app.get('/{features}/:id', {
    schema: {
      tags: ['{Features}'],
      summary: 'Get {feature} by ID',
      description: 'Retrieve a single {feature} by its unique identifier',
      security: [{ bearerAuth: [] }],
      params: schemas.{Feature}ParamsSchema,
      response: {
        200: schemas.{Feature}ResponseSchema,
        404: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, {feature}Controller.getById)

  // GET /{features} - List with pagination
  app.get('/{features}', {
    schema: {
      tags: ['{Features}'],
      summary: 'List {features}',
      description: 'Get paginated list of {features} with optional filtering',
      security: [{ bearerAuth: [] }],
      querystring: schemas.{Feature}ListQuerySchema,
      response: {
        200: schemas.{Feature}ListResponseSchema,
        400: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, {feature}Controller.list)

  // POST /{features} - Create new resource
  app.post('/{features}', {
    schema: {
      tags: ['{Features}'],
      summary: 'Create {feature}',
      description: 'Create a new {feature}',
      security: [{ bearerAuth: [] }],
      body: schemas.Create{Feature}Schema,
      response: {
        201: schemas.{Feature}ResponseSchema,
        400: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, {feature}Controller.create)

  // PUT /{features}/:id - Update existing resource
  app.put('/{features}/:id', {
    schema: {
      tags: ['{Features}'],
      summary: 'Update {feature}',
      description: 'Update an existing {feature}',
      security: [{ bearerAuth: [] }],
      params: schemas.{Feature}ParamsSchema,
      body: schemas.Update{Feature}Schema,
      response: {
        200: schemas.{Feature}ResponseSchema,
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, {feature}Controller.update)

  // DELETE /{features}/:id - Delete resource
  app.delete('/{features}/:id', {
    schema: {
      tags: ['{Features}'],
      summary: 'Delete {feature}',
      description: 'Delete a {feature} by ID',
      security: [{ bearerAuth: [] }],
      params: schemas.{Feature}ParamsSchema,
      response: {
        204: Type.Null(),
        404: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, {feature}Controller.delete)
}
```

## Common Schema Library

Create reusable schema components to maintain consistency across all features.

```ts
// src/common/schemas/base.schemas.ts
import { Type } from '@sinclair/typebox'

// Pagination Schemas
export const PaginationQuerySchema = Type.Object(
  {
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 20 })
    ),
    cursor: Type.Optional(Type.String()),
  },
  { $id: 'PaginationQuery' }
)

export const PaginationResponseSchema = Type.Object(
  {
    limit: Type.Integer(),
    cursor: Type.Optional(
      Type.Object({
        next: Type.Optional(Type.String()),
        prev: Type.Optional(Type.String()),
      })
    ),
  },
  { $id: 'PaginationResponse' }
)

// Sorting Schemas
export const SortQuerySchema = Type.Object(
  {
    sortBy: Type.Optional(
      Type.Union([
        Type.Literal('createdAt'),
        Type.Literal('name'),
        Type.Literal('updatedAt'),
      ])
    ),
    sortDir: Type.Optional(
      Type.Union([Type.Literal('asc'), Type.Literal('desc')], {
        default: 'desc',
      })
    ),
  },
  { $id: 'SortQuery' }
)

// Visibility Schema
export const VisibilitySchema = Type.Union(
  [Type.Literal('PUBLIC'), Type.Literal('PRIVATE'), Type.Literal('HIDDEN')],
  { $id: 'Visibility' }
)

// Base Entity Fields
export const BaseEntitySchema = Type.Object(
  {
    id: Type.String({ format: 'uuid' }),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  },
  { $id: 'BaseEntity' }
)

// Ownership Fields
export const OwnedEntitySchema = Type.Intersect(
  [
    BaseEntitySchema,
    Type.Object({
      ownerId: Type.String({ format: 'uuid' }),
      visibility: VisibilitySchema,
    }),
  ],
  { $id: 'OwnedEntity' }
)
```

## Error Response Schema

Standardized error responses for consistent API documentation.

```ts
// src/common/schemas/error.schema.ts
import { Type } from '@sinclair/typebox'

export const ErrorDetailSchema = Type.Object(
  {
    path: Type.Optional(Type.String()),
    field: Type.Optional(Type.String()),
    message: Type.Optional(Type.String()),
  },
  { $id: 'ErrorDetail' }
)

export const ErrorResponseSchema = Type.Object(
  {
    error: Type.Object({
      code: Type.String(),
      message: Type.String(),
      status: Type.Integer(),
      details: Type.Optional(Type.Array(ErrorDetailSchema)),
      method: Type.Optional(Type.String()),
      path: Type.Optional(Type.String()),
    }),
    requestId: Type.Optional(Type.String()),
    timestamp: Type.String({ format: 'date-time' }),
  },
  { $id: 'ErrorResponse' }
)
```

## AI Coding Instructions

When creating new API documentation for any feature, follow this exact process:

### Step 1: Create Schema File

1. Copy the schema template above
2. Replace `{Feature}` with PascalCase feature name (e.g., `Character`)
3. Replace `{feature}` with camelCase feature name (e.g., `character`)
4. Replace `{features}` with plural kebab-case (e.g., `characters`)
5. Add feature-specific fields to the base schema
6. Add feature-specific query filters

### Step 2: Create Route File

1. Copy the route template above
2. Apply the same name replacements
3. Import the schema file
4. Connect to controller methods

### Step 3: Add Response Codes

**Standard Response Codes by Method:**

- **GET (single)**: 200, 404, 403, 500
- **GET (list)**: 200, 400, 500
- **POST**: 201, 400, 409, 500
- **PUT**: 200, 400, 404, 403, 500
- **DELETE**: 204, 404, 403, 500

### Step 4: Tag Naming Convention

- Use PascalCase for tag names
- Match feature name exactly
- Examples: `Characters`, `Items`, `Auth`, `Users`

### Step 5: Security Requirements

- Add `security: [{ bearerAuth: [] }]` to all protected endpoints
- Public endpoints (like registration) omit security
- Health checks omit security

## Validation and Quality Checks

### Automated OpenAPI Validation

```bash
# Add to CI/CD pipeline
curl -f http://localhost:3000/docs/json > openapi.json
npx @apidevtools/swagger-parser validate openapi.json
```

### Schema Consistency Checks

1. All schemas have `$id` fields
2. Response schemas follow envelope pattern
3. Error responses use shared `ErrorResponseSchema`
4. Query parameters use common base schemas
5. All routes properly tagged

## Documentation Testing

```ts
// Test OpenAPI generation
test('OpenAPI spec generation', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/docs/json',
  })

  expect(response.statusCode).toBe(200)
  const spec = response.json()

  // Validate required sections
  expect(spec.openapi).toBeDefined()
  expect(spec.info).toBeDefined()
  expect(spec.paths).toBeDefined()
  expect(spec.components.schemas).toBeDefined()

  // Validate schema references
  expect(spec.components.schemas.Character).toBeDefined()
  expect(spec.components.schemas.ErrorResponse).toBeDefined()
})
```

This system ensures every API feature has complete, consistent, and
automatically validated documentation that stays in sync with the actual
implementation.
