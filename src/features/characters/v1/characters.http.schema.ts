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

// Query for single character fetch (expansion toggle)
export const CharacterGetQuerySchema = Type.Object(
    {
        expanded: Type.Optional(
            Type.Boolean({
                description: 'Include race, archetype and equipment details',
                default: false,
            })
        ),
    },
    { $id: 'CharacterGetQuery' }
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
    [
        SearchQuerySchema,
        VisibilityQuerySchema,
        PaginationQuerySchema,
        CharacterSortQuerySchema,
        Type.Object({
            expanded: Type.Optional(
                Type.Boolean({
                    description:
                        'If true, include equipment slots (race & archetype are always included)',
                    default: false,
                })
            ),
            // Categorical filters (dual-mode: UUID exact or substring on name)
            race: Type.Optional(
                Type.String({
                    minLength: 2,
                    maxLength: 50,
                    description: 'Race id (UUID) or name substring',
                })
            ),
            archetype: Type.Optional(
                Type.String({
                    minLength: 2,
                    maxLength: 50,
                    description: 'Archetype id (UUID) or name substring',
                })
            ),
            sex: Type.Optional(Type.String({ enum: ['MALE', 'FEMALE'] })),
            // Numeric range filters (min/max pairs)
            levelMin: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000 })),
            levelMax: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000 })),
            experienceMin: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000_000 })),
            experienceMax: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000_000 })),
            healthMin: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000 })),
            healthMax: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000 })),
            manaMin: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000 })),
            manaMax: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000 })),
            staminaMin: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000 })),
            staminaMax: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000 })),
            strengthMin: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            strengthMax: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            constitutionMin: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            constitutionMax: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            dexterityMin: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            dexterityMax: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            intelligenceMin: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            intelligenceMax: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            wisdomMin: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            wisdomMax: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            charismaMin: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            charismaMax: Type.Optional(Type.Integer({ minimum: 0, maximum: 10_000 })),
            ageMin: Type.Optional(Type.Integer({ minimum: 0, maximum: 10000 })),
            ageMax: Type.Optional(Type.Integer({ minimum: 0, maximum: 10000 })),
        }),
    ],
    { $id: 'CharacterListQuery' }
)

// NOTE: List endpoint now returns basic embedded race & archetype objects (id, name, visibility, ownerId?, description?)
// to support search result display without requiring a second round-trip.

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
