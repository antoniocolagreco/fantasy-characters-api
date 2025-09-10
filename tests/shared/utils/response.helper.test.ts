import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Pagination } from '@/shared/schemas'
import { paginated, success, successMessage } from '@/shared/utils/response.helper'

describe('response.helper', () => {
    const mockTimestamp = '2025-09-07T10:30:00.000Z'

    beforeEach(() => {
        // Mock Date.prototype.toISOString to return consistent timestamp
        vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockTimestamp)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('success()', () => {
        it('should return success response with data and timestamp', () => {
            const testData = { id: '123', name: 'Test User' }

            const result = success(testData)

            expect(result).toEqual({
                data: testData,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should include requestId when provided', () => {
            const testData = { id: '123' }
            const requestId = 'req-456'

            const result = success(testData, requestId)

            expect(result).toEqual({
                data: testData,
                requestId,
                timestamp: mockTimestamp,
            })
        })

        it('should handle null data', () => {
            const result = success(null)

            expect(result).toEqual({
                data: null,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should handle undefined data', () => {
            const result = success(undefined)

            expect(result).toEqual({
                data: undefined,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should handle array data', () => {
            const testData = [{ id: '1' }, { id: '2' }]

            const result = success(testData)

            expect(result).toEqual({
                data: testData,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should handle primitive data types', () => {
            expect(success('string')).toEqual({
                data: 'string',
                requestId: undefined,
                timestamp: mockTimestamp,
            })

            expect(success(42)).toEqual({
                data: 42,
                requestId: undefined,
                timestamp: mockTimestamp,
            })

            expect(success(true)).toEqual({
                data: true,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })
    })

    describe('successMessage()', () => {
        it('should return success response with message and timestamp', () => {
            const message = 'Operation completed successfully'

            const result = successMessage(message)

            expect(result).toEqual({
                message,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should include requestId when provided', () => {
            const message = 'User created successfully'
            const requestId = 'req-789'

            const result = successMessage(message, requestId)

            expect(result).toEqual({
                message,
                requestId,
                timestamp: mockTimestamp,
            })
        })

        it('should handle empty message', () => {
            const result = successMessage('')

            expect(result).toEqual({
                message: '',
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should handle long message', () => {
            const longMessage = 'A'.repeat(1000)

            const result = successMessage(longMessage)

            expect(result).toEqual({
                message: longMessage,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })
    })

    describe('paginated()', () => {
        const mockPagination: Pagination = {
            limit: 20,
            hasNext: true,
            hasPrev: false,
            startCursor: 'start-123',
            endCursor: 'end-456',
        }

        it('should return paginated response with items and pagination', () => {
            const items = [{ id: '1' }, { id: '2' }]

            const result = paginated(items, mockPagination)

            expect(result).toEqual({
                data: items,
                pagination: mockPagination,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should include requestId when provided', () => {
            const items = [{ id: '1' }]
            const requestId = 'req-pagination'

            const result = paginated(items, mockPagination, requestId)

            expect(result).toEqual({
                data: items,
                pagination: mockPagination,
                requestId,
                timestamp: mockTimestamp,
            })
        })

        it('should handle empty items array', () => {
            const emptyItems: unknown[] = []

            const result = paginated(emptyItems, mockPagination)

            expect(result).toEqual({
                data: emptyItems,
                pagination: mockPagination,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should handle pagination without cursors', () => {
            const items = [{ id: '1' }]
            const paginationNoCursors: Pagination = {
                limit: 10,
                hasNext: false,
                hasPrev: false,
            }

            const result = paginated(items, paginationNoCursors)

            expect(result).toEqual({
                data: items,
                pagination: paginationNoCursors,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should preserve original pagination object reference', () => {
            const items = [{ id: '1' }]

            const result = paginated(items, mockPagination)

            expect(result.pagination).toBe(mockPagination)
        })

        it('should handle large datasets', () => {
            const largeItems = Array.from({ length: 1000 }, (_, i) => ({ id: i.toString() }))

            const result = paginated(largeItems, mockPagination)

            expect(result.data).toHaveLength(1000)
            expect(result.data[0]).toEqual({ id: '0' })
            expect(result.data[999]).toEqual({ id: '999' })
        })
    })

    describe('success() with different scenarios', () => {
        it('should return success response for resource creation with timestamp', () => {
            const testData = { id: '123', name: 'New User' }

            const result = success(testData)

            expect(result).toEqual({
                data: testData,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should include requestId for resource creation when provided', () => {
            const testData = { id: '456' }
            const requestId = 'req-created'

            const result = success(testData, requestId)

            expect(result).toEqual({
                data: testData,
                requestId,
                timestamp: mockTimestamp,
            })
        })

        it('should handle resource creation with minimal data', () => {
            const testData = { id: '789' }

            const result = success(testData)

            expect(result).toEqual({
                data: testData,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should handle resource creation with complex data', () => {
            const testData = { id: '999', metadata: { created: true, version: 'v2' } }

            const result = success(testData)

            expect(result.data.id).toBe('999')
            expect(result.data.metadata.created).toBe(true)
        })

        it('should handle null data for action completion', () => {
            const result = success(null)

            expect(result).toEqual({
                data: null,
                requestId: undefined,
                timestamp: mockTimestamp,
            })
        })

        it('should preserve original data object reference for created resources', () => {
            const testData = { id: '123', nested: { value: 'test' } }

            const result = success(testData)

            expect(result.data).toBe(testData)
            expect(result.data.nested).toBe(testData.nested)
        })
    })

    describe('timestamp generation', () => {
        it('should generate fresh timestamps for each call', () => {
            vi.restoreAllMocks() // Use real Date for this test

            const result1 = success({ id: '1' })

            // Small delay to ensure different timestamps
            const start = Date.now()
            while (Date.now() - start < 1) {
                // Busy wait for 1ms
            }

            const result2 = success({ id: '2' })

            expect(result1.timestamp).not.toBe(result2.timestamp)
            expect(new Date(result1.timestamp).getTime()).toBeLessThan(
                new Date(result2.timestamp).getTime()
            )
        })

        it('should generate valid ISO timestamp format', () => {
            vi.restoreAllMocks() // Use real Date for this test

            const result = success({ test: true })

            expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
            expect(() => new Date(result.timestamp)).not.toThrow()
        })
    })

    describe('type safety and generics', () => {
        it('should preserve data types in success response', () => {
            interface TestUser {
                id: string
                name: string
                active: boolean
            }

            const userData: TestUser = { id: '123', name: 'Test', active: true }
            const result = success(userData)

            // TypeScript should infer the correct type
            expect(result.data.id).toBe('123')
            expect(result.data.name).toBe('Test')
            expect(result.data.active).toBe(true)
        })

        it('should preserve array types in paginated response', () => {
            interface TestItem {
                value: number
            }

            const items: TestItem[] = [{ value: 1 }, { value: 2 }]
            const pagination: Pagination = {
                limit: 10,
                hasNext: false,
                hasPrev: false,
            }

            const result = paginated(items, pagination)

            expect(result.data).toHaveLength(2)
            if (result.data.length > 0) {
                expect(result.data[0]?.value).toBe(1)
            }
            if (result.data.length > 1) {
                expect(result.data[1]?.value).toBe(2)
            }
        })
    })
})
