/**
 * Authentication helpers for controllers
 * Provides utilities to normalize authentication data
 */

import type { FastifyRequest } from 'fastify'
import type { AuthUser } from './rbac.service'

/**
 * Extract authenticated user from request, converting undefined to null
 * This ensures consistency with service layer expectations
 */
export const getAuthUser = (request: FastifyRequest): AuthUser | null => {
  return request.authUser ?? null
}

/**
 * Extract authenticated user from request, throwing if not present
 * Use this for endpoints that require authentication
 */
export const requireAuthUser = (request: FastifyRequest): AuthUser => {
  const user = request.authUser
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}
