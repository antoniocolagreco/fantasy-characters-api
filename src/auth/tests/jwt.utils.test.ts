import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'
import {
  generateAccessToken,
  verifyAccessToken,
  decodeToken,
  createTokenResponse,
  extractTokenFromHeader,
  getTokenExpiration,
  isTokenExpired,
} from '@/auth/jwt.utils'

// Mock jwt library
vi.mock('jsonwebtoken')

// Mock environment config
vi.mock('@/shared/config', () => ({
  securityConfig: {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '7d',
  },
}))

describe('JWT Utils', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    bio: null,
    role: Role.USER,
    isEmailVerified: true,
    isActive: true,
    lastLogin: '2025-08-13T18:52:48.501Z',
    createdAt: '2025-08-13T18:52:48.501Z',
    updatedAt: '2025-08-13T18:52:48.501Z',
  }

  const mockJwtPayload = {
    userId: '123',
    email: 'test@example.com',
    role: 'USER',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateAccessToken', () => {
    it('should generate token successfully', () => {
      const mockToken = 'mock-jwt-token'
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never)

      const result = generateAccessToken(mockUser)

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        }),
        'test-secret',
      )
      expect(result).toBe(mockToken)
    })

    it('should throw error when jwt.sign fails', () => {
      vi.mocked(jwt.sign).mockImplementation(() => {
        throw new Error('JWT Error')
      })

      expect(() => generateAccessToken(mockUser)).toThrow('Failed to generate access token')
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify token successfully', () => {
      vi.mocked(jwt.verify).mockReturnValue(mockJwtPayload as never)

      const result = verifyAccessToken('valid-token')

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret')
      expect(result).toEqual(mockJwtPayload)
    })

    it('should throw error for expired token', () => {
      const expiredError = new jwt.TokenExpiredError('jwt expired', new Date())
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw expiredError
      })

      expect(() => verifyAccessToken('expired-token')).toThrow('Token has expired')
    })

    it('should throw error for invalid token', () => {
      const invalidError = new jwt.JsonWebTokenError('invalid token')
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw invalidError
      })

      expect(() => verifyAccessToken('invalid-token')).toThrow('Invalid token')
    })

    it('should throw generic error for other jwt errors', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Other JWT error')
      })

      expect(() => verifyAccessToken('token')).toThrow('Token verification failed')
    })
  })

  describe('decodeToken', () => {
    it('should decode token successfully', () => {
      vi.mocked(jwt.decode).mockReturnValue(mockJwtPayload as never)

      const result = decodeToken('valid-token')

      expect(jwt.decode).toHaveBeenCalledWith('valid-token')
      expect(result).toEqual(mockJwtPayload)
    })

    it('should return null when decode fails', () => {
      vi.mocked(jwt.decode).mockImplementation(() => {
        throw new Error('Decode error')
      })

      const result = decodeToken('invalid-token')

      expect(result).toBeNull()
    })
  })

  describe('createTokenResponse', () => {
    it('should create token response successfully', () => {
      const mockToken = 'mock-jwt-token'
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never)

      const result = createTokenResponse(mockUser)

      expect(result).toEqual({
        accessToken: mockToken,
        refreshToken: mockToken,
        tokenType: 'Bearer',
        expiresIn: '7d',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          isEmailVerified: mockUser.isEmailVerified,
          isActive: mockUser.isActive,
          lastLogin: mockUser.lastLogin,
          createdAt: mockUser.createdAt,
        },
      })
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const result = extractTokenFromHeader('Bearer valid-token-123')

      expect(result).toBe('valid-token-123')
    })

    it('should throw error for missing header', () => {
      expect(() => extractTokenFromHeader(undefined)).toThrow('Authorization header is required')
    })

    it('should throw error for non-Bearer header', () => {
      expect(() => extractTokenFromHeader('Basic username:password')).toThrow(
        'Authorization header must be Bearer token',
      )
    })

    it('should throw error for Bearer header without token', () => {
      expect(() => extractTokenFromHeader('Bearer ')).toThrow('Token is required')
    })

    it('should throw error for just "Bearer"', () => {
      expect(() => extractTokenFromHeader('Bearer')).toThrow(
        'Authorization header must be Bearer token',
      )
    })
  })

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const expTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const payload = { ...mockJwtPayload, exp: expTime }
      vi.mocked(jwt.decode).mockReturnValue(payload as never)

      const result = getTokenExpiration('valid-token')

      expect(result).toEqual(new Date(expTime * 1000))
    })

    it('should return null for token without exp', () => {
      const payload = { ...mockJwtPayload, exp: undefined }
      vi.mocked(jwt.decode).mockReturnValue(payload as never)

      const result = getTokenExpiration('token-without-exp')

      expect(result).toBeNull()
    })

    it('should return null for invalid token', () => {
      vi.mocked(jwt.decode).mockImplementation(() => {
        throw new Error('Decode error')
      })

      const result = getTokenExpiration('invalid-token')

      expect(result).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const payload = { ...mockJwtPayload, exp: futureTime }
      vi.mocked(jwt.decode).mockReturnValue(payload as never)

      const result = isTokenExpired('valid-token')

      expect(result).toBe(false)
    })

    it('should return true for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      const payload = { ...mockJwtPayload, exp: pastTime }
      vi.mocked(jwt.decode).mockReturnValue(payload as never)

      const result = isTokenExpired('expired-token')

      expect(result).toBe(true)
    })

    it('should return true for token without expiration', () => {
      const payload = { ...mockJwtPayload, exp: undefined }
      vi.mocked(jwt.decode).mockReturnValue(payload as never)

      const result = isTokenExpired('token-without-exp')

      expect(result).toBe(true)
    })

    it('should return true for invalid token', () => {
      vi.mocked(jwt.decode).mockImplementation(() => {
        throw new Error('Decode error')
      })

      const result = isTokenExpired('invalid-token')

      expect(result).toBe(true)
    })
  })
})
