// Placeholder basic test to ensure routes register; full suite added in later milestone tasks
import type { FastifyInstance } from 'fastify'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { buildApp } from '@/app'
import { HTTP_STATUS } from '@/shared/constants'

describe('Characters API - smoke', () => {
    let app: FastifyInstance
    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })
    afterAll(async () => {
        await app.close()
    })

    it('GET /characters returns 200 with paginated envelope', async () => {
        const res = await app.inject({ method: 'GET', url: '/api/v1/characters' })
        expect(res.statusCode).toBe(HTTP_STATUS.OK)
        const body = res.json()
        expect(body).toHaveProperty('data')
        expect(body).toHaveProperty('pagination')
    })
})
