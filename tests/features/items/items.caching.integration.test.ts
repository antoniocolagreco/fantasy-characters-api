import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { createTestItem, cleanupTestData } from '@/tests/helpers/data.helper'
import { createAuthHeaders, HTTP_STATUS } from '@/tests/helpers/test.helper'

describe('Items API - Caching', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it('returns Cache-Control and ETag for list; supports 304 with If-None-Match', async () => {
        await cleanupTestData()
        await createTestItem({ name: 'Item A' })
        await createTestItem({ name: 'Item B' })

        const first = await app.inject({
            method: 'GET',
            url: '/api/v1/items?limit=2',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ role: 'ADMIN' }),
            },
        })

        expect(first.statusCode).toBe(HTTP_STATUS.OK)
        const cc = first.headers['cache-control'] as string | undefined
        const etag = first.headers.etag as string | undefined
        expect(cc).toBeTruthy()
        expect(cc).toMatch(/public, max-age=30/)
        expect(etag).toBeTruthy()

        const second = await app.inject({
            method: 'GET',
            url: '/api/v1/items?limit=2',
            headers: {
                'content-type': 'application/json',
                'if-none-match': etag || '',
                ...createAuthHeaders({ role: 'ADMIN' }),
            },
        })

        // Expect 304 Not Modified when ETag matches
        expect(second.statusCode).toBe(304)
    })

    it('returns Cache-Control and ETag for getById; supports 304 with If-None-Match', async () => {
        await cleanupTestData()
        const item = await createTestItem({ name: 'Unique Item' })

        const first = await app.inject({
            method: 'GET',
            url: `/api/v1/items/${item.id}`,
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ role: 'ADMIN' }),
            },
        })
        expect(first.statusCode).toBe(HTTP_STATUS.OK)
        const cc = first.headers['cache-control'] as string | undefined
        const etag = first.headers.etag as string | undefined
        expect(cc).toBeTruthy()
        expect(cc).toMatch(/public, max-age=60/)
        expect(etag).toBeTruthy()

        const second = await app.inject({
            method: 'GET',
            url: `/api/v1/items/${item.id}`,
            headers: {
                'content-type': 'application/json',
                'if-none-match': etag || '',
                ...createAuthHeaders({ role: 'ADMIN' }),
            },
        })
        expect(second.statusCode).toBe(304)
    })

    it('sets Cache-Control: no-store for create, update, delete', async () => {
        await cleanupTestData()

        // Create
        const created = await app.inject({
            method: 'POST',
            url: '/api/v1/items',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ role: 'ADMIN' }),
            },
            payload: {
                name: 'Create Cached Item',
                visibility: 'PUBLIC',
                rarity: 'COMMON',
                slot: 'NONE',
            },
        })
        expect(created.statusCode).toBe(HTTP_STATUS.CREATED)
        expect((created.headers['cache-control'] as string | undefined) || '').toMatch(/no-store/)
        const newId = (created.json() as any).data.id as string
        expect(typeof newId).toBe('string')

        // Update
        const updated = await app.inject({
            method: 'PUT',
            url: `/api/v1/items/${newId}`,
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ role: 'ADMIN' }),
            },
            payload: { description: 'Updated' },
        })
        expect(updated.statusCode).toBe(HTTP_STATUS.OK)
        expect((updated.headers['cache-control'] as string | undefined) || '').toMatch(/no-store/)

        // Delete
        const deleted = await app.inject({
            method: 'DELETE',
            url: `/api/v1/items/${newId}`,
            headers: {
                // No content-type for DELETE without body
                ...createAuthHeaders({ role: 'ADMIN' }),
            },
        })
        expect(deleted.statusCode).toBe(HTTP_STATUS.NO_CONTENT)
        expect((deleted.headers['cache-control'] as string | undefined) || '').toMatch(/no-store/)
    })
})
