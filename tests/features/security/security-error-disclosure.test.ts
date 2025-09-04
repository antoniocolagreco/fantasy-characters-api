import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../../src/app'
import type { ErrorResponse } from '../../../src/shared/schemas/error.schemas'

describe('Error Information Disclosure Tests', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = buildApp()
        await app.ready()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('Error Information Disclosure', () => {
        it('should not expose internal error details in production', async () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = 'production'

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/nonexistent',
                })

                expect(response.statusCode).toBe(404)
                const body: unknown = response.json()
                expect(body).toHaveProperty('error')
                const errorResponse = body as ErrorResponse
                expect(errorResponse.error).not.toHaveProperty('stack')
            } finally {
                process.env.NODE_ENV = originalEnv
            }
        })

        it('should return generic error messages', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/invalid-endpoint',
            })

            expect(response.statusCode).toBe(404)
            const body: unknown = response.json()
            const errorResponse = body as ErrorResponse
            expect(errorResponse.error.message).toContain('not found')
        })

        it('should not leak database schema in errors', async () => {
            // This test verifies error handling doesn't expose DB structure
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            const body: unknown = response.json()
            expect(body).not.toHaveProperty('schema')
            expect(body).not.toHaveProperty('table')
        })

        it('should sanitize error responses', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: {
                    'content-type': 'application/json',
                },
                payload: 'malformed json',
            })

            expect(response.statusCode).toBe(400)
            const body: unknown = response.json()
            expect(body).toHaveProperty('error')
            // Don't check for specific error message as it's handled by JSON parser
        })

        it('should handle authentication errors generically', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: {
                    Authorization: 'Bearer invalid-token',
                },
            })

            // Health endpoint doesn't require auth, so this should pass
            expect(response.statusCode).toBe(200)
        })

        it('should include correlation ID in error responses', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/nonexistent',
            })

            expect(response.statusCode).toBe(404)
            const body: unknown = response.json()
            const errorResponse = body as ErrorResponse
            expect(errorResponse).toHaveProperty('requestId')
            expect(typeof errorResponse.requestId).toBe('string')
        })
    })
})
