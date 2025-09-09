import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import prismaService from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

// Mirrors perks.update.test.ts structure

describe('Races API v1 - Update/Delete', () => {
    let app: FastifyInstance
    let originalRbacEnabled: string | undefined
    let testUserId: string
    let otherUserId: string
    let testRace: { id: string; name: string }
    let otherUserRace: { id: string; name: string }

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
                    email: 'raceuser@example.com',
                    passwordHash: 'hashedpassword',
                    role: 'USER',
                    isEmailVerified: true,
                    isActive: true,
                    lastLogin: new Date(),
                },
                {
                    id: otherUserId,
                    email: 'otherrace@example.com',
                    passwordHash: 'hashedpassword',
                    role: 'USER',
                    isEmailVerified: true,
                    isActive: true,
                    lastLogin: new Date(),
                },
            ],
        })

        testRace = await prismaService.race.create({
            data: {
                id: generateUUIDv7(),
                name: 'User Race',
                description: 'A user race',
                visibility: 'PUBLIC',
                healthModifier: 100,
                manaModifier: 100,
                staminaModifier: 100,
                strengthModifier: 10,
                constitutionModifier: 10,
                dexterityModifier: 10,
                intelligenceModifier: 10,
                wisdomModifier: 10,
                charismaModifier: 10,
                ownerId: testUserId,
            },
        })

        otherUserRace = await prismaService.race.create({
            data: {
                id: generateUUIDv7(),
                name: 'Other User Race',
                description: 'Another user race',
                visibility: 'PUBLIC',
                healthModifier: 100,
                manaModifier: 100,
                staminaModifier: 100,
                strengthModifier: 10,
                constitutionModifier: 10,
                dexterityModifier: 10,
                intelligenceModifier: 10,
                wisdomModifier: 10,
                charismaModifier: 10,
                ownerId: otherUserId,
            },
        })
    })

    describe('PUT /api/v1/races/:id', () => {
        it('updates own race', async () => {
            const payload = {
                name: 'Updated Race',
                description: 'Updated desc',
                visibility: 'PRIVATE',
                strengthModifier: 20,
            }
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/races/${testRace.id}`,
                payload,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })
            expect(response.statusCode).toBe(200)
            expect(response.json().data).toMatchObject({
                id: testRace.id,
                name: 'Updated Race',
                visibility: 'PRIVATE',
                strengthModifier: 20,
            })
        })

        it('allows admin to update any race', async () => {
            const payload = { name: 'Admin Updated Race' }
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/races/${otherUserRace.id}`,
                payload,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })
            expect(response.statusCode).toBe(200)
            expect(response.json().data).toMatchObject({
                id: otherUserRace.id,
                name: 'Admin Updated Race',
            })
        })

        it('denies updating other user race', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/races/${otherUserRace.id}`,
                payload: { name: 'Unauthorized' },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })
            expect(response.statusCode).toBe(403)
        })

        it('returns 404 for non-existent race', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/races/${generateUUIDv7()}`,
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
                url: `/api/v1/races/${testRace.id}`,
                payload: { name: otherUserRace.name },
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
                url: `/api/v1/races/${testRace.id}`,
                payload: { name: 'Unauthenticated' },
                headers: { 'content-type': 'application/json' },
            })
            expect(response.statusCode).toBe(401)
        })
    })

    describe('DELETE /api/v1/races/:id', () => {
        it('deletes own race', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/races/${testRace.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(204)
            const deleted = await prismaService.race.findUnique({ where: { id: testRace.id } })
            expect(deleted).toBeNull()
        })

        it('allows admin to delete any race', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/races/${otherUserRace.id}`,
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })
            expect(response.statusCode).toBe(204)
        })

        it('denies deleting other user race', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/races/${otherUserRace.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(403)
        })

        it('returns 404 for non-existent race', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/races/${generateUUIDv7()}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(404)
        })

        it('requires authentication', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/races/${testRace.id}`,
            })
            expect(response.statusCode).toBe(401)
        })
    })
})
