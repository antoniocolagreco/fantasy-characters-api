import Fastify, { FastifyInstance } from 'fastify'
import helmet from '@fastify/helmet'
import sensible from '@fastify/sensible'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

import { config, logConfig, securityConfig, apiConfig } from './config/environment.js'
import { healthRoutes } from './routes/health.route.js'
import { initializeDatabase, closeDatabase } from './services/database.service.js'
import { globalErrorHandler, notFoundHandler } from './middleware/error-handler.js'

/**
 * Create and configure Fastify application instance
 */
export async function createApp(): Promise<FastifyInstance> {
    // Create Fastify instance with configuration
    const app = Fastify({
        logger: {
            level: logConfig.level,
            ...(logConfig.transport && { transport: logConfig.transport })
        },
        ignoreTrailingSlash: true,
        ignoreDuplicateSlashes: true,
        caseSensitive: false
    })

    try {
        // Initialize database connection
        initializeDatabase()
        app.log.info('Database initialized successfully')

        // Register security plugins
        await app.register(helmet, {
            contentSecurityPolicy: config.NODE_ENV === 'production' ? true : false
        })

        // Register sensible plugin for useful utilities
        await app.register(sensible)

        // Register rate limiting
        await app.register(rateLimit, {
            max: securityConfig.rateLimitMax,
            timeWindow: securityConfig.rateLimitTimeWindow,
            skipOnError: true // Don't count failed requests against the limit
        })

        // Register Swagger documentation
        await app.register(swagger, {
            openapi: {
                openapi: '3.0.0',
                info: {
                    title: 'Fantasy Character API',
                    description: 'A comprehensive RESTful API designed for managing fantasy characters',
                    version: '1.0.0',
                    contact: {
                        name: 'Fantasy Character API Team',
                        email: 'support@fantasy-character-api.com'
                    },
                    license: {
                        name: 'MIT',
                        url: 'https://opensource.org/licenses/MIT'
                    }
                },
                servers: [
                    {
                        url: `http://localhost:${config.PORT}${apiConfig.prefix}`,
                        description: 'Development server'
                    }
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT'
                        }
                    }
                },
                tags: [
                    { name: 'Health', description: 'Health check endpoints' },
                    { name: 'Auth', description: 'Authentication endpoints' },
                    { name: 'Users', description: 'User management endpoints' },
                    { name: 'Characters', description: 'Character management endpoints' },
                    { name: 'Races', description: 'Race management endpoints' },
                    { name: 'Archetypes', description: 'Archetype management endpoints' },
                    { name: 'Skills', description: 'Skill management endpoints' },
                    { name: 'Perks', description: 'Perk management endpoints' },
                    { name: 'Items', description: 'Item management endpoints' },
                    { name: 'Tags', description: 'Tag management endpoints' }
                ]
            }
        })

        // Register Swagger UI
        await app.register(swaggerUi, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: false
            },
            staticCSP: true,
            transformStaticCSP: (header: string) => header,
            transformSpecification: (swaggerObject: Record<string, unknown>) => {
                return swaggerObject
            },
            transformSpecificationClone: true
        })

        // Register API routes with prefix
        await app.register(
            async function (fastify) {
                await fastify.register(healthRoutes)
            },
            { prefix: apiConfig.prefix }
        )

        // Set custom error handlers
        app.setErrorHandler(globalErrorHandler)
        app.setNotFoundHandler(notFoundHandler)

        // Add graceful shutdown hook
        app.addHook('onClose', async () => {
            app.log.info('Closing database connection...')
            await closeDatabase()
        })

        return app
    } catch (error) {
        app.log.error('Failed to create application:', error)
        throw error
    }
}
