import { Type } from '@sinclair/typebox'
import { notModifiedResponse } from '../shared/cache.schema'

// Visibility enum values
const VISIBILITY_VALUES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const

// Perk schemas
export const perkSchema = Type.Object(
  {
    id: Type.String({ description: 'Unique perk identifier' }),
    name: Type.String({
      minLength: 1,
      maxLength: 100,
      description: 'Perk name (unique)',
      examples: ['Toughness', 'Magic Affinity', 'Charismatic'],
    }),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Optional perk description',
        examples: ['Increases maximum health by 20%', 'Improves all social interactions'],
      }),
    ),
    requiredLevel: Type.Number({
      minimum: 0,
      maximum: 100,
      default: 0,
      description: 'Minimum level required to acquire this perk',
      examples: [0, 5, 15],
    }),
    imageId: Type.Optional(Type.String({ description: 'ID of the perk image' })),
    ownerId: Type.Optional(Type.String({ description: 'ID of the user who created the perk' })),
    visibility: Type.String({
      enum: VISIBILITY_VALUES,
      description: 'Perk visibility level',
      default: 'PUBLIC',
    }),
    createdAt: Type.String({ format: 'date-time', description: 'Creation timestamp' }),
    updatedAt: Type.String({ format: 'date-time', description: 'Last update timestamp' }),
  },
  { $id: 'Perk' },
)

// Create perk request schema
export const createPerkSchema = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      maxLength: 100,
      description: 'Perk name (must be unique)',
      examples: ['Toughness', 'Magic Affinity'],
    }),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Optional perk description',
      }),
    ),
    requiredLevel: Type.Optional(
      Type.Number({
        minimum: 0,
        maximum: 100,
        default: 0,
        description: 'Minimum level required to acquire this perk',
      }),
    ),
    imageId: Type.Optional(
      Type.String({
        description: 'ID of the perk image',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Perk visibility level',
        default: 'PUBLIC',
      }),
    ),
  },
  { $id: 'CreatePerk' },
)

// Update perk request schema
export const updatePerkSchema = Type.Object(
  {
    name: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Updated perk name',
      }),
    ),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Updated perk description',
      }),
    ),
    requiredLevel: Type.Optional(
      Type.Number({
        minimum: 0,
        maximum: 100,
        description: 'Updated minimum level required',
      }),
    ),
    imageId: Type.Optional(
      Type.String({
        description: 'Updated perk image ID',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Updated visibility level',
      }),
    ),
  },
  { $id: 'UpdatePerk' },
)

// List perks query schema
export const listPerksQuerySchema = Type.Object(
  {
    page: Type.Optional(Type.Number({ minimum: 1, default: 1, description: 'Page number' })),
    limit: Type.Optional(
      Type.Number({ minimum: 1, maximum: 100, default: 20, description: 'Items per page' }),
    ),
    minLevel: Type.Optional(
      Type.Number({
        minimum: 0,
        maximum: 100,
        description: 'Filter by minimum required level',
      }),
    ),
    maxLevel: Type.Optional(
      Type.Number({
        minimum: 0,
        maximum: 100,
        description: 'Filter by maximum required level',
      }),
    ),
    search: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Search perks by name or description',
      }),
    ),
  },
  { $id: 'ListPerksQuery' },
)

// List perks response schema
export const listPerksResponseSchema = Type.Object(
  {
    data: Type.Array(perkSchema, { description: 'Array of perks' }),
    pagination: Type.Object({
      page: Type.Number({ description: 'Current page number' }),
      limit: Type.Number({ description: 'Items per page' }),
      total: Type.Number({ description: 'Total number of items' }),
      totalPages: Type.Number({ description: 'Total number of pages' }),
    }),
  },
  { $id: 'ListPerksResponse' },
)

// Perk statistics response schema
export const perkStatsResponseSchema = Type.Object(
  {
    totalPerks: Type.Number({ description: 'Total number of perks' }),
    publicPerks: Type.Number({ description: 'Number of public perks' }),
    privatePerks: Type.Number({ description: 'Number of private perks' }),
    orphanedPerks: Type.Number({ description: 'Number of perks with no owner' }),
    averageRequiredLevel: Type.Number({ description: 'Average required level across all perks' }),
    perksByLevelRange: Type.Object({
      noRequirement: Type.Number({ description: 'Perks with required level 0' }),
      beginner: Type.Number({ description: 'Perks with required level 1-10' }),
      intermediate: Type.Number({ description: 'Perks with required level 11-25' }),
      advanced: Type.Number({ description: 'Perks with required level 26-50' }),
      expert: Type.Number({ description: 'Perks with required level 51+' }),
    }),
  },
  { $id: 'PerkStatsResponse' },
)

// Error response schemas
export const perkNotFoundSchema = Type.Object({
  error: Type.String({ default: 'Not Found' }),
  message: Type.String({ default: 'Perk not found' }),
  statusCode: Type.Number({ default: 404 }),
})

export const perkConflictSchema = Type.Object({
  error: Type.String({ default: 'Conflict' }),
  message: Type.String({ default: 'Perk with this name already exists' }),
  statusCode: Type.Number({ default: 409 }),
})

export const perkValidationErrorSchema = Type.Object({
  error: Type.String({ default: 'Bad Request' }),
  message: Type.String({ default: 'Validation failed' }),
  statusCode: Type.Number({ default: 400 }),
})

export const perkUnauthorizedErrorSchema = Type.Object({
  error: Type.String({ default: 'Unauthorized' }),
  message: Type.String({ default: 'Insufficient permissions' }),
  statusCode: Type.Number({ default: 401 }),
})

// Route schemas for Fastify endpoints

/*
 * CACHE HEADERS DOCUMENTATION
 * ===========================
 *
 * The following GET endpoints support HTTP caching with these automatic headers:
 *
 * Response Headers:
 * - Cache-Control: public, max-age=300 (configurable, see cache.middleware.ts)
 * - ETag: "hash-of-content" (for conditional requests and cache validation)
 * - Last-Modified: HTTP date format (when resource was last updated)
 * - Age: Number (seconds since response was cached)
 * - X-Cache: "HIT" | "MISS" (indicates if response was served from cache)
 * - Expires: HTTP date (absolute expiration time)
 *
 * Request Headers (Conditional Requests):
 * - If-None-Match: Client sends ETag to check if resource changed
 * - If-Modified-Since: Client sends date to check if resource was modified
 *
 * Status Codes:
 * - 200: Resource returned with cache headers
 * - 304: Not Modified (resource unchanged, use cached version)
 *
 * Cached Endpoints: GET /perks, GET /perks/:id, GET /perks/stats
 */

export const createPerkRouteSchema = {
  description: 'Create a new perk',
  tags: ['Perks'],
  body: createPerkSchema,
  response: {
    201: perkSchema,
    400: perkValidationErrorSchema,
    401: perkUnauthorizedErrorSchema,
    409: perkConflictSchema,
  },
}

export const getPerkRouteSchema = {
  description: 'Get perk by ID',
  tags: ['Perks'],
  params: Type.Object({
    id: Type.String({ description: 'Perk ID' }),
  }),
  response: {
    200: perkSchema,
    304: notModifiedResponse,
    404: perkNotFoundSchema,
    401: perkUnauthorizedErrorSchema,
  },
}

export const updatePerkRouteSchema = {
  description: 'Update perk by ID',
  tags: ['Perks'],
  params: Type.Object({
    id: Type.String({ description: 'Perk ID' }),
  }),
  body: updatePerkSchema,
  response: {
    200: perkSchema,
    400: perkValidationErrorSchema,
    404: perkNotFoundSchema,
    401: perkUnauthorizedErrorSchema,
    409: perkConflictSchema,
  },
}

export const deletePerkRouteSchema = {
  description: 'Delete perk by ID',
  tags: ['Perks'],
  params: Type.Object({
    id: Type.String({ description: 'Perk ID' }),
  }),
  response: {
    204: Type.Null(),
    404: perkNotFoundSchema,
    401: perkUnauthorizedErrorSchema,
  },
}

export const listPerksRouteSchema = {
  description: 'List perks with pagination and filtering',
  tags: ['Perks'],
  querystring: listPerksQuerySchema,
  response: {
    200: listPerksResponseSchema,
    304: notModifiedResponse,
  },
}

export const perkStatsRouteSchema = {
  description: 'Get perk statistics',
  tags: ['Perks'],
  response: {
    200: perkStatsResponseSchema,
    304: notModifiedResponse,
  },
}
