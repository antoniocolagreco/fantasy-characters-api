import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'

describe('Security Headers Tests', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('Security Headers', () => {
        it('should set security headers on all responses', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers['x-content-type-options']).toBe('nosniff')
            expect(response.headers['x-frame-options']).toBe('DENY')
            expect(response.headers['x-download-options']).toBe('noopen')
            expect(response.headers['x-permitted-cross-domain-policies']).toBe('none')
            expect(response.headers['strict-transport-security']).toBeDefined()
        })

        it('should set CSP headers correctly', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers['content-security-policy']).toContain("default-src 'self'")
        })

        it('should set HSTS headers in production-like environment', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers['strict-transport-security']).toContain('max-age=')
        })

        it('should remove server header for security', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers.server).toBeUndefined()
        })

        it('should set cross-origin policies', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers['cross-origin-resource-policy']).toBe('same-site')
        })
    })
})
