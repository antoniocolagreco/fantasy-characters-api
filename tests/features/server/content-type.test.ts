import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { buildApp } from '@/app'

describe('Content Type Handling Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    }, 30000)

    afterAll(async () => {
        await app.close()
    })

    test('should handle JSON requests', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/health',
            headers: { 'content-type': 'application/json' },
            payload: JSON.stringify({ test: 'data' }),
        })

        // Should parse JSON without crashing
        expect([200, 404, 405]).toContain(response.statusCode)
    })

    test('should handle form data requests', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/health',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            payload: 'key=value&test=data',
        })

        // Should parse form data without crashing
        expect([200, 404, 405]).toContain(response.statusCode)
    })

    test('should return JSON responses', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        })

        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(() => {
            response.json()
            return true
        }).not.toThrow()
    })

    test('should handle empty request bodies', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/health',
            headers: { 'content-type': 'application/json' },
            payload: '',
        })

        expect([200, 400, 404, 405]).toContain(response.statusCode)
    })

    test('should handle unsupported content types', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/health',
            headers: { 'content-type': 'application/xml' },
            payload: '<test>data</test>',
        })

        expect([200, 400, 404, 405, 415]).toContain(response.statusCode)
    })

    test('should handle missing content-type header', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/health',
            payload: 'raw data',
        })

        expect([200, 400, 404, 405]).toContain(response.statusCode)
    })
})
