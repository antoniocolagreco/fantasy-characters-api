import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

describe('Users API v1 - Update Operations', () => {
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

        // Enable RBAC for authorization tests
        process.env.RBAC_ENABLED = 'true'

        // Create test user
        const createResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/users',
            payload: {
                email: 'updateuser@example.com',
                password: 'password123',
                name: 'Update User',
                role: 'USER' as const,
            },
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ role: 'ADMIN' }),
            },
        })
        userId = createResponse.json().data.id
    })

    describe('PUT /api/v1/users/:id', () => {
        it('should update user (ADMIN access)', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/users/${userId}`,
                payload: {
                    name: 'Updated Name',
                    role: 'MODERATOR',
                },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toMatchObject({
                id: userId,
                name: 'Updated Name',
                role: 'MODERATOR',
            })
        })

        it('should update user (USER updating own profile)', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/users/${userId}`,
                payload: {
                    name: 'Self Updated Name',
                },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: userId }),
                },
            })

            expect(response.statusCode).toBe(200)
            expect(response.json().data.name).toBe('Self Updated Name')
        })

        it('should reject partial update with invalid data', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/users/${userId}`,
                payload: {
                    name: '', // Invalid: empty string should fail minLength validation
                },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })

            expect(response.statusCode).toBe(400)
        })

        it('should reject unauthorized access', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/users/${userId}`,
                payload: {
                    name: 'Unauthorized Update',
                },
                headers: {
                    'content-type': 'application/json',
                },
            })

            expect(response.statusCode).toBe(401) // No auth header = 401
        })

        it('should return 404 for non-existent user', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/users/01234567-89ab-cdef-0123-456789abcdef',
                payload: {
                    name: 'Non-existent User',
                },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })

            expect(response.statusCode).toBe(404)
        })

        it('resets email verification and revokes tokens when email changes', async () => {
            // Create a verified user (admin action)
            const createResp = await app.inject({
                method: 'POST',
                url: '/api/v1/users',
                payload: {
                    email: 'verified.user@example.com',
                    password: 'password123',
                    name: 'Verified User',
                    role: 'USER' as const,
                    isEmailVerified: true,
                },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })
            const verifiedUserId = createResp.json().data.id as string

            // Login to obtain a refresh token
            const loginResp = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/login',
                payload: { email: 'verified.user@example.com', password: 'password123' },
                headers: { 'content-type': 'application/json' },
            })
            expect(loginResp.statusCode).toBe(200)
            const refreshToken = loginResp.json().data.refreshToken as string

            // Change the user's email (admin)
            const newEmail = 'new.email@example.com'
            const updateResp = await app.inject({
                method: 'PUT',
                url: `/api/v1/users/${verifiedUserId}`,
                payload: { email: newEmail },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })
            expect(updateResp.statusCode).toBe(200)
            const body = updateResp.json()
            expect(body.data.email).toBe(newEmail)
            expect(body.data.isEmailVerified).toBe(false)

            // Attempt to refresh tokens with the old refresh token — should fail (revoked)
            const refreshResp = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/refresh',
                payload: { refreshToken },
                headers: { 'content-type': 'application/json' },
            })
            expect([400, 401]).toContain(refreshResp.statusCode)
        })
    })
})
