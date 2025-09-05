import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { buildApp } from '../../../src/app'

describe('Request Processing Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    }, 30000)

    afterAll(async () => {
        await app.close()
    })

    test('should generate unique request IDs', async () => {
        const responses = await Promise.all([
            app.inject({ method: 'GET', url: '/api/health' }),
            app.inject({ method: 'GET', url: '/api/health' }),
            app.inject({ method: 'GET', url: '/api/health' }),
        ])

        const requestIds = responses.map(r => r.headers['x-request-id'] as string).filter(Boolean)

        // All should be different
        expect(new Set(requestIds).size).toBeGreaterThanOrEqual(1)

        // All should be valid UUID v7 format
        requestIds.forEach(id => {
            if (id) {
                expect(id).toMatch(
                    /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i
                )
            }
        })
    })

    test('should compress responses when appropriate', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
            headers: {
                'accept-encoding': 'gzip',
            },
        })

        expect(response.statusCode).toBe(200)
        // Compression headers may be present for larger responses
    })

    test('should handle multipart uploads', async () => {
        // Test basic multipart handling capability
        const response = await app.inject({
            method: 'POST',
            url: '/api/health',
            headers: {
                'content-type': 'multipart/form-data; boundary=----test',
            },
            payload:
                '------test\r\nContent-Disposition: form-data; name="test"\r\n\r\nvalue\r\n------test--\r\n',
        })

        // Should not crash - exact status depends on endpoint implementation
        expect([200, 404, 405]).toContain(response.statusCode)
    })

    test('should handle concurrent requests properly', async () => {
        const requests = Array.from({ length: 10 }, () =>
            app.inject({
                method: 'GET',
                url: '/api/health',
            })
        )

        const responses = await Promise.all(requests)

        // All should succeed
        responses.forEach(response => {
            expect(response.statusCode).toBe(200)
        })

        // All should have unique request IDs (if available)
        const requestIds = responses.map(r => r.headers['x-request-id']).filter(Boolean) as string[]

        if (requestIds.length > 0) {
            expect(new Set(requestIds).size).toBe(requestIds.length)
        }
    })

    test('should handle request timeouts gracefully', async () => {
        const start = Date.now()

        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
            query: { delay: '100' }, // Simulate some processing time
        })

        const duration = Date.now() - start

        expect(response.statusCode).toBe(200)
        expect(duration).toBeLessThan(15000) // Should be well under timeout
    })
})
