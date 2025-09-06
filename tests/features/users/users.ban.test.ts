import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import type { User } from '@/features/users'
import prismaService from '@/infrastructure/database/prisma.service'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

describe('Users API v1 - Ban Operations', () => {
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

        // Create test user
        const createResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/users',
            payload: {
                email: 'banuser@example.com',
                password: 'password123',
                name: 'Ban User',
                role: 'USER' as const,
            },
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ role: 'ADMIN' }),
            },
        })
        const response: { data: User } = createResponse.json()
        userId = response.data.id
    })

    describe('POST /api/v1/users/:id/ban', () => {
        it('should ban user (ADMIN access)', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/users/${userId}/ban`,
                payload: {
                    banReason: 'Test ban',
                    bannedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data.isBanned).toBe(true)
        })

        it('should unban user (ADMIN access)', async () => {
            // First ban the user
            await app.inject({
                method: 'POST',
                url: `/api/v1/users/${userId}/ban`,
                payload: {
                    banReason: 'Test ban',
                    bannedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })

            // Then unban (empty payload triggers unban logic)
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/users/${userId}/ban`,
                payload: {},
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data.isBanned).toBe(false)
        })

        it('should reject unauthorized access', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/users/${userId}/ban`,
                payload: { banReason: 'Test ban' },
                headers: {
                    'content-type': 'application/json',
                },
            })

            expect(response.statusCode).toBe(401) // No auth header = 401
        })

        it('should return 404 for non-existent user', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/users/01234567-89ab-cdef-0123-456789abcdef/ban',
                payload: { banReason: 'Test ban' },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })

            expect(response.statusCode).toBe(404)
        })
    })
})
