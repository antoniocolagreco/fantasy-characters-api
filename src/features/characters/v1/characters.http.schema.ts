import { Type, type Static } from '@sinclair/typebox'

import { CharacterSchema } from '@/features/characters/characters.domain.schema'
import {
    PaginationQuerySchema,
    SearchQuerySchema,
    VisibilityQuerySchema,
    createPaginatedResponseSchema,
    createSuccessResponseSchema,
} from '@/shared/schemas'

export const CreateCharacterSchema = Type.Object(
    {
        name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
        description: Type.Optional(Type.String({ maxLength: 5000, transform: ['trim'] })),
        visibility: Type.Optional(
            Type.String({ enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'], default: 'PUBLIC' })
        ),
        level: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000, default: 1 })),
        experience: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000_000, default: 0 })),
        health: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000, default: 100 })),
        mana: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000, default: 100 })),
        stamina: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000, default: 100 })),
        strength: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000, default: 10 })),
        constitution: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000, default: 10 })),
        dexterity: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000, default: 10 })),
        intelligence: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000, default: 10 })),
        wisdom: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000, default: 10 })),
        charisma: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000, default: 10 })),
        age: Type.Optional(Type.Integer({ minimum: 0, maximum: 10000, default: 18 })),
        sex: Type.Optional(Type.String({ enum: ['MALE', 'FEMALE'], default: 'MALE' })),
        imageId: Type.Optional(Type.String({ format: 'uuid' })),
        raceId: Type.String({ format: 'uuid' }),
        archetypeId: Type.String({ format: 'uuid' }),
    },
    { $id: 'CreateCharacter' }
)

export const UpdateCharacterSchema = Type.Partial(CreateCharacterSchema, {
    $id: 'UpdateCharacter',
})

export const CharacterParamsSchema = Type.Object(
    { id: Type.String({ format: 'uuid' }) },
    { $id: 'CharacterParams' }
)

const CharacterSortQuerySchema = Type.Object(
    {
        sortBy: Type.Optional(
            Type.String({
                enum: [
                    'createdAt',
                    'updatedAt',
                    'name',
                    'level',
                    'experience',
                    'strength',
                    'dexterity',
                    'intelligence',
                ],
            })
        ),
        sortDir: Type.Optional(Type.String({ enum: ['asc', 'desc'], default: 'desc' })),
    },
    { $id: 'CharacterSortQuery' }
)

export const CharacterListQuerySchema = Type.Intersect(
    [SearchQuerySchema, VisibilityQuerySchema, PaginationQuerySchema, CharacterSortQuerySchema],
    { $id: 'CharacterListQuery' }
)

export const CharacterStatsSchema = Type.Object(
    {
        totalCharacters: Type.Number(),
        publicCharacters: Type.Number(),
        privateCharacters: Type.Number(),
        hiddenCharacters: Type.Number(),
        newCharactersLast30Days: Type.Number(),
        averageLevel: Type.Number(),
        topArchetypes: Type.Array(
            Type.Object({
                id: Type.String({ format: 'uuid' }),
                name: Type.String(),
                count: Type.Number(),
            })
        ),
    },
    { $id: 'CharacterStats' }
)

export const CharacterResponseSchema = createSuccessResponseSchema(
    CharacterSchema,
    'CharacterResponse'
)
export const CharacterListResponseSchema = createPaginatedResponseSchema(
    CharacterSchema,
    'CharacterListResponse'
)
export const CharacterStatsResponseSchema = createSuccessResponseSchema(
    CharacterStatsSchema,
    'CharacterStatsResponse'
)

export type Character = Static<typeof CharacterSchema>
export type CreateCharacter = Static<typeof CreateCharacterSchema>
export type UpdateCharacter = Static<typeof UpdateCharacterSchema>
export type CharacterParams = Static<typeof CharacterParamsSchema>
export type CharacterListQuery = Static<typeof CharacterListQuerySchema>
export type CharacterStats = Static<typeof CharacterStatsSchema>
