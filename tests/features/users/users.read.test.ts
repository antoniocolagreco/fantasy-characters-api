import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { seedTestDatabase } from '@/tests/helpers/data.helper'
import {
    createAuthHeaders,
    expectSuccessResponse,
    expectErrorResponse,
    expectPaginatedResponse,
    expectSafeUserData,
    HTTP_STATUS,
    type TestResponse,
} from '@/tests/helpers/test.helper'

describe('Users API - Read Operations', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    // Database cleanup handled globally in tests/setup.ts

    describe('GET /api/v1/users/:id', () => {
        it('should return user data for valid request by admin', async () => {
            // Arrange
            const { regularUser } = await seedTestDatabase()

            // Act
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/users/${regularUser.id}`,
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            // Assert
            const body = expectSuccessResponse(response as TestResponse)
            expect(body.data).toMatchObject({
                id: regularUser.id,
                email: regularUser.email,
                name: regularUser.name,
                role: regularUser.role,
            })
            expectSafeUserData(body.data as Record<string, unknown>)
        })

        it('should allow user to access own profile', async () => {
            // Arrange
            const { regularUser } = await seedTestDatabase()

            // Act
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/users/${regularUser.id}`,
                headers: createAuthHeaders({
                    role: 'USER',
                    id: regularUser.id,
                    email: regularUser.email,
                }),
            })

            // Assert
            expectSuccessResponse(response as TestResponse)
        })

        it('should return 404 for unauthorized access (concealment)', async () => {
            // Arrange
            const { regularUser } = await seedTestDatabase()

            // Act
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/users/${regularUser.id}`,
                // No auth headers
            })

            // Assert
            expectErrorResponse(response, HTTP_STATUS.NOT_FOUND)
        })

        it('should return 404 for non-existent user', async () => {
            // Arrange
            const nonExistentId = '01234567-89ab-cdef-0123-456789abcdef'

            // Act
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/users/${nonExistentId}`,
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            // Assert
            expectErrorResponse(response, HTTP_STATUS.NOT_FOUND)
        })

        it('should return 400 for invalid UUID format', async () => {
            // Act
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/invalid-uuid',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            // Assert
            expectErrorResponse(response, HTTP_STATUS.BAD_REQUEST)
        })
    })

    describe('GET /api/v1/users', () => {
        it('should return paginated list of users for admin', async () => {
            // Arrange
            await seedTestDatabase()

            // Act
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users?limit=10',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            // Assert
            const body = expectPaginatedResponse(response)
            expect((body.data as unknown[]).length).toBeGreaterThan(0)

            // Verify user structure
            ;(body.data as Record<string, unknown>[]).forEach(user => {
                expectSafeUserData(user)
            })
        })

        it('should filter users by role', async () => {
            // Arrange
            await seedTestDatabase()

            // Act
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users?role=USER',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            // Assert
            const body = expectSuccessResponse(response)
            expect(body.data).toBeInstanceOf(Array)

            // All returned users should have USER role
            ;(body.data as { role: string }[]).forEach(user => {
                expect(user.role).toBe('USER')
            })
        })

        it('should return 403 for non-admin users', async () => {
            // Act
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users',
                headers: createAuthHeaders({ role: 'USER' }),
            })

            // Assert
            expectErrorResponse(response, HTTP_STATUS.FORBIDDEN)
        })
    })

    describe('GET /api/v1/users/stats', () => {
        it('should return comprehensive user statistics for admin', async () => {
            // Arrange
            await seedTestDatabase()

            // Act
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/stats',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            // Assert
            const body = expectSuccessResponse(response)
            expect(body.data).toMatchObject({
                totalUsers: expect.any(Number),
                activeUsers: expect.any(Number),
                bannedUsers: expect.any(Number),
                unverifiedUsers: expect.any(Number),
                usersByRole: expect.objectContaining({
                    USER: expect.any(Number),
                    ADMIN: expect.any(Number),
                    MODERATOR: expect.any(Number),
                }),
            })

            // Verify stats make logical sense
            const stats = body.data as {
                totalUsers: number
                activeUsers: number
                bannedUsers: number
                usersByRole: { USER: number; ADMIN: number; MODERATOR: number }
            }
            expect(stats.totalUsers).toBeGreaterThan(0)
            expect(stats.activeUsers + stats.bannedUsers).toBeLessThanOrEqual(stats.totalUsers)
            expect(
                stats.usersByRole.USER + stats.usersByRole.ADMIN + stats.usersByRole.MODERATOR
            ).toBe(stats.totalUsers)
        })

        it('should return 403 for non-admin users', async () => {
            // Act
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/stats',
                headers: createAuthHeaders({ role: 'USER' }),
            })

            // Assert
            expectErrorResponse(response, HTTP_STATUS.FORBIDDEN)
        })
    })
})
