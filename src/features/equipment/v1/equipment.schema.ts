import { Type, type Static } from '@sinclair/typebox'

import { createSuccessResponseSchema } from '@/shared/schemas'

export const EquipmentParamsSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
})

export type EquipmentParams = Static<typeof EquipmentParamsSchema>

export const EquipmentSchema = Type.Object({
    characterId: Type.String({ format: 'uuid' }),
    headId: Type.Optional(Type.String({ format: 'uuid' })),
    faceId: Type.Optional(Type.String({ format: 'uuid' })),
    chestId: Type.Optional(Type.String({ format: 'uuid' })),
    legsId: Type.Optional(Type.String({ format: 'uuid' })),
    feetId: Type.Optional(Type.String({ format: 'uuid' })),
    handsId: Type.Optional(Type.String({ format: 'uuid' })),
    rightHandId: Type.Optional(Type.String({ format: 'uuid' })),
    leftHandId: Type.Optional(Type.String({ format: 'uuid' })),
    rightRingId: Type.Optional(Type.String({ format: 'uuid' })),
    leftRingId: Type.Optional(Type.String({ format: 'uuid' })),
    amuletId: Type.Optional(Type.String({ format: 'uuid' })),
    beltId: Type.Optional(Type.String({ format: 'uuid' })),
    backpackId: Type.Optional(Type.String({ format: 'uuid' })),
    cloakId: Type.Optional(Type.String({ format: 'uuid' })),
})

export type EquipmentResponse = Static<typeof EquipmentSchema>

export const EquipmentUpdateSchema = Type.Partial(Type.Omit(EquipmentSchema, ['characterId']))

export type EquipmentUpdateInput = Static<typeof EquipmentUpdateSchema>

export const EquipmentStatsSchema = Type.Object({
    totalEquippedCharacters: Type.Integer({ minimum: 0 }),
    headSlotUsage: Type.Integer({ minimum: 0 }),
    faceSlotUsage: Type.Integer({ minimum: 0 }),
    chestSlotUsage: Type.Integer({ minimum: 0 }),
    legsSlotUsage: Type.Integer({ minimum: 0 }),
    feetSlotUsage: Type.Integer({ minimum: 0 }),
    handsSlotUsage: Type.Integer({ minimum: 0 }),
    rightHandSlotUsage: Type.Integer({ minimum: 0 }),
    leftHandSlotUsage: Type.Integer({ minimum: 0 }),
    rightRingSlotUsage: Type.Integer({ minimum: 0 }),
    leftRingSlotUsage: Type.Integer({ minimum: 0 }),
    amuletSlotUsage: Type.Integer({ minimum: 0 }),
    beltSlotUsage: Type.Integer({ minimum: 0 }),
    backpackSlotUsage: Type.Integer({ minimum: 0 }),
    cloakSlotUsage: Type.Integer({ minimum: 0 }),
})

export type EquipmentStatsResponse = Static<typeof EquipmentStatsSchema>

export const GetEquipmentResponseSchema = createSuccessResponseSchema(EquipmentSchema)

export const GetEquipmentStatsResponseSchema = createSuccessResponseSchema(EquipmentStatsSchema)
