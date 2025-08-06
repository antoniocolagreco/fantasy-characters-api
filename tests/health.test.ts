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
            expect(body).toHaveProperty('success', true)
            expect(body).toHaveProperty('data')
            expect(body.data).toHaveProperty('status', 'healthy')
            expect(body.data).toHaveProperty('timestamp')
            expect(body.data).toHaveProperty('version')
            expect(body.data).toHaveProperty('environment')
            expect(body.data).toHaveProperty('uptime')
            expect(body.data).toHaveProperty('memory')
            expect(body.data).toHaveProperty('system')
            expect(body.data).toHaveProperty('database')
            expect(body.data.memory).toHaveProperty('used')
            expect(body.data.memory).toHaveProperty('total')
            expect(body.data.memory).toHaveProperty('percentage')

            // Validate system object structure
            expect(body.data.system).toHaveProperty('platform')
            expect(body.data.system).toHaveProperty('nodeVersion')
            expect(body.data.system).toHaveProperty('pid')
        })

        test('should return valid timestamp format', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health'
            })

            const body = JSON.parse(response.body)
            const timestamp = new Date(body.data.timestamp)

            expect(timestamp).toBeInstanceOf(Date)
            expect(timestamp.getTime()).not.toBeNaN()
        })

        test('should return numeric values for uptime and memory', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health'
            })

            const body = JSON.parse(response.body)

            expect(typeof body.data.uptime).toBe('number')
            expect(body.data.uptime).toBeGreaterThanOrEqual(0)

            expect(typeof body.data.memory.used).toBe('number')
            expect(typeof body.data.memory.total).toBe('number')
            expect(typeof body.data.memory.percentage).toBe('number')

            expect(body.data.memory.used).toBeGreaterThan(0)
            expect(body.data.memory.total).toBeGreaterThan(0)
            expect(body.data.memory.percentage).toBeGreaterThanOrEqual(0)
            expect(body.data.memory.percentage).toBeLessThanOrEqual(100)
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
            expect(body).toHaveProperty('success', true)
            expect(body).toHaveProperty('data')
            expect(body.data).toHaveProperty('status', 'ready')
            expect(body.data).toHaveProperty('timestamp')
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
            expect(body).toHaveProperty('success', true)
            expect(body).toHaveProperty('data')
            expect(body.data).toHaveProperty('status', 'alive')
            expect(body.data).toHaveProperty('timestamp')
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
