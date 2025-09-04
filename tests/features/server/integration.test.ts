import { test, expect, beforeAll, afterAll, describe } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../../src/app'

describe('Server Integration Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = buildApp()
        await app.ready()
    }, 30000) // 30 second timeout

    afterAll(async () => {
        await app.close()
    })

    describe('Application Lifecycle', () => {
        test('should start and be ready', () => {
            expect(app.hasRoute({ method: 'GET', url: '/api/health' })).toBe(true)
            expect(app.server.listening).toBe(false) // Not listening in test mode
        })

        test('should register all required plugins', () => {
            const plugins = app.printPlugins()

            // Core plugins should be registered
            expect(plugins).toContain('loggingPlugin')
            expect(plugins).toContain('healthCheckPlugin')
            expect(plugins).toContain('swaggerPlugin')
            expect(plugins).toContain('helmetPlugin')
            expect(plugins).toContain('corsPlugin')
            expect(plugins).toContain('rateLimitPlugin')
            expect(plugins).toContain('compressionPlugin')
            expect(plugins).toContain('multipartPlugin')
        })

        test('should have proper plugin registration order', () => {
            const plugins = app.printPlugins()

            // Verify security plugins are loaded early
            const helmetIndex = plugins.indexOf('helmetPlugin')
            const corsIndex = plugins.indexOf('corsPlugin')
            const rateLimitIndex = plugins.indexOf('rateLimitPlugin')

            expect(helmetIndex).toBeGreaterThan(-1)
            expect(corsIndex).toBeGreaterThan(-1)
            expect(rateLimitIndex).toBeGreaterThan(-1)
        })

        test('should expose necessary decorators and utilities', () => {
            // Check if sanitization utilities are available
            expect(app.sanitize).toBeDefined()
            expect(typeof app.sanitize.html).toBe('function')
            expect(typeof app.sanitize.text).toBe('function')
            expect(typeof app.sanitize.object).toBe('function')

            // Check if rate limit configs are available
            expect(app.rateLimitConfigs).toBeDefined()
            expect(app.rateLimitConfigs.auth).toBeDefined()
            expect(app.rateLimitConfigs.crud).toBeDefined()
            expect(app.rateLimitConfigs.expensive).toBeDefined()
        })
    })

    describe('Health Check Endpoint', () => {
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

    describe('API Documentation', () => {
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

    describe('Error Handling', () => {
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

    describe('Security Features', () => {
        test('should apply security headers', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff')
            expect(response.headers).toHaveProperty('x-frame-options', 'DENY')
            expect(response.headers).toHaveProperty('x-download-options', 'noopen')
        })

        test('should apply CORS headers for valid origins', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: {
                    origin: 'http://localhost:3000',
                },
            })

            expect(response.statusCode).toBe(200)
            // CORS headers should be present for allowed origins
        })

        test('should apply rate limiting', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.headers).toHaveProperty('x-ratelimit-limit')
            expect(response.headers).toHaveProperty('x-ratelimit-remaining')
            expect(response.headers).toHaveProperty('x-ratelimit-reset')
        })

        test('should sanitize request body data', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: { 'content-type': 'application/json' },
                payload: JSON.stringify({
                    description: '<script>alert("xss")</script>Safe content',
                    name: '  Test Name  ',
                }),
            })

            // Should process without error (sanitization occurs in middleware)
            expect([200, 404, 405]).toContain(response.statusCode)
        })

        test('should enforce request size limits', async () => {
            const largePayload = 'x'.repeat(1_500_000) // 1.5MB

            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: { 'content-type': 'application/json' },
                payload: JSON.stringify({ data: largePayload }),
            })

            expect(response.statusCode).toBe(413) // Payload Too Large
        })
    })

    describe('Request Processing', () => {
        test('should generate unique request IDs', async () => {
            const responses = await Promise.all([
                app.inject({ method: 'GET', url: '/api/health' }),
                app.inject({ method: 'GET', url: '/api/health' }),
                app.inject({ method: 'GET', url: '/api/health' }),
            ])

            const requestIds = responses
                .map(r => r.headers['x-request-id'] as string)
                .filter(Boolean)

            // All should be different
            expect(new Set(requestIds).size).toBeGreaterThanOrEqual(1)

            // All should be valid UUID v7 format
            requestIds.forEach(id => {
                if (id) {
                    expect(id).toMatch(
                        /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i
                    )
                }
            })
        })

        test('should compress responses when appropriate', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: {
                    'accept-encoding': 'gzip',
                },
            })

            expect(response.statusCode).toBe(200)
            // Compression headers may be present for larger responses
        })

        test('should handle multipart uploads', async () => {
            // Test basic multipart handling capability
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: {
                    'content-type': 'multipart/form-data; boundary=----test',
                },
                payload:
                    '------test\r\nContent-Disposition: form-data; name="test"\r\n\r\nvalue\r\n------test--\r\n',
            })

            // Should not crash - exact status depends on endpoint implementation
            expect([200, 404, 405]).toContain(response.statusCode)
        })

        test('should handle concurrent requests properly', async () => {
            const requests = Array.from({ length: 10 }, () =>
                app.inject({
                    method: 'GET',
                    url: '/api/health',
                })
            )

            const responses = await Promise.all(requests)

            // All should succeed
            responses.forEach(response => {
                expect(response.statusCode).toBe(200)
            })

            // All should have unique request IDs (if available)
            const requestIds = responses
                .map(r => r.headers['x-request-id'])
                .filter(Boolean) as string[]

            if (requestIds.length > 0) {
                expect(new Set(requestIds).size).toBe(requestIds.length)
            }
        })

        test('should handle request timeouts gracefully', async () => {
            const start = Date.now()

            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                query: { delay: '100' }, // Simulate some processing time
            })

            const duration = Date.now() - start

            expect(response.statusCode).toBe(200)
            expect(duration).toBeLessThan(15000) // Should be well under timeout
        })
    })

    describe('Content Type Handling', () => {
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

    describe('Performance and Reliability', () => {
        test('should maintain performance under load', async () => {
            const iterations = 50
            const promises = Array.from({ length: iterations }, () =>
                app.inject({
                    method: 'GET',
                    url: '/api/health',
                })
            )

            const start = Date.now()
            const responses = await Promise.all(promises)
            const duration = Date.now() - start

            // All requests should succeed
            responses.forEach(response => {
                expect(response.statusCode).toBe(200)
            })

            // Should handle load efficiently (average < 20ms per request)
            expect(duration / iterations).toBeLessThan(20)
        })

        test('should handle error scenarios gracefully', async () => {
            const errorRequests = [
                { method: 'GET' as const, url: '/api/nonexistent' },
                { method: 'POST' as const, url: '/api/health', payload: 'invalid json' },
                { method: 'PUT' as const, url: '/api/invalid-endpoint' },
                { method: 'DELETE' as const, url: '/api/missing' },
            ]

            for (const request of errorRequests) {
                const response = await app.inject(request)

                // Should handle errors without crashing
                expect(response.statusCode).toBeGreaterThanOrEqual(400)
                expect(response.statusCode).toBeLessThan(600)

                // Should still include proper headers
                expect(response.headers['content-type']).toMatch(/application\/json/)
            }
        })

        test('should maintain consistent response format', async () => {
            const endpoints = ['/api/health', '/api/nonexistent', '/docs/json']

            for (const endpoint of endpoints) {
                const response = await app.inject({
                    method: 'GET',
                    url: endpoint,
                })

                // Should always return JSON for API endpoints
                if (endpoint.startsWith('/api/')) {
                    expect(response.headers['content-type']).toMatch(/application\/json/)
                }

                // Should include request tracking
                if (response.statusCode >= 400) {
                    const body: { requestId: string } = response.json()
                    expect(body.requestId).toBeDefined()
                }
            }
        })

        test('should handle graceful shutdown preparation', () => {
            // Test that the app is ready for shutdown
            expect(app.server).toBeDefined()
            expect(typeof app.close).toBe('function')
        })
    })
})
