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
            email: `admin-item-${Date.now()}@test.dev`,
            passwordHash: 'x',
            role: 'ADMIN',
            isEmailVerified: true,
            isActive: true,
        },
    })
}

async function createItem(ownerId: string) {
    return prisma.item.create({
        data: {
            id: generateUUIDv7(),
            name: `Item-${generateUUIDv7()}`,
            ownerId,
            rarity: 'COMMON',
            slot: 'NONE',
            requiredLevel: 1,
            weight: 1.0,
            durability: 100,
            maxDurability: 100,
            value: 0,
            is2Handed: false,
            isThrowable: false,
            isConsumable: false,
            isQuestItem: false,
            isTradeable: true,
            visibility: 'PUBLIC',
        },
    })
}

async function createCharacter(ownerId: string, raceId: string, archetypeId: string) {
    return prisma.character.create({
        data: {
            id: generateUUIDv7(),
            name: `Char-Item-${generateUUIDv7()}`,
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

async function createRace(ownerId: string) {
    return prisma.race.create({
        data: {
            id: generateUUIDv7(),
            name: `R-Item-${generateUUIDv7()}`,
            ownerId,
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
            name: `Arch-Item-${generateUUIDv7()}`,
            ownerId,
            visibility: 'PUBLIC',
        },
    })
}

async function equipItem(characterId: string, itemId: string) {
    // create empty equipment if needed then set a slot (head by default)
    await prisma.equipment.upsert({
        where: { characterId },
        update: { headId: itemId },
        create: { id: generateUUIDv7(), characterId, headId: itemId },
    })
}

describe('Item deletion conflict (409)', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    it('returns 409 when item is equipped', async () => {
        const admin = await createAdmin()
        const item = await createItem(admin.id)
        const race = await createRace(admin.id)
        const arch = await createArchetype(admin.id)
        const character = await createCharacter(admin.id, race.id, arch.id)
        await equipItem(character.id, item.id)
        const headers = createAuthHeaders({ id: admin.id, role: 'ADMIN', email: admin.email })

        const res = await app.inject({
            method: 'DELETE',
            url: `/api/v1/items/${item.id}`,
            headers,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.CONFLICT)
        expect(res.json().error.code).toBe('RESOURCE_IN_USE')
    })

    it('deletes item when unused', async () => {
        const admin = await createAdmin()
        const item = await createItem(admin.id)
        const headers = createAuthHeaders({ id: admin.id, role: 'ADMIN', email: admin.email })
        const res = await app.inject({
            method: 'DELETE',
            url: `/api/v1/items/${item.id}`,
            headers,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.NO_CONTENT)
    })
})
