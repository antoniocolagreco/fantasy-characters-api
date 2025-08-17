/**
 * User controller tests
 * Integration tests for user HTTP endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { app } from '../app.js'
import { db } from '../shared/database/index.js'
import type { CreateUserRequest, UpdateUserRequest } from './user.schema.js'
import * as userService from './user.service.js'

describe('User Controller', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await db.user.deleteMany()
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.user.deleteMany()
  })

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
    beforeEach(async () => {
      // Create test users
      const users = [
        {
          email: 'user1@example.com',
          passwordHash: 'password123',
          name: 'User One',
          role: 'USER' as const,
        },
        {
          email: 'admin@example.com',
          passwordHash: 'password123',
          name: 'Admin User',
          role: 'ADMIN' as const,
        },
        {
          email: 'user2@example.com',
          passwordHash: 'password123',
          name: 'User Two',
          role: 'USER' as const,
        },
      ]

      for (const userData of users) {
        await app.inject({
          method: 'POST',
          url: '/api/users',
          payload: userData,
        })
      }
    })

    it('should return paginated users list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?page=1&pageSize=2',
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(2)
      expect(body.pagination.page).toBe(1)
      expect(body.pagination.pageSize).toBe(2)
      expect(body.pagination.total).toBe(3)
      expect(body.pagination.totalPages).toBe(2)
    })

    it('should filter users by role', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?role=ADMIN',
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
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].email).toBe('admin@example.com')
    })

    it('should sort users by specified field', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?sortBy=email&sortOrder=asc',
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data[0].email).toBe('admin@example.com')
      expect(body.data[1].email).toBe('user1@example.com')
      expect(body.data[2].email).toBe('user2@example.com')
    })

    it('should use default pagination when no query params provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
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
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data.every((user: any) => user.isActive === true)).toBe(true)
    })

    it('should filter users by email verification status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?isEmailVerified=false',
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data.every((user: any) => user.isEmailVerified === false)).toBe(true)
    })

    it('should sort users in descending order', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?sortBy=email&sortOrder=desc',
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data[0].email).toBe('user2@example.com')
      expect(body.data[1].email).toBe('user1@example.com')
      expect(body.data[2].email).toBe('admin@example.com')
    })

    it('should handle invalid page number gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?page=0',
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle invalid page size gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?pageSize=0',
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle large page size gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?pageSize=200',
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return empty results for search with no matches', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?search=nonexistentuser',
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
    let userId: string

    beforeEach(async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        passwordHash: 'password123',
        name: 'Test User',
      }

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: userData,
      })

      userId = createResponse.json().data.id
    })

    it('should return user by valid ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${userId}`,
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(userId)
      expect(body.data.email).toBe('test@example.com')
      expect(body.data.name).toBe('Test User')
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

      const response = await app.inject({
        method: 'GET',
        url: `/api/users/${nonExistentId}`,
      })

      expect(response.statusCode).toBe(404)

      const body = response.json()
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/invalid-uuid',
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
    let userId: string

    beforeEach(async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        passwordHash: 'password123',
        name: 'Original Name',
      }

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: userData,
      })

      userId = createResponse.json().data.id
    })

    it('should update user successfully', async () => {
      const updateData: UpdateUserRequest = {
        name: 'Updated Name',
        bio: 'Updated bio',
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${userId}`,
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('Updated Name')
      expect(body.data.bio).toBe('Updated bio')
      expect(body.data.email).toBe('test@example.com') // Should remain unchanged
    })

    it('should update user with email verification and active status', async () => {
      const updateData: UpdateUserRequest = {
        isEmailVerified: true,
        isActive: false,
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${userId}`,
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.isEmailVerified).toBe(true)
      expect(body.data.isActive).toBe(false)
    })

    it('should update user role', async () => {
      const updateData: UpdateUserRequest = {
        role: 'MODERATOR',
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${userId}`,
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.role).toBe('MODERATOR')
    })

    it('should handle empty update payload', async () => {
      const updateData: UpdateUserRequest = {}

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${userId}`,
        payload: updateData,
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
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 409 for duplicate email', async () => {
      // Create another user
      await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: {
          email: 'another@example.com',
          passwordHash: 'password123',
        },
      })

      const updateData: UpdateUserRequest = {
        email: 'another@example.com',
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${userId}`,
        payload: updateData,
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

      const response = await app.inject({
        method: 'PUT',
        url: `/api/users/${userId}`,
        payload: updateData,
      })

      expect(response.statusCode).toBe(500)
      const body = response.json()
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(body.error.message).toBe('Failed to update user')
      expect(body.error.timestamp).toBeDefined()
      expect(body.error.path).toBe(`/api/users/${userId}`)

      // Restore the original function
      updateUserSpy.mockRestore()
    })
  })

  describe('DELETE /api/users/:id', () => {
    let userId: string

    beforeEach(async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        passwordHash: 'password123',
      }

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: userData,
      })

      userId = createResponse.json().data.id
    })

    it('should delete user successfully', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/users/${userId}`,
      })

      expect(response.statusCode).toBe(204)
      expect(response.body).toBe('')

      // Verify user is deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/users/${userId}`,
      })

      expect(getResponse.statusCode).toBe(404)
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/users/${nonExistentId}`,
      })

      expect(response.statusCode).toBe(404)

      const body = response.json()
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/users/invalid-uuid',
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
        url: `/api/users/${userId}`,
      })

      expect(response.statusCode).toBe(500)
      const body = response.json()
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(body.error.message).toBe('Failed to delete user')
      expect(body.error.timestamp).toBeDefined()
      expect(body.error.path).toBe(`/api/users/${userId}`)

      // Restore the original function
      deleteUserSpy.mockRestore()
    })
  })

  describe('GET /api/users/stats', () => {
    beforeEach(async () => {
      // Create test users with different roles and statuses
      const now = new Date()
      const yesterday = new Date(now.getTime() - 23 * 60 * 60 * 1000) // 23 hours ago to ensure it's within 24h
      const lastWeek = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) // 6 days ago to ensure it's within 7d

      await db.user.createMany({
        data: [
          {
            email: 'user1@example.com',
            passwordHash: 'hash1',
            role: 'USER',
            isActive: true,
            isEmailVerified: true,
            createdAt: now,
          },
          {
            email: 'user2@example.com',
            passwordHash: 'hash2',
            role: 'USER',
            isActive: true,
            isEmailVerified: false,
            createdAt: yesterday,
          },
          {
            email: 'admin@example.com',
            passwordHash: 'hash3',
            role: 'ADMIN',
            isActive: true,
            isEmailVerified: true,
            createdAt: lastWeek,
          },
          {
            email: 'inactive@example.com',
            passwordHash: 'hash4',
            role: 'USER',
            isActive: false,
            isEmailVerified: false,
            createdAt: lastWeek,
          },
        ],
      })
    })

    it('should return user statistics successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/stats',
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toBeDefined()
      expect(body.data.totalUsers).toBe(4)
      expect(body.data.activeUsers).toBe(3)
      expect(body.data.verifiedUsers).toBe(2)
      expect(body.data.usersByRole).toEqual({
        USER: 3,
        ADMIN: 1,
        MODERATOR: 0,
      })
      expect(body.data.recentSignups.last24Hours).toBe(2)
      expect(body.data.recentSignups.last7Days).toBe(4)
      expect(body.data.recentSignups.last30Days).toBe(4)
      expect(body.data.lastUpdated).toBeDefined()
      expect(body.timestamp).toBeDefined()
    })

    it('should handle empty database correctly', async () => {
      // Clean all users first
      await db.user.deleteMany()

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/stats',
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.totalUsers).toBe(0)
      expect(body.data.activeUsers).toBe(0)
      expect(body.data.verifiedUsers).toBe(0)
      expect(body.data.usersByRole).toEqual({
        USER: 0,
        ADMIN: 0,
        MODERATOR: 0,
      })
      expect(body.data.recentSignups.last24Hours).toBe(0)
      expect(body.data.recentSignups.last7Days).toBe(0)
      expect(body.data.recentSignups.last30Days).toBe(0)
    })

    it('should handle internal server error during stats retrieval', async () => {
      // Mock the getUserStats service to throw a generic error
      const getUserStatsSpy = vi.spyOn(userService, 'getUserStats').mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/users/stats',
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
