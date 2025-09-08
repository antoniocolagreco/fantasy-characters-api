import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'
import { createTestUserInDb } from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

// Mirrors skills.read.test.ts

describe('Perks API v1 - Read Operations', () => {
    let app: FastifyInstance
    let originalRbacEnabled: string | undefined
    let testUserId: string
    let testPerk: { id: string; name: string }

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

        const testUser = await createTestUserInDb({ email: 'perk-user@example.com', role: 'USER' })
        testUserId = testUser.id

        testPerk = await testPrisma.perk.create({
            data: {
                id: generateUUIDv7(),
                name: 'Test Perk',
                description: 'A test perk',
                requiredLevel: 1,
                visibility: 'PUBLIC',
                ownerId: testUserId,
            },
        })
    })

    describe('GET /api/v1/perks/:id', () => {
        it('gets a perk by ID', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/perks/${testPerk.id}`,
                headers: createAuthHeaders({ id: testUserId, role: 'USER' }),
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toMatchObject({
                id: testPerk.id,
                name: 'Test Perk',
                description: 'A test perk',
                visibility: 'PUBLIC',
                ownerId: testUserId,
            })
        })

        it('returns 404 for non-existent perk', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/perks/${generateUUIDv7()}`,
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(404)
        })

        it('returns 404 for private perk if not owner', async () => {
            const otherUser = await createTestUserInDb({ email: 'other@example.com', role: 'USER' })
            const privatePerk = await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Private Perk',
                    description: 'Secret',
                    requiredLevel: 2,
                    visibility: 'PRIVATE',
                    ownerId: otherUser.id,
                },
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/perks/${privatePerk.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('GET /api/v1/perks', () => {
        beforeEach(async () => {
            await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public Perk 1',
                    description: 'First public perk',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                    ownerId: testUserId,
                },
            })
            await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public Perk 2',
                    description: 'Second public perk',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                    ownerId: testUserId,
                },
            })
            await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Private Perk 1',
                    description: 'A private perk',
                    requiredLevel: 1,
                    visibility: 'PRIVATE',
                    ownerId: testUserId,
                },
            })
        })

        it('lists public perks', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/perks',
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
                url: '/api/v1/perks?search=Public Perk 1',
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].name).toBe('Public Perk 1')
        })

        it('filters by visibility', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/perks?visibility=PUBLIC',
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data.every((s: any) => s.visibility === 'PUBLIC')).toBe(true)
        })
    })

    describe('GET /api/v1/perks/stats', () => {
        it('returns stats for admin', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/perks/stats',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toHaveProperty('totalPerks')
            expect(body.data).toHaveProperty('publicPerks')
            expect(body.data).toHaveProperty('privatePerks')
            expect(body.data).toHaveProperty('hiddenPerks')
            expect(body.data).toHaveProperty('newPerksLast30Days')
            expect(body.data).toHaveProperty('topPerks')
        })

        it('returns stats for moderator', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/perks/stats',
                headers: createAuthHeaders({ role: 'MODERATOR' }),
            })
            expect(response.statusCode).toBe(200)
        })

        it('denies access to regular users', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/perks/stats',
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(403)
        })
    })
})
