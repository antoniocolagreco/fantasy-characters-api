import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '@/app.js'
import { cleanupTestData, createTestUser } from '@/shared/tests/test-utils.js'

describe('Refresh Token Tests', () => {
  beforeEach(async () => {
    await app.ready()
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should refresh access token successfully', async () => {
    // Create a test user and login
    const testUserResult = await createTestUser()

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: testUserResult.user.email,
        password: testUserResult.password,
      },
    })

    expect(loginResponse.statusCode).toBe(200)
    const loginData = JSON.parse(loginResponse.body)
    expect(loginData.refreshToken).toBeDefined()

    // Use the refresh token to get a new access token
    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refreshToken: loginData.refreshToken,
      },
    })

    // The refresh should work successfully now that the table exists
    expect(refreshResponse.statusCode).toBe(200)
    const refreshData = JSON.parse(refreshResponse.body)
    expect(refreshData.accessToken).toBeDefined()
    expect(refreshData.refreshToken).toBeDefined()
    expect(refreshData.user).toBeDefined()
    expect(refreshData.user.id).toBe(testUserResult.user.id)
  })

  it('should reject invalid refresh token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refreshToken: 'invalid.refresh.token',
      },
    })

    expect(response.statusCode).toBe(401)
    const data = JSON.parse(response.body)
    expect(data.message).toContain('Invalid')
  })

  it('should validate refresh token schema', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        // Missing refreshToken field
      },
    })

    expect(response.statusCode).toBe(400)
  })
})
