# API Documentation

Comprehensive guide to create consistent OpenAPI documentation using TypeBox
schemas as the single source of truth.

## Documentation Philosophy

This system eliminates documentation drift by generating OpenAPI specs directly
from the same TypeBox schemas used for runtime validation. No manual JSON Schema
writing, no duplication, no inconsistencies.

**Core Principle**: Write schemas once in TypeBox → Auto-generate OpenAPI →
Auto-validate requests → Auto-type TypeScript

## Critical Documentation Rules

1. **Always use TypeBox as source of truth** - Prefer centralized schemas; keep
   inline JSON schemas minimal and consistent when necessary
2. **Always add $id to shared schemas** - Enables proper OpenAPI component refs
3. **Always reuse schemas** - Use Type.Pick/Omit instead of duplicating
4. **Always tag endpoints** - Group related operations for better organization
5. **Always validate OpenAPI output** - Include schema validation in CI/CD
6. **Always import from centralized schemas** - Use `src/shared/schemas` exports
   only

## ⚠️ IMPORTANT: Schema Consistency

**ALL schemas must be imported from `src/shared/schemas` centralized exports.**

```typescript
// ✅ CORRECT - Use centralized exports
import {
  PaginationQuerySchema,
  PaginationSchema,
  SortQuerySchema,
  VisibilitySchema,
  BaseEntitySchema,
  createSuccessResponseSchema,
  createPaginatedResponseSchema,
  ErrorResponseSchema,
} from '../shared/schemas'

// ❌ WRONG - Do not define pagination schemas in multiple places
export const PaginationSchema = Type.Object({ ... }) // This creates conflicts!
```

This prevents the creation of multiple incompatible pagination schemas and
ensures consistent API responses across all endpoints.

## OpenAPI Plugin Setup

Install and configure Swagger with TypeBox integration for automatic schema
generation.

```ts
// src/shared/plugins/swagger.plugin.ts
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fp from 'fastify-plugin'
import { config } from '@/infrastructure/config'

export const swaggerPlugin = fp(async function (fastify) {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Fantasy Characters API',
        description:
          'A comprehensive API for managing fantasy characters, races, classes, and equipment',
        version: '1.0.0',
        contact: {
          name: 'Antonio Colagreco',
          email: 'nevenbridge@gmail.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: `http://localhost:${config.PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token for authentication',
          },
        },
      },
      security: [{ bearerAuth: [] }], // Global security (route can override/omit)
    },
    transform: ({ schema, url }) => {
      // Custom schema transformation for OpenAPI compliance
      return { schema: cleanSchema(schema), url }
    },
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      persistAuthorization: true,
    },
    staticCSP: false,
    transformSpecificationClone: true,
  })
})
```

## Schema Organization Template (versioned HTTP layer)

**File Structure**: Each feature gets its own schema file with consistent
exports.

```ts
// src/features/{feature}/v1/{feature}.schema.ts
import { Type, Static } from '@sinclair/typebox'

// 1. Base Entity Schema (extends from BaseEntitySchema)
export const {Feature}Schema = Type.Intersect([
  BaseEntitySchema, // From shared/schemas - provides id, createdAt, updatedAt
  OwnedEntitySchema, // From shared/schemas - provides ownerId, visibility
  Type.Object({
    name: Type.String({ minLength: 1, maxLength: 80 }),
    description: Type.Optional(Type.String({ maxLength: 2000 })),
    // Feature-specific fields here
  })
], { $id: '{Feature}' })

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

// 4. Query Schemas (feature-specific sort + standard queries)
const {Feature}SortQuerySchema = Type.Object({
  sortBy: Type.Optional(Type.String({
    enum: ['createdAt', 'updatedAt', 'name'],
    description: 'Field to sort by'
  })),
  sortDir: Type.Optional(Type.String({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort direction'
  }))
}, { $id: '{Feature}SortQuery' })

export const {Feature}ListQuerySchema = Type.Intersect([
  PaginationQuerySchema,    // From shared/schemas
  SearchQuerySchema,        // From shared/schemas
  VisibilityQuerySchema,    // From shared/schemas
  {Feature}SortQuerySchema, // Feature-specific sort
  Type.Object({
    // Additional feature-specific filters here
  })
], { $id: '{Feature}ListQuery' })

// 5. Response Schemas (use factory functions from shared/schemas)
export const {Feature}ResponseSchema = createSuccessResponseSchema(
  {Feature}Schema,
  '{Feature}Response'
)

export const {Feature}ListResponseSchema = createPaginatedResponseSchema(
  {Feature}Schema,
  '{Feature}ListResponse'
)

// 6. Export TypeScript Types
export type {Feature} = Static<typeof {Feature}Schema>
export type Create{Feature} = Static<typeof Create{Feature}Schema>
export type Update{Feature} = Static<typeof Update{Feature}Schema>
export type {Feature}ListQuery = Static<typeof {Feature}ListQuerySchema>
```

## Route Documentation Template (per version)

**File Structure**: Each feature route file follows this exact pattern.

```ts
// src/features/{feature}/v1/{feature}.routes.ts
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'
import * as schemas from './{feature}.schema'
import { ErrorResponseSchema } from '@/shared/schemas'

export const {feature}RoutesV1: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<TypeBoxTypeProvider>()

  // GET /{features}/:id - Single resource
  app.get('/{features}/:id', {
    preHandler: [toFastifyPreHandler(rbac.read('{features}'))],
    schema: {
      tags: ['{Features}'],
      summary: 'Get {feature} by ID',
      description: 'Retrieve a single {feature} by its unique identifier',
      params: schemas.{Feature}ParamsSchema,
      response: {
        200: schemas.{Feature}ResponseSchema,
        400: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, {feature}Controller.get{Feature}ById)

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
    preHandler: [toFastifyPreHandler(rbac.delete('{features}'))],
    schema: {
      tags: ['{Features}'],
      summary: 'Delete {feature}',
      description: 'Delete a {feature} by ID',
      params: schemas.{Feature}ParamsSchema,
      response: {
        204: { type: 'null' },
        404: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, {feature}Controller.delete{Feature})
}
```

## Common Schema Library

Create reusable schema components to maintain consistency across all features.

```ts
// All base schemas are centralized in src/shared/schemas/
// Import them from the centralized exports:

import {
  BaseEntitySchema,
  OwnedEntitySchema,
  PaginationQuerySchema,
  SearchQuerySchema,
  VisibilityQuerySchema,
  createSuccessResponseSchema,
  createPaginatedResponseSchema,
} from '@/shared/schemas'

// Example feature schema using centralized schemas:
export const CharacterSchema = Type.Intersect(
  [
    BaseEntitySchema, // Provides: id, createdAt, updatedAt
    OwnedEntitySchema, // Provides: ownerId, visibility
    Type.Object({
      name: Type.String({ minLength: 1, maxLength: 100 }),
      level: Type.Integer({ minimum: 1, maximum: 100 }),
      raceId: Type.String({ format: 'uuid' }),
      archetypeId: Type.String({ format: 'uuid' }),
      // ... other character fields
    }),
  ],
  { $id: 'Character' }
)

// Feature-specific sort schema
const CharacterSortQuerySchema = Type.Object(
  {
    sortBy: Type.Optional(
      Type.String({
        enum: ['createdAt', 'updatedAt', 'name', 'level'],
        description: 'Field to sort by',
      })
    ),
    sortDir: Type.Optional(
      Type.String({
        enum: ['asc', 'desc'],
        default: 'desc',
        description: 'Sort direction',
      })
    ),
  },
  { $id: 'CharacterSortQuery' }
)

// Query schema composition
export const CharacterListQuerySchema = Type.Intersect(
  [
    PaginationQuerySchema,
    SearchQuerySchema,
    VisibilityQuerySchema,
    CharacterSortQuerySchema,
    Type.Object({
      minLevel: Type.Optional(Type.Integer({ minimum: 1 })),
      maxLevel: Type.Optional(Type.Integer({ minimum: 1 })),
      raceId: Type.Optional(Type.String({ format: 'uuid' })),
      archetypeId: Type.Optional(Type.String({ format: 'uuid' })),
    }),
  ],
  { $id: 'CharacterListQuery' }
)

// Response schemas using helpers
export const CharacterResponseSchema = createSuccessResponseSchema(
  CharacterSchema,
  'CharacterResponse'
)

export const CharacterListResponseSchema = createPaginatedResponseSchema(
  CharacterSchema,
  'CharacterListResponse'
)
```

## Error Response Schema

Standardized error responses for consistent API documentation.

```ts
// src/shared/schemas/error.schema.ts
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

## Coding Instructions

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

- Use `preHandler: [toFastifyPreHandler(rbac.{action}('{resource}'))]` for
  protected endpoints
- Import rbac from `@/features/auth/rbac.middleware`
- Available actions: `read`, `create`, `update`, `delete`, `manage` (when
  applicable)
- Public endpoints (e.g., auth/register, health, docs) omit preHandler
- Global swagger security is enabled; you can still add route-level `security`
  when needed or leave it implicit

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
