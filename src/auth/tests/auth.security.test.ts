import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '../../app'
import { cleanupTestData } from '../../shared/tests/test-utils'

describe('Authentication Security Tests', () => {
  beforeEach(async () => {
    await app.ready()
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('Input Sanitization', () => {
    describe('User Registration', () => {
      it('should sanitize email input (lowercase conversion)', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload: {
            email: 'TEST@EXAMPLE.COM',
            password: 'password123',
            name: 'Test User',
          },
        })

        expect(response.statusCode).toBe(201)
        const body = JSON.parse(response.body)
        expect(body.user.email).toBe('test@example.com')
      })

      it('should trim and sanitize name input', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload: {
            email: 'test2@example.com',
            password: 'password123',
            name: '  Test User  ',
          },
        })

        expect(response.statusCode).toBe(201)
        const body = JSON.parse(response.body)
        expect(body.user.name).toBe('Test User')
      })

      it('should handle SQL injection attempts in email', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: {
            email: "'; DROP TABLE users; --",
            password: 'password123',
          },
        })

        // Should return bad request due to invalid email format, not crash
        expect(response.statusCode).toBe(400)
        const body = JSON.parse(response.body)
        expect(body.message).toBeDefined()
      })
    })
  })

  describe('Password Security', () => {
    it('should enforce minimum password length', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test3@example.com',
          password: '1234567', // 7 characters
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toContain('8 characters')
    })

    it('should require letter and number in password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test4@example.com',
          password: 'abcdefgh', // Only letters
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toContain('letter and one number')
    })
  })

  describe('JWT Token Security', () => {
    it('should reject malformed JWT tokens', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/profile',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('Invalid token')
    })
  })

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      // Should not reveal whether email exists or not
      expect(body.message).toBe('Invalid email or password')
    })
  })
})
