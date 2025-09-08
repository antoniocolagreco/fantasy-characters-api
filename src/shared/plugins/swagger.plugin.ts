import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import type { FastifyInstance, FastifySchema } from 'fastify'
import fp from 'fastify-plugin'

import { config } from '@/infrastructure/config'

/**
 * Swagger/OpenAPI documentation plugin
 */
export const swaggerPlugin = fp(
    async function (fastify: FastifyInstance): Promise<void> {
        // Register Swagger schema generator
        await fastify.register(fastifySwagger, {
            openapi: {
                info: {
                    title: 'Fantasy Characters API',
                    description:
                        'A comprehensive API for managing fantasy characters, races, classes, and equipment',
                    version: '1.0.0',
                    contact: {
                        name: 'Antonio Colagreco',
                        email: 'nevenbridge@gmail.com',
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
                    { name: 'Health', description: 'Health check endpoints' },
                    {
                        name: 'Authentication',
                        description: 'User authentication and authorization',
                    },
                    { name: 'Users', description: 'User management operations' },
                    { name: 'Characters', description: 'Character management operations' },
                    { name: 'Races', description: 'Race management operations' },
                    { name: 'Archetypes', description: 'Archetype management operations' },
                    { name: 'Items', description: 'Item management operations' },
                    { name: 'Skills', description: 'Skill management operations' },
                    { name: 'Perks', description: 'Perk management operations' },
                    { name: 'Tags', description: 'Tag management operations' },
                    { name: 'Images', description: 'Image management operations' },
                    { name: 'Equipment', description: 'Equipment management operations' },
                ],
            },
            hideUntagged: false, // Show all endpoints for debugging
            // Scrub non-OpenAPI keywords from route schemas when generating docs only
            transform: ({ schema, url }) => {
                // Remove JSON-Schema-only or tool-specific keys that OAS 3.x does not allow
                // Keep $ref intact. Strip everything else starting with "$"
                const EXPLICIT_STRIP = new Set([
                    'transform',
                    'examples',
                    'errorMessage',
                    'patternProperties',
                    'unevaluatedProperties',
                ])

                function shouldStripKey(key: string): boolean {
                    if (key === '$ref') return false
                    if (key.startsWith('$')) return true // strips $id, $schema, etc.
                    return EXPLICIT_STRIP.has(key)
                }

                function scrub(input: unknown): unknown {
                    if (Array.isArray(input)) return input.map(scrub)
                    if (input && typeof input === 'object') {
                        const out: Record<string, unknown> = {}
                        for (const [k, v] of Object.entries(input)) {
                            if (shouldStripKey(k)) continue
                            out[k] = scrub(v)
                        }
                        return out
                    }
                    return input
                }

                const cleanedSchema: FastifySchema = {
                    ...schema,
                    // Scrub known validation containers
                    body: scrub(schema.body),
                    params: scrub(schema.params),
                    querystring: scrub(schema.querystring),
                    headers: scrub(schema.headers),
                    response: scrub(schema.response),
                }
                return { schema: cleanedSchema, url }
            },
        })

        // Register Swagger UI
        await fastify.register(fastifySwaggerUi, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: true,
                defaultModelsExpandDepth: 2,
                defaultModelExpandDepth: 2,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                showMutatedRequest: false,
                persistAuthorization: true,
            },
            // Disable staticCSP to avoid double CSP with helmet in dev
            staticCSP: false,
            transformSpecificationClone: true,
            // As a final safety net, scrub non-OAS keywords from the built spec
            transformSpecification: (
                swaggerObject: Readonly<Record<string, unknown>>,
                _request,
                _reply
            ): Record<string, unknown> => {
                const EXPLICIT_STRIP = new Set([
                    'transform',
                    'examples',
                    'errorMessage',
                    'patternProperties',
                    'unevaluatedProperties',
                ])
                function shouldStripKey(key: string): boolean {
                    if (key === '$ref') return false
                    if (key.startsWith('$')) return true
                    return EXPLICIT_STRIP.has(key)
                }
                function scrub(input: unknown): unknown {
                    if (Array.isArray(input)) return input.map(scrub)
                    if (input && typeof input === 'object') {
                        const out: Record<string, unknown> = {}
                        for (const [k, v] of Object.entries(input)) {
                            if (shouldStripKey(k)) continue
                            out[k] = scrub(v)
                        }
                        return out
                    }
                    return input
                }
                return scrub(swaggerObject) as Record<string, unknown>
            },
        })

        // The /docs/json route is automatically registered by @fastify/swagger
        // As a final guard, scrub the JSON returned by docs endpoints so validators accept it
        fastify.addHook('onSend', async (request, reply, payload) => {
            try {
                if (request.method !== 'GET') return

                let json: unknown
                if (typeof payload === 'string') {
                    json = JSON.parse(payload)
                } else if (Buffer.isBuffer(payload)) {
                    json = JSON.parse(payload.toString('utf8'))
                } else if (payload && typeof payload === 'object') {
                    json = payload as unknown
                } else {
                    return
                }

                // Only scrub OpenAPI specs (avoid changing other JSON responses)
                if (!json || typeof json !== 'object') return
                const obj = json as Record<string, unknown>
                const isOpenApi =
                    (typeof obj.openapi === 'string' || typeof obj.swagger === 'string') &&
                    typeof obj.paths === 'object'
                if (!isOpenApi) return

                const EXPLICIT_STRIP = new Set([
                    'transform',
                    'examples',
                    'errorMessage',
                    'patternProperties',
                    'unevaluatedProperties',
                ])
                const shouldStripKey = (key: string) =>
                    key !== '$ref' && (key.startsWith('$') || EXPLICIT_STRIP.has(key))
                const scrub = (input: unknown): unknown => {
                    if (Array.isArray(input)) return input.map(scrub)
                    if (input && typeof input === 'object') {
                        const out: Record<string, unknown> = {}
                        for (const [k, v] of Object.entries(input)) {
                            if (shouldStripKey(k)) continue
                            out[k] = scrub(v)
                        }
                        return out
                    }
                    return input
                }

                const cleaned = scrub(json)
                const serialized = JSON.stringify(cleaned)
                reply.header('content-length', Buffer.byteLength(serialized))
                return serialized
            } catch {
                // In case of any error, fall back to the original payload
                return payload
            }
        })
    },
    { name: 'swaggerPlugin', encapsulate: false }
)
