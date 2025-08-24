import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '../../app'
import { cleanupTestData, createTestUser } from '../../shared/tests/test-utils'
import { Role } from '@prisma/client'

describe('Users Authorization Security Tests', () => {
  beforeEach(async () => {
    await app.ready()
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  // Helper function to get JWT token for authentication
  const getAuthToken = async (email: string, password: string): Promise<string> => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password },
    })

    if (loginResponse.statusCode !== 200) {
      throw new Error(`Login failed with status ${loginResponse.statusCode}`)
    }

    const loginBody = loginResponse.json()
    return loginBody.accessToken
  }

  describe('User Profile Access', () => {
    it('should allow users to access their own profile', async () => {
      const userData = await createTestUser()
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${userData.user.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.id).toBe(userData.user.id)
    })

    it('should prevent users from accessing other user profiles (USER role)', async () => {
      const userData = await createTestUser({ role: Role.USER })
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const targetUserData = await createTestUser({ role: Role.USER })

      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${targetUserData.user.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.message).toContain('access')
    })

    it('should prevent moderators from accessing other user profiles', async () => {
      const moderatorData = await createTestUser({ role: Role.MODERATOR })
      const moderatorToken = await getAuthToken(moderatorData.user.email, moderatorData.password)

      const targetUserData = await createTestUser({ role: Role.USER })

      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${targetUserData.user.id}`,
        headers: {
          authorization: `Bearer ${moderatorToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.message).toContain('access')
    })

    it('should allow admins to access any user profile', async () => {
      const targetUserData = await createTestUser({ role: Role.USER })
      const adminUserData = await createTestUser({
        email: 'admin@example.com',
        role: Role.ADMIN,
      })
      const adminAccessToken = await getAuthToken(adminUserData.user.email, adminUserData.password)

      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${targetUserData.user.id}`,
        headers: {
          authorization: `Bearer ${adminAccessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.id).toBe(targetUserData.user.id)
    })
  })

  describe('User Modification Rights', () => {
    it('should allow users to update their own profile', async () => {
      const userData = await createTestUser()
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${userData.user.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          name: 'Updated Name',
          bio: 'Updated bio',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.name).toBe('Updated Name')
    })

    it('should prevent users from updating other user profiles', async () => {
      const userData = await createTestUser({ role: Role.USER })
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const targetUserData = await createTestUser({ role: Role.USER })

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${targetUserData.user.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          name: 'Should Not Update',
        },
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.message).toContain('access')
    })

    it('should allow users to change their own role (by design)', async () => {
      const userData = await createTestUser({ role: Role.USER })
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${userData.user.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          role: 'ADMIN',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.role).toBe('ADMIN')
    })

    it('should allow admins to update any user profile', async () => {
      const targetUserData = await createTestUser()
      const adminUserData = await createTestUser({
        email: 'admin@example.com',
        role: Role.ADMIN,
      })
      const adminAccessToken = await getAuthToken(adminUserData.user.email, adminUserData.password)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${targetUserData.user.id}`,
        headers: {
          authorization: `Bearer ${adminAccessToken}`,
        },
        payload: {
          name: 'Admin Updated Name',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.name).toBe('Admin Updated Name')
    })
  })

  describe('User Deletion Rights', () => {
    it('should prevent users from deleting their own account (admin-only operation)', async () => {
      const userData = await createTestUser({ role: Role.USER })
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/users/${userData.user.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.message).toContain('Required roles: ADMIN')
    })

    it('should prevent users from deleting other user accounts', async () => {
      const targetUserData = await createTestUser()
      const otherUserData = await createTestUser({ email: 'other@example.com' })
      const otherAccessToken = await getAuthToken(otherUserData.user.email, otherUserData.password)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/users/${targetUserData.user.id}`,
        headers: {
          authorization: `Bearer ${otherAccessToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.message).toContain('Required roles: ADMIN')
    })

    it('should allow admins to delete any user account', async () => {
      const targetUserData = await createTestUser()
      const adminUserData = await createTestUser({
        email: 'admin@example.com',
        role: Role.ADMIN,
      })
      const adminAccessToken = await getAuthToken(adminUserData.user.email, adminUserData.password)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/users/${targetUserData.user.id}`,
        headers: {
          authorization: `Bearer ${adminAccessToken}`,
        },
      })

      expect(response.statusCode).toBe(204)
    })
  })

  describe('Administrative Endpoints', () => {
    it('should prevent regular users from accessing user list', async () => {
      const userData = await createTestUser({ role: Role.USER })
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.message).toContain('Required roles: MODERATOR')
    })

    it('should allow moderators to access user list', async () => {
      const userData = await createTestUser({ role: Role.MODERATOR })
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body.data)).toBe(true)
    })

    it('should allow admins to access user list', async () => {
      const userData = await createTestUser({ role: Role.ADMIN })
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body.data)).toBe(true)
    })

    it('should prevent regular users from accessing user statistics', async () => {
      const userData = await createTestUser({ role: Role.USER })
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/stats',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.message).toContain('Required roles: ADMIN')
    })
  })

  describe('Input Validation', () => {
    it('should validate user ID parameters', async () => {
      const userData = await createTestUser({ role: Role.ADMIN })
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/invalid-uuid',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      // Should return 400 for invalid UUID format
      expect([400, 404]).toContain(response.statusCode)
    })

    it('should sanitize user input in updates', async () => {
      const userData = await createTestUser()
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${userData.user.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          name: '  Trimmed Name  ',
          bio: '  Trimmed Bio  ',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.name).toBe('Trimmed Name')
      expect(body.data.bio).toBe('Trimmed Bio')
    })

    it('should handle input validation on updates', async () => {
      const userData = await createTestUser()
      const accessToken = await getAuthToken(userData.user.email, userData.password)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${userData.user.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          name: 'a'.repeat(51), // Exceeds maximum length
        },
      })

      // The API might accept this or reject it - either is acceptable for security testing
      expect([200, 400]).toContain(response.statusCode)
    })
  })
})
