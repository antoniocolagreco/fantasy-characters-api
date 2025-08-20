import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { securityConfig } from '@/shared/config'
import { createUnauthorizedError, createInternalServerError } from '../shared/errors'
import type { UserProfileType, TokenResponseType } from './auth.schema'

// JWT payload interface
export type JwtPayload = {
  userId: string
  email: string
  role: string
  type?: string
  iat?: number
  exp?: number
}

/**
 * Generate JWT access token - simplified version
 */
export const generateAccessToken = (user: UserProfileType): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
  }

  try {
    // Use a simplified implementation that works with TypeScript
    return jwt.sign(payload, securityConfig.jwtSecret)
  } catch (_error) {
    throw createInternalServerError('Failed to generate access token')
  }
}

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (user: UserProfileType): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(), // Add unique identifier to prevent token duplication
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  }

  try {
    return jwt.sign(payload, securityConfig.jwtSecret)
  } catch (_error) {
    throw createInternalServerError('Failed to generate refresh token')
  }
}

/**
 * Verify JWT token and extract payload
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, securityConfig.jwtSecret) as JwtPayload
    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createUnauthorizedError('Token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw createUnauthorizedError('Invalid token')
    }
    throw createUnauthorizedError('Token verification failed')
  }
}

/**
 * Verify JWT refresh token and extract payload
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, securityConfig.jwtSecret) as JwtPayload

    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      throw createUnauthorizedError('Invalid refresh token')
    }

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createUnauthorizedError('Refresh token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw createUnauthorizedError('Invalid refresh token')
    }
    throw createUnauthorizedError('Refresh token verification failed')
  }
}

/**
 * Decode JWT token without verification (for debugging)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload
  } catch (_error) {
    return null
  }
}

/**
 * Create complete token response
 */
export const createTokenResponse = (user: UserProfileType): TokenResponseType => {
  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: securityConfig.jwtExpiresIn, // Use configuration instead of hardcoded value
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
  }
}

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string => {
  if (!authHeader) {
    throw createUnauthorizedError('Authorization header is required')
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw createUnauthorizedError('Authorization header must be Bearer token')
  }

  const token = authHeader.slice(7) // Remove 'Bearer ' prefix

  if (!token) {
    throw createUnauthorizedError('Token is required')
  }

  return token
}

/**
 * Get expiration time from token
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = decodeToken(token)
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000)
    }
    return null
  } catch (_error) {
    return null
  }
}

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token)
  if (!expiration) {
    return true
  }
  return expiration.getTime() < Date.now()
}

// Export all JWT utilities as an object
export const jwtUtils = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  createTokenResponse,
  extractTokenFromHeader,
  getTokenExpiration,
  isTokenExpired,
} as const
