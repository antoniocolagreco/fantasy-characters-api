/**
 * Character controller tests
 * Integration tests for character HTTP endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '../../app'
import { db } from '../../shared/database/index'
import { cleanupTestData, createTestUser, createTestAdminUser } from '../../shared/tests/test-utils'

describe('Character Controller', () => {
  let testUser: { userData: any; token: string }
  let adminUser: { userData: any; token: string }
  let testRace: { id: string }
  let testArchetype: { id: string }

  // Helper function to get JWT token for authentication
  const getAuthToken = async (email: string, password: string): Promise<string> => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password },
    })

    if (loginResponse.statusCode !== 200) {
      throw new Error(`Login failed with status ${loginResponse.statusCode}: ${loginResponse.body}`)
    }

    const loginBody = loginResponse.json()
    return loginBody.accessToken
  }

  // Helper function to create and authenticate a user
  const createAuthenticatedUser = async (role: 'USER' | 'ADMIN' = 'USER') => {
    const userData = role === 'ADMIN' ? await createTestAdminUser() : await createTestUser()
    const token = await getAuthToken(userData.user.email, userData.password)
    return { userData, token }
  }

  beforeEach(async () => {
    // Clean up database before each test
    await db.character.deleteMany()
    await db.archetype.deleteMany()
    await db.race.deleteMany()
    await cleanupTestData()

    // Create test users with tokens
    testUser = await createAuthenticatedUser('USER')
    adminUser = await createAuthenticatedUser('ADMIN')

    // Create test race
    const raceTestId = Math.random().toString(36).substring(7)
    testRace = await db.race.create({
      data: {
        name: `Test Elf ${raceTestId}`,
        description: 'Test elf race',
        healthModifier: 90,
        manaModifier: 120,
        staminaModifier: 100,
        strengthModifier: 8,
        constitutionModifier: 9,
        dexterityModifier: 12,
        intelligenceModifier: 11,
        wisdomModifier: 10,
        charismaModifier: 10,
        ownerId: adminUser.userData.user.id,
        visibility: 'PUBLIC',
      },
    })

    // Create test archetype
    const archetypeTestId = Math.random().toString(36).substring(7)
    testArchetype = await db.archetype.create({
      data: {
        name: `Test Ranger ${archetypeTestId}`,
        description: 'Test ranger archetype',
        ownerId: adminUser.userData.user.id,
        visibility: 'PUBLIC',
      },
    })
  })

  afterEach(async () => {
    // Clean up database
    await db.character.deleteMany()
    await db.archetype.deleteMany()
    await db.race.deleteMany()
    await cleanupTestData()
  })

  // Helper function to create valid character data
  const createValidCharacterPayload = (overrides: Record<string, any> = {}) => {
    const testId = Math.random().toString(36).substring(7)
    return {
      name: `Test Character ${testId}`,
      sex: 'MALE',
      age: 25,
      description: 'A test character',
      level: 1,
      experience: 0,
      strength: 10,
      constitution: 10,
      dexterity: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      raceId: testRace.id,
      archetypeId: testArchetype.id,
      visibility: 'PUBLIC',
      ...overrides,
    }
  }

  describe('POST /api/characters', () => {
    it('should create character successfully with valid data', async () => {
      const characterData = createValidCharacterPayload()

      const response = await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: characterData,
      })

      expect(response.statusCode).toBe(201)
      const result = JSON.parse(response.body)
      expect(result).toMatchObject({
        name: characterData.name,
        sex: characterData.sex,
        age: characterData.age,
        level: characterData.level,
        ownerId: testUser.userData.user.id,
        raceId: testRace.id,
        archetypeId: testArchetype.id,
      })
    })

    it('should reject character creation without authentication', async () => {
      const characterData = createValidCharacterPayload()

      const response = await app.inject({
        method: 'POST',
        url: '/api/characters',
        payload: characterData,
      })

      expect(response.statusCode).toBe(401)
    })

    it('should reject character creation with invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        age: 15, // Invalid: too young
        raceId: 'invalid-race-id',
        archetypeId: testArchetype.id,
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: invalidData,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject character creation with duplicate name', async () => {
      const characterData = createValidCharacterPayload({ name: 'Duplicate Character' })

      // Create first character
      await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: characterData,
      })

      // Try to create second character with same name
      const response = await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: characterData,
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/characters/:id', () => {
    let characterId: string

    beforeEach(async () => {
      const characterData = createValidCharacterPayload()
      const response = await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: characterData,
      })
      const result = JSON.parse(response.body)
      characterId = result.id
    })

    it('should get character by ID successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/characters/${characterId}`,
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.id).toBe(characterId)
      expect(result.race).toBeDefined()
      expect(result.archetype).toBeDefined()
    })

    it('should return 404 for non-existent character', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/characters/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should respect character visibility for non-owners', async () => {
      // Create private character as testUser
      const privateCharacterData = createValidCharacterPayload({
        name: 'Private Character',
        visibility: 'PRIVATE',
      })
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: privateCharacterData,
      })
      const createResult = JSON.parse(createResponse.body)
      const privateCharacterId = createResult.id

      // Try to access as admin (should work)
      const adminResponse = await app.inject({
        method: 'GET',
        url: `/api/characters/${privateCharacterId}`,
        headers: {
          authorization: `Bearer ${adminUser.token}`,
        },
      })

      expect(adminResponse.statusCode).toBe(200)
    })
  })

  describe('GET /api/characters', () => {
    beforeEach(async () => {
      // Create test characters
      await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: createValidCharacterPayload({ name: 'Character 1', level: 5 }),
      })

      await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: createValidCharacterPayload({ name: 'Character 2', level: 10 }),
      })
    })

    it('should list characters with pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/characters?page=1&limit=10',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.characters).toBeInstanceOf(Array)
      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should filter characters by level', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/characters?minLevel=8',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.characters.every((char: any) => char.level >= 8)).toBe(true)
    })

    it('should search characters by name', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/characters?search=Character%201',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.characters.some((char: any) => char.name.includes('Character 1'))).toBe(true)
    })
  })

  describe('PUT /api/characters/:id', () => {
    let characterId: string

    beforeEach(async () => {
      const characterData = createValidCharacterPayload({ name: 'Character to Update' })
      const response = await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: characterData,
      })
      const result = JSON.parse(response.body)
      characterId = result.id
    })

    it('should update character successfully', async () => {
      const updateData = {
        name: 'Updated Character',
        age: 30,
        level: 5,
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${characterId}`,
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.name).toBe('Updated Character')
      expect(result.age).toBe(30)
      expect(result.level).toBe(5)
    })

    it('should reject updates by non-owner', async () => {
      const otherUser = await createAuthenticatedUser('USER')

      const updateData = { name: 'Hacked Character' }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${characterId}`,
        headers: {
          authorization: `Bearer ${otherUser.token}`,
        },
        payload: updateData,
      })

      expect(response.statusCode).toBe(403)
    })

    it('should allow admin to update any character', async () => {
      const updateData = { name: 'Admin Updated' }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${characterId}`,
        headers: {
          authorization: `Bearer ${adminUser.token}`,
        },
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.name).toBe('Admin Updated')
    })
  })

  describe('DELETE /api/characters/:id', () => {
    let characterId: string

    beforeEach(async () => {
      const characterData = createValidCharacterPayload({ name: 'Character to Delete' })
      const response = await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: characterData,
      })
      const result = JSON.parse(response.body)
      characterId = result.id
    })

    it('should delete character successfully', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/characters/${characterId}`,
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      })

      expect(response.statusCode).toBe(204)

      // Verify character is deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/characters/${characterId}`,
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      })
      expect(getResponse.statusCode).toBe(404)
    })

    it('should reject deletion by non-owner', async () => {
      const otherUser = await createAuthenticatedUser('USER')

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/characters/${characterId}`,
        headers: {
          authorization: `Bearer ${otherUser.token}`,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should allow admin to delete any character', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/characters/${characterId}`,
        headers: {
          authorization: `Bearer ${adminUser.token}`,
        },
      })

      expect(response.statusCode).toBe(204)
    })
  })

  describe('GET /api/characters/stats', () => {
    beforeEach(async () => {
      // Create characters for stats testing
      await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: createValidCharacterPayload({ name: 'Stats Char 1', level: 5 }),
      })

      await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        payload: createValidCharacterPayload({ name: 'Stats Char 2', level: 10 }),
      })
    })

    it('should return character statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/characters/stats',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.success).toBe(true)
      expect(result.data.totalCount).toBeGreaterThanOrEqual(2)
      expect(result.data.levelDistribution).toBeDefined()
      expect(result.data.raceDistribution).toBeDefined()
      expect(result.data.archetypeDistribution).toBeDefined()
    })

    it('should be accessible without authentication for public stats', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/characters/stats',
      })

      expect(response.statusCode).toBe(200)
    })
  })
})
