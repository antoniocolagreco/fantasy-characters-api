import { Type } from '@sinclair/typebox'
import { notModifiedResponse } from '../shared/cache.schema'

// Visibility enum values
const VISIBILITY_VALUES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const

// Skill schemas
export const skillSchema = Type.Object(
  {
    id: Type.String({ description: 'Unique skill identifier' }),
    name: Type.String({
      minLength: 1,
      maxLength: 100,
      description: 'Skill name (unique)',
      examples: ['Fireball', 'Stealth', 'Swordsmanship'],
    }),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Optional skill description',
        examples: ['A powerful spell that launches a ball of fire at enemies'],
      }),
    ),
    requiredLevel: Type.Number({
      minimum: 1,
      maximum: 100,
      default: 1,
      description: 'Minimum level required to learn this skill',
      examples: [1, 10, 25],
    }),
    imageId: Type.Optional(Type.String({ description: 'ID of the skill image' })),
    ownerId: Type.Optional(Type.String({ description: 'ID of the user who created the skill' })),
    visibility: Type.String({
      enum: VISIBILITY_VALUES,
      description: 'Skill visibility level',
      default: 'PUBLIC',
    }),
    createdAt: Type.String({ format: 'date-time', description: 'Creation timestamp' }),
    updatedAt: Type.String({ format: 'date-time', description: 'Last update timestamp' }),
  },
  { $id: 'Skill' },
)

// Create skill request schema
export const createSkillSchema = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      maxLength: 100,
      description: 'Skill name (must be unique)',
      examples: ['Fireball', 'Stealth'],
    }),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Optional skill description',
      }),
    ),
    requiredLevel: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 100,
        default: 1,
        description: 'Minimum level required to learn this skill',
      }),
    ),
    imageId: Type.Optional(
      Type.String({
        description: 'ID of the skill image',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Skill visibility level',
        default: 'PUBLIC',
      }),
    ),
  },
  { $id: 'CreateSkill' },
)

// Update skill request schema
export const updateSkillSchema = Type.Object(
  {
    name: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Updated skill name',
      }),
    ),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Updated skill description',
      }),
    ),
    requiredLevel: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 100,
        description: 'Updated minimum level required',
      }),
    ),
    imageId: Type.Optional(
      Type.String({
        description: 'Updated skill image ID',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Updated visibility level',
      }),
    ),
  },
  { $id: 'UpdateSkill' },
)

// List skills query schema
export const listSkillsQuerySchema = Type.Object(
  {
    page: Type.Optional(Type.Number({ minimum: 1, default: 1, description: 'Page number' })),
    limit: Type.Optional(
      Type.Number({ minimum: 1, maximum: 100, default: 20, description: 'Items per page' }),
    ),
    minLevel: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 100,
        description: 'Filter by minimum required level',
      }),
    ),
    maxLevel: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 100,
        description: 'Filter by maximum required level',
      }),
    ),
    search: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Search skills by name or description',
      }),
    ),
  },
  { $id: 'ListSkillsQuery' },
)

// List skills response schema
export const listSkillsResponseSchema = Type.Object(
  {
    data: Type.Array(skillSchema, { description: 'Array of skills' }),
    pagination: Type.Object({
      page: Type.Number({ description: 'Current page number' }),
      limit: Type.Number({ description: 'Items per page' }),
      total: Type.Number({ description: 'Total number of items' }),
      totalPages: Type.Number({ description: 'Total number of pages' }),
    }),
  },
  { $id: 'ListSkillsResponse' },
)

// Skill statistics response schema
export const skillStatsResponseSchema = Type.Object(
  {
    totalSkills: Type.Number({ description: 'Total number of skills' }),
    publicSkills: Type.Number({ description: 'Number of public skills' }),
    privateSkills: Type.Number({ description: 'Number of private skills' }),
    orphanedSkills: Type.Number({ description: 'Number of skills with no owner' }),
    averageRequiredLevel: Type.Number({ description: 'Average required level across all skills' }),
    skillsByLevelRange: Type.Object({
      beginner: Type.Number({ description: 'Skills with required level 1-10' }),
      intermediate: Type.Number({ description: 'Skills with required level 11-25' }),
      advanced: Type.Number({ description: 'Skills with required level 26-50' }),
      expert: Type.Number({ description: 'Skills with required level 51+' }),
    }),
  },
  { $id: 'SkillStatsResponse' },
)

// Error response schemas
export const skillNotFoundSchema = Type.Object({
  error: Type.String({ default: 'Not Found' }),
  message: Type.String({ default: 'Skill not found' }),
  statusCode: Type.Number({ default: 404 }),
})

export const skillConflictSchema = Type.Object({
  error: Type.String({ default: 'Conflict' }),
  message: Type.String({ default: 'Skill with this name already exists' }),
  statusCode: Type.Number({ default: 409 }),
})

export const skillValidationErrorSchema = Type.Object({
  error: Type.String({ default: 'Bad Request' }),
  message: Type.String({ default: 'Validation failed' }),
  statusCode: Type.Number({ default: 400 }),
})

export const skillUnauthorizedErrorSchema = Type.Object({
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
 * Cached Endpoints: GET /skills, GET /skills/:id, GET /skills/stats
 */

export const createSkillRouteSchema = {
  description: 'Create a new skill',
  tags: ['Skills'],
  body: createSkillSchema,
  response: {
    201: skillSchema,
    400: skillValidationErrorSchema,
    401: skillUnauthorizedErrorSchema,
    409: skillConflictSchema,
  },
}

export const getSkillRouteSchema = {
  description: 'Get skill by ID',
  tags: ['Skills'],
  params: Type.Object({
    id: Type.String({ description: 'Skill ID' }),
  }),
  response: {
    200: skillSchema,
    304: notModifiedResponse,
    404: skillNotFoundSchema,
    401: skillUnauthorizedErrorSchema,
  },
}

export const updateSkillRouteSchema = {
  description: 'Update skill by ID',
  tags: ['Skills'],
  params: Type.Object({
    id: Type.String({ description: 'Skill ID' }),
  }),
  body: updateSkillSchema,
  response: {
    200: skillSchema,
    400: skillValidationErrorSchema,
    404: skillNotFoundSchema,
    401: skillUnauthorizedErrorSchema,
    409: skillConflictSchema,
  },
}

export const deleteSkillRouteSchema = {
  description: 'Delete skill by ID',
  tags: ['Skills'],
  params: Type.Object({
    id: Type.String({ description: 'Skill ID' }),
  }),
  response: {
    204: Type.Null(),
    404: skillNotFoundSchema,
    401: skillUnauthorizedErrorSchema,
  },
}

export const listSkillsRouteSchema = {
  description: 'List skills with pagination and filtering',
  tags: ['Skills'],
  querystring: listSkillsQuerySchema,
  response: {
    200: listSkillsResponseSchema,
    304: notModifiedResponse,
  },
}

export const skillStatsRouteSchema = {
  description: 'Get skill statistics',
  tags: ['Skills'],
  response: {
    200: skillStatsResponseSchema,
    304: notModifiedResponse,
  },
}
