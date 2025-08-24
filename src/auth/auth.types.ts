/**
 * Auth-specific TypeScript type definitions
 * All authentication-related types including schema-derived types
 */

import type { Role } from '@prisma/client'
import { Static } from '@sinclair/typebox'
import {
  RegisterUserSchema,
  LoginUserSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
  RefreshTokenSchema,
  TokenResponseSchema,
  UserProfileSchema,
  AuthErrorSchema,
  SuccessMessageSchema,
  AuthParamsSchema,
} from './auth.schema'

// ============================================================================
// SCHEMA-DERIVED TYPES
// ============================================================================

export type RegisterUserType = Static<typeof RegisterUserSchema>
export type LoginUserType = Static<typeof LoginUserSchema>
export type ChangePasswordType = Static<typeof ChangePasswordSchema>
export type UpdateProfileType = Static<typeof UpdateProfileSchema>
export type RefreshTokenType = Static<typeof RefreshTokenSchema>
export type TokenResponseType = Static<typeof TokenResponseSchema>
export type UserProfileType = Static<typeof UserProfileSchema>
export type AuthErrorType = Static<typeof AuthErrorSchema>
export type SuccessMessageType = Static<typeof SuccessMessageSchema>
export type AuthParamsType = Static<typeof AuthParamsSchema>

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

export type AuthUser = {
  id: string
  email: string
  role: Role
  isEmailVerified: boolean
  isActive: boolean
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterData = {
  email: string
  password: string
  name?: string
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

export type RefreshTokenData = {
  refreshToken: string
}

export type PasswordChangeData = {
  currentPassword: string
  newPassword: string
}
