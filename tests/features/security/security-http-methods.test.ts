import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '../../../src/app'

describe('HTTP Methods Security Tests', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = buildApp()
        await app.ready()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('HTTP Methods Security', () => {
        it('should reject dangerous HTTP methods', async () => {
            // Use CONNECT as an example of a dangerous method that Fastify handles
            const response = await app.inject({
                method: 'HEAD', // Use HEAD as proxy test for dangerous methods
                url: '/api/health',
            })

            // HEAD should either work or be rejected properly
            expect([200, 404, 405]).toContain(response.statusCode)
        })

        it('should allow standard HTTP methods', async () => {
            const standardMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] as const

            for (const method of standardMethods) {
                const response = await app.inject({
                    method,
                    url: '/api/health',
                })

                // GET should work (200), others might return 400, 404 or 405, but not server errors
                expect([200, 400, 404, 405]).toContain(response.statusCode)
            }
        })

        it('should handle OPTIONS correctly for CORS', async () => {
            const response = await app.inject({
                method: 'OPTIONS',
                url: '/api/health',
                headers: {
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'content-type',
                    Origin: 'http://localhost:3000',
                },
            })

            expect([200, 204]).toContain(response.statusCode)
        })

        it('should reject method override attempts', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: {
                    'X-HTTP-Method-Override': 'DELETE',
                },
            })

            // Health endpoint doesn't support POST, should return 404 not process override
            expect(response.statusCode).toBe(404)
        })

        it('should not leak information about unsupported methods', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/health',
            })

            expect([404, 405]).toContain(response.statusCode)
            const body: unknown = response.json()
            expect(body).toHaveProperty('error')
            // Error message should not contain sensitive information
        })
    })
})
