import { Type } from '@sinclair/typebox'

// TypeBox schemas for Equipment endpoints

/**
 * Simple item schema for equipment slots
 */
const ItemSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  bonusHealth: Type.Union([Type.Number(), Type.Null()]),
  bonusMana: Type.Union([Type.Number(), Type.Null()]),
  bonusStamina: Type.Union([Type.Number(), Type.Null()]),
  bonusStrength: Type.Union([Type.Number(), Type.Null()]),
  bonusConstitution: Type.Union([Type.Number(), Type.Null()]),
  bonusDexterity: Type.Union([Type.Number(), Type.Null()]),
  bonusIntelligence: Type.Union([Type.Number(), Type.Null()]),
  bonusWisdom: Type.Union([Type.Number(), Type.Null()]),
  bonusCharisma: Type.Union([Type.Number(), Type.Null()]),
  damage: Type.Union([Type.Number(), Type.Null()]),
  defense: Type.Union([Type.Number(), Type.Null()]),
  rarity: Type.String(),
  slot: Type.String(),
  requiredLevel: Type.Number(),
  weight: Type.Number(),
  durability: Type.Number(),
  maxDurability: Type.Number(),
  value: Type.Number(),
  is2Handed: Type.Boolean(),
  isThrowable: Type.Boolean(),
  isConsumable: Type.Boolean(),
  isQuestItem: Type.Boolean(),
  isTradeable: Type.Boolean(),
  imageId: Type.Union([Type.String(), Type.Null()]),
  ownerId: Type.Union([Type.String(), Type.Null()]),
  visibility: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

/**
 * Equipment response schema with full item details
 */
export const EquipmentResponseSchema = Type.Object({
  id: Type.String(),
  characterId: Type.String(),
  head: Type.Union([ItemSchema, Type.Null()]),
  face: Type.Union([ItemSchema, Type.Null()]),
  chest: Type.Union([ItemSchema, Type.Null()]),
  legs: Type.Union([ItemSchema, Type.Null()]),
  feet: Type.Union([ItemSchema, Type.Null()]),
  hands: Type.Union([ItemSchema, Type.Null()]),
  rightHand: Type.Union([ItemSchema, Type.Null()]),
  leftHand: Type.Union([ItemSchema, Type.Null()]),
  rightRing: Type.Union([ItemSchema, Type.Null()]),
  leftRing: Type.Union([ItemSchema, Type.Null()]),
  amulet: Type.Union([ItemSchema, Type.Null()]),
  belt: Type.Union([ItemSchema, Type.Null()]),
  backpack: Type.Union([ItemSchema, Type.Null()]),
  cloak: Type.Union([ItemSchema, Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

/**
 * Equipment update schema for bulk updates
 */
export const EquipmentUpdateSchema = Type.Object(
  {
    headId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    faceId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    chestId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    legsId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    feetId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    handsId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    rightHandId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    leftHandId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    rightRingId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    leftRingId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    amuletId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    beltId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    backpackId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
    cloakId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
  },
  { additionalProperties: false },
)

/**
 * Equipment slot patch schema for single slot updates
 */
export const EquipmentSlotPatchSchema = Type.Object(
  {
    slot: Type.Union([
      Type.Literal('head'),
      Type.Literal('face'),
      Type.Literal('chest'),
      Type.Literal('legs'),
      Type.Literal('feet'),
      Type.Literal('hands'),
      Type.Literal('rightHand'),
      Type.Literal('leftHand'),
      Type.Literal('rightRing'),
      Type.Literal('leftRing'),
      Type.Literal('amulet'),
      Type.Literal('belt'),
      Type.Literal('backpack'),
      Type.Literal('cloak'),
    ]),
    itemId: Type.Union([Type.String(), Type.Null()]),
  },
  { additionalProperties: false },
)

/**
 * Equipment statistics schema
 */
export const EquipmentStatsSchema = Type.Object({
  totalEquipment: Type.Number(),
  equipmentWithItems: Type.Number(),
  emptyEquipment: Type.Number(),
  averageItemsPerCharacter: Type.Number(),
  slotUsage: Type.Object({
    head: Type.Number(),
    face: Type.Number(),
    chest: Type.Number(),
    legs: Type.Number(),
    feet: Type.Number(),
    hands: Type.Number(),
    rightHand: Type.Number(),
    leftHand: Type.Number(),
    rightRing: Type.Number(),
    leftRing: Type.Number(),
    amulet: Type.Number(),
    belt: Type.Number(),
    backpack: Type.Number(),
    cloak: Type.Number(),
  }),
  mostPopularItems: Type.Array(
    Type.Object({
      itemId: Type.String(),
      itemName: Type.String(),
      slot: Type.String(),
      usageCount: Type.Number(),
    }),
  ),
})

/**
 * Error response schema
 */
export const EquipmentErrorResponseSchema = Type.Object({
  statusCode: Type.Number(),
  error: Type.String(),
  message: Type.String(),
})

// Schema aliases for backwards compatibility
export const EquipmentBulkUpdateSchema = EquipmentUpdateSchema
export const EquipmentSlotUpdateSchema = EquipmentSlotPatchSchema
export const EquipmentStatsResponseSchema = EquipmentStatsSchema
