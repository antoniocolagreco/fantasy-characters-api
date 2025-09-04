import { test, expect, beforeAll, afterAll, describe } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../../src/app'

describe('Health Check Endpoint Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = buildApp()
        await app.ready()
    }, 30000)

    afterAll(async () => {
        await app.close()
    })

    test('should respond to health check requests', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        })

        expect(response.statusCode).toBe(200)
        const body: {
            status: string
            timestamp: string
            uptime: number
            version: string
            environment: string
        } = response.json()

        expect(body).toHaveProperty('status', 'healthy')
        expect(body).toHaveProperty('timestamp')
        expect(body).toHaveProperty('uptime')
        expect(body).toHaveProperty('version')
        expect(body).toHaveProperty('environment')

        expect(typeof body.timestamp).toBe('string')
        expect(typeof body.uptime).toBe('number')
        expect(body.uptime).toBeGreaterThanOrEqual(0)
    })

    test('should include proper response headers', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        })

        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.statusCode).toBe(200)
    })

    test('should respond quickly to health checks', async () => {
        const start = Date.now()
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        })
        const end = Date.now()

        expect(response.statusCode).toBe(200)
        expect(end - start).toBeLessThan(100) // Should respond within 100ms
    })

    test('should handle concurrent health check requests', async () => {
        const concurrent = Array.from({ length: 10 }, () =>
            app.inject({
                method: 'GET',
                url: '/api/health',
            })
        )

        const responses = await Promise.all(concurrent)

        responses.forEach(response => {
            expect(response.statusCode).toBe(200)
        })
    })
})
