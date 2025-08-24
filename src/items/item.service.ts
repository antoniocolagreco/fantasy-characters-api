import { Visibility, Rarity, Slot } from '@prisma/client'
import { db } from '../shared/prisma.service'
import { createNotFoundError, createConflictError, createUnauthorizedError } from '../shared/errors'
import { PAGINATION } from '../shared/constants'
import {
  rbacService,
  type AuthUser,
  enforceAuthentication,
  enforcePermission,
} from '../shared/rbac.service'
import type {
  CreateItemData,
  UpdateItemData,
  ItemResponse,
  ItemStatsData,
  ListItemsQuery,
} from './item.types'

// Type for database item
type ItemWithCounts = {
  id: string
  name: string
  description: string | null
  bonusHealth: number | null
  bonusMana: number | null
  bonusStamina: number | null
  bonusStrength: number | null
  bonusConstitution: number | null
  bonusDexterity: number | null
  bonusIntelligence: number | null
  bonusWisdom: number | null
  bonusCharisma: number | null
  damage: number | null
  defense: number | null
  rarity: Rarity
  slot: Slot
  requiredLevel: number
  weight: number
  durability: number
  maxDurability: number
  value: number
  is2Handed: boolean
  isThrowable: boolean
  isConsumable: boolean
  isQuestItem: boolean
  isTradeable: boolean
  imageId: string | null
  ownerId: string | null
  visibility: Visibility
  createdAt: Date
  updatedAt: Date
}

// Helper function to transform database item to response format
const transformItem = (item: ItemWithCounts): ItemResponse => {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    bonusHealth: item.bonusHealth,
    bonusMana: item.bonusMana,
    bonusStamina: item.bonusStamina,
    bonusStrength: item.bonusStrength,
    bonusConstitution: item.bonusConstitution,
    bonusDexterity: item.bonusDexterity,
    bonusIntelligence: item.bonusIntelligence,
    bonusWisdom: item.bonusWisdom,
    bonusCharisma: item.bonusCharisma,
    damage: item.damage,
    defense: item.defense,
    rarity: item.rarity,
    slot: item.slot,
    requiredLevel: item.requiredLevel,
    weight: item.weight,
    durability: item.durability,
    maxDurability: item.maxDurability,
    value: item.value,
    is2Handed: item.is2Handed,
    isThrowable: item.isThrowable,
    isConsumable: item.isConsumable,
    isQuestItem: item.isQuestItem,
    isTradeable: item.isTradeable,
    imageId: item.imageId,
    ownerId: item.ownerId,
    visibility: item.visibility,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

/**
 * Create a new item
 */
export const createItem = async (
  data: CreateItemData,
  currentUser: AuthUser | undefined,
): Promise<ItemResponse> => {
  enforceAuthentication(currentUser)

  // Check if item name already exists
  const existingItem = await db.item.findUnique({
    where: { name: data.name },
  })

  if (existingItem) {
    throw createConflictError(`Item with name "${data.name}" already exists`)
  }

  // Validate image exists if provided
  if (data.imageId) {
    const image = await db.image.findUnique({
      where: { id: data.imageId },
    })

    if (!image) {
      throw createNotFoundError('Image not found')
    }

    // Check if user can access the image
    enforcePermission(
      rbacService.canAccessByVisibility(currentUser, image),
      'Insufficient permissions to use this image',
    )
  }

  // Validate item constraints
  if (data.durability !== undefined && data.maxDurability !== undefined) {
    if (data.durability > data.maxDurability) {
      throw createConflictError('Durability cannot exceed maximum durability')
    }
  }

  // Validate slot-specific constraints
  if (data.is2Handed && data.slot && !['ONE_HAND', 'TWO_HANDS'].includes(data.slot)) {
    throw createConflictError('Two-handed items must use ONE_HAND or TWO_HANDS slot')
  }

  // Create item with current user as owner
  const item = await db.item.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      bonusHealth: data.bonusHealth ?? null,
      bonusMana: data.bonusMana ?? null,
      bonusStamina: data.bonusStamina ?? null,
      bonusStrength: data.bonusStrength ?? null,
      bonusConstitution: data.bonusConstitution ?? null,
      bonusDexterity: data.bonusDexterity ?? null,
      bonusIntelligence: data.bonusIntelligence ?? null,
      bonusWisdom: data.bonusWisdom ?? null,
      bonusCharisma: data.bonusCharisma ?? null,
      damage: data.damage ?? null,
      defense: data.defense ?? null,
      rarity: (data.rarity as Rarity) || 'COMMON',
      slot: (data.slot as Slot) || 'NONE',
      requiredLevel: data.requiredLevel ?? 1,
      weight: data.weight ?? 1.0,
      durability: data.durability ?? 100,
      maxDurability: data.maxDurability ?? 100,
      value: data.value ?? 0,
      is2Handed: data.is2Handed ?? false,
      isThrowable: data.isThrowable ?? false,
      isConsumable: data.isConsumable ?? false,
      isQuestItem: data.isQuestItem ?? false,
      isTradeable: data.isTradeable ?? true,
      imageId: data.imageId ?? null,
      visibility: (data.visibility as Visibility) || 'PUBLIC',
      ownerId: currentUser?.id ?? null,
    },
  })

  return transformItem(item)
}

/**
 * Find item by ID with permission check
 */
export const findItemById = async (
  id: string,
  currentUser: AuthUser | undefined,
): Promise<ItemResponse> => {
  const item = await db.item.findUnique({
    where: { id },
  })

  if (!item) {
    throw createNotFoundError('Item not found')
  }

  // Check visibility permissions
  if (item.visibility === 'PRIVATE' && !currentUser) {
    throw createUnauthorizedError('Authentication required to access private items')
  }

  enforcePermission(
    rbacService.canAccessByVisibility(currentUser, item),
    'Insufficient permissions to access this item',
  )

  return transformItem(item)
}

/**
 * List items with pagination and filtering
 */
export const listItems = async (
  query: ListItemsQuery,
  currentUser: AuthUser | undefined,
): Promise<{
  data: ItemResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> => {
  const page = query.page || 1
  const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT)
  const skip = (page - 1) * limit

  // Build filters
  const filters: Record<string, unknown> = {
    AND: [
      rbacService.getOwnershipFilter(currentUser), // RBAC filtering
      query.search
        ? {
            OR: [{ name: { contains: query.search } }, { description: { contains: query.search } }],
          }
        : {},
      query.rarity ? { rarity: query.rarity } : {},
      query.slot ? { slot: query.slot } : {},
      query.minLevel !== undefined ? { requiredLevel: { gte: query.minLevel } } : {},
      query.maxLevel !== undefined ? { requiredLevel: { lte: query.maxLevel } } : {},
      query.minValue !== undefined ? { value: { gte: query.minValue } } : {},
      query.maxValue !== undefined ? { value: { lte: query.maxValue } } : {},
      query.isConsumable !== undefined ? { isConsumable: query.isConsumable } : {},
      query.isQuestItem !== undefined ? { isQuestItem: query.isQuestItem } : {},
      query.isTradeable !== undefined ? { isTradeable: query.isTradeable } : {},
    ].filter(filter => Object.keys(filter).length > 0),
  }

  // Get total count for pagination
  const total = await db.item.count({ where: filters })

  // Get items with pagination
  const items = await db.item.findMany({
    where: filters,
    orderBy: [{ name: 'asc' }],
    skip,
    take: limit,
  })

  return {
    data: items.map(transformItem),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Update item by ID
 */
export const updateItem = async (
  id: string,
  data: UpdateItemData,
  currentUser: AuthUser | undefined,
): Promise<ItemResponse> => {
  const item = await findItemById(id, currentUser)

  // Check modification permissions
  enforcePermission(
    rbacService.canModifyResource(currentUser, item),
    'Insufficient permissions to modify this item',
  )

  // Check for name conflicts if name is being updated
  if (data.name && data.name !== item.name) {
    const existingItem = await db.item.findUnique({
      where: { name: data.name },
    })

    if (existingItem) {
      throw createConflictError(`Item with name "${data.name}" already exists`)
    }
  }

  // Validate image exists if provided
  if (data.imageId) {
    const image = await db.image.findUnique({
      where: { id: data.imageId },
    })

    if (!image) {
      throw createNotFoundError('Image not found')
    }

    // Check if user can access the image
    enforcePermission(
      rbacService.canAccessByVisibility(currentUser, image),
      'Insufficient permissions to use this image',
    )
  }

  // Validate item constraints
  const newDurability = data.durability ?? item.durability
  const newMaxDurability = data.maxDurability ?? item.maxDurability
  if (newDurability > newMaxDurability) {
    throw createConflictError('Durability cannot exceed maximum durability')
  }

  // Validate slot-specific constraints
  const newIs2Handed = data.is2Handed ?? item.is2Handed
  const newSlot = data.slot ?? item.slot
  if (newIs2Handed && !['ONE_HAND', 'TWO_HANDS'].includes(newSlot)) {
    throw createConflictError('Two-handed items must use ONE_HAND or TWO_HANDS slot')
  }

  // Update item
  const updatedItem = await db.item.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.bonusHealth !== undefined && { bonusHealth: data.bonusHealth }),
      ...(data.bonusMana !== undefined && { bonusMana: data.bonusMana }),
      ...(data.bonusStamina !== undefined && { bonusStamina: data.bonusStamina }),
      ...(data.bonusStrength !== undefined && { bonusStrength: data.bonusStrength }),
      ...(data.bonusConstitution !== undefined && { bonusConstitution: data.bonusConstitution }),
      ...(data.bonusDexterity !== undefined && { bonusDexterity: data.bonusDexterity }),
      ...(data.bonusIntelligence !== undefined && { bonusIntelligence: data.bonusIntelligence }),
      ...(data.bonusWisdom !== undefined && { bonusWisdom: data.bonusWisdom }),
      ...(data.bonusCharisma !== undefined && { bonusCharisma: data.bonusCharisma }),
      ...(data.damage !== undefined && { damage: data.damage }),
      ...(data.defense !== undefined && { defense: data.defense }),
      ...(data.rarity && { rarity: data.rarity as Rarity }),
      ...(data.slot && { slot: data.slot as Slot }),
      ...(data.requiredLevel !== undefined && { requiredLevel: data.requiredLevel }),
      ...(data.weight !== undefined && { weight: data.weight }),
      ...(data.durability !== undefined && { durability: data.durability }),
      ...(data.maxDurability !== undefined && { maxDurability: data.maxDurability }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.is2Handed !== undefined && { is2Handed: data.is2Handed }),
      ...(data.isThrowable !== undefined && { isThrowable: data.isThrowable }),
      ...(data.isConsumable !== undefined && { isConsumable: data.isConsumable }),
      ...(data.isQuestItem !== undefined && { isQuestItem: data.isQuestItem }),
      ...(data.isTradeable !== undefined && { isTradeable: data.isTradeable }),
      ...(data.imageId !== undefined && { imageId: data.imageId }),
      ...(data.visibility && { visibility: data.visibility as Visibility }),
    },
  })

  return transformItem(updatedItem)
}

/**
 * Delete item by ID
 */
export const deleteItem = async (id: string, currentUser: AuthUser | undefined): Promise<void> => {
  const item = await findItemById(id, currentUser)

  // Check deletion permissions
  enforcePermission(
    rbacService.canDeleteResource(currentUser, item),
    'Insufficient permissions to delete this item',
  )

  // Check if item is being used in any equipment slots
  const equipmentUsing = await db.equipment.count({
    where: {
      OR: [
        { headId: id },
        { faceId: id },
        { chestId: id },
        { legsId: id },
        { feetId: id },
        { handsId: id },
        { rightHandId: id },
        { leftHandId: id },
        { rightRingId: id },
        { leftRingId: id },
        { amuletId: id },
        { beltId: id },
        { backpackId: id },
        { cloakId: id },
      ],
    },
  })

  if (equipmentUsing > 0) {
    throw createConflictError(
      `Cannot delete item "${item.name}" as it is currently equipped on ${equipmentUsing} character(s)`,
    )
  }

  // Check if item is in any character inventories
  const charactersUsing = await db.character.count({
    where: {
      inventory: {
        some: { id },
      },
    },
  })

  if (charactersUsing > 0) {
    throw createConflictError(
      `Cannot delete item "${item.name}" as it is in the inventory of ${charactersUsing} character(s)`,
    )
  }

  await db.item.delete({
    where: { id },
  })
}

/**
 * Get item statistics
 */
export const getItemStats = async (currentUser: AuthUser | undefined): Promise<ItemStatsData> => {
  // Check permissions for viewing statistics
  enforcePermission(
    rbacService.canViewStatistics(currentUser),
    'Insufficient permissions to view item statistics',
  )

  // Base filter for authorized items
  const baseFilter = rbacService.getOwnershipFilter(currentUser)

  // Get basic counts
  const [totalItems, publicItems, privateItems, orphanedItems] = await Promise.all([
    db.item.count({ where: baseFilter }),
    db.item.count({
      where: { ...baseFilter, visibility: 'PUBLIC' },
    }),
    db.item.count({
      where: { ...baseFilter, visibility: 'PRIVATE' },
    }),
    db.item.count({
      where: { ...baseFilter, ownerId: null },
    }),
  ])

  // Get all items for calculations (only authorized items)
  const items = await db.item.findMany({
    where: baseFilter,
    select: {
      requiredLevel: true,
      value: true,
      rarity: true,
      slot: true,
      damage: true,
      defense: true,
      isConsumable: true,
      isQuestItem: true,
    },
  })

  // Calculate averages
  const averageRequiredLevel =
    items.length > 0 ? items.reduce((sum, item) => sum + item.requiredLevel, 0) / items.length : 0
  const averageValue =
    items.length > 0 ? items.reduce((sum, item) => sum + item.value, 0) / items.length : 0

  // Calculate items by rarity
  const itemsByRarity = {
    common: items.filter(item => item.rarity === 'COMMON').length,
    uncommon: items.filter(item => item.rarity === 'UNCOMMON').length,
    rare: items.filter(item => item.rarity === 'RARE').length,
    epic: items.filter(item => item.rarity === 'EPIC').length,
    legendary: items.filter(item => item.rarity === 'LEGENDARY').length,
  }

  // Calculate items by slot
  const itemsBySlot = {
    none: items.filter(item => item.slot === 'NONE').length,
    head: items.filter(item => item.slot === 'HEAD').length,
    face: items.filter(item => item.slot === 'FACE').length,
    chest: items.filter(item => item.slot === 'CHEST').length,
    legs: items.filter(item => item.slot === 'LEGS').length,
    feet: items.filter(item => item.slot === 'FEET').length,
    hands: items.filter(item => item.slot === 'HANDS').length,
    oneHand: items.filter(item => item.slot === 'ONE_HAND').length,
    twoHands: items.filter(item => item.slot === 'TWO_HANDS').length,
    ring: items.filter(item => item.slot === 'RING').length,
    amulet: items.filter(item => item.slot === 'AMULET').length,
    belt: items.filter(item => item.slot === 'BELT').length,
    backpack: items.filter(item => item.slot === 'BACKPACK').length,
    cloak: items.filter(item => item.slot === 'CLOAK').length,
  }

  // Calculate items by type
  const itemsByType = {
    weapons: items.filter(item => item.damage !== null && item.damage > 0).length,
    armor: items.filter(item => item.defense !== null && item.defense > 0).length,
    accessories: items.filter(item => ['RING', 'AMULET', 'BELT'].includes(item.slot)).length,
    consumables: items.filter(item => item.isConsumable).length,
    questItems: items.filter(item => item.isQuestItem).length,
    miscellaneous: items.filter(
      item =>
        !item.damage &&
        !item.defense &&
        !['RING', 'AMULET', 'BELT'].includes(item.slot) &&
        !item.isConsumable &&
        !item.isQuestItem,
    ).length,
  }

  return {
    totalItems,
    publicItems,
    privateItems,
    orphanedItems,
    averageRequiredLevel: Math.round(averageRequiredLevel * 100) / 100, // Round to 2 decimal places
    averageValue: Math.round(averageValue * 100) / 100, // Round to 2 decimal places
    itemsByRarity,
    itemsBySlot,
    itemsByType,
  }
}
