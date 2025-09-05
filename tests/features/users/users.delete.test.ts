import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import prismaService from '@/infrastructure/database/prisma.service'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

describe('Users API v1 - Delete Operations', () => {
    let app: FastifyInstance
    let userId: string

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        // Clean database
        await prismaService.refreshToken.deleteMany()
        await prismaService.user.deleteMany()

        // Create test user
        const createResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/users',
            payload: {
                email: 'deleteuser@example.com',
                password: 'password123',
                name: 'Delete User',
                role: 'USER' as const,
            },
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ role: 'ADMIN' }),
            },
        })
        userId = createResponse.json().data.id
    })

    describe('DELETE /api/v1/users/:id', () => {
        it('should delete user (ADMIN access)', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/users/${userId}`,
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            expect(response.statusCode).toBe(204)
            expect(response.body).toBe('')

            // Verify user is deleted
            const getResponse = await app.inject({
                method: 'GET',
                url: `/api/v1/users/${userId}`,
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })
            expect(getResponse.statusCode).toBe(404)
        })

        it('should reject unauthorized access', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/users/${userId}`,
            })

            expect(response.statusCode).toBe(401) // No auth header = 401
        })

        it('should return 404 for non-existent user', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/users/01234567-89ab-cdef-0123-456789abcdef',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            expect(response.statusCode).toBe(404)
        })
    })
})
