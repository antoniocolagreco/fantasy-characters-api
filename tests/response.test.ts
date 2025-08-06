/**
 * Tests for Response Utilities
 */

import {
    createSuccessResponse,
    createErrorResponse,
    createPaginationMeta,
    validatePagination
} from '../src/utils/response.js'

describe('Response Utilities', () => {
    describe('createSuccessResponse', () => {
        test('should create success response without meta', () => {
            const data = { id: 1, name: 'Test' }
            const response = createSuccessResponse(data)

            expect(response.success).toBe(true)
            expect(response.data).toEqual(data)
            expect(response.timestamp).toBeDefined()
            expect(new Date(response.timestamp)).toBeInstanceOf(Date)
            expect(response.meta).toBeUndefined()
        })

        test('should create success response with meta', () => {
            const data = { id: 1, name: 'Test' }
            const meta = {
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 100,
                    totalPages: 10
                },
                version: '1.0.0'
            }
            const response = createSuccessResponse(data, meta)

            expect(response.success).toBe(true)
            expect(response.data).toEqual(data)
            expect(response.meta).toEqual(meta)
        })
    })

    describe('createErrorResponse', () => {
        test('should create error response with minimal data', () => {
            const response = createErrorResponse('TEST_ERROR', 'Test error message')

            expect(response.success).toBe(false)
            expect(response.error.code).toBe('TEST_ERROR')
            expect(response.error.message).toBe('Test error message')
            expect(response.error.timestamp).toBeDefined()
            expect(new Date(response.error.timestamp)).toBeInstanceOf(Date)
            expect(response.error.details).toBeUndefined()
            expect(response.error.path).toBeUndefined()
            expect(response.error.requestId).toBeUndefined()
        })

        test('should create error response with all optional data', () => {
            const details = { field: 'email', rule: 'format' }
            const response = createErrorResponse('VALIDATION_ERROR', 'Invalid email', details, '/api/users', 'req-123')

            expect(response.error.details).toEqual(details)
            expect(response.error.path).toBe('/api/users')
            expect(response.error.requestId).toBe('req-123')
        })
    })

    describe('createPaginationMeta', () => {
        test('should create pagination meta', () => {
            const meta = createPaginationMeta(2, 10, 25)

            expect(meta).toEqual({
                page: 2,
                limit: 10,
                total: 25,
                totalPages: 3
            })
        })

        test('should handle edge cases', () => {
            // Zero total
            const metaZero = createPaginationMeta(1, 10, 0)
            expect(metaZero.totalPages).toBe(0)

            // Exact division
            const metaExact = createPaginationMeta(1, 10, 20)
            expect(metaExact.totalPages).toBe(2)

            // Single item
            const metaSingle = createPaginationMeta(1, 10, 1)
            expect(metaSingle.totalPages).toBe(1)
        })
    })

    describe('validatePagination', () => {
        test('should use defaults when no parameters provided', () => {
            const result = validatePagination()

            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.offset).toBe(0)
        })

        test('should validate and sanitize page parameter', () => {
            // Valid page
            expect(validatePagination(5).page).toBe(5)

            // Negative page
            expect(validatePagination(-1).page).toBe(1)

            // Zero page
            expect(validatePagination(0).page).toBe(1)

            // Undefined page
            expect(validatePagination(undefined, 20).page).toBe(1)
        })

        test('should validate and sanitize limit parameter', () => {
            // Valid limit
            expect(validatePagination(1, 20).limit).toBe(20)

            // Negative limit
            expect(validatePagination(1, -5).limit).toBe(1)

            // Zero limit
            expect(validatePagination(1, 0).limit).toBe(1)

            // Limit too high
            expect(validatePagination(1, 200).limit).toBe(100)

            // Undefined limit
            expect(validatePagination(2).limit).toBe(10)
        })

        test('should calculate correct offset', () => {
            expect(validatePagination(1, 10).offset).toBe(0)
            expect(validatePagination(2, 10).offset).toBe(10)
            expect(validatePagination(3, 15).offset).toBe(30)
        })
    })
})
