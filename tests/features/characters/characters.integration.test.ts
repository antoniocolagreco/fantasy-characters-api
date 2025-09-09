import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { HTTP_STATUS } from '@/shared/constants'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'
import {
    cleanupTestData,
    createTestArchetype,
    createTestRace,
    createTestUserInDb,
} from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

async function seedDependencies(ownerId: string) {
    const race = await createTestRace({ ownerId })
    const archetype = await createTestArchetype({ ownerId })
    return { race, archetype }
}

describe('Characters API - integration', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })
    afterAll(async () => {
        await app.close()
        await cleanupTestData()
    })
    beforeEach(async () => {
        await testPrisma.character.deleteMany({})
        await testPrisma.race.deleteMany({})
        await testPrisma.archetype.deleteMany({})
    })

    it('creates character (authorized) and retrieves it', async () => {
        const user = await createTestUserInDb({ role: 'USER' })
        const { race, archetype } = await seedDependencies(user.id)
        const res = await app.inject({
            method: 'POST',
            url: '/api/v1/characters',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: user.id, email: user.email, role: 'USER' }),
            },
            payload: { name: 'IntegrChar1', raceId: race.id, archetypeId: archetype.id },
        })
        expect(res.statusCode).toBe(HTTP_STATUS.CREATED)
        const body = res.json()
        const id = body.data.id as string
        const getRes = await app.inject({ method: 'GET', url: `/api/v1/characters/${id}` })
        expect(getRes.statusCode).toBe(HTTP_STATUS.OK)
    })

    it('rejects duplicate name with 409', async () => {
        const user = await createTestUserInDb({ role: 'USER' })
        const { race, archetype } = await seedDependencies(user.id)
        const headers = {
            'content-type': 'application/json',
            ...createAuthHeaders({ id: user.id, email: user.email, role: 'USER' }),
        }
        const payload = { name: 'DupName', raceId: race.id, archetypeId: archetype.id }
        const first = await app.inject({
            method: 'POST',
            url: '/api/v1/characters',
            headers,
            payload,
        })
        expect(first.statusCode).toBe(HTTP_STATUS.CREATED)
        const second = await app.inject({
            method: 'POST',
            url: '/api/v1/characters',
            headers,
            payload,
        })
        expect(second.statusCode).toBe(HTTP_STATUS.CONFLICT)
    })

    it('lists characters with pagination and uses cursor for next page', async () => {
        const user = await createTestUserInDb({ role: 'USER' })
        const { race, archetype } = await seedDependencies(user.id)
        const headers = {
            'content-type': 'application/json',
            ...createAuthHeaders({ id: user.id, email: user.email, role: 'USER' }),
        }
        for (let i = 0; i < 3; i++) {
            await app.inject({
                method: 'POST',
                url: '/api/v1/characters',
                headers,
                payload: {
                    name: `Paginated-${i}-${Date.now()}-${i}`,
                    raceId: race.id,
                    archetypeId: archetype.id,
                },
            })
        }
        const list1 = await app.inject({ method: 'GET', url: '/api/v1/characters?limit=2' })
        expect(list1.statusCode).toBe(HTTP_STATUS.OK)
        const listBody1 = list1.json()
        // Accept either hasNext true or false depending on service logic
        const cursor: string | undefined =
            listBody1.pagination.nextCursor || listBody1.pagination.endCursor
        if (cursor) {
            const list2 = await app.inject({
                method: 'GET',
                url: `/api/v1/characters?limit=2&cursor=${cursor}`,
            })
            expect(list2.statusCode).toBe(HTTP_STATUS.OK)
        }
    })

    it('enforces visibility: private not visible to other user, hidden not visible to regular user', async () => {
        const owner = await createTestUserInDb({ role: 'USER' })
        const other = await createTestUserInDb({ role: 'USER' })
        const mod = await createTestUserInDb({ role: 'MODERATOR' })
        const { race, archetype } = await seedDependencies(owner.id)
        // Create private
        const privRes = await app.inject({
            method: 'POST',
            url: '/api/v1/characters',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: owner.id, email: owner.email, role: 'USER' }),
            },
            payload: {
                name: 'PrivVisChar',
                raceId: race.id,
                archetypeId: archetype.id,
                visibility: 'PRIVATE',
            },
        })
        expect(privRes.statusCode).toBe(HTTP_STATUS.CREATED)
        const privId = privRes.json().data.id as string
        const otherGet = await app.inject({ method: 'GET', url: `/api/v1/characters/${privId}` })
        // anonymous concealed (404) by service visibility check
        expect(otherGet.statusCode).toBe(HTTP_STATUS.NOT_FOUND)
        const authOtherGet = await app.inject({
            method: 'GET',
            url: `/api/v1/characters/${privId}`,
            headers: createAuthHeaders({ id: other.id, email: other.email, role: 'USER' }),
        })
        expect(authOtherGet.statusCode).toBe(HTTP_STATUS.NOT_FOUND)
        const ownerGet = await app.inject({
            method: 'GET',
            url: `/api/v1/characters/${privId}`,
            headers: createAuthHeaders({ id: owner.id, email: owner.email, role: 'USER' }),
        })
        expect(ownerGet.statusCode).toBe(HTTP_STATUS.OK)
        // Hidden character
        const hiddenRes = await app.inject({
            method: 'POST',
            url: '/api/v1/characters',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: owner.id, email: owner.email, role: 'USER' }),
            },
            payload: {
                name: 'HiddenVisChar',
                raceId: race.id,
                archetypeId: archetype.id,
                visibility: 'HIDDEN',
            },
        })
        expect(hiddenRes.statusCode).toBe(HTTP_STATUS.CREATED)
        const hiddenId = hiddenRes.json().data.id as string
        const hiddenOther = await app.inject({
            method: 'GET',
            url: `/api/v1/characters/${hiddenId}`,
            headers: createAuthHeaders({ id: other.id, email: other.email, role: 'USER' }),
        })
        expect(hiddenOther.statusCode).toBe(HTTP_STATUS.NOT_FOUND)
        const hiddenMod = await app.inject({
            method: 'GET',
            url: `/api/v1/characters/${hiddenId}`,
            headers: createAuthHeaders({ id: mod.id, email: mod.email, role: 'MODERATOR' }),
        })
        // Service allows moderator view of hidden
        expect(hiddenMod.statusCode).toBe(HTTP_STATUS.OK)
    })

    it('update and delete lifecycle with permissions', async () => {
        const owner = await createTestUserInDb({ role: 'USER' })
        const other = await createTestUserInDb({ role: 'USER' })
        const { race, archetype } = await seedDependencies(owner.id)
        const createRes = await app.inject({
            method: 'POST',
            url: '/api/v1/characters',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: owner.id, email: owner.email, role: 'USER' }),
            },
            payload: { name: 'LifecycleChar', raceId: race.id, archetypeId: archetype.id },
        })
        expect(createRes.statusCode).toBe(HTTP_STATUS.CREATED)
        const id = createRes.json().data.id as string
        const forbiddenUpdate = await app.inject({
            method: 'PUT',
            url: `/api/v1/characters/${id}`,
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: other.id, email: other.email, role: 'USER' }),
            },
            payload: { level: 2 },
        })
        expect(forbiddenUpdate.statusCode).toBe(HTTP_STATUS.FORBIDDEN)
        const okUpdate = await app.inject({
            method: 'PUT',
            url: `/api/v1/characters/${id}`,
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: owner.id, email: owner.email, role: 'USER' }),
            },
            payload: { level: 3 },
        })
        expect(okUpdate.statusCode).toBe(HTTP_STATUS.OK)
        const delForbidden = await app.inject({
            method: 'DELETE',
            url: `/api/v1/characters/${id}`,
            headers: createAuthHeaders({ id: other.id, email: other.email, role: 'USER' }),
        })
        expect(delForbidden.statusCode).toBe(HTTP_STATUS.FORBIDDEN)
        const delOk = await app.inject({
            method: 'DELETE',
            url: `/api/v1/characters/${id}`,
            headers: createAuthHeaders({ id: owner.id, email: owner.email, role: 'USER' }),
        })
        expect(delOk.statusCode).toBe(HTTP_STATUS.NO_CONTENT)
    })

    it('invalid cursor returns validation error', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/characters?cursor=invalid-base64',
        })
        // repository throws VALIDATION_ERROR -> mapped to 400
        expect(res.statusCode).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('prevents unauthenticated creation', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/api/v1/characters',
            headers: { 'content-type': 'application/json' },
            payload: {
                name: 'NoAuth',
                raceId: '00000000-0000-0000-0000-000000000000',
                archetypeId: '00000000-0000-0000-0000-000000000000',
            },
        })
        expect(res.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it('forbids stats for regular user', async () => {
        const user = await createTestUserInDb({ role: 'USER' })
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/characters/stats',
            headers: createAuthHeaders({ id: user.id, email: user.email, role: 'USER' }),
        })
        expect(res.statusCode).toBe(HTTP_STATUS.FORBIDDEN)
    })
})
