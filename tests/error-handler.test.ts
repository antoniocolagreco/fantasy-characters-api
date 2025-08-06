/**
 * Tests for Error Handler Middleware
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { globalErrorHandler, notFoundHandler } from '../src/middleware/error-handler.js'
import { ValidationError, NotFoundError, ErrorCode } from '../src/types/errors.js'
import { config } from '../src/config/environment.js'

// Mock the config
jest.mock('../src/config/environment.js', () => ({
    config: {
        NODE_ENV: 'development'
    }
}))

describe('Error Handler Middleware', () => {
    let mockRequest: Partial<FastifyRequest> & { user?: { id: string } }
    let mockReply: Partial<FastifyReply>
    let mockLog: { error: jest.Mock }

    beforeEach(() => {
        mockLog = {
            error: jest.fn()
        }

        mockRequest = {
            id: 'req-123',
            url: '/api/test',
            method: 'GET',
            log: mockLog as unknown as FastifyRequest['log'],
            user: { id: 'user-456' }
        }

        mockReply = {
            code: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            getHeader: jest.fn()
        }
    })

    describe('globalErrorHandler', () => {
        it('should handle AppError instances', async () => {
            const appError = new ValidationError('Validation failed', { field: 'email' })

            await globalErrorHandler(
                appError as unknown as FastifyError,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            )

            expect(mockReply.code).toHaveBeenCalledWith(400)
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Validation failed',
                    timestamp: expect.any(String),
                    details: { field: 'email' },
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })
        })

        it('should handle AppError without details in production', async () => {
            // Mock production environment
            ;(config as { NODE_ENV: string }).NODE_ENV = 'production'

            const appError = new NotFoundError('user', 'user-123')

            await globalErrorHandler(
                appError as unknown as FastifyError,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            )

            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.NOT_FOUND,
                    message: "user with id 'user-123' not found",
                    timestamp: expect.any(String),
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })

            // Reset to development environment
            ;(config as { NODE_ENV: string }).NODE_ENV = 'development'
        })

        it('should handle validation errors', async () => {
            const validationError = {
                name: 'ValidationError',
                message: 'Invalid input',
                code: 'VALIDATION_ERROR',
                validation: [{ field: 'email', message: 'Invalid format' }],
                validationContext: 'body'
            } as unknown as FastifyError

            await globalErrorHandler(validationError, mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockReply.code).toHaveBeenCalledWith(400)
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Validation failed',
                    timestamp: expect.any(String),
                    details: {
                        validation: [{ field: 'email', message: 'Invalid format' }],
                        validationContext: 'body'
                    },
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })
        })

        it('should handle FST_ERR_NOT_FOUND error', async () => {
            const notFoundError = {
                name: 'FastifyError',
                message: 'Not Found',
                code: 'FST_ERR_NOT_FOUND'
            } as FastifyError

            await globalErrorHandler(notFoundError, mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockReply.code).toHaveBeenCalledWith(404)
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.NOT_FOUND,
                    message: 'Route GET /api/test not found',
                    timestamp: expect.any(String),
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })
        })

        it('should handle FST_ERR_BAD_STATUS_CODE error', async () => {
            const badStatusError = {
                name: 'FastifyError',
                message: 'Bad status code',
                code: 'FST_ERR_BAD_STATUS_CODE'
            } as FastifyError

            await globalErrorHandler(badStatusError, mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockReply.code).toHaveBeenCalledWith(500)
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.INTERNAL_ERROR,
                    message: 'Invalid status code',
                    timestamp: expect.any(String),
                    details: { originalError: 'Bad status code' },
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })
        })

        it('should handle FST_ERR_CTP_INVALID_MEDIA_TYPE error', async () => {
            const mediaTypeError = {
                name: 'FastifyError',
                message: 'Invalid media type',
                code: 'FST_ERR_CTP_INVALID_MEDIA_TYPE'
            } as FastifyError

            await globalErrorHandler(mediaTypeError, mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockReply.code).toHaveBeenCalledWith(400)
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Invalid content type',
                    timestamp: expect.any(String),
                    details: { expectedType: 'application/json' },
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })
        })

        it('should handle FST_ERR_CTP_EMPTY_JSON_BODY error', async () => {
            const emptyBodyError = {
                name: 'FastifyError',
                message: 'Empty JSON body',
                code: 'FST_ERR_CTP_EMPTY_JSON_BODY'
            } as FastifyError

            await globalErrorHandler(emptyBodyError, mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockReply.code).toHaveBeenCalledWith(400)
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Request body cannot be empty',
                    timestamp: expect.any(String),
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })
        })

        it('should handle FST_ERR_CTP_INVALID_JSON_BODY error', async () => {
            const invalidJsonError = {
                name: 'FastifyError',
                message: 'Invalid JSON',
                code: 'FST_ERR_CTP_INVALID_JSON_BODY'
            } as FastifyError

            await globalErrorHandler(invalidJsonError, mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockReply.code).toHaveBeenCalledWith(400)
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Invalid JSON in request body',
                    timestamp: expect.any(String),
                    details: { originalError: 'Invalid JSON' },
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })
        })

        it('should handle rate limit errors (statusCode 429)', async () => {
            const rateLimitError = {
                name: 'FastifyError',
                message: 'Rate limit exceeded',
                code: 'RATE_LIMIT',
                statusCode: 429
            } as FastifyError

            mockReply.getHeader = jest.fn().mockReturnValue('60')

            await globalErrorHandler(rateLimitError, mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockReply.code).toHaveBeenCalledWith(429)
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.RATE_LIMIT_EXCEEDED,
                    message: 'Rate limit exceeded. Please try again later.',
                    timestamp: expect.any(String),
                    details: { retryAfter: '60' },
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })
        })

        it('should handle 4xx client errors', async () => {
            const clientError = {
                name: 'FastifyError',
                message: 'Bad request',
                code: 'CLIENT_ERROR',
                statusCode: 422
            } as FastifyError

            await globalErrorHandler(clientError, mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockReply.code).toHaveBeenCalledWith(422)
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.INVALID_INPUT,
                    message: 'Bad request',
                    timestamp: expect.any(String),
                    details: { originalError: 'Bad request' },
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })
        })

        it('should handle generic server errors', async () => {
            const genericError = {
                name: 'Error',
                message: 'Something went wrong',
                code: 'GENERIC_ERROR',
                stack: 'Error: Something went wrong\n    at test'
            } as FastifyError

            await globalErrorHandler(genericError, mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockReply.code).toHaveBeenCalledWith(500)
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.INTERNAL_ERROR,
                    message: 'Something went wrong',
                    timestamp: expect.any(String),
                    details: {
                        originalError: 'Something went wrong',
                        code: 'GENERIC_ERROR'
                    },
                    path: '/api/test',
                    requestId: 'req-123',
                    stack: 'Error: Something went wrong\n    at test'
                }
            })
        })

        it('should handle errors without user in request', async () => {
            delete mockRequest.user

            const genericError = {
                name: 'Error',
                message: 'Test error',
                code: 'TEST_ERROR'
            } as FastifyError

            await globalErrorHandler(genericError, mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockLog.error).toHaveBeenCalledWith(
                {
                    error: {
                        name: 'Error',
                        message: 'Test error',
                        code: 'TEST_ERROR',
                        stack: undefined
                    },
                    url: '/api/test',
                    method: 'GET',
                    requestId: 'req-123',
                    userId: undefined
                },
                'Request error occurred'
            )
        })

        it('should handle production mode for generic errors', async () => {
            ;(config as { NODE_ENV: string }).NODE_ENV = 'production'

            const genericError = {
                name: 'Error',
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            } as FastifyError

            await globalErrorHandler(genericError, mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.INTERNAL_ERROR,
                    message: 'An internal server error occurred',
                    timestamp: expect.any(String),
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })

            // Reset to development environment
            ;(config as { NODE_ENV: string }).NODE_ENV = 'development'
        })
    })

    describe('notFoundHandler', () => {
        it('should handle not found routes', async () => {
            await notFoundHandler(mockRequest as FastifyRequest, mockReply as FastifyReply)

            expect(mockReply.code).toHaveBeenCalledWith(404)
            expect(mockReply.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.NOT_FOUND,
                    message: 'Route GET /api/test not found',
                    timestamp: expect.any(String),
                    path: '/api/test',
                    requestId: 'req-123'
                }
            })
        })
    })
})
