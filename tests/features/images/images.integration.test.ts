import type { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'

describe('Image API Integration Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
    })

    it('should have image endpoints in OpenAPI spec', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/docs/json',
        })

        expect(response.statusCode).toBe(200)

        const openapi = response.json()
        expect(openapi.paths).toBeDefined()

        // Check that image endpoints are documented
        const paths = Object.keys(openapi.paths)
        const imageEndpoints = paths.filter(path => path.includes('/images'))

        expect(imageEndpoints).toContain('/api/v1/images')
        expect(imageEndpoints).toContain('/api/v1/images/{id}')
        expect(imageEndpoints).toContain('/api/v1/images/{id}/file')
        expect(imageEndpoints).toContain('/api/v1/images/stats')
    })

    it('should handle image endpoints appropriately without auth', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/images',
        })

        // Should either return 401 (if auth required) or 200 (if optional auth)
        expect([200, 401]).toContain(response.statusCode)
    })

    it('should have proper OpenAPI structure', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/docs/json',
        })

        const openapi = response.json()

        // Look for any image endpoints that exist
        const paths = Object.keys(openapi.paths || {})
        const imageEndpoints = paths.filter(path => path.includes('/images'))

        // We should have at least some image endpoints documented
        expect(imageEndpoints.length).toBeGreaterThan(0)

        // If we have image endpoints, check they have proper responses
        if (imageEndpoints.length > 0) {
            const firstImageEndpoint = imageEndpoints[0]

            if (firstImageEndpoint && openapi.paths) {
                const endpointMethods = openapi.paths[firstImageEndpoint]

                if (endpointMethods) {
                    const methodKeys = Object.keys(endpointMethods)

                    if (methodKeys.length > 0) {
                        const firstMethodKey = methodKeys[0]
                        if (firstMethodKey) {
                            const firstMethod = endpointMethods[firstMethodKey]
                            expect(firstMethod?.responses).toBeDefined()
                        }
                    }
                }
            }
        }
    })
})
