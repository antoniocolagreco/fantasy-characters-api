import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import prismaService from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

describe('Tags API v1 - Update Operations', () => {
    let app: FastifyInstance
    let originalRbacEnabled: string | undefined
    let testUserId: string
    let otherUserId: string
    let testTag: { id: string; name: string }
    let otherUserTag: { id: string; name: string }

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    afterEach(() => {
        // Restore original RBAC_ENABLED value
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
        await prismaService.tag.deleteMany()
        await prismaService.refreshToken.deleteMany()
        await prismaService.user.deleteMany()

        // Enable RBAC for authorization tests
        process.env.RBAC_ENABLED = 'true'

        // Create test users
        testUserId = generateUUIDv7()
        otherUserId = generateUUIDv7()

        await prismaService.user.createMany({
            data: [
                {
                    id: testUserId,
                    email: 'test@example.com',
                    passwordHash: 'hashedpassword',
                    role: 'USER',
                    isEmailVerified: true,
                    isActive: true,
                    lastLogin: new Date(),
                },
                {
                    id: otherUserId,
                    email: 'other@example.com',
                    passwordHash: 'hashedpassword',
                    role: 'USER',
                    isEmailVerified: true,
                    isActive: true,
                    lastLogin: new Date(),
                },
            ],
        })

        // Create test tags
        testTag = await prismaService.tag.create({
            data: {
                id: generateUUIDv7(),
                name: 'User Tag',
                description: 'A user tag',
                visibility: 'PUBLIC',
                ownerId: testUserId,
            },
        })

        otherUserTag = await prismaService.tag.create({
            data: {
                id: generateUUIDv7(),
                name: 'Other User Tag',
                description: 'Another user tag',
                visibility: 'PUBLIC',
                ownerId: otherUserId,
            },
        })
    })

    describe('PUT /api/v1/tags/:id', () => {
        it('should update own tag', async () => {
            const updateData = {
                name: 'Updated Tag',
                description: 'Updated description',
                visibility: 'PRIVATE',
            }

            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/tags/${testTag.id}`,
                payload: updateData,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toMatchObject({
                id: testTag.id,
                name: updateData.name,
                description: updateData.description,
                visibility: updateData.visibility,
            })
        })

        it('should allow admin to update any tag', async () => {
            const updateData = {
                name: 'Admin Updated Tag',
                description: 'Updated by admin',
            }

            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/tags/${otherUserTag.id}`,
                payload: updateData,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toMatchObject({
                id: otherUserTag.id,
                name: updateData.name,
                description: updateData.description,
            })
        })

        it('should deny updating other user tag', async () => {
            const updateData = {
                name: 'Unauthorized Update',
            }

            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/tags/${otherUserTag.id}`,
                payload: updateData,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })

            expect(response.statusCode).toBe(403)
        })

        it('should return 404 for non-existent tag', async () => {
            const nonExistentId = generateUUIDv7()
            const updateData = {
                name: 'Non-existent',
            }

            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/tags/${nonExistentId}`,
                payload: updateData,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })

            expect(response.statusCode).toBe(404)
        })

        it('should prevent duplicate names', async () => {
            const updateData = {
                name: otherUserTag.name, // Try to use existing name
            }

            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/tags/${testTag.id}`,
                payload: updateData,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })

            expect(response.statusCode).toBe(409)
        })

        it('should require authentication', async () => {
            const updateData = {
                name: 'Unauthenticated Update',
            }

            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/tags/${testTag.id}`,
                payload: updateData,
                headers: {
                    'content-type': 'application/json',
                },
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('DELETE /api/v1/tags/:id', () => {
        it('should delete own tag', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/tags/${testTag.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })

            expect(response.statusCode).toBe(204)

            // Verify tag is deleted
            const deletedTag = await prismaService.tag.findUnique({
                where: { id: testTag.id },
            })
            expect(deletedTag).toBeNull()
        })

        it('should allow admin to delete any tag', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/tags/${otherUserTag.id}`,
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            expect(response.statusCode).toBe(204)
        })

        it('should deny deleting other user tag', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/tags/${otherUserTag.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })

            expect(response.statusCode).toBe(403)
        })

        it('should return 404 for non-existent tag', async () => {
            const nonExistentId = generateUUIDv7()

            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/tags/${nonExistentId}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })

            expect(response.statusCode).toBe(404)
        })

        it('should require authentication', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/tags/${testTag.id}`,
            })

            expect(response.statusCode).toBe(401)
        })
    })
})
