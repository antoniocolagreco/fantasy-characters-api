/**
 * Application error classes and error handling utilities
 * Following functional programming principles with error types
 */

import { FastifyReply, FastifyRequest } from 'fastify'

// Base error interface
export type AppError = {
  readonly name: string
  readonly message: string
  readonly statusCode: number
  readonly code?: string
  readonly details?: unknown
  readonly stack?: string
}

// Error creation functions (pure functions)
export const createValidationError = (message: string, details?: unknown): AppError => ({
  name: 'ValidationError',
  message,
  statusCode: 400,
  code: 'VALIDATION_ERROR',
  details,
})

export const createNotFoundError = (resource: string, id?: string): AppError => ({
  name: 'NotFoundError',
  message: id ? `${resource} with id ${id} not found` : `${resource} not found`,
  statusCode: 404,
  code: 'NOT_FOUND',
})

export const createUnauthorizedError = (message = 'Unauthorized'): AppError => ({
  name: 'UnauthorizedError',
  message,
  statusCode: 401,
  code: 'UNAUTHORIZED',
})

export const createForbiddenError = (message = 'Forbidden'): AppError => ({
  name: 'ForbiddenError',
  message,
  statusCode: 403,
  code: 'FORBIDDEN',
})

export const createConflictError = (message: string, details?: unknown): AppError => ({
  name: 'ConflictError',
  message,
  statusCode: 409,
  code: 'CONFLICT',
  details,
})

export const createInternalServerError = (
  message = 'Internal server error',
  details?: unknown,
): AppError => ({
  name: 'InternalServerError',
  message,
  statusCode: 500,
  code: 'INTERNAL_SERVER_ERROR',
  details,
})

export const createBadRequestError = (message: string, details?: unknown): AppError => ({
  name: 'BadRequestError',
  message,
  statusCode: 400,
  code: 'BAD_REQUEST',
  details,
})

export const createTooManyRequestsError = (message = 'Too many requests'): AppError => ({
  name: 'TooManyRequestsError',
  message,
  statusCode: 429,
  code: 'TOO_MANY_REQUESTS',
})

// Type guard to check if an error is an AppError
export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    'message' in error &&
    'statusCode' in error
  )
}

// Error response format
export type ErrorResponse = {
  readonly error: {
    readonly code: string
    readonly message: string
    readonly details?: unknown
    readonly timestamp: string
    readonly path: string
  }
}

// Create standardized error response
export const createErrorResponse = (error: AppError, path: string): ErrorResponse => ({
  error: {
    code: error.code || error.name.toUpperCase(),
    message: error.message,
    details: error.details,
    timestamp: new Date().toISOString(),
    path,
  },
})

// Global error handler for Fastify
export const errorHandler = async (
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  // Log the error
  request.log.error(
    {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
    },
    'Request error',
  )

  // Handle different error types
  if (isAppError(error)) {
    const errorResponse = createErrorResponse(error, request.url)
    await reply.status(error.statusCode).send(errorResponse)
    return
  }

  // Handle Fastify validation errors
  if (
    error.name === 'FastifyValidationError' ||
    error.name === 'ValidationError' ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).code === 'FST_ERR_VALIDATION'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validationError = createValidationError('Invalid request data', (error as any).validation)
    const errorResponse = createErrorResponse(validationError, request.url)
    await reply.status(400).send(errorResponse)
    return
  }

  // Handle other known error types
  if (error.name === 'SyntaxError') {
    const syntaxError = createBadRequestError('Invalid JSON syntax')
    const errorResponse = createErrorResponse(syntaxError, request.url)
    await reply.status(400).send(errorResponse)
    return
  }

  // Default to internal server error
  const internalError = createInternalServerError(
    'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? error.stack : undefined,
  )
  const errorResponse = createErrorResponse(internalError, request.url)
  await reply.status(500).send(errorResponse)
}

// Not found handler
export const notFoundHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const notFoundError = createNotFoundError('Route')
  const errorResponse = createErrorResponse(notFoundError, request.url)
  await reply.status(404).send(errorResponse)
}
