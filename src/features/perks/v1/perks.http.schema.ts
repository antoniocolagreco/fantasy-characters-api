import { Type, type Static } from '@sinclair/typebox'

import { PerkSchema } from '@/features/perks/perks.domain.schema'
import {
    PaginationQuerySchema,
    SearchQuerySchema,
    VisibilityQuerySchema,
    createPaginatedResponseSchema,
    createSuccessResponseSchema,
} from '@/shared/schemas'

// ===== Perk-specific Sort Schema =====
const PerkSortQuerySchema = Type.Object(
    {
        sortBy: Type.Optional(
            Type.String({
                enum: ['createdAt', 'updatedAt', 'name', 'requiredLevel'],
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
        $id: 'PerkSortQuery',
        title: 'Perk Sort Query',
        description: 'Sorting parameters for perk listing endpoints',
    }
)

// ===== Request Schemas (HTTP v1) =====
export const CreatePerkRequestSchema = Type.Object(
    {
        name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
        description: Type.Optional(Type.String({ maxLength: 1000, transform: ['trim'] })),
        requiredLevel: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 1 })),
        visibility: Type.Optional(
            Type.String({ enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'], default: 'PUBLIC' })
        ),
        imageId: Type.Optional(Type.String({ format: 'uuid' })),
    },
    { $id: 'CreatePerkRequest', title: 'Create Perk Request' }
)

export const CreatePerkSchema = Type.Object(
    {
        name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
        description: Type.Optional(Type.String({ maxLength: 1000, transform: ['trim'] })),
        requiredLevel: Type.Integer({ minimum: 1, maximum: 100, default: 1 }),
        visibility: Type.String({ enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'], default: 'PUBLIC' }),
        imageId: Type.Optional(Type.String({ format: 'uuid' })),
    },
    { $id: 'CreatePerk', title: 'Create Perk' }
)

export const UpdatePerkSchema = Type.Partial(
    Type.Object({
        name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
        description: Type.String({ maxLength: 1000, transform: ['trim'] }),
        requiredLevel: Type.Integer({ minimum: 1, maximum: 100 }),
        visibility: Type.String({ enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'] }),
        imageId: Type.String({ format: 'uuid' }),
    }),
    { $id: 'UpdatePerk', title: 'Update Perk' }
)

// ===== Parameter Schemas =====
export const PerkParamsSchema = Type.Object(
    { id: Type.String({ format: 'uuid', description: 'Perk ID' }) },
    { $id: 'PerkParams', title: 'Perk Parameters' }
)

// ===== Query Schemas =====
export const PerkListQuerySchema = Type.Intersect(
    [SearchQuerySchema, VisibilityQuerySchema, PaginationQuerySchema, PerkSortQuerySchema],
    { $id: 'PerkListQuery', title: 'Perk List Query' }
)

// ===== Stats Schema =====
export const PerkStatsSchema = Type.Object(
    {
        totalPerks: Type.Number({ description: 'Total number of perks' }),
        publicPerks: Type.Number({ description: 'Number of public perks' }),
        privatePerks: Type.Number({ description: 'Number of private perks' }),
        hiddenPerks: Type.Number({ description: 'Number of hidden perks' }),
        newPerksLast30Days: Type.Number({ description: 'Perks created in last 30 days' }),
        topPerks: Type.Array(
            Type.Object({
                id: Type.String({ format: 'uuid' }),
                name: Type.String(),
                usageCount: Type.Number(),
            })
        ),
    },
    { $id: 'PerkStats', title: 'Perk Statistics' }
)

// ===== Response Schemas (HTTP v1) =====
export const PerkResponseSchema = createSuccessResponseSchema(PerkSchema, 'PerkResponse')
export const PerkListResponseSchema = createPaginatedResponseSchema(PerkSchema, 'PerkListResponse')
export const PerkStatsResponseSchema = createSuccessResponseSchema(
    PerkStatsSchema,
    'PerkStatsResponse'
)

// ===== Re-exports for domain schemas used by controllers/types =====
export { PerkSchema }

// ===== Types =====
export type Perk = Static<typeof PerkSchema>
export type CreatePerkRequest = Static<typeof CreatePerkRequestSchema>
export type CreatePerk = Static<typeof CreatePerkSchema>
export type UpdatePerk = Static<typeof UpdatePerkSchema>
export type PerkParams = Static<typeof PerkParamsSchema>
export type PerkListQuery = Static<typeof PerkListQuerySchema>
export type PerkStats = Static<typeof PerkStatsSchema>
