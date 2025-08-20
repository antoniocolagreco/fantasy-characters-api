import type { Item, Rarity, Slot, Visibility } from '@prisma/client'
import type { Static } from '@sinclair/typebox'
import type { createItemSchema, listItemsQuerySchema, updateItemSchema } from './item.schema'

// Database model types
export type ItemModel = Item

// Request/Response types
export type CreateItemData = Static<typeof createItemSchema>
export type UpdateItemData = Static<typeof updateItemSchema>
export type ListItemsQuery = Static<typeof listItemsQuerySchema>

// Service layer types
export type ItemResponse = {
  id: string
  name: string
  description: string | null

  // Attribute bonuses
  bonusHealth: number | null
  bonusMana: number | null
  bonusStamina: number | null
  bonusStrength: number | null
  bonusConstitution: number | null
  bonusDexterity: number | null
  bonusIntelligence: number | null
  bonusWisdom: number | null
  bonusCharisma: number | null

  // Combat stats
  damage: number | null
  defense: number | null

  // Item properties
  rarity: Rarity
  slot: Slot
  requiredLevel: number
  weight: number
  durability: number
  maxDurability: number
  value: number

  // Item flags
  is2Handed: boolean
  isThrowable: boolean
  isConsumable: boolean
  isQuestItem: boolean
  isTradeable: boolean

  // Relationships
  imageId: string | null
  ownerId: string | null
  visibility: Visibility
  createdAt: Date
  updatedAt: Date
}

// Item statistics data
export type ItemStatsData = {
  totalItems: number
  publicItems: number
  privateItems: number
  orphanedItems: number
  averageRequiredLevel: number
  averageValue: number
  itemsByRarity: {
    common: number
    uncommon: number
    rare: number
    epic: number
    legendary: number
  }
  itemsBySlot: {
    none: number
    head: number
    face: number
    chest: number
    legs: number
    feet: number
    hands: number
    oneHand: number
    twoHands: number
    ring: number
    amulet: number
    belt: number
    backpack: number
    cloak: number
  }
  itemsByType: {
    weapons: number
    armor: number
    accessories: number
    consumables: number
    questItems: number
    miscellaneous: number
  }
}
