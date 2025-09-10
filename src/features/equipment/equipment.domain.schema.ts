import { Type, type Static } from '@sinclair/typebox'

// Minimal item shape suitable for embedding inside Character.equipment slots
// Kept intentionally permissive (all fields optional) to avoid breaking existing responses
// and to allow repositories to embed richer item objects when available.
export const EquipmentSlotItemSchema = Type.Partial(
    Type.Object(
        {
            id: Type.String({ format: 'uuid' }),
            name: Type.String(),
            description: Type.String(),
            visibility: Type.String({ enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'] }),
            ownerId: Type.String({ format: 'uuid' }),
        },
        { $id: 'EquipmentSlotItem' }
    )
)

export type EquipmentSlotItem = Static<typeof EquipmentSlotItemSchema>
