/**
 * Response Formatters for Fantasy Character API
 *
 * This module provides standardized response formatting utilities
 * to ensure consistent API responses across all endpoints.
 */

import { Static, Type, TSchema } from '@sinclair/typebox'

/**
 * Standard API response format for successful operations
 */
export const ApiResponseSchema = <T extends TSchema>(dataSchema: T) =>
    Type.Object({
        success: Type.Literal(true),
        data: dataSchema,
        timestamp: Type.String({ format: 'date-time' }),
        meta: Type.Optional(
            Type.Object({
                pagination: Type.Optional(
                    Type.Object({
                        page: Type.Number({ minimum: 1 }),
                        limit: Type.Number({ minimum: 1, maximum: 100 }),
                        total: Type.Number({ minimum: 0 }),
                        totalPages: Type.Number({ minimum: 0 })
                    })
                ),
                version: Type.Optional(Type.String()),
                requestId: Type.Optional(Type.String())
            })
        )
    })

/**
 * Standard API error response format
 */
export const ApiErrorResponseSchema = Type.Object({
    success: Type.Literal(false),
    error: Type.Object({
        code: Type.String(),
        message: Type.String(),
        details: Type.Optional(Type.Unknown()),
        timestamp: Type.String({ format: 'date-time' }),
        path: Type.Optional(Type.String()),
        requestId: Type.Optional(Type.String())
    })
})

export type ApiErrorResponse = Static<typeof ApiErrorResponseSchema>

/**
 * Pagination metadata type
 */
export type PaginationMeta = {
    page: number
    limit: number
    total: number
    totalPages: number
}

/**
 * Response metadata type
 */
export type ResponseMeta = {
    pagination?: PaginationMeta
    version?: string
    requestId?: string
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
    data: T,
    meta?: ResponseMeta
): {
    success: true
    data: T
    timestamp: string
    meta?: ResponseMeta
} {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        ...(meta && { meta })
    }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
    code: string,
    message: string,
    details?: unknown,
    path?: string,
    requestId?: string
): ApiErrorResponse {
    return {
        success: false,
        error: {
            code,
            message,
            timestamp: new Date().toISOString(),
            ...(details ? { details } : {}),
            ...(path ? { path } : {}),
            ...(requestId ? { requestId } : {})
        }
    }
}

/**
 * Creates pagination metadata
 */
export function createPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit)

    return {
        page,
        limit,
        total,
        totalPages
    }
}

/**
 * Validates pagination parameters
 */
export function validatePagination(page?: number, limit?: number) {
    const validatedPage = Math.max(1, page || 1)
    const validatedLimit = Math.min(100, Math.max(1, limit === undefined ? 10 : limit))

    return {
        page: validatedPage,
        limit: validatedLimit,
        offset: (validatedPage - 1) * validatedLimit
    }
}
