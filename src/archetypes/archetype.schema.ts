/**
 * Archetype validation schemas using TypeBox
 * Defines input validation and serialization schemas for archetype endpoints
 */

import { Type } from '@sinclair/typebox'
import { notModifiedResponse } from '../shared/cache.schema'

// Base archetype response schema
export const ArchetypeResponseSchema = Type.Object(
  {
    id: Type.String({ description: 'Archetype ID' }),
    name: Type.String({ description: 'Archetype name' }),
    description: Type.Union([Type.String(), Type.Null()], {
      description: 'Archetype description',
    }),
    imageId: Type.Union([Type.String(), Type.Null()], {
      description: 'Associated image ID',
    }),
    ownerId: Type.Union([Type.String(), Type.Null()], {
      description: 'Owner user ID (null for orphaned archetypes)',
    }),
    visibility: Type.String({
      enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'],
      description: 'Archetype visibility level',
    }),
    createdAt: Type.String({ format: 'date-time', description: 'Creation timestamp' }),
    updatedAt: Type.String({ format: 'date-time', description: 'Last update timestamp' }),
  },
  {
    $id: 'ArchetypeResponseSchema',
    description: 'Archetype response data schema',
  },
)

// Create archetype schema
export const CreateArchetypeSchema = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      maxLength: 100,
      description: 'Archetype name (must be unique)',
    }),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Archetype description',
      }),
    ),
    imageId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Associated image ID',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'],
        default: 'PUBLIC',
        description: 'Archetype visibility level',
      }),
    ),
    tagIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        maxItems: 20,
        description: 'Array of tag IDs to associate',
      }),
    ),
    skillIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        maxItems: 50,
        description: 'Array of skill IDs to associate',
      }),
    ),
    requiredRaceIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        maxItems: 20,
        description: 'Array of required race IDs',
      }),
    ),
  },
  {
    $id: 'CreateArchetypeSchema',
    description: 'Schema for creating a new archetype',
  },
)

// Update archetype schema
export const UpdateArchetypeSchema = Type.Object(
  {
    name: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Archetype name (must be unique)',
      }),
    ),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Archetype description',
      }),
    ),
    imageId: Type.Optional(
      Type.Union([Type.String({ format: 'uuid' }), Type.Null()], {
        description: 'Associated image ID (null to remove)',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'],
        description: 'Archetype visibility level',
      }),
    ),
    tagIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        maxItems: 20,
        description: 'Array of tag IDs to associate (replaces existing)',
      }),
    ),
    skillIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        maxItems: 50,
        description: 'Array of skill IDs to associate (replaces existing)',
      }),
    ),
    requiredRaceIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        maxItems: 20,
        description: 'Array of required race IDs (replaces existing)',
      }),
    ),
  },
  {
    $id: 'UpdateArchetypeSchema',
    description: 'Schema for updating an existing archetype',
  },
)

// List archetypes query schema
export const ListArchetypesQuerySchema = Type.Object(
  {
    page: Type.Optional(
      Type.Integer({
        minimum: 1,
        default: 1,
        description: 'Page number for pagination',
      }),
    ),
    limit: Type.Optional(
      Type.Integer({
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Number of items per page',
      }),
    ),
    search: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Search term for archetype name or description',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'],
        description: 'Filter by visibility level',
      }),
    ),
    ownerId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Filter by owner ID',
      }),
    ),
    hasImage: Type.Optional(
      Type.Boolean({
        description: 'Filter archetypes with or without images',
      }),
    ),
    tagId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Filter by associated tag ID',
      }),
    ),
    skillId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Filter by associated skill ID',
      }),
    ),
    requiredRaceId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Filter by required race ID',
      }),
    ),
  },
  {
    $id: 'ListArchetypesQuerySchema',
    description: 'Query parameters for listing archetypes',
  },
)

// Archetype statistics schema
export const ArchetypeStatsSchema = Type.Object(
  {
    totalCount: Type.Integer({ description: 'Total number of archetypes' }),
    byVisibility: Type.Record(Type.String(), Type.Integer(), {
      description: 'Count by visibility level',
    }),
    byOwnership: Type.Array(
      Type.Object({
        ownerId: Type.Union([Type.String(), Type.Null()], {
          description: 'Owner ID or null for orphaned',
        }),
        count: Type.Integer({ description: 'Number of archetypes' }),
      }),
      { description: 'Count by ownership' },
    ),
    skillsDistribution: Type.Record(Type.Integer(), Type.Integer(), {
      description: 'Distribution by number of skills',
    }),
    requiredRacesDistribution: Type.Record(Type.Integer(), Type.Integer(), {
      description: 'Distribution by number of required races',
    }),
    tagsDistribution: Type.Record(Type.Integer(), Type.Integer(), {
      description: 'Distribution by number of tags',
    }),
    charactersDistribution: Type.Record(Type.Integer(), Type.Integer(), {
      description: 'Distribution by number of characters',
    }),
    averageSkillsPerArchetype: Type.Number({
      description: 'Average number of skills per archetype',
    }),
    averageRequiredRacesPerArchetype: Type.Number({
      description: 'Average number of required races per archetype',
    }),
    averageTagsPerArchetype: Type.Number({
      description: 'Average number of tags per archetype',
    }),
    averageCharactersPerArchetype: Type.Number({
      description: 'Average number of characters per archetype',
    }),
  },
  {
    $id: 'ArchetypeStatsSchema',
    description: 'Archetype statistics response schema',
  },
)

// Request parameter schemas
export const ArchetypeParamsSchema = Type.Object(
  {
    id: Type.String({ description: 'Archetype ID' }),
  },
  {
    $id: 'ArchetypeParamsSchema',
    description: 'Archetype parameters schema',
  },
)

// Error response schema
export const ArchetypeErrorSchema = Type.Object(
  {
    message: Type.String({ description: 'Error message' }),
    statusCode: Type.Integer({ description: 'HTTP status code' }),
    error: Type.String({ description: 'Error type' }),
  },
  {
    $id: 'ArchetypeErrorSchema',
    description: 'Archetype error response schema',
  },
)

// Validation schemas export
export const createArchetypeSchema = CreateArchetypeSchema
export const updateArchetypeSchema = UpdateArchetypeSchema
export const listArchetypesQuerySchema = ListArchetypesQuerySchema

// Route schemas for Fastify
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
 * Cached Endpoints: GET /archetypes, GET /archetypes/:id, GET /archetypes/stats
 */

export const createArchetypeRouteSchema = {
  tags: ['Archetypes'],
  summary: 'Create a new archetype',
  description: 'Create a new archetype with skills and race requirements',
  body: CreateArchetypeSchema,
  response: {
    201: ArchetypeResponseSchema,
    400: ArchetypeErrorSchema,
    401: ArchetypeErrorSchema,
    409: ArchetypeErrorSchema,
  },
}

export const getArchetypeRouteSchema = {
  tags: ['Archetypes'],
  summary: 'Get archetype by ID',
  description: 'Retrieve a specific archetype by its ID',
  params: ArchetypeParamsSchema,
  response: {
    200: ArchetypeResponseSchema,
    304: notModifiedResponse,
    404: ArchetypeErrorSchema,
  },
}

export const updateArchetypeRouteSchema = {
  tags: ['Archetypes'],
  summary: 'Update archetype',
  description: 'Update an existing archetype by ID',
  params: ArchetypeParamsSchema,
  body: UpdateArchetypeSchema,
  response: {
    200: ArchetypeResponseSchema,
    400: ArchetypeErrorSchema,
    401: ArchetypeErrorSchema,
    403: ArchetypeErrorSchema,
    404: ArchetypeErrorSchema,
    409: ArchetypeErrorSchema,
  },
}

export const deleteArchetypeRouteSchema = {
  tags: ['Archetypes'],
  summary: 'Delete archetype',
  description: 'Delete an archetype by ID',
  params: ArchetypeParamsSchema,
  response: {
    204: { type: 'null' },
    400: ArchetypeErrorSchema,
    401: ArchetypeErrorSchema,
    403: ArchetypeErrorSchema,
    404: ArchetypeErrorSchema,
  },
}

export const listArchetypesRouteSchema = {
  tags: ['Archetypes'],
  summary: 'List archetypes',
  description: 'List archetypes with optional filtering and pagination',
  querystring: ListArchetypesQuerySchema,
  response: {
    200: {
      type: 'object',
      properties: {
        archetypes: {
          type: 'array',
          items: ArchetypeResponseSchema,
        },
        pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'integer' },
            totalPages: { type: 'integer' },
            totalCount: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
    304: notModifiedResponse,
  },
}

export const archetypeStatsRouteSchema = {
  tags: ['Archetypes'],
  summary: 'Get archetype statistics',
  description: 'Get comprehensive statistics about archetypes',
  response: {
    200: ArchetypeStatsSchema,
    304: notModifiedResponse,
    401: ArchetypeErrorSchema,
    403: ArchetypeErrorSchema,
  },
}
