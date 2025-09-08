import { Type, type Static } from '@sinclair/typebox'

import { TagSchema } from '@/features/tags/tags.domain.schema'
import {
    PaginationQuerySchema,
    SearchQuerySchema,
    VisibilityQuerySchema,
    createPaginatedResponseSchema,
    createSuccessResponseSchema,
} from '@/shared/schemas'

// ===== Tag-specific Sort Schema =====
const TagSortQuerySchema = Type.Object(
    {
        sortBy: Type.Optional(
            Type.String({
                enum: ['createdAt', 'updatedAt', 'name'],
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
    },
    {
        $id: 'TagSortQuery',
        title: 'Tag Sort Query',
        description: 'Sorting parameters for tag listing endpoints',
    }
)

// ===== Request Schemas (HTTP v1) =====
export const CreateTagRequestSchema = Type.Object(
    {
        name: Type.String({
            minLength: 1,
            maxLength: 50,
            transform: ['trim'],
            description: 'Tag name',
        }),
        description: Type.Optional(
            Type.String({
                maxLength: 500,
                transform: ['trim'],
                description: 'Tag description',
            })
        ),
        visibility: Type.Optional(
            Type.String({
                enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'],
                default: 'PUBLIC',
                description: 'Tag visibility',
            })
        ),
    },
    {
        $id: 'CreateTagRequest',
        title: 'Create Tag Request',
        description: 'Request data for creating a new tag',
    }
)

export const CreateTagSchema = Type.Object(
    {
        name: Type.String({
            minLength: 1,
            maxLength: 50,
            transform: ['trim'],
        }),
        description: Type.Optional(
            Type.String({
                maxLength: 500,
                transform: ['trim'],
            })
        ),
        visibility: Type.String({
            enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'],
            default: 'PUBLIC',
        }),
    },
    {
        $id: 'CreateTag',
        title: 'Create Tag',
        description: 'Tag data for creation (without system-generated fields)',
    }
)

export const UpdateTagSchema = Type.Partial(
    Type.Object({
        name: Type.String({
            minLength: 1,
            maxLength: 50,
            transform: ['trim'],
        }),
        description: Type.String({
            maxLength: 500,
            transform: ['trim'],
        }),
        visibility: Type.String({
            enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'],
        }),
    }),
    {
        $id: 'UpdateTag',
        title: 'Update Tag',
        description: 'Updateable tag fields',
    }
)

// ===== Parameter Schemas =====
export const TagParamsSchema = Type.Object(
    {
        id: Type.String({
            format: 'uuid',
            description: 'Tag ID',
        }),
    },
    {
        $id: 'TagParams',
        title: 'Tag Parameters',
        description: 'URL parameters for tag endpoints',
    }
)

// ===== Query Schemas =====
export const TagListQuerySchema = Type.Intersect(
    [SearchQuerySchema, VisibilityQuerySchema, PaginationQuerySchema, TagSortQuerySchema],
    {
        $id: 'TagListQuery',
        title: 'Tag List Query',
        description: 'Query parameters for listing tags',
    }
)

// ===== Stats Schema =====
export const TagStatsSchema = Type.Object(
    {
        totalTags: Type.Number({
            description: 'Total number of tags',
        }),
        publicTags: Type.Number({
            description: 'Number of public tags',
        }),
        privateTags: Type.Number({
            description: 'Number of private tags',
        }),
        hiddenTags: Type.Number({
            description: 'Number of hidden tags',
        }),
        newTagsLast30Days: Type.Number({
            description: 'Number of tags created in the last 30 days',
        }),
        topTags: Type.Array(
            Type.Object({
                id: Type.String({ format: 'uuid' }),
                name: Type.String(),
                usageCount: Type.Number(),
            }),
            {
                description: 'Most used tags',
            }
        ),
    },
    {
        $id: 'TagStats',
        title: 'Tag Statistics',
        description: 'Statistical information about tags',
    }
)

// ===== Response Schemas (HTTP v1) =====
export const TagResponseSchema = createSuccessResponseSchema(TagSchema, 'TagResponse')

export const TagListResponseSchema = createPaginatedResponseSchema(TagSchema, 'TagListResponse')

export const TagStatsResponseSchema = createSuccessResponseSchema(
    TagStatsSchema,
    'TagStatsResponse'
)

// ===== Re-exports for domain schemas used by controllers/types =====
export { TagSchema }

// ===== Types =====
export type Tag = Static<typeof TagSchema>
export type CreateTagRequest = Static<typeof CreateTagRequestSchema>
export type CreateTag = Static<typeof CreateTagSchema>
export type UpdateTag = Static<typeof UpdateTagSchema>
export type TagParams = Static<typeof TagParamsSchema>
export type TagListQuery = Static<typeof TagListQuerySchema>
export type TagStats = Static<typeof TagStatsSchema>
