import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'
import { prismaFake, resetDb } from '@/tests/helpers/inmemory-prisma'

describe('Tags API v1 - Read Operations', () => {
    let app: FastifyInstance
    let originalRbacEnabled: string | undefined
    let testUserId: string
    let testTag: { id: string; name: string }

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
        resetDb()

        // Enable RBAC for authorization tests
        process.env.RBAC_ENABLED = 'true'

        // Create test user
        testUserId = generateUUIDv7()
        await prismaFake.user.create({
            data: {
                id: testUserId,
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                role: 'USER',
                isEmailVerified: true,
                isActive: true,
                lastLogin: new Date(),
            },
        })

        // Create test tag
        testTag = await prismaFake.tag.create({
            data: {
                id: generateUUIDv7(),
                name: 'Test Tag',
                description: 'A test tag',
                visibility: 'PUBLIC',
                ownerId: testUserId,
            },
        })
    })

    describe('GET /api/v1/tags/:id', () => {
        it('should get a tag by ID', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/tags/${testTag.id}`,
                headers: createAuthHeaders({ id: testUserId, role: 'USER' }),
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toMatchObject({
                id: testTag.id,
                name: 'Test Tag',
                description: 'A test tag',
                visibility: 'PUBLIC',
                ownerId: testUserId,
            })
        })

        it('should return 404 for non-existent tag', async () => {
            const nonExistentId = generateUUIDv7()
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/tags/${nonExistentId}`,
                headers: createAuthHeaders({ role: 'USER' }),
            })

            expect(response.statusCode).toBe(404)
        })

        it('should return 404 for private tag if not owner', async () => {
            // Create private tag owned by different user
            const otherUserId = generateUUIDv7()
            await prismaFake.user.create({
                data: {
                    id: otherUserId,
                    email: 'other@example.com',
                    passwordHash: 'hashedpassword',
                    role: 'USER',
                    isEmailVerified: true,
                    isActive: true,
                    lastLogin: new Date(),
                },
            })

            const privateTag = await prismaFake.tag.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Private Tag',
                    description: 'A private tag',
                    visibility: 'PRIVATE',
                    ownerId: otherUserId,
                },
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/tags/${privateTag.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })

            expect(response.statusCode).toBe(404)
        })
    })

    describe('GET /api/v1/tags', () => {
        beforeEach(async () => {
            // Create multiple tags for listing tests
            await prismaFake.tag.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public Tag 1',
                    description: 'First public tag',
                    visibility: 'PUBLIC',
                    ownerId: testUserId,
                },
            })
            await prismaFake.tag.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public Tag 2',
                    description: 'Second public tag',
                    visibility: 'PUBLIC',
                    ownerId: testUserId,
                },
            })
            await prismaFake.tag.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Private Tag',
                    description: 'A private tag',
                    visibility: 'PRIVATE',
                    ownerId: testUserId,
                },
            })
        })

        it('should list public tags', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/tags',
                headers: createAuthHeaders({ role: 'USER' }),
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toBeInstanceOf(Array)
            expect(body.data.length).toBeGreaterThan(0)
            expect(body.pagination).toHaveProperty('limit')
            expect(body.pagination).toHaveProperty('hasNext')
        })

        it('should filter tags by search', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/tags?search=Public Tag 1',
                headers: createAuthHeaders({ role: 'USER' }),
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].name).toBe('Public Tag 1')
        })

        it('should filter tags by visibility', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/tags?visibility=PUBLIC',
                headers: createAuthHeaders({ role: 'USER' }),
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data.every((tag: any) => tag.visibility === 'PUBLIC')).toBe(true)
        })
    })

    describe('GET /api/v1/tags/stats', () => {
        it('should return tag statistics for admin', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/tags/stats',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toHaveProperty('totalTags')
            expect(body.data).toHaveProperty('publicTags')
            expect(body.data).toHaveProperty('privateTags')
            expect(body.data).toHaveProperty('hiddenTags')
            expect(body.data).toHaveProperty('newTagsLast30Days')
            expect(body.data).toHaveProperty('topTags')
        })

        it('should return tag statistics for moderator', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/tags/stats',
                headers: createAuthHeaders({ role: 'MODERATOR' }),
            })

            expect(response.statusCode).toBe(200)
        })

        it('should deny access to regular users', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/tags/stats',
                headers: createAuthHeaders({ role: 'USER' }),
            })

            expect(response.statusCode).toBe(403)
        })
    })
})
