import type { Pagination } from '@/shared/schemas'

/**
 * Centralized response helpers to eliminate duplication across controllers
 * Follows response-templates.md patterns
 */

export function success<T>(data: T, requestId?: string) {
    return {
        data,
        requestId,
        timestamp: new Date().toISOString(),
    }
}

export function successMessage(message: string, requestId?: string) {
    return {
        message,
        requestId,
        timestamp: new Date().toISOString(),
    }
}

export function paginated<T>(items: T[], pagination: Pagination, requestId?: string) {
    return {
        data: items,
        pagination,
        requestId,
        timestamp: new Date().toISOString(),
    }
}
