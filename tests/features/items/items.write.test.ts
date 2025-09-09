import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import prismaService from '@/infrastructure/database/prisma.service'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'
import { createTestItem, createTestUserInDb } from '@/tests/helpers/data.helper'

describe('Items API v1 - Write Operations', () => {
    let app: FastifyInstance
    let ownerId: string

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        process.env.RBAC_ENABLED = 'true'
        const owner = await createTestUserInDb({ role: 'USER' })
        ownerId = owner.id
    })

    it('POST /api/v1/items creates item', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/api/v1/items',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: ownerId, role: 'USER' }),
            },
            payload: { name: 'Create Item' },
        })
        expect(res.statusCode).toBe(201)
        const body = res.json()
        expect(body.data.name).toBe('Create Item')
    })

    it('PUT /api/v1/items/:id updates item (owner)', async () => {
        const created = await createTestItem({ name: 'Update Item', ownerId })
        const res = await app.inject({
            method: 'PUT',
            url: `/api/v1/items/${created.id}`,
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: ownerId, role: 'USER' }),
            },
            payload: { name: 'Updated Item' },
        })
        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(body.data.name).toBe('Updated Item')
    })

    it('PUT /api/v1/items/:id duplicate name returns 409', async () => {
        const a = await createTestItem({ name: 'DupA', ownerId })
        const b = await createTestItem({ name: 'DupB', ownerId })
        const res = await app.inject({
            method: 'PUT',
            url: `/api/v1/items/${b.id}`,
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: ownerId, role: 'USER' }),
            },
            payload: { name: a.name },
        })
        expect(res.statusCode).toBe(409)
    })

    it('DELETE /api/v1/items/:id deletes item', async () => {
        const created = await createTestItem({ name: 'ToDelete', ownerId })
        const res = await app.inject({
            method: 'DELETE',
            url: `/api/v1/items/${created.id}`,
            headers: createAuthHeaders({ id: ownerId, role: 'USER' }),
        })
        expect(res.statusCode).toBe(204)
        const missing = await prismaService.item.findUnique({ where: { id: created.id } })
        expect(missing).toBeNull()
    })
})
