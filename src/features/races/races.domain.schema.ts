import { Type, type Static } from '@sinclair/typebox'

import { OwnedEntitySchema } from '@/shared/schemas'

// ===== Race Schema (domain) =====
// Mirrors Prisma Race model (see prisma/schema.prisma) with attribute modifiers
// Domain schema excludes relational collections; only scalar + ownership fields.
export const RaceSchema = Type.Intersect(
    [
        OwnedEntitySchema,
        Type.Object(
            {
                name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
                description: Type.Optional(Type.String({ maxLength: 2000, transform: ['trim'] })),
                // Attribute modifiers (percentage or flat multipliers represented as ints)
                healthModifier: Type.Integer({ minimum: 0, maximum: 1000, default: 100 }),
                manaModifier: Type.Integer({ minimum: 0, maximum: 1000, default: 100 }),
                staminaModifier: Type.Integer({ minimum: 0, maximum: 1000, default: 100 }),
                strengthModifier: Type.Integer({ minimum: 0, maximum: 500, default: 10 }),
                constitutionModifier: Type.Integer({ minimum: 0, maximum: 500, default: 10 }),
                dexterityModifier: Type.Integer({ minimum: 0, maximum: 500, default: 10 }),
                intelligenceModifier: Type.Integer({ minimum: 0, maximum: 500, default: 10 }),
                wisdomModifier: Type.Integer({ minimum: 0, maximum: 500, default: 10 }),
                charismaModifier: Type.Integer({ minimum: 0, maximum: 500, default: 10 }),
                imageId: Type.Optional(
                    Type.String({ format: 'uuid', description: 'Optional representative image id' })
                ),
            },
            { additionalProperties: false }
        ),
    ],
    { $id: 'Race' }
)

// ===== Domain Types =====
export type Race = Static<typeof RaceSchema>
