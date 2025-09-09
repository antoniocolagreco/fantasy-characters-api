import { Type, type Static } from '@sinclair/typebox'

import { OwnedEntitySchema } from '@/shared/schemas'

// Mirrors Prisma Item model (selected scalar + ownership + visibility fields)
export const ItemSchema = Type.Intersect([
    OwnedEntitySchema,
    Type.Object(
        {
            name: Type.String({ minLength: 1, maxLength: 120, transform: ['trim'] }),
            description: Type.Optional(Type.String({ maxLength: 4000, transform: ['trim'] })),
            rarity: Type.String({
                enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'],
                default: 'COMMON',
            }),
            slot: Type.String({
                enum: [
                    'NONE',
                    'HEAD',
                    'FACE',
                    'CHEST',
                    'LEGS',
                    'FEET',
                    'HANDS',
                    'ONE_HAND',
                    'TWO_HANDS',
                    'RING',
                    'AMULET',
                    'BELT',
                    'BACKPACK',
                    'CLOAK',
                ],
                default: 'NONE',
            }),
            requiredLevel: Type.Integer({ minimum: 1, default: 1 }),
            weight: Type.Number({ minimum: 0, default: 1.0 }),
            durability: Type.Integer({ minimum: 0, default: 100 }),
            maxDurability: Type.Integer({ minimum: 0, default: 100 }),
            value: Type.Integer({ minimum: 0, default: 0 }),
            // Flags
            is2Handed: Type.Boolean({ default: false }),
            isThrowable: Type.Boolean({ default: false }),
            isConsumable: Type.Boolean({ default: false }),
            isQuestItem: Type.Boolean({ default: false }),
            isTradeable: Type.Boolean({ default: true }),
            imageId: Type.Optional(Type.String({ format: 'uuid' })),
        },
        { additionalProperties: false }
    ),
])

export type Item = Static<typeof ItemSchema>
