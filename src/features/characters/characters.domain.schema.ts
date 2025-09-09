import { Type, type Static } from '@sinclair/typebox'

import { OwnedEntitySchema } from '@/shared/schemas'

// ===== Character Domain Schema =====
// Mirrors Prisma Character model (subset - excludes relations collections)
export const CharacterSchema = Type.Intersect(
    [
        OwnedEntitySchema,
        Type.Object(
            {
                name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
                description: Type.Optional(Type.String({ maxLength: 5000, transform: ['trim'] })),
                level: Type.Integer({ minimum: 1, maximum: 1000, default: 1 }),
                experience: Type.Integer({ minimum: 0, maximum: 1_000_000_000, default: 0 }),
                health: Type.Integer({ minimum: 0, maximum: 1_000_000, default: 100 }),
                mana: Type.Integer({ minimum: 0, maximum: 1_000_000, default: 100 }),
                stamina: Type.Integer({ minimum: 0, maximum: 1_000_000, default: 100 }),
                strength: Type.Integer({ minimum: 0, maximum: 10_000, default: 10 }),
                constitution: Type.Integer({ minimum: 0, maximum: 10_000, default: 10 }),
                dexterity: Type.Integer({ minimum: 0, maximum: 10_000, default: 10 }),
                intelligence: Type.Integer({ minimum: 0, maximum: 10_000, default: 10 }),
                wisdom: Type.Integer({ minimum: 0, maximum: 10_000, default: 10 }),
                charisma: Type.Integer({ minimum: 0, maximum: 10_000, default: 10 }),
                age: Type.Integer({ minimum: 0, maximum: 10000, default: 18 }),
                sex: Type.Optional(Type.String({ enum: ['MALE', 'FEMALE'], default: 'MALE' })),
                imageId: Type.Optional(Type.String({ format: 'uuid' })),
                raceId: Type.String({ format: 'uuid' }),
                archetypeId: Type.String({ format: 'uuid' }),
                // Optional expanded relations (present only when expanded=true)
                race: Type.Optional(
                    Type.Partial(
                        Type.Object({
                            id: Type.String({ format: 'uuid' }),
                            name: Type.Optional(Type.String()),
                            description: Type.Optional(Type.String()),
                            visibility: Type.Optional(Type.String()),
                            ownerId: Type.Optional(Type.String({ format: 'uuid' })),
                        })
                    )
                ),
                archetype: Type.Optional(
                    Type.Partial(
                        Type.Object({
                            id: Type.String({ format: 'uuid' }),
                            name: Type.Optional(Type.String()),
                            description: Type.Optional(Type.String()),
                            visibility: Type.Optional(Type.String()),
                            ownerId: Type.Optional(Type.String({ format: 'uuid' })),
                        })
                    )
                ),
                equipment: Type.Optional(
                    Type.Partial(
                        Type.Object({
                            head: Type.Optional(Type.Any()),
                            face: Type.Optional(Type.Any()),
                            chest: Type.Optional(Type.Any()),
                            legs: Type.Optional(Type.Any()),
                            feet: Type.Optional(Type.Any()),
                            hands: Type.Optional(Type.Any()),
                            rightHand: Type.Optional(Type.Any()),
                            leftHand: Type.Optional(Type.Any()),
                            rightRing: Type.Optional(Type.Any()),
                            leftRing: Type.Optional(Type.Any()),
                            amulet: Type.Optional(Type.Any()),
                            belt: Type.Optional(Type.Any()),
                            backpack: Type.Optional(Type.Any()),
                            cloak: Type.Optional(Type.Any()),
                        })
                    )
                ),
            },
            { additionalProperties: false }
        ),
    ],
    { $id: 'Character' }
)

export type Character = Static<typeof CharacterSchema>
