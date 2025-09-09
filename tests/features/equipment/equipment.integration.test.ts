import type { FastifyInstance } from 'fastify'
import { describe, expect, it, beforeAll } from 'vitest'

import { buildApp } from '@/app'
import { prisma } from '@/infrastructure/database'
import { HTTP_STATUS } from '@/shared/constants/http-status'
import { generateUUIDv7 } from '@/shared/utils/uuid'
import {
    createTestRequest,
    expectSuccessResponse,
    expectErrorResponse,
    type TestResponse,
} from '@/tests/helpers/test.helper'

async function seedCharacter(ownerRole: 'USER' | 'ADMIN' = 'USER') {
    const ownerId = generateUUIDv7()
    const characterId = generateUUIDv7()
    const raceId = generateUUIDv7()
    const archetypeId = generateUUIDv7()

    await prisma.user.create({
        data: {
            id: ownerId,
            email: `${ownerId}@example.com`,
            name: 'Owner',
            role: ownerRole,
            passwordHash: 'hash',
        },
    })

    await prisma.race.create({
        data: {
            id: raceId,
            name: `Race-${raceId.slice(0, 6)}`,
        },
    })

    await prisma.archetype.create({
        data: {
            id: archetypeId,
            name: `Arch-${archetypeId.slice(0, 6)}`,
        },
    })

    await prisma.character.create({
        data: {
            id: characterId,
            name: 'Char',
            level: 1,
            strength: 5,
            dexterity: 5,
            constitution: 5,
            intelligence: 5,
            wisdom: 5,
            charisma: 5,
            ownerId,
            raceId,
            archetypeId,
        },
    })
    return { ownerId, characterId }
}

async function seedItem(slot: string, ownerId: string, extra: Record<string, unknown> = {}) {
    const id = generateUUIDv7()
    await prisma.item.create({
        data: {
            id,
            name: `Item-${id}`,
            slot: slot as any,
            rarity: 'COMMON',
            requiredLevel: 1,
            weight: 1,
            durability: 10,
            maxDurability: 10,
            value: 1,
            is2Handed: slot === 'TWO_HANDS',
            visibility: 'PUBLIC',
            ownerId,
            ...extra,
        },
    })
    return id
}

describe('Equipment API', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    it('returns empty equipment for new character', async () => {
        const { characterId, ownerId } = await seedCharacter()
        const res = await app.inject(
            createTestRequest('GET', `/api/v1/characters/${characterId}/equipment`, {
                auth: { role: 'USER', id: ownerId },
            })
        )
        const body = expectSuccessResponse(res as unknown as TestResponse)
        const data = body.data as Record<string, unknown>
        expect(data.characterId).toBe(characterId)
        expect([null, undefined, ''].includes(data.headId as any)).toBe(true)
    })

    it('equips valid head item', async () => {
        const { characterId, ownerId } = await seedCharacter('ADMIN')
        const headItem = await seedItem('HEAD', ownerId)
        const res = await app.inject(
            createTestRequest('PUT', `/api/v1/characters/${characterId}/equipment`, {
                auth: { role: 'ADMIN', id: ownerId },
                payload: { headId: headItem },
            })
        )
        const body = expectSuccessResponse(res as unknown as TestResponse)
        const data = body.data as Record<string, unknown>
        expect(data.headId).toBe(headItem)
    })

    it('rejects two-handed misuse in single hand slot', async () => {
        const { characterId, ownerId } = await seedCharacter('ADMIN')
        const twoHand = await seedItem('TWO_HANDS', ownerId)
        const res = await app.inject(
            createTestRequest('PUT', `/api/v1/characters/${characterId}/equipment`, {
                auth: { role: 'ADMIN', id: ownerId },
                payload: { rightHandId: twoHand },
            })
        )
        expectErrorResponse(res as unknown as TestResponse, HTTP_STATUS.BAD_REQUEST)
    })

    it('equips two-handed item into handsId', async () => {
        const { characterId, ownerId } = await seedCharacter('ADMIN')
        const twoHand = await seedItem('TWO_HANDS', ownerId)
        const res = await app.inject(
            createTestRequest('PUT', `/api/v1/characters/${characterId}/equipment`, {
                auth: { role: 'ADMIN', id: ownerId },
                payload: { handsId: twoHand },
            })
        )
        const body = expectSuccessResponse(res as unknown as TestResponse)
        const data = body.data as Record<string, unknown>
        expect(data.handsId).toBe(twoHand)
    })

    it('rejects single-handed item into handsId', async () => {
        const { characterId, ownerId } = await seedCharacter('ADMIN')
        const oneHand = await seedItem('ONE_HAND', ownerId)
        const res = await app.inject(
            createTestRequest('PUT', `/api/v1/characters/${characterId}/equipment`, {
                auth: { role: 'ADMIN', id: ownerId },
                payload: { handsId: oneHand },
            })
        )
        expectErrorResponse(res as unknown as TestResponse, HTTP_STATUS.BAD_REQUEST)
    })

    it('rejects duplicate item in both hands', async () => {
        const { characterId, ownerId } = await seedCharacter('ADMIN')
        const oneHand = await seedItem('ONE_HAND', ownerId)
        const res = await app.inject(
            createTestRequest('PUT', `/api/v1/characters/${characterId}/equipment`, {
                auth: { role: 'ADMIN', id: ownerId },
                payload: { rightHandId: oneHand, leftHandId: oneHand },
            })
        )
        expectErrorResponse(res as unknown as TestResponse, HTTP_STATUS.BAD_REQUEST)
    })

    it('returns stats (admin only)', async () => {
        const { characterId, ownerId } = await seedCharacter('ADMIN')
        const headItem = await seedItem('HEAD', ownerId)
        await app.inject(
            createTestRequest('PUT', `/api/v1/characters/${characterId}/equipment`, {
                auth: { role: 'ADMIN', id: ownerId },
                payload: { headId: headItem },
            })
        )
        const res = await app.inject(
            createTestRequest('GET', '/api/v1/equipment/stats', { auth: { role: 'ADMIN' } })
        )
        const body = expectSuccessResponse(res as unknown as TestResponse)
        const data = body.data as Record<string, unknown>
        expect((data.headSlotUsage as number) || 0).toBeGreaterThanOrEqual(1)
    })
})
