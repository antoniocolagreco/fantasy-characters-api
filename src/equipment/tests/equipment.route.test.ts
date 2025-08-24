import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../app'
import type { AuthUser } from '../../auth/auth.types'
import { generateAccessToken } from '../../auth/jwt.utils'
import { db } from '../../shared/prisma.service'

// Test users
const testUser: AuthUser = {
  id: 'test-user-equipment-route',
  email: 'test@equipment.test',
  role: 'USER',
  isActive: true,
  isEmailVerified: true,
}

const adminUser: AuthUser = {
  id: 'admin-user-equipment-route',
  email: 'admin@equipment.test',
  role: 'ADMIN',
  isActive: true,
  isEmailVerified: true,
}

const anotherUser: AuthUser = {
  id: 'another-user-equipment-route',
  email: 'another@equipment.test',
  role: 'USER',
  isActive: true,
  isEmailVerified: true,
}

let testCharacterId: string
let anotherCharacterId: string
let testRaceId: string
let testArchetypeId: string
let testWeaponId: string
let testArmorId: string
let testUserToken: string
let adminUserToken: string

describe('Equipment Routes', () => {
  beforeAll(async () => {
    // Create test users in database
    await db.user.create({
      data: {
        id: testUser.id,
        email: 'test-equipment-route@example.com',
        passwordHash: 'hashedpassword',
        role: testUser.role,
        isActive: testUser.isActive,
        isEmailVerified: testUser.isEmailVerified,
      },
    })

    await db.user.create({
      data: {
        id: adminUser.id,
        email: 'admin-equipment-route@example.com',
        passwordHash: 'hashedpassword',
        role: adminUser.role,
        isActive: adminUser.isActive,
        isEmailVerified: adminUser.isEmailVerified,
      },
    })

    await db.user.create({
      data: {
        id: anotherUser.id,
        email: 'another-equipment-route@example.com',
        passwordHash: 'hashedpassword',
        role: anotherUser.role,
        isActive: anotherUser.isActive,
        isEmailVerified: anotherUser.isEmailVerified,
      },
    })

    // Generate JWT tokens
    testUserToken = generateAccessToken({
      id: testUser.id,
      email: 'test-equipment-route@example.com',
      name: null,
      bio: null,
      role: testUser.role as string,
      isEmailVerified: testUser.isEmailVerified,
      isActive: testUser.isActive,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    adminUserToken = generateAccessToken({
      id: adminUser.id,
      email: 'admin-equipment-route@example.com',
      name: null,
      bio: null,
      role: adminUser.role as string,
      isEmailVerified: adminUser.isEmailVerified,
      isActive: adminUser.isActive,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // Create test race
    const race = await db.race.create({
      data: {
        name: 'Test Race Equipment Route',
        description: 'Test race for equipment route tests',
        ownerId: testUser.id,
      },
    })
    testRaceId = race.id

    // Create test archetype
    const archetype = await db.archetype.create({
      data: {
        name: 'Test Archetype Equipment Route',
        description: 'Test archetype for equipment route tests',
        ownerId: testUser.id,
      },
    })
    testArchetypeId = archetype.id

    // Create test characters
    const character = await db.character.create({
      data: {
        name: 'Test Character Equipment Route',
        ownerId: testUser.id,
        raceId: testRaceId,
        archetypeId: testArchetypeId,
        visibility: 'PUBLIC',
      },
    })
    testCharacterId = character.id

    const anotherCharacter = await db.character.create({
      data: {
        name: 'Another Character Equipment Route',
        ownerId: anotherUser.id,
        raceId: testRaceId,
        archetypeId: testArchetypeId,
        visibility: 'PRIVATE',
      },
    })
    anotherCharacterId = anotherCharacter.id

    // Create test items
    const weapon = await db.item.create({
      data: {
        name: 'Test Sword Equipment Route',
        description: 'Test weapon for equipment route tests',
        slot: 'ONE_HAND',
        damage: 10,
        rarity: 'COMMON',
        ownerId: testUser.id,
      },
    })
    testWeaponId = weapon.id

    const armor = await db.item.create({
      data: {
        name: 'Test Chest Armor Equipment Route',
        description: 'Test armor for equipment route tests',
        slot: 'CHEST',
        defense: 5,
        rarity: 'COMMON',
        ownerId: testUser.id,
      },
    })
    testArmorId = armor.id
  })

  afterAll(async () => {
    // Clean up test data
    await db.equipment.deleteMany({
      where: { characterId: { in: [testCharacterId, anotherCharacterId] } },
    })
    await db.character.deleteMany({
      where: { id: { in: [testCharacterId, anotherCharacterId] } },
    })
    await db.item.deleteMany({
      where: { id: { in: [testWeaponId, testArmorId] } },
    })
    await db.archetype.deleteMany({ where: { id: testArchetypeId } })
    await db.race.deleteMany({ where: { id: testRaceId } })
    await db.user.deleteMany({
      where: { id: { in: [testUser.id, adminUser.id, anotherUser.id] } },
    })
  })

  beforeEach(async () => {
    // Clean up equipment before each test
    await db.equipment.deleteMany({
      where: { characterId: { in: [testCharacterId, anotherCharacterId] } },
    })
  })

  describe('GET /api/characters/:id/equipment', () => {
    it('should get character equipment without authentication for public character', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/characters/${testCharacterId}/equipment`,
      })

      expect(response.statusCode).toBe(200)
      const equipment = JSON.parse(response.body)
      expect(equipment.characterId).toBe(testCharacterId)
      // Equipment slots should be null for new character
      expect(equipment.head).toBeNull()
      expect(equipment.chest).toBeNull()
    })

    it('should get character equipment with authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/characters/${testCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const equipment = JSON.parse(response.body)
      expect(equipment.characterId).toBe(testCharacterId)
    })

    it('should return 403 for private character without proper access', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/characters/${anotherCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should allow admin access to any character', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/characters/${anotherCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${adminUserToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should return 404 for non-existent character', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/characters/00000000-0000-0000-0000-000000000000/equipment',
        headers: {
          authorization: `Bearer ${testUserToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('PUT /api/characters/:id/equipment', () => {
    it('should update character equipment with valid data', async () => {
      const updateData = {
        chestId: testArmorId,
        rightHandId: testWeaponId,
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${testCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify(updateData),
      })

      if (response.statusCode !== 200) {
        console.error('Error response:', response.statusCode, response.body)
      }
      expect(response.statusCode).toBe(200)
      const equipment = JSON.parse(response.body)
      expect(equipment.chest.id).toBe(testArmorId)
      expect(equipment.rightHand.id).toBe(testWeaponId)
    })

    it('should unequip items with null values', async () => {
      // First equip an item
      await app.inject({
        method: 'PUT',
        url: `/api/characters/${testCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ chestId: testArmorId }),
      })

      // Then unequip it
      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${testCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ chestId: null }),
      })

      expect(response.statusCode).toBe(200)
      const equipment = JSON.parse(response.body)
      expect(equipment.chest).toBeNull()
    })

    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${testCharacterId}/equipment`,
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ chestId: testArmorId }),
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 403 for character owned by another user', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${anotherCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ chestId: testArmorId }),
      })

      expect(response.statusCode).toBe(403)
    })

    it('should return 400 for invalid item ID', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${testCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ chestId: 'invalid-uuid' }),
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 for non-existent item', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${testCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ chestId: '123e4567-e89b-12d3-a456-426614174000' }),
      })

      expect(response.statusCode).toBe(400)
      expect(response.body).toContain('Items not found')
    })
  })

  describe('PATCH /api/characters/:id/equipment', () => {
    it('should update single equipment slot', async () => {
      const slotData = {
        slot: 'rightHand',
        itemId: testWeaponId,
      }

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/characters/${testCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify(slotData),
      })

      expect(response.statusCode).toBe(200)
      const equipment = JSON.parse(response.body)
      expect(equipment.rightHand.id).toBe(testWeaponId)
      expect(equipment.leftHand).toBeNull()
    })

    it('should unequip item from slot', async () => {
      // First equip an item
      await app.inject({
        method: 'PATCH',
        url: `/api/characters/${testCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ slot: 'rightHand', itemId: testWeaponId }),
      })

      // Then unequip it
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/characters/${testCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ slot: 'rightHand', itemId: null }),
      })

      expect(response.statusCode).toBe(200)
      const equipment = JSON.parse(response.body)
      expect(equipment.rightHand).toBeNull()
    })

    it('should return 400 for invalid slot', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/characters/${testCharacterId}/equipment`,
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ slot: 'invalidSlot', itemId: testWeaponId }),
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/equipment/stats', () => {
    beforeEach(async () => {
      // Ensure we have equipment with items for stats testing
      await db.equipment.upsert({
        where: { characterId: testCharacterId },
        create: {
          characterId: testCharacterId,
          chestId: testArmorId,
          rightHandId: testWeaponId,
        },
        update: {
          chestId: testArmorId,
          rightHandId: testWeaponId,
        },
      })
    })

    it('should return equipment statistics for admin', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/equipment/stats',
        headers: {
          authorization: `Bearer ${adminUserToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const stats = JSON.parse(response.body)
      expect(stats.totalEquipment).toBeGreaterThan(0)
      expect(stats.equipmentWithItems).toBeGreaterThan(0)
      expect(stats.slotUsage).toBeDefined()
      expect(stats.slotUsage.chest).toBeGreaterThan(0)
      expect(stats.mostPopularItems).toBeDefined()
      expect(Array.isArray(stats.mostPopularItems)).toBe(true)
    })

    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/equipment/stats',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 403 for regular user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/equipment/stats',
        headers: {
          authorization: `Bearer ${testUserToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
    })
  })
})
