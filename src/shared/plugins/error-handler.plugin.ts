import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { AppError } from '../errors/app.error'
import type { ErrorDetail, ErrorResponse } from '../schemas'

/**
 * Global error handler plugin for Fastify
 * Handles both AppError instances and generic errors
 */
export function errorHandlerPlugin(fastify: FastifyInstance): void {
    // Handle 404 not found errors with consistent format
    fastify.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
        const requestId = request.id
        const timestamp = new Date().toISOString()

        const errorResponse: ErrorResponse = {
            error: {
                code: 'RESOURCE_NOT_FOUND',
                message: `Route ${request.method}:${request.url} not found`,
                status: 404,
                method: request.method,
                path: request.url,
            },
            requestId,
            timestamp,
        }

        request.log.warn({ error: errorResponse }, 'Route not found')
        return reply.status(404).send(errorResponse)
    })

    fastify.setErrorHandler(
        async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
            const requestId = request.id
            const timestamp = new Date().toISOString()

            // Handle validation errors
            if (error.validation) {
                const errorResponse: ErrorResponse = {
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Validation failed',
                        status: 400,
                        details: error.validation.map(issue => {
                            const detail: ErrorDetail = {
                                path: issue.instancePath || issue.schemaPath || '',
                            }
                            if (issue.instancePath?.split('/').pop()) {
                                const field = issue.instancePath.split('/').pop()
                                if (field) {
                                    detail.field = field
                                }
                            }
                            if (issue.message) {
                                detail.message = issue.message
                            }
                            return detail
                        }),
                        method: request.method,
                        path: request.url,
                    },
                    requestId,
                    timestamp,
                }

                request.log.warn({ error: errorResponse }, 'Validation error')
                return reply.status(400).send(errorResponse)
            }

            // Handle our custom AppError
            if (error instanceof AppError) {
                const errorResponse: ErrorResponse = {
                    error: {
                        code: error.code,
                        message: error.message,
                        status: error.status,
                        ...(error.details && { details: error.details }),
                        method: request.method,
                        path: request.url,
                    },
                    requestId,
                    timestamp,
                }

                // Log based on error severity
                if (error.status >= 500) {
                    request.log.error({ error: errorResponse }, 'Server error')
                } else {
                    request.log.warn({ error: errorResponse }, 'Client error')
                }

                return reply.status(error.status).send(errorResponse)
            }

            // Handle CORS errors specifically
            if (error.message?.startsWith('CORS:')) {
                const errorResponse: ErrorResponse = {
                    error: {
                        code: 'FORBIDDEN',
                        message: error.message,
                        status: 403,
                        method: request.method,
                        path: request.url,
                    },
                    requestId,
                    timestamp,
                }

                request.log.warn({ error: errorResponse }, 'CORS error')
                return reply.status(403).send(errorResponse)
            }

            // Handle Fastify errors
            if (error.statusCode) {
                const errorResponse: ErrorResponse = {
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: error.message || 'Internal server error',
                        status: error.statusCode,
                        method: request.method,
                        path: request.url,
                    },
                    requestId,
                    timestamp,
                }

                request.log.error({ error: errorResponse }, 'Fastify error')
                return reply.status(error.statusCode).send(errorResponse)
            }

            // Handle generic errors
            const errorResponse: ErrorResponse = {
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Internal server error',
                    status: 500,
                    method: request.method,
                    path: request.url,
                },
                requestId,
                timestamp,
            }

            request.log.error({ error: errorResponse, originalError: error }, 'Unknown error')
            return reply.status(500).send(errorResponse)
        }
    )
}
