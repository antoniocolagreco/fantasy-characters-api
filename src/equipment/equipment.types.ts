import type { Equipment, Item } from '@prisma/client'

/**
 * Equipment with loaded item relationships
 */
export type EquipmentWithItems = {
  head?: Item | null
  face?: Item | null
  chest?: Item | null
  legs?: Item | null
  feet?: Item | null
  hands?: Item | null
  rightHand?: Item | null
  leftHand?: Item | null
  rightRing?: Item | null
  leftRing?: Item | null
  amulet?: Item | null
  belt?: Item | null
  backpack?: Item | null
  cloak?: Item | null
} & Equipment

/**
 * Slot update data for individual slot updates
 */
export type SlotUpdateData = {
  slot: EquipmentSlot
  itemId?: string | null
}

/**
 * Bulk equipment update data
 */
export type BulkEquipmentUpdateData = {
  headId?: string | null
  faceId?: string | null
  chestId?: string | null
  legsId?: string | null
  feetId?: string | null
  handsId?: string | null
  rightHandId?: string | null
  leftHandId?: string | null
  rightRingId?: string | null
  leftRingId?: string | null
  amuletId?: string | null
  beltId?: string | null
  backpackId?: string | null
  cloakId?: string | null
}

/**
 * Equipment slot names
 */
export type EquipmentSlot =
  | 'head'
  | 'face'
  | 'chest'
  | 'legs'
  | 'feet'
  | 'hands'
  | 'rightHand'
  | 'leftHand'
  | 'rightRing'
  | 'leftRing'
  | 'amulet'
  | 'belt'
  | 'backpack'
  | 'cloak'

/**
 * Slot compatibility mapping for item slots
 */
export const SLOT_COMPATIBILITY: Record<string, EquipmentSlot[]> = {
  HEAD: ['head'],
  FACE: ['face'],
  CHEST: ['chest'],
  LEGS: ['legs'],
  FEET: ['feet'],
  HANDS: ['hands'],
  ONE_HAND: ['rightHand', 'leftHand'],
  TWO_HANDS: ['rightHand'], // Two-handed weapons only go in right hand
  RING: ['rightRing', 'leftRing'],
  AMULET: ['amulet'],
  BELT: ['belt'],
  BACKPACK: ['backpack'],
  CLOAK: ['cloak'],
  NONE: [], // Items with no slot cannot be equipped
}

/**
 * Equipment statistics data
 */
export type EquipmentStats = {
  totalEquipment: number
  equipmentWithItems: number
  emptyEquipment: number
  averageItemsPerCharacter: number
  slotUsage: Record<EquipmentSlot, number>
  mostPopularItems: Array<{
    itemId: string
    itemName: string
    slot: string
    usageCount: number
  }>
}

/**
 * Slot validation result
 */
export type SlotValidationResult = {
  isValid: boolean
  error?: string
  conflictingSlot?: EquipmentSlot
}
