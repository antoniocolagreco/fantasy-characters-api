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
            email: `admin-perk-${Date.now()}@test.dev`,
            passwordHash: 'x',
            role: 'ADMIN',
            isEmailVerified: true,
            isActive: true,
        },
    })
}

async function createPerk(ownerId: string) {
    return prisma.perk.create({
        data: {
            id: generateUUIDv7(),
            name: `Perk-${generateUUIDv7()}`,
            ownerId,
            requiredLevel: 0,
            visibility: 'PUBLIC',
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

async function attachPerkToItem(itemId: string, perkId: string) {
    return prisma.itemBonusPerk.create({
        data: { itemId, perkId },
    })
}

describe('Perk deletion conflict (409)', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    it('returns 409 when perk is referenced by item', async () => {
        const admin = await createAdmin()
        const perk = await createPerk(admin.id)
        const item = await createItem(admin.id)
        await attachPerkToItem(item.id, perk.id)
        const headers = createAuthHeaders({ id: admin.id, role: 'ADMIN', email: admin.email })

        const res = await app.inject({
            method: 'DELETE',
            url: `/api/v1/perks/${perk.id}`,
            headers,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.CONFLICT)
        expect(res.json().error.code).toBe('RESOURCE_IN_USE')
    })

    it('deletes perk when unused', async () => {
        const admin = await createAdmin()
        const perk = await createPerk(admin.id)
        const headers = createAuthHeaders({ id: admin.id, role: 'ADMIN', email: admin.email })
        const res = await app.inject({
            method: 'DELETE',
            url: `/api/v1/perks/${perk.id}`,
            headers,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.NO_CONTENT)
    })
})
