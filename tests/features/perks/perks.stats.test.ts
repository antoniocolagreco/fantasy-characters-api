import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

// Focused stats endpoint tests (lightweight)

describe('Perks API v1 - Stats Endpoint (focused)', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it('allows ADMIN', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/perks/stats',
            headers: createAuthHeaders({ role: 'ADMIN' }),
        })
        expect(response.statusCode).toBe(200)
    })

    it('allows MODERATOR', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/perks/stats',
            headers: createAuthHeaders({ role: 'MODERATOR' }),
        })
        expect(response.statusCode).toBe(200)
    })

    it('denies USER', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/perks/stats',
            headers: createAuthHeaders({ role: 'USER' }),
        })
        expect(response.statusCode).toBe(403)
    })
})
