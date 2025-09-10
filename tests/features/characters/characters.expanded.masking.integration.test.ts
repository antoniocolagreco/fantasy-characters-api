import type { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { prisma } from '@/infrastructure/database'
import { seedBulkItems } from '@/infrastructure/database/seed/items'
import { seedTaxonomy } from '@/infrastructure/database/seed/taxonomy'
import { HTTP_STATUS } from '@/shared/constants/http-status'
import { generateUUIDv7 } from '@/shared/utils/uuid'
import { createAuthHeaders } from '@/tests/helpers/test.helper'

// Minimal helpers leveraging seed utilities for parity with app seeding
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

    it('returns expanded view with masked nested entities and masked equipment for anonymous', async () => {
        const owner = await createUser('USER')
        const { races, archetypes } = await seedTaxonomy(prisma, owner.id)
        const { slotMap } = await seedBulkItems(prisma, owner.id)
        const hiddenRace = races[0]
        const hiddenArch = archetypes[0]
        // Mark taxonomy entries as HIDDEN to test masking
        await prisma.race.update({
            where: { id: hiddenRace.id },
            data: { visibility: 'HIDDEN' },
        })
        await prisma.archetype.update({
            where: { id: hiddenArch.id },
            data: { visibility: 'HIDDEN' },
        })
        const character = await createCharacter(owner.id, hiddenRace.id, hiddenArch.id, 'PUBLIC')
        const oneHandIds = slotMap.ONE_HAND
        if (!Array.isArray(oneHandIds) || oneHandIds.length === 0) {
            throw new Error('No ONE_HAND items available')
        }
        const firstId = oneHandIds[0]
        if (typeof firstId !== 'string') {
            throw new Error('Invalid ONE_HAND item id')
        }
        // Mark item as HIDDEN to test equipment masking
        await prisma.item.update({
            where: { id: firstId },
            data: { visibility: 'HIDDEN' },
        })
        await equipItem(character.id, firstId)

        const res = await app.inject({
            method: 'GET',
            url: `/api/v1/characters/${character.id}?expanded=true`,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.OK)
        const body = res.json()
        expect(body.data.race.name).toBe('[HIDDEN]')
        expect(body.data.archetype.name).toBe('[HIDDEN]')
        // Non-privileged viewers see hidden equipment masked (not null)
        expect(body.data.equipment.rightHand).toBeTypeOf('object')
        expect(body.data.equipment.rightHand.name).toBe('[HIDDEN]')
    })

    it('owner sees unmasked expanded data', async () => {
        const owner = await createUser('USER')
        const { races, archetypes } = await seedTaxonomy(prisma, owner.id)
        const { slotMap } = await seedBulkItems(prisma, owner.id)
        // Hide taxonomy entries
        await prisma.race.update({
            where: { id: races[0]!.id },
            data: { visibility: 'HIDDEN' },
        })
        await prisma.archetype.update({
            where: { id: archetypes[0]!.id },
            data: { visibility: 'HIDDEN' },
        })
        const character = await createCharacter(owner.id, races[0]!.id, archetypes[0]!.id, 'PUBLIC')
        const oneHandIds = slotMap.ONE_HAND
        if (!Array.isArray(oneHandIds) || oneHandIds.length === 0) {
            throw new Error('No ONE_HAND items available')
        }
        const firstId = oneHandIds[0]
        if (typeof firstId !== 'string') {
            throw new Error('Invalid ONE_HAND item id')
        }
        await prisma.item.update({
            where: { id: firstId },
            data: { visibility: 'HIDDEN' },
        })
        await equipItem(character.id, firstId)
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
        const { races, archetypes } = await seedTaxonomy(prisma, owner.id)
        const { slotMap } = await seedBulkItems(prisma, owner.id)
        // Hide taxonomy entries
        await prisma.race.update({
            where: { id: races[0]!.id },
            data: { visibility: 'HIDDEN' },
        })
        await prisma.archetype.update({
            where: { id: archetypes[0]!.id },
            data: { visibility: 'HIDDEN' },
        })
        const character = await createCharacter(owner.id, races[0]!.id, archetypes[0]!.id, 'PUBLIC')
        const oneHandIds = slotMap.ONE_HAND
        if (!Array.isArray(oneHandIds) || oneHandIds.length === 0) {
            throw new Error('No ONE_HAND items available')
        }
        const firstId = oneHandIds[0]
        if (typeof firstId !== 'string') {
            throw new Error('Invalid ONE_HAND item id')
        }
        await prisma.item.update({
            where: { id: firstId },
            data: { visibility: 'HIDDEN' },
        })
        await equipItem(character.id, firstId)

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
