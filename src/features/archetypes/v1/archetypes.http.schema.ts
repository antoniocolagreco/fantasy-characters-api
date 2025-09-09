import { Type, type Static } from '@sinclair/typebox'

import { ArchetypeSchema } from '@/features/archetypes/archetypes.domain.schema'
import {
    PaginationQuerySchema,
    SearchQuerySchema,
    VisibilityQuerySchema,
    createPaginatedResponseSchema,
    createSuccessResponseSchema,
} from '@/shared/schemas'

// ===== Archetype-specific Sort Schema =====
const ArchetypeSortQuerySchema = Type.Object(
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
    { $id: 'ArchetypeSortQuery' }
)

// ===== Request Schemas =====
export const CreateArchetypeSchema = Type.Object(
    {
        name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
        description: Type.Optional(Type.String({ maxLength: 2000, transform: ['trim'] })),
        visibility: Type.Optional(
            Type.String({ enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'], default: 'PUBLIC' })
        ),
        imageId: Type.Optional(Type.String({ format: 'uuid' })),
    },
    { $id: 'CreateArchetype', title: 'Create Archetype' }
)

export const UpdateArchetypeSchema = Type.Partial(CreateArchetypeSchema, {
    $id: 'UpdateArchetype',
})

// ===== Params =====
export const ArchetypeParamsSchema = Type.Object(
    { id: Type.String({ format: 'uuid' }) },
    { $id: 'ArchetypeParams' }
)

// ===== Query Schemas =====
export const ArchetypeListQuerySchema = Type.Intersect(
    [SearchQuerySchema, VisibilityQuerySchema, PaginationQuerySchema, ArchetypeSortQuerySchema],
    { $id: 'ArchetypeListQuery' }
)

// ===== Stats Schema =====
export const ArchetypeStatsSchema = Type.Object(
    {
        totalArchetypes: Type.Number(),
        publicArchetypes: Type.Number(),
        privateArchetypes: Type.Number(),
        hiddenArchetypes: Type.Number(),
        newArchetypesLast30Days: Type.Number(),
        topArchetypes: Type.Array(
            Type.Object({
                id: Type.String({ format: 'uuid' }),
                name: Type.String(),
                usageCount: Type.Number(),
            })
        ),
    },
    { $id: 'ArchetypeStats' }
)

// ===== Responses =====
export const ArchetypeResponseSchema = createSuccessResponseSchema(
    ArchetypeSchema,
    'ArchetypeResponse'
)
export const ArchetypeListResponseSchema = createPaginatedResponseSchema(
    ArchetypeSchema,
    'ArchetypeListResponse'
)
export const ArchetypeStatsResponseSchema = createSuccessResponseSchema(
    ArchetypeStatsSchema,
    'ArchetypeStatsResponse'
)

// ===== Types =====
export type Archetype = Static<typeof ArchetypeSchema>
export type CreateArchetype = Static<typeof CreateArchetypeSchema>
export type UpdateArchetype = Static<typeof UpdateArchetypeSchema>
export type ArchetypeParams = Static<typeof ArchetypeParamsSchema>
export type ArchetypeListQuery = Static<typeof ArchetypeListQuerySchema>
export type ArchetypeStats = Static<typeof ArchetypeStatsSchema>
