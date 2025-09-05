import type { FastifyInstance } from 'fastify'
import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest'

import { buildApp } from '../../../src/app'
import prismaService from '../../../src/infrastructure/database/prisma.service'
import { createAuthHeaders } from '../../helpers/auth.helper'

describe('Users API v1 - Update Operations', () => {
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
    })
})
