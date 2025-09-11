import { type Static, type TSchema, Type } from '@sinclair/typebox'

/**
 * Response schemas for consistent API responses
 * Clean, minimal, schema-first approach
 */

// Base response envelope schema
export const BaseResponseSchema = Type.Object(
    {
        requestId: Type.Optional(
            Type.String({
                description: 'Unique identifier for this request',
            })
        ),
        timestamp: Type.Optional(
            Type.String({
                format: 'date-time',
                description: 'When the response was generated',
            })
        ),
    },
    {
        $id: 'BaseResponse',
        title: 'Base Response',
        description: 'Common fields in all API responses',
    }
)

// Cursor-based pagination metadata
export const PaginationSchema = Type.Object(
    {
        limit: Type.Number({
            minimum: 1,
            maximum: 100,
            description: 'Number of items requested',
        }),
        hasNext: Type.Boolean({
            description: 'Whether there are more items after this page',
        }),
        hasPrev: Type.Boolean({
            description: 'Whether there are more items before this page',
        }),
        prevCursor: Type.Optional(
            Type.String({
                description:
                    'Cursor pointing to the first item in this page - use for previous page',
            })
        ),
        nextCursor: Type.Optional(
            Type.String({
                description: 'Cursor pointing to the last item in this page - use for next page',
            })
        ),
    },
    {
        $id: 'Pagination',
        title: 'Pagination',
        description: 'Pagination metadata for list responses',
    }
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
        schemaId
            ? {
                  $id: schemaId,
                  title: schemaId.replace(/([A-Z])/g, ' $1').trim(),
                  description: `Success response containing ${schemaId.replace('Response', '').toLowerCase()} data`,
              }
            : {}
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
        schemaId
            ? {
                  $id: schemaId,
                  title: schemaId.replace(/([A-Z])/g, ' $1').trim(),
                  description: `Paginated response containing an array of ${itemSchema.$id || 'items'}`,
              }
            : {}
    )

// Domain layer pagination result schema (no HTTP envelope)
export const createPaginatedResultSchema = <T extends TSchema>(itemSchema: T, schemaId?: string) =>
    Type.Object(
        {
            data: Type.Array(itemSchema),
            pagination: PaginationSchema,
        },
        schemaId
            ? {
                  $id: schemaId,
                  title: schemaId.replace(/([A-Z])/g, ' $1').trim(),
                  description: `Paginated result containing an array of ${itemSchema.$id || 'items'}`,
              }
            : {}
    )

// Export TypeScript types derived from schemas
export type BaseResponse = Static<typeof BaseResponseSchema>
export type Pagination = Static<typeof PaginationSchema>

// Domain layer type derived from schema (service/repository layer, no HTTP envelope)
export type PaginatedResultOf<T> = {
    data: T[]
    pagination: Pagination
}
