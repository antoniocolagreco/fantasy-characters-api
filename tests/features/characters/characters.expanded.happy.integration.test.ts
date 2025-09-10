import type { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { prisma } from '@/infrastructure/database'
import { seedBulkItems } from '@/infrastructure/database/seed/items'
import { seedTaxonomy } from '@/infrastructure/database/seed/taxonomy'
import { HTTP_STATUS } from '@/shared/constants/http-status'
import { generateUUIDv7 } from '@/shared/utils/uuid'

async function createUser() {
    return prisma.user.create({
        data: {
            id: generateUUIDv7(),
            email: `user-${Date.now()}@test.local`,
            passwordHash: 'x',
            role: 'USER',
            isEmailVerified: true,
            isActive: true,
        },
    })
}
// taxonomy and items are seeded via shared seed utilities

async function createCharacter(ownerId: string, raceId: string, archetypeId: string) {
    return prisma.character.create({
        data: {
            id: generateUUIDv7(),
            name: `Hero-${Date.now()}`,
            ownerId,
            raceId,
            archetypeId,
            visibility: 'PUBLIC',
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
        },
    })
}

async function equipRightHand(characterId: string, itemId: string) {
    return prisma.equipment.create({
        data: {
            id: generateUUIDv7(),
            characterId,
            rightHandId: itemId,
        },
    })
}

describe('Characters expanded happy path', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    it('GET /characters/:id?expanded=true returns equipment slot minimal shape', async () => {
        const user = await createUser()
        const { races, archetypes } = await seedTaxonomy(prisma, user.id)
        const { slotMap } = await seedBulkItems(prisma, user.id)
        const race = races[0]
        const arch = archetypes[0]
        const ids = slotMap.ONE_HAND
        if (!Array.isArray(ids) || ids.length === 0) throw new Error('No ONE_HAND items seeded')
        const oneHandId = ids[0]
        if (typeof oneHandId !== 'string') throw new Error('Invalid ONE_HAND id')
        const character = await createCharacter(user.id, race.id, arch.id)
        await equipRightHand(character.id, oneHandId)

        const res = await app.inject({
            method: 'GET',
            url: `/api/v1/characters/${character.id}?expanded=true`,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.OK)
        const body = res.json()
        // Ensure rightHand is object with at least id and name (and no unexpected circulars)
        expect(body.data.equipment.rightHand).toMatchObject({ id: oneHandId })
        expect(typeof body.data.equipment.rightHand.name).toBe('string')
        // And archetype/race visibility normalized to string
        expect(typeof body.data.race.visibility).toBe('string')
        expect(typeof body.data.archetype.visibility).toBe('string')
    })

    it('GET /characters?expanded=true returns list with basics without throwing', async () => {
        const res = await app.inject({ method: 'GET', url: '/api/v1/characters?expanded=true' })
        expect(res.statusCode).toBe(HTTP_STATUS.OK)
        const body = res.json()
        // If characters exist, ensure basics are present
        if (Array.isArray(body.data) && body.data.length > 0) {
            const ch = body.data[0]
            expect(ch.race && typeof ch.race).toBeTruthy()
            expect(ch.archetype && typeof ch.archetype).toBeTruthy()
        }
    })
})
