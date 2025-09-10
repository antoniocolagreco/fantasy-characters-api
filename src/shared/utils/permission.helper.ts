import type { AuthenticatedUser } from '@/features/auth'
import { err } from '@/shared/errors'
import type { Role, Visibility } from '@/shared/schemas'
import { canModifyResource, canViewResource } from '@/shared/utils/rbac.helpers'

type ResourceLike = {
    ownerId?: string | null
    visibility?: Visibility | string | null
    ownerRole?: Role | null
}

/**
 * Enforce view permission with concealment.
 * Throws 404 (RESOURCE_NOT_FOUND) when the user cannot view the resource.
 */
export function enforceViewPermission(
    user: AuthenticatedUser | undefined,
    resource: ResourceLike,
    notFoundMessage: string
): void {
    if (!canViewResource(user, resource)) {
        throw err('RESOURCE_NOT_FOUND', notFoundMessage)
    }
}

/**
 * Enforce modify permission with concealment first.
 * Throws 404 when not viewable; otherwise throws 403 when not modifiable.
 */
export function enforceModifyPermission(
    user: AuthenticatedUser | undefined,
    resource: ResourceLike,
    notFoundMessage: string,
    forbiddenMessage: string
): void {
    enforceViewPermission(user, resource, notFoundMessage)
    if (!canModifyResource(user, resource)) {
        throw err('FORBIDDEN', forbiddenMessage)
    }
}
