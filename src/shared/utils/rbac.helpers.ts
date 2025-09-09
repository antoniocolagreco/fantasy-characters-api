/**
 * RBAC Utility Helpers
 *
 * Reusable security functions following the new RBAC architecture.
 * These helpers are used in SERVICE layer for consistent permission checking.
 */

import type { AuthenticatedUser } from '@/features/auth'
import type { Role, Visibility } from '@/shared/schemas'

/**
 * Apply security constraints to any filter object for DATABASE queries
 *
 * This is the core function that SERVICE layer uses to build secure filters
 * that REPOSITORY layer applies directly to database queries.
 */
export function applySecurityFilters<T extends Record<string, unknown>>(
    filters: T,
    user?: AuthenticatedUser
): T {
    if (!user) {
        // Anonymous users: only PUBLIC content
        if (filters.OR) {
            // If there are existing OR conditions, combine with AND
            return {
                AND: [{ OR: filters.OR }, { visibility: 'PUBLIC' }],
            } as unknown as T
        }
        return { ...filters, visibility: 'PUBLIC' } as T
    }

    if (user.role === 'ADMIN') {
        // Admin: no security restrictions
        return filters
    }

    if (user.role === 'MODERATOR') {
        // Moderator: PUBLIC + PRIVATE + HIDDEN + own content (read-only for others' PRIVATE/HIDDEN)
        const securityFilter = {
            OR: [
                { visibility: 'PUBLIC' },
                { visibility: 'PRIVATE' },
                { visibility: 'HIDDEN' },
                { ownerId: user.id },
            ],
        }

        if (filters.OR) {
            // If there are existing OR conditions, combine with AND
            return {
                AND: [{ OR: filters.OR }, securityFilter],
            } as unknown as T
        }
        return { ...filters, ...securityFilter } as T
    }

    // Regular USER: PUBLIC + own content
    const securityFilter = {
        OR: [{ visibility: 'PUBLIC' }, { ownerId: user.id }],
    }

    if (filters.OR) {
        // If there are existing OR conditions, combine with AND
        return {
            AND: [{ OR: filters.OR }, securityFilter],
        } as unknown as T
    }
    return { ...filters, ...securityFilter } as T
}

/**
 * Check if user can modify a specific resource
 *
 * Used in SERVICE layer for UPDATE/DELETE operations.
 */
export function canModifyResource(
    user: AuthenticatedUser | undefined,
    resource: { ownerId?: string | null; ownerRole?: Role | null; visibility?: string | null }
): boolean {
    if (!user) return false

    // Owner can always modify their own content
    if (resource.ownerId === user.id) return true

    // Admin can modify non-admin content
    if (user.role === 'ADMIN') {
        return resource.ownerRole !== 'ADMIN' || resource.ownerId === user.id
    }

    // Moderator can modify USER content or orphaned content
    if (user.role === 'MODERATOR') {
        // Cannot modify others' PRIVATE or HIDDEN content
        const isOthers = resource.ownerId && resource.ownerId !== user.id
        const isRestrictedVisibility =
            resource.visibility === 'PRIVATE' || resource.visibility === 'HIDDEN'
        if (isOthers && isRestrictedVisibility) return false
        return !resource.ownerId || resource.ownerRole === 'USER'
    }

    return false
}

/**
 * Check if user can view a specific resource
 *
 * Used in SERVICE layer for READ operations on specific resources.
 */
export function canViewResource(
    user: AuthenticatedUser | undefined,
    resource: { ownerId?: string | null; visibility?: Visibility | string | null }
): boolean {
    if (!user) return resource.visibility === 'PUBLIC'

    // Admin can see everything
    if (user.role === 'ADMIN') return true

    // Owner can see own content regardless of visibility
    if (resource.ownerId === user.id) return true

    // Moderator can see PUBLIC and HIDDEN
    if (user.role === 'MODERATOR') {
        return ['PUBLIC', 'HIDDEN', 'PRIVATE'].includes(resource.visibility as string)
    }

    // Regular user can only see PUBLIC
    return resource.visibility === 'PUBLIC'
}

/**
 * Check if user can create content with specific ownership
 *
 * Used in SERVICE layer for CREATE operations.
 */
export function canCreateResource(
    user: AuthenticatedUser | undefined,
    targetOwnerId?: string
): boolean {
    if (!user) return false

    // Admin can create content for anyone
    if (user.role === 'ADMIN') return true

    // Moderator can create content for themselves or orphaned
    if (user.role === 'MODERATOR') {
        return !targetOwnerId || targetOwnerId === user.id
    }

    // Regular user can only create content for themselves
    return !targetOwnerId || targetOwnerId === user.id
}

/**
 * Build security filters specifically for USER management
 *
 * Special case for user-related operations.
 */
export function applyUserSecurityFilters<T extends Record<string, unknown>>(
    filters: T,
    user?: AuthenticatedUser
): T {
    if (!user) {
        // Anonymous: no users visible - use a UUID format that will never match
        return { ...filters, id: '00000000-0000-0000-0000-000000000000' } as T
    }

    if (user.role === 'ADMIN') {
        // Admin: see all users
        return filters
    }

    if (user.role === 'MODERATOR') {
        // Moderator: see USERs + themselves
        const securityFilter = {
            OR: [{ role: 'USER' }, { id: user.id }],
        }
        return { ...filters, ...securityFilter } as T
    }

    // Regular user: only see themselves
    return { ...filters, id: user.id } as T
}

/**
 * Check if user can manage (ban/unban) another user
 *
 * Used for user moderation operations.
 */
export function canManageUser(
    user: AuthenticatedUser | undefined,
    targetUser: { id: string; role: Role }
): boolean {
    if (!user) return false

    // Cannot manage yourself
    if (user.id === targetUser.id) return false

    // Admin can manage non-admin users
    if (user.role === 'ADMIN') {
        return targetUser.role !== 'ADMIN'
    }

    // Moderator can only manage regular users
    if (user.role === 'MODERATOR') {
        return targetUser.role === 'USER'
    }

    return false
}
