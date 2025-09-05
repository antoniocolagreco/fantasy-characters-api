import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '../../../src/app'
import type { ErrorResponse } from '../../../src/shared/schemas/error.schema'

describe('CORS Protection Tests', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('CORS Protection', () => {
        it('should handle CORS preflight requests', async () => {
            const response = await app.inject({
                method: 'OPTIONS',
                url: '/api/health',
                headers: {
                    origin: 'http://localhost:3000',
                    'access-control-request-method': 'GET',
                    'access-control-request-headers': 'content-type',
                },
            })

            expect(response.statusCode).toBe(204)
            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000')
        })

        it('should reject requests from unauthorized origins', async () => {
            const response = await app.inject({
                method: 'OPTIONS',
                url: '/api/health',
                headers: {
                    origin: 'http://malicious-site.com',
                },
            })

            expect(response.statusCode).toBe(403)
            const body: unknown = response.json()
            if (body && typeof body === 'object' && 'error' in body) {
                const errorResponse = body as ErrorResponse
                expect(errorResponse.error.message).toContain('origin not allowed')
            }
        })

        it('should allow requests without origin (non-browser tools)', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                // No origin header simulates non-browser tools
            })

            expect(response.statusCode).toBe(200)
        })

        it('should reject null origins', async () => {
            const response = await app.inject({
                method: 'OPTIONS',
                url: '/api/health',
                headers: {
                    origin: 'null',
                },
            })

            expect(response.statusCode).toBe(403)
            const body: { error: { message: string } } = response.json()
            expect(body.error.message).toContain('null origin not allowed')
        })

        it('should allow configured development origins', async () => {
            const response = await app.inject({
                method: 'OPTIONS',
                url: '/api/health',
                headers: {
                    origin: 'http://localhost:5173',
                    'access-control-request-method': 'GET',
                    'access-control-request-headers': 'content-type',
                },
            })

            expect(response.statusCode).toBe(204)
            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
        })
    })
})
