import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'
import { createTestUserInDb, createTestRace } from '@/tests/helpers/data.helper'

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

        // Rely on internal unique email generation (full UUID + timestamp) to avoid collisions
        const testUser = await createTestUserInDb({
            role: 'USER',
        })
        testUserId = testUser.id

        testRace = await createTestRace({
            ownerId: testUserId,
            description: 'A test race',
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
                name: testRace.name,
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
            const otherUser = await createTestUserInDb({
                role: 'USER',
            })
            const privateRace = await createTestRace({
                ownerId: otherUser.id,
                visibility: 'PRIVATE',
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
        let firstRaceName: string
        beforeEach(async () => {
            const r1 = await createTestRace({ ownerId: testUserId })
            firstRaceName = r1.name
            await createTestRace({ ownerId: testUserId })
            await createTestRace({ ownerId: testUserId, visibility: 'HIDDEN' })
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
            const prefix = firstRaceName.split(' ').slice(0, 2).join(' ') // 'Test Race'
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/races?search=${encodeURIComponent(prefix)}`,
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data.some((r: any) => r.name.startsWith(prefix))).toBe(true)
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
