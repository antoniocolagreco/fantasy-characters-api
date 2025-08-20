/**
 * User service tests
 * Unit tests for user business logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '@/shared/database/index'
import type { UserProfileType } from '@/auth/auth.schema'
import {
  createUser,
  getUserById,
  getUsersList,
  updateUser,
  deleteUser,
  getUserByEmail,
  userExists,
  getUserStats,
} from '@/users/user.service'
import type { CreateUserRequest, UpdateUserRequest } from '@/users/user.schema'

describe('User Service', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await db.user.deleteMany()
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.user.deleteMany()
  })

  // Helper function to create a mock user profile for RBAC testing
  const createMockUser = (overrides: Partial<UserProfileType> = {}): UserProfileType => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    bio: null,
    role: 'USER',
    isActive: true,
    isEmailVerified: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  })

  // Helper function to create a mock admin user
  const createMockAdmin = (): UserProfileType =>
    createMockUser({
      id: 'admin-user-id',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    })

  // Helper function to create a mock moderator user
  const createMockModerator = (): UserProfileType =>
    createMockUser({
      id: 'moderator-user-id',
      email: 'moderator@example.com',
      name: 'Moderator User',
      role: 'MODERATOR',
    })

  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        name: 'Test User',
        bio: 'Test bio',
      }

      const user = await createUser(userData)

      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')
      expect(user.bio).toBe('Test bio')
      expect(user.role).toBe('USER')
      expect(user.isActive).toBe(true)
      expect(user.isEmailVerified).toBe(false)
      expect(user.id).toBeDefined()
      expect(user.createdAt).toBeDefined()
      expect(user.updatedAt).toBeDefined()
    })

    it('should create a user with minimal data', async () => {
      const userData: CreateUserRequest = {
        email: 'minimal@example.com',
        passwordHash: 'hashedpassword123',
      }

      const user = await createUser(userData)

      expect(user.email).toBe('minimal@example.com')
      expect(user.name).toBeNull()
      expect(user.bio).toBeNull()
      expect(user.role).toBe('USER')
    })

    it('should normalize email to lowercase', async () => {
      const userData: CreateUserRequest = {
        email: 'TEST@EXAMPLE.COM',
        passwordHash: 'hashedpassword123',
      }

      const user = await createUser(userData)

      expect(user.email).toBe('test@example.com')
    })

    it('should throw validation error for invalid email', async () => {
      const userData: CreateUserRequest = {
        email: 'invalid-email',
        passwordHash: 'hashedpassword123',
      }

      await expect(createUser(userData)).rejects.toMatchObject({
        name: 'ValidationError',
        message: 'Invalid email format',
        statusCode: 400,
      })
    })

    it('should throw validation error for short password', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        passwordHash: 'short',
      }

      await expect(createUser(userData)).rejects.toMatchObject({
        name: 'ValidationError',
        statusCode: 400,
      })
    })

    it('should throw conflict error for duplicate email', async () => {
      const userData: CreateUserRequest = {
        email: 'duplicate@example.com',
        passwordHash: 'hashedpassword123',
      }

      await createUser(userData)

      await expect(createUser(userData)).rejects.toMatchObject({
        name: 'ConflictError',
        message: 'Email already exists',
        statusCode: 409,
      })
    })

    it('should throw validation error for too long name', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        name: 'a'.repeat(101), // Too long
      }

      await expect(createUser(userData)).rejects.toMatchObject({
        name: 'ValidationError',
        statusCode: 400,
      })
    })

    it('should throw validation error for too long bio', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        bio: 'a'.repeat(1001), // Too long
      }

      await expect(createUser(userData)).rejects.toMatchObject({
        name: 'ValidationError',
        statusCode: 400,
      })
    })
  })

  describe('getUserById', () => {
    it('should return user by valid ID (own profile)', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        name: 'Test User',
      }

      const createdUser = await createUser(userData)

      // User can access their own profile
      const currentUser = createMockUser({
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        bio: createdUser.bio,
        role: createdUser.role,
      })

      const foundUser = await getUserById(createdUser.id, currentUser)

      expect(foundUser).toEqual(createdUser)
    })

    it('should return user by valid ID (admin access)', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        name: 'Test User',
      }

      const createdUser = await createUser(userData)

      // Admin can access any profile
      const adminUser = createMockAdmin()

      const foundUser = await getUserById(createdUser.id, adminUser)

      expect(foundUser).toEqual(createdUser)
    })

    it('should throw not found error for non-existent ID', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

      const adminUser = createMockAdmin()

      await expect(getUserById(nonExistentId, adminUser)).rejects.toMatchObject({
        name: 'NotFoundError',
        statusCode: 404,
      })
    })

    it('should throw validation error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid'

      const adminUser = createMockAdmin()

      await expect(getUserById(invalidId, adminUser)).rejects.toMatchObject({
        name: 'ValidationError',
        message: 'Invalid user ID format',
        statusCode: 400,
      })
    })
  })

  describe('getUsersList', () => {
    beforeEach(async () => {
      // Create test users
      await createUser({
        email: 'user1@example.com',
        passwordHash: 'password123',
        name: 'User One',
        role: 'USER',
      })
      await createUser({
        email: 'admin@example.com',
        passwordHash: 'password123',
        name: 'Admin User',
        role: 'ADMIN',
      })
      await createUser({
        email: 'inactive@example.com',
        passwordHash: 'password123',
        name: 'Inactive User',
      })

      // Update last user to be inactive
      const inactiveUser = await db.user.findUnique({
        where: { email: 'inactive@example.com' },
      })
      if (inactiveUser) {
        await db.user.update({
          where: { id: inactiveUser.id },
          data: { isActive: false },
        })
      }
    })

    it('should return paginated users list', async () => {
      const moderatorUser = createMockModerator()
      const result = await getUsersList({ page: 1, pageSize: 2 }, moderatorUser)

      expect(result.data).toHaveLength(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(2)
      expect(result.pagination.total).toBe(3)
      expect(result.pagination.totalPages).toBe(2)
    })

    it('should filter users by role', async () => {
      const moderatorUser = createMockModerator()
      const result = await getUsersList({ role: 'ADMIN' }, moderatorUser)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].role).toBe('ADMIN')
    })

    it('should filter users by active status', async () => {
      const moderatorUser = createMockModerator()
      const result = await getUsersList({ isActive: false }, moderatorUser)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].isActive).toBe(false)
    })

    it('should search users by email and display name', async () => {
      const moderatorUser = createMockModerator()
      const result = await getUsersList({ search: 'admin' }, moderatorUser)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].email).toContain('admin')
    })

    it('should sort users by specified field', async () => {
      const moderatorUser = createMockModerator()
      const result = await getUsersList({ sortBy: 'email', sortOrder: 'asc' }, moderatorUser)

      expect(result.data).toHaveLength(3)
      // Should be sorted by email ascending
      expect(result.data[0].email <= result.data[1].email).toBe(true)
    })

    it('should use default pagination values', async () => {
      const moderatorUser = createMockModerator()
      const result = await getUsersList({}, moderatorUser)

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
      expect(result.pagination.total).toBe(3)
    })
  })

  describe('updateUser', () => {
    let userId: string

    beforeEach(async () => {
      const user = await createUser({
        email: 'test@example.com',
        passwordHash: 'password123',
        name: 'Original Name',
      })
      userId = user.id
    })

    it('should update user with valid data', async () => {
      const updateData: UpdateUserRequest = {
        name: 'Updated Name',
        bio: 'Updated bio',
      }

      // User updating their own profile
      const currentUser = createMockUser({ id: userId })
      const updatedUser = await updateUser(userId, updateData, currentUser)

      expect(updatedUser.name).toBe('Updated Name')
      expect(updatedUser.bio).toBe('Updated bio')
      expect(updatedUser.email).toBe('test@example.com') // Should remain unchanged
    })

    it('should update email and normalize to lowercase', async () => {
      const updateData: UpdateUserRequest = {
        email: 'NEWEMAIL@EXAMPLE.COM',
      }

      // User updating their own profile
      const currentUser = createMockUser({ id: userId })
      const updatedUser = await updateUser(userId, updateData, currentUser)

      expect(updatedUser.email).toBe('newemail@example.com')
    })

    it('should throw not found error for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'
      const updateData: UpdateUserRequest = {
        name: 'New Name',
      }

      const adminUser = createMockAdmin()
      await expect(updateUser(nonExistentId, updateData, adminUser)).rejects.toMatchObject({
        name: 'NotFoundError',
        statusCode: 404,
      })
    })

    it('should throw validation error for invalid UUID', async () => {
      const invalidId = 'invalid-uuid'
      const updateData: UpdateUserRequest = {
        name: 'New Name',
      }

      const adminUser = createMockAdmin()
      await expect(updateUser(invalidId, updateData, adminUser)).rejects.toMatchObject({
        name: 'ValidationError',
        message: 'Invalid user ID format',
        statusCode: 400,
      })
    })

    it('should throw conflict error for duplicate email', async () => {
      // Create another user
      await createUser({
        email: 'another@example.com',
        passwordHash: 'password123',
      })

      const updateData: UpdateUserRequest = {
        email: 'another@example.com',
      }

      const currentUser = createMockUser({ id: userId })
      await expect(updateUser(userId, updateData, currentUser)).rejects.toMatchObject({
        name: 'ConflictError',
        message: 'Email already exists',
        statusCode: 409,
      })
    })
  })

  describe('deleteUser', () => {
    let userId: string

    beforeEach(async () => {
      const user = await createUser({
        email: 'test@example.com',
        passwordHash: 'password123',
      })
      userId = user.id
    })

    it('should delete existing user', async () => {
      const adminUser = createMockAdmin()
      await expect(deleteUser(userId, adminUser)).resolves.toBeUndefined()

      // Verify user is deleted
      const deletedUser = await db.user.findUnique({
        where: { id: userId },
      })
      expect(deletedUser).toBeNull()
    })

    it('should throw not found error for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

      const adminUser = createMockAdmin()
      await expect(deleteUser(nonExistentId, adminUser)).rejects.toMatchObject({
        name: 'NotFoundError',
        statusCode: 404,
      })
    })

    it('should throw validation error for invalid UUID', async () => {
      const invalidId = 'invalid-uuid'

      const adminUser = createMockAdmin()
      await expect(deleteUser(invalidId, adminUser)).rejects.toMatchObject({
        name: 'ValidationError',
        message: 'Invalid user ID format',
        statusCode: 400,
      })
    })
  })

  describe('getUserByEmail', () => {
    beforeEach(async () => {
      await createUser({
        email: 'test@example.com',
        passwordHash: 'password123',
        name: 'Test User',
      })
    })

    it('should return user by email', async () => {
      const user = await getUserByEmail('test@example.com')

      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
      expect(user?.name).toBe('Test User')
    })

    it('should return null for non-existent email', async () => {
      const user = await getUserByEmail('nonexistent@example.com')

      expect(user).toBeNull()
    })

    it('should handle case insensitive email search', async () => {
      const user = await getUserByEmail('TEST@EXAMPLE.COM')

      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
    })
  })

  describe('userExists', () => {
    let userId: string

    beforeEach(async () => {
      const user = await createUser({
        email: 'test@example.com',
        passwordHash: 'password123',
      })
      userId = user.id
    })

    it('should return true for existing user', async () => {
      const exists = await userExists(userId)

      expect(exists).toBe(true)
    })

    it('should return false for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'
      const exists = await userExists(nonExistentId)

      expect(exists).toBe(false)
    })

    it('should return false for invalid UUID', async () => {
      const exists = await userExists('invalid-uuid')

      expect(exists).toBe(false)
    })
  })

  describe('getUserStats', () => {
    beforeEach(async () => {
      // Create test users with different roles and statuses
      const now = new Date()
      const yesterday = new Date(now.getTime() - 23 * 60 * 60 * 1000) // 23 hours ago to ensure it's within 24h
      const lastWeek = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) // 6 days ago to ensure it's within 7d
      const lastMonth = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000) // 29 days ago to ensure it's within 30d

      // Create users with different roles
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
            email: 'mod@example.com',
            passwordHash: 'hash4',
            role: 'MODERATOR',
            isActive: false,
            isEmailVerified: true,
            createdAt: lastMonth,
          },
          {
            email: 'inactive@example.com',
            passwordHash: 'hash5',
            role: 'USER',
            isActive: false,
            isEmailVerified: false,
            createdAt: lastMonth,
          },
        ],
      })
    })

    it('should return correct user statistics', async () => {
      const adminUser = createMockAdmin()
      const stats = await getUserStats(adminUser)

      expect(stats.totalUsers).toBe(5)
      expect(stats.activeUsers).toBe(3)
      expect(stats.verifiedUsers).toBe(3)
      expect(stats.usersByRole).toEqual({
        USER: 3,
        ADMIN: 1,
        MODERATOR: 1,
      })
      expect(stats.recentSignups.last24Hours).toBe(2) // today and yesterday
      expect(stats.recentSignups.last7Days).toBe(3) // + last week
      expect(stats.recentSignups.last30Days).toBe(5) // + last month
      expect(stats.lastUpdated).toBeDefined()
    })

    it('should handle empty database correctly', async () => {
      // Clean all users first
      await db.user.deleteMany()

      const adminUser = createMockAdmin()
      const stats = await getUserStats(adminUser)

      expect(stats.totalUsers).toBe(0)
      expect(stats.activeUsers).toBe(0)
      expect(stats.verifiedUsers).toBe(0)
      expect(stats.usersByRole).toEqual({
        USER: 0,
        ADMIN: 0,
        MODERATOR: 0,
      })
      expect(stats.recentSignups.last24Hours).toBe(0)
      expect(stats.recentSignups.last7Days).toBe(0)
      expect(stats.recentSignups.last30Days).toBe(0)
      expect(stats.lastUpdated).toBeDefined()
    })

    it('should have valid timestamp format', async () => {
      const adminUser = createMockAdmin()
      const stats = await getUserStats(adminUser)

      expect(stats.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    })
  })
})
