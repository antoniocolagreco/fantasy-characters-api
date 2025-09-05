import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { buildApp } from '../../../src/app'

describe('Performance and Reliability Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    }, 30000)

    afterAll(async () => {
        await app.close()
    })

    test('should maintain performance under load', async () => {
        const iterations = 50
        const promises = Array.from({ length: iterations }, () =>
            app.inject({
                method: 'GET',
                url: '/api/health',
            })
        )

        const start = Date.now()
        const responses = await Promise.all(promises)
        const duration = Date.now() - start

        // All requests should succeed
        responses.forEach(response => {
            expect(response.statusCode).toBe(200)
        })

        // Should handle load efficiently (average < 20ms per request)
        expect(duration / iterations).toBeLessThan(20)
    })

    test('should handle error scenarios gracefully', async () => {
        const errorRequests = [
            { method: 'GET' as const, url: '/api/nonexistent' },
            { method: 'POST' as const, url: '/api/health', payload: 'invalid json' },
            { method: 'PUT' as const, url: '/api/invalid-endpoint' },
            { method: 'DELETE' as const, url: '/api/missing' },
        ]

        for (const request of errorRequests) {
            const response = await app.inject(request)

            // Should handle errors without crashing
            expect(response.statusCode).toBeGreaterThanOrEqual(400)
            expect(response.statusCode).toBeLessThan(600)

            // Should still include proper headers
            expect(response.headers['content-type']).toMatch(/application\/json/)
        }
    })

    test('should maintain consistent response format', async () => {
        const endpoints = ['/api/health', '/api/nonexistent', '/docs/json']

        for (const endpoint of endpoints) {
            const response = await app.inject({
                method: 'GET',
                url: endpoint,
            })

            // Should always return JSON for API endpoints
            if (endpoint.startsWith('/api/')) {
                expect(response.headers['content-type']).toMatch(/application\/json/)
            }

            // Should include request tracking
            if (response.statusCode >= 400) {
                const body: { requestId: string } = response.json()
                expect(body.requestId).toBeDefined()
            }
        }
    })
})
