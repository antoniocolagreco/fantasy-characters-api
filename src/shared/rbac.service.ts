/**
 * RBAC Service - Role-Based Access Control
 * Centralizes all authorization logic for the application
 * RBAC is always enabled - no configuration option
 */

import type { Role, Visibility } from '@prisma/client'
import type { AuthUser } from '../auth/auth.types'
import { createForbiddenError, createUnauthorizedError } from './errors'

// Re-export AuthUser for backwards compatibility
export type { AuthUser }

export type ResourceOwnership = {
  ownerId: string | null
  visibility?: Visibility
}

/**
 * RBAC is always enabled - no configuration needed
 */
export const isRbacEnabled = (): boolean => true

/**
 * Role hierarchy - higher numbers have more privileges
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 1,
  MODERATOR: 2,
  ADMIN: 3,
} as const

/**
 * Check if user has required role or higher
 */
export const hasRoleOrHigher = (userRole: Role, requiredRole: Role): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if user can access resource based on visibility
 */
export const canAccessByVisibility = (
  user: AuthUser | undefined,
  resource: { visibility: Visibility; ownerId: string | null },
): boolean => {
  switch (resource.visibility) {
    case 'PUBLIC':
      return true // Everyone can access public resources

    case 'PRIVATE':
      // Only owner, moderators, and admins can access private resources
      if (!user) return false
      return user.id === resource.ownerId || hasRoleOrHigher(user.role, 'MODERATOR')

    case 'HIDDEN':
      // Only admins can access hidden resources
      if (!user) return false
      return hasRoleOrHigher(user.role, 'ADMIN')

    default:
      return false
  }
}

/**
 * Check if user can modify resource (owner, moderator, or admin)
 */
export const canModifyResource = (
  user: AuthUser | undefined,
  resource: ResourceOwnership,
): boolean => {
  if (!user) return false

  // Admins can modify anything
  if (hasRoleOrHigher(user.role, 'ADMIN')) return true

  // Moderators can modify public resources and orphaned resources
  if (hasRoleOrHigher(user.role, 'MODERATOR')) {
    return resource.ownerId === null || resource.visibility === 'PUBLIC'
  }

  // Users can only modify their own resources
  return user.id === resource.ownerId
}

/**
 * Check if user can delete resource
 */
export const canDeleteResource = (
  user: AuthUser | undefined,
  resource: ResourceOwnership,
): boolean => {
  if (!user) return false

  // Admins can delete anything
  if (hasRoleOrHigher(user.role, 'ADMIN')) return true

  // Moderators can delete orphaned resources or manage public content
  if (hasRoleOrHigher(user.role, 'MODERATOR')) {
    return resource.ownerId === null
  }

  // Users can only delete their own resources
  return user.id === resource.ownerId
}

/**
 * Check if user can create resource on behalf of another user
 */
export const canCreateForUser = (user: AuthUser | undefined, targetUserId: string): boolean => {
  if (!user) return false

  // Admins can create for anyone
  if (hasRoleOrHigher(user.role, 'ADMIN')) return true

  // Users can only create for themselves
  return user.id === targetUserId
}

/**
 * Check if user can access another user's profile
 */
export const canAccessUserProfile = (
  currentUser: AuthUser | undefined,
  targetUserId: string,
): boolean => {
  if (!currentUser) return false

  // Admins and moderators can access any profile
  if (hasRoleOrHigher(currentUser.role, 'MODERATOR')) return true

  // Users can access their own profile
  return currentUser.id === targetUserId
}

/**
 * Check if user can modify another user's profile
 */
export const canModifyUserProfile = (
  currentUser: AuthUser | undefined,
  targetUserId: string,
): boolean => {
  if (!currentUser) return false

  // Admins can modify any profile
  if (hasRoleOrHigher(currentUser.role, 'ADMIN')) return true

  // Users can only modify their own profile
  return currentUser.id === targetUserId
}

/**
 * Check if user can access admin features
 */
export const canAccessAdminFeatures = (user: AuthUser | undefined): boolean => {
  if (!user) return false
  return hasRoleOrHigher(user.role, 'ADMIN')
}

/**
 * Check if user can access moderator features
 */
export const canAccessModeratorFeatures = (user: AuthUser | undefined): boolean => {
  if (!user) return false
  return hasRoleOrHigher(user.role, 'MODERATOR')
}

/**
 * Check if user can view statistics
 */
export const canViewStatistics = (user: AuthUser | undefined): boolean => {
  if (!user) return false
  return hasRoleOrHigher(user.role, 'MODERATOR')
}

/**
 * Enforce permission check - throws error if access denied
 */
export const enforcePermission = (hasPermission: boolean, message = 'Access denied'): void => {
  if (!hasPermission) {
    throw createForbiddenError(message)
  }
}

/**
 * Enforce authentication - throws error if user not authenticated
 */
export const enforceAuthentication = (user: AuthUser | undefined): void => {
  if (!user) {
    throw createUnauthorizedError('Authentication required')
  }
}

/**
 * Filter resources based on user permissions
 */
export const filterVisibleResources = <
  T extends { visibility: Visibility; ownerId: string | null },
>(
  user: AuthUser | undefined,
  resources: T[],
): T[] => {
  return resources.filter(resource => canAccessByVisibility(user, resource))
}

/**
 * Get ownership filter for database queries
 */
export const getOwnershipFilter = (
  user: AuthUser | undefined,
): {
  OR?: Array<{
    ownerId?: string | null
    visibility?: Visibility
  }>
} => {
  if (!user) {
    // Non-authenticated users can only see public resources
    return {
      OR: [{ visibility: 'PUBLIC' }],
    }
  }

  if (hasRoleOrHigher(user.role, 'ADMIN')) {
    // Admins can see everything
    return {}
  }

  if (hasRoleOrHigher(user.role, 'MODERATOR')) {
    // Moderators can see public and private resources, plus all hidden
    return {}
  }

  // Regular users can see public resources and their own private resources
  return {
    OR: [{ visibility: 'PUBLIC' }, { ownerId: user.id, visibility: 'PRIVATE' }],
  }
}

export const rbacService = {
  isRbacEnabled,
  hasRoleOrHigher,
  canAccessByVisibility,
  canModifyResource,
  canDeleteResource,
  canCreateForUser,
  canAccessUserProfile,
  canModifyUserProfile,
  canAccessAdminFeatures,
  canAccessModeratorFeatures,
  canViewStatistics,
  enforcePermission,
  enforceAuthentication,
  filterVisibleResources,
  getOwnershipFilter,
} as const
