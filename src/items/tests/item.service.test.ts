import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createItem,
  findItemById,
  updateItem,
  deleteItem,
  listItems,
  getItemStats,
} from '../item.service'
import { db } from '../../shared/database/index'
import type { AuthUser } from '../../shared/rbac.service'

// Mock user for testing
let mockUser: AuthUser
let mockAdmin: AuthUser

describe('Item Service', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await db.item.deleteMany({})
    await db.equipment.deleteMany({})
    await db.character.deleteMany({})
    await db.image.deleteMany({})
    await db.user.deleteMany({})

    // Create a real user in the database for testing
    const createdUser = await db.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        name: 'Test User',
        role: 'USER',
        isActive: true,
        isEmailVerified: true,
      },
    })

    // Create an admin user for testing
    const createdAdmin = await db.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: 'hashedpassword123',
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
      },
    })

    mockUser = {
      id: createdUser.id,
      role: 'USER',
      isActive: true,
      isEmailVerified: true,
    }

    mockAdmin = {
      id: createdAdmin.id,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    }
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.item.deleteMany({})
    await db.equipment.deleteMany({})
    await db.character.deleteMany({})
    await db.image.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('createItem', () => {
    it('should create a new item successfully', async () => {
      const itemData = {
        name: 'Iron Sword',
        description: 'A well-balanced sword made of iron',
        damage: 25,
        rarity: 'COMMON' as const,
        slot: 'ONE_HAND' as const,
        requiredLevel: 5,
        weight: 2.5,
        value: 100,
        visibility: 'PUBLIC' as const,
      }

      const item = await createItem(itemData, mockUser)

      expect(item).toMatchObject({
        name: 'Iron Sword',
        description: 'A well-balanced sword made of iron',
        damage: 25,
        rarity: 'COMMON',
        slot: 'ONE_HAND',
        requiredLevel: 5,
        weight: 2.5,
        value: 100,
        visibility: 'PUBLIC',
        ownerId: mockUser.id,
      })
      expect(item.id).toBeDefined()
      expect(item.createdAt).toBeDefined()
      expect(item.updatedAt).toBeDefined()
    })

    it('should create an item with default values', async () => {
      const itemData = {
        name: 'Basic Potion',
      }

      const item = await createItem(itemData, mockUser)

      expect(item).toMatchObject({
        name: 'Basic Potion',
        description: null,
        rarity: 'COMMON',
        slot: 'NONE',
        requiredLevel: 1,
        weight: 1.0,
        durability: 100,
        maxDurability: 100,
        value: 0,
        is2Handed: false,
        isThrowable: false,
        isConsumable: false,
        isQuestItem: false,
        isTradeable: true,
        visibility: 'PUBLIC',
        ownerId: mockUser.id,
      })
    })

    it('should create an armor item with defense', async () => {
      const itemData = {
        name: 'Leather Armor',
        description: 'Light armor for beginners',
        defense: 15,
        rarity: 'COMMON' as const,
        slot: 'CHEST' as const,
        requiredLevel: 1,
        weight: 5.0,
        value: 75,
      }

      const item = await createItem(itemData, mockUser)

      expect(item).toMatchObject({
        name: 'Leather Armor',
        defense: 15,
        slot: 'CHEST',
        damage: null, // Should be null for armor
      })
    })

    it('should create a two-handed weapon', async () => {
      const itemData = {
        name: 'Great Sword',
        damage: 45,
        rarity: 'UNCOMMON' as const,
        slot: 'TWO_HANDS' as const,
        is2Handed: true,
        requiredLevel: 10,
        weight: 8.0,
        value: 500,
      }

      const item = await createItem(itemData, mockUser)

      expect(item).toMatchObject({
        name: 'Great Sword',
        damage: 45,
        slot: 'TWO_HANDS',
        is2Handed: true,
      })
    })

    it('should create a consumable item', async () => {
      const itemData = {
        name: 'Health Potion',
        description: 'Restores 50 health points',
        bonusHealth: 50,
        rarity: 'COMMON' as const,
        slot: 'NONE' as const,
        isConsumable: true,
        value: 25,
      }

      const item = await createItem(itemData, mockUser)

      expect(item).toMatchObject({
        name: 'Health Potion',
        bonusHealth: 50,
        isConsumable: true,
        slot: 'NONE',
      })
    })

    it('should require authentication', async () => {
      const itemData = {
        name: 'Test Item',
      }

      await expect(createItem(itemData, undefined)).rejects.toThrow('Authentication required')
    })

    it('should throw error for duplicate item name', async () => {
      const itemData = {
        name: 'Duplicate Item',
      }

      await createItem(itemData, mockUser)

      await expect(createItem(itemData, mockUser)).rejects.toThrow(
        'Item with name "Duplicate Item" already exists',
      )
    })

    it('should validate durability constraints', async () => {
      const itemData = {
        name: 'Broken Item',
        durability: 150,
        maxDurability: 100,
      }

      await expect(createItem(itemData, mockUser)).rejects.toThrow(
        'Durability cannot exceed maximum durability',
      )
    })

    it('should validate two-handed weapon slot constraints', async () => {
      const itemData = {
        name: 'Invalid Two-Handed',
        slot: 'HEAD' as const,
        is2Handed: true,
      }

      await expect(createItem(itemData, mockUser)).rejects.toThrow(
        'Two-handed items must use ONE_HAND or TWO_HANDS slot',
      )
    })

    it('should validate image access when provided', async () => {
      // Create an image owned by a different user
      const otherUser = await db.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword123',
          name: 'Other User',
          role: 'USER',
          isActive: true,
          isEmailVerified: true,
        },
      })

      const image = await db.image.create({
        data: {
          filename: 'test-image.webp',
          blob: Buffer.from('fake-image-data'),
          size: 1024,
          mimeType: 'image/webp',
          width: 200,
          height: 200,
          ownerId: otherUser.id,
          visibility: 'PRIVATE',
        },
      })

      const itemData = {
        name: 'Item with Private Image',
        imageId: image.id,
      }

      await expect(createItem(itemData, mockUser)).rejects.toThrow(
        'Insufficient permissions to use this image',
      )
    })

    it('should throw error for non-existent image', async () => {
      const itemData = {
        name: 'Item with Fake Image',
        imageId: 'non-existent-id',
      }

      await expect(createItem(itemData, mockUser)).rejects.toThrow('Image not found')
    })
  })

  describe('findItemById', () => {
    it('should find an item by ID', async () => {
      const itemData = {
        name: 'Test Item',
        description: 'A test item',
      }

      const createdItem = await createItem(itemData, mockUser)
      const foundItem = await findItemById(createdItem.id, mockUser)

      expect(foundItem).toMatchObject(createdItem)
    })

    it('should throw error for non-existent item', async () => {
      await expect(findItemById('non-existent-id', mockUser)).rejects.toThrow('Item not found')
    })

    it('should respect visibility permissions', async () => {
      const itemData = {
        name: 'Private Item',
        visibility: 'PRIVATE' as const,
      }

      const createdItem = await createItem(itemData, mockUser)

      // Different user should not be able to access private item
      const otherUser = await db.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword123',
          name: 'Other User',
          role: 'USER',
          isActive: true,
          isEmailVerified: true,
        },
      })

      const otherAuthUser: AuthUser = {
        id: otherUser.id,
        role: 'USER',
        isActive: true,
        isEmailVerified: true,
      }

      await expect(findItemById(createdItem.id, otherAuthUser)).rejects.toThrow(
        'Insufficient permissions to access this item',
      )
    })

    it('should allow admin to access any item', async () => {
      const itemData = {
        name: 'Private Item',
        visibility: 'PRIVATE' as const,
      }

      const createdItem = await createItem(itemData, mockUser)
      const foundItem = await findItemById(createdItem.id, mockAdmin)

      expect(foundItem).toMatchObject(createdItem)
    })

    it('should require authentication for private items', async () => {
      const itemData = {
        name: 'Private Item for Auth Test',
        visibility: 'PRIVATE' as const,
      }

      const createdItem = await createItem(itemData, mockUser)

      // Try to access private item without authentication (undefined user)
      await expect(findItemById(createdItem.id, undefined)).rejects.toThrow(
        'Authentication required to access private items',
      )
    })
  })

  describe('updateItem', () => {
    it('should update an item successfully', async () => {
      const itemData = {
        name: 'Original Item',
        description: 'Original description',
        damage: 10,
      }

      const createdItem = await createItem(itemData, mockUser)
      const updateData = {
        description: 'Updated description',
        damage: 15,
      }

      const updatedItem = await updateItem(createdItem.id, updateData, mockUser)

      expect(updatedItem).toMatchObject({
        name: 'Original Item',
        description: 'Updated description',
        damage: 15,
      })
    })

    it('should validate name uniqueness when updating', async () => {
      const item1Data = { name: 'Item 1' }
      const item2Data = { name: 'Item 2' }

      await createItem(item1Data, mockUser)
      const item2 = await createItem(item2Data, mockUser)

      await expect(updateItem(item2.id, { name: 'Item 1' }, mockUser)).rejects.toThrow(
        'Item with name "Item 1" already exists',
      )
    })

    it('should validate durability constraints when updating', async () => {
      const itemData = { name: 'Test Item', maxDurability: 100 }
      const createdItem = await createItem(itemData, mockUser)

      await expect(updateItem(createdItem.id, { durability: 150 }, mockUser)).rejects.toThrow(
        'Durability cannot exceed maximum durability',
      )
    })

    it('should validate two-handed weapon constraints when updating', async () => {
      const itemData = { name: 'Test Weapon', slot: 'ONE_HAND' as const }
      const createdItem = await createItem(itemData, mockUser)

      await expect(
        updateItem(createdItem.id, { slot: 'HEAD' as const, is2Handed: true }, mockUser),
      ).rejects.toThrow('Two-handed items must use ONE_HAND or TWO_HANDS slot')
    })

    it('should require modification permissions', async () => {
      const itemData = { name: 'Test Item' }
      const createdItem = await createItem(itemData, mockUser)

      const otherUser = await db.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword123',
          name: 'Other User',
          role: 'USER',
          isActive: true,
          isEmailVerified: true,
        },
      })

      const otherAuthUser: AuthUser = {
        id: otherUser.id,
        role: 'USER',
        isActive: true,
        isEmailVerified: true,
      }

      await expect(
        updateItem(createdItem.id, { description: 'Updated' }, otherAuthUser),
      ).rejects.toThrow('Insufficient permissions to modify this item')
    })

    it('should throw error for non-existent image when updating', async () => {
      const itemData = { name: 'Test Item' }
      const createdItem = await createItem(itemData, mockUser)

      await expect(
        updateItem(createdItem.id, { imageId: 'non-existent-id' }, mockUser),
      ).rejects.toThrow('Image not found')
    })

    it('should throw error for private image when updating', async () => {
      // Create a private image owned by another user
      const otherUser = await db.user.create({
        data: {
          email: 'imageowner@example.com',
          passwordHash: 'hashedpassword123',
          name: 'Image Owner',
          role: 'USER',
          isActive: true,
          isEmailVerified: true,
        },
      })

      const image = await db.image.create({
        data: {
          filename: 'private.webp',
          blob: Buffer.from('fake-image-data'),
          size: 1000,
          mimeType: 'image/webp',
          width: 100,
          height: 100,
          ownerId: otherUser.id,
          visibility: 'PRIVATE',
        },
      })

      const itemData = { name: 'Test Item' }
      const createdItem = await createItem(itemData, mockUser)

      await expect(updateItem(createdItem.id, { imageId: image.id }, mockUser)).rejects.toThrow(
        'Insufficient permissions to use this image',
      )
    })
  })

  describe('deleteItem', () => {
    it('should delete an item successfully', async () => {
      const itemData = { name: 'Test Item' }
      const createdItem = await createItem(itemData, mockUser)

      await deleteItem(createdItem.id, mockUser)

      await expect(findItemById(createdItem.id, mockUser)).rejects.toThrow('Item not found')
    })

    it('should require deletion permissions', async () => {
      const itemData = { name: 'Test Item' }
      const createdItem = await createItem(itemData, mockUser)

      const otherUser = await db.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword123',
          name: 'Other User',
          role: 'USER',
          isActive: true,
          isEmailVerified: true,
        },
      })

      const otherAuthUser: AuthUser = {
        id: otherUser.id,
        role: 'USER',
        isActive: true,
        isEmailVerified: true,
      }

      await expect(deleteItem(createdItem.id, otherAuthUser)).rejects.toThrow(
        'Insufficient permissions to delete this item',
      )
    })

    it('should prevent deletion of equipped items', async () => {
      // This test will be more relevant once we have character and equipment systems
      // For now, we'll create a basic test structure
      const itemData = { name: 'Equipped Item', slot: 'HEAD' as const }
      const createdItem = await createItem(itemData, mockUser)

      // Create a character and equipment entry
      const race = await db.race.upsert({
        where: { name: 'Human Equipment Test' },
        update: {},
        create: { name: 'Human Equipment Test', ownerId: mockUser.id },
      })

      const archetype = await db.archetype.upsert({
        where: { name: 'Fighter Equipment Test' },
        update: {},
        create: { name: 'Fighter Equipment Test', ownerId: mockUser.id },
      })

      const character = await db.character.create({
        data: {
          name: 'Test Character',
          raceId: race.id,
          archetypeId: archetype.id,
          ownerId: mockUser.id,
        },
      })

      await db.equipment.create({
        data: {
          characterId: character.id,
          headId: createdItem.id,
        },
      })

      await expect(deleteItem(createdItem.id, mockUser)).rejects.toThrow(
        'Cannot delete item "Equipped Item" as it is currently equipped',
      )
    })

    it('should prevent deletion of items in character inventories', async () => {
      const itemData = { name: 'Inventory Item' }
      const createdItem = await createItem(itemData, mockUser)

      // Create a character and add item to inventory
      const race = await db.race.upsert({
        where: { name: 'Elf Inventory Test' },
        update: {},
        create: { name: 'Elf Inventory Test', ownerId: mockUser.id },
      })

      const archetype = await db.archetype.upsert({
        where: { name: 'Rogue Inventory Test' },
        update: {},
        create: { name: 'Rogue Inventory Test', ownerId: mockUser.id },
      })

      await db.character.create({
        data: {
          name: 'Test Character 2',
          raceId: race.id,
          archetypeId: archetype.id,
          ownerId: mockUser.id,
          inventory: {
            connect: { id: createdItem.id },
          },
        },
      })

      await expect(deleteItem(createdItem.id, mockUser)).rejects.toThrow(
        'Cannot delete item "Inventory Item" as it is in the inventory',
      )
    })
  })

  describe('listItems', () => {
    beforeEach(async () => {
      // Create test items
      await createItem({ name: 'Common Sword', rarity: 'COMMON' as const }, mockUser)
      await createItem({ name: 'Rare Shield', rarity: 'RARE' as const }, mockUser)
      await createItem({ name: 'Epic Armor', rarity: 'EPIC' as const }, mockUser)
    })

    it('should list items with pagination', async () => {
      const result = await listItems({ page: 1, limit: 2 }, mockUser)

      expect(result.data).toHaveLength(2)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      })
    })

    it('should filter items by rarity', async () => {
      const result = await listItems({ rarity: 'RARE' }, mockUser)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Rare Shield')
    })

    it('should search items by name', async () => {
      const result = await listItems({ search: 'Sword' }, mockUser)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Common Sword')
    })

    it('should filter by level range', async () => {
      await createItem(
        { name: 'High Level Item', requiredLevel: 50, rarity: 'LEGENDARY' as const },
        mockUser,
      )

      const result = await listItems({ minLevel: 40, maxLevel: 60 }, mockUser)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('High Level Item')
    })

    it('should filter by value range', async () => {
      await createItem({ name: 'Expensive Item', value: 1000 }, mockUser)

      const result = await listItems({ minValue: 500, maxValue: 1500 }, mockUser)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Expensive Item')
    })

    it('should filter by item flags', async () => {
      await createItem({ name: 'Consumable Item', isConsumable: true }, mockUser)

      const result = await listItems({ isConsumable: true }, mockUser)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Consumable Item')
    })
  })

  describe('getItemStats', () => {
    beforeEach(async () => {
      // Create test items with various properties
      await createItem(
        { name: 'Common Sword', rarity: 'COMMON' as const, slot: 'ONE_HAND' as const, damage: 10 },
        mockUser,
      )
      await createItem(
        { name: 'Rare Armor', rarity: 'RARE' as const, slot: 'CHEST' as const, defense: 15 },
        mockUser,
      )
      await createItem(
        { name: 'Magic Ring', rarity: 'EPIC' as const, slot: 'RING' as const },
        mockUser,
      )
      await createItem(
        { name: 'Health Potion', rarity: 'COMMON' as const, isConsumable: true },
        mockUser,
      )
    })

    it('should return comprehensive item statistics', async () => {
      const stats = await getItemStats(mockAdmin)

      expect(stats).toMatchObject({
        totalItems: 4,
        publicItems: 4,
        privateItems: 0,
        orphanedItems: 0,
      })

      expect(stats.itemsByRarity).toMatchObject({
        common: 2,
        rare: 1,
        epic: 1,
        legendary: 0,
      })

      expect(stats.itemsBySlot).toMatchObject({
        none: 1,
        oneHand: 1,
        chest: 1,
        ring: 1,
      })

      expect(stats.itemsByType).toMatchObject({
        weapons: 1, // Items with damage
        armor: 1, // Items with defense
        accessories: 1, // Ring, amulet, belt items
        consumables: 1, // Consumable items
      })
    })

    it('should require statistics viewing permissions', async () => {
      await expect(getItemStats(mockUser)).rejects.toThrow(
        'Insufficient permissions to view item statistics',
      )
    })

    it('should calculate correct averages', async () => {
      const stats = await getItemStats(mockAdmin)

      expect(stats.averageRequiredLevel).toBeGreaterThan(0)
      expect(stats.averageValue).toBeGreaterThanOrEqual(0)
    })

    it('should correctly categorize miscellaneous items', async () => {
      // Create items that should be categorized as miscellaneous
      await createItem(
        {
          name: 'Quest Token',
          isQuestItem: true, // Quest item
          slot: 'NONE' as const,
        },
        mockUser,
      )
      await createItem(
        {
          name: 'Random Trinket',
          // No damage, defense, not ring/amulet/belt, not consumable, not quest item
          slot: 'NONE' as const,
          isConsumable: false,
          isQuestItem: false,
        },
        mockUser,
      )

      const stats = await getItemStats(mockAdmin)

      expect(stats.itemsByType.questItems).toBeGreaterThanOrEqual(1)
      expect(stats.itemsByType.miscellaneous).toBeGreaterThanOrEqual(1)

      // Verify that our specific items are correctly categorized
      const totalCategorized =
        stats.itemsByType.weapons +
        stats.itemsByType.armor +
        stats.itemsByType.accessories +
        stats.itemsByType.consumables +
        stats.itemsByType.questItems +
        stats.itemsByType.miscellaneous

      expect(totalCategorized).toBe(stats.totalItems)
    })
  })
})
