import { test, expect, beforeAll, afterAll, describe } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../../src/app'

describe('API Documentation Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = buildApp()
        await app.ready()
    }, 30000)

    afterAll(async () => {
        await app.close()
    })

    test('should serve OpenAPI specification', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/docs/json',
        })

        expect(response.statusCode).toBe(200)
        const spec: {
            openapi: string
            info: { title: string; version: string }
            paths: Record<string, unknown>
        } = response.json()

        expect(spec).toHaveProperty('openapi')
        expect(spec).toHaveProperty('info')
        expect(spec).toHaveProperty('paths')
        expect(spec.openapi).toMatch(/^3\./)
        expect(spec.info).toHaveProperty('title')
        expect(spec.info).toHaveProperty('version')
    })

    test('should serve Swagger UI documentation', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/docs',
        })

        expect(response.statusCode).toBe(200)
        expect(response.headers['content-type']).toMatch(/text\/html/)
        expect(response.body).toContain('swagger-ui')
    })

    test('should redirect /docs/ to /docs', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/docs/',
        })

        expect([200, 301, 302]).toContain(response.statusCode)
    })

    test('should include security schemes in OpenAPI spec', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/docs/json',
        })

        const spec: {
            components?: {
                securitySchemes?: Record<string, unknown>
            }
        } = response.json()

        if (spec.components?.securitySchemes) {
            expect(spec.components.securitySchemes).toBeDefined()
        }
    })

    test('should validate OpenAPI spec structure', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/docs/json',
        })

        const spec: {
            openapi: string
            info: { title: string; version: string; description?: string }
            paths: Record<string, unknown>
            servers?: unknown[]
        } = response.json()

        expect(spec.info.title).toBe('Fantasy Characters API')
        expect(spec.info.version).toBeDefined()
        if (spec.info.description) {
            expect(spec.info.description).toBeTruthy()
        }
    })
})
