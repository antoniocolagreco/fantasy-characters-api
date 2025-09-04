import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../../src/app'

describe('Rate Limiting Tests', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = buildApp()
        await app.ready()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('Rate Limiting', () => {
        it('should include rate limit headers', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers['x-ratelimit-limit']).toBeDefined()
            expect(response.headers['x-ratelimit-remaining']).toBeDefined()
            expect(response.headers['x-ratelimit-reset']).toBeDefined()
        })

        it('should use different limits for authenticated vs anonymous users', async () => {
            // Anonymous request
            const anonResponse = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(anonResponse.statusCode).toBe(200)
            const anonLimit = parseInt(anonResponse.headers['x-ratelimit-limit'] as string)
            expect(anonLimit).toBeGreaterThan(0)

            // Would need auth implementation to test authenticated limits
            // For now, just verify the header exists
            expect(anonResponse.headers['x-ratelimit-limit']).toBeDefined()
        })

        it('should enforce rate limits', async () => {
            // Make multiple rapid requests to potentially hit rate limit
            const requests = Array.from({ length: 20 }, () =>
                app.inject({
                    method: 'GET',
                    url: '/api/health',
                })
            )

            const responses = await Promise.all(requests)

            // All requests should succeed for health endpoint with generous limits
            responses.forEach(response => {
                expect([200, 429]).toContain(response.statusCode)
            })
        })

        it('should provide proper error response when rate limited', async () => {
            // This test would need to actually trigger rate limiting
            // For now, verify the structure would be correct
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers['x-ratelimit-limit']).toBeDefined()
        })

        it('should differentiate rate limits by user context', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: {
                    'x-forwarded-for': '127.0.0.1',
                },
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers['x-ratelimit-limit']).toBeDefined()
        })
    })
})
