import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError, ErrorCode } from '../types/errors.js'
import { createErrorResponse } from '../utils/response.js'
import { config } from '../config/environment.js'

export async function globalErrorHandler(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const isDevelopment = config.NODE_ENV === 'development'
    const requestId = request.id

    request.log.error(
        {
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
                stack: error.stack
            },
            url: request.url,
            method: request.method,
            requestId,
            userId: ((request as unknown as Record<string, unknown>).user as Record<string, unknown>)?.id as
                | string
                | undefined
        },
        'Request error occurred'
    )

    if (error instanceof AppError) {
        const response = createErrorResponse(
            error.code,
            error.message,
            isDevelopment ? error.details : undefined,
            request.url,
            requestId
        )
        return reply.code(error.statusCode).send(response)
    }

    if (error.validation) {
        const validationDetails = isDevelopment
            ? {
                  validation: error.validation,
                  validationContext: error.validationContext
              }
            : undefined

        const response = createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            'Validation failed',
            validationDetails,
            request.url,
            requestId
        )
        return reply.code(400).send(response)
    }

    switch (error.code) {
        case 'FST_ERR_NOT_FOUND': {
            const response = createErrorResponse(
                ErrorCode.NOT_FOUND,
                `Route ${request.method} ${request.url} not found`,
                undefined,
                request.url,
                requestId
            )
            return reply.code(404).send(response)
        }
        case 'FST_ERR_BAD_STATUS_CODE': {
            const response = createErrorResponse(
                ErrorCode.INTERNAL_ERROR,
                'Invalid status code',
                isDevelopment ? { originalError: error.message } : undefined,
                request.url,
                requestId
            )
            return reply.code(500).send(response)
        }
        case 'FST_ERR_CTP_INVALID_MEDIA_TYPE': {
            const response = createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid content type',
                isDevelopment ? { expectedType: 'application/json' } : undefined,
                request.url,
                requestId
            )
            return reply.code(400).send(response)
        }
        case 'FST_ERR_CTP_EMPTY_JSON_BODY': {
            const response = createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Request body cannot be empty',
                undefined,
                request.url,
                requestId
            )
            return reply.code(400).send(response)
        }
        case 'FST_ERR_CTP_INVALID_JSON_BODY': {
            const response = createErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                'Invalid JSON in request body',
                isDevelopment ? { originalError: error.message } : undefined,
                request.url,
                requestId
            )
            return reply.code(400).send(response)
        }
    }

    if (error.statusCode === 429) {
        const response = createErrorResponse(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            'Rate limit exceeded. Please try again later.',
            isDevelopment ? { retryAfter: reply.getHeader('retry-after') } : undefined,
            request.url,
            requestId
        )
        return reply.code(429).send(response)
    }

    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        const response = createErrorResponse(
            ErrorCode.INVALID_INPUT,
            error.message || 'Bad request',
            isDevelopment ? { originalError: error.message } : undefined,
            request.url,
            requestId
        )
        return reply.code(error.statusCode).send(response)
    }

    const response = createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        isDevelopment ? error.message : 'An internal server error occurred',
        isDevelopment
            ? {
                  originalError: error.message,
                  code: error.code
              }
            : undefined,
        request.url,
        requestId
    )

    // Add stack directly to error object in development mode
    if (isDevelopment && error.stack) {
        ;(response.error as Record<string, unknown>).stack = error.stack
    }
    return reply.code(500).send(response)
}

export async function notFoundHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const response = createErrorResponse(
        ErrorCode.NOT_FOUND,
        `Route ${request.method} ${request.url} not found`,
        undefined,
        request.url,
        request.id
    )
    return reply.code(404).send(response)
}
