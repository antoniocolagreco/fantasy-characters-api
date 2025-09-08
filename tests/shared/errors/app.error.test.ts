import { describe, expect, it } from 'vitest'

import { AppError, err } from '@/shared/errors/app.error'

describe('AppError', () => {
    it('should create AppError with default status', () => {
        const error = new AppError('INVALID_CREDENTIALS', 'Invalid credentials')

        expect(error.name).toBe('AppError')
        expect(error.code).toBe('INVALID_CREDENTIALS')
        expect(error.message).toBe('Invalid credentials')
        expect(error.status).toBe(401)
        expect(error.details).toBeUndefined()
    })

    it('should create AppError with custom status', () => {
        const error = new AppError('INVALID_CREDENTIALS', 'Invalid credentials', undefined, 418)

        expect(error.status).toBe(418)
    })

    it('should create AppError with details', () => {
        const details = [{ path: 'email', message: 'Invalid format' }]
        const error = new AppError('VALIDATION_ERROR', 'Validation failed', details)

        expect(error.details).toEqual(details)
    })

    it('should use fallback status 500 for unknown error codes', () => {
        const error = new AppError('UNKNOWN_ERROR' as any, 'Unknown error')

        expect(error.status).toBe(500)
    })

    it('should create error using err helper with default message', () => {
        const error = err('RESOURCE_NOT_FOUND')

        expect(error.code).toBe('RESOURCE_NOT_FOUND')
        expect(error.message).toBe('RESOURCE_NOT_FOUND')
        expect(error.status).toBe(404)
    })

    it('should create error using err helper with custom message', () => {
        const error = err('RESOURCE_NOT_FOUND', 'User not found')

        expect(error.message).toBe('User not found')
    })

    it('should create error using err helper with details', () => {
        const details = [{ path: 'id', message: 'Must be UUID' }]
        const error = err('VALIDATION_ERROR', 'Invalid input', details)

        expect(error.details).toEqual(details)
    })
})
