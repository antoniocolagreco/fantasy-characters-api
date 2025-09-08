import { Type, type Static } from '@sinclair/typebox'

import { OwnedEntitySchema } from '@/shared/schemas'

// ===== Skill Schema (domain) =====
export const SkillSchema = Type.Intersect(
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
                    description: 'Optional image associated with the skill',
                })
            ),
        }),
    ],
    { $id: 'Skill' }
)

// ===== Domain Types =====
export type Skill = Static<typeof SkillSchema>
