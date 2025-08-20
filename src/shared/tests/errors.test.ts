import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createConflictError,
  createInternalServerError,
  createBadRequestError,
  createTooManyRequestsError,
  isAppError,
  createErrorResponse,
  errorHandler,
  notFoundHandler,
} from '@/shared/errors'

// Mock Fastify objects
const createMockRequest = (overrides: Partial<FastifyRequest> = {}): FastifyRequest =>
  ({
    log: {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
      child: vi.fn(),
      level: 'info',
    },
    url: '/test',
    ...overrides,
  }) as unknown as FastifyRequest

const createMockReply = (): FastifyReply => {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
  return reply as unknown as FastifyReply
}

describe('Error Functions', () => {
  describe('createValidationError', () => {
    it('should create validation error with message and details', () => {
      const details = { field: 'email', value: 'invalid' }
      const error = createValidationError('Invalid email format', details) as Error & {
        statusCode: number
        code: string
        details: unknown
      }

      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Invalid email format')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual(details)
    })

    it('should create validation error without details', () => {
      const error = createValidationError('Required field missing') as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Required field missing')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('createNotFoundError', () => {
    it('should create not found error with resource and id', () => {
      const error = createNotFoundError('User', 'abc-123') as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('NotFoundError')
      expect(error.message).toBe('User with id abc-123 not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
    })

    it('should create not found error with only resource', () => {
      const error = createNotFoundError('Image') as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('NotFoundError')
      expect(error.message).toBe('Image not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
    })
  })

  describe('createUnauthorizedError', () => {
    it('should create unauthorized error with default message', () => {
      const error = createUnauthorizedError() as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('UnauthorizedError')
      expect(error.message).toBe('Unauthorized')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
    })

    it('should create unauthorized error with custom message', () => {
      const error = createUnauthorizedError('Invalid token') as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('UnauthorizedError')
      expect(error.message).toBe('Invalid token')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('createForbiddenError', () => {
    it('should create forbidden error with default message', () => {
      const error = createForbiddenError() as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('ForbiddenError')
      expect(error.message).toBe('Forbidden')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('FORBIDDEN')
    })

    it('should create forbidden error with custom message', () => {
      const error = createForbiddenError('Access denied') as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('ForbiddenError')
      expect(error.message).toBe('Access denied')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('FORBIDDEN')
    })
  })

  describe('createConflictError', () => {
    it('should create conflict error with message and details', () => {
      const details = { field: 'email', value: 'test@example.com' }
      const error = createConflictError('Email already exists', details) as Error & {
        statusCode: number
        code: string
        details: unknown
      }

      expect(error.name).toBe('ConflictError')
      expect(error.message).toBe('Email already exists')
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT')
      expect(error.details).toEqual(details)
    })

    it('should create conflict error without details', () => {
      const error = createConflictError('Resource already exists') as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('ConflictError')
      expect(error.message).toBe('Resource already exists')
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT')
    })
  })

  describe('createInternalServerError', () => {
    it('should create internal server error with default message', () => {
      const error = createInternalServerError() as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('InternalServerError')
      expect(error.message).toBe('Internal server error')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
    })

    it('should create internal server error with custom message and details', () => {
      const details = { operation: 'database_query', table: 'users' }
      const error = createInternalServerError('Database connection failed', details) as Error & {
        statusCode: number
        code: string
        details: unknown
      }

      expect(error.name).toBe('InternalServerError')
      expect(error.message).toBe('Database connection failed')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.details).toEqual(details)
    })
  })

  describe('createBadRequestError', () => {
    it('should create bad request error with message and details', () => {
      const details = { parameter: 'limit', received: 'invalid' }
      const error = createBadRequestError('Invalid parameter format', details) as Error & {
        statusCode: number
        code: string
        details: unknown
      }

      expect(error.name).toBe('BadRequestError')
      expect(error.message).toBe('Invalid parameter format')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('BAD_REQUEST')
      expect(error.details).toEqual(details)
    })

    it('should create bad request error without details', () => {
      const error = createBadRequestError('Invalid request') as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('BadRequestError')
      expect(error.message).toBe('Invalid request')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('BAD_REQUEST')
    })
  })

  describe('createTooManyRequestsError', () => {
    it('should create too many requests error with default message', () => {
      const error = createTooManyRequestsError() as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('TooManyRequestsError')
      expect(error.message).toBe('Too many requests')
      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('TOO_MANY_REQUESTS')
    })

    it('should create too many requests error with custom message', () => {
      const error = createTooManyRequestsError('Rate limit exceeded') as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('TooManyRequestsError')
      expect(error.message).toBe('Rate limit exceeded')
      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('TOO_MANY_REQUESTS')
    })
  })

  describe('isAppError', () => {
    it('should return true for app errors', () => {
      const appError = createValidationError('Test error')
      expect(isAppError(appError)).toBe(true)
    })

    it('should return false for regular errors', () => {
      const regularError = new Error('Regular error')
      expect(isAppError(regularError)).toBe(false)
    })

    it('should return false for non-error objects', () => {
      expect(isAppError('string')).toBe(false)
      expect(isAppError(null)).toBe(false)
      expect(isAppError(undefined)).toBe(false)
      expect(isAppError({})).toBe(false)
      expect(isAppError(123)).toBe(false)
    })

    it('should return false for error without statusCode', () => {
      const errorWithoutStatus = new Error('Test')

      ;(errorWithoutStatus as any).code = 'TEST'
      expect(isAppError(errorWithoutStatus)).toBe(false)
    })

    it('should return false for error with non-number statusCode', () => {
      const errorWithInvalidStatus = new Error('Test')

      ;(errorWithInvalidStatus as any).statusCode = 'invalid'
      expect(isAppError(errorWithInvalidStatus)).toBe(false)
    })
  })

  describe('createErrorResponse', () => {
    it('should create error response with all properties', () => {
      const error = createValidationError('Invalid input', { field: 'email' }) as Error & {
        statusCode: number
        code: string
        details: unknown
      }
      const path = '/api/users'

      const response = createErrorResponse(error, path)

      expect(response.error.code).toBe('VALIDATION_ERROR')
      expect(response.error.message).toBe('Invalid input')
      expect(response.error.details).toEqual({ field: 'email' })
      expect(response.error.path).toBe('/api/users')
      expect(response.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should create error response with default code when code is missing', () => {
      const error = new Error('Test error') as Error & {
        statusCode: number
      }
      error.statusCode = 400

      const response = createErrorResponse(error, '/test')

      expect(response.error.code).toBe('ERROR')
      expect(response.error.message).toBe('Test error')
      expect(response.error.path).toBe('/test')
    })

    it('should create error response without details when details is missing', () => {
      const error = createNotFoundError('User') as Error & {
        statusCode: number
        code: string
      }

      const response = createErrorResponse(error, '/api/users/123')

      expect(response.error.code).toBe('NOT_FOUND')
      expect(response.error.message).toBe('User not found')
      expect(response.error.details).toBeUndefined()
      expect(response.error.path).toBe('/api/users/123')
    })
  })
})

describe('Error Handlers', () => {
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply

  beforeEach(() => {
    mockRequest = createMockRequest()
    mockReply = createMockReply()
  })

  describe('errorHandler', () => {
    it('should handle rate limit errors with code 429', async () => {
      const rateLimitError = new Error('Rate limit exceeded')

      ;(rateLimitError as any).code = 429

      await errorHandler(rateLimitError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(429)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Rate limit exceeded',
        statusCode: 429,
        error: 'Too Many Requests',
      })
    })

    it('should handle rate limit errors with statusCode 429', async () => {
      const rateLimitError = new Error('Too many requests')

      ;(rateLimitError as any).statusCode = 429

      await errorHandler(rateLimitError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(429)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Too many requests',
        statusCode: 429,
        error: 'Too Many Requests',
      })
    })

    it('should handle rate limit errors with default message', async () => {
      // eslint-disable-next-line unicorn/error-message
      const rateLimitError = new Error()

      ;(rateLimitError as any).code = 429

      await errorHandler(rateLimitError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(429)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Rate limit exceeded',
        statusCode: 429,
        error: 'Too Many Requests',
      })
    })

    it('should handle app errors (400)', async () => {
      const appError = createValidationError('Invalid input')

      await errorHandler(appError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(400)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Invalid input',
        statusCode: 400,
        error: 'Bad Request',
      })
    })

    it('should handle app errors (401)', async () => {
      const appError = createUnauthorizedError('Invalid token')

      await errorHandler(appError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(401)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Invalid token',
        statusCode: 401,
        error: 'Unauthorized',
      })
    })

    it('should handle app errors (403)', async () => {
      const appError = createForbiddenError('Access denied')

      await errorHandler(appError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(403)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Access denied',
        statusCode: 403,
        error: 'Forbidden',
      })
    })

    it('should handle app errors (404)', async () => {
      const appError = createNotFoundError('User')

      await errorHandler(appError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'User not found',
        statusCode: 404,
        error: 'Not Found',
      })
    })

    it('should handle app errors (409)', async () => {
      const appError = createConflictError('Email already exists')

      await errorHandler(appError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(409)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Email already exists',
        statusCode: 409,
        error: 'Conflict',
      })
    })

    it('should handle app errors (429)', async () => {
      const appError = createTooManyRequestsError('Rate limit exceeded')

      await errorHandler(appError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(429)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Rate limit exceeded',
        statusCode: 429,
        error: 'Too Many Requests',
      })
    })

    it('should handle app errors (500)', async () => {
      const appError = createInternalServerError('Database error')

      await errorHandler(appError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Database error',
        statusCode: 500,
        error: 'Internal Server Error',
      })
    })

    it('should handle app errors with unknown status code', async () => {
      const appError = new Error('Unknown error') as Error & { statusCode: number }
      appError.statusCode = 418 // I'm a teapot

      await errorHandler(appError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(418)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Unknown error',
        statusCode: 418,
        error: 'Error',
      })
    })

    it('should handle Fastify validation errors by name', async () => {
      const validationError = new Error('Validation failed')
      validationError.name = 'FastifyValidationError'

      await errorHandler(validationError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(400)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Validation failed',
        statusCode: 400,
        error: 'Bad Request',
      })
    })

    it('should handle ValidationError by name', async () => {
      const validationError = new Error('Validation failed')
      validationError.name = 'ValidationError'

      await errorHandler(validationError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(400)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Validation failed',
        statusCode: 400,
        error: 'Bad Request',
      })
    })

    it('should handle Fastify validation errors by code', async () => {
      const validationError = new Error('Body validation failed')

      ;(validationError as any).code = 'FST_ERR_VALIDATION'

      await errorHandler(validationError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(400)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Body validation failed',
        statusCode: 400,
        error: 'Bad Request',
      })
    })

    it('should handle SyntaxError', async () => {
      const syntaxError = new Error('Unexpected token')
      syntaxError.name = 'SyntaxError'

      await errorHandler(syntaxError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(400)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Invalid JSON syntax',
        statusCode: 400,
        error: 'Bad Request',
      })
    })

    it('should handle unknown errors as internal server error', async () => {
      const unknownError = new Error('Something went wrong')

      await errorHandler(unknownError, mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Internal server error',
        statusCode: 500,
        error: 'Internal Server Error',
      })
    })

    it('should log all errors', async () => {
      const testError = new Error('Test error')
      await errorHandler(testError, mockRequest, mockReply)

      expect(mockRequest.log.error).toHaveBeenCalledWith(testError, 'Request error')
    })
  })

  describe('notFoundHandler', () => {
    it('should handle not found routes', async () => {
      await notFoundHandler(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Route not found',
        statusCode: 404,
        error: 'Not Found',
      })
    })
  })
})
