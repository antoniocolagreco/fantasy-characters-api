/**
 * Type Guards Test Suite
 * Comprehensive tests for type safety utilities
 */

import { describe, expect, it } from 'vitest'
import {
  assertRole,
  assertVisibility,
  hasProperty,
  isBoolean,
  isErrorWithCode,
  isErrorWithStatusCode,
  isNonNull,
  isNumber,
  isRole,
  isString,
  isVisibility,
  toErrorWithStatusCode,
  toRole,
  toVisibility,
  type Role,
  type Visibility,
} from '../type-guards'

describe('Type Guards', () => {
  describe('isRole', () => {
    it('should return true for valid Role values', () => {
      expect(isRole('USER')).toBe(true)
      expect(isRole('MODERATOR')).toBe(true)
      expect(isRole('ADMIN')).toBe(true)
    })

    it('should return false for invalid Role values', () => {
      expect(isRole('INVALID')).toBe(false)
      expect(isRole('user')).toBe(false) // case sensitive
      expect(isRole('admin')).toBe(false) // case sensitive
      expect(isRole('')).toBe(false)
      expect(isRole('SUPER_ADMIN')).toBe(false)
    })

    it('should return false for non-string values', () => {
      expect(isRole(123)).toBe(false)
      expect(isRole(null)).toBe(false)
      expect(isRole(undefined)).toBe(false)
      expect(isRole(true)).toBe(false)
      expect(isRole({})).toBe(false)
      expect(isRole([])).toBe(false)
      expect(isRole(() => {})).toBe(false)
    })

    it('should provide correct type narrowing', () => {
      const value: unknown = 'USER'
      if (isRole(value)) {
        // TypeScript should know this is Role type
        expect(value).toBe('USER')
        const role: Role = value // This should not cause TypeScript error
        expect(role).toBe('USER')
      }
    })
  })

  describe('isVisibility', () => {
    it('should return true for valid Visibility values', () => {
      expect(isVisibility('PUBLIC')).toBe(true)
      expect(isVisibility('PRIVATE')).toBe(true)
      expect(isVisibility('HIDDEN')).toBe(true)
    })

    it('should return false for invalid Visibility values', () => {
      expect(isVisibility('INVALID')).toBe(false)
      expect(isVisibility('public')).toBe(false) // case sensitive
      expect(isVisibility('private')).toBe(false) // case sensitive
      expect(isVisibility('')).toBe(false)
      expect(isVisibility('INTERNAL')).toBe(false)
    })

    it('should return false for non-string values', () => {
      expect(isVisibility(123)).toBe(false)
      expect(isVisibility(null)).toBe(false)
      expect(isVisibility(undefined)).toBe(false)
      expect(isVisibility(true)).toBe(false)
      expect(isVisibility({})).toBe(false)
      expect(isVisibility([])).toBe(false)
    })

    it('should provide correct type narrowing', () => {
      const value: unknown = 'PUBLIC'
      if (isVisibility(value)) {
        // TypeScript should know this is Visibility type
        expect(value).toBe('PUBLIC')
        const visibility: Visibility = value // This should not cause TypeScript error
        expect(visibility).toBe('PUBLIC')
      }
    })
  })

  describe('toRole', () => {
    it('should return valid Role values unchanged', () => {
      expect(toRole('USER')).toBe('USER')
      expect(toRole('MODERATOR')).toBe('MODERATOR')
      expect(toRole('ADMIN')).toBe('ADMIN')
    })

    it('should return default USER role for invalid values', () => {
      expect(toRole('INVALID')).toBe('USER')
      expect(toRole('user')).toBe('USER')
      expect(toRole('')).toBe('USER')
      expect(toRole(123)).toBe('USER')
      expect(toRole(null)).toBe('USER')
      expect(toRole(undefined)).toBe('USER')
      expect(toRole({})).toBe('USER')
    })

    it('should accept custom default role', () => {
      expect(toRole('INVALID', 'ADMIN')).toBe('ADMIN')
      expect(toRole('invalid', 'MODERATOR')).toBe('MODERATOR')
      expect(toRole(null, 'ADMIN')).toBe('ADMIN')
      expect(toRole(undefined, 'MODERATOR')).toBe('MODERATOR')
    })

    it('should return valid role even when custom default is provided', () => {
      expect(toRole('USER', 'ADMIN')).toBe('USER')
      expect(toRole('MODERATOR', 'ADMIN')).toBe('MODERATOR')
    })
  })

  describe('toVisibility', () => {
    it('should return valid Visibility values unchanged', () => {
      expect(toVisibility('PUBLIC')).toBe('PUBLIC')
      expect(toVisibility('PRIVATE')).toBe('PRIVATE')
      expect(toVisibility('HIDDEN')).toBe('HIDDEN')
    })

    it('should return default PUBLIC visibility for invalid values', () => {
      expect(toVisibility('INVALID')).toBe('PUBLIC')
      expect(toVisibility('public')).toBe('PUBLIC')
      expect(toVisibility('')).toBe('PUBLIC')
      expect(toVisibility(123)).toBe('PUBLIC')
      expect(toVisibility(null)).toBe('PUBLIC')
      expect(toVisibility(undefined)).toBe('PUBLIC')
      expect(toVisibility({})).toBe('PUBLIC')
    })

    it('should accept custom default visibility', () => {
      expect(toVisibility('INVALID', 'PRIVATE')).toBe('PRIVATE')
      expect(toVisibility('invalid', 'HIDDEN')).toBe('HIDDEN')
      expect(toVisibility(null, 'PRIVATE')).toBe('PRIVATE')
      expect(toVisibility(undefined, 'HIDDEN')).toBe('HIDDEN')
    })

    it('should return valid visibility even when custom default is provided', () => {
      expect(toVisibility('PUBLIC', 'PRIVATE')).toBe('PUBLIC')
      expect(toVisibility('HIDDEN', 'PRIVATE')).toBe('HIDDEN')
    })
  })

  describe('isErrorWithStatusCode', () => {
    it('should return true for Error objects with statusCode', () => {
      const error = Object.assign(new Error('Test error'), { statusCode: 404 })
      expect(isErrorWithStatusCode(error)).toBe(true)
    })

    it('should return true for Error objects with numeric statusCode', () => {
      const error = Object.assign(new Error('Test'), { statusCode: 500 })
      expect(isErrorWithStatusCode(error)).toBe(true)
    })

    it('should return false for Error objects without statusCode', () => {
      const error = new Error('Test error')
      expect(isErrorWithStatusCode(error)).toBe(false)
    })

    it('should return false for Error objects with non-numeric statusCode', () => {
      const error = Object.assign(new Error('Test error'), { statusCode: 'not a number' })
      expect(isErrorWithStatusCode(error)).toBe(false)
    })

    it('should return false for non-Error objects', () => {
      expect(isErrorWithStatusCode({ statusCode: 404 })).toBe(false)
      expect(isErrorWithStatusCode('error')).toBe(false)
      expect(isErrorWithStatusCode(null)).toBe(false)
      expect(isErrorWithStatusCode(undefined)).toBe(false)
      expect(isErrorWithStatusCode(404)).toBe(false)
    })

    it('should return false for Error objects with statusCode null/undefined', () => {
      const error1 = Object.assign(new Error('Test'), { statusCode: null })
      expect(isErrorWithStatusCode(error1)).toBe(false)

      const error2 = Object.assign(new Error('Test'), { statusCode: undefined })
      expect(isErrorWithStatusCode(error2)).toBe(false)
    })
  })

  describe('isErrorWithCode', () => {
    it('should return true for Error objects with string code', () => {
      const error = Object.assign(new Error('Test error'), { code: 'ERR_CODE' })
      expect(isErrorWithCode(error)).toBe(true)
    })

    it('should return true for Error objects with code property', () => {
      const error = Object.assign(new Error('Test'), { code: 'VALIDATION_ERROR' })
      expect(isErrorWithCode(error)).toBe(true)
    })

    it('should return false for Error objects without code', () => {
      const error = new Error('Test error')
      expect(isErrorWithCode(error)).toBe(false)
    })

    it('should return false for Error objects with non-string code', () => {
      const error = Object.assign(new Error('Test error'), { code: 123 })
      expect(isErrorWithCode(error)).toBe(false)
    })

    it('should return false for non-Error objects', () => {
      expect(isErrorWithCode({ code: 'ERROR' })).toBe(false)
      expect(isErrorWithCode('error')).toBe(false)
      expect(isErrorWithCode(null)).toBe(false)
      expect(isErrorWithCode(undefined)).toBe(false)
    })
  })

  describe('isNonNull', () => {
    it('should return true for non-null, non-undefined values', () => {
      expect(isNonNull('string')).toBe(true)
      expect(isNonNull(123)).toBe(true)
      expect(isNonNull(0)).toBe(true)
      expect(isNonNull(false)).toBe(true)
      expect(isNonNull({})).toBe(true)
      expect(isNonNull([])).toBe(true)
      expect(isNonNull('')).toBe(true) // empty string is not null
    })

    it('should return false for null', () => {
      expect(isNonNull(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isNonNull(undefined)).toBe(false)
    })

    it('should provide correct type narrowing', () => {
      const value: string | null | undefined = 'test'
      if (isNonNull(value)) {
        // TypeScript should know this is string type (not null/undefined)
        expect(value.length).toBe(4) // Should not cause TypeScript error
      }
    })
  })

  describe('isString', () => {
    it('should return true for string values', () => {
      expect(isString('hello')).toBe(true)
      expect(isString('')).toBe(true)
      expect(isString('123')).toBe(true)
      expect(isString(' ')).toBe(true)
    })

    it('should return false for non-string values', () => {
      expect(isString(123)).toBe(false)
      expect(isString(true)).toBe(false)
      expect(isString(null)).toBe(false)
      expect(isString(undefined)).toBe(false)
      expect(isString({})).toBe(false)
      expect(isString([])).toBe(false)
      expect(isString(() => {})).toBe(false)
    })

    it('should provide correct type narrowing', () => {
      const value: unknown = 'test string'
      if (isString(value)) {
        // TypeScript should know this is string type
        expect(value.length).toBe(11) // Should not cause TypeScript error
        expect(value.toUpperCase()).toBe('TEST STRING')
      }
    })
  })

  describe('isNumber', () => {
    it('should return true for valid number values', () => {
      expect(isNumber(123)).toBe(true)
      expect(isNumber(0)).toBe(true)
      expect(isNumber(-456)).toBe(true)
      expect(isNumber(3.14)).toBe(true)
      expect(isNumber(Infinity)).toBe(true)
      expect(isNumber(-Infinity)).toBe(true)
    })

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false)
      expect(isNumber(Number.NaN)).toBe(false)
      expect(isNumber(0 / 0)).toBe(false)
    })

    it('should return false for non-number values', () => {
      expect(isNumber('123')).toBe(false)
      expect(isNumber('0')).toBe(false)
      expect(isNumber(true)).toBe(false)
      expect(isNumber(null)).toBe(false)
      expect(isNumber(undefined)).toBe(false)
      expect(isNumber({})).toBe(false)
      expect(isNumber([])).toBe(false)
    })

    it('should provide correct type narrowing', () => {
      const value: unknown = 42
      if (isNumber(value)) {
        // TypeScript should know this is number type
        expect(value + 1).toBe(43) // Should not cause TypeScript error
        expect(value.toFixed(2)).toBe('42.00')
      }
    })
  })

  describe('isBoolean', () => {
    it('should return true for boolean values', () => {
      expect(isBoolean(true)).toBe(true)
      expect(isBoolean(false)).toBe(true)
      expect(isBoolean(Boolean(1))).toBe(true)
      expect(isBoolean(Boolean(0))).toBe(true)
    })

    it('should return false for non-boolean values', () => {
      expect(isBoolean(1)).toBe(false)
      expect(isBoolean(0)).toBe(false)
      expect(isBoolean('true')).toBe(false)
      expect(isBoolean('false')).toBe(false)
      expect(isBoolean(null)).toBe(false)
      expect(isBoolean(undefined)).toBe(false)
      expect(isBoolean({})).toBe(false)
      expect(isBoolean([])).toBe(false)
    })

    it('should provide correct type narrowing', () => {
      const value: unknown = true
      if (isBoolean(value)) {
        // TypeScript should know this is boolean type
        expect(!value).toBe(false) // Should not cause TypeScript error
        expect(value.valueOf()).toBe(true)
      }
    })
  })

  describe('hasProperty', () => {
    it('should return true when object has the specified property', () => {
      const obj = { name: 'test', age: 25 }
      expect(hasProperty(obj, 'name')).toBe(true)
      expect(hasProperty(obj, 'age')).toBe(true)
    })

    it('should return true for inherited properties', () => {
      const obj = { name: 'test' }
      expect(hasProperty(obj, 'toString')).toBe(true) // inherited from Object
    })

    it('should return false when object does not have the property', () => {
      const obj = { name: 'test' }
      expect(hasProperty(obj, 'age')).toBe(false)
      expect(hasProperty(obj, 'nonexistent')).toBe(false)
    })

    it('should return false for non-objects', () => {
      expect(hasProperty('string', 'length')).toBe(false) // strings are not objects in this context
      expect(hasProperty(123, 'toString')).toBe(false)
      expect(hasProperty(null, 'property')).toBe(false)
      expect(hasProperty(undefined, 'property')).toBe(false)
    })

    it('should work with symbol properties', () => {
      const sym = Symbol('test')
      const obj = { [sym]: 'value' }
      expect(hasProperty(obj, sym)).toBe(true)
    })

    it('should provide correct type narrowing', () => {
      const obj: unknown = { name: 'test', age: 25 }
      if (hasProperty(obj, 'name')) {
        // TypeScript should know obj is Record<'name', unknown>
        expect(obj.name).toBe('test') // Should not cause TypeScript error
      }
    })
  })

  describe('assertRole', () => {
    it('should return the role for valid Role values', () => {
      expect(assertRole('USER')).toBe('USER')
      expect(assertRole('MODERATOR')).toBe('MODERATOR')
      expect(assertRole('ADMIN')).toBe('ADMIN')
    })

    it('should throw TypeError for invalid Role values', () => {
      expect(() => assertRole('INVALID')).toThrow(TypeError)
      expect(() => assertRole('INVALID')).toThrow('Role validation: Expected Role but got string')
    })

    it('should throw TypeError for non-string values', () => {
      expect(() => assertRole(123)).toThrow(TypeError)
      expect(() => assertRole(123)).toThrow('Role validation: Expected Role but got number')

      expect(() => assertRole(null)).toThrow(TypeError)
      expect(() => assertRole(null)).toThrow('Role validation: Expected Role but got object')

      expect(() => assertRole(undefined)).toThrow(TypeError)
      expect(() => assertRole(undefined)).toThrow(
        'Role validation: Expected Role but got undefined',
      )
    })

    it('should use custom context in error messages', () => {
      expect(() => assertRole('INVALID', 'User creation')).toThrow(
        'User creation: Expected Role but got string',
      )
      expect(() => assertRole(123, 'API validation')).toThrow(
        'API validation: Expected Role but got number',
      )
    })

    it('should return correct type', () => {
      const role = assertRole('USER')
      // TypeScript should know this is Role type
      expect(role).toBe('USER')
      const validRole: Role = role // Should not cause TypeScript error
      expect(validRole).toBe('USER')
    })
  })

  describe('assertVisibility', () => {
    it('should return the visibility for valid Visibility values', () => {
      expect(assertVisibility('PUBLIC')).toBe('PUBLIC')
      expect(assertVisibility('PRIVATE')).toBe('PRIVATE')
      expect(assertVisibility('HIDDEN')).toBe('HIDDEN')
    })

    it('should throw TypeError for invalid Visibility values', () => {
      expect(() => assertVisibility('INVALID')).toThrow(TypeError)
      expect(() => assertVisibility('INVALID')).toThrow(
        'Visibility validation: Expected Visibility but got string',
      )
    })

    it('should throw TypeError for non-string values', () => {
      expect(() => assertVisibility(123)).toThrow(TypeError)
      expect(() => assertVisibility(123)).toThrow(
        'Visibility validation: Expected Visibility but got number',
      )

      expect(() => assertVisibility(null)).toThrow(TypeError)
      expect(() => assertVisibility(null)).toThrow(
        'Visibility validation: Expected Visibility but got object',
      )
    })

    it('should use custom context in error messages', () => {
      expect(() => assertVisibility('INVALID', 'Content creation')).toThrow(
        'Content creation: Expected Visibility but got string',
      )
      expect(() => assertVisibility(123, 'API validation')).toThrow(
        'API validation: Expected Visibility but got number',
      )
    })

    it('should return correct type', () => {
      const visibility = assertVisibility('PUBLIC')
      // TypeScript should know this is Visibility type
      expect(visibility).toBe('PUBLIC')
      const validVisibility: Visibility = visibility // Should not cause TypeScript error
      expect(validVisibility).toBe('PUBLIC')
    })
  })

  describe('toErrorWithStatusCode', () => {
    it('should return Error with statusCode unchanged if already has statusCode', () => {
      const originalError = Object.assign(new Error('Original'), {
        statusCode: 404,
        code: 'NOT_FOUND',
      })

      const result = toErrorWithStatusCode(originalError)
      expect(result).toBe(originalError) // Should return exact same object
      expect(result.message).toBe('Original')
      expect(result.statusCode).toBe(404)
      expect(result.code).toBe('NOT_FOUND')
    })

    it('should convert Error without statusCode to Error with statusCode', () => {
      const originalError = new Error('Database error')
      const result = toErrorWithStatusCode(originalError)

      expect(result).toBe(originalError) // Should be the same object (mutated)
      expect(result.message).toBe('Database error')
      expect(result.statusCode).toBe(500)
      expect(result.code).toBe('INTERNAL_SERVER_ERROR')
      expect(result.details).toBeUndefined()
    })

    it('should convert non-Error values to Error with statusCode', () => {
      const result = toErrorWithStatusCode('String error')

      expect(result.message).toBe('Internal server error') // Uses default message
      expect(result.statusCode).toBe(500)
      expect(result.code).toBe('INTERNAL_SERVER_ERROR')
      expect(result.details).toBe('String error')
    })

    it('should use custom default message for non-Error values', () => {
      const result = toErrorWithStatusCode('String error', 'Custom error message')

      expect(result.message).toBe('Custom error message')
      expect(result.statusCode).toBe(500)
      expect(result.code).toBe('INTERNAL_SERVER_ERROR')
      expect(result.details).toBe('String error')
    })

    it('should handle null and undefined', () => {
      const nullResult = toErrorWithStatusCode(null)
      expect(nullResult.message).toBe('Internal server error')
      expect(nullResult.statusCode).toBe(500)
      expect(nullResult.details).toBe(null)

      const undefinedResult = toErrorWithStatusCode(undefined)
      expect(undefinedResult.message).toBe('Internal server error')
      expect(undefinedResult.statusCode).toBe(500)
      expect(undefinedResult.details).toBe(undefined)
    })

    it('should handle objects as details', () => {
      const obj = { field: 'value', code: 123 }
      const result = toErrorWithStatusCode(obj, 'Object error')

      expect(result.message).toBe('Object error')
      expect(result.statusCode).toBe(500)
      expect(result.code).toBe('INTERNAL_SERVER_ERROR')
      expect(result.details).toBe(obj)
    })

    it('should preserve Error instance when converting', () => {
      const originalError = new Error('Original message')
      const result = toErrorWithStatusCode(originalError)

      expect(result instanceof Error).toBe(true)
      expect(result.name).toBe('Error')
      expect(result.message).toBe('Original message')
      expect(result.stack).toBeDefined()
    })

    it('should handle errors with existing code property', () => {
      const errorWithCode = Object.assign(new Error('Test'), { code: 'EXISTING_CODE' })
      const result = toErrorWithStatusCode(errorWithCode)

      expect(result.message).toBe('Test')
      expect(result.statusCode).toBe(500)
      expect(result.code).toBe('INTERNAL_SERVER_ERROR') // Should override existing code
    })
  })
})
