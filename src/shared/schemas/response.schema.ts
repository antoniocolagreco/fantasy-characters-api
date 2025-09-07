import { type Static, type TSchema, Type } from '@sinclair/typebox'

/**
 * Response schemas for consistent API responses
 * Clean, minimal, schema-first approach
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

// Schema factory functions (single source of truth)
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

// Domain layer pagination result schema (no HTTP envelope)
export const createPaginatedResultSchema = <T extends TSchema>(itemSchema: T, schemaId?: string) =>
    Type.Object(
        {
            data: Type.Array(itemSchema),
            pagination: PaginationSchema,
        },
        schemaId ? { $id: schemaId } : {}
    )

// Export TypeScript types derived from schemas
export type BaseResponse = Static<typeof BaseResponseSchema>
export type Pagination = Static<typeof PaginationSchema>

// Domain layer type derived from schema (service/repository layer, no HTTP envelope)
export type PaginatedResultOf<T> = {
    data: T[]
    pagination: Pagination
}
