import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '../../../src/app'

describe('Content Security Tests', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = buildApp()
        await app.ready()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('Content Security', () => {
        it('should include Content Security Policy headers', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers).toHaveProperty('content-security-policy')
        })

        it('should prevent XSS in responses', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.stringify(response.json())
            expect(body).not.toContain('<script>')
            expect(body).not.toContain('javascript:')
        })

        it('should validate content types properly', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: {
                    'content-type': 'text/html',
                },
                payload: '<html><body>test</body></html>',
            })

            // Health endpoint doesn't accept POST, but server should handle content-type
            expect(response.statusCode).toBe(404)
        })

        it('should handle JSONP callback sanitization', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health?callback=<script>alert("xss")</script>',
            })

            expect(response.statusCode).toBe(200)
            const responseText = response.body
            expect(responseText).not.toContain('<script>')
        })

        it('should prevent content injection in error messages', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health/<script>alert("xss")</script>',
            })

            expect([200, 404]).toContain(response.statusCode)
            const body = JSON.stringify(response.json())
            expect(body).not.toContain('<script>')
        })

        it('should properly encode response data', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers['content-type']).toContain('application/json')

            // Should be valid JSON
            expect(() => {
                response.json()
                return true
            }).not.toThrow()
        })
    })
})
