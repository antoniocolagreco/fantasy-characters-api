import { Type, type Static } from '@sinclair/typebox'

// Base pagination query schema
export const PaginationQuerySchema = Type.Object({
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
    cursor: Type.Optional(Type.String()),
})

export type PaginationQuery = Static<typeof PaginationQuerySchema>

// Base pagination response schema
export const PaginationResponseSchema = Type.Object({
    limit: Type.Integer(),
    cursor: Type.Optional(
        Type.Object({
            next: Type.Optional(Type.String()),
            prev: Type.Optional(Type.String()),
        })
    ),
})

export type PaginationResponse = Static<typeof PaginationResponseSchema>

// Generic query building functions
export function buildWhere<T extends Record<string, unknown>>(filters: Partial<T>): T {
    const where: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
            where[key] = value
        }
    }

    // Type guard to ensure where conforms to T
    function isValidWhereClause(obj: Record<string, unknown>): obj is T {
        // Since T extends Record<string, unknown>, any object with string keys
        // and unknown values that matches the filtered structure is valid
        return typeof obj === 'object' && obj !== null
    }

    if (!isValidWhereClause(where)) {
        throw new Error('Invalid where clause construction')
    }

    return where
}

export function applyCursor<T extends Record<string, unknown>>(
    where: T,
    cursor: string | null,
    sortBy: keyof T,
    sortDir: 'asc' | 'desc'
): T {
    if (!cursor) return where

    try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString()) as {
            lastValue: unknown
            lastId: string
        }
        const { lastValue, lastId } = decoded
        const op = sortDir === 'desc' ? 'lt' : 'gt'

        return {
            ...where,
            OR: [{ [sortBy]: { [op]: lastValue } }, { [sortBy]: lastValue, id: { [op]: lastId } }],
        } satisfies T
    } catch {
        throw new Error('Invalid cursor')
    }
}

export function buildOrderBy(sortBy: string, sortDir: 'asc' | 'desc') {
    return [{ [sortBy]: sortDir }, { id: sortDir }]
}

export function buildPagination<T extends { id: string }>(
    items: T[],
    limit: number,
    sortField: keyof T
): { items: T[]; hasNext: boolean; nextCursor?: string } {
    const hasNext = items.length > limit
    const finalItems = hasNext ? items.slice(0, limit) : items

    if (!hasNext || finalItems.length === 0) {
        return { items: finalItems, hasNext: false }
    }

    const lastItem = finalItems[finalItems.length - 1]
    if (!lastItem) {
        return { items: finalItems, hasNext: false }
    }

    const nextCursor = Buffer.from(
        JSON.stringify({
            lastValue: lastItem[sortField],
            lastId: lastItem.id,
        })
    ).toString('base64')

    return { items: finalItems, hasNext, nextCursor }
}

// Range validation helper
export function validateRange(
    min: number | undefined,
    max: number | undefined,
    minFieldName: string,
    maxFieldName: string
): void {
    if (min !== undefined && max !== undefined && min > max) {
        throw new Error(`${minFieldName} cannot be greater than ${maxFieldName}`)
    }
    if (min !== undefined && min < 0) {
        throw new Error(`${minFieldName} must be positive`)
    }
    if (max !== undefined && max < 0) {
        throw new Error(`${maxFieldName} must be positive`)
    }
}
