import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import prismaService from '@/infrastructure/database/prisma.service'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

describe('Users API v1 - Create Operations', () => {
    let app: FastifyInstance

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

            expect(response.statusCode).toBe(201)
            const body = response.json()
            expect(body).toHaveProperty('data')
            expect(body.data).toMatchObject({
                email: userData.email,
                name: userData.name,
                role: userData.role,
                isActive: true,
                isEmailVerified: false,
                isBanned: false,
            })
            expect(body.data).toHaveProperty('id')
            expect(body.data).toHaveProperty('createdAt')
            expect(body.data).toHaveProperty('updatedAt')
            expect(body.data).not.toHaveProperty('password')
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

            expect(response.statusCode).toBe(409)
        })

        it('should reject unauthorized request', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/users',
                payload: { email: 'test@example.com', password: 'password123' },
                headers: { 'content-type': 'application/json' },
            })

            expect(response.statusCode).toBe(401)
        })
    })
})
