import fastify from 'fastify'
import { getHealth } from '../src/controllers/health.controller.js'
import * as databaseService from '../src/services/database.service.js'

// Mock Jest
const mockFn = (implementation?: any) => {
    const mock = implementation || (() => {})
    mock.mockResolvedValue = (value: any) => {
        mock._resolvedValue = value
        return mock
    }
    mock.mockRejectedValue = (value: any) => {
        mock._rejectedValue = value
        return mock
    }
    return mock
}

const jest = {
    spyOn: (obj: any, method: string) => {
        const original = obj[method]
        const mock = mockFn((...args: any[]) => {
            if (mock._rejectedValue) {
                return Promise.reject(mock._rejectedValue)
            }
            if (mock._resolvedValue !== undefined) {
                return Promise.resolve(mock._resolvedValue)
            }
            return original.apply(obj, args)
        })
        obj[method] = mock
        return mock
    }
}

describe('Health Controller Edge Cases', () => {
    let app: ReturnType<typeof fastify>

    beforeEach(async () => {
        app = fastify({ logger: false })
        app.get('/api/health', getHealth)
        await app.ready()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('Unhealthy Database Scenarios', () => {
        test('should return 503 when database health check fails', async () => {
            // Mock database service to return unhealthy status
            jest.spyOn(databaseService, 'checkDatabaseHealth').mockResolvedValue({
                status: 'unhealthy',
                message: 'Database connection failed'
            })

            jest.spyOn(databaseService, 'checkMigrationStatus').mockResolvedValue({
                applied: 0,
                pending: 1
            })

            const response = await app.inject({
                method: 'GET',
                url: '/api/health'
            })

            expect(response.statusCode).toBe(503)
            const body = JSON.parse(response.body)
            expect(body.status).toBe('unhealthy')
            expect(body.database.status).toBe('unhealthy')
            expect(body.database.message).toBe('Database connection failed')
        })

        test('should return 503 when database health check throws error', async () => {
            // Mock database service to throw an error
            jest.spyOn(databaseService, 'checkDatabaseHealth').mockRejectedValue(new Error('Database timeout'))

            jest.spyOn(databaseService, 'checkMigrationStatus').mockResolvedValue({
                applied: 0,
                pending: 0
            })

            const response = await app.inject({
                method: 'GET',
                url: '/api/health'
            })

            expect(response.statusCode).toBe(503)
            const body = JSON.parse(response.body)
            expect(body.error).toBeDefined()
            expect(body.error.code).toBe('HEALTH_CHECK_FAILED')
            expect(body.error.message).toBe('Health check failed')
        })
    })
})
