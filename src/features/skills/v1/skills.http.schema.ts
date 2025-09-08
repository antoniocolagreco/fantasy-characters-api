import { Type, type Static } from '@sinclair/typebox'

import { SkillSchema } from '@/features/skills/skills.domain.schema'
import {
    PaginationQuerySchema,
    SearchQuerySchema,
    VisibilityQuerySchema,
    createPaginatedResponseSchema,
    createSuccessResponseSchema,
} from '@/shared/schemas'

// ===== Skill-specific Sort Schema =====
const SkillSortQuerySchema = Type.Object(
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
        $id: 'SkillSortQuery',
        title: 'Skill Sort Query',
        description: 'Sorting parameters for skill listing endpoints',
    }
)

// ===== Request Schemas (HTTP v1) =====
export const CreateSkillRequestSchema = Type.Object(
    {
        name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
        description: Type.Optional(Type.String({ maxLength: 1000, transform: ['trim'] })),
        requiredLevel: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 1 })),
        visibility: Type.Optional(
            Type.String({ enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'], default: 'PUBLIC' })
        ),
        imageId: Type.Optional(Type.String({ format: 'uuid' })),
    },
    { $id: 'CreateSkillRequest', title: 'Create Skill Request' }
)

export const CreateSkillSchema = Type.Object(
    {
        name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
        description: Type.Optional(Type.String({ maxLength: 1000, transform: ['trim'] })),
        requiredLevel: Type.Integer({ minimum: 1, maximum: 100, default: 1 }),
        visibility: Type.String({ enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'], default: 'PUBLIC' }),
        imageId: Type.Optional(Type.String({ format: 'uuid' })),
    },
    { $id: 'CreateSkill', title: 'Create Skill' }
)

export const UpdateSkillSchema = Type.Partial(
    Type.Object({
        name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
        description: Type.String({ maxLength: 1000, transform: ['trim'] }),
        requiredLevel: Type.Integer({ minimum: 1, maximum: 100 }),
        visibility: Type.String({ enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'] }),
        imageId: Type.String({ format: 'uuid' }),
    }),
    { $id: 'UpdateSkill', title: 'Update Skill' }
)

// ===== Parameter Schemas =====
export const SkillParamsSchema = Type.Object(
    { id: Type.String({ format: 'uuid', description: 'Skill ID' }) },
    { $id: 'SkillParams', title: 'Skill Parameters' }
)

// ===== Query Schemas =====
export const SkillListQuerySchema = Type.Intersect(
    [SearchQuerySchema, VisibilityQuerySchema, PaginationQuerySchema, SkillSortQuerySchema],
    { $id: 'SkillListQuery', title: 'Skill List Query' }
)

// ===== Stats Schema =====
export const SkillStatsSchema = Type.Object(
    {
        totalSkills: Type.Number({ description: 'Total number of skills' }),
        publicSkills: Type.Number({ description: 'Number of public skills' }),
        privateSkills: Type.Number({ description: 'Number of private skills' }),
        hiddenSkills: Type.Number({ description: 'Number of hidden skills' }),
        newSkillsLast30Days: Type.Number({ description: 'Skills created in last 30 days' }),
        topSkills: Type.Array(
            Type.Object({
                id: Type.String({ format: 'uuid' }),
                name: Type.String(),
                usageCount: Type.Number(),
            })
        ),
    },
    { $id: 'SkillStats', title: 'Skill Statistics' }
)

// ===== Response Schemas (HTTP v1) =====
export const SkillResponseSchema = createSuccessResponseSchema(SkillSchema, 'SkillResponse')
export const SkillListResponseSchema = createPaginatedResponseSchema(
    SkillSchema,
    'SkillListResponse'
)
export const SkillStatsResponseSchema = createSuccessResponseSchema(
    SkillStatsSchema,
    'SkillStatsResponse'
)

// ===== Re-exports for domain schemas used by controllers/types =====
export { SkillSchema }

// ===== Types =====
export type Skill = Static<typeof SkillSchema>
export type CreateSkillRequest = Static<typeof CreateSkillRequestSchema>
export type CreateSkill = Static<typeof CreateSkillSchema>
export type UpdateSkill = Static<typeof UpdateSkillSchema>
export type SkillParams = Static<typeof SkillParamsSchema>
export type SkillListQuery = Static<typeof SkillListQuerySchema>
export type SkillStats = Static<typeof SkillStatsSchema>
