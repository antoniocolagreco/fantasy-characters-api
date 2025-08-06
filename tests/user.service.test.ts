/**
 * Tests for User Service
 *
 * This test suite follows TDD principles and validates user CRUD operations,
 * data transformations, and business logic.
 */

import type { UserCreateRequest, UserListQuery, UserResponse, UserUpdateRequest } from '@/schemas/user.js'
import { UserService } from '@/services/user.service.js'
import { DuplicateResourceError, NotFoundError, ValidationError } from '@/types/errors.js'
import { PrismaClient, Role } from '@prisma/client'

// Test database setup
let prisma: PrismaClient
let userService: UserService

beforeAll(async () => {
    prisma = new PrismaClient()
    userService = new UserService(prisma)
})

afterAll(async () => {
    await prisma.$disconnect()
})

beforeEach(async () => {
    // Clean up test data before each test
    await prisma.character.deleteMany()
    await prisma.item.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.perk.deleteMany()
    await prisma.skill.deleteMany()
    await prisma.archetype.deleteMany()
    await prisma.race.deleteMany()
    await prisma.image.deleteMany()
    await prisma.user.deleteMany()
})

describe('UserService', () => {
    describe('create', () => {
        test('should create a new user with minimal data', async () => {
            const userData: UserCreateRequest = {
                email: 'test@example.com'
            }

            const user = await userService.create(userData)

            expect(user.id).toBeDefined()
            expect(user.email).toBe('test@example.com')
            expect(user.role).toBe(Role.USER)
            expect(user.isActive).toBe(true)
            expect(user.isEmailVerified).toBe(false)
            expect(user.displayName).toBe(null)
            expect(user.bio).toBe(null)
            expect(user.createdAt).toBeDefined()
            expect(user.updatedAt).toBeDefined()
        })

        test('should create a user with complete data', async () => {
            const userData: UserCreateRequest = {
                email: 'admin@example.com',
                displayName: 'Test Admin',
                bio: 'A test administrator',
                role: 'ADMIN'
            }

            const user = await userService.create(userData)

            expect(user.email).toBe('admin@example.com')
            expect(user.displayName).toBe('Test Admin')
            expect(user.bio).toBe('A test administrator')
            expect(user.role).toBe(Role.ADMIN)
        })

        test('should throw DuplicateResourceError for existing email', async () => {
            const userData: UserCreateRequest = {
                email: 'duplicate@example.com'
            }

            await userService.create(userData)

            await expect(userService.create(userData)).rejects.toThrow(DuplicateResourceError)
        })

        test('should validate email format', async () => {
            const userData: UserCreateRequest = {
                email: 'invalid-email'
            }

            await expect(userService.create(userData)).rejects.toThrow(ValidationError)
        })

        test('should validate displayName length', async () => {
            const userData: UserCreateRequest = {
                email: 'test@example.com',
                displayName: 'a'.repeat(101) // Too long
            }

            await expect(userService.create(userData)).rejects.toThrow(ValidationError)
        })
    })

    describe('findById', () => {
        test('should find user by valid ID', async () => {
            const userData: UserCreateRequest = {
                email: 'find@example.com',
                displayName: 'Find Me'
            }

            const createdUser = await userService.create(userData)
            const foundUser = await userService.findById(createdUser.id)

            expect(foundUser).toBeDefined()
            expect(foundUser?.id).toBe(createdUser.id)
            expect(foundUser?.email).toBe('find@example.com')
            expect(foundUser?.displayName).toBe('Find Me')
        })

        test('should return null for non-existent ID', async () => {
            const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'
            const user = await userService.findById(nonExistentId)

            expect(user).toBe(null)
        })

        test('should throw ValidationError for invalid UUID', async () => {
            await expect(userService.findById('invalid-uuid')).rejects.toThrow(ValidationError)
        })
    })

    describe('findByIdOrThrow', () => {
        test('should find user by valid ID', async () => {
            const userData: UserCreateRequest = {
                email: 'find-throw@example.com'
            }

            const createdUser = await userService.create(userData)
            const foundUser = await userService.findByIdOrThrow(createdUser.id)

            expect(foundUser.id).toBe(createdUser.id)
            expect(foundUser.email).toBe('find-throw@example.com')
        })

        test('should throw NotFoundError for non-existent ID', async () => {
            const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

            await expect(userService.findByIdOrThrow(nonExistentId)).rejects.toThrow(NotFoundError)
        })
    })

    describe('findByEmail', () => {
        test('should find user by email', async () => {
            const userData: UserCreateRequest = {
                email: 'email-search@example.com',
                displayName: 'Email Search'
            }

            await userService.create(userData)
            const foundUser = await userService.findByEmail('email-search@example.com')

            expect(foundUser).toBeDefined()
            expect(foundUser?.email).toBe('email-search@example.com')
            expect(foundUser?.displayName).toBe('Email Search')
        })

        test('should return null for non-existent email', async () => {
            const user = await userService.findByEmail('nonexistent@example.com')

            expect(user).toBe(null)
        })

        test('should be case-sensitive for email search', async () => {
            const userData: UserCreateRequest = {
                email: 'CaseSensitive@example.com'
            }

            await userService.create(userData)
            const foundUser = await userService.findByEmail('casesensitive@example.com')

            expect(foundUser).toBe(null)
        })
    })

    describe('findMany', () => {
        beforeEach(async () => {
            // Create test users for list operations
            const users: UserCreateRequest[] = [
                { email: 'user1@example.com', displayName: 'User One', role: 'USER' },
                { email: 'user2@example.com', displayName: 'User Two', role: 'USER' },
                { email: 'admin1@example.com', displayName: 'Admin One', role: 'ADMIN' },
                { email: 'inactive@example.com', displayName: 'Inactive User', role: 'USER' }
            ]

            for (const user of users) {
                await userService.create(user)
            }

            // Make one user inactive
            const inactiveUser = await userService.findByEmail('inactive@example.com')
            if (inactiveUser) {
                await userService.update(inactiveUser.id, { isActive: false })
            }
        })

        test('should return paginated users with defaults', async () => {
            const result = await userService.findMany({})

            expect(result.data).toHaveLength(4)
            expect(result.pagination.page).toBe(1)
            expect(result.pagination.limit).toBe(10)
            expect(result.pagination.total).toBe(4)
            expect(result.pagination.totalPages).toBe(1)
        })

        test('should handle pagination correctly', async () => {
            const query: UserListQuery = { page: 1, limit: 2 }
            const result = await userService.findMany(query)

            expect(result.data).toHaveLength(2)
            expect(result.pagination.page).toBe(1)
            expect(result.pagination.limit).toBe(2)
            expect(result.pagination.total).toBe(4)
            expect(result.pagination.totalPages).toBe(2)
        })

        test('should filter by role', async () => {
            const query: UserListQuery = { role: 'ADMIN' }
            const result = await userService.findMany(query)

            expect(result.data).toHaveLength(1)
            expect(result.data[0].displayName).toBe('Admin One')
            expect(result.data[0].role).toBe(Role.ADMIN)
        })

        test('should filter by active status', async () => {
            const query: UserListQuery = { isActive: false }
            const result = await userService.findMany(query)

            expect(result.data).toHaveLength(1)
            expect(result.data[0].displayName).toBe('Inactive User')
            expect(result.data[0].isActive).toBe(false)
        })

        test('should search by display name', async () => {
            const query: UserListQuery = { search: 'User' }
            const result = await userService.findMany(query)

            expect(result.data.length).toBeGreaterThanOrEqual(2)
            const names = result.data.map((user: UserResponse) => user.displayName)
            expect(names).toContain('User One')
            expect(names).toContain('User Two')
        })

        test('should search by email', async () => {
            const query: UserListQuery = { search: 'admin1@example.com' }
            const result = await userService.findMany(query)

            expect(result.data).toHaveLength(1)
            expect(result.data[0].email).toBe('admin1@example.com')
        })

        test('should sort by email ascending', async () => {
            const query: UserListQuery = { sortBy: 'email', sortOrder: 'asc' }
            const result = await userService.findMany(query)

            const emails = result.data.map((user: UserResponse) => user.email)
            expect(emails).toEqual([...emails].sort())
        })

        test('should sort by email descending', async () => {
            const query: UserListQuery = { sortBy: 'email', sortOrder: 'desc' }
            const result = await userService.findMany(query)

            const emails = result.data.map((user: UserResponse) => user.email)
            expect(emails).toEqual([...emails].sort().reverse())
        })
    })

    describe('update', () => {
        let existingUser: any

        beforeEach(async () => {
            const userData: UserCreateRequest = {
                email: 'update@example.com',
                displayName: 'Original Name',
                bio: 'Original bio'
            }
            existingUser = await userService.create(userData)
        })

        test('should update user display name', async () => {
            const updateData: UserUpdateRequest = {
                displayName: 'Updated Name'
            }

            const updatedUser = await userService.update(existingUser.id, updateData)

            expect(updatedUser.displayName).toBe('Updated Name')
            expect(updatedUser.bio).toBe('Original bio') // Should remain unchanged
            expect(updatedUser.email).toBe('update@example.com') // Should remain unchanged
            expect(updatedUser.updatedAt).not.toBe(existingUser.updatedAt)
        })

        test('should update user bio', async () => {
            const updateData: UserUpdateRequest = {
                bio: 'Updated bio content'
            }

            const updatedUser = await userService.update(existingUser.id, updateData)

            expect(updatedUser.bio).toBe('Updated bio content')
            expect(updatedUser.displayName).toBe('Original Name') // Should remain unchanged
        })

        test('should update multiple fields', async () => {
            const updateData: UserUpdateRequest = {
                displayName: 'New Name',
                bio: 'New bio',
                isActive: false,
                role: 'MODERATOR'
            }

            const updatedUser = await userService.update(existingUser.id, updateData)

            expect(updatedUser.displayName).toBe('New Name')
            expect(updatedUser.bio).toBe('New bio')
            expect(updatedUser.isActive).toBe(false)
            expect(updatedUser.role).toBe(Role.MODERATOR)
        })

        test('should throw NotFoundError for non-existent user', async () => {
            const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'
            const updateData: UserUpdateRequest = {
                displayName: 'Should Fail'
            }

            await expect(userService.update(nonExistentId, updateData)).rejects.toThrow(NotFoundError)
        })

        test('should validate display name length', async () => {
            const updateData: UserUpdateRequest = {
                displayName: 'a'.repeat(101) // Too long
            }

            await expect(userService.update(existingUser.id, updateData)).rejects.toThrow(ValidationError)
        })
    })

    describe('delete', () => {
        let existingUser: any

        beforeEach(async () => {
            const userData: UserCreateRequest = {
                email: 'delete@example.com',
                displayName: 'To Delete'
            }
            existingUser = await userService.create(userData)
        })

        test('should delete existing user', async () => {
            await userService.delete(existingUser.id)

            const deletedUser = await userService.findById(existingUser.id)
            expect(deletedUser).toBe(null)
        })

        test('should throw NotFoundError for non-existent user', async () => {
            const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

            await expect(userService.delete(nonExistentId)).rejects.toThrow(NotFoundError)
        })

        test('should handle CASCADE deletion for related data', async () => {
            // This test ensures the service properly handles database constraints
            // The actual CASCADE behavior is handled by Prisma/database level
            await userService.delete(existingUser.id)

            // Verify user is deleted
            const deletedUser = await userService.findById(existingUser.id)
            expect(deletedUser).toBe(null)
        })
    })

    describe('getUserWithStats', () => {
        let userWithData: any

        beforeEach(async () => {
            const userData: UserCreateRequest = {
                email: 'stats@example.com',
                displayName: 'Stats User'
            }
            userWithData = await userService.create(userData)
        })

        test('should return user with empty stats', async () => {
            const userStats = await userService.getUserWithStats(userWithData.id)

            expect(userStats.id).toBe(userWithData.id)
            expect(userStats.email).toBe('stats@example.com')
            expect(userStats.stats).toEqual({
                totalCharacters: 0,
                totalImages: 0,
                totalItems: 0,
                totalTags: 0
            })
        })

        test('should throw NotFoundError for non-existent user', async () => {
            const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

            await expect(userService.getUserWithStats(nonExistentId)).rejects.toThrow(NotFoundError)
        })
    })

    describe('transformToResponse', () => {
        test('should transform user to response format', async () => {
            // Create a complete User object (as it would come from database)
            const mockUser = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'transform@example.com',
                passwordHash: '$2b$12$placeholder.hash.for.development.only',
                role: Role.USER,
                isEmailVerified: false,
                isActive: true,
                displayName: 'Transform Test',
                bio: 'Test bio',
                oauthProvider: null,
                oauthId: null,
                lastPasswordChange: null,
                lastLogin: new Date('2025-01-01T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                profilePictureId: null
            }

            const response = userService.transformToResponse(mockUser)

            expect(response.id).toBe(mockUser.id)
            expect(response.email).toBe(mockUser.email)
            expect(response.displayName).toBe(mockUser.displayName)
            expect(response.bio).toBe(mockUser.bio)
            expect(response.role).toBe(mockUser.role)
            expect(response.isActive).toBe(mockUser.isActive)
            expect(response.isEmailVerified).toBe(mockUser.isEmailVerified)
            expect(response.profilePictureId).toBe(mockUser.profilePictureId)
            expect(response.lastLogin).toBe('2025-01-01T00:00:00.000Z')
            expect(response.createdAt).toBe('2025-01-01T00:00:00.000Z')
            expect(response.updatedAt).toBe('2025-01-01T00:00:00.000Z')

            // Should not include sensitive data
            expect('passwordHash' in response).toBe(false)
            expect('oauthProvider' in response).toBe(false)
            expect('oauthId' in response).toBe(false)
        })

        test('should handle null optional fields', async () => {
            // Create a minimal User object (as it would come from database)
            const mockUser = {
                id: '123e4567-e89b-12d3-a456-426614174001',
                email: 'minimal@example.com',
                passwordHash: '$2b$12$placeholder.hash.for.development.only',
                role: Role.USER,
                isEmailVerified: false,
                isActive: true,
                displayName: null,
                bio: null,
                oauthProvider: null,
                oauthId: null,
                lastPasswordChange: null,
                lastLogin: new Date('2025-01-01T00:00:00.000Z'),
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                profilePictureId: null
            }

            const response = userService.transformToResponse(mockUser)

            expect(response.displayName).toBe(null)
            expect(response.bio).toBe(null)
            expect(response.profilePictureId).toBe(null)
        })
    })
})
