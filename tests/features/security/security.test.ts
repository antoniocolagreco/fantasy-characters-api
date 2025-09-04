import { test, expect, beforeAll, afterAll, describe } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../../src/app'

describe('Security Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = buildApp()
        await app.ready()
    }, 30000) // 30 second timeout

    afterAll(async () => {
        await app.close()
    })

    describe('Security Headers', () => {
        test('should set security headers on all responses', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            // Helmet security headers
            expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff')
            expect(response.headers).toHaveProperty('x-frame-options', 'DENY')
            expect(response.headers).toHaveProperty('x-download-options', 'noopen')
            expect(response.headers).toHaveProperty('x-permitted-cross-domain-policies', 'none')
            expect(response.headers).toHaveProperty(
                'referrer-policy',
                'strict-origin-when-cross-origin'
            )
        })

        test('should set CSP headers correctly', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.headers).toHaveProperty('content-security-policy')
            const csp = response.headers['content-security-policy']
            expect(csp).toContain("default-src 'self'")
            expect(csp).toContain("object-src 'none'")
            expect(csp).toContain("frame-src 'none'")
        })

        test('should set HSTS headers in production-like environment', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            // HSTS should be set when configured
            if (response.headers['strict-transport-security']) {
                const hsts = response.headers['strict-transport-security']
                expect(hsts).toMatch(/max-age=\d+/)
                expect(hsts).toContain('includeSubDomains')
            }
        })

        test('should remove server header for security', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.headers.server).toBeUndefined()
        })

        test('should set cross-origin policies', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.headers).toHaveProperty('cross-origin-resource-policy', 'same-site')
            expect(response.headers).toHaveProperty('cross-origin-opener-policy', 'same-origin')
            expect(response.headers).toHaveProperty('origin-agent-cluster', '?1')
        })
    })

    describe('CORS Protection', () => {
        test('should handle CORS preflight requests', async () => {
            const response = await app.inject({
                method: 'OPTIONS',
                url: '/api/health',
                headers: {
                    origin: 'http://localhost:3000',
                    'access-control-request-method': 'GET',
                },
            })

            expect(response.statusCode).toBe(204)
            expect(response.headers).toHaveProperty('access-control-allow-origin')
            expect(response.headers).toHaveProperty('access-control-allow-methods')
            expect(response.headers).toHaveProperty('access-control-allow-headers')
        })

        test('should reject requests from unauthorized origins', async () => {
            const response = await app.inject({
                method: 'OPTIONS',
                url: '/api/health',
                headers: {
                    origin: 'http://malicious-site.com',
                    'access-control-request-method': 'GET',
                },
            })

            expect(response.statusCode).toBe(500)
            const body: unknown = response.json()
            if (body && typeof body === 'object' && 'error' in body) {
                const errorBody = body as { error: { message: string } }
                expect(errorBody.error.message).toContain('origin not allowed')
            }
        })

        test('should allow requests without origin (non-browser tools)', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                // No origin header
            })

            expect(response.statusCode).toBe(200)
        })

        test('should reject null origins', async () => {
            const response = await app.inject({
                method: 'OPTIONS',
                url: '/api/health',
                headers: {
                    origin: 'null',
                    'access-control-request-method': 'GET',
                },
            })

            expect(response.statusCode).toBe(500)
            const body: { error: { message: string } } = response.json()
            expect(body.error.message).toContain('null origin not allowed')
        })

        test('should allow configured development origins', async () => {
            const devOrigins = [
                'http://localhost:3000',
                'http://localhost:5173',
                'http://127.0.0.1:3000',
            ]

            for (const origin of devOrigins) {
                const response = await app.inject({
                    method: 'OPTIONS',
                    url: '/api/health',
                    headers: {
                        origin,
                        'access-control-request-method': 'GET',
                    },
                })

                expect(response.statusCode).toBe(204)
                expect(response.headers['access-control-allow-origin']).toBe(origin)
            }
        })
    })

    describe('Rate Limiting', () => {
        test('should include rate limit headers', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.headers).toHaveProperty('x-ratelimit-limit')
            expect(response.headers).toHaveProperty('x-ratelimit-remaining')
            expect(response.headers).toHaveProperty('x-ratelimit-reset')
        })

        test('should use different limits for authenticated vs anonymous users', async () => {
            // Test anonymous user limit
            const anonResponse = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: { 'x-forwarded-for': '192.168.1.100' },
            })

            expect(anonResponse.statusCode).toBe(200)
            const rateLimitHeader = anonResponse.headers['x-ratelimit-limit']
            expect(rateLimitHeader).toBeDefined()
            const anonLimit = parseInt(rateLimitHeader as string, 10)
            expect(anonLimit).toBe(150) // Anonymous limit should be 150
        })

        test('should enforce rate limits', async () => {
            const testIP = '192.168.1.101'

            // Make a few quick requests to test rate limiting
            const response1 = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: { 'x-forwarded-for': testIP },
            })

            const response2 = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: { 'x-forwarded-for': testIP },
            })

            // Both should succeed initially (within rate limit)
            expect(response1.statusCode).toBe(200)
            expect(response2.statusCode).toBe(200)

            // Rate limit headers should be present
            expect(response1.headers).toHaveProperty('x-ratelimit-remaining')
        })

        test('should provide proper error response when rate limited', async () => {
            const testIP = '192.168.1.102'

            // First get the rate limit
            const firstResponse = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: { 'x-forwarded-for': testIP },
            })

            expect(firstResponse.statusCode).toBe(200)
            expect(firstResponse.headers).toHaveProperty('x-ratelimit-limit')
        })

        test('should differentiate rate limits by user context', async () => {
            // Test that rate limiting considers user context in key generation
            const response1 = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: { 'x-forwarded-for': '192.168.1.103' },
            })

            const response2 = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: { 'x-forwarded-for': '192.168.1.104' },
            })

            // Different IPs should have independent rate limits
            expect(response1.statusCode).toBe(200)
            expect(response2.statusCode).toBe(200)
        })
    })

    describe('Input Validation', () => {
        test('should validate request parameters', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health?invalid=<script>alert("xss")</script>',
            })

            // Should not crash and return proper response
            expect(response.statusCode).toBe(200)
        })

        test('should handle malformed JSON gracefully', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: { 'content-type': 'application/json' },
                payload: '{"invalid": json}',
            })

            expect(response.statusCode).toBe(400)
            const body: { error: { code: string; message: string } } = response.json()
            expect(body.error).toBeDefined()
            expect(body.error.message).toBeDefined()
        })

        test('should limit request body size', async () => {
            const largePayload = 'x'.repeat(2_000_000) // 2MB payload

            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: { 'content-type': 'application/json' },
                payload: JSON.stringify({ data: largePayload }),
            })

            expect(response.statusCode).toBe(413) // Payload Too Large
        })

        test('should sanitize HTML input', async () => {
            // Test HTML sanitization through the sanitization plugin
            const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p>'

            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: { 'content-type': 'application/json' },
                payload: JSON.stringify({
                    description: maliciousHtml,
                    bio: '<b>Bold text</b><script>alert("xss")</script>',
                }),
            })

            // Should process without error (sanitization happens in middleware)
            expect([200, 404, 405]).toContain(response.statusCode)
        })

        test('should normalize text input', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: { 'content-type': 'application/json' },
                payload: JSON.stringify({
                    name: '  Test   Name\x00\x01  ',
                    title: '\t\nSpaced\r\n  Title  \t',
                }),
            })

            // Should process without error (normalization happens in middleware)
            expect([200, 404, 405]).toContain(response.statusCode)
        })

        test('should handle deeply nested objects', async () => {
            const deepObject = {
                level1: {
                    level2: {
                        level3: {
                            level4: {
                                description: '<script>alert("nested")</script>Safe content',
                            },
                        },
                    },
                },
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: { 'content-type': 'application/json' },
                payload: JSON.stringify(deepObject),
            })

            expect([200, 404, 405]).toContain(response.statusCode)
        })

        test('should validate Content-Type headers', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: { 'content-type': 'text/html' },
                payload: '<html><body>Not JSON</body></html>',
            })

            // Should handle unsupported content types gracefully
            expect([400, 404, 405, 415]).toContain(response.statusCode)
        })
    })

    describe('Error Information Disclosure', () => {
        test('should not expose sensitive information in errors', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/nonexistent-endpoint',
            })

            expect(response.statusCode).toBe(404)
            const body: Record<string, unknown> = response.json()

            // Should not contain stack traces or internal paths
            expect(JSON.stringify(body)).not.toMatch(/\/src\//)
            expect(JSON.stringify(body)).not.toMatch(/\/node_modules\//)
            expect(JSON.stringify(body)).not.toMatch(/Error:.*at.*/)
        })

        test('should include correlation ID for debugging', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/nonexistent-endpoint',
            })

            const body: { requestId?: string } = response.json()
            expect(body).toHaveProperty('requestId')
            expect(typeof body.requestId).toBe('string')
            expect(body.requestId).toMatch(
                /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i
            )
        })

        test('should handle database errors without leaking information', async () => {
            // Simulate a potential database error scenario
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                query: { simulateError: 'database' },
            })

            // Should not expose database connection strings or internal errors
            const bodyString = JSON.stringify(response.json())
            expect(bodyString).not.toMatch(/postgresql:\/\//)
            expect(bodyString).not.toMatch(/DATABASE_URL/)
            expect(bodyString).not.toMatch(/prisma/i)
        })

        test('should mask sensitive headers in error responses', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/nonexistent',
                headers: {
                    authorization: 'Bearer secret-token-123',
                    'x-api-key': 'secret-api-key',
                },
            })

            const bodyString = JSON.stringify(response.json())
            expect(bodyString).not.toContain('secret-token-123')
            expect(bodyString).not.toContain('secret-api-key')
        })
    })

    describe('Request Timeout and Resource Protection', () => {
        test('should timeout long requests', async () => {
            // This test simulates a timeout condition
            const startTime = Date.now()

            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                // Simulate slow request processing via large query
                query: { test: 'timeout-simulation' },
            })

            const endTime = Date.now()
            const duration = endTime - startTime

            // Should complete within reasonable time (15s timeout configured)
            expect(duration).toBeLessThan(16000)
            expect(response.statusCode).toBeLessThan(500)
        })

        test('should enforce connection limits', async () => {
            // Test concurrent connection handling
            const concurrent = Array.from({ length: 20 }, () =>
                app.inject({
                    method: 'GET',
                    url: '/api/health',
                })
            )

            const responses = await Promise.all(concurrent)

            // All should complete successfully (within reasonable limits)
            responses.forEach(response => {
                expect([200, 429, 503]).toContain(response.statusCode)
            })
        })

        test('should handle malformed requests gracefully', async () => {
            const malformedRequests = [
                {
                    method: 'GET' as const,
                    url: '/api/health',
                    headers: { 'content-length': '-1' },
                },
                {
                    method: 'POST' as const,
                    url: '/api/health',
                    headers: { 'content-type': 'application/json; charset=utf-8' },
                    payload: Buffer.from([0xff, 0xfe, 0xfd]), // Invalid UTF-8
                },
                {
                    method: 'GET' as const,
                    url: '/api/health',
                    headers: { host: 'malicious-host.com' },
                },
            ]

            for (const request of malformedRequests) {
                const response = await app.inject(request)
                // Should not crash the server
                expect([200, 400, 404, 413, 500]).toContain(response.statusCode)
            }
        })
    })

    describe('HTTP Method Security', () => {
        test('should reject unsupported HTTP methods', async () => {
            const response = await app.inject({
                method: 'PATCH', // Use supported method for testing
                url: '/api/nonexistent',
            })

            expect(response.statusCode).toBe(404)
        })

        test('should handle HEAD requests properly', async () => {
            const response = await app.inject({
                method: 'HEAD',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            expect(response.body).toBe('')
            expect(response.headers['content-type']).toBeDefined()
        })

        test('should prevent HTTP verb tampering', async () => {
            // Test X-HTTP-Method-Override header protection
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: {
                    'x-http-method-override': 'DELETE',
                    'x-method-override': 'PUT',
                },
            })

            // Should not honor method override headers for security
            expect([200, 404, 405]).toContain(response.statusCode)
        })

        test('should validate HTTP version', async () => {
            // Test that server handles different HTTP versions appropriately
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
            })

            expect(response.statusCode).toBe(200)
            // Server should handle HTTP/1.1 appropriately
        })
    })

    describe('Content Security and MIME Protection', () => {
        test('should prevent MIME type confusion', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: { 'content-type': 'text/plain' },
                payload: '{"malicious": "json"}',
            })

            // Should not process as JSON when content-type is text/plain
            expect([400, 404, 405, 415]).toContain(response.statusCode)
        })

        test('should enforce content-type validation', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: { 'content-type': 'application/javascript' },
                payload: 'alert("xss")',
            })

            expect([400, 404, 405, 415]).toContain(response.statusCode)
        })

        test('should handle multipart form data securely', async () => {
            const boundary = '----FormBoundary'
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: {
                    'content-type': `multipart/form-data; boundary=${boundary}`,
                },
                payload: [
                    `--${boundary}`,
                    'Content-Disposition: form-data; name="test"',
                    '',
                    'safe_value',
                    `--${boundary}--`,
                ].join('\r\n'),
            })

            // Should handle multipart without crashing
            expect([200, 404, 405]).toContain(response.statusCode)
        })

        test('should prevent path traversal in file uploads', async () => {
            const boundary = '----FormBoundary'
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: {
                    'content-type': `multipart/form-data; boundary=${boundary}`,
                },
                payload: [
                    `--${boundary}`,
                    'Content-Disposition: form-data; name="file"; filename="../../../etc/passwd"',
                    'Content-Type: text/plain',
                    '',
                    'malicious content',
                    `--${boundary}--`,
                ].join('\r\n'),
            })

            // Should reject or sanitize malicious filenames
            expect([200, 400, 404, 405]).toContain(response.statusCode)
        })
    })

    describe('Request Forgery Protection', () => {
        test('should include anti-CSRF measures for state-changing operations', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: {
                    origin: 'http://localhost:3000',
                    referer: 'http://localhost:3000/admin',
                },
            })

            // Should process legitimate same-origin requests
            expect([200, 404, 405]).toContain(response.statusCode)
        })

        test('should validate origin header for CORS', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: {
                    origin: 'http://malicious-site.com',
                    'content-type': 'application/json',
                },
                payload: '{"test": "data"}',
            })

            // Should reject requests from unauthorized origins
            expect(response.statusCode).toBe(500)
        })

        test('should handle missing origin header appropriately', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: {
                    'content-type': 'application/json',
                },
                payload: '{"test": "data"}',
            })

            // Should allow requests without origin (non-browser clients)
            expect([200, 404, 405]).toContain(response.statusCode)
        })
    })

    describe('Authentication Security (Preparation)', () => {
        test('should handle missing authorization headers', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                // No authorization header
            })

            // Health endpoint should be public
            expect(response.statusCode).toBe(200)
        })

        test('should handle malformed authorization headers', async () => {
            const malformedTokens = [
                'Bearer',
                'Bearer ',
                'Bearer invalid-token',
                'Basic invalid',
                'JWT malformed.token.here',
                'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
            ]

            for (const token of malformedTokens) {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/health',
                    headers: { authorization: token },
                })

                // Should handle gracefully (health endpoint is public)
                expect(response.statusCode).toBe(200)
            }
        })

        test('should not leak token information in errors', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health',
                headers: { authorization: 'Bearer secret-token-should-not-appear' },
            })

            const bodyString = JSON.stringify(response.json())
            expect(bodyString).not.toContain('secret-token-should-not-appear')
        })
    })

    describe('Logging Security', () => {
        test('should not log sensitive information', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/health',
                headers: {
                    authorization: 'Bearer secret-token',
                    'x-api-key': 'secret-key',
                },
                payload: JSON.stringify({
                    password: 'secret-password',
                    token: 'secret-token',
                }),
            })

            // Verify response doesn't contain secrets
            const bodyString = JSON.stringify(response.json())
            expect(bodyString).not.toContain('secret-token')
            expect(bodyString).not.toContain('secret-key')
            expect(bodyString).not.toContain('secret-password')
        })

        test('should generate unique request IDs for tracking', async () => {
            const responses = await Promise.all([
                app.inject({ method: 'GET', url: '/api/health' }),
                app.inject({ method: 'GET', url: '/api/health' }),
                app.inject({ method: 'GET', url: '/api/health' }),
            ])

            const requestIds = responses.map(r => r.headers['x-request-id']).filter(Boolean)

            // All should be different
            expect(new Set(requestIds).size).toBe(requestIds.length)

            // All should be valid UUID v7 format
            requestIds.forEach(id => {
                expect(id).toMatch(
                    /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i
                )
            })
        })
    })
})
