import { type Static, Type } from '@sinclair/typebox'

import {
    OwnedEntitySchema,
    VisibilitySchema,
    PaginationQuerySchema,
    VisibilityQuerySchema,
    SearchQuerySchema,
    createPaginatedResponseSchema,
    createSuccessResponseSchema,
} from '@/shared/schemas'

// Base Image Schema (with blob for internal use)
export const ImageSchema = Type.Intersect(
    [
        OwnedEntitySchema,
        Type.Object({
            blob: Type.Uint8Array(), // Binary data - use Uint8Array instead of Any
            description: Type.Optional(Type.String({ maxLength: 2000 })),
            size: Type.Integer({ minimum: 0 }),
            mimeType: Type.String(),
            width: Type.Integer({ minimum: 1 }),
            height: Type.Integer({ minimum: 1 }),
        }),
    ],
    { $id: 'Image' }
)

// API response schema (without blob data)
export const ImageMetadataSchema = Type.Omit(ImageSchema, ['blob'], { $id: 'ImageMetadata' })

// Request schemas
export const CreateImageSchema = Type.Object(
    {
        description: Type.Optional(Type.String({ maxLength: 2000 })),
    },
    { $id: 'CreateImage' }
)

export const UpdateImageSchema = Type.Object(
    {
        description: Type.Optional(Type.String({ maxLength: 2000 })),
        visibility: Type.Optional(VisibilitySchema),
    },
    { $id: 'UpdateImage' }
)

// Parameter schemas
export const ImageParamsSchema = Type.Object(
    {
        id: Type.String({ format: 'uuid' }),
    },
    { $id: 'ImageParams' }
)

// Query schemas
export const ImageListQuerySchema = Type.Intersect(
    [
        PaginationQuerySchema,
        VisibilityQuerySchema,
        SearchQuerySchema,
        Type.Object({
            sortBy: Type.Optional(
                Type.Union([
                    Type.Literal('createdAt'),
                    Type.Literal('name'),
                    Type.Literal('size'),
                    Type.Literal('width'),
                    Type.Literal('height'),
                ])
            ),
            sortDir: Type.Optional(
                Type.Union([Type.Literal('asc'), Type.Literal('desc')], {
                    default: 'desc',
                })
            ),
            minWidth: Type.Optional(Type.Integer({ minimum: 1 })),
            maxWidth: Type.Optional(Type.Integer({ minimum: 1 })),
            minHeight: Type.Optional(Type.Integer({ minimum: 1 })),
            maxHeight: Type.Optional(Type.Integer({ minimum: 1 })),
            mimeType: Type.Optional(Type.String()),
        }),
    ],
    { $id: 'ImageListQuery' }
)

// Stats schema
export const ImageStatsSchema = Type.Object(
    {
        total: Type.Integer({ minimum: 0 }),
        byVisibility: Type.Object({
            PUBLIC: Type.Integer({ minimum: 0 }),
            PRIVATE: Type.Integer({ minimum: 0 }),
            HIDDEN: Type.Integer({ minimum: 0 }),
        }),
        byMimeType: Type.Record(Type.String(), Type.Integer({ minimum: 0 })),
        totalSize: Type.Integer({ minimum: 0 }),
        averageSize: Type.Number({ minimum: 0 }),
        averageWidth: Type.Number({ minimum: 0 }),
        averageHeight: Type.Number({ minimum: 0 }),
    },
    { $id: 'ImageStats' }
)

// Response schemas
export const ImageResponseSchema = createSuccessResponseSchema(ImageMetadataSchema, 'ImageResponse')

export const ImageListResponseSchema = createPaginatedResponseSchema(
    ImageMetadataSchema,
    'ImageListResponse'
)

export const ImageStatsResponseSchema = createSuccessResponseSchema(
    ImageStatsSchema,
    'ImageStatsResponse'
)

// Export TypeScript types
export type Image = Static<typeof ImageSchema>
export type ImageMetadata = Static<typeof ImageMetadataSchema>
export type CreateImage = Static<typeof CreateImageSchema>
export type UpdateImage = Static<typeof UpdateImageSchema>
export type ImageParams = Static<typeof ImageParamsSchema>
export type ImageListQuery = Static<typeof ImageListQuerySchema>
export type ImageStats = Static<typeof ImageStatsSchema>
