import { Type, type TSchema } from '@sinclair/typebox'

/**
 * Base response schemas for consistent API responses
 */

// Standard pagination metadata
export const PaginationMetaSchema = Type.Object({
    page: Type.Number({ minimum: 1 }),
    limit: Type.Number({ minimum: 1, maximum: 100 }),
    total: Type.Number({ minimum: 0 }),
    totalPages: Type.Number({ minimum: 0 }),
    hasNext: Type.Boolean(),
    hasPrev: Type.Boolean(),
})

// Cursor-based pagination metadata
export const CursorPaginationMetaSchema = Type.Object({
    limit: Type.Number({ minimum: 1, maximum: 100 }),
    hasNext: Type.Boolean(),
    hasPrev: Type.Boolean(),
    startCursor: Type.Optional(Type.String()),
    endCursor: Type.Optional(Type.String()),
})

// Base success response wrapper
export const SuccessResponseSchema = <T extends TSchema>(dataSchema: T) =>
    Type.Object({
        success: Type.Literal(true),
        data: dataSchema,
        requestId: Type.Optional(Type.String()),
        timestamp: Type.Optional(Type.String({ format: 'date-time' })),
    })

// Paginated response wrapper
export const PaginatedResponseSchema = <T extends TSchema>(itemSchema: T) =>
    Type.Object({
        success: Type.Literal(true),
        data: Type.Array(itemSchema),
        meta: PaginationMetaSchema,
        requestId: Type.Optional(Type.String()),
        timestamp: Type.Optional(Type.String({ format: 'date-time' })),
    })

// Cursor paginated response wrapper
export const CursorPaginatedResponseSchema = <T extends TSchema>(itemSchema: T) =>
    Type.Object({
        success: Type.Literal(true),
        data: Type.Array(itemSchema),
        meta: CursorPaginationMetaSchema,
        requestId: Type.Optional(Type.String()),
        timestamp: Type.Optional(Type.String({ format: 'date-time' })),
    })

// Error detail schema
export const ErrorDetailSchema = Type.Object({
    path: Type.Optional(Type.String()),
    field: Type.Optional(Type.String()),
    message: Type.Optional(Type.String()),
})

// Error response schema
export const ErrorResponseSchema = Type.Object({
    error: Type.Object({
        code: Type.String(),
        message: Type.String(),
        status: Type.Number(),
        details: Type.Optional(Type.Array(ErrorDetailSchema)),
        method: Type.Optional(Type.String()),
        path: Type.Optional(Type.String()),
    }),
    requestId: Type.Optional(Type.String()),
    timestamp: Type.Optional(Type.String({ format: 'date-time' })),
})

// Statistics response schema
export const StatsResponseSchema = Type.Object({
    success: Type.Literal(true),
    data: Type.Object({
        total: Type.Number({ minimum: 0 }),
        active: Type.Optional(Type.Number({ minimum: 0 })),
        inactive: Type.Optional(Type.Number({ minimum: 0 })),
        recentlyCreated: Type.Optional(Type.Number({ minimum: 0 })),
        recentlyUpdated: Type.Optional(Type.Number({ minimum: 0 })),
    }),
    requestId: Type.Optional(Type.String()),
    timestamp: Type.Optional(Type.String({ format: 'date-time' })),
})

// Common query parameters
export const PaginationQuerySchema = Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
})

export const CursorPaginationQuerySchema = Type.Object({
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
    cursor: Type.Optional(Type.String()),
    direction: Type.Optional(
        Type.Union([Type.Literal('asc'), Type.Literal('desc')], { default: 'asc' })
    ),
})

export const SearchQuerySchema = Type.Object({
    search: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
})

export const FilterQuerySchema = Type.Object({
    visibility: Type.Optional(Type.Union([Type.Literal('PUBLIC'), Type.Literal('PRIVATE')])),
    ownerId: Type.Optional(Type.String({ format: 'uuid' })),
})

// Standard parameter schemas
export const IdParamSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
})

// Standard HTTP status responses
export const StandardResponses = {
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    403: ErrorResponseSchema,
    404: ErrorResponseSchema,
    409: ErrorResponseSchema,
    422: ErrorResponseSchema,
    429: ErrorResponseSchema,
    500: ErrorResponseSchema,
} as const
