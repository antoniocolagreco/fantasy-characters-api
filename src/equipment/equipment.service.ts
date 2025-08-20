import { db } from '../shared/database/index'
import { createNotFoundError, createBadRequestError } from '../shared/errors'
import { rbacService, type AuthUser } from '../shared/rbac.service'
import {
  SLOT_COMPATIBILITY,
  type EquipmentWithItems,
  type SlotUpdateData,
  type BulkEquipmentUpdateData,
  type EquipmentStats,
  type EquipmentSlot,
  type SlotValidationResult,
} from './equipment.types'

/**
 * Get character equipment with all equipped items
 */
export const getCharacterEquipment = async (
  characterId: string,
  currentUser: AuthUser | null,
): Promise<EquipmentWithItems> => {
  // Find character first to check ownership/visibility
  const character = await db.character.findUnique({
    where: { id: characterId },
    include: { owner: true },
  })

  if (!character) {
    throw createNotFoundError('Character not found')
  }

  // Check access permissions based on character visibility and ownership
  rbacService.enforcePermission(
    rbacService.canAccessByVisibility(currentUser, character),
    'Insufficient permissions to view this character',
  )

  // Find or create equipment for the character
  let equipment = await db.equipment.findUnique({
    where: { characterId },
    include: {
      head: true,
      face: true,
      chest: true,
      legs: true,
      feet: true,
      hands: true,
      rightHand: true,
      leftHand: true,
      rightRing: true,
      leftRing: true,
      amulet: true,
      belt: true,
      backpack: true,
      cloak: true,
    },
  })

  // Create equipment if it doesn't exist
  if (!equipment) {
    equipment = await db.equipment.create({
      data: { characterId },
      include: {
        head: true,
        face: true,
        chest: true,
        legs: true,
        feet: true,
        hands: true,
        rightHand: true,
        leftHand: true,
        rightRing: true,
        leftRing: true,
        amulet: true,
        belt: true,
        backpack: true,
        cloak: true,
      },
    })
  }

  return equipment
}

/**
 * Update character equipment with slot validation
 */
export const updateCharacterEquipment = async (
  characterId: string,
  updateData: BulkEquipmentUpdateData,
  currentUser: AuthUser | null,
): Promise<EquipmentWithItems> => {
  // Find character first to check ownership
  const character = await db.character.findUnique({
    where: { id: characterId },
    include: { owner: true },
  })

  if (!character) {
    throw createNotFoundError('Character not found')
  }

  // Check modification permissions
  rbacService.enforcePermission(
    rbacService.canModifyResource(currentUser, character),
    'Insufficient permissions to modify this character',
  )

  // Validate all item IDs and their slot compatibility
  await validateEquipmentUpdate(updateData)

  // Find or create equipment
  let equipment = await db.equipment.findUnique({
    where: { characterId },
  })

  if (!equipment) {
    equipment = await db.equipment.create({
      data: { characterId },
    })
  }

  // Process update data to handle null values and empty strings properly
  const processedUpdateData: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(updateData)) {
    // Handle null, empty string, and undefined as null
    if (value === null || value === '' || value === undefined) {
      processedUpdateData[key] = null
    } else if (typeof value === 'string') {
      processedUpdateData[key] = value
    }
  }

  // Update equipment with processed data
  const updatedEquipment = await db.equipment.update({
    where: { id: equipment.id },
    data: processedUpdateData,
    include: {
      head: true,
      face: true,
      chest: true,
      legs: true,
      feet: true,
      hands: true,
      rightHand: true,
      leftHand: true,
      rightRing: true,
      leftRing: true,
      amulet: true,
      belt: true,
      backpack: true,
      cloak: true,
    },
  })

  return updatedEquipment
}

/**
 * Update a single equipment slot
 */
export const updateEquipmentSlot = async (
  characterId: string,
  slotData: SlotUpdateData,
  currentUser: AuthUser | null,
): Promise<EquipmentWithItems> => {
  // Convert slot update to bulk update format
  const bulkUpdate: BulkEquipmentUpdateData = {
    [`${slotData.slot}Id`]: slotData.itemId,
  }

  return updateCharacterEquipment(characterId, bulkUpdate, currentUser)
}

/**
 * Validate equipment update data
 */
export const validateEquipmentUpdate = async (
  updateData: BulkEquipmentUpdateData,
): Promise<void> => {
  const itemIds: string[] = []
  const slotUpdates: Array<{ slot: EquipmentSlot; itemId: string }> = []

  // Collect all item IDs and slot mappings
  for (const [key, itemId] of Object.entries(updateData)) {
    if (itemId && typeof itemId === 'string') {
      itemIds.push(itemId)
      const slot = key.replace('Id', '') as EquipmentSlot
      slotUpdates.push({ slot, itemId })
    }
  }

  if (itemIds.length === 0) {
    return // No items to validate
  }

  // Fetch all items to validate
  const items = await db.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, slot: true, is2Handed: true },
  })

  // Check that all items exist
  if (items.length !== itemIds.length) {
    const foundIds = items.map(item => item.id)
    const missingIds = itemIds.filter(id => !foundIds.includes(id))
    throw createBadRequestError(`Items not found: ${missingIds.join(', ')}`)
  }

  // Validate slot compatibility and conflicts
  for (const { slot, itemId } of slotUpdates) {
    const item = items.find(i => i.id === itemId)
    if (!item) continue

    // Check slot compatibility
    const validation = validateSlotCompatibility(slot, item.slot, item.is2Handed)
    if (!validation.isValid) {
      throw createBadRequestError(
        `Item "${item.name}" cannot be equipped in ${slot} slot: ${validation.error}`,
      )
    }

    // Check for two-handed weapon conflicts
    if (item.is2Handed && slot === 'rightHand') {
      const leftHandUpdate = slotUpdates.find(s => s.slot === 'leftHand')
      if (leftHandUpdate && leftHandUpdate.itemId) {
        throw createBadRequestError(
          `Cannot equip two-handed weapon "${item.name}" while left hand slot is occupied`,
        )
      }
    }

    if (slot === 'leftHand') {
      const rightHandUpdate = slotUpdates.find(s => s.slot === 'rightHand')
      if (rightHandUpdate) {
        const rightHandItem = items.find(i => i.id === rightHandUpdate.itemId)
        if (rightHandItem?.is2Handed) {
          throw createBadRequestError(
            `Cannot equip item in left hand while two-handed weapon "${rightHandItem.name}" is equipped`,
          )
        }
      }
    }
  }
}

/**
 * Validate slot compatibility for an item
 */
export const validateSlotCompatibility = (
  equipmentSlot: EquipmentSlot,
  itemSlot: string,
  is2Handed: boolean,
): SlotValidationResult => {
  const compatibleSlots = SLOT_COMPATIBILITY[itemSlot] || []

  if (compatibleSlots.length === 0) {
    return {
      isValid: false,
      error: 'Item cannot be equipped (no compatible slots)',
    }
  }

  if (!compatibleSlots.includes(equipmentSlot)) {
    return {
      isValid: false,
      error: `Item slot "${itemSlot}" is not compatible with equipment slot "${equipmentSlot}"`,
    }
  }

  // Special validation for two-handed weapons
  if (is2Handed && itemSlot === 'TWO_HANDS' && equipmentSlot !== 'rightHand') {
    return {
      isValid: false,
      error: 'Two-handed weapons must be equipped in the right hand slot',
    }
  }

  return { isValid: true }
}

/**
 * Get equipment statistics
 */
export const getEquipmentStats = async (currentUser: AuthUser | null): Promise<EquipmentStats> => {
  // Only moderators and admins can view statistics
  rbacService.enforcePermission(
    Boolean(currentUser && ['MODERATOR', 'ADMIN'].includes(currentUser.role)),
    'Insufficient permissions to view equipment statistics',
  )

  // Get total equipment count
  const totalEquipment = await db.equipment.count()

  // Get equipment with at least one item
  const equipmentWithItems = await db.equipment.count({
    where: {
      OR: [
        { headId: { not: null } },
        { faceId: { not: null } },
        { chestId: { not: null } },
        { legsId: { not: null } },
        { feetId: { not: null } },
        { handsId: { not: null } },
        { rightHandId: { not: null } },
        { leftHandId: { not: null } },
        { rightRingId: { not: null } },
        { leftRingId: { not: null } },
        { amuletId: { not: null } },
        { beltId: { not: null } },
        { backpackId: { not: null } },
        { cloakId: { not: null } },
      ],
    },
  })

  const emptyEquipment = totalEquipment - equipmentWithItems
  const averageItemsPerCharacter = totalEquipment > 0 ? equipmentWithItems / totalEquipment : 0

  // Get slot usage statistics
  const slotUsage = await getSlotUsageStats()

  // Get most popular items
  const mostPopularItems = await getMostPopularItems()

  return {
    totalEquipment,
    equipmentWithItems,
    emptyEquipment,
    averageItemsPerCharacter,
    slotUsage,
    mostPopularItems,
  }
}

/**
 * Get usage statistics for each equipment slot
 */
export const getSlotUsageStats = async (): Promise<Record<EquipmentSlot, number>> => {
  const results = await db.equipment.findMany({
    select: {
      headId: true,
      faceId: true,
      chestId: true,
      legsId: true,
      feetId: true,
      handsId: true,
      rightHandId: true,
      leftHandId: true,
      rightRingId: true,
      leftRingId: true,
      amuletId: true,
      beltId: true,
      backpackId: true,
      cloakId: true,
    },
  })

  return {
    head: results.filter(eq => eq.headId).length,
    face: results.filter(eq => eq.faceId).length,
    chest: results.filter(eq => eq.chestId).length,
    legs: results.filter(eq => eq.legsId).length,
    feet: results.filter(eq => eq.feetId).length,
    hands: results.filter(eq => eq.handsId).length,
    rightHand: results.filter(eq => eq.rightHandId).length,
    leftHand: results.filter(eq => eq.leftHandId).length,
    rightRing: results.filter(eq => eq.rightRingId).length,
    leftRing: results.filter(eq => eq.leftRingId).length,
    amulet: results.filter(eq => eq.amuletId).length,
    belt: results.filter(eq => eq.beltId).length,
    backpack: results.filter(eq => eq.backpackId).length,
    cloak: results.filter(eq => eq.cloakId).length,
  }
}

/**
 * Get most popular equipped items
 */
export const getMostPopularItems = async (): Promise<
  Array<{
    itemId: string
    itemName: string
    slot: string
    usageCount: number
  }>
> => {
  // This is a complex query that would be better done with raw SQL
  // For now, we'll implement a simplified version
  const equipment = await db.equipment.findMany({
    include: {
      head: { select: { id: true, name: true, slot: true } },
      face: { select: { id: true, name: true, slot: true } },
      chest: { select: { id: true, name: true, slot: true } },
      legs: { select: { id: true, name: true, slot: true } },
      feet: { select: { id: true, name: true, slot: true } },
      hands: { select: { id: true, name: true, slot: true } },
      rightHand: { select: { id: true, name: true, slot: true } },
      leftHand: { select: { id: true, name: true, slot: true } },
      rightRing: { select: { id: true, name: true, slot: true } },
      leftRing: { select: { id: true, name: true, slot: true } },
      amulet: { select: { id: true, name: true, slot: true } },
      belt: { select: { id: true, name: true, slot: true } },
      backpack: { select: { id: true, name: true, slot: true } },
      cloak: { select: { id: true, name: true, slot: true } },
    },
  })

  // Count item usage
  const itemCounts = new Map<string, { itemName: string; slot: string; count: number }>()

  for (const eq of equipment) {
    const items = [
      eq.head,
      eq.face,
      eq.chest,
      eq.legs,
      eq.feet,
      eq.hands,
      eq.rightHand,
      eq.leftHand,
      eq.rightRing,
      eq.leftRing,
      eq.amulet,
      eq.belt,
      eq.backpack,
      eq.cloak,
    ].filter(Boolean)

    for (const item of items) {
      if (item) {
        const existing = itemCounts.get(item.id)
        if (existing) {
          existing.count++
        } else {
          itemCounts.set(item.id, {
            itemName: item.name,
            slot: item.slot,
            count: 1,
          })
        }
      }
    }
  }

  // Convert to array and sort by usage count
  return Array.from(itemCounts.entries())
    .map(([itemId, data]) => ({
      itemId,
      itemName: data.itemName,
      slot: data.slot,
      usageCount: data.count,
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10) // Top 10 most popular items
}
