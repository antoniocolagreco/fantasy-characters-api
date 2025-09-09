import { Type, type Static } from '@sinclair/typebox'

import { OwnedEntitySchema } from '@/shared/schemas'

// ===== Archetype Schema (domain) =====
// Mirrors Prisma Archetype model (scalar + ownership fields only)
export const ArchetypeSchema = Type.Intersect(
    [
        OwnedEntitySchema,
        Type.Object(
            {
                name: Type.String({ minLength: 1, maxLength: 100, transform: ['trim'] }),
                description: Type.Optional(Type.String({ maxLength: 2000, transform: ['trim'] })),
                imageId: Type.Optional(
                    Type.String({
                        format: 'uuid',
                        description: 'Optional representative image id',
                    })
                ),
            },
            { additionalProperties: false }
        ),
    ],
    { $id: 'Archetype' }
)

// ===== Domain Types =====
export type Archetype = Static<typeof ArchetypeSchema>
