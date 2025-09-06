import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import prismaService from '@/infrastructure/database/prisma.service'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

describe('Users API v1 - Read Operations', () => {
    let app: FastifyInstance
    let userId: string
    let originalRbacEnabled: string | undefined

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    afterEach(() => {
        // Restore original RBAC_ENABLED value instead of deleting it
        if (originalRbacEnabled !== undefined) {
            process.env.RBAC_ENABLED = originalRbacEnabled
        } else {
            delete process.env.RBAC_ENABLED
        }
    })

    beforeEach(async () => {
        // Save original RBAC_ENABLED value
        originalRbacEnabled = process.env.RBAC_ENABLED

        // Clean database
        await prismaService.refreshToken.deleteMany()
        await prismaService.user.deleteMany()

        // Enable RBAC for authorization tests
        process.env.RBAC_ENABLED = 'true'
    })

    describe('GET /api/v1/users/:id', () => {
        beforeEach(async () => {
            const createResponse = await app.inject({
                method: 'POST',
                url: '/api/v1/users',
                payload: {
                    email: 'getuser@example.com',
                    password: 'password123',
                    name: 'Get User',
                    role: 'USER' as const,
                },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })
            userId = createResponse.json().data.id
        })

        it('should get user by id (ADMIN access)', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/users/${userId}`,
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toMatchObject({
                id: userId,
                email: 'getuser@example.com',
                name: 'Get User',
                role: 'USER',
            })
        })

        it('should get user by id (USER accessing own profile)', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/users/${userId}`,
                headers: createAuthHeaders({ role: 'USER', id: userId }),
            })

            expect(response.statusCode).toBe(200)
        })

        it('should reject unauthorized access', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/users/${userId}`,
            })

            expect(response.statusCode).toBe(403) // RBAC returns 403 for unauthenticated requests
        })

        it('should return 404 for non-existent user', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/01234567-89ab-cdef-0123-456789abcdef',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            expect(response.statusCode).toBe(404)
        })
    })

    describe('GET /api/v1/users', () => {
        beforeEach(async () => {
            // Create test users
            await Promise.all([
                app.inject({
                    method: 'POST',
                    url: '/api/v1/users',
                    payload: {
                        email: 'user1@example.com',
                        password: 'password123',
                        name: 'User 1',
                        role: 'USER' as const,
                    },
                    headers: {
                        'content-type': 'application/json',
                        ...createAuthHeaders({ role: 'ADMIN' }),
                    },
                }),
                app.inject({
                    method: 'POST',
                    url: '/api/v1/users',
                    payload: {
                        email: 'admin1@example.com',
                        password: 'password123',
                        name: 'Admin 1',
                        role: 'ADMIN' as const,
                    },
                    headers: {
                        'content-type': 'application/json',
                        ...createAuthHeaders({ role: 'ADMIN' }),
                    },
                }),
            ])
        })

        it('should list users with pagination (ADMIN)', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users?limit=10',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toHaveLength(2)
            expect(body.pagination).toMatchObject({
                limit: 10,
                hasNext: false,
                hasPrev: false,
            })
        })

        it('should filter users by role (ADMIN)', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users?role=USER',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].role).toBe('USER')
        })

        it('should reject unauthorized access', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users',
            })

            expect(response.statusCode).toBe(403) // RBAC returns 403 for unauthenticated requests
        })
    })

    describe('GET /api/v1/users/stats', () => {
        beforeEach(async () => {
            // Create test users
            await Promise.all([
                app.inject({
                    method: 'POST',
                    url: '/api/v1/users',
                    payload: {
                        email: 'statsuser1@example.com',
                        password: 'password123',
                        name: 'Stats User 1',
                        role: 'USER' as const,
                    },
                    headers: {
                        'content-type': 'application/json',
                        ...createAuthHeaders({ role: 'ADMIN' }),
                    },
                }),
                app.inject({
                    method: 'POST',
                    url: '/api/v1/users',
                    payload: {
                        email: 'statsadmin1@example.com',
                        password: 'password123',
                        name: 'Stats Admin 1',
                        role: 'ADMIN' as const,
                    },
                    headers: {
                        'content-type': 'application/json',
                        ...createAuthHeaders({ role: 'ADMIN' }),
                    },
                }),
            ])
        })

        it('should return user statistics (ADMIN)', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/stats',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toMatchObject({
                totalUsers: 2,
                activeUsers: 2,
                bannedUsers: 0,
                unverifiedUsers: 2,
                usersByRole: {
                    USER: 1,
                    ADMIN: 1,
                    MODERATOR: 0,
                },
            })
        })

        it('should reject unauthorized access', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/stats',
            })

            expect(response.statusCode).toBe(403) // RBAC returns 403 for unauthenticated requests
        })
    })
})
