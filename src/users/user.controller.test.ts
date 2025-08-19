/**
 * User controller tests
 * Integration tests for user HTTP endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { app } from '../app.js'
import type { CreateUserRequest, UpdateUserRequest } from './user.schema.js'
import * as userService from './user.service.js'
import { cleanupTestData, createTestUser, createTestAdminUser } from '../shared/test-helpers.js'

describe('User Controller', () => {
  afterEach(async () => {
    // Clear mocks only, database cleanup is handled in beforeEach
    vi.clearAllMocks()
  })

  // Helper function to get JWT token for authentication
  const getAuthToken = async (email: string, password: string): Promise<string> => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password },
    })

    if (loginResponse.statusCode !== 200) {
      console.error('Login failed:', {
        statusCode: loginResponse.statusCode,
        body: loginResponse.body,
        email,
      })
      throw new Error(`Login failed with status ${loginResponse.statusCode}: ${loginResponse.body}`)
    }

    const loginBody = loginResponse.json()
    return loginBody.accessToken
  }

  // Helper function to create and authenticate a user
  const createAuthenticatedUser = async (role: 'USER' | 'MODERATOR' | 'ADMIN' = 'USER') => {
    const userData =
      role === 'ADMIN' ? await createTestAdminUser() : await createTestUser({ role: role as any })
    const token = await getAuthToken(userData.user.email, userData.password)
    return { userData, token }
  }

  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        passwordHash: 'securepassword123',
        name: 'Test User',
        bio: 'Test bio',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: userData,
      })

      expect(response.statusCode).toBe(201)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.email).toBe('test@example.com')
      expect(body.data.name).toBe('Test User')
      expect(body.data.bio).toBe('Test bio')
      expect(body.data.role).toBe('USER')
      expect(body.data.id).toBeDefined()
      expect(body.message).toBeDefined()
      expect(body.timestamp).toBeDefined()
    })

    it('should create user with minimal data', async () => {
      const userData: CreateUserRequest = {
        email: 'minimal@example.com',
        passwordHash: 'securepassword123',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: userData,
      })

      expect(response.statusCode).toBe(201)

      const body = response.json()
      expect(body.data.email).toBe('minimal@example.com')
      expect(body.data.name).toBeNull()
      expect(body.data.bio).toBeNull()
    })

    it('should create user with all valid optional fields', async () => {
      const userData: CreateUserRequest = {
        email: 'complete@example.com',
        passwordHash: 'securepassword123',
        name: 'Complete User',
        bio: 'This is a complete user profile with all fields',
        role: 'ADMIN',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: userData,
      })

      expect(response.statusCode).toBe(201)

      const body = response.json()
      expect(body.data.email).toBe('complete@example.com')
      expect(body.data.name).toBe('Complete User')
      expect(body.data.bio).toBe('This is a complete user profile with all fields')
      expect(body.data.role).toBe('ADMIN')
      expect(body.data.isEmailVerified).toBe(false) // Default value
      expect(body.data.isActive).toBe(true) // Default value
    })

    it('should return 400 for invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: {
          name: 'Test User',
          email: 'invalid-email',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 for empty payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 for missing passwordHash', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: {
          email: 'test@example.com',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 409 for duplicate email', async () => {
      const userData: CreateUserRequest = {
        email: 'duplicate@example.com',
        passwordHash: 'securepassword123',
      }

      // Create first user
      await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: userData,
      })

      // Try to create second user with same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: userData,
      })

      expect(response.statusCode).toBe(409)

      const body = response.json()
      expect(body.error.code).toBe('CONFLICT')
    })

    it('should return 400 for missing email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: {
          name: 'Test User',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle internal server error during user creation', async () => {
      // Mock the createUser service to throw a generic error (not with statusCode)
      const createUserSpy = vi.spyOn(userService, 'createUser').mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const userData: CreateUserRequest = {
        email: 'test-error@example.com',
        passwordHash: 'password123',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: userData,
      })

      expect(response.statusCode).toBe(500)
      const body = response.json()
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(body.error.message).toBe('Failed to create user')
      expect(body.error.timestamp).toBeDefined()
      expect(body.error.path).toBe('/api/users')

      // Restore the original function
      createUserSpy.mockRestore()
    })
  })

  describe('GET /api/users', () => {
    let moderatorToken: string
    let adminToken: string
    let adminUser: any

    beforeEach(async () => {
      // Clean up database before creating test users for this suite
      await cleanupTestData()

      // Create and authenticate moderator and admin users
      const moderatorAuth = await createAuthenticatedUser('MODERATOR')
      const adminAuth = await createAuthenticatedUser('ADMIN')

      moderatorToken = moderatorAuth.token
      adminToken = adminAuth.token
      adminUser = adminAuth.userData.user

      // Create regular users for testing
      await createTestUser({ name: 'User One' })
      await createTestUser({ name: 'User Two' })
    })

    it('should return paginated users list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?page=1&pageSize=2',
        headers: {
          authorization: `Bearer ${moderatorToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(2)
      expect(body.pagination.page).toBe(1)
      expect(body.pagination.pageSize).toBe(2)
      expect(body.pagination.total).toBe(4) // 4 users total
      expect(body.pagination.totalPages).toBe(2)
    })

    it('should filter users by role', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?role=ADMIN',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].role).toBe('ADMIN')
    })

    it('should search users by email and display name', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?search=admin',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].email).toBe(adminUser.email)
    })

    it('should sort users by specified field', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?sortBy=email&sortOrder=asc',
        headers: {
          authorization: `Bearer ${moderatorToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      // Get all emails and sort them to verify the order
      const emails = body.data.map((user: any) => user.email).sort()
      expect(body.data[0].email).toBe(emails[0])
      expect(body.data[1].email).toBe(emails[1])
      expect(body.data[2].email).toBe(emails[2])
      expect(body.data[3].email).toBe(emails[3])
    })

    it('should use default pagination when no query params provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.pagination.page).toBe(1)
      expect(body.pagination.pageSize).toBe(10)
    })

    it('should filter users by active status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?isActive=true',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data.every((user: any) => user.isActive === true)).toBe(true)
    })

    it('should filter users by email verification status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?isEmailVerified=false',
        headers: {
          authorization: `Bearer ${moderatorToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data.every((user: any) => user.isEmailVerified === false)).toBe(true)
    })

    it('should sort users in descending order', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?sortBy=email&sortOrder=desc',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      // Get all emails and sort them in descending order to verify
      const emails = body.data
        .map((user: any) => user.email)
        .sort()
        .reverse()
      expect(body.data[0].email).toBe(emails[0])
      expect(body.data[1].email).toBe(emails[1])
      expect(body.data[2].email).toBe(emails[2])
      expect(body.data[3].email).toBe(emails[3])
    })

    it('should handle invalid page number gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?page=0',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle invalid page size gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?pageSize=0',
        headers: {
          authorization: `Bearer ${moderatorToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle large page size gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?pageSize=200',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return empty results for search with no matches', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?search=nonexistentuser',
        headers: {
          authorization: `Bearer ${moderatorToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toHaveLength(0)
      expect(body.pagination.total).toBe(0)
    })

    it('should handle internal server error during users list retrieval', async () => {
      // Mock the getUsersList service to throw a generic error
      const getUsersListSpy = vi.spyOn(userService, 'getUsersList').mockImplementation(() => {
        throw new Error('Database query failed')
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(500)
      const body = response.json()
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(body.error.message).toBe('Failed to retrieve users list')
      expect(body.error.timestamp).toBeDefined()
      expect(body.error.path).toBe('/api/users')

      // Restore the original function
      getUsersListSpy.mockRestore()
    })
  })

  describe('GET /api/users/:id', () => {
    let testUserAuth: any
    let adminToken: string

    beforeEach(async () => {
      // Clean up database before creating test users for this suite
      await cleanupTestData()

      // Create authenticated test user and admin
      testUserAuth = await createAuthenticatedUser('USER')
      const adminAuth = await createAuthenticatedUser('ADMIN')
      adminToken = adminAuth.token
    })

    it('should return user by valid ID', async () => {
      // User accessing their own profile
      const userToken = testUserAuth.token

      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${testUserAuth.userData.user.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(testUserAuth.userData.user.id)
      expect(body.data.email).toBe(testUserAuth.userData.user.email)
      expect(body.data.name).toBe(testUserAuth.userData.user.name)
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${nonExistentId}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(404)

      const body = response.json()
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/invalid-uuid',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle internal server error during user retrieval by ID', async () => {
      // Mock the getUserById service to throw a generic error
      const getUserByIdSpy = vi.spyOn(userService, 'getUserById').mockImplementation(() => {
        throw new Error('Database connection lost')
      })

      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${validUuid}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(500)
      const body = response.json()
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(body.error.message).toBe('Failed to retrieve user')
      expect(body.error.timestamp).toBeDefined()
      expect(body.error.path).toBe(`/api/users/${validUuid}`)

      // Restore the original function
      getUserByIdSpy.mockRestore()
    })
  })

  describe('PUT /api/users/:id', () => {
    let testUser: any
    let testUserPassword: string
    let adminToken: string

    beforeEach(async () => {
      // Clean up database before creating test users for this suite
      await cleanupTestData()

      // Create test user and admin
      const { user, password } = await createTestUser({
        email: 'test@example.com',
        name: 'Original Name',
      })
      testUser = user
      testUserPassword = password

      const { user: adminUser, password: adminPassword } = await createTestAdminUser()
      adminToken = await getAuthToken(adminUser.email, adminPassword)
    })

    it('should update user successfully', async () => {
      // User updating their own profile
      const userToken = await getAuthToken(testUser.email, testUserPassword)

      const updateData: UpdateUserRequest = {
        name: 'Updated Name',
        bio: 'Updated bio',
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${testUser.id}`,
        payload: updateData,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('Updated Name')
      expect(body.data.bio).toBe('Updated bio')
      expect(body.data.email).toBe('test@example.com') // Should remain unchanged
    })

    it('should update user with email verification and active status', async () => {
      // Admin updating user privileges
      const updateData: UpdateUserRequest = {
        isEmailVerified: true,
        isActive: false,
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${testUser.id}`,
        payload: updateData,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.isEmailVerified).toBe(true)
      expect(body.data.isActive).toBe(false)
    })

    it('should update user role', async () => {
      // Admin updating user role
      const updateData: UpdateUserRequest = {
        role: 'MODERATOR',
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${testUser.id}`,
        payload: updateData,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.role).toBe('MODERATOR')
    })

    it('should handle empty update payload', async () => {
      const userToken = await getAuthToken(testUser.email, testUserPassword)

      const updateData: UpdateUserRequest = {}

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${testUser.id}`,
        payload: updateData,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      // Original data should remain unchanged
      expect(body.data.name).toBe('Original Name')
      expect(body.data.email).toBe('test@example.com')
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'
      const updateData: UpdateUserRequest = {
        name: 'New Name',
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${nonExistentId}`,
        payload: updateData,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(404)

      const body = response.json()
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const updateData: UpdateUserRequest = {
        name: 'New Name',
      }

      const response = await app.inject({
        method: 'PUT',
        url: '/api/users/invalid-uuid',
        payload: updateData,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 409 for duplicate email', async () => {
      // Create another user
      const { user: _anotherUser } = await createTestUser({
        email: 'another@example.com',
      })

      const updateData: UpdateUserRequest = {
        email: 'another@example.com',
      }

      const userToken = await getAuthToken(testUser.email, testUserPassword)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${testUser.id}`,
        payload: updateData,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(409)

      const body = response.json()
      expect(body.error.code).toBe('CONFLICT')
    })

    it('should handle internal server error during user update', async () => {
      // Mock the updateUser service to throw a generic error
      const updateUserSpy = vi.spyOn(userService, 'updateUser').mockImplementation(() => {
        throw new Error('Database transaction failed')
      })

      const updateData: UpdateUserRequest = {
        name: 'New Name',
      }

      const userToken = await getAuthToken(testUser.email, testUserPassword)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${testUser.id}`,
        payload: updateData,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(500)
      const body = response.json()
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(body.error.message).toBe('Failed to update user')
      expect(body.error.timestamp).toBeDefined()
      expect(body.error.path).toBe(`/api/users/${testUser.id}`)

      // Restore the original function
      updateUserSpy.mockRestore()
    })
  })

  describe('DELETE /api/users/:id', () => {
    let testUser: any
    let adminToken: string

    beforeEach(async () => {
      // Clean up database before creating test users for this suite
      await cleanupTestData()

      // Create test user and admin
      const { user } = await createTestUser({
        email: 'test@example.com',
      })
      testUser = user

      const { user: adminUser, password: adminPassword } = await createTestAdminUser()
      adminToken = await getAuthToken(adminUser.email, adminPassword)
    })

    it('should delete user successfully', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/users/${testUser.id}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(204)
      expect(response.body).toBe('')

      // Verify user is deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/users/${testUser.id}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(getResponse.statusCode).toBe(404)
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/users/${nonExistentId}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(404)

      const body = response.json()
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/users/invalid-uuid',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle internal server error during user deletion', async () => {
      // Mock the deleteUser service to throw a generic error
      const deleteUserSpy = vi.spyOn(userService, 'deleteUser').mockImplementation(() => {
        throw new Error('Database constraint violation')
      })

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/users/${testUser.id}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(500)
      const body = response.json()
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(body.error.message).toBe('Failed to delete user')
      expect(body.error.timestamp).toBeDefined()
      expect(body.error.path).toBe(`/api/users/${testUser.id}`)

      // Restore the original function
      deleteUserSpy.mockRestore()
    })
  })

  describe('GET /api/users/stats', () => {
    let adminToken: string

    beforeEach(async () => {
      // Clean up database before creating test users for this suite
      await cleanupTestData()

      // Create admin user first
      const { user: adminUser, password: adminPassword } = await createTestAdminUser()
      adminToken = await getAuthToken(adminUser.email, adminPassword)

      // Create test users with different roles and statuses

      await createTestUser({
        email: 'user1@example.com',
        role: 'USER',
        isActive: true,
      })

      await createTestUser({
        email: 'user2@example.com',
        role: 'USER',
        isActive: true,
      })

      await createTestUser({
        email: 'inactive@example.com',
        role: 'USER',
        isActive: false,
      })
    })

    it('should return user statistics successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/stats',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toBeDefined()
      expect(body.data.totalUsers).toBe(4) // 3 test users + 1 admin
      expect(body.data.activeUsers).toBe(3) // admin + 2 active test users (inactive user is not counted)
      expect(body.data.usersByRole).toEqual({
        USER: 3,
        ADMIN: 1,
        MODERATOR: 0,
      })
      expect(body.data.lastUpdated).toBeDefined()
      expect(body.timestamp).toBeDefined()
    })

    it('should handle empty database correctly', async () => {
      // Clean all users first
      await cleanupTestData()

      // Create fresh admin for this test
      const { user: adminUser, password: adminPassword } = await createTestAdminUser()
      const freshAdminToken = await getAuthToken(adminUser.email, adminPassword)

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/stats',
        headers: {
          authorization: `Bearer ${freshAdminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.totalUsers).toBe(1) // Only the admin user
      expect(body.data.activeUsers).toBe(1)
      expect(body.data.usersByRole).toEqual({
        USER: 0,
        ADMIN: 1,
        MODERATOR: 0,
      })
    })

    it('should handle internal server error during stats retrieval', async () => {
      // Mock the getUserStats service to throw a generic error
      const getUserStatsSpy = vi.spyOn(userService, 'getUserStats').mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/stats',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(500)
      const body = response.json()
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(body.error.message).toBe('Failed to retrieve user statistics')
      expect(body.error.timestamp).toBeDefined()
      expect(body.error.path).toBe('/api/users/stats')

      // Restore the original function
      getUserStatsSpy.mockRestore()
    })
  })
})
