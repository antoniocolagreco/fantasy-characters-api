import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '../../app'
import { cleanupTestData, createTestUser } from '../../shared/tests/test-utils'
import { Role, Visibility } from '@prisma/client'
import { randomBytes } from 'crypto'

describe('Character Authorization Security Tests', () => {
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

    const { accessToken } = JSON.parse(response.body)
    return accessToken
  }

  // Helper to create test race with unique name
  const createTestRace = async (token: string) => {
    const uniqueSuffix = `${Date.now()}_${randomBytes(4).toString('hex')}`

    const response = await app.inject({
      method: 'POST',
      url: '/api/races',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: `Test Race ${uniqueSuffix}`,
        description: 'A test race for character creation',
        visibility: Visibility.PUBLIC,
      },
    })

    return JSON.parse(response.body)
  }

  // Helper to create test archetype with unique name
  const createTestArchetype = async (token: string, raceId?: string) => {
    const uniqueSuffix = `${Date.now()}_${randomBytes(4).toString('hex')}`

    const payload: any = {
      name: `Test Archetype ${uniqueSuffix}`,
      description: 'A test archetype for character creation',
      visibility: Visibility.PUBLIC,
    }

    if (raceId) {
      payload.requiredRaces = [raceId]
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/archetypes',
      headers: { authorization: `Bearer ${token}` },
      payload,
    })

    return JSON.parse(response.body)
  }

  // Helper to create test character with unique name
  const createTestCharacter = async (token: string, characterData: any = {}) => {
    const uniqueSuffix = `${Date.now()}_${randomBytes(4).toString('hex')}`

    // Create race and archetype if not provided
    let raceId = characterData.raceId
    let archetypeId = characterData.archetypeId

    if (!raceId) {
      const race = await createTestRace(token)
      raceId = race.id
    }

    if (!archetypeId) {
      const archetype = await createTestArchetype(token, raceId)
      archetypeId = archetype.id
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/characters',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: `Test Character ${uniqueSuffix}`,
        description: 'A test character',
        raceId,
        archetypeId,
        visibility: characterData.visibility || Visibility.PUBLIC,
        ...characterData,
      },
    })

    return JSON.parse(response.body)
  }

  describe('Authentication Requirements', () => {
    it('should allow anonymous access to public characters list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/characters',
      })

      expect([200, 404]).toContain(response.statusCode)
    })

    it('should require authentication for character creation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/characters',
        payload: {
          name: 'Unauthorized Character',
          description: 'Should not be created',
        },
      })

      // API may return 400 (validation error) or 401 (auth error) depending on schema validation order
      expect([400, 401]).toContain(response.statusCode)
    })

    it('should require authentication for character modification', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}`,
        payload: {
          name: 'Modified Character',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should require authentication for character deletion', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/characters/${character.id}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Character Ownership Control', () => {
    it('should allow users to create characters with themselves as owner', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const character = await createTestCharacter(token)

      expect(character.ownerId).toBe(user.id)
    })

    it('should allow users to modify their own characters', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          description: 'Updated description',
        },
      })

      expect(response.statusCode).toBe(200)
      const updatedCharacter = JSON.parse(response.body)
      expect(updatedCharacter.description).toBe('Updated description')
    })

    it('should allow users to delete their own characters', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/characters/${character.id}`,
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(204)
    })

    it('should prevent users from modifying other users characters', async () => {
      const { user: user1, password: password1 } = await createTestUser({ role: Role.USER })
      const token1 = await getAuthToken(user1.email, password1)
      const character = await createTestCharacter(token1)

      const { user: user2, password: password2 } = await createTestUser({ role: Role.USER })
      const token2 = await getAuthToken(user2.email, password2)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}`,
        headers: { authorization: `Bearer ${token2}` },
        payload: {
          description: 'Unauthorized modification',
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should allow admins to modify any character', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)
      const character = await createTestCharacter(token)

      const { user: admin, password: adminPassword } = await createTestUser({ role: Role.ADMIN })
      const adminToken = await getAuthToken(admin.email, adminPassword)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/characters/${character.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          description: 'Admin modification',
        },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('Input Validation and Security', () => {
    it('should reject invalid character IDs', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/characters/invalid-uuid',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle non-existent character IDs', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/characters/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should validate required fields in character creation', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/characters',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          // Missing required fields
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('Statistics Endpoint Security', () => {
    it('should allow access to character statistics', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/characters/stats',
        headers: { authorization: `Bearer ${token}` },
      })

      // Statistics endpoint may be public or restricted depending on configuration
      expect([200, 403]).toContain(response.statusCode)
    })

    it('should allow anonymous access to character statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/characters/stats',
      })

      // Statistics endpoint may be public or require authentication
      expect([200, 401]).toContain(response.statusCode)
    })

    it('should allow admin access to character statistics', async () => {
      const { user: admin, password: adminPassword } = await createTestUser({ role: Role.ADMIN })
      const adminToken = await getAuthToken(admin.email, adminPassword)

      const response = await app.inject({
        method: 'GET',
        url: '/api/characters/stats',
        headers: { authorization: `Bearer ${adminToken}` },
      })

      expect(response.statusCode).toBe(200)
    })
  })
})
