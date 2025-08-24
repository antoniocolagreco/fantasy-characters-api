import type { FastifyRequest } from 'fastify'
import type { Role } from '@prisma/client'
import { verifyAccessToken, extractTokenFromHeader } from './jwt.utils'
import { getUserProfile } from './auth.service'
import { createUnauthorizedError, createForbiddenError } from '../shared/errors'
import type { AuthUser } from '../shared/rbac.service'
import type { UserProfileType } from './auth.types'

/**
 * Convert UserProfileType to AuthUser
 */
const convertToAuthUser = (userProfile: UserProfileType): AuthUser => ({
  id: userProfile.id,
  email: userProfile.email,
  role: userProfile.role as Role,
  isActive: userProfile.isActive,
  isEmailVerified: userProfile.isEmailVerified,
})

/**
 * Authentication middleware to verify JWT tokens
 * This middleware extracts and verifies the JWT token from the Authorization header
 * ALWAYS ACTIVE - authentication is separate from RBAC authorization
 */
export const authenticateUser = async (request: FastifyRequest): Promise<void> => {
  // Extract token from Authorization header
  const token = extractTokenFromHeader(request.headers.authorization)

  // Verify and decode the token
  const payload = verifyAccessToken(token)

  // Get full user profile
  const userProfile = await getUserProfile(payload.userId)

  // Convert and attach user information to request
  request.authUser = convertToAuthUser(userProfile)
  request.authJwt = payload
}

/**
 * Optional authentication middleware
 * Similar to authenticateUser but doesn't throw errors if token is missing
 * Used for routes that can work with or without authentication
 */
export const optionalAuthentication = async (request: FastifyRequest): Promise<void> => {
  try {
    if (request.headers.authorization) {
      const token = extractTokenFromHeader(request.headers.authorization)
      const payload = verifyAccessToken(token)
      const userProfile = await getUserProfile(payload.userId)

      request.authUser = convertToAuthUser(userProfile)
      request.authJwt = payload
    }
  } catch (_error) {
    // Silently fail for optional authentication
    // The route handler can decide what to do with unauthenticated requests
  }
}

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if the authenticated user has required roles
 */
export const requireRoles = (allowedRoles: string[]) => {
  return async (request: FastifyRequest): Promise<void> => {
    // Ensure user is authenticated first
    if (!request.authUser) {
      throw createUnauthorizedError('Authentication required')
    }

    // Check if user has any of the allowed roles
    if (!allowedRoles.includes(request.authUser.role)) {
      throw createForbiddenError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${request.authUser.role}`,
      )
    }
  }
}

/**
 * Admin only middleware
 * Shortcut for requiring admin role
 */
export const requireAdmin = requireRoles(['ADMIN'])

/**
 * Admin or Moderator middleware
 * Allows both admin and moderator roles
 */
export const requireAdminOrModerator = requireRoles(['ADMIN', 'MODERATOR'])

/**
 * Self or Admin middleware
 * Allows users to access their own resources or admins to access any resource
 */
export const requireSelfOrAdmin = (userIdParam = 'id') => {
  return async (request: FastifyRequest): Promise<void> => {
    if (!request.authUser) {
      throw createUnauthorizedError('Authentication required')
    }

    const targetUserId = (request.params as Record<string, string>)[userIdParam]

    // Allow if user is accessing their own resource
    if (request.authUser.id === targetUserId) {
      return
    }

    // Allow if user is admin
    if (request.authUser.role === 'ADMIN') {
      return
    }

    throw createForbiddenError('Access denied. You can only access your own resources.')
  }
}

/**
 * Active user middleware
 * Ensures the authenticated user account is active
 */
export const requireActiveUser = async (request: FastifyRequest): Promise<void> => {
  if (!request.authUser) {
    throw createUnauthorizedError('Authentication required')
  }

  if (!request.authUser.isActive) {
    throw createUnauthorizedError('Account is deactivated')
  }
}

/**
 * Email verified middleware
 * Ensures the authenticated user has verified their email
 */
export const requireVerifiedEmail = async (request: FastifyRequest): Promise<void> => {
  if (!request.authUser) {
    throw createUnauthorizedError('Authentication required')
  }

  if (!request.authUser.isEmailVerified) {
    throw createUnauthorizedError('Email verification required')
  }
}

// Export all middleware functions
export const authMiddleware = {
  authenticateUser,
  optionalAuthentication,
  requireRoles,
  requireAdmin,
  requireAdminOrModerator,
  requireSelfOrAdmin,
  requireActiveUser,
  requireVerifiedEmail,
} as const
