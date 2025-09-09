import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { HTTP_STATUS } from '@/tests/helpers/test.helper'

describe('Anonymous Access - Public Entities', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => await app.close())

    const publicEndpoints = [
        '/api/v1/images',
        '/api/v1/items',
        '/api/v1/tags',
        '/api/v1/skills',
        '/api/v1/perks',
        '/api/v1/races',
        '/api/v1/archetypes',
    ]

    it.each(publicEndpoints)(
        'should allow anonymous access to %s (list public entities)',
        async endpoint => {
            const response = await app.inject({
                method: 'GET',
                url: endpoint,
            })

            expect(response.statusCode).toBe(HTTP_STATUS.OK)
            expect(response.json()).toEqual({
                data: expect.any(Array),
                pagination: expect.objectContaining({
                    limit: expect.any(Number),
                    hasNext: expect.any(Boolean),
                    hasPrev: expect.any(Boolean),
                }),
                requestId: expect.any(String),
                timestamp: expect.any(String),
            })
        }
    )

    it('should allow anonymous access to health check', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        })

        expect(response.statusCode).toBe(HTTP_STATUS.OK)
        expect(response.json()).toEqual({
            status: 'ok',
            timestamp: expect.any(String),
            uptime: expect.any(Number),
        })
    })
})
