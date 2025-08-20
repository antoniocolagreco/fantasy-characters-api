import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { db } from '../../shared/database/index'
import type { AuthUser } from '../../shared/rbac.service'
import {
  getCharacterEquipment,
  updateCharacterEquipment,
  updateEquipmentSlot,
  validateSlotCompatibility,
  validateEquipmentUpdate,
  getEquipmentStats,
} from '../equipment.service'

// Test users
const testUser: AuthUser = {
  id: 'test-user-equipment',
  role: 'USER',
  isActive: true,
  isEmailVerified: true,
}

const anotherUser: AuthUser = {
  id: 'another-user-equipment',
  role: 'USER',
  isActive: true,
  isEmailVerified: true,
}

const adminUser: AuthUser = {
  id: 'admin-user-equipment',
  role: 'ADMIN',
  isActive: true,
  isEmailVerified: true,
}

const moderatorUser: AuthUser = {
  id: 'moderator-user-equipment',
  role: 'MODERATOR',
  isActive: true,
  isEmailVerified: true,
}

let testCharacterId: string
let anotherCharacterId: string
let testRaceId: string
let testArchetypeId: string
let testWeaponId: string
let testArmorId: string
let testRingId: string
let testTwoHandedWeaponId: string

describe('Equipment Service', () => {
  beforeAll(async () => {
    // Create test user first
    const user = await db.user.create({
      data: {
        id: testUser.id,
        email: 'test@equipment-service.com',
        passwordHash: 'hashedpassword',
        role: testUser.role,
        isActive: testUser.isActive,
        isEmailVerified: testUser.isEmailVerified,
      },
    })

    // Create another user for permission tests
    await db.user.create({
      data: {
        id: anotherUser.id,
        email: 'another@equipment-service.com',
        passwordHash: 'hashedpassword',
        role: anotherUser.role,
        isActive: anotherUser.isActive,
        isEmailVerified: anotherUser.isEmailVerified,
      },
    })

    // Create test race
    const race = await db.race.create({
      data: {
        name: 'Test Race Equipment',
        description: 'Test race for equipment tests',
        ownerId: user.id,
      },
    })
    testRaceId = race.id

    // Create test archetype
    const archetype = await db.archetype.create({
      data: {
        name: 'Test Archetype Equipment',
        description: 'Test archetype for equipment tests',
        ownerId: user.id,
      },
    })
    testArchetypeId = archetype.id

    // Create test character
    const character = await db.character.create({
      data: {
        name: 'Test Character Equipment',
        ownerId: user.id,
        raceId: race.id,
        archetypeId: archetype.id,
        visibility: 'PUBLIC',
      },
    })
    testCharacterId = character.id

    // Create another character for permission tests
    const anotherCharacter = await db.character.create({
      data: {
        name: 'Another Character Equipment',
        ownerId: anotherUser.id,
        raceId: race.id,
        archetypeId: archetype.id,
        visibility: 'PRIVATE',
      },
    })
    anotherCharacterId = anotherCharacter.id

    // Create test items
    const weapon = await db.item.create({
      data: {
        name: 'Test Sword Equipment',
        description: 'Test weapon for equipment tests',
        slot: 'ONE_HAND',
        damage: 10,
        rarity: 'COMMON',
        ownerId: user.id,
      },
    })
    testWeaponId = weapon.id

    const armor = await db.item.create({
      data: {
        name: 'Test Chest Armor Equipment',
        description: 'Test armor for equipment tests',
        slot: 'CHEST',
        defense: 5,
        rarity: 'COMMON',
        ownerId: user.id,
      },
    })
    testArmorId = armor.id

    const ring = await db.item.create({
      data: {
        name: 'Test Ring Equipment',
        description: 'Test ring for equipment tests',
        slot: 'RING',
        bonusStrength: 2,
        rarity: 'RARE',
        ownerId: user.id,
      },
    })
    testRingId = ring.id

    const twoHandedWeapon = await db.item.create({
      data: {
        name: 'Test Two-Handed Sword Equipment',
        description: 'Test two-handed weapon for equipment tests',
        slot: 'TWO_HANDS',
        damage: 20,
        is2Handed: true,
        rarity: 'EPIC',
        ownerId: user.id,
      },
    })
    testTwoHandedWeaponId = twoHandedWeapon.id
  })

  afterAll(async () => {
    // Clean up test data (check for existence to avoid undefined errors)
    if (testCharacterId || anotherCharacterId) {
      await db.equipment.deleteMany({
        where: {
          characterId: {
            in: [testCharacterId, anotherCharacterId].filter(Boolean),
          },
        },
      })
    }
    if (testCharacterId || anotherCharacterId) {
      await db.character.deleteMany({
        where: {
          id: {
            in: [testCharacterId, anotherCharacterId].filter(Boolean),
          },
        },
      })
    }
    if (testWeaponId || testArmorId || testRingId || testTwoHandedWeaponId) {
      await db.item.deleteMany({
        where: {
          id: {
            in: [testWeaponId, testArmorId, testRingId, testTwoHandedWeaponId].filter(Boolean),
          },
        },
      })
    }
    if (testArchetypeId) {
      await db.archetype.deleteMany({ where: { id: testArchetypeId } })
    }
    if (testRaceId) {
      await db.race.deleteMany({ where: { id: testRaceId } })
    }
    if (testUser.id || anotherUser.id) {
      await db.user.deleteMany({
        where: {
          id: {
            in: [testUser.id, anotherUser.id].filter(Boolean),
          },
        },
      })
    }
  })

  beforeEach(async () => {
    // Clean up equipment before each test
    if (testCharacterId || anotherCharacterId) {
      await db.equipment.deleteMany({
        where: {
          characterId: {
            in: [testCharacterId, anotherCharacterId].filter(Boolean),
          },
        },
      })
    }
  })

  describe('getCharacterEquipment', () => {
    it('should create and return empty equipment for character', async () => {
      const equipment = await getCharacterEquipment(testCharacterId, testUser)

      expect(equipment.characterId).toBe(testCharacterId)
      expect(equipment.head).toBeNull()
      expect(equipment.chest).toBeNull()
      expect(equipment.rightHand).toBeNull()
    })

    it('should return existing equipment with items', async () => {
      // First create equipment with items
      await db.equipment.create({
        data: {
          characterId: testCharacterId,
          chestId: testArmorId,
          rightHandId: testWeaponId,
        },
      })

      const equipment = await getCharacterEquipment(testCharacterId, testUser)

      expect(equipment.characterId).toBe(testCharacterId)
      expect(equipment.chest?.id).toBe(testArmorId)
      expect(equipment.rightHand?.id).toBe(testWeaponId)
    })

    it('should allow access to public character by any user', async () => {
      const equipment = await getCharacterEquipment(testCharacterId, anotherUser)
      expect(equipment.characterId).toBe(testCharacterId)
    })

    it('should deny access to private character by other user', async () => {
      await expect(getCharacterEquipment(anotherCharacterId, testUser)).rejects.toThrow(
        'Insufficient permissions to view this character',
      )
    })

    it('should allow admin access to any character', async () => {
      const equipment = await getCharacterEquipment(anotherCharacterId, adminUser)
      expect(equipment.characterId).toBe(anotherCharacterId)
    })

    it('should throw error for non-existent character', async () => {
      await expect(getCharacterEquipment('non-existent-id', testUser)).rejects.toThrow(
        'Character not found',
      )
    })
  })

  describe('updateCharacterEquipment', () => {
    it('should update equipment with valid items', async () => {
      const updateData = {
        chestId: testArmorId,
        rightHandId: testWeaponId,
      }

      const equipment = await updateCharacterEquipment(testCharacterId, updateData, testUser)

      expect(equipment.chest?.id).toBe(testArmorId)
      expect(equipment.rightHand?.id).toBe(testWeaponId)
    })

    it('should allow unequipping items with null values', async () => {
      // First equip an item
      await updateCharacterEquipment(testCharacterId, { chestId: testArmorId }, testUser)

      // Then unequip it
      const equipment = await updateCharacterEquipment(testCharacterId, { chestId: null }, testUser)

      expect(equipment.chest).toBeNull()
    })

    it('should deny access to character owned by another user', async () => {
      await expect(
        updateCharacterEquipment(anotherCharacterId, { chestId: testArmorId }, testUser),
      ).rejects.toThrow('Insufficient permissions to modify this character')
    })

    it('should allow admin to update any character equipment', async () => {
      const equipment = await updateCharacterEquipment(
        anotherCharacterId,
        { chestId: testArmorId },
        adminUser,
      )

      expect(equipment.chest?.id).toBe(testArmorId)
    })

    it('should throw error for non-existent character', async () => {
      await expect(
        updateCharacterEquipment('non-existent-id', { chestId: testArmorId }, testUser),
      ).rejects.toThrow('Character not found')
    })

    it('should throw error for non-existent item', async () => {
      await expect(
        updateCharacterEquipment(testCharacterId, { chestId: 'non-existent-id' }, testUser),
      ).rejects.toThrow('Items not found')
    })
  })

  describe('updateEquipmentSlot', () => {
    it('should update single equipment slot', async () => {
      const equipment = await updateEquipmentSlot(
        testCharacterId,
        { slot: 'rightHand', itemId: testWeaponId },
        testUser,
      )

      expect(equipment.rightHand?.id).toBe(testWeaponId)
      expect(equipment.leftHand).toBeNull()
    })

    it('should unequip item from slot', async () => {
      // First equip an item
      await updateEquipmentSlot(
        testCharacterId,
        { slot: 'rightHand', itemId: testWeaponId },
        testUser,
      )

      // Then unequip it
      const equipment = await updateEquipmentSlot(
        testCharacterId,
        { slot: 'rightHand', itemId: null },
        testUser,
      )

      expect(equipment.rightHand).toBeNull()
    })
  })

  describe('validateSlotCompatibility', () => {
    it('should validate compatible slots', () => {
      expect(validateSlotCompatibility('chest', 'CHEST', false).isValid).toBe(true)
      expect(validateSlotCompatibility('rightHand', 'ONE_HAND', false).isValid).toBe(true)
      expect(validateSlotCompatibility('leftHand', 'ONE_HAND', false).isValid).toBe(true)
    })

    it('should validate ring slots', () => {
      expect(validateSlotCompatibility('rightRing', 'RING', false).isValid).toBe(true)
      expect(validateSlotCompatibility('leftRing', 'RING', false).isValid).toBe(true)
    })

    it('should reject incompatible slots', () => {
      expect(validateSlotCompatibility('head', 'CHEST', false).isValid).toBe(false)
      expect(validateSlotCompatibility('chest', 'HEAD', false).isValid).toBe(false)
      expect(validateSlotCompatibility('chest', 'RING', false).isValid).toBe(false)
    })

    it('should validate two-handed weapons', () => {
      expect(validateSlotCompatibility('rightHand', 'TWO_HANDS', true).isValid).toBe(true)
      expect(validateSlotCompatibility('leftHand', 'TWO_HANDS', true).isValid).toBe(false)
    })

    it('should reject items with no compatible slots', () => {
      expect(validateSlotCompatibility('head', 'NONE', false).isValid).toBe(false)
      expect(validateSlotCompatibility('chest', 'NONE', false).isValid).toBe(false)
    })
  })

  describe('validateEquipmentUpdate', () => {
    it('should validate empty update', async () => {
      await expect(validateEquipmentUpdate({})).resolves.not.toThrow()
    })

    it('should validate valid item assignments', async () => {
      const updateData = {
        chestId: testArmorId,
        rightHandId: testWeaponId,
      }

      await expect(validateEquipmentUpdate(updateData)).resolves.not.toThrow()
    })

    it('should reject non-existent items', async () => {
      const updateData = { chestId: 'non-existent-id' }

      await expect(validateEquipmentUpdate(updateData)).rejects.toThrow('Items not found')
    })

    it('should reject incompatible slot assignments', async () => {
      const updateData = { headId: testArmorId } // CHEST item in HEAD slot

      await expect(validateEquipmentUpdate(updateData)).rejects.toThrow(
        'cannot be equipped in head slot',
      )
    })

    it('should prevent two-handed weapon conflicts', async () => {
      const updateData = {
        rightHandId: testTwoHandedWeaponId,
        leftHandId: testWeaponId,
      }

      await expect(validateEquipmentUpdate(updateData)).rejects.toThrow('two-handed weapon')
    })

    it('should prevent left hand item with two-handed weapon', async () => {
      const updateData = {
        leftHandId: testTwoHandedWeaponId,
      }

      await expect(validateEquipmentUpdate(updateData)).rejects.toThrow(
        'not compatible with equipment slot',
      )
    })
  })

  describe('getEquipmentStats', () => {
    it('should return equipment statistics for moderator', async () => {
      // Create some equipment for stats
      await db.equipment.create({
        data: {
          characterId: testCharacterId,
          chestId: testArmorId,
          rightHandId: testWeaponId,
        },
      })

      const stats = await getEquipmentStats(moderatorUser)

      expect(stats.totalEquipment).toBeGreaterThan(0)
      expect(stats.equipmentWithItems).toBeGreaterThan(0)
      expect(stats.slotUsage).toBeDefined()
      expect(stats.mostPopularItems).toBeDefined()
      expect(Array.isArray(stats.mostPopularItems)).toBe(true)
    })

    it('should return equipment statistics for admin', async () => {
      const stats = await getEquipmentStats(adminUser)

      expect(stats).toBeDefined()
      expect(typeof stats.totalEquipment).toBe('number')
      expect(typeof stats.equipmentWithItems).toBe('number')
    })

    it('should deny access to regular user', async () => {
      await expect(getEquipmentStats(testUser)).rejects.toThrow('Insufficient permissions')
    })

    it('should deny access to unauthenticated user', async () => {
      await expect(getEquipmentStats(null)).rejects.toThrow('Insufficient permissions')
    })
  })
})
