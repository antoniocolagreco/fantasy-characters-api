/**
 * Utility functions tests
 * Comprehensive tests for all utility functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  // String utilities
  isValidEmail,
  isValidUuid,
  sanitizeString,
  truncateString,
  slugify,
  // Number utilities
  clamp,
  isPositiveInteger,
  roundToDecimals,
  // Array utilities
  removeDuplicates,
  chunk,
  shuffle,
  // Object utilities
  pick,
  omit,
  isEmpty,
  // Date utilities
  formatDate,
  addDays,
  getDaysBetween,
  // Pagination utilities
  validatePagination,
  calculateTotalPages,
  // Async utilities
  delay,
  timeout,
  retry,
  // Environment utilities
  isDevelopment,
  isProduction,
  isTest,
  // Random utilities
  generateRandomString,
  generateUuid,
  // Password utilities
  isValidPassword,
  // Type assertion utilities
  assertNever,
  isString,
  isNumber,
  isBoolean,
  isObject,
} from '@/shared/utils.js'

describe('Utility Functions', () => {
  describe('String utilities', () => {
    describe('isValidEmail', () => {
      it('should validate correct email addresses', () => {
        expect(isValidEmail('test@example.com')).toBe(true)
        expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
        expect(isValidEmail('simple@test.org')).toBe(true)
      })

      it('should reject invalid email addresses', () => {
        expect(isValidEmail('invalid-email')).toBe(false)
        expect(isValidEmail('@domain.com')).toBe(false)
        expect(isValidEmail('user@')).toBe(false)
        expect(isValidEmail('')).toBe(false)
      })
    })

    describe('isValidUuid', () => {
      it('should validate correct UUIDs', () => {
        expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
        expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      })

      it('should reject invalid UUIDs', () => {
        expect(isValidUuid('invalid-uuid')).toBe(false)
        expect(isValidUuid('123e4567-e89b-12d3-a456')).toBe(false)
        expect(isValidUuid('')).toBe(false)
      })
    })

    describe('sanitizeString', () => {
      it('should trim and normalize whitespace', () => {
        expect(sanitizeString('  hello   world  ')).toBe('hello world')
        expect(sanitizeString('test\n\ntext')).toBe('test text')
        expect(sanitizeString('multiple    spaces')).toBe('multiple spaces')
      })
    })

    describe('truncateString', () => {
      it('should truncate long strings', () => {
        expect(truncateString('this is a long string', 10)).toBe('this is...')
        expect(truncateString('short', 10)).toBe('short')
      })
    })

    describe('slugify', () => {
      it('should create URL-friendly slugs', () => {
        expect(slugify('Hello World!')).toBe('hello-world')
        expect(slugify('Test_String With Spaces')).toBe('test-string-with-spaces')
        expect(slugify('  Multiple---Dashes  ')).toBe('multiple-dashes')
      })
    })
  })

  describe('Number utilities', () => {
    describe('clamp', () => {
      it('should clamp values within range', () => {
        expect(clamp(5, 1, 10)).toBe(5)
        expect(clamp(-5, 1, 10)).toBe(1)
        expect(clamp(15, 1, 10)).toBe(10)
      })
    })

    describe('isPositiveInteger', () => {
      it('should identify positive integers', () => {
        expect(isPositiveInteger(5)).toBe(true)
        expect(isPositiveInteger(0)).toBe(false)
        expect(isPositiveInteger(-5)).toBe(false)
        expect(isPositiveInteger(5.5)).toBe(false)
      })
    })

    describe('roundToDecimals', () => {
      it('should round to specified decimal places', () => {
        expect(roundToDecimals(3.14159, 2)).toBe(3.14)
        expect(roundToDecimals(2.5, 0)).toBe(3)
        // Note: 1.005 rounds to 1.00 due to IEEE 754 floating point representation
        expect(roundToDecimals(1.005, 2)).toBe(1.0)
        expect(roundToDecimals(1.015, 2)).toBe(1.01)
      })
    })
  })

  describe('Array utilities', () => {
    describe('removeDuplicates', () => {
      it('should remove duplicate values', () => {
        expect(removeDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
        expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
      })
    })

    describe('chunk', () => {
      it('should split array into chunks', () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
        expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]])
      })
    })

    describe('shuffle', () => {
      it('should shuffle array elements', () => {
        const original = [1, 2, 3, 4, 5]
        const shuffled = shuffle(original)

        expect(shuffled).toHaveLength(original.length)
        expect(shuffled).not.toBe(original) // Should be a new array
        // All elements should still be present
        expect(shuffled.sort()).toEqual(original.sort())
      })
    })
  })

  describe('Object utilities', () => {
    describe('pick', () => {
      it('should pick specified properties', () => {
        const obj = { a: 1, b: 2, c: 3 }
        expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
      })
    })

    describe('omit', () => {
      it('should omit specified properties', () => {
        const obj = { a: 1, b: 2, c: 3 }
        expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 })
      })
    })

    describe('isEmpty', () => {
      it('should identify empty values', () => {
        expect(isEmpty(null)).toBe(true)
        expect(isEmpty(undefined)).toBe(true)
        expect(isEmpty('')).toBe(true)
        expect(isEmpty([])).toBe(true)
        expect(isEmpty({})).toBe(true)
        expect(isEmpty('text')).toBe(false)
        expect(isEmpty([1])).toBe(false)
        expect(isEmpty({ a: 1 })).toBe(false)
      })
    })
  })

  describe('Date utilities', () => {
    describe('formatDate', () => {
      it('should format date as ISO string', () => {
        const date = new Date('2023-01-01T00:00:00.000Z')
        expect(formatDate(date)).toBe('2023-01-01T00:00:00.000Z')
      })
    })

    describe('addDays', () => {
      it('should add days to date', () => {
        const date = new Date('2023-01-01')
        const result = addDays(date, 5)
        expect(result.getDate()).toBe(6)
      })
    })

    describe('getDaysBetween', () => {
      it('should calculate days between dates', () => {
        const date1 = new Date('2023-01-01')
        const date2 = new Date('2023-01-05')
        expect(getDaysBetween(date1, date2)).toBe(4)
      })
    })
  })

  describe('Pagination utilities', () => {
    describe('validatePagination', () => {
      it('should validate and normalize pagination parameters', () => {
        expect(validatePagination(1, 10)).toEqual({ page: 1, limit: 10, offset: 0 })
        expect(validatePagination(2, 20)).toEqual({ page: 2, limit: 20, offset: 20 })
        expect(validatePagination(-1, 200)).toEqual({ page: 1, limit: 100, offset: 0 })
      })

      it('should use defaults for undefined values', () => {
        expect(validatePagination()).toEqual({ page: 1, limit: 10, offset: 0 })
      })
    })

    describe('calculateTotalPages', () => {
      it('should calculate total pages correctly', () => {
        expect(calculateTotalPages(100, 10)).toBe(10)
        expect(calculateTotalPages(105, 10)).toBe(11)
        expect(calculateTotalPages(0, 10)).toBe(0)
      })
    })
  })

  describe('Async utilities', () => {
    describe('delay', () => {
      it('should delay execution', async () => {
        const start = Date.now()
        await delay(100)
        const end = Date.now()
        expect(end - start).toBeGreaterThanOrEqual(90) // Allow some tolerance
      })
    })

    describe('timeout', () => {
      it('should timeout slow promises', async () => {
        const slowPromise = delay(200)
        await expect(timeout(slowPromise, 100)).rejects.toThrow('Timeout')
      })

      it('should resolve fast promises', async () => {
        const fastPromise = Promise.resolve('success')
        await expect(timeout(fastPromise, 100)).resolves.toBe('success')
      })
    })

    describe('retry', () => {
      it('should retry failed operations', async () => {
        let attempts = 0
        const failingFn = async () => {
          attempts++
          if (attempts < 3) throw new Error('Fail')
          return 'success'
        }

        const result = await retry(failingFn, 3, 10)
        expect(result).toBe('success')
        expect(attempts).toBe(3)
      })

      it('should throw after max attempts', async () => {
        const alwaysFailingFn = async () => {
          throw new Error('Always fails')
        }

        await expect(retry(alwaysFailingFn, 2, 10)).rejects.toThrow('Always fails')
      })
    })
  })

  describe('Environment utilities', () => {
    beforeEach(() => {
      vi.unstubAllEnvs()
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    describe('isDevelopment', () => {
      it('should detect development environment', () => {
        vi.stubEnv('NODE_ENV', 'development')
        expect(isDevelopment()).toBe(true)

        vi.stubEnv('NODE_ENV', 'production')
        expect(isDevelopment()).toBe(false)
      })
    })

    describe('isProduction', () => {
      it('should detect production environment', () => {
        vi.stubEnv('NODE_ENV', 'production')
        expect(isProduction()).toBe(true)

        vi.stubEnv('NODE_ENV', 'development')
        expect(isProduction()).toBe(false)
      })
    })

    describe('isTest', () => {
      it('should detect test environment', () => {
        vi.stubEnv('NODE_ENV', 'test')
        expect(isTest()).toBe(true)

        vi.stubEnv('NODE_ENV', 'development')
        expect(isTest()).toBe(false)
      })
    })
  })

  describe('Random utilities', () => {
    describe('generateRandomString', () => {
      it('should generate string of correct length', () => {
        const result = generateRandomString(10)
        expect(result).toHaveLength(10)
        expect(typeof result).toBe('string')
      })

      it('should generate different strings', () => {
        const str1 = generateRandomString(10)
        const str2 = generateRandomString(10)
        expect(str1).not.toBe(str2)
      })
    })

    describe('generateUuid', () => {
      it('should generate valid UUID format', () => {
        const uuid = generateUuid()
        expect(isValidUuid(uuid)).toBe(true)
      })

      it('should generate different UUIDs', () => {
        const uuid1 = generateUuid()
        const uuid2 = generateUuid()
        expect(uuid1).not.toBe(uuid2)
      })
    })
  })

  describe('Password utilities', () => {
    describe('isValidPassword', () => {
      it('should validate password length', () => {
        expect(isValidPassword('12345678')).toBe(true) // Min length
        expect(isValidPassword('1234567')).toBe(false) // Too short
        expect(isValidPassword('a'.repeat(129))).toBe(false) // Too long
        expect(isValidPassword('a'.repeat(128))).toBe(true) // Max length
      })
    })
  })

  describe('Type assertion utilities', () => {
    describe('assertNever', () => {
      it('should throw error for unexpected values', () => {
        expect(() => assertNever('unexpected' as never)).toThrow('Unexpected value: unexpected')
      })
    })

    describe('Type guards', () => {
      it('should identify strings', () => {
        expect(isString('hello')).toBe(true)
        expect(isString(123)).toBe(false)
        expect(isString(null)).toBe(false)
      })

      it('should identify numbers', () => {
        expect(isNumber(123)).toBe(true)
        expect(isNumber(NaN)).toBe(false)
        expect(isNumber('123')).toBe(false)
      })

      it('should identify booleans', () => {
        expect(isBoolean(true)).toBe(true)
        expect(isBoolean(false)).toBe(true)
        expect(isBoolean('true')).toBe(false)
      })

      it('should identify objects', () => {
        expect(isObject({})).toBe(true)
        expect(isObject({ a: 1 })).toBe(true)
        expect(isObject([])).toBe(false)
        expect(isObject(null)).toBe(false)
        expect(isObject('string')).toBe(false)
      })
    })
  })
})
