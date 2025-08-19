import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '@/app.js'
import { Role } from '@prisma/client'
import { cleanupTestData, createTestUser } from '@/shared/tests/test-utils.js'

describe('Auth Routes Integration Tests', () => {
  beforeEach(async () => {
    await app.ready()
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        bio: 'Test bio',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      })

      expect(response.statusCode).toBe(201)

      const body = response.json()
      expect(body).toHaveProperty('accessToken')
      expect(body).toHaveProperty('tokenType', 'Bearer')
      expect(body).toHaveProperty('expiresIn')
      expect(body).toHaveProperty('user')
      expect(body.user).toMatchObject({
        email: userData.email,
        name: userData.name,
        role: Role.USER,
        isActive: true,
        isEmailVerified: false,
      })
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.message).toContain('email')
    })

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      // Check for schema validation error message
      expect(body.message).toContain('8 characters')
    })

    it('should reject registration with duplicate email', async () => {
      // First register a user
      const testUser = await createTestUser()

      // Try to register with the same email
      const userData = {
        email: testUser.user.email,
        password: 'Password123!',
        name: 'Test User 2',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      })

      expect(response.statusCode).toBe(409)
      const body = response.json()
      expect(body.message).toContain('User with this email already exists')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const { user, password } = await createTestUser()

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body).toHaveProperty('accessToken')
      expect(body).toHaveProperty('tokenType', 'Bearer')
      expect(body.user.email).toBe(user.email)
    })

    it('should reject login with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'Password123!',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = response.json()
      expect(body.message).toBe('Invalid email or password')
    })

    it('should reject login with invalid password', async () => {
      const { user } = await createTestUser()

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password: 'wrongpassword',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = response.json()
      expect(body.message).toBe('Invalid email or password')
    })

    it('should reject login for deactivated user', async () => {
      const { user, password } = await createTestUser({ isActive: false })

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      expect(response.statusCode).toBe(401)
      const body = response.json()
      expect(body.message).toBe('Account is deactivated')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const { user, password } = await createTestUser()

      // Login first
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Logout
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.message).toBe('Logged out successfully')
    })

    it('should reject logout without token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /api/auth/profile', () => {
    it('should get current user profile', async () => {
      const { user, password } = await createTestUser()

      // Login first
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Get profile
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.email).toBe(user.email)
      expect(body.id).toBe(user.id)
    })

    it('should reject profile request without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/profile',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const { user, password } = await createTestUser()

      // Login first
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Update profile
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
      }

      const response = await app.inject({
        method: 'PUT',
        url: '/api/auth/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.name).toBe(updateData.name)
      expect(body.bio).toBe(updateData.bio)
    })
  })

  describe('PUT /api/auth/password', () => {
    it('should change password successfully', async () => {
      const { user, password } = await createTestUser()

      // Login first
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Change password
      const newPassword = 'NewPassword123!'
      const response = await app.inject({
        method: 'PUT',
        url: '/api/auth/password',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          currentPassword: password,
          newPassword,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.message).toBe('Password changed successfully')

      // Verify new password works
      const loginResponse2 = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password: newPassword,
        },
      })

      expect(loginResponse2.statusCode).toBe(200)
    })

    it('should reject password change with wrong current password', async () => {
      const { user, password } = await createTestUser()

      // Login first
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Try to change password with wrong current password
      const response = await app.inject({
        method: 'PUT',
        url: '/api/auth/password',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123!',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = response.json()
      expect(body.message).toBe('Current password is incorrect')
    })
  })

  describe('DELETE /api/auth/account', () => {
    it('should deactivate account successfully', async () => {
      const { user, password } = await createTestUser()

      // Login first
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Deactivate account
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/auth/account',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.message).toBe('Account deactivated successfully')

      // Verify login is now blocked
      const loginResponse2 = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      expect(loginResponse2.statusCode).toBe(401)
    })
  })
})
