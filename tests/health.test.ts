import { FastifyInstance } from 'fastify'
import { createApp } from '../src/app'

describe('Health Check API', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await createApp()
    })

    afterAll(async () => {
        await app.close()
    })

    describe('GET /api/health', () => {
        test('should return 200 with health status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health'
            })

            expect(response.statusCode).toBe(200)

            const body = JSON.parse(response.body)
            expect(body).toHaveProperty('status', 'healthy')
            expect(body).toHaveProperty('timestamp')
            expect(body).toHaveProperty('version')
            expect(body).toHaveProperty('environment')
            expect(body).toHaveProperty('uptime')
            expect(body).toHaveProperty('memory')
            expect(body).toHaveProperty('system')

            // Validate memory object structure
            expect(body.memory).toHaveProperty('used')
            expect(body.memory).toHaveProperty('total')
            expect(body.memory).toHaveProperty('percentage')

            // Validate system object structure
            expect(body.system).toHaveProperty('platform')
            expect(body.system).toHaveProperty('nodeVersion')
            expect(body.system).toHaveProperty('pid')
        })

        test('should return valid timestamp format', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health'
            })

            const body = JSON.parse(response.body)
            const timestamp = new Date(body.timestamp)

            expect(timestamp).toBeInstanceOf(Date)
            expect(timestamp.getTime()).not.toBeNaN()
        })

        test('should return numeric values for uptime and memory', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health'
            })

            const body = JSON.parse(response.body)

            expect(typeof body.uptime).toBe('number')
            expect(body.uptime).toBeGreaterThanOrEqual(0)

            expect(typeof body.memory.used).toBe('number')
            expect(typeof body.memory.total).toBe('number')
            expect(typeof body.memory.percentage).toBe('number')

            expect(body.memory.used).toBeGreaterThan(0)
            expect(body.memory.total).toBeGreaterThan(0)
            expect(body.memory.percentage).toBeGreaterThanOrEqual(0)
            expect(body.memory.percentage).toBeLessThanOrEqual(100)
        })
    })

    describe('GET /api/health/ready', () => {
        test('should return 200 with ready status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health/ready'
            })

            expect(response.statusCode).toBe(200)

            const body = JSON.parse(response.body)
            expect(body).toHaveProperty('status', 'ready')
            expect(body).toHaveProperty('timestamp')
        })
    })

    describe('GET /api/health/live', () => {
        test('should return 200 with alive status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health/live'
            })

            expect(response.statusCode).toBe(200)

            const body = JSON.parse(response.body)
            expect(body).toHaveProperty('status', 'alive')
            expect(body).toHaveProperty('timestamp')
        })
    })

    describe('404 handling', () => {
        test('should return 404 for non-existent routes', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/non-existent'
            })

            expect(response.statusCode).toBe(404)

            const body = JSON.parse(response.body)
            expect(body).toHaveProperty('error')
            expect(body.error).toHaveProperty('code', 'NOT_FOUND')
            expect(body.error).toHaveProperty('message')
            expect(body.error).toHaveProperty('timestamp')
            expect(body.error).toHaveProperty('path', '/api/non-existent')
        })
    })
})
