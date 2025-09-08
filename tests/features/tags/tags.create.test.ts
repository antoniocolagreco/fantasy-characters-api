import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { passwordService } from '@/features/auth/password.service'
import prismaService from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

describe('Tags API v1 - Create Operations', () => {
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
        await prismaService.tag.deleteMany()
        await prismaService.refreshToken.deleteMany()
        await prismaService.user.deleteMany()

        // Enable RBAC for authorization tests
        process.env.RBAC_ENABLED = 'true'
    })

    describe('POST /api/v1/tags', () => {
        it('should create a new tag with default visibility', async () => {
            // Create a real user in database
            const passwordHash = await passwordService.hashPassword('test-password-123')
            const testUser = await prismaService.user.create({
                data: {
                    id: generateUUIDv7(),
                    email: 'user@test.local',
                    passwordHash,
                    role: 'USER',
                    name: 'Test User',
                    isEmailVerified: true,
                    isActive: true,
                    isBanned: false,
                },
            })

            const tagData = {
                name: 'Fantasy',
                description: 'Fantasy themed content',
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/tags',
                payload: tagData,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ id: testUser.id, role: 'USER' }),
                },
            })

            expect(response.statusCode).toBe(201)
            const body = response.json()
            expect(body).toHaveProperty('data')
            expect(body.data).toMatchObject({
                name: tagData.name,
                description: tagData.description,
                visibility: 'PUBLIC',
                ownerId: testUser.id,
            })
            expect(body.data).toHaveProperty('id')
            expect(body.data).toHaveProperty('createdAt')
            expect(body.data).toHaveProperty('updatedAt')
        })

        it('should require authentication', async () => {
            const tagData = {
                name: 'Unauthenticated',
                description: 'Should fail',
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/tags',
                payload: tagData,
                headers: {
                    'content-type': 'application/json',
                },
            })

            expect(response.statusCode).toBe(401)
        })
    })
})
