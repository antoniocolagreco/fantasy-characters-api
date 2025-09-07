import { type Static, Type } from '@sinclair/typebox'

import {
    OwnedEntitySchema,
    VisibilitySchema,
    PaginationQuerySchema,
    VisibilityQuerySchema,
    createPaginatedResponseSchema,
    createSuccessResponseSchema,
} from '@/shared/schemas'

// Base Image Schema (with blob for internal use)
export const ImageSchema = Type.Intersect(
    [
        OwnedEntitySchema,
        Type.Object({
            blob: Type.Uint8Array({
                description: 'Binary image data',
            }), // Binary data - use Uint8Array instead of Any
            description: Type.Optional(
                Type.String({
                    maxLength: 2000,
                    description: 'Optional description of the image',
                })
            ),
            size: Type.Integer({
                minimum: 0,
                description: 'File size in bytes',
            }),
            mimeType: Type.String({
                description: 'MIME type of the image (e.g., image/jpeg, image/png)',
            }),
            width: Type.Integer({
                minimum: 1,
                description: 'Image width in pixels',
            }),
            height: Type.Integer({
                minimum: 1,
                description: 'Image height in pixels',
            }),
        }),
    ],
    {
        $id: 'Image',
        title: 'Image',
        description: 'Complete image entity with binary data',
    }
)

// API response schema (without blob data + URL for accessing the image)
export const ImageMetadataSchema = Type.Intersect(
    [
        Type.Omit(ImageSchema, ['blob']),
        Type.Object({
            url: Type.String({
                format: 'uri',
                description: 'URL to access the image file',
            }),
        }),
    ],
    {
        $id: 'ImageMetadata',
        title: 'Image Metadata',
        description: 'Image metadata without binary data, includes access URL',
    }
)

// Request schemas
export const CreateImageSchema = Type.Object(
    {
        description: Type.Optional(
            Type.String({
                maxLength: 2000,
                description: 'Optional description for the image',
            })
        ),
    },
    {
        $id: 'CreateImage',
        title: 'Create Image',
        description: 'Data for creating a new image',
    }
)

export const UpdateImageSchema = Type.Object(
    {
        description: Type.Optional(
            Type.String({
                maxLength: 2000,
                description: 'Updated description for the image',
            })
        ),
        visibility: Type.Optional(VisibilitySchema),
    },
    {
        $id: 'UpdateImage',
        title: 'Update Image',
        description: 'Updateable image properties',
    }
)

// Parameter schemas
export const ImageParamsSchema = Type.Object(
    {
        id: Type.String({
            format: 'uuid',
            description: 'Image ID',
        }),
    },
    {
        $id: 'ImageParams',
        title: 'Image Parameters',
        description: 'URL parameters for image endpoints',
    }
)

// Query schemas
export const ImageListQuerySchema = Type.Intersect(
    [
        PaginationQuerySchema,
        VisibilityQuerySchema,
        Type.Object({
            sortBy: Type.Optional(
                Type.String({
                    enum: ['createdAt', 'email'],
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
            user: Type.Optional(
                Type.String({
                    description: 'Search by owner ID (exact match) or email/name (partial match)',
                })
            ),
        }),
    ],
    {
        $id: 'ImageListQuery',
        title: 'Image List Query',
        description: 'Query parameters for listing images',
    }
)

// Stats schema
export const ImageStatsSchema = Type.Object(
    {
        total: Type.Integer({
            minimum: 0,
            description: 'Total number of images',
        }),
        byVisibility: Type.Object({
            PUBLIC: Type.Integer({
                minimum: 0,
                description: 'Number of public images',
            }),
            PRIVATE: Type.Integer({
                minimum: 0,
                description: 'Number of private images',
            }),
            HIDDEN: Type.Integer({
                minimum: 0,
                description: 'Number of hidden images',
            }),
        }),
        totalSize: Type.Integer({
            minimum: 0,
            description: 'Total size of all images in bytes',
        }),
    },
    {
        $id: 'ImageStats',
        title: 'Image Statistics',
        description: 'Statistical information about images',
    }
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
