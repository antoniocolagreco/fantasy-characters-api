import type { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { config } from '../../infrastructure/config'

/**
 * Swagger/OpenAPI documentation plugin
 */
export async function swaggerPlugin(fastify: FastifyInstance): Promise<void> {
    // Register Swagger schema generator
    await fastify.register(fastifySwagger, {
        openapi: {
            info: {
                title: 'Fantasy Characters API',
                description:
                    'A comprehensive API for managing fantasy characters, races, classes, and equipment',
                version: '1.0.0',
                contact: {
                    name: 'API Support',
                    email: 'support@fantasy-characters-api.com',
                },
                license: {
                    name: 'MIT',
                    url: 'https://opensource.org/licenses/MIT',
                },
            },
            servers: [
                {
                    url: `http://localhost:${config.PORT}`,
                    description: 'Development server',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'JWT token for authentication',
                    },
                },
            },
            security: [
                {
                    bearerAuth: [],
                },
            ],
            tags: [
                {
                    name: 'Health',
                    description: 'Health check endpoints',
                },
                {
                    name: 'Authentication',
                    description: 'User authentication and authorization',
                },
                {
                    name: 'Users',
                    description: 'User management operations',
                },
                {
                    name: 'Characters',
                    description: 'Character management operations',
                },
                {
                    name: 'Races',
                    description: 'Race management operations',
                },
                {
                    name: 'Archetypes',
                    description: 'Archetype management operations',
                },
                {
                    name: 'Items',
                    description: 'Item management operations',
                },
                {
                    name: 'Skills',
                    description: 'Skill management operations',
                },
                {
                    name: 'Perks',
                    description: 'Perk management operations',
                },
                {
                    name: 'Tags',
                    description: 'Tag management operations',
                },
                {
                    name: 'Images',
                    description: 'Image management operations',
                },
                {
                    name: 'Equipment',
                    description: 'Equipment management operations',
                },
            ],
        },
        hideUntagged: true,
    })

    // Register Swagger UI
    await fastify.register(fastifySwaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
            defaultModelsExpandDepth: 2,
            defaultModelExpandDepth: 2,
        },
        staticCSP: true,
        transformSpecificationClone: true,
    })

    // The /docs/json route is automatically registered by @fastify/swagger
}
