/**
 * Tests for Custom Error Classes
 */

import {
    AppError,
    ErrorCode,
    ValidationError,
    NotFoundError,
    DuplicateResourceError,
    UnauthorizedError,
    ForbiddenError,
    BusinessLogicError,
    DatabaseError,
    RateLimitError,
    FileUploadError,
    InternalServerError,
    ServiceUnavailableError
} from '../src/types/errors.js'

describe('Error Classes', () => {
    describe('AppError Base Class', () => {
        // We can't instantiate abstract class directly, so we'll test through subclasses
        test('should create error with correct properties', () => {
            const error = new ValidationError('Test message', { field: 'test' })

            expect(error).toBeInstanceOf(Error)
            expect(error).toBeInstanceOf(AppError)
            expect(error.message).toBe('Test message')
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
            expect(error.statusCode).toBe(400)
            expect(error.isOperational).toBe(true)
            expect(error.details).toEqual({ field: 'test' })
            expect(error.timestamp).toBeInstanceOf(Date)
            expect(error.name).toBe('ValidationError')
        })

        test('should capture stack trace', () => {
            const error = new ValidationError('Test message')
            expect(error.stack).toBeDefined()
            expect(error.stack).toContain('ValidationError')
        })

        test('should convert to JSON correctly', () => {
            const error = new ValidationError('Test message', { field: 'test' })
            const json = error.toJSON()

            expect(json).toEqual({
                name: 'ValidationError',
                message: 'Test message',
                code: ErrorCode.VALIDATION_ERROR,
                statusCode: 400,
                timestamp: error.timestamp.toISOString(),
                details: { field: 'test' }
            })
        })

        test('should convert to JSON without details when none provided', () => {
            const error = new ValidationError('Test message')
            const json = error.toJSON()

            expect(json).toEqual({
                name: 'ValidationError',
                message: 'Test message',
                code: ErrorCode.VALIDATION_ERROR,
                statusCode: 400,
                timestamp: error.timestamp.toISOString()
            })
            expect(json.details).toBeUndefined()
        })
    })

    describe('ValidationError', () => {
        test('should create validation error with correct properties', () => {
            const error = new ValidationError('Invalid input')

            expect(error.message).toBe('Invalid input')
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
            expect(error.statusCode).toBe(400)
            expect(error.isOperational).toBe(true)
        })

        test('should include details when provided', () => {
            const details = { field: 'email', rule: 'format' }
            const error = new ValidationError('Invalid email format', details)

            expect(error.details).toEqual(details)
        })
    })

    describe('NotFoundError', () => {
        test('should create not found error with resource only', () => {
            const error = new NotFoundError('User')

            expect(error.message).toBe('User not found')
            expect(error.code).toBe(ErrorCode.NOT_FOUND)
            expect(error.statusCode).toBe(404)
            expect(error.details).toEqual({ resource: 'User', id: undefined })
        })

        test('should create not found error with resource and id', () => {
            const error = new NotFoundError('User', '123')

            expect(error.message).toBe("User with id '123' not found")
            expect(error.details).toEqual({ resource: 'User', id: '123' })
        })

        test('should work with numeric id', () => {
            const error = new NotFoundError('User', 123)

            expect(error.message).toBe("User with id '123' not found")
            expect(error.details).toEqual({ resource: 'User', id: 123 })
        })
    })

    describe('DuplicateResourceError', () => {
        test('should create duplicate resource error', () => {
            const error = new DuplicateResourceError('User', 'email', 'test@example.com')

            expect(error.message).toBe("User with email 'test@example.com' already exists")
            expect(error.code).toBe(ErrorCode.DUPLICATE_RESOURCE)
            expect(error.statusCode).toBe(409)
            expect(error.details).toEqual({
                resource: 'User',
                field: 'email',
                value: 'test@example.com'
            })
        })
    })

    describe('UnauthorizedError', () => {
        test('should create unauthorized error with default message', () => {
            const error = new UnauthorizedError()

            expect(error.message).toBe('Authentication required')
            expect(error.code).toBe(ErrorCode.UNAUTHORIZED)
            expect(error.statusCode).toBe(401)
        })

        test('should create unauthorized error with custom message', () => {
            const error = new UnauthorizedError('Invalid token')

            expect(error.message).toBe('Invalid token')
        })
    })

    describe('ForbiddenError', () => {
        test('should create forbidden error with default message', () => {
            const error = new ForbiddenError()

            expect(error.message).toBe('Insufficient permissions')
            expect(error.code).toBe(ErrorCode.FORBIDDEN)
            expect(error.statusCode).toBe(403)
        })

        test('should create forbidden error with custom message', () => {
            const error = new ForbiddenError('Admin access required')

            expect(error.message).toBe('Admin access required')
        })
    })

    describe('BusinessLogicError', () => {
        test('should create business logic error', () => {
            const error = new BusinessLogicError('Cannot delete user with active sessions')

            expect(error.message).toBe('Cannot delete user with active sessions')
            expect(error.code).toBe(ErrorCode.BUSINESS_LOGIC_ERROR)
            expect(error.statusCode).toBe(422)
        })
    })

    describe('DatabaseError', () => {
        test('should create database error', () => {
            const error = new DatabaseError('Connection timeout')

            expect(error.message).toBe('Connection timeout')
            expect(error.code).toBe(ErrorCode.DATABASE_ERROR)
            expect(error.statusCode).toBe(500)
        })
    })

    describe('RateLimitError', () => {
        test('should create rate limit error with default message', () => {
            const error = new RateLimitError()

            expect(error.message).toBe('Rate limit exceeded')
            expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED)
            expect(error.statusCode).toBe(429)
        })
    })

    describe('FileUploadError', () => {
        test('should create file upload error with default code', () => {
            const error = new FileUploadError('File too large')

            expect(error.message).toBe('File too large')
            expect(error.code).toBe(ErrorCode.UPLOAD_ERROR)
            expect(error.statusCode).toBe(400)
        })

        test('should create file upload error with custom code', () => {
            const error = new FileUploadError('Invalid file type', ErrorCode.INVALID_FILE_TYPE)

            expect(error.code).toBe(ErrorCode.INVALID_FILE_TYPE)
        })
    })

    describe('InternalServerError', () => {
        test('should create internal server error with default message', () => {
            const error = new InternalServerError()

            expect(error.message).toBe('Internal server error')
            expect(error.code).toBe(ErrorCode.INTERNAL_ERROR)
            expect(error.statusCode).toBe(500)
            expect(error.isOperational).toBe(false)
        })

        test('should create internal server error with custom message', () => {
            const error = new InternalServerError('Database connection failed')

            expect(error.message).toBe('Database connection failed')
        })
    })

    describe('ServiceUnavailableError', () => {
        test('should create service unavailable error', () => {
            const error = new ServiceUnavailableError()

            expect(error.message).toBe('Service temporarily unavailable')
            expect(error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE)
            expect(error.statusCode).toBe(503)
        })
    })
})
