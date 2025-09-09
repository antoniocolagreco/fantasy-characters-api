import type { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { prisma } from '@/infrastructure/database'
import { HTTP_STATUS } from '@/shared/constants/http-status'
import { generateUUIDv7 } from '@/shared/utils/uuid'
import { createAuthHeaders } from '@/tests/helpers/test.helper'
// Helper to create a user
async function createUser(role: 'USER' | 'MODERATOR' | 'ADMIN') {
    return prisma.user.create({
        data: {
            id: generateUUIDv7(),
            email: `${role.toLowerCase()}-${Date.now()}@test.dev`,
            passwordHash: 'x',
            role,
            isEmailVerified: true,
            isActive: true,
        },
    })
}

async function createRace(ownerId: string, visibility: 'PUBLIC' | 'HIDDEN' = 'PUBLIC') {
    return prisma.race.create({
        data: {
            id: generateUUIDv7(),
            name: `Race-${generateUUIDv7()}`,
            visibility,
            ownerId,
            description: 'Secret race desc',
            healthModifier: 100,
            manaModifier: 100,
            staminaModifier: 100,
            strengthModifier: 10,
            constitutionModifier: 10,
            dexterityModifier: 10,
            intelligenceModifier: 10,
            wisdomModifier: 10,
            charismaModifier: 10,
        },
    })
}

async function createArchetype(ownerId: string, visibility: 'PUBLIC' | 'HIDDEN' = 'PUBLIC') {
    return prisma.archetype.create({
        data: {
            id: generateUUIDv7(),
            name: `Arch-${generateUUIDv7()}`,
            visibility,
            ownerId,
            description: 'Secret archetype desc',
        },
    })
}

async function createItem(ownerId: string, visibility: 'PUBLIC' | 'HIDDEN' = 'PUBLIC') {
    return prisma.item.create({
        data: {
            id: generateUUIDv7(),
            name: `Item-${generateUUIDv7()}`,
            slot: 'ONE_HAND',
            requiredLevel: 1,
            visibility,
            ownerId,
            value: 1,
            weight: 1,
            description: 'Secret item desc',
        },
    })
}

async function createCharacter(
    ownerId: string,
    raceId: string,
    archetypeId: string,
    visibility: 'PUBLIC' | 'HIDDEN' = 'PUBLIC'
) {
    return prisma.character.create({
        data: {
            id: generateUUIDv7(),
            name: `Char-${generateUUIDv7()}`,
            ownerId,
            raceId,
            archetypeId,
            visibility,
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

async function equipItem(characterId: string, itemId: string) {
    return prisma.equipment.create({
        data: {
            id: generateUUIDv7(),
            characterId,
            rightHandId: itemId,
        },
    })
}

describe('Character expanded & masking integration', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    it('returns expanded view with masked nested entities and null (concealed) equipment for anonymous', async () => {
        const owner = await createUser('USER')
        const hiddenRace = await createRace(owner.id, 'HIDDEN')
        const hiddenArch = await createArchetype(owner.id, 'HIDDEN')
        const hiddenItem = await createItem(owner.id, 'HIDDEN')
        const character = await createCharacter(owner.id, hiddenRace.id, hiddenArch.id, 'PUBLIC')
        await equipItem(character.id, hiddenItem.id)

        const res = await app.inject({
            method: 'GET',
            url: `/api/v1/characters/${character.id}?expanded=true`,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.OK)
        const body = res.json()
        expect(body.data.race.name).toBe('[HIDDEN]')
        expect(body.data.archetype.name).toBe('[HIDDEN]')
        // Non-viewable equipment slot item should be null
        expect(body.data.equipment.rightHand).toBeNull()
    })

    it('owner sees unmasked expanded data', async () => {
        const owner = await createUser('USER')
        const race = await createRace(owner.id, 'HIDDEN')
        const arch = await createArchetype(owner.id, 'HIDDEN')
        const item = await createItem(owner.id, 'HIDDEN')
        const character = await createCharacter(owner.id, race.id, arch.id, 'PUBLIC')
        await equipItem(character.id, item.id)
        const headers = createAuthHeaders({ id: owner.id, role: 'USER', email: owner.email })

        const res = await app.inject({
            method: 'GET',
            url: `/api/v1/characters/${character.id}?expanded=true`,
            headers,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.OK)
        const body = res.json()
        expect(body.data.race.name).not.toBe('[HIDDEN]')
        expect(body.data.archetype.name).not.toBe('[HIDDEN]')
        // Owner can view hidden item, original name returned
        expect(body.data.equipment.rightHand.name).not.toBe('[HIDDEN]')
    })

    it('moderator sees unmasked hidden data', async () => {
        const owner = await createUser('USER')
        const mod = await createUser('MODERATOR')
        const race = await createRace(owner.id, 'HIDDEN')
        const arch = await createArchetype(owner.id, 'HIDDEN')
        const item = await createItem(owner.id, 'HIDDEN')
        const character = await createCharacter(owner.id, race.id, arch.id, 'PUBLIC')
        await equipItem(character.id, item.id)

        const res = await app.inject({
            method: 'GET',
            url: `/api/v1/characters/${character.id}?expanded=true`,
            headers: createAuthHeaders({ id: mod.id, role: 'MODERATOR', email: mod.email }),
        })
        expect(res.statusCode).toBe(HTTP_STATUS.OK)
        const body = res.json()
        expect(body.data.race.name).not.toBe('[HIDDEN]')
        expect(body.data.archetype.name).not.toBe('[HIDDEN]')
        expect(body.data.equipment.rightHand.name).not.toBe('[HIDDEN]')
    })
})
