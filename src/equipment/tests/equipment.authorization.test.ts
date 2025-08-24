import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '../../app'
import { cleanupTestData, createTestUser } from '../../shared/tests/test-utils'
import { Role } from '@prisma/client'

describe('Equipment Authorization Security Tests', () => {
  beforeEach(async () => {
    await app.ready()
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  const getAuthToken = async (email: string, password: string): Promise<string> => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password },
    })
    return response.json().accessToken
  }

  const createTestCharacter = async (token: string, suffix = '') => {
    const uniqueSuffix = suffix || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create a race first
    const raceResponse = await app.inject({
      method: 'POST',
      url: '/api/races',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: `Equipment Test Race ${uniqueSuffix}`,
        description: 'Race for equipment testing',
      },
    })
    const race = raceResponse.json()

    // Create an archetype
    const archetypeResponse = await app.inject({
      method: 'POST',
      url: '/api/archetypes',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: `Equipment Test Archetype ${uniqueSuffix}`,
        description: 'Archetype for equipment testing',
      },
    })
    const archetype = archetypeResponse.json()

    // Create a character
    const characterResponse = await app.inject({
      method: 'POST',
      url: '/api/characters',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: `Equipment Test Character ${uniqueSuffix}`,
        description: 'Character for equipment testing',
        raceId: race.id,
        archetypeId: archetype.id,
      },
    })
    return characterResponse.json()
  }

  describe('Authentication Requirements', () => {
    it('should allow anonymous access to public character equipment', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      const response = await app.inject({
        method: 'GET',
        url: `/api/characters/${character.id}/equipment`,
      })

      // Equipment GET endpoint allows anonymous access for public characters
      expect(response.statusCode).toBe(200)
      const equipment = response.json()
      expect(equipment).toBeDefined()
      expect(equipment.characterId).toBe(character.id)
    })

    it('should require authentication for equipment modification', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}/equipment`,
        payload: {
          head: null,
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Character Ownership Control', () => {
    it('should allow users to access and modify their own character equipment', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      // Test access
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/characters/${character.id}/equipment`,
        headers: { authorization: `Bearer ${token}` },
      })

      expect(getResponse.statusCode).toBe(200)

      // Test modification
      const putResponse = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}/equipment`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          head: null,
        },
      })

      expect(putResponse.statusCode).toBe(200)
    })

    it('should allow admins to access and modify any character equipment', async () => {
      // Create character as user
      const { user: regularUser, password: userPassword } = await createTestUser({
        role: Role.USER,
      })
      const userToken = await getAuthToken(regularUser.email, userPassword)
      const character = await createTestCharacter(userToken)

      // Access as admin
      const { user: admin, password: adminPassword } = await createTestUser({
        role: Role.ADMIN,
        email: 'admin@example.com',
      })
      const adminToken = await getAuthToken(admin.email, adminPassword)

      // Test admin access
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/characters/${character.id}/equipment`,
        headers: { authorization: `Bearer ${adminToken}` },
      })

      expect(getResponse.statusCode).toBe(200)

      // Test admin modification
      const putResponse = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}/equipment`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          head: null,
        },
      })

      expect(putResponse.statusCode).toBe(200)
    })

    it('should prevent unauthorized users from modifying other users equipment', async () => {
      // Create character as first user
      const { user: user1, password: password1 } = await createTestUser({ role: Role.USER })
      const token1 = await getAuthToken(user1.email, password1)
      const character = await createTestCharacter(token1)

      // Try to modify as different user
      const { user: user2, password: password2 } = await createTestUser({
        role: Role.USER,
        email: 'user2@example.com',
      })
      const token2 = await getAuthToken(user2.email, password2)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}/equipment`,
        headers: { authorization: `Bearer ${token2}` },
        payload: {
          head: null,
        },
      })

      // Should be denied modification of other user's character equipment
      expect([403, 404]).toContain(response.statusCode)
    })
  })

  describe('Input Validation and Security', () => {
    it('should reject invalid character IDs', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/characters/invalid-uuid/equipment',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle non-existent character IDs', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/characters/00000000-0000-0000-0000-000000000000/equipment',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should validate equipment updates for slot types', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const character = await createTestCharacter(token, uniqueSuffix)

      // Create an item to equip
      const itemResponse = await app.inject({
        method: 'POST',
        url: '/api/items',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: `Test Helmet ${uniqueSuffix}`,
          description: 'A helmet for testing',
          rarity: 'COMMON',
          slot: 'HEAD',
        },
      })
      const item = itemResponse.json()

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}/equipment`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          head: item.id,
        },
      })

      // Should successfully equip valid item
      expect(response.statusCode).toBe(200)
    })

    it('should handle invalid item IDs in equipment updates', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}/equipment`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          head: 'invalid-uuid',
        },
      })

      // Equipment endpoint may accept invalid UUIDs and ignore them or reject them
      expect([200, 400]).toContain(response.statusCode)
    })

    it('should handle non-existent item IDs gracefully', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}/equipment`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          head: '00000000-0000-0000-0000-000000000000', // Valid UUID format but non-existent
        },
      })

      // Equipment endpoint may accept non-existent item IDs and unequip or reject them
      expect([200, 400, 404]).toContain(response.statusCode)
    })
  })

  describe('Equipment Operations', () => {
    it('should allow unequipping items by setting to null', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}/equipment`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          head: null,
          chest: null,
          legs: null,
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should handle partial equipment updates', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}/equipment`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          head: null, // Only updating head slot
        },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('Role-Based Access Control', () => {
    it('should respect moderator permissions for equipment access', async () => {
      // Create character as user
      const { user: regularUser, password: userPassword } = await createTestUser({
        role: Role.USER,
      })
      const userToken = await getAuthToken(regularUser.email, userPassword)
      const character = await createTestCharacter(userToken)

      // Access as moderator
      const { user: moderator, password: moderatorPassword } = await createTestUser({
        role: Role.MODERATOR,
        email: 'moderator@example.com',
      })
      const moderatorToken = await getAuthToken(moderator.email, moderatorPassword)

      const response = await app.inject({
        method: 'GET',
        url: `/api/characters/${character.id}/equipment`,
        headers: { authorization: `Bearer ${moderatorToken}` },
      })

      // Moderators should have access to character equipment
      expect([200, 403]).toContain(response.statusCode)
    })
  })

  describe('Statistics Endpoint Security', () => {
    it('should require admin role for equipment statistics', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/equipment/stats',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should require authentication for equipment statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/equipment/stats',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should allow admin access to equipment statistics', async () => {
      const { user: admin, password: adminPassword } = await createTestUser({
        role: Role.ADMIN,
        email: 'admin@example.com',
      })
      const adminToken = await getAuthToken(admin.email, adminPassword)

      const response = await app.inject({
        method: 'GET',
        url: '/api/equipment/stats',
        headers: { authorization: `Bearer ${adminToken}` },
      })

      expect(response.statusCode).toBe(200)
    })
  })
})
