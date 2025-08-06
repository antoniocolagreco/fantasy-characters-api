import { FastifyInstance } from 'fastify'
import { createApp } from '../src/app.js'
import { closeDatabase, initializeDatabase } from '../src/services/database.service.js'

describe('Health Controller', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        await initializeDatabase()
        app = await createApp()
        await app.ready()
    })

    afterEach(async () => {
        if (app) {
            await app.close()
        }
        await closeDatabase()
    })

    describe('Health Check Endpoint', () => {
        it('should return health status with all required fields', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)

            expect(body.success).toBe(true)
            expect(body.data.status).toBe('healthy')
            expect(body.data.timestamp).toBeDefined()
            expect(body.data.uptime).toBeGreaterThan(0)
            expect(body.data.environment).toBeDefined()
            expect(body.data.version).toBeDefined()
            expect(body.data.memory).toBeDefined()
            expect(body.data.database).toBeDefined()
        })

        it('should return readiness status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health/ready'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)

            expect(body.success).toBe(true)
            expect(body.data.status).toBe('ready')
            expect(body.data.timestamp).toBeDefined()
        })

        it('should return liveness status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/health/live'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)

            expect(body.success).toBe(true)
            expect(body.data.status).toBe('alive')
            expect(body.data.timestamp).toBeDefined()
        })
    })
})
