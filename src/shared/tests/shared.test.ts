import { describe, it, expect } from 'vitest'
import {
  createValidationError,
  createNotFoundError,
  isAppError,
  createErrorResponse,
} from '@/shared/errors.js'

describe('Shared Error Utilities', () => {
  describe('Error Creation Functions', () => {
    it('should create validation error with correct properties', () => {
      const error = createValidationError('Invalid input', { field: 'email' }) as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
    })

    it('should create not found error', () => {
      const error = createNotFoundError('User', '123') as Error & {
        statusCode: number
        code: string
      }

      expect(error.name).toBe('NotFoundError')
      expect(error.message).toBe('User with id 123 not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
    })
  })

  describe('isAppError type guard', () => {
    it('should identify valid AppError', () => {
      const error = createValidationError('Test error')
      expect(isAppError(error)).toBe(true)
    })

    it('should reject regular Error', () => {
      const error = new Error('Regular error')
      expect(isAppError(error)).toBe(false)
    })
  })

  describe('createErrorResponse', () => {
    it('should create standardized error response', () => {
      const appError = createNotFoundError('User', '123') as Error & {
        statusCode: number
        code?: string
        details?: unknown
      }
      const response = createErrorResponse(appError, '/api/users/123')

      expect(response.error.code).toBe('NOT_FOUND')
      expect(response.error.message).toBe('User with id 123 not found')
      expect(response.error.path).toBe('/api/users/123')
    })
  })
})
