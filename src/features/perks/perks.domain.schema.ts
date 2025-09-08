import { Type, type Static } from '@sinclair/typebox'

import { OwnedEntitySchema } from '@/shared/schemas'

// ===== Perk Schema (domain) =====
export const PerkSchema = Type.Intersect(
    [
        OwnedEntitySchema,
        Type.Object({
            name: Type.String({
                minLength: 1,
                maxLength: 100,
                transform: ['trim'],
            }),
            description: Type.Optional(
                Type.String({
                    maxLength: 1000,
                    transform: ['trim'],
                })
            ),
            requiredLevel: Type.Integer({ minimum: 1, maximum: 100, default: 1 }),
            imageId: Type.Optional(
                Type.String({
                    format: 'uuid',
                    description: 'Optional image associated with the perk',
                })
            ),
        }),
    ],
    { $id: 'Perk' }
)

// ===== Domain Types =====
export type Perk = Static<typeof PerkSchema>
