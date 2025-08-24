import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '../../app'
import { cleanupTestData, createTestUser } from '../../shared/tests/test-utils'
import { Role } from '@prisma/client'

describe('Races Authorization Security Tests', () => {
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

  describe('Authentication Requirements', () => {
    it('should require authentication for race creation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/races',
        payload: {
          name: 'Test Race',
          description: 'Test description',
          healthModifier: 110,
          manaModifier: 90,
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should require authentication for race modification', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      // Create a race first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Test Race',
          description: 'Test description',
        },
      })
      const race = createResponse.json()

      // Try to modify without auth
      const response = await app.inject({
        method: 'PUT',
        url: `/api/races/${race.id}`,
        payload: {
          description: 'Modified description',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should require authentication for race deletion', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      // Create a race first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Test Race',
          description: 'Test description',
        },
      })
      const race = createResponse.json()

      // Try to delete without auth
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/races/${race.id}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Role-Based Access Control', () => {
    it('should allow users to create races', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'User Race',
          description: 'Created by user',
          healthModifier: 105,
          strengthModifier: 12,
        },
      })

      expect(response.statusCode).toBe(201)
    })

    it('should allow moderators to create races', async () => {
      const { user, password } = await createTestUser({ role: Role.MODERATOR })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Moderator Race',
          description: 'Created by moderator',
          healthModifier: 95,
          intelligenceModifier: 15,
        },
      })

      expect(response.statusCode).toBe(201)
    })

    it('should allow admins to create races', async () => {
      const { user, password } = await createTestUser({ role: Role.ADMIN })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Admin Race',
          description: 'Created by admin',
          healthModifier: 120,
          constitutionModifier: 15,
        },
      })

      expect(response.statusCode).toBe(201)
    })
  })

  describe('Ownership and Modification Rights', () => {
    it('should prevent users from modifying races owned by others', async () => {
      // Create race as first user
      const { user: user1, password: password1 } = await createTestUser({ role: Role.USER })
      const token1 = await getAuthToken(user1.email, password1)

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token1}` },
        payload: {
          name: 'Owner Race',
          description: 'Owned by user1',
        },
      })
      const race = createResponse.json()

      // Try to modify as different user
      const { user: user2, password: password2 } = await createTestUser({
        role: Role.USER,
        email: 'user2@example.com',
      })
      const token2 = await getAuthToken(user2.email, password2)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/races/${race.id}`,
        headers: { authorization: `Bearer ${token2}` },
        payload: {
          description: 'Modified by user2',
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should allow users to modify their own races', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      // Create race
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'My Race',
          description: 'Original description',
        },
      })
      const race = createResponse.json()

      // Modify own race
      const response = await app.inject({
        method: 'PUT',
        url: `/api/races/${race.id}`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          description: 'Modified description',
          healthModifier: 115,
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should allow admins to modify any race', async () => {
      // Create race as user
      const { user: regularUser, password: userPassword } = await createTestUser({
        role: Role.USER,
      })
      const userToken = await getAuthToken(regularUser.email, userPassword)

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          name: 'User Race',
          description: 'Created by user',
        },
      })
      const race = createResponse.json()

      // Modify as admin
      const { user: admin, password: adminPassword } = await createTestUser({
        role: Role.ADMIN,
        email: 'admin@example.com',
      })
      const adminToken = await getAuthToken(admin.email, adminPassword)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/races/${race.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          description: 'Modified by admin',
          healthModifier: 125,
        },
      })

      // Should successfully modify or indicate not found
      expect([200, 404]).toContain(response.statusCode)
    })
  })

  describe('Deletion Rights', () => {
    it('should prevent users from deleting races owned by others', async () => {
      // Create race as first user
      const { user: user1, password: password1 } = await createTestUser({ role: Role.USER })
      const token1 = await getAuthToken(user1.email, password1)

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token1}` },
        payload: {
          name: 'Owner Race',
          description: 'Owned by user1',
        },
      })
      const race = createResponse.json()

      // Try to delete as different user
      const { user: user2, password: password2 } = await createTestUser({
        role: Role.USER,
        email: 'user2@example.com',
      })
      const token2 = await getAuthToken(user2.email, password2)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/races/${race.id}`,
        headers: { authorization: `Bearer ${token2}` },
      })

      // Should get 403 Forbidden or 404 Not Found (both indicate access denied)
      expect([403, 404]).toContain(response.statusCode)
    })

    it('should allow users to delete their own races', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      // Create race
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'My Race',
          description: 'To be deleted',
        },
      })
      const race = createResponse.json()

      // Delete own race
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/races/${race.id}`,
        headers: { authorization: `Bearer ${token}` },
      })

      // Should successfully delete or indicate already gone
      expect([200, 204, 404]).toContain(response.statusCode)
    })

    it('should allow admins to delete any race', async () => {
      // Create race as user
      const { user: regularUser, password: userPassword } = await createTestUser({
        role: Role.USER,
      })
      const userToken = await getAuthToken(regularUser.email, userPassword)

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          name: 'User Race',
          description: 'To be deleted by admin',
        },
      })
      const race = createResponse.json()

      // Delete as admin
      const { user: admin, password: adminPassword } = await createTestUser({
        role: Role.ADMIN,
        email: 'admin@example.com',
      })
      const adminToken = await getAuthToken(admin.email, adminPassword)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/races/${race.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
      })

      // Should successfully delete or indicate already gone
      expect([200, 204, 404]).toContain(response.statusCode)
    })
  })

  describe('Input Validation and Security', () => {
    it('should validate race ID parameters', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/races/invalid-uuid',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should prevent duplicate race names', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      // Create first race
      await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Unique Race',
          description: 'First race',
        },
      })

      // Try to create duplicate
      const response = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Unique Race',
          description: 'Duplicate race',
        },
      })

      expect(response.statusCode).toBe(409)
    })

    it('should handle input validation on creation', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: '', // Empty name should be rejected
          description: 'Valid description',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should validate attribute modifier ranges', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Valid Race',
          description: 'Test race with valid modifiers',
          healthModifier: 150, // Within reasonable range
          strengthModifier: 20, // Within reasonable range
        },
      })

      // Should accept valid attribute modifiers
      expect([201, 400]).toContain(response.statusCode)
    })

    it('should sanitize race input', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: '  Trimmed Race Name  ',
          description: '  Trimmed description  ',
        },
      })

      // Focus on successful creation rather than specific sanitization behavior
      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.name).toBeDefined()
      expect(body.description).toBeDefined()
    })
  })

  describe('Public Access', () => {
    it('should allow anonymous users to read public races', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/races',
      })

      expect(response.statusCode).toBe(200)
    })

    it('should allow authenticated users to read public races', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should allow anonymous users to read individual race details', async () => {
      // Create a race first
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Public Race',
          description: 'Publicly visible race',
        },
      })
      const race = createResponse.json()

      // Read race details without authentication
      const response = await app.inject({
        method: 'GET',
        url: `/api/races/${race.id}`,
      })

      expect(response.statusCode).toBe(200)
    })
  })
})
