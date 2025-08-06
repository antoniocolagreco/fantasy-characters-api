/**
 * Tests for User Controller
 *
 * This test suite validates the HTTP request/response handling for user endpoints.
 */

import { createApp } from '../src/app.js'
import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

let app: FastifyInstance
let prisma: PrismaClient

beforeAll(async () => {
    app = await createApp()
    prisma = new PrismaClient()
    await app.ready()
})

afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
})

beforeEach(async () => {
    // Clean up test data
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

describe('User Controller', () => {
    describe('POST /api/users', () => {
        test('should create a new user with minimal data', async () => {
            const userData = {
                email: 'test@example.com'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/users',
                payload: userData
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.body)
            expect(body.success).toBe(true)
            expect(body.data.email).toBe('test@example.com')
            expect(body.data.role).toBe('USER')
            expect(body.data.isActive).toBe(true)
            expect(body.data.isEmailVerified).toBe(false)
            expect(body.data.id).toBeDefined()
        })

        test('should create a user with complete data', async () => {
            const userData = {
                email: 'admin@example.com',
                displayName: 'Test Admin',
                bio: 'A test administrator',
                role: 'ADMIN'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/users',
                payload: userData
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.body)
            expect(body.success).toBe(true)
            expect(body.data.email).toBe('admin@example.com')
            expect(body.data.displayName).toBe('Test Admin')
            expect(body.data.bio).toBe('A test administrator')
            expect(body.data.role).toBe('ADMIN')
        })

        test('should return 400 for invalid email', async () => {
            const userData = {
                email: 'invalid-email'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/users',
                payload: userData
            })

            expect(response.statusCode).toBe(400)
            const body = JSON.parse(response.body)
            expect(body.code).toBe('FST_ERR_VALIDATION')
            expect(body.message).toContain('email must match format')
        })

        test('should return 409 for duplicate email', async () => {
            const userData = {
                email: 'duplicate@example.com'
            }

            // Create first user
            await app.inject({
                method: 'POST',
                url: '/api/users',
                payload: userData
            })

            // Try to create duplicate
            const response = await app.inject({
                method: 'POST',
                url: '/api/users',
                payload: userData
            })

            expect(response.statusCode).toBe(409)
            const body = JSON.parse(response.body)
            expect(body.code).toBe('DUPLICATE_RESOURCE')
            expect(body.message).toContain('already exists')
        })

        test('should return 400 for missing email', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/users',
                payload: {}
            })

            expect(response.statusCode).toBe(400)
            const body = JSON.parse(response.body)
            expect(body.code).toBe('FST_ERR_VALIDATION')
            expect(body.message).toContain('must have required property')
        })
    })

    describe('GET /api/users/:id', () => {
        let testUser: any

        beforeEach(async () => {
            const userData = {
                email: 'gettest@example.com',
                displayName: 'Get Test User'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/users',
                payload: userData
            })

            testUser = JSON.parse(response.body).data
        })

        test('should get user by valid ID', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/users/${testUser.id}`
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.success).toBe(true)
            expect(body.data.id).toBe(testUser.id)
            expect(body.data.email).toBe('gettest@example.com')
            expect(body.data.displayName).toBe('Get Test User')
        })

        test('should return 404 for non-existent ID', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/users/123e4567-e89b-12d3-a456-426614174000'
            })

            expect(response.statusCode).toBe(404)
            const body = JSON.parse(response.body)
            expect(body.statusCode).toBe(404)
            expect(body.code).toBe('NOT_FOUND')
            expect(body.message).toContain('User with id')
        })

        test('should return 400 for invalid UUID', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/users/invalid-uuid'
            })

            expect(response.statusCode).toBe(400)
            const body = JSON.parse(response.body)
            expect(body.statusCode).toBe(400)
            expect(body.code).toBe('FST_ERR_VALIDATION')
            expect(body.message).toContain('must match pattern')
        })
    })

    describe('GET /api/users', () => {
        beforeEach(async () => {
            // Create test users
            const users = [
                { email: 'user1@example.com', displayName: 'User One', role: 'USER' },
                { email: 'user2@example.com', displayName: 'User Two', role: 'USER' },
                { email: 'admin1@example.com', displayName: 'Admin One', role: 'ADMIN' },
                { email: 'inactive@example.com', displayName: 'Inactive User', role: 'USER' }
            ]

            for (const user of users) {
                await app.inject({
                    method: 'POST',
                    url: '/api/users',
                    payload: user
                })
            }
        })

        test('should list users with default pagination', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/users'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.success).toBe(true)
            expect(Array.isArray(body.data)).toBe(true)
            expect(body.data.length).toBe(4)
            expect(body.meta.pagination.page).toBe(1)
            expect(body.meta.pagination.limit).toBe(10)
            expect(body.meta.pagination.total).toBe(4)
        })

        test('should handle pagination parameters', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/users?page=1&limit=2'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.data.length).toBe(2)
            expect(body.meta.pagination.page).toBe(1)
            expect(body.meta.pagination.limit).toBe(2)
            expect(body.meta.pagination.totalPages).toBe(2)
        })

        test('should filter by role', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/users?role=ADMIN'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.data.length).toBe(1)
            expect(body.data[0].displayName).toBe('Admin One')
            expect(body.data[0].role).toBe('ADMIN')
        })

        test('should search by display name', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/users?search=User'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.data.length).toBeGreaterThanOrEqual(2)
        })

        test('should sort users', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/users?sortBy=email&sortOrder=asc'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            const emails = body.data.map((user: any) => user.email)
            expect(emails).toEqual([...emails].sort())
        })
    })

    describe('PUT /api/users/:id', () => {
        let testUser: any

        beforeEach(async () => {
            const userData = {
                email: 'update@example.com',
                displayName: 'Original Name',
                bio: 'Original bio'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/users',
                payload: userData
            })

            testUser = JSON.parse(response.body).data
        })

        test('should update user display name', async () => {
            const updateData = {
                displayName: 'Updated Name'
            }

            const response = await app.inject({
                method: 'PUT',
                url: `/api/users/${testUser.id}`,
                payload: updateData
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.success).toBe(true)
            expect(body.data.displayName).toBe('Updated Name')
            expect(body.data.bio).toBe('Original bio') // Should remain unchanged
        })

        test('should update multiple fields', async () => {
            const updateData = {
                displayName: 'New Name',
                bio: 'New bio',
                isActive: false
            }

            const response = await app.inject({
                method: 'PUT',
                url: `/api/users/${testUser.id}`,
                payload: updateData
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.data.displayName).toBe('New Name')
            expect(body.data.bio).toBe('New bio')
            expect(body.data.isActive).toBe(false)
        })

        test('should return 404 for non-existent user', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/users/123e4567-e89b-12d3-a456-426614174000',
                payload: { displayName: 'Should Fail' }
            })

            expect(response.statusCode).toBe(404)
            const body = JSON.parse(response.body)
            expect(body.statusCode).toBe(404)
            expect(body.code).toBe('NOT_FOUND')
            expect(body.message).toContain('User with id')
        })

        test('should validate display name length', async () => {
            const updateData = {
                displayName: 'a'.repeat(101) // Too long
            }

            const response = await app.inject({
                method: 'PUT',
                url: `/api/users/${testUser.id}`,
                payload: updateData
            })

            expect(response.statusCode).toBe(400)
            const body = JSON.parse(response.body)
            expect(body.statusCode).toBe(400)
            expect(body.code).toBe('FST_ERR_VALIDATION')
            expect(body.message).toContain('must NOT have more than')
        })
    })

    describe('DELETE /api/users/:id', () => {
        let testUser: any

        beforeEach(async () => {
            const userData = {
                email: 'delete@example.com',
                displayName: 'To Delete'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/users',
                payload: userData
            })

            testUser = JSON.parse(response.body).data
        })

        test('should delete existing user', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/users/${testUser.id}`
            })

            expect(response.statusCode).toBe(204)

            // Verify user is deleted
            const getResponse = await app.inject({
                method: 'GET',
                url: `/api/users/${testUser.id}`
            })

            expect(getResponse.statusCode).toBe(404)
        })

        test('should return 404 for non-existent user', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/users/123e4567-e89b-12d3-a456-426614174000'
            })

            expect(response.statusCode).toBe(404)
            const body = JSON.parse(response.body)
            expect(body.statusCode).toBe(404)
            expect(body.code).toBe('NOT_FOUND')
            expect(body.message).toContain('User with id')
        })
    })

    describe('GET /api/users/:id/stats', () => {
        let testUser: any

        beforeEach(async () => {
            const userData = {
                email: 'stats@example.com',
                displayName: 'Stats User'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/users',
                payload: userData
            })

            testUser = JSON.parse(response.body).data
        })

        test('should return user with empty stats', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/users/${testUser.id}/stats`
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.success).toBe(true)
            expect(body.data.id).toBe(testUser.id)
            expect(body.data.stats).toEqual({
                totalCharacters: 0,
                totalImages: 0,
                totalItems: 0,
                totalTags: 0
            })
        })

        test('should return 404 for non-existent user', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/users/123e4567-e89b-12d3-a456-426614174000/stats'
            })

            expect(response.statusCode).toBe(404)
            const body = JSON.parse(response.body)
            expect(body.statusCode).toBe(404)
            expect(body.code).toBe('NOT_FOUND')
            expect(body.message).toContain('User with id')
        })
    })
})
