import { err } from '@/shared/errors'

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
        throw err('INTERNAL_SERVER_ERROR', 'Invalid where clause construction')
    }

    return where
}

export function applyCursor<T extends Record<string, unknown>>(
    where: T,
    cursor: string | null,
    sortBy: keyof T,
    sortDir: string
): T {
    if (!cursor) return where

    // Validate sortDir at runtime
    if (sortDir !== 'asc' && sortDir !== 'desc') {
        throw err('VALIDATION_ERROR', 'Invalid sort direction')
    }

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
        throw err('VALIDATION_ERROR', 'Invalid cursor')
    }
}

export function buildOrderBy(sortBy: string, sortDir?: string) {
    // Validate sortDir at runtime
    if (sortDir && sortDir !== 'asc' && sortDir !== 'desc') {
        throw err('VALIDATION_ERROR', 'Invalid sort direction')
    }
    const direction = sortDir || 'desc'
    return [{ [sortBy]: direction }, { id: direction }]
}

// Build orderBy for nested paths like "owner.email"; falls back to direct fields
export function buildOrderByPath(sortByPath: string, sortDir?: string) {
    if (sortDir && sortDir !== 'asc' && sortDir !== 'desc') {
        throw err('VALIDATION_ERROR', 'Invalid sort direction')
    }
    const direction = sortDir || 'desc'
    const parts = sortByPath.split('.').filter(Boolean)
    if (parts.length <= 1) return buildOrderBy(sortByPath, direction)

    // Build nested object like { owner: { email: 'desc' } }
    const nested = parts.reduceRight<Record<string, unknown>>((acc, key, idx) => {
        if (idx === parts.length - 1) return { [key]: direction }
        return { [key]: acc }
    }, {})

    return [nested, { id: direction }]
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

// Cursor pagination that uses a custom getter for the sort value (e.g., item.owner?.email)
export function buildPaginationWith<T extends { id: string }>(
    items: T[],
    limit: number,
    getSortValue: (item: T) => unknown
): { items: T[]; hasNext: boolean; nextCursor?: string } {
    const hasNext = items.length > limit
    const finalItems = hasNext ? items.slice(0, limit) : items

    if (!hasNext || finalItems.length === 0) {
        return { items: finalItems, hasNext: false }
    }

    const lastItem = finalItems[finalItems.length - 1]
    if (!lastItem) return { items: finalItems, hasNext: false }

    const nextCursor = Buffer.from(
        JSON.stringify({ lastValue: getSortValue(lastItem), lastId: lastItem.id })
    ).toString('base64')

    return { items: finalItems, hasNext, nextCursor }
}

// Apply cursor for nested sort paths like "owner.email"; keeps tie-breaker by id
export function applyCursorByPath<T extends Record<string, unknown>>(
    where: T,
    cursor: string | null,
    sortByPath: string,
    sortDir: string
): T {
    if (!cursor) return where

    if (sortDir !== 'asc' && sortDir !== 'desc') {
        throw err('VALIDATION_ERROR', 'Invalid sort direction')
    }

    const parts = sortByPath.split('.').filter(Boolean)

    try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString()) as {
            lastValue: unknown
            lastId: string
        }
        const { lastValue, lastId } = decoded
        const op = sortDir === 'desc' ? 'lt' : 'gt'

        // Helper to build nested object for comparisons
        const wrap = (leaf: unknown): Record<string, unknown> => {
            return parts.reduceRight<Record<string, unknown>>((acc, key, idx) => {
                if (idx === parts.length - 1) return { [key]: leaf }
                return { [key]: acc }
            }, {})
        }

        const cond1 = wrap({ [op]: lastValue })
        const cond2 = { ...wrap(lastValue), id: { [op]: lastId } }

        return { ...where, OR: [cond1, cond2] } satisfies T
    } catch {
        throw err('VALIDATION_ERROR', 'Invalid cursor')
    }
}

// Range validation helper
export function validateRange(
    min: number | undefined,
    max: number | undefined,
    minFieldName: string,
    maxFieldName: string
): void {
    if (min !== undefined && max !== undefined && min > max) {
        throw err('VALIDATION_ERROR', `${minFieldName} cannot be greater than ${maxFieldName}`)
    }
    if (min !== undefined && min < 0) {
        throw err('VALIDATION_ERROR', `${minFieldName} must be positive`)
    }
    if (max !== undefined && max < 0) {
        throw err('VALIDATION_ERROR', `${maxFieldName} must be positive`)
    }
}

// Build a Prisma-compatible numeric range using validateRange
export function buildRange(
    minFieldName: string,
    min: number | undefined,
    maxFieldName: string,
    max: number | undefined
): { gte?: number; lte?: number } | undefined {
    if (min === undefined && max === undefined) return undefined
    validateRange(min, max, minFieldName, maxFieldName)
    return {
        ...(min !== undefined ? { gte: min } : {}),
        ...(max !== undefined ? { lte: max } : {}),
    }
}
