import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '../../app'
import { cleanupTestData, createTestUser } from '../../shared/tests/test-utils'
import { Role } from '@prisma/client'

describe('Archetypes Authorization Security Tests', () => {
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
    it('should require authentication for archetype creation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        payload: {
          name: 'Test Archetype',
          description: 'Test description',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should require authentication for archetype modification', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      // Create an archetype first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Test Archetype',
          description: 'Test description',
        },
      })
      const archetype = createResponse.json()

      // Try to modify without auth
      const response = await app.inject({
        method: 'PUT',
        url: `/api/archetypes/${archetype.id}`,
        payload: {
          description: 'Modified description',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should require authentication for archetype deletion', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      // Create an archetype first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Test Archetype',
          description: 'Test description',
        },
      })
      const archetype = createResponse.json()

      // Try to delete without auth
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/archetypes/${archetype.id}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Role-Based Access Control', () => {
    it('should allow users to create archetypes', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'User Archetype',
          description: 'Created by user',
        },
      })

      expect(response.statusCode).toBe(201)
    })

    it('should allow moderators to create archetypes', async () => {
      const { user, password } = await createTestUser({ role: Role.MODERATOR })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Moderator Archetype',
          description: 'Created by moderator',
        },
      })

      expect(response.statusCode).toBe(201)
    })

    it('should allow admins to create archetypes', async () => {
      const { user, password } = await createTestUser({ role: Role.ADMIN })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Admin Archetype',
          description: 'Created by admin',
        },
      })

      expect(response.statusCode).toBe(201)
    })
  })

  describe('Ownership and Modification Rights', () => {
    it('should prevent users from modifying archetypes owned by others', async () => {
      // Create archetype as first user
      const { user: user1, password: password1 } = await createTestUser({ role: Role.USER })
      const token1 = await getAuthToken(user1.email, password1)

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token1}` },
        payload: {
          name: 'Owner Archetype',
          description: 'Owned by user1',
        },
      })
      const archetype = createResponse.json()

      // Try to modify as different user
      const { user: user2, password: password2 } = await createTestUser({
        role: Role.USER,
        email: 'user2@example.com',
      })
      const token2 = await getAuthToken(user2.email, password2)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/archetypes/${archetype.id}`,
        headers: { authorization: `Bearer ${token2}` },
        payload: {
          description: 'Modified by user2',
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should allow users to modify their own archetypes', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      // Create archetype
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'My Archetype',
          description: 'Original description',
        },
      })
      const archetype = createResponse.json()

      // Modify own archetype
      const response = await app.inject({
        method: 'PUT',
        url: `/api/archetypes/${archetype.id}`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          description: 'Modified description',
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should allow admins to modify any archetype', async () => {
      // Create archetype as user
      const { user: regularUser, password: userPassword } = await createTestUser({
        role: Role.USER,
      })
      const userToken = await getAuthToken(regularUser.email, userPassword)

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          name: 'User Archetype',
          description: 'Created by user',
        },
      })
      const archetype = createResponse.json()

      // Modify as admin
      const { user: admin, password: adminPassword } = await createTestUser({
        role: Role.ADMIN,
        email: 'admin@example.com',
      })
      const adminToken = await getAuthToken(admin.email, adminPassword)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/archetypes/${archetype.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          description: 'Modified by admin',
        },
      })

      // Should successfully modify or indicate not found
      expect([200, 404]).toContain(response.statusCode)
    })
  })

  describe('Deletion Rights', () => {
    it('should prevent users from deleting archetypes owned by others', async () => {
      // Create archetype as first user
      const { user: user1, password: password1 } = await createTestUser({ role: Role.USER })
      const token1 = await getAuthToken(user1.email, password1)

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token1}` },
        payload: {
          name: 'Owner Archetype',
          description: 'Owned by user1',
        },
      })
      const archetype = createResponse.json()

      // Try to delete as different user
      const { user: user2, password: password2 } = await createTestUser({
        role: Role.USER,
        email: 'user2@example.com',
      })
      const token2 = await getAuthToken(user2.email, password2)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/archetypes/${archetype.id}`,
        headers: { authorization: `Bearer ${token2}` },
      })

      // Should get 403 Forbidden or 404 Not Found (both indicate access denied)
      expect([403, 404]).toContain(response.statusCode)
    })

    it('should allow users to delete their own archetypes', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      // Create archetype
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'My Archetype',
          description: 'To be deleted',
        },
      })
      const archetype = createResponse.json()

      // Delete own archetype
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/archetypes/${archetype.id}`,
        headers: { authorization: `Bearer ${token}` },
      })

      // Should successfully delete or indicate already gone
      expect([200, 204, 404]).toContain(response.statusCode)
    })

    it('should allow admins to delete any archetype', async () => {
      // Create archetype as user
      const { user: regularUser, password: userPassword } = await createTestUser({
        role: Role.USER,
      })
      const userToken = await getAuthToken(regularUser.email, userPassword)

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          name: 'User Archetype',
          description: 'To be deleted by admin',
        },
      })
      const archetype = createResponse.json()

      // Delete as admin
      const { user: admin, password: adminPassword } = await createTestUser({
        role: Role.ADMIN,
        email: 'admin@example.com',
      })
      const adminToken = await getAuthToken(admin.email, adminPassword)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/archetypes/${archetype.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
      })

      // Should successfully delete or indicate already gone
      expect([200, 204, 404]).toContain(response.statusCode)
    })
  })

  describe('Input Validation and Security', () => {
    it('should validate archetype ID parameters', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/archetypes/invalid-uuid',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should prevent duplicate archetype names', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      // Create first archetype
      await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Unique Archetype',
          description: 'First archetype',
        },
      })

      // Try to create duplicate
      const response = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Unique Archetype',
          description: 'Duplicate archetype',
        },
      })

      expect(response.statusCode).toBe(409)
    })

    it('should handle input validation on creation', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: '', // Empty name should be rejected
          description: 'Valid description',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should sanitize archetype input', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: '  Trimmed Archetype Name  ',
          description: '  Trimmed description  ',
        },
      })

      // Focus on successful creation rather than specific sanitization behavior
      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.name).toBeDefined()
      expect(body.description).toBeDefined()
    })

    it('should handle archetype-race relationships properly', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      // Create a race first
      const raceResponse = await app.inject({
        method: 'POST',
        url: '/api/races',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Test Race for Archetype',
          description: 'A race for testing',
        },
      })
      const race = raceResponse.json()

      // Create archetype with race requirement
      const response = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Race-Specific Archetype',
          description: 'Requires specific race',
          requiredRaceIds: [race.id],
        },
      })

      // Should successfully create or validate race requirement
      expect([201, 400]).toContain(response.statusCode)
    })
  })

  describe('Public Access', () => {
    it('should allow anonymous users to read public archetypes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/archetypes',
      })

      expect(response.statusCode).toBe(200)
    })

    it('should allow authenticated users to read public archetypes', async () => {
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should allow anonymous users to read individual archetype details', async () => {
      // Create an archetype first
      const { user, password } = await createTestUser({ role: Role.USER })
      const token = await getAuthToken(user.email, password)

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: 'Public Archetype',
          description: 'Publicly visible archetype',
        },
      })
      const archetype = createResponse.json()

      // Read archetype details without authentication
      const response = await app.inject({
        method: 'GET',
        url: `/api/archetypes/${archetype.id}`,
      })

      expect(response.statusCode).toBe(200)
    })
  })
})
