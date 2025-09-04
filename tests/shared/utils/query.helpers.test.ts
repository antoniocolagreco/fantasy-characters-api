import { describe, test, expect } from 'vitest'
import {
    buildWhere,
    applyCursor,
    buildOrderBy,
    buildPagination,
    validateRange,
    PaginationQuerySchema,
    PaginationResponseSchema,
} from '@/shared/utils/query.helpers'

describe('Query Helpers', () => {
    describe('buildWhere', () => {
        test('should filter out undefined and null values', () => {
            const filters = {
                name: 'John',
                age: undefined,
                email: null,
                active: true,
                count: 0,
            }

            const result = buildWhere(filters)

            expect(result).toEqual({
                name: 'John',
                active: true,
                count: 0,
            })
        })

        test('should return empty object for empty filters', () => {
            const result = buildWhere({})
            expect(result).toEqual({})
        })

        test('should preserve falsy values except undefined and null', () => {
            const filters = {
                name: '',
                count: 0,
                active: false,
                rating: undefined,
                description: null,
            }

            const result = buildWhere(filters)

            expect(result).toEqual({
                name: '',
                count: 0,
                active: false,
            })
        })
    })

    describe('applyCursor', () => {
        test('should return original where clause when no cursor provided', () => {
            const baseWhere = { visibility: 'PUBLIC', createdAt: '2023-01-01' }
            const result = applyCursor(baseWhere, null, 'createdAt', 'desc')
            expect(result).toEqual(baseWhere)
        })

        test('should apply cursor pagination for descending sort', () => {
            const cursor = Buffer.from(
                JSON.stringify({ lastValue: '2023-01-01', lastId: 'id123' })
            ).toString('base64')

            const baseWhere = { visibility: 'PUBLIC', createdAt: '2023-01-01' }
            const result = applyCursor(baseWhere, cursor, 'createdAt', 'desc')

            expect(result).toEqual({
                visibility: 'PUBLIC',
                createdAt: '2023-01-01',
                OR: [
                    { createdAt: { lt: '2023-01-01' } },
                    { createdAt: '2023-01-01', id: { lt: 'id123' } },
                ],
            })
        })

        test('should apply cursor pagination for ascending sort', () => {
            const cursor = Buffer.from(
                JSON.stringify({ lastValue: '2023-01-01', lastId: 'id123' })
            ).toString('base64')

            const baseWhere = { visibility: 'PUBLIC', createdAt: '2023-01-01' }
            const result = applyCursor(baseWhere, cursor, 'createdAt', 'asc')

            expect(result).toEqual({
                visibility: 'PUBLIC',
                createdAt: '2023-01-01',
                OR: [
                    { createdAt: { gt: '2023-01-01' } },
                    { createdAt: '2023-01-01', id: { gt: 'id123' } },
                ],
            })
        })

        test('should throw error for invalid cursor', () => {
            const baseWhere = { visibility: 'PUBLIC', createdAt: '2023-01-01' }
            expect(() => {
                applyCursor(baseWhere, 'invalid-cursor', 'createdAt', 'desc')
            }).toThrow('Invalid cursor')
        })

        test('should throw error for malformed base64 cursor', () => {
            const invalidCursor = 'not-base64!'
            const baseWhere = { visibility: 'PUBLIC', createdAt: '2023-01-01' }
            expect(() => {
                applyCursor(baseWhere, invalidCursor, 'createdAt', 'desc')
            }).toThrow('Invalid cursor')
        })
    })

    describe('buildOrderBy', () => {
        test('should build order by with tie-breaker for descending sort', () => {
            const result = buildOrderBy('createdAt', 'desc')
            expect(result).toEqual([{ createdAt: 'desc' }, { id: 'desc' }])
        })

        test('should build order by with tie-breaker for ascending sort', () => {
            const result = buildOrderBy('name', 'asc')
            expect(result).toEqual([{ name: 'asc' }, { id: 'asc' }])
        })
    })

    describe('buildPagination', () => {
        const sampleItems = [
            { id: '1', name: 'Item 1', createdAt: '2023-01-01' },
            { id: '2', name: 'Item 2', createdAt: '2023-01-02' },
            { id: '3', name: 'Item 3', createdAt: '2023-01-03' },
        ]

        test('should return all items when under limit', () => {
            const result = buildPagination(sampleItems, 5, 'createdAt')

            expect(result).toEqual({
                items: sampleItems,
                hasNext: false,
            })
        })

        test('should paginate items when over limit', () => {
            const result = buildPagination(sampleItems, 2, 'createdAt')

            expect(result.items).toHaveLength(2)
            expect(result.items).toEqual(sampleItems.slice(0, 2))
            expect(result.hasNext).toBe(true)
            expect(result.nextCursor).toBeDefined()
        })

        test('should generate valid next cursor', () => {
            const result = buildPagination(sampleItems, 2, 'createdAt')

            const decodedCursor = JSON.parse(
                Buffer.from(result.nextCursor!, 'base64').toString()
            ) as {
                lastValue: string
                lastId: string
            }

            expect(decodedCursor).toEqual({
                lastValue: '2023-01-02',
                lastId: '2',
            })
        })

        test('should return no cursor when exactly at limit', () => {
            const result = buildPagination(sampleItems, 3, 'createdAt')

            expect(result).toEqual({
                items: sampleItems,
                hasNext: false,
            })
        })

        test('should handle empty items array', () => {
            const result = buildPagination([], 10, 'createdAt')

            expect(result).toEqual({
                items: [],
                hasNext: false,
            })
        })
    })

    describe('validateRange', () => {
        test('should pass for valid range', () => {
            expect(() => validateRange(1, 10, 'min', 'max')).not.toThrow()
        })

        test('should pass when only min is provided', () => {
            expect(() => validateRange(5, undefined, 'min', 'max')).not.toThrow()
        })

        test('should pass when only max is provided', () => {
            expect(() => validateRange(undefined, 10, 'min', 'max')).not.toThrow()
        })

        test('should pass when neither min nor max is provided', () => {
            expect(() => validateRange(undefined, undefined, 'min', 'max')).not.toThrow()
        })

        test('should throw when min is greater than max', () => {
            expect(() => validateRange(10, 5, 'minLevel', 'maxLevel')).toThrow(
                'minLevel cannot be greater than maxLevel'
            )
        })

        test('should throw when min is negative', () => {
            expect(() => validateRange(-1, 10, 'minAge', 'maxAge')).toThrow(
                'minAge must be positive'
            )
        })

        test('should throw when max is negative', () => {
            expect(() => validateRange(undefined, -5, 'minLevel', 'maxLevel')).toThrow(
                'maxLevel must be positive'
            )
        })

        test('should allow zero values', () => {
            expect(() => validateRange(0, 10, 'min', 'max')).not.toThrow()
            expect(() => validateRange(1, 0, 'min', 'max')).toThrow()
        })
    })

    describe('Schema Types', () => {
        test('PaginationQuerySchema should be properly defined', () => {
            // Test schema structure exists and has expected properties
            expect(PaginationQuerySchema).toBeDefined()
            expect(PaginationQuerySchema.type).toBe('object')
        })

        test('PaginationResponseSchema should be properly defined', () => {
            // Test schema structure exists and has expected properties
            expect(PaginationResponseSchema).toBeDefined()
            expect(PaginationResponseSchema.type).toBe('object')
        })
    })
})
