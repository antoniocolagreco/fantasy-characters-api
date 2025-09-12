import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { generateUUIDv7 } from '@/shared/utils/uuid'
import { HTTP_STATUS, createAuthHeaders } from '@/tests/helpers/test.helper'
import { testPrisma } from '@/tests/setup'

async function seedRaceAndArchetype() {
    const raceId = generateUUIDv7()
    const archetypeId = generateUUIDv7()
    await testPrisma.race.create({
        data: { id: raceId, name: `Test Race ${raceId.slice(-6)}` },
    })
    await testPrisma.archetype.create({
        data: { id: archetypeId, name: `Test Arch ${archetypeId.slice(-6)}` },
    })
    return { raceId, archetypeId }
}

describe('RBAC Email Verification Gate — enabled', () => {
    let app: FastifyInstance
    let originalFlag: string | undefined
    let raceId: string
    let archetypeId: string

    beforeAll(async () => {
        originalFlag = process.env.EMAIL_VERIFICATION_ENABLED
        process.env.EMAIL_VERIFICATION_ENABLED = 'true'
        app = await buildApp()
        await app.ready()
    })

    beforeEach(async () => {
        const { raceId: rid, archetypeId: aid } = await seedRaceAndArchetype()
        raceId = rid
        archetypeId = aid
    })

    afterAll(async () => {
        await app.close()
        if (originalFlag !== undefined) process.env.EMAIL_VERIFICATION_ENABLED = originalFlag
        else delete process.env.EMAIL_VERIFICATION_ENABLED
    })

    it('blocks unverified USER from creating when enabled', async () => {
        const userId = generateUUIDv7()
        await testPrisma.user.create({
            data: {
                id: userId,
                email: `gate-unverified-${userId.slice(-6)}@example.com`,
                passwordHash: '$argon2id$fakehash',
                role: 'USER',
                isEmailVerified: false,
                isActive: true,
            },
        })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/characters',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: userId, role: 'USER', email: `user-${userId}@x.dev` }),
            },
            payload: {
                name: `Unverified Hero ${userId.slice(-6)}`,
                raceId,
                archetypeId,
            },
        })

        expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN)
        const body = response.json() as { error?: { message?: string } }
        expect(body.error?.message || '').toMatch(/email not verified/i)
    })

    it('allows verified USER to create when enabled', async () => {
        const userId = generateUUIDv7()
        await testPrisma.user.create({
            data: {
                id: userId,
                email: `gate-verified-${userId.slice(-6)}@example.com`,
                passwordHash: '$argon2id$fakehash',
                role: 'USER',
                isEmailVerified: true,
                isActive: true,
            },
        })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/characters',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: userId, role: 'USER', email: `user-${userId}@x.dev` }),
            },
            payload: {
                name: `Verified Hero ${userId.slice(-6)}`,
                raceId,
                archetypeId,
            },
        })

        if (response.statusCode !== HTTP_STATUS.CREATED) {
            // eslint-disable-next-line no-console
            console.log('DEBUG create(verified) body:', response.json())
        }
        expect(response.statusCode).toBe(HTTP_STATUS.CREATED)
        const body = response.json() as { data?: { id?: string; name?: string } }
        expect(body.data?.id).toMatch(/[0-9a-f-]{36}/i)
    })
})

describe('RBAC Email Verification Gate — disabled', () => {
    let app: FastifyInstance
    let originalFlag: string | undefined
    let raceId: string
    let archetypeId: string

    beforeAll(async () => {
        originalFlag = process.env.EMAIL_VERIFICATION_ENABLED
        process.env.EMAIL_VERIFICATION_ENABLED = 'false'
        app = await buildApp()
        await app.ready()
    })

    beforeEach(async () => {
        const { raceId: rid, archetypeId: aid } = await seedRaceAndArchetype()
        raceId = rid
        archetypeId = aid
    })

    afterAll(async () => {
        await app.close()
        if (originalFlag !== undefined) process.env.EMAIL_VERIFICATION_ENABLED = originalFlag
        else delete process.env.EMAIL_VERIFICATION_ENABLED
    })

    it('allows unverified USER to create when disabled', async () => {
        const userId = generateUUIDv7()
        await testPrisma.user.create({
            data: {
                id: userId,
                email: `gate-disabled-${userId.slice(-6)}@example.com`,
                passwordHash: '$argon2id$fakehash',
                role: 'USER',
                isEmailVerified: false,
                isActive: true,
            },
        })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/characters',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: userId, role: 'USER', email: `user-${userId}@x.dev` }),
            },
            payload: {
                name: `Disabled Gate Hero ${userId.slice(-6)}`,
                raceId,
                archetypeId,
            },
        })

        if (response.statusCode !== HTTP_STATUS.CREATED) {
            // eslint-disable-next-line no-console
            console.log('DEBUG create(disabled) body:', response.json())
        }
        expect(response.statusCode).toBe(HTTP_STATUS.CREATED)
    })
})
