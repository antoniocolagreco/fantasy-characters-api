import { Type } from '@sinclair/typebox'

// Visibility enum values
const VISIBILITY_VALUES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const

// Tag schemas
export const tagSchema = Type.Object(
  {
    id: Type.String({ description: 'Unique tag identifier' }),
    name: Type.String({
      minLength: 1,
      maxLength: 50,
      description: 'Tag name (unique)',
      examples: ['magic', 'combat', 'stealth'],
    }),
    description: Type.Optional(
      Type.String({
        maxLength: 500,
        description: 'Optional tag description',
        examples: ['Tags related to magical abilities and spells'],
      }),
    ),
    ownerId: Type.Optional(Type.String({ description: 'ID of the user who created the tag' })),
    visibility: Type.String({
      enum: VISIBILITY_VALUES,
      description: 'Tag visibility level',
      default: 'PUBLIC',
    }),
    createdAt: Type.String({ format: 'date-time', description: 'Creation timestamp' }),
    updatedAt: Type.String({ format: 'date-time', description: 'Last update timestamp' }),
  },
  { $id: 'Tag' },
)

// Create tag request schema
export const createTagSchema = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      maxLength: 50,
      description: 'Tag name (must be unique)',
      examples: ['magic', 'combat'],
    }),
    description: Type.Optional(
      Type.String({
        maxLength: 500,
        description: 'Optional tag description',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Tag visibility level',
        default: 'PUBLIC',
      }),
    ),
  },
  { $id: 'CreateTag' },
)

// Update tag request schema
export const updateTagSchema = Type.Object(
  {
    name: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 50,
        description: 'Updated tag name',
      }),
    ),
    description: Type.Optional(
      Type.String({
        maxLength: 500,
        description: 'Updated tag description',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Updated visibility level',
      }),
    ),
  },
  { $id: 'UpdateTag' },
)

// List tags query schema
export const listTagsQuerySchema = Type.Object(
  {
    page: Type.Optional(Type.Number({ minimum: 1, default: 1, description: 'Page number' })),
    limit: Type.Optional(
      Type.Number({ minimum: 1, maximum: 100, default: 20, description: 'Items per page' }),
    ),
  },
  { $id: 'ListTagsQuery' },
)

// List tags response schema
export const listTagsResponseSchema = Type.Object(
  {
    data: Type.Array(tagSchema, { description: 'Array of tags' }),
    pagination: Type.Object({
      page: Type.Number({ description: 'Current page number' }),
      limit: Type.Number({ description: 'Items per page' }),
      total: Type.Number({ description: 'Total number of items' }),
      totalPages: Type.Number({ description: 'Total number of pages' }),
    }),
  },
  { $id: 'ListTagsResponse' },
)

// Tag statistics response schema
export const tagStatsResponseSchema = Type.Object(
  {
    totalTags: Type.Number({ description: 'Total number of tags' }),
    publicTags: Type.Number({ description: 'Number of public tags' }),
    privateTags: Type.Number({ description: 'Number of private tags' }),
    orphanedTags: Type.Number({ description: 'Number of tags with no owner' }),
  },
  { $id: 'TagStatsResponse' },
)

// Error response schemas
export const tagNotFoundSchema = Type.Object({
  error: Type.String({ default: 'Not Found' }),
  message: Type.String({ default: 'Tag not found' }),
  statusCode: Type.Number({ default: 404 }),
})

export const tagConflictSchema = Type.Object({
  error: Type.String({ default: 'Conflict' }),
  message: Type.String({ default: 'Tag with this name already exists' }),
  statusCode: Type.Number({ default: 409 }),
})

export const tagValidationErrorSchema = Type.Object({
  error: Type.String({ default: 'Bad Request' }),
  message: Type.String({ default: 'Validation failed' }),
  statusCode: Type.Number({ default: 400 }),
})

export const tagUnauthorizedErrorSchema = Type.Object({
  error: Type.String({ default: 'Unauthorized' }),
  message: Type.String({ default: 'Insufficient permissions' }),
  statusCode: Type.Number({ default: 401 }),
})

// Route schemas for Fastify endpoints
export const createTagRouteSchema = {
  description: 'Create a new tag',
  tags: ['Tags'],
  body: createTagSchema,
  response: {
    201: tagSchema,
    400: tagValidationErrorSchema,
    401: tagUnauthorizedErrorSchema,
    409: tagConflictSchema,
  },
}

export const getTagRouteSchema = {
  description: 'Get tag by ID',
  tags: ['Tags'],
  params: Type.Object({
    id: Type.String({ description: 'Tag ID' }),
  }),
  response: {
    200: tagSchema,
    404: tagNotFoundSchema,
    401: tagUnauthorizedErrorSchema,
  },
}

export const updateTagRouteSchema = {
  description: 'Update tag by ID',
  tags: ['Tags'],
  params: Type.Object({
    id: Type.String({ description: 'Tag ID' }),
  }),
  body: updateTagSchema,
  response: {
    200: tagSchema,
    400: tagValidationErrorSchema,
    404: tagNotFoundSchema,
    401: tagUnauthorizedErrorSchema,
    409: tagConflictSchema,
  },
}

export const deleteTagRouteSchema = {
  description: 'Delete tag by ID',
  tags: ['Tags'],
  params: Type.Object({
    id: Type.String({ description: 'Tag ID' }),
  }),
  response: {
    204: Type.Null(),
    404: tagNotFoundSchema,
    401: tagUnauthorizedErrorSchema,
  },
}

export const listTagsRouteSchema = {
  description: 'List tags with pagination and filtering',
  tags: ['Tags'],
  querystring: listTagsQuerySchema,
  response: {
    200: listTagsResponseSchema,
  },
}

export const tagStatsRouteSchema = {
  description: 'Get tag statistics',
  tags: ['Tags'],
  response: {
    200: tagStatsResponseSchema,
  },
}
