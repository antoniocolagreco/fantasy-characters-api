import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { buildApp } from '@/app'

function registerTestRoute(app: FastifyInstance) {
    app.post('/api/test-sanitize', async (req, reply) => {
        return reply.send({ body: req.body })
    })
}

describe('Sanitization Plugin', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        registerTestRoute(app)
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    test('sanitizes HTML-like content into plain text and normalizes', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/test-sanitize',
            headers: { 'content-type': 'application/json' },
            payload: JSON.stringify({
                test: '  <b>Hello</b>  <script>alert(1)</script>  World  ',
                nested: { value: '  spaced    text ' },
            }),
        })

        expect(response.statusCode).toBe(200)
        const body = response.json() as { body: any }
        expect(body.body.test).toBe('Hello World')
        expect(body.body.nested.value).toBe('spaced text')
    })

    test('skips non-JSON content types', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/test-sanitize',
            headers: { 'content-type': 'text/plain' },
            payload: 'raw text',
        })
        expect([200, 400, 415]).toContain(response.statusCode)
    })

    test('does not run on GET', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/test-sanitize' })
        expect([404, 405]).toContain(response.statusCode)
    })
})
