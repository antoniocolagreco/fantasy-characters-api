import { Type, type Static } from '@sinclair/typebox'

import { OwnedEntitySchema } from '@/shared/schemas'

// ===== Tag Schema (domain) =====
export const TagSchema = Type.Intersect(
    [
        OwnedEntitySchema,
        Type.Object({
            name: Type.String({
                minLength: 1,
                maxLength: 50,
                transform: ['trim'],
            }),
            description: Type.Optional(
                Type.String({
                    maxLength: 500,
                    transform: ['trim'],
                })
            ),
        }),
    ],
    { $id: 'Tag' }
)

// ===== Domain Types =====
export type Tag = Static<typeof TagSchema>
