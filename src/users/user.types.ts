/**
 * User-specific TypeScript type definitions
 * All user-related types including schema-derived types
 */

import { Static } from '@sinclair/typebox'
import {
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UserResponseSchema,
  UserListQuerySchema,
  UserListResponseSchema,
  UserIdParamSchema,
  UserRoleSchema,
  UserStatsResponseSchema,
} from './user.schema'

// ============================================================================
// SCHEMA-DERIVED TYPES
// ============================================================================

export type CreateUserRequest = Static<typeof CreateUserRequestSchema>
export type UpdateUserRequest = Static<typeof UpdateUserRequestSchema>
export type UserResponse = Static<typeof UserResponseSchema>
export type UserListQuery = Static<typeof UserListQuerySchema>
export type UserListResponse = Static<typeof UserListResponseSchema>
export type UserIdParam = Static<typeof UserIdParamSchema>
export type UserRole = Static<typeof UserRoleSchema>
export type UserStatsResponse = Static<typeof UserStatsResponseSchema>

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

export type UserProfile = {
  id: string
  email: string
  name?: string
  bio?: string
  role: string
  isEmailVerified: boolean
  isActive: boolean
  profilePictureId?: string
  createdAt: Date
  updatedAt: Date
}

export type CreateUserData = {
  email: string
  passwordHash: string
  name?: string
  bio?: string
  role?: string
}

export type UpdateUserData = {
  name?: string
  bio?: string
  isEmailVerified?: boolean
  isActive?: boolean
  profilePictureId?: string
}

export type UserFilterOptions = {
  email?: string
  role?: string
  isActive?: boolean
  isEmailVerified?: boolean
}

export type UserStatsData = {
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  usersByRole: Record<string, number>
}
