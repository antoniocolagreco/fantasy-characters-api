import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import prismaService from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

// Mirrors skills.update.test.ts structure

describe('Perks API v1 - Update/Delete', () => {
    let app: FastifyInstance
    let originalRbacEnabled: string | undefined
    let testUserId: string
    let otherUserId: string
    let testPerk: { id: string; name: string }
    let otherUserPerk: { id: string; name: string }

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    afterEach(() => {
        if (originalRbacEnabled !== undefined) process.env.RBAC_ENABLED = originalRbacEnabled
        else delete process.env.RBAC_ENABLED
    })

    beforeEach(async () => {
        originalRbacEnabled = process.env.RBAC_ENABLED
        process.env.RBAC_ENABLED = 'true'

        testUserId = generateUUIDv7()
        otherUserId = generateUUIDv7()

        await prismaService.user.createMany({
            data: [
                {
                    id: testUserId,
                    email: 'perkuser@example.com',
                    passwordHash: 'hashedpassword',
                    role: 'USER',
                    isEmailVerified: true,
                    isActive: true,
                    lastLogin: new Date(),
                },
                {
                    id: otherUserId,
                    email: 'otherperk@example.com',
                    passwordHash: 'hashedpassword',
                    role: 'USER',
                    isEmailVerified: true,
                    isActive: true,
                    lastLogin: new Date(),
                },
            ],
        })

        testPerk = await prismaService.perk.create({
            data: {
                id: generateUUIDv7(),
                name: 'User Perk',
                description: 'A user perk',
                requiredLevel: 1,
                visibility: 'PUBLIC',
                ownerId: testUserId,
            },
        })

        otherUserPerk = await prismaService.perk.create({
            data: {
                id: generateUUIDv7(),
                name: 'Other User Perk',
                description: 'Another user perk',
                requiredLevel: 1,
                visibility: 'PUBLIC',
                ownerId: otherUserId,
            },
        })
    })

    describe('PUT /api/v1/perks/:id', () => {
        it('updates own perk', async () => {
            const payload = {
                name: 'Updated Perk',
                description: 'Updated desc',
                visibility: 'PRIVATE',
            }
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/perks/${testPerk.id}`,
                payload,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })
            expect(response.statusCode).toBe(200)
            expect(response.json().data).toMatchObject({
                id: testPerk.id,
                name: 'Updated Perk',
                visibility: 'PRIVATE',
            })
        })

        it('allows admin to update any perk', async () => {
            const payload = { name: 'Admin Updated Perk' }
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/perks/${otherUserPerk.id}`,
                payload,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })
            expect(response.statusCode).toBe(200)
            expect(response.json().data).toMatchObject({
                id: otherUserPerk.id,
                name: 'Admin Updated Perk',
            })
        })

        it('denies updating other user perk', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/perks/${otherUserPerk.id}`,
                payload: { name: 'Unauthorized' },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })
            expect(response.statusCode).toBe(403)
        })

        it('returns 404 for non-existent perk', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/perks/${generateUUIDv7()}`,
                payload: { name: 'Non-existent' },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })
            expect(response.statusCode).toBe(404)
        })

        it('prevents duplicate names', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/perks/${testPerk.id}`,
                payload: { name: otherUserPerk.name },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })
            expect(response.statusCode).toBe(409)
        })

        it('requires authentication', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/perks/${testPerk.id}`,
                payload: { name: 'Unauthenticated' },
                headers: { 'content-type': 'application/json' },
            })
            expect(response.statusCode).toBe(401)
        })
    })

    describe('DELETE /api/v1/perks/:id', () => {
        it('deletes own perk', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/perks/${testPerk.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(204)
            const deleted = await prismaService.perk.findUnique({ where: { id: testPerk.id } })
            expect(deleted).toBeNull()
        })

        it('allows admin to delete any perk', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/perks/${otherUserPerk.id}`,
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })
            expect(response.statusCode).toBe(204)
        })

        it('denies deleting other user perk', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/perks/${otherUserPerk.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(403)
        })

        it('returns 404 for non-existent perk', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/perks/${generateUUIDv7()}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(404)
        })

        it('requires authentication', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/perks/${testPerk.id}`,
            })
            expect(response.statusCode).toBe(401)
        })
    })
})
