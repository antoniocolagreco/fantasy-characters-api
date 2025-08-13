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

// Error creation functions that create proper Error instances
export const createValidationError = (message: string, details?: unknown): Error => {
  const error = new Error(message)
  error.name = 'ValidationError'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).statusCode = 400
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).code = 'VALIDATION_ERROR'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).details = details
  return error
}

export const createNotFoundError = (resource: string, id?: string): Error => {
  const message = id ? `${resource} with id ${id} not found` : `${resource} not found`
  const error = new Error(message)
  error.name = 'NotFoundError'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).statusCode = 404
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).code = 'NOT_FOUND'
  return error
}

export const createUnauthorizedError = (message = 'Unauthorized'): Error => {
  const error = new Error(message)
  error.name = 'UnauthorizedError'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).statusCode = 401
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).code = 'UNAUTHORIZED'
  return error
}

export const createForbiddenError = (message = 'Forbidden'): Error => {
  const error = new Error(message)
  error.name = 'ForbiddenError'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).statusCode = 403
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).code = 'FORBIDDEN'
  return error
}

export const createConflictError = (message: string, details?: unknown): Error => {
  const error = new Error(message)
  error.name = 'ConflictError'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).statusCode = 409
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).code = 'CONFLICT'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).details = details
  return error
}

export const createInternalServerError = (
  message = 'Internal server error',
  details?: unknown,
): Error => {
  const error = new Error(message)
  error.name = 'InternalServerError'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).statusCode = 500
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).code = 'INTERNAL_SERVER_ERROR'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).details = details
  return error
}

export const createBadRequestError = (message: string, details?: unknown): Error => {
  const error = new Error(message)
  error.name = 'BadRequestError'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).statusCode = 400
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).code = 'BAD_REQUEST'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).details = details
  return error
}

export const createTooManyRequestsError = (message = 'Too many requests'): Error => {
  const error = new Error(message)
  error.name = 'TooManyRequestsError'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).statusCode = 429
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(error as any).code = 'TOO_MANY_REQUESTS'
  return error
}

// Type guard to check if an error is an AppError (now a proper Error with statusCode)
export const isAppError = (error: unknown): error is Error & { statusCode: number } => {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as Error & { statusCode?: unknown }).statusCode === 'number'
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
export const createErrorResponse = (
  error: Error & { statusCode: number; code?: string; details?: unknown },
  path: string,
): ErrorResponse => ({
  error: {
    code: (error as Error & { code?: string }).code || error.name.toUpperCase(),
    message: error.message,
    details: (error as Error & { details?: unknown }).details,
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
  request.log.error(error, 'Request error')

  // Handle different error types
  if (isAppError(error)) {
    // Create a simple error response that Fastify can serialize properly
    const errorResponse = {
      message: error.message,
      statusCode: error.statusCode,
      error: getHttpErrorName(error.statusCode),
    }
    reply.status(error.statusCode)
    return reply.send(errorResponse)
  }

  // Handle Fastify validation errors
  if (
    error.name === 'FastifyValidationError' ||
    error.name === 'ValidationError' ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).code === 'FST_ERR_VALIDATION'
  ) {
    const errorResponse = {
      message: error.message,
      statusCode: 400,
      error: 'Bad Request',
    }
    reply.status(400)
    return reply.send(errorResponse)
  }

  // Handle other known error types
  if (error.name === 'SyntaxError') {
    const errorResponse = {
      message: 'Invalid JSON syntax',
      statusCode: 400,
      error: 'Bad Request',
    }
    reply.status(400)
    return reply.send(errorResponse)
  }

  // Default to internal server error
  const errorResponse = {
    message: 'Internal server error',
    statusCode: 500,
    error: 'Internal Server Error',
  }
  reply.status(500)
  return reply.send(errorResponse)
}

// Helper function to get HTTP error name from status code
const getHttpErrorName = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return 'Bad Request'
    case 401:
      return 'Unauthorized'
    case 403:
      return 'Forbidden'
    case 404:
      return 'Not Found'
    case 409:
      return 'Conflict'
    case 429:
      return 'Too Many Requests'
    case 500:
      return 'Internal Server Error'
    default:
      return 'Error'
  }
}

// Not found handler
export const notFoundHandler = async (
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const errorResponse = {
    message: 'Route not found',
    statusCode: 404,
    error: 'Not Found',
  }
  reply.status(404)
  return reply.send(errorResponse)
}
