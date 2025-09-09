import { Type, type Static } from '@sinclair/typebox'

import { RaceSchema } from '@/features/races/races.domain.schema'
import {
    PaginationQuerySchema,
    SearchQuerySchema,
    VisibilityQuerySchema,
    createPaginatedResponseSchema,
    createSuccessResponseSchema,
} from '@/shared/schemas'

// ===== Race-specific Sort Schema =====
const RaceSortQuerySchema = Type.Object(
    {
        sortBy: Type.Optional(
            Type.String({
                enum: [
                    'createdAt',
                    'updatedAt',
                    'name',
                    'strengthModifier',
                    'constitutionModifier',
                    'dexterityModifier',
                ],
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
    { $id: 'RaceSortQuery' }
)

// ===== Request Schemas =====
export const CreateRaceSchema = Type.Object(
    {
        name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
        description: Type.Optional(Type.String({ maxLength: 2000, transform: ['trim'] })),
        visibility: Type.Optional(
            Type.String({ enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'], default: 'PUBLIC' })
        ),
        imageId: Type.Optional(Type.String({ format: 'uuid' })),
        healthModifier: Type.Optional(Type.Integer({ minimum: 0, maximum: 1000, default: 100 })),
        manaModifier: Type.Optional(Type.Integer({ minimum: 0, maximum: 1000, default: 100 })),
        staminaModifier: Type.Optional(Type.Integer({ minimum: 0, maximum: 1000, default: 100 })),
        strengthModifier: Type.Optional(Type.Integer({ minimum: 0, maximum: 500, default: 10 })),
        constitutionModifier: Type.Optional(
            Type.Integer({ minimum: 0, maximum: 500, default: 10 })
        ),
        dexterityModifier: Type.Optional(Type.Integer({ minimum: 0, maximum: 500, default: 10 })),
        intelligenceModifier: Type.Optional(
            Type.Integer({ minimum: 0, maximum: 500, default: 10 })
        ),
        wisdomModifier: Type.Optional(Type.Integer({ minimum: 0, maximum: 500, default: 10 })),
        charismaModifier: Type.Optional(Type.Integer({ minimum: 0, maximum: 500, default: 10 })),
    },
    { $id: 'CreateRace', title: 'Create Race' }
)

export const UpdateRaceSchema = Type.Partial(CreateRaceSchema, {
    $id: 'UpdateRace',
})

// ===== Params =====
export const RaceParamsSchema = Type.Object(
    { id: Type.String({ format: 'uuid' }) },
    { $id: 'RaceParams' }
)

// ===== Query Schemas =====
export const RaceListQuerySchema = Type.Intersect(
    [SearchQuerySchema, VisibilityQuerySchema, PaginationQuerySchema, RaceSortQuerySchema],
    { $id: 'RaceListQuery' }
)

// ===== Stats Schema =====
export const RaceStatsSchema = Type.Object(
    {
        totalRaces: Type.Number(),
        publicRaces: Type.Number(),
        privateRaces: Type.Number(),
        hiddenRaces: Type.Number(),
        newRacesLast30Days: Type.Number(),
        topRaces: Type.Array(
            Type.Object({
                id: Type.String({ format: 'uuid' }),
                name: Type.String(),
                usageCount: Type.Number(),
            })
        ),
    },
    { $id: 'RaceStats' }
)

// ===== Responses =====
export const RaceResponseSchema = createSuccessResponseSchema(RaceSchema, 'RaceResponse')
export const RaceListResponseSchema = createPaginatedResponseSchema(RaceSchema, 'RaceListResponse')
export const RaceStatsResponseSchema = createSuccessResponseSchema(
    RaceStatsSchema,
    'RaceStatsResponse'
)

// ===== Types =====
export type Race = Static<typeof RaceSchema>
export type CreateRace = Static<typeof CreateRaceSchema>
export type UpdateRace = Static<typeof UpdateRaceSchema>
export type RaceParams = Static<typeof RaceParamsSchema>
export type RaceListQuery = Static<typeof RaceListQuerySchema>
export type RaceStats = Static<typeof RaceStatsSchema>
