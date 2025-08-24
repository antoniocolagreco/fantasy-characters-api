import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  deactivateUser,
  storeRefreshToken,
  revokeRefreshToken,
  refreshAccessToken,
  revokeAllUserRefreshTokens,
} from './auth.service'
import { createTokenResponse } from './jwt.utils'
import { createSuccessMessage } from '../shared/utils'
import type {
  RegisterUserType,
  LoginUserType,
  ChangePasswordType,
  UpdateProfileType,
  RefreshTokenType,
  AuthParamsType,
  TokenResponseType,
  UserProfileType,
  SuccessMessageType,
} from './auth.types'

/**
 * Register a new user
 */
export const register = async (
  request: FastifyRequest<{ Body: RegisterUserType }>,
  reply: FastifyReply,
): Promise<TokenResponseType> => {
  const userData = request.body

  // Register user
  const user = await registerUser(userData)

  // Generate token response
  const tokenResponse = createTokenResponse(user)

  // Store refresh token in database (ignore errors for now)
  try {
    const deviceInfo = request.headers?.['user-agent'] || 'Unknown Device'
    const ipAddress = request.ip || 'Unknown IP'
    const userAgent = request.headers?.['user-agent'] || 'Unknown User Agent'

    await storeRefreshToken(user.id, tokenResponse.refreshToken, deviceInfo, ipAddress, userAgent)
  } catch (error) {
    // Log error but don't fail the registration
    console.warn('Failed to store refresh token:', error)
  }

  // Set status code and return response
  reply.status(201)
  return tokenResponse
}

/**
 * Login user
 */
export const login = async (
  request: FastifyRequest<{ Body: LoginUserType }>,
  reply: FastifyReply,
): Promise<TokenResponseType> => {
  const loginData = request.body

  // Authenticate user
  const user = await loginUser(loginData)

  // Generate token response
  const tokenResponse = createTokenResponse(user)

  // Store refresh token in database (ignore errors for now)
  try {
    const deviceInfo = request.headers?.['user-agent'] || 'Unknown Device'
    const ipAddress = request.ip || 'Unknown IP'
    const userAgent = request.headers?.['user-agent'] || 'Unknown User Agent'

    await storeRefreshToken(user.id, tokenResponse.refreshToken, deviceInfo, ipAddress, userAgent)
  } catch (error) {
    // Log error but don't fail the login
    console.warn('Failed to store refresh token:', error)
  }

  // Set status code and return response
  reply.status(200)
  return tokenResponse
}

/**
 * Get current user profile
 */
export const getProfile = async (request: FastifyRequest): Promise<UserProfileType> => {
  // User is attached to request by authentication middleware
  if (!request.authUser) {
    throw new Error('User not authenticated')
  }

  // Get complete user profile from database
  return await getUserProfile(request.authUser.id)
}

/**
 * Get user profile by ID
 */
export const getProfileById = async (
  request: FastifyRequest<{ Params: AuthParamsType }>,
): Promise<UserProfileType> => {
  const { id } = request.params

  return await getUserProfile(id)
}

/**
 * Update current user profile
 */
export const updateProfile = async (
  request: FastifyRequest<{ Body: UpdateProfileType }>,
): Promise<UserProfileType> => {
  if (!request.authUser) {
    throw new Error('User not authenticated')
  }

  const profileData = request.body

  return await updateUserProfile(request.authUser.id, profileData)
}

/**
 * Update user profile by ID
 */
export const updateProfileById = async (
  request: FastifyRequest<{ Params: AuthParamsType; Body: UpdateProfileType }>,
): Promise<UserProfileType> => {
  const { id } = request.params
  const profileData = request.body

  return await updateUserProfile(id, profileData)
}

/**
 * Change current user password
 */
export const changePassword = async (
  request: FastifyRequest<{ Body: ChangePasswordType }>,
  reply: FastifyReply,
): Promise<SuccessMessageType> => {
  if (!request.authUser) {
    throw new Error('User not authenticated')
  }

  const passwordData = request.body

  await changeUserPassword(request.authUser.id, passwordData)

  reply.status(200)
  return createSuccessMessage('Password changed successfully')
}

/**
 * Change password by user ID
 */
export const changePasswordById = async (
  request: FastifyRequest<{ Params: AuthParamsType; Body: ChangePasswordType }>,
  reply: FastifyReply,
): Promise<SuccessMessageType> => {
  const { id } = request.params
  const passwordData = request.body

  await changeUserPassword(id, passwordData)

  reply.status(200)
  return createSuccessMessage('Password changed successfully')
}

/**
 * Deactivate current user account
 */
export const deactivateAccount = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<SuccessMessageType> => {
  if (!request.authUser) {
    throw new Error('User not authenticated')
  }

  await deactivateUser(request.authUser.id)

  reply.status(200)
  return createSuccessMessage('Account deactivated successfully')
}

/**
 * Deactivate user account by ID (admin only)
 */
export const deactivateAccountById = async (
  request: FastifyRequest<{ Params: AuthParamsType }>,
  reply: FastifyReply,
): Promise<SuccessMessageType> => {
  const { id } = request.params

  await deactivateUser(id)

  reply.status(200)
  return createSuccessMessage('Account deactivated successfully')
}

/**
 * Logout user (client-side token invalidation)
 * Since we're using stateless JWT tokens, logout is handled client-side
 * This endpoint serves as a placeholder for any server-side cleanup if needed
 */
export const logout = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<SuccessMessageType> => {
  // If a refresh token is provided in the body, revoke it
  const body = request.body as { refreshToken?: string }
  const refreshToken = body?.refreshToken
  if (refreshToken) {
    try {
      await revokeRefreshToken(refreshToken)
    } catch {
      // Ignore errors for logout - token may already be invalid
    }
  }

  // If user is authenticated, revoke all their refresh tokens
  if (request.authUser) {
    try {
      await revokeAllUserRefreshTokens(request.authUser.id)
    } catch {
      // Ignore errors for logout
    }
  }

  reply.status(200)
  return createSuccessMessage('Logged out successfully')
}

/**
 * Refresh access token using refresh token
 */
export const refresh = async (
  request: FastifyRequest<{ Body: RefreshTokenType }>,
  reply: FastifyReply,
): Promise<TokenResponseType> => {
  const refreshTokenData = request.body

  // Refresh the access token
  const tokenResponse = await refreshAccessToken(refreshTokenData)

  reply.status(200)
  return tokenResponse
}

// Export all controller functions as an object
export const authController = {
  register,
  login,
  logout,
  refresh,
  getProfile,
  getProfileById,
  updateProfile,
  updateProfileById,
  changePassword,
  changePasswordById,
  deactivateAccount,
  deactivateAccountById,
} as const
