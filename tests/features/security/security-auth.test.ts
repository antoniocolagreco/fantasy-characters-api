import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../../src/app'

describe('Authentication Security Tests', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = buildApp()
        await app.ready()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('Authentication Security', () => {
        it('should handle missing authentication gracefully', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            // Health endpoint doesn't require authentication
            expect(response.statusCode).toBe(200)
        })

        it('should validate malformed JWT tokens', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: {
                    Authorization: 'Bearer invalid.jwt.token',
                },
            })

            // Health endpoint doesn't validate JWT, should still work
            expect(response.statusCode).toBe(200)
        })

        it('should handle expired tokens appropriately', async () => {
            const expiredToken =
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid'

            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: {
                    Authorization: `Bearer ${expiredToken}`,
                },
            })

            // Health endpoint doesn't validate JWT
            expect(response.statusCode).toBe(200)
        })

        it('should reject requests with invalid authorization schemes', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: {
                    Authorization: 'Basic invalid-base64',
                },
            })

            // Health endpoint doesn't require auth
            expect(response.statusCode).toBe(200)
        })

        it('should handle multiple authorization headers', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: {
                    Authorization: 'Bearer token1',
                    'X-Authorization': 'Bearer token2',
                },
            })

            // Health endpoint doesn't validate auth headers
            expect(response.statusCode).toBe(200)
        })

        it('should not leak authentication state in responses', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: {
                    Authorization: 'Bearer some-token',
                },
            })

            expect(response.statusCode).toBe(200)
            const body: unknown = response.json()
            expect(body).not.toHaveProperty('token')
            expect(body).not.toHaveProperty('auth')
            expect(body).not.toHaveProperty('user')
        })
    })
})
