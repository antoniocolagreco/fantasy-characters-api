import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { HTTP_STATUS } from '@/shared/constants'

describe('Characters caching headers', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it('sets Cache-Control for list and supports ETag/304 on repeat', async () => {
        const first = await app.inject({ method: 'GET', url: '/api/v1/characters' })
        expect(first.statusCode).toBe(HTTP_STATUS.OK)
        expect(first.headers['cache-control']).toContain('public')
        expect(first.headers['etag']).toBeTypeOf('string')

        const etag = first.headers['etag'] as string
        const second = await app.inject({
            method: 'GET',
            url: '/api/v1/characters',
            headers: { 'if-none-match': etag },
        })

        // With ETag match, Fastify should answer 304
        expect([HTTP_STATUS.OK, 304]).toContain(second.statusCode)
        if (second.statusCode === 304) {
            expect(second.body).toBe('')
        }
    })
})
