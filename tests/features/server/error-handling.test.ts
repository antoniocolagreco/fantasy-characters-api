import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { buildApp } from '../../../src/app'

describe('Error Handling Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    }, 30000)

    afterAll(async () => {
        await app.close()
    })

    test('should handle 404 errors with proper format', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/nonexistent-endpoint',
        })

        expect(response.statusCode).toBe(404)
        const body: {
            error: { message: string; status: number }
            requestId: string
            timestamp: string
        } = response.json()

        expect(body).toHaveProperty('error')
        expect(body.error).toHaveProperty('message')
        expect(body.error).toHaveProperty('status', 404)
        expect(body).toHaveProperty('requestId')
        expect(body).toHaveProperty('timestamp')

        // Validate UUID v7 format for requestId
        expect(body.requestId).toMatch(
            /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i
        )
    })

    test('should handle malformed JSON requests', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/health',
            headers: { 'content-type': 'application/json' },
            payload: '{"invalid": json}',
        })

        expect(response.statusCode).toBe(400)
        const body: { error: { message: string } } = response.json()

        expect(body).toHaveProperty('error')
        expect(body.error).toHaveProperty('message')
        expect(body).toHaveProperty('requestId')
    })

    test('should handle request timeout', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        })

        // Should not timeout for health check
        expect(response.statusCode).toBe(200)
    })

    test('should provide structured error responses', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/invalid/deeply/nested/path',
        })

        expect(response.statusCode).toBe(404)
        const body: {
            error: { status: number }
            timestamp: string
            requestId: string
        } = response.json()

        expect(body.error.status).toBe(404)
        expect(body.timestamp).toBeDefined()
        expect(body.requestId).toMatch(/^[\da-f-]{36}$/)
    })

    test('should handle different HTTP methods for 404', async () => {
        const methods = ['GET', 'POST', 'PUT', 'DELETE'] as const

        for (const method of methods) {
            const response = await app.inject({
                method,
                url: '/api/nonexistent',
            })

            expect(response.statusCode).toBe(404)
            const body: { requestId: string } = response.json()
            expect(body.requestId).toBeDefined()
        }
    })
})
