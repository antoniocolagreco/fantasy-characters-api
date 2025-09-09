import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'
import { createTestUserInDb } from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

// Mirrors perks.read.test.ts patterns

describe('Races API v1 - Read Operations', () => {
    let app: FastifyInstance
    let originalRbacEnabled: string | undefined
    let testUserId: string
    let testRace: { id: string; name: string }

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

        const testUser = await createTestUserInDb({ email: 'race-user@example.com', role: 'USER' })
        testUserId = testUser.id

        testRace = await testPrisma.race.create({
            data: {
                id: generateUUIDv7(),
                name: 'Test Race',
                description: 'A test race',
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
    })

    describe('GET /api/v1/races/:id', () => {
        it('gets a race by ID', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/races/${testRace.id}`,
                headers: createAuthHeaders({ id: testUserId, role: 'USER' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toMatchObject({
                id: testRace.id,
                name: 'Test Race',
                visibility: 'PUBLIC',
            })
        })

        it('returns 404 for non-existent race', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/races/${generateUUIDv7()}`,
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(404)
        })

        it('returns 404 for private race if not owner', async () => {
            const otherUser = await createTestUserInDb({ email: 'other@example.com', role: 'USER' })
            const privateRace = await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Private Race',
                    visibility: 'PRIVATE',
                    healthModifier: 100,
                    manaModifier: 100,
                    staminaModifier: 100,
                    strengthModifier: 10,
                    constitutionModifier: 10,
                    dexterityModifier: 10,
                    intelligenceModifier: 10,
                    wisdomModifier: 10,
                    charismaModifier: 10,
                    ownerId: otherUser.id,
                },
            })
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/races/${privateRace.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('GET /api/v1/races', () => {
        beforeEach(async () => {
            await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public Race 1',
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
            await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public Race 2',
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
            await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Hidden Race',
                    visibility: 'HIDDEN',
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
        })

        it('lists public races', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/races',
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(Array.isArray(body.data)).toBe(true)
            expect(body.pagination).toHaveProperty('limit')
            expect(body.pagination).toHaveProperty('hasNext')
        })

        it('filters by search', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/races?search=Public Race 1',
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].name).toBe('Public Race 1')
        })

        it('filters by visibility', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/races?visibility=PUBLIC',
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data.every((s: any) => s.visibility === 'PUBLIC')).toBe(true)
        })
    })

    describe('GET /api/v1/races/stats', () => {
        it('returns stats for admin', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/races/stats',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toHaveProperty('totalRaces')
            expect(body.data).toHaveProperty('publicRaces')
            expect(body.data).toHaveProperty('privateRaces')
            expect(body.data).toHaveProperty('hiddenRaces')
            expect(body.data).toHaveProperty('newRacesLast30Days')
            expect(body.data).toHaveProperty('topRaces')
        })

        it('returns stats for moderator', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/races/stats',
                headers: createAuthHeaders({ role: 'MODERATOR' }),
            })
            expect(response.statusCode).toBe(200)
        })

        it('denies access to regular users', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/races/stats',
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(403)
        })
    })
})
