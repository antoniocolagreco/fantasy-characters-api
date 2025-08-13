import bcrypt from 'bcrypt'
import { db } from '../shared/database/index.js'
import {
  createBadRequestError,
  createUnauthorizedError,
  createNotFoundError,
  createConflictError,
  createInternalServerError,
} from '../shared/errors.js'
import { Role } from '@prisma/client'
import { verifyRefreshToken } from './jwt.utils.js'
import type {
  RegisterUserType,
  LoginUserType,
  ChangePasswordType,
  UpdateProfileType,
  UserProfileType,
  RefreshTokenType,
  TokenResponseType,
} from './auth.schema.js'

// Password hashing configuration
const SALT_ROUNDS = 12

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS)
  } catch (_error) {
    throw createInternalServerError('Failed to hash password')
  }
}

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash)
  } catch (_error) {
    throw createInternalServerError('Failed to verify password')
  }
}

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): void => {
  if (password.length < 8) {
    throw createBadRequestError('Password must be at least 8 characters long')
  }

  if (password.length > 128) {
    throw createBadRequestError('Password must be less than 128 characters')
  }

  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)

  if (!hasLetter || !hasNumber) {
    throw createBadRequestError('Password must contain at least one letter and one number')
  }
}

/**
 * Register a new user
 */
export const registerUser = async (userData: RegisterUserType): Promise<UserProfileType> => {
  const { email, password, displayName, bio } = userData

  // Validate password strength
  validatePasswordStrength(password)

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (existingUser) {
    throw createConflictError('User with this email already exists')
  }

  // Hash password
  const passwordHash = await hashPassword(password)

  try {
    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName?.trim() || null,
        bio: bio?.trim() || null,
        role: Role.USER,
        lastLogin: new Date(),
      },
    })

    // Return user profile without sensitive data
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      lastLogin: user.lastLogin.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  } catch (error) {
    if ((error as Record<string, string>)?.code === 'P2002') {
      throw createConflictError('User with this email already exists')
    }
    throw createInternalServerError('Failed to create user')
  }
}

/**
 * Authenticate user login
 */
export const loginUser = async (loginData: LoginUserType): Promise<UserProfileType> => {
  const { email, password } = loginData

  // Find user by email
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user) {
    throw createUnauthorizedError('Invalid email or password')
  }

  // Check if user is active
  if (!user.isActive) {
    throw createUnauthorizedError('Account is deactivated')
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.passwordHash)

  if (!isPasswordValid) {
    throw createUnauthorizedError('Invalid email or password')
  }

  try {
    // Update last login
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Return user profile without sensitive data
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      bio: updatedUser.bio,
      role: updatedUser.role,
      isEmailVerified: updatedUser.isEmailVerified,
      isActive: updatedUser.isActive,
      lastLogin: updatedUser.lastLogin.toISOString(),
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    }
  } catch (_error) {
    throw createInternalServerError('Failed to update login time')
  }
}

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<UserProfileType> => {
  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw createNotFoundError('User not found')
  }

  if (!user.isActive) {
    throw createUnauthorizedError('Account is deactivated')
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    lastLogin: user.lastLogin.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  profileData: UpdateProfileType,
): Promise<UserProfileType> => {
  const { displayName, bio } = profileData

  // Check if user exists and is active
  const existingUser = await db.user.findUnique({
    where: { id: userId },
  })

  if (!existingUser) {
    throw createNotFoundError('User not found')
  }

  if (!existingUser.isActive) {
    throw createUnauthorizedError('Account is deactivated')
  }

  try {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        displayName: displayName?.trim() || null,
        bio: bio?.trim() || null,
      },
    })

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      bio: updatedUser.bio,
      role: updatedUser.role,
      isEmailVerified: updatedUser.isEmailVerified,
      isActive: updatedUser.isActive,
      lastLogin: updatedUser.lastLogin.toISOString(),
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    }
  } catch (_error) {
    throw createInternalServerError('Failed to update profile')
  }
}

/**
 * Change user password
 */
export const changeUserPassword = async (
  userId: string,
  passwordData: ChangePasswordType,
): Promise<void> => {
  const { currentPassword, newPassword } = passwordData

  // Get user
  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw createNotFoundError('User not found')
  }

  if (!user.isActive) {
    throw createUnauthorizedError('Account is deactivated')
  }

  // Verify current password
  const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash)

  if (!isCurrentPasswordValid) {
    throw createUnauthorizedError('Current password is incorrect')
  }

  // Validate new password strength
  validatePasswordStrength(newPassword)

  // Check if new password is different from current
  const isSamePassword = await verifyPassword(newPassword, user.passwordHash)
  if (isSamePassword) {
    throw createBadRequestError('New password must be different from current password')
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword)

  try {
    // Update password
    await db.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        lastPasswordChange: new Date(),
      },
    })
  } catch (_error) {
    throw createInternalServerError('Failed to change password')
  }
}

/**
 * Deactivate user account
 */
export const deactivateUser = async (userId: string): Promise<void> => {
  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw createNotFoundError('User not found')
  }

  if (!user.isActive) {
    throw createBadRequestError('Account is already deactivated')
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { isActive: false },
    })
  } catch (_error) {
    throw createInternalServerError('Failed to deactivate account')
  }
}

/**
 * Reactivate user account (admin only)
 */
export const reactivateUser = async (userId: string): Promise<void> => {
  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw createNotFoundError('User not found')
  }

  if (user.isActive) {
    throw createBadRequestError('Account is already active')
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { isActive: true },
    })
  } catch (_error) {
    throw createInternalServerError('Failed to reactivate account')
  }
}

/**
 * Store refresh token in database
 */
export const storeRefreshToken = async (
  userId: string,
  token: string,
  deviceInfo?: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> => {
  try {
    // Calculate expiration (7 days from now)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await db.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        deviceInfo: deviceInfo || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    })
  } catch (_error) {
    // If this fails, we'll just log and continue - the user can still use access tokens
    console.warn('Failed to store refresh token:', _error)
  }
}

/**
 * Validate refresh token and get user
 */
export const validateRefreshToken = async (
  refreshData: RefreshTokenType,
): Promise<UserProfileType> => {
  const { refreshToken } = refreshData

  // First verify the JWT signature and structure
  verifyRefreshToken(refreshToken)

  // Then check if the token exists in database and is not revoked
  const storedToken = await db.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  })

  if (!storedToken) {
    throw createUnauthorizedError('Refresh token not found')
  }

  if (storedToken.isRevoked) {
    throw createUnauthorizedError('Refresh token has been revoked')
  }

  if (storedToken.expiresAt < new Date()) {
    throw createUnauthorizedError('Refresh token has expired')
  }

  if (!storedToken.user.isActive) {
    throw createUnauthorizedError('Account is deactivated')
  }

  // Return user profile
  return {
    id: storedToken.user.id,
    email: storedToken.user.email,
    displayName: storedToken.user.displayName,
    bio: storedToken.user.bio,
    role: storedToken.user.role,
    isEmailVerified: storedToken.user.isEmailVerified,
    isActive: storedToken.user.isActive,
    lastLogin: storedToken.user.lastLogin.toISOString(),
    createdAt: storedToken.user.createdAt.toISOString(),
    updatedAt: storedToken.user.updatedAt.toISOString(),
  }
}

/**
 * Revoke refresh token
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  try {
    await db.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    })
  } catch (_error) {
    // If this fails, we'll just log and continue
    console.warn('Failed to revoke refresh token:', _error)
  }
}

/**
 * Clean up expired refresh tokens
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  try {
    await db.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    })
  } catch (_error) {
    console.warn('Failed to cleanup expired tokens:', _error)
  }
}

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (
  refreshData: RefreshTokenType,
): Promise<TokenResponseType> => {
  // Validate the refresh token and get user
  const user = await validateRefreshToken(refreshData)

  // Generate new tokens
  const { createTokenResponse } = await import('./jwt.utils.js')
  const tokenResponse = createTokenResponse(user)

  // Store the new refresh token
  try {
    await storeRefreshToken(user.id, tokenResponse.refreshToken)
  } catch (_error) {
    console.warn('Failed to store new refresh token:', _error)
  }

  // Revoke the old refresh token
  await revokeRefreshToken(refreshData.refreshToken)

  return tokenResponse
}

/**
 * Revoke all refresh tokens for a user
 */
export const revokeAllUserRefreshTokens = async (userId: string): Promise<void> => {
  try {
    await db.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    })
  } catch (_error) {
    console.warn('Failed to revoke all user refresh tokens:', _error)
  }
}

// Export all service functions as a service object
export const authService = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  deactivateUser,
  reactivateUser,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  cleanupExpiredTokens,
  refreshAccessToken,
  revokeAllUserRefreshTokens,
} as const
