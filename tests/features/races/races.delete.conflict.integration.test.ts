import type { FastifyInstance } from 'fastify'
import { describe, it, expect, beforeAll } from 'vitest'

import { buildApp } from '@/app'
import { prisma } from '@/infrastructure/database'
import { HTTP_STATUS } from '@/shared/constants/http-status'
import { generateUUIDv7 } from '@/shared/utils/uuid'
import { createAuthHeaders } from '@/tests/helpers/test.helper'

async function createAdmin() {
    return prisma.user.create({
        data: {
            id: generateUUIDv7(),
            email: `admin-${Date.now()}@test.dev`,
            passwordHash: 'x',
            role: 'ADMIN',
            isEmailVerified: true,
            isActive: true,
        },
    })
}

async function createRace(ownerId: string) {
    return prisma.race.create({
        data: {
            id: generateUUIDv7(),
            name: `Race-${generateUUIDv7()}`,
            ownerId,
            description: 'To be referenced',
            healthModifier: 100,
            manaModifier: 100,
            staminaModifier: 100,
            strengthModifier: 10,
            constitutionModifier: 10,
            dexterityModifier: 10,
            intelligenceModifier: 10,
            wisdomModifier: 10,
            charismaModifier: 10,
            visibility: 'PUBLIC',
        },
    })
}

async function createArchetype(ownerId: string) {
    return prisma.archetype.create({
        data: {
            id: generateUUIDv7(),
            name: `Arch-${generateUUIDv7()}`,
            ownerId,
            visibility: 'PUBLIC',
        },
    })
}

async function createCharacter(ownerId: string, raceId: string, archetypeId: string) {
    return prisma.character.create({
        data: {
            id: generateUUIDv7(),
            name: `Char-${generateUUIDv7()}`,
            ownerId,
            raceId,
            archetypeId,
            level: 1,
            experience: 0,
            age: 20,
            health: 100,
            mana: 100,
            stamina: 100,
            strength: 10,
            constitution: 10,
            dexterity: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
            sex: 'MALE',
            visibility: 'PUBLIC',
        },
    })
}

describe('Race deletion conflict (409)', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    it('returns 409 when race is referenced by character', async () => {
        const admin = await createAdmin()
        const race = await createRace(admin.id)
        const arch = await createArchetype(admin.id)
        await createCharacter(admin.id, race.id, arch.id)
        const headers = createAuthHeaders({ id: admin.id, role: 'ADMIN', email: admin.email })

        const res = await app.inject({
            method: 'DELETE',
            url: `/api/v1/races/${race.id}`,
            headers,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.CONFLICT)
        const body = res.json()
        expect(body.error.code).toBe('RESOURCE_IN_USE')
    })

    it('deletes race when unused', async () => {
        const admin = await createAdmin()
        const race = await createRace(admin.id)
        const headers = createAuthHeaders({ id: admin.id, role: 'ADMIN', email: admin.email })

        const res = await app.inject({
            method: 'DELETE',
            url: `/api/v1/races/${race.id}`,
            headers,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.NO_CONTENT)
    })
})
