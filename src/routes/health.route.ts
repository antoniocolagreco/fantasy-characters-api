import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { Type } from '@sinclair/typebox'
import { getHealth } from '../controllers/health.controller.js'
import { HealthCheckResponseSchema, ErrorResponseSchema, SuccessResponseSchema } from '../schemas/api.js'
import { createSuccessResponse, createErrorResponse } from '../utils/response.js'
import { ErrorCode } from '../types/errors.js'

export async function healthRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
    // Health check endpoint
    fastify.get('/health', {
        schema: {
            description: 'Get API health status',
            tags: ['Health'],
            summary: 'Health Check',
            response: {
                200: {
                    description: 'API is healthy',
                    ...SuccessResponseSchema(HealthCheckResponseSchema)
                },
                503: {
                    description: 'API is unhealthy',
                    ...ErrorResponseSchema
                }
            }
        },
        handler: getHealth
    })

    // Additional health endpoints for more detailed monitoring
    fastify.get('/health/ready', {
        schema: {
            description: 'Check if API is ready to serve requests',
            tags: ['Health'],
            summary: 'Readiness Check',
            response: {
                200: {
                    description: 'API is ready',
                    ...SuccessResponseSchema(
                        Type.Object({
                            status: Type.Literal('ready'),
                            timestamp: Type.String({ format: 'date-time' })
                        })
                    )
                },
                503: {
                    description: 'API is not ready',
                    ...ErrorResponseSchema
                }
            }
        },
        handler: async (request, reply) => {
            try {
                // In future chapters, we can add more sophisticated readiness checks
                // like database connectivity, external service availability, etc.
                const response = createSuccessResponse({
                    status: 'ready',
                    timestamp: new Date().toISOString()
                })
                reply.code(200).send(response)
            } catch (error) {
                request.log.error('Readiness check failed:', error)
                reply
                    .code(503)
                    .send(
                        createErrorResponse(
                            ErrorCode.SERVICE_UNAVAILABLE,
                            'API is not ready to serve requests',
                            undefined,
                            request.url,
                            request.id
                        )
                    )
            }
        }
    })

    fastify.get('/health/live', {
        schema: {
            description: 'Check if API is alive (basic liveness probe)',
            tags: ['Health'],
            summary: 'Liveness Check',
            response: {
                200: {
                    description: 'API is alive',
                    ...SuccessResponseSchema(
                        Type.Object({
                            status: Type.Literal('alive'),
                            timestamp: Type.String({ format: 'date-time' })
                        })
                    )
                }
            }
        },
        handler: async (_request, reply) => {
            // Simple liveness check - if we can respond, we're alive
            const response = createSuccessResponse({
                status: 'alive',
                timestamp: new Date().toISOString()
            })
            reply.code(200).send(response)
        }
    })
}
