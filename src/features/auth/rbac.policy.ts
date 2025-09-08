import type { Action, RbacContext, RbacUser, Resource, UserCanOptions } from './rbac.schema'

/**
 * Core RBAC policy function that determines if a user can perform an action
 * Based on the RBAC specification in docs/authorization.md
 */
export function can(ctx: RbacContext): boolean {
    const { user, resource, action, ownerId, visibility, ownerRole, targetUserRole } = ctx
    const role = user?.role

    // 1) Anonymous users - only read PUBLIC content
    // Only allow reads of specific resources with PUBLIC visibility
    if (!role) {
        return action === 'read' && visibility === 'PUBLIC'
    }

    // 2) Admin - can do everything except modify other admins and manage own role
    if (role === 'ADMIN') {
        // Cannot modify/delete other ADMIN accounts or change their roles
        if (
            resource === 'users' &&
            (action === 'update' || action === 'delete' || action === 'manage')
        ) {
            const targetIsAdmin = targetUserRole === 'ADMIN'
            const actingOnSelf = !!user && !!ownerId && user.id === ownerId

            // Cannot manage (change roles) even on own account
            if (action === 'manage' && actingOnSelf) {
                return false
            }

            // Cannot modify other admins
            if (targetIsAdmin && !actingOnSelf) {
                return false
            }
        }
        return true
    }

    // 3) Owner - can do most things with their own content
    const isOwner = !!user && !!ownerId && user.id === ownerId
    if (isOwner) {
        // Users cannot manage (change roles, etc.) even on their own account
        if (resource === 'users' && action === 'manage') {
            return false
        }
        // Allow all other actions on owned content
        return action !== 'manage'
    }

    // 4) Moderator (non-owner) - special content management powers
    if (role === 'MODERATOR') {
        // Can read anything
        if (action === 'read') {
            return true
        }

        // Can create content
        if (action === 'create') {
            return true
        }

        // Users resource: can only manage bans for USER targets
        if (resource === 'users') {
            if (action === 'manage') {
                return targetUserRole === 'USER'
            }
            return false
        }

        // Content resources: can update/delete USER-owned or orphaned content
        const isOrphan = ownerId == null
        const ownedByUser = ownerRole === 'USER'
        if ((action === 'update' || action === 'delete') && (isOrphan || ownedByUser)) {
            return true
        }

        return false
    }

    // 5) Regular user - can create content and read PUBLIC content
    if (role === 'USER') {
        // Can create their own content (ownerId should match user.id or be undefined for new content)
        if (action === 'create') {
            // For create operations, either no ownerId is set (new content) or it matches the user
            return !ownerId || ownerId === user.id
        }

        // Can only read PUBLIC content
        // Allow read attempts when visibility is undefined (service layer will handle filtering)
        if (action === 'read' && (visibility === 'PUBLIC' || visibility === undefined)) {
            return true
        }

        // Allow update/delete attempts on their own content or non-existent resources
        // Service layer will handle 404 for non-existent and 403 for unauthorized access
        if (
            (action === 'update' || action === 'delete') &&
            (ownerId === user.id || ownerId === undefined || ownerId === null)
        ) {
            return true
        }

        return false
    }

    // 6) Fallback for any other cases - deny
    return false
}

/**
 * Check if a user can perform an action on a resource
 * Convenience wrapper with defaults
 */
export function userCan(
    user: RbacUser | undefined,
    action: Action,
    resource: Resource,
    options: UserCanOptions = {}
): boolean {
    return can({
        user,
        action,
        resource,
        ownerId: options.ownerId ?? undefined,
        visibility: options.visibility,
        ownerRole: options.ownerRole,
        targetUserRole: options.targetUserRole,
    })
}
