import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'
import { createTestItem, createTestUserInDb } from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

describe('Items API v1 - Read Operations', () => {
    let app: FastifyInstance
    let userId: string

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        process.env.RBAC_ENABLED = 'true'
        const user = await createTestUserInDb({ role: 'USER' })
        userId = user.id
        await createTestItem({ name: 'Public Item', visibility: 'PUBLIC' })
    })

    it('GET /api/v1/items lists items', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/items',
            headers: createAuthHeaders({ id: userId, role: 'USER' }),
        })
        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(Array.isArray(body.data)).toBe(true)
    })

    it('GET /api/v1/items/:id returns item', async () => {
        const item = await testPrisma.item.findFirst({ where: { name: 'Public Item' } })
        const res = await app.inject({
            method: 'GET',
            url: `/api/v1/items/${item?.id}`,
            headers: createAuthHeaders({ id: userId, role: 'USER' }),
        })
        expect(res.statusCode).toBe(200)
    })

    it('GET /api/v1/items/:id 404 for missing', async () => {
        const res = await app.inject({
            method: 'GET',
            url: `/api/v1/items/${generateUUIDv7()}`,
            headers: createAuthHeaders({ id: userId, role: 'USER' }),
        })
        expect(res.statusCode).toBe(404)
    })

    it('GET /api/v1/items/stats forbidden for user', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/items/stats',
            headers: createAuthHeaders({ id: userId, role: 'USER' }),
        })
        expect(res.statusCode).toBe(403)
    })
})
