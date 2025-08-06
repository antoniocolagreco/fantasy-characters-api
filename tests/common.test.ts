/**
 * Tests for Common Utilities
 */

import {
    generateRandomString,
    isNullOrUndefined,
    isValidObject,
    capitalize,
    toKebabCase,
    toCamelCase,
    removeUndefined,
    pick,
    omit
} from '../src/utils/common.js'

describe('Common Utilities', () => {
    describe('String Utilities', () => {
        describe('generateRandomString', () => {
            it('should generate string of specified length', () => {
                expect(generateRandomString(10)).toHaveLength(10)
                expect(generateRandomString(5)).toHaveLength(5)
            })

            it('should generate different strings', () => {
                const str1 = generateRandomString(10)
                const str2 = generateRandomString(10)
                expect(str1).not.toBe(str2)
            })

            it('should handle zero length', () => {
                expect(generateRandomString(0)).toBe('')
            })

            it('should only contain valid characters', () => {
                const str = generateRandomString(100)
                expect(str).toMatch(/^[A-Za-z0-9]+$/)
            })
        })

        describe('capitalize', () => {
            it('should capitalize first letter of string', () => {
                expect(capitalize('hello')).toBe('Hello')
                expect(capitalize('HELLO')).toBe('Hello')
                expect(capitalize('hELLO')).toBe('Hello')
            })

            it('should handle empty string', () => {
                expect(capitalize('')).toBe('')
            })

            it('should handle single character', () => {
                expect(capitalize('a')).toBe('A')
                expect(capitalize('A')).toBe('A')
            })

            it('should handle mixed case', () => {
                expect(capitalize('hELLo WoRLD')).toBe('Hello world')
            })
        })

        describe('toKebabCase', () => {
            it('should convert camelCase to kebab-case', () => {
                expect(toKebabCase('helloWorld')).toBe('hello-world')
                expect(toKebabCase('userProfileData')).toBe('user-profile-data')
            })

            it('should handle PascalCase', () => {
                expect(toKebabCase('HelloWorld')).toBe('-hello-world')
                expect(toKebabCase('UserProfileData')).toBe('-user-profile-data')
            })

            it('should handle already kebab-case', () => {
                expect(toKebabCase('hello-world')).toBe('hello-world')
            })

            it('should handle single word', () => {
                expect(toKebabCase('hello')).toBe('hello')
            })

            it('should handle numbers', () => {
                expect(toKebabCase('version2Update')).toBe('version2-update')
            })
        })

        describe('toCamelCase', () => {
            it('should convert kebab-case to camelCase', () => {
                expect(toCamelCase('hello-world')).toBe('helloWorld')
                expect(toCamelCase('user-profile-data')).toBe('userProfileData')
            })

            it('should handle already camelCase', () => {
                expect(toCamelCase('helloWorld')).toBe('helloWorld')
            })

            it('should handle single word', () => {
                expect(toCamelCase('hello')).toBe('hello')
            })

            it('should handle multiple dashes', () => {
                expect(toCamelCase('hello-world-test')).toBe('helloWorldTest')
            })
        })
    })

    describe('Type Checking Utilities', () => {
        describe('isNullOrUndefined', () => {
            it('should return true for null and undefined', () => {
                expect(isNullOrUndefined(null)).toBe(true)
                expect(isNullOrUndefined(undefined)).toBe(true)
            })

            it('should return false for other values', () => {
                expect(isNullOrUndefined(0)).toBe(false)
                expect(isNullOrUndefined('')).toBe(false)
                expect(isNullOrUndefined(false)).toBe(false)
                expect(isNullOrUndefined({})).toBe(false)
                expect(isNullOrUndefined([])).toBe(false)
                expect(isNullOrUndefined('test')).toBe(false)
            })
        })

        describe('isValidObject', () => {
            it('should return true for valid objects', () => {
                expect(isValidObject({})).toBe(true)
                expect(isValidObject({ key: 'value' })).toBe(true)
                expect(isValidObject({ a: 1, b: 2 })).toBe(true)
            })

            it('should return false for non-objects', () => {
                expect(isValidObject(null)).toBe(false)
                expect(isValidObject(undefined)).toBe(false)
                expect(isValidObject([])).toBe(false)
                expect(isValidObject('string')).toBe(false)
                expect(isValidObject(123)).toBe(false)
                expect(isValidObject(true)).toBe(false)
            })
        })
    })

    describe('Object Utilities', () => {
        describe('removeUndefined', () => {
            it('should remove undefined properties', () => {
                const obj = { a: 1, b: undefined, c: 'test', d: undefined }
                const result = removeUndefined(obj)
                expect(result).toEqual({ a: 1, c: 'test' })
            })

            it('should keep null values', () => {
                const obj = { a: 1, b: null, c: undefined }
                const result = removeUndefined(obj)
                expect(result).toEqual({ a: 1, b: null })
            })

            it('should handle empty object', () => {
                expect(removeUndefined({})).toEqual({})
            })

            it('should handle object with no undefined values', () => {
                const obj = { a: 1, b: 'test' }
                const result = removeUndefined(obj)
                expect(result).toEqual({ a: 1, b: 'test' })
            })
        })

        describe('pick', () => {
            it('should pick specified keys', () => {
                const obj = { a: 1, b: 2, c: 3, d: 4 }
                expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
                expect(pick(obj, ['b'])).toEqual({ b: 2 })
            })

            it('should handle non-existent keys', () => {
                const obj = { a: 1, b: 2 }
                expect(pick(obj, ['c'] as any)).toEqual({})
            })

            it('should handle empty object', () => {
                expect(pick({}, ['a'] as any)).toEqual({})
            })

            it('should handle empty keys array', () => {
                const obj = { a: 1, b: 2 }
                expect(pick(obj, [])).toEqual({})
            })
        })

        describe('omit', () => {
            it('should omit specified keys', () => {
                const obj = { a: 1, b: 2, c: 3, d: 4 }
                expect(omit(obj, ['b', 'd'])).toEqual({ a: 1, c: 3 })
                expect(omit(obj, ['a'])).toEqual({ b: 2, c: 3, d: 4 })
            })

            it('should handle non-existent keys', () => {
                const obj = { a: 1, b: 2 }
                expect(omit(obj, ['c'] as any)).toEqual({ a: 1, b: 2 })
            })

            it('should handle empty object', () => {
                expect(omit({}, ['a'] as any)).toEqual({})
            })

            it('should handle empty keys array', () => {
                const obj = { a: 1, b: 2 }
                expect(omit(obj, [])).toEqual({ a: 1, b: 2 })
            })
        })
    })
})
