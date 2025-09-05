import { type Static, type TSchema, Type } from '@sinclair/typebox'

/**
 * Base response schemas for consistent API responses
 */

// Base response envelope schema
export const BaseResponseSchema = Type.Object(
    {
        requestId: Type.Optional(Type.String()),
        timestamp: Type.Optional(Type.String({ format: 'date-time' })),
    },
    { $id: 'BaseResponse' }
)

// Cursor-based pagination metadata
export const PaginationSchema = Type.Object(
    {
        limit: Type.Number({ minimum: 1, maximum: 100 }),
        hasNext: Type.Boolean(),
        hasPrev: Type.Boolean(),
        startCursor: Type.Optional(Type.String()),
        endCursor: Type.Optional(Type.String()),
    },
    { $id: 'Pagination' }
)

// Base success response wrapper
export const SuccessResponseSchema = <T extends TSchema>(dataSchema: T) =>
    Type.Intersect([
        BaseResponseSchema,
        Type.Object({
            data: dataSchema,
        }),
    ])

// Cursor paginated response wrapper
export const PaginatedResponseSchema = <T extends TSchema>(itemSchema: T) =>
    Type.Intersect([
        BaseResponseSchema,
        Type.Object({
            data: Type.Array(itemSchema),
            pagination: PaginationSchema,
        }),
    ])

// Concrete OpenAPI-compatible schemas (for documentation)
export const GenericSuccessResponseSchema = Type.Intersect(
    [
        BaseResponseSchema,
        Type.Object({
            data: Type.Any(),
        }),
    ],
    { $id: 'SuccessResponse' }
)

export const GenericPaginatedResponseSchema = Type.Intersect(
    [
        BaseResponseSchema,
        Type.Object({
            data: Type.Array(Type.Any()),
            pagination: PaginationSchema,
        }),
    ],
    { $id: 'PaginatedResponse' }
)

// Helper function to create specific response schemas with proper $id
export const createSuccessResponseSchema = <T extends TSchema>(dataSchema: T, schemaId?: string) =>
    Type.Intersect(
        [
            BaseResponseSchema,
            Type.Object({
                data: dataSchema,
            }),
        ],
        schemaId ? { $id: schemaId } : {}
    )

export const createPaginatedResponseSchema = <T extends TSchema>(
    itemSchema: T,
    schemaId?: string
) =>
    Type.Intersect(
        [
            BaseResponseSchema,
            Type.Object({
                data: Type.Array(itemSchema),
                pagination: PaginationSchema,
            }),
        ],
        schemaId ? { $id: schemaId } : {}
    )

// Standard HTTP status responses (reusing ErrorResponseSchema from error.schema.ts)
export const StandardResponses = {
    400: { $ref: 'ErrorResponse#' },
    401: { $ref: 'ErrorResponse#' },
    403: { $ref: 'ErrorResponse#' },
    404: { $ref: 'ErrorResponse#' },
    409: { $ref: 'ErrorResponse#' },
    422: { $ref: 'ErrorResponse#' },
    429: { $ref: 'ErrorResponse#' },
    500: { $ref: 'ErrorResponse#' },
} as const

// Export TypeScript types derived from schemas
export type BaseResponse = Static<typeof BaseResponseSchema>
export type Pagination = Static<typeof PaginationSchema>

// Types for factory functions using ReturnType + Static (with proper constraints)
export type SuccessResponse<T extends TSchema> = Static<ReturnType<typeof SuccessResponseSchema<T>>>
export type PaginatedResponse<T extends TSchema> = Static<
    ReturnType<typeof PaginatedResponseSchema<T>>
>

// Alternative: Helper types for common use cases (more flexible)
export type SuccessResponseOf<T> = {
    data: T
    requestId?: string
    timestamp?: string
}

export type PaginatedResponseOf<T> = {
    data: T[]
    pagination: Pagination
    requestId?: string
    timestamp?: string
}
