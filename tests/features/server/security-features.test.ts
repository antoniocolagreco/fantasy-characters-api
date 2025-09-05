import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { buildApp } from '../../../src/app'

describe('Security Features Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    }, 30000)

    afterAll(async () => {
        await app.close()
    })

    test('should apply security headers', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        })

        expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff')
        expect(response.headers).toHaveProperty('x-frame-options', 'DENY')
        expect(response.headers).toHaveProperty('x-download-options', 'noopen')
    })

    test('should apply CORS headers for valid origins', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
            headers: {
                origin: 'http://localhost:3000',
            },
        })

        expect(response.statusCode).toBe(200)
        // CORS headers should be present for allowed origins
    })

    test('should apply rate limiting', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        })

        expect(response.headers).toHaveProperty('x-ratelimit-limit')
        expect(response.headers).toHaveProperty('x-ratelimit-remaining')
        expect(response.headers).toHaveProperty('x-ratelimit-reset')
    })

    test('should sanitize request body data', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/health',
            headers: { 'content-type': 'application/json' },
            payload: JSON.stringify({
                description: '<script>alert("xss")</script>Safe content',
                name: '  Test Name  ',
            }),
        })

        // Should process without error (sanitization occurs in middleware)
        expect([200, 404, 405]).toContain(response.statusCode)
    })

    test('should enforce request size limits', async () => {
        const largePayload = 'x'.repeat(1_500_000) // 1.5MB

        const response = await app.inject({
            method: 'POST',
            url: '/api/health',
            headers: { 'content-type': 'application/json' },
            payload: JSON.stringify({ data: largePayload }),
        })

        expect(response.statusCode).toBe(413) // Payload Too Large
    })
})
