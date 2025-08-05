import { createApp } from '../src/app.js'
import { closeDatabase } from '../src/services/database.service.js'
import { FastifyInstance } from 'fastify'

describe('App Integration Tests', () => {
    let app: FastifyInstance

    afterEach(async () => {
        if (app) {
            await app.close()
        }
        await closeDatabase()
    })

    test('should create app successfully', async () => {
        app = await createApp()
        expect(app).toBeDefined()
        expect(typeof app.listen).toBe('function')
    })

    test('should register health routes', async () => {
        app = await createApp()
        await app.ready()

        const response = await app.inject({
            method: 'GET',
            url: '/api/health'
        })

        expect(response.statusCode).toBe(200)
        const body = JSON.parse(response.body)
        expect(body.status).toBeDefined()
    })

    test('should return 404 for unknown routes', async () => {
        app = await createApp()
        await app.ready()

        const response = await app.inject({
            method: 'GET',
            url: '/unknown'
        })

        expect(response.statusCode).toBe(404)
        const body = JSON.parse(response.body)
        expect(body.error.code).toBe('NOT_FOUND')
        expect(body.error.message).toContain('not found')
        expect(body.error.path).toBe('/unknown')
    })

    test('should handle server ready state', async () => {
        app = await createApp()
        await app.ready()
        expect(app.server.listening).toBe(false) // Not listening until listen() is called
    })

    test('should support different HTTP methods', async () => {
        app = await createApp()
        await app.ready()

        // Test POST request to non-existent endpoint
        const postResponse = await app.inject({
            method: 'POST',
            url: '/api/unknown'
        })
        expect(postResponse.statusCode).toBe(404)

        // Test PUT request to non-existent endpoint
        const putResponse = await app.inject({
            method: 'PUT',
            url: '/api/unknown'
        })
        expect(putResponse.statusCode).toBe(404)
    })

    test('should handle global errors in development mode', async () => {
        // Mock the config to return development mode
        const configModule = await import('../src/config/environment.js')
        const originalConfig = configModule.config

        // Create a new config object with development mode
        const developmentConfig = { ...originalConfig, NODE_ENV: 'development' }
        ;(configModule as any).config = developmentConfig

        try {
            app = await createApp()

            // Add a route that throws an error
            app.get('/test-error', async () => {
                throw new Error('Test error')
            })

            await app.ready()

            const response = await app.inject({
                method: 'GET',
                url: '/test-error'
            })

            expect(response.statusCode).toBe(500)
            const body = JSON.parse(response.body)
            expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
            expect(body.error.message).toBe('Test error')
            expect(body.error.stack).toBeDefined() // Stack should be included in development
        } finally {
            // Restore original config
            ;(configModule as any).config = originalConfig
        }
    })

    test('should handle global errors in production mode', async () => {
        // Mock the config to return production mode
        const configModule = await import('../src/config/environment.js')
        const originalConfig = configModule.config

        // Create a new config object with production mode
        const productionConfig = { ...originalConfig, NODE_ENV: 'production' }
        ;(configModule as any).config = productionConfig

        try {
            app = await createApp()

            // Add a route that throws an error
            app.get('/test-error', async () => {
                throw new Error('Test error')
            })

            await app.ready()

            const response = await app.inject({
                method: 'GET',
                url: '/test-error'
            })

            expect(response.statusCode).toBe(500)
            const body = JSON.parse(response.body)
            expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
            expect(body.error.message).toBe('An internal server error occurred') // Generic message in production
            expect(body.error.stack).toBeUndefined() // Stack should not be included in production
        } finally {
            // Restore original config
            ;(configModule as any).config = originalConfig
        }
    })

    test('should handle graceful shutdown with onClose hook', async () => {
        app = await createApp()
        await app.ready()

        // Mock closeDatabase to verify it's called
        const originalClose = closeDatabase
        const mockClose = jest.fn().mockResolvedValue(undefined)

        // Replace the closeDatabase function temporarily
        const databaseService = await import('../src/services/database.service.js')
        ;(databaseService as any).closeDatabase = mockClose

        // Trigger the onClose hook by closing the app
        await app.close()

        // Verify closeDatabase was called
        expect(mockClose).toHaveBeenCalled()

        // Restore original function
        ;(databaseService as any).closeDatabase = originalClose

        // Mark app as closed to prevent double-close in afterEach
        app = null as any
    })

    test('should register swagger documentation routes', async () => {
        app = await createApp()
        await app.ready()

        const response = await app.inject({
            method: 'GET',
            url: '/docs'
        })

        // Should either be 200 (docs loaded) or 302 (redirect to docs)
        expect([200, 302]).toContain(response.statusCode)
    })
})
