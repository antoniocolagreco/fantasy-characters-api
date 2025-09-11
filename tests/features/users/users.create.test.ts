import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'
import { HTTP_STATUS, expectSuccessResponse, type TestResponse } from '@/tests/helpers/test.helper'

describe('Users API v1 - Create Operations', () => {
    let app: FastifyInstance
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
    })

    describe('POST /api/v1/users', () => {
        it('should create a new user', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
                role: 'USER' as const,
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/users',
                payload: userData,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })

            const body = expectSuccessResponse(response as TestResponse, HTTP_STATUS.CREATED)
            expect(body.data).toMatchObject({
                email: userData.email,
                name: userData.name,
                role: userData.role,
                isActive: true,
                isEmailVerified: false,
                isBanned: false,
            })
            expect(body.data as Record<string, unknown>).toHaveProperty('id')
            expect(body.data as Record<string, unknown>).toHaveProperty('createdAt')
            expect(body.data as Record<string, unknown>).toHaveProperty('updatedAt')
            expect(body.data as Record<string, unknown>).not.toHaveProperty('password')
        })

        it('should reject duplicate email', async () => {
            const userData = {
                email: 'duplicate@example.com',
                password: 'password123',
                role: 'USER' as const,
            }

            // Create first user
            await app.inject({
                method: 'POST',
                url: '/api/v1/users',
                payload: userData,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })

            // Try to create duplicate
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/users',
                payload: userData,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })

            expect(response.statusCode).toBe(HTTP_STATUS.CONFLICT)
        })

        it('should reject unauthorized request', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/users',
                payload: { email: 'test@example.com', password: 'password123' },
                headers: { 'content-type': 'application/json' },
            })

            expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED)
        })
    })
})
