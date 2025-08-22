import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest } from 'fastify'
import { Role } from '@prisma/client'
import {
  authenticateUser,
  optionalAuthentication,
  requireRoles,
  requireAdmin,
  requireAdminOrModerator,
  requireSelfOrAdmin,
  requireActiveUser,
  requireVerifiedEmail,
} from '../auth.middleware'
import * as jwtUtils from '../jwt.utils'
import * as authService from '../auth.service'

// Mock the dependencies
vi.mock('../jwt.utils')
vi.mock('../auth.service')

describe('Auth Middleware', () => {
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

  const mockAdminUser = {
    ...mockUser,
    id: 'admin-123',
    email: 'admin@example.com',
    role: Role.ADMIN,
  }

  const mockJwtPayload = {
    userId: '123',
    email: 'test@example.com',
    role: 'USER',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  }

  let mockRequest: Partial<FastifyRequest> & { authUser?: any; authJwt?: any }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequest = {
      headers: {},
      params: {},
    }
  })

  describe('authenticateUser', () => {
    it('should authenticate user successfully', async () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' }
      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue('valid-token')
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(mockJwtPayload)
      vi.mocked(authService.getUserProfile).mockResolvedValue(mockUser)

      await authenticateUser(mockRequest as FastifyRequest)

      // The middleware converts UserProfileType to AuthUser (subset of fields)
      const expectedAuthUser = {
        id: mockUser.id,
        role: mockUser.role,
        isActive: mockUser.isActive,
        isEmailVerified: mockUser.isEmailVerified,
      }

      expect(jwtUtils.extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token')
      expect(jwtUtils.verifyAccessToken).toHaveBeenCalledWith('valid-token')
      expect(authService.getUserProfile).toHaveBeenCalledWith('123')
      expect(mockRequest.authUser).toEqual(expectedAuthUser)
      expect(mockRequest.authJwt).toEqual(mockJwtPayload)
    })

    it('should throw error for missing authorization header', async () => {
      mockRequest.headers = {}
      vi.mocked(jwtUtils.extractTokenFromHeader).mockImplementation(() => {
        throw new Error('Authorization header is required')
      })

      await expect(authenticateUser(mockRequest as FastifyRequest)).rejects.toThrow(
        'Authorization header is required',
      )
    })

    it('should throw error for invalid token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' }
      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue('invalid-token')
      vi.mocked(jwtUtils.verifyAccessToken).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(authenticateUser(mockRequest as FastifyRequest)).rejects.toThrow('Invalid token')
    })
  })

  describe('optionalAuthentication', () => {
    it('should authenticate user when token is provided', async () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' }
      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue('valid-token')
      vi.mocked(jwtUtils.verifyAccessToken).mockReturnValue(mockJwtPayload)
      vi.mocked(authService.getUserProfile).mockResolvedValue(mockUser)

      await optionalAuthentication(mockRequest as FastifyRequest)

      // The middleware converts UserProfileType to AuthUser (subset of fields)
      const expectedAuthUser = {
        id: mockUser.id,
        role: mockUser.role,
        isActive: mockUser.isActive,
        isEmailVerified: mockUser.isEmailVerified,
      }

      expect(mockRequest.authUser).toEqual(expectedAuthUser)
      expect(mockRequest.authJwt).toEqual(mockJwtPayload)
    })

    it('should not throw error when no authorization header', async () => {
      mockRequest.headers = {}

      await expect(optionalAuthentication(mockRequest as FastifyRequest)).resolves.not.toThrow()
      expect(mockRequest.authUser).toBeUndefined()
      expect(mockRequest.authJwt).toBeUndefined()
    })

    it('should not throw error for invalid token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' }
      vi.mocked(jwtUtils.extractTokenFromHeader).mockReturnValue('invalid-token')
      vi.mocked(jwtUtils.verifyAccessToken).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(optionalAuthentication(mockRequest as FastifyRequest)).resolves.not.toThrow()
      expect(mockRequest.authUser).toBeUndefined()
      expect(mockRequest.authJwt).toBeUndefined()
    })
  })

  describe('requireRoles', () => {
    it('should allow user with required role', async () => {
      mockRequest.authUser = mockUser
      const middleware = requireRoles(['USER', 'ADMIN'])

      await expect(middleware(mockRequest as FastifyRequest)).resolves.not.toThrow()
    })

    it('should deny user without required role', async () => {
      mockRequest.authUser = mockUser
      const middleware = requireRoles(['ADMIN'])

      await expect(middleware(mockRequest as FastifyRequest)).rejects.toThrow(
        'Access denied. Required roles: ADMIN. Your role: USER',
      )
    })

    it('should throw error when user not authenticated', async () => {
      mockRequest.authUser = undefined
      const middleware = requireRoles(['USER'])

      await expect(middleware(mockRequest as FastifyRequest)).rejects.toThrow(
        'Authentication required',
      )
    })
  })

  describe('requireAdmin', () => {
    it('should allow admin user', async () => {
      mockRequest.authUser = mockAdminUser

      await expect(requireAdmin(mockRequest as FastifyRequest)).resolves.not.toThrow()
    })

    it('should deny non-admin user', async () => {
      mockRequest.authUser = mockUser

      await expect(requireAdmin(mockRequest as FastifyRequest)).rejects.toThrow(
        'Access denied. Required roles: ADMIN. Your role: USER',
      )
    })
  })

  describe('requireAdminOrModerator', () => {
    it('should allow admin user', async () => {
      mockRequest.authUser = mockAdminUser

      await expect(requireAdminOrModerator(mockRequest as FastifyRequest)).resolves.not.toThrow()
    })

    it('should allow moderator user', async () => {
      mockRequest.authUser = { ...mockUser, role: Role.MODERATOR }

      await expect(requireAdminOrModerator(mockRequest as FastifyRequest)).resolves.not.toThrow()
    })

    it('should deny regular user', async () => {
      mockRequest.authUser = mockUser

      await expect(requireAdminOrModerator(mockRequest as FastifyRequest)).rejects.toThrow(
        'Access denied. Required roles: ADMIN, MODERATOR. Your role: USER',
      )
    })
  })

  describe('requireSelfOrAdmin', () => {
    it('should allow user to access their own resource', async () => {
      mockRequest.authUser = mockUser
      mockRequest.params = { id: '123' }
      const middleware = requireSelfOrAdmin()

      await expect(middleware(mockRequest as FastifyRequest)).resolves.not.toThrow()
    })

    it('should allow admin to access any resource', async () => {
      mockRequest.authUser = mockAdminUser
      mockRequest.params = { id: '456' }
      const middleware = requireSelfOrAdmin()

      await expect(middleware(mockRequest as FastifyRequest)).resolves.not.toThrow()
    })

    it('should deny user accessing other user resource', async () => {
      mockRequest.authUser = mockUser
      mockRequest.params = { id: '456' }
      const middleware = requireSelfOrAdmin()

      await expect(middleware(mockRequest as FastifyRequest)).rejects.toThrow(
        'Access denied. You can only access your own resources.',
      )
    })

    it('should work with custom parameter name', async () => {
      mockRequest.authUser = mockUser
      mockRequest.params = { userId: '123' }
      const middleware = requireSelfOrAdmin('userId')

      await expect(middleware(mockRequest as FastifyRequest)).resolves.not.toThrow()
    })

    it('should throw error when user not authenticated', async () => {
      mockRequest.authUser = undefined
      mockRequest.params = { id: '123' }
      const middleware = requireSelfOrAdmin()

      await expect(middleware(mockRequest as FastifyRequest)).rejects.toThrow(
        'Authentication required',
      )
    })
  })

  describe('requireActiveUser', () => {
    it('should allow active user', async () => {
      mockRequest.authUser = mockUser

      await expect(requireActiveUser(mockRequest as FastifyRequest)).resolves.not.toThrow()
    })

    it('should deny inactive user', async () => {
      mockRequest.authUser = { ...mockUser, isActive: false }

      await expect(requireActiveUser(mockRequest as FastifyRequest)).rejects.toThrow(
        'Account is deactivated',
      )
    })

    it('should throw error when user not authenticated', async () => {
      mockRequest.authUser = undefined

      await expect(requireActiveUser(mockRequest as FastifyRequest)).rejects.toThrow(
        'Authentication required',
      )
    })
  })

  describe('requireVerifiedEmail', () => {
    it('should allow user with verified email', async () => {
      mockRequest.authUser = mockUser

      await expect(requireVerifiedEmail(mockRequest as FastifyRequest)).resolves.not.toThrow()
    })

    it('should deny user with unverified email', async () => {
      mockRequest.authUser = { ...mockUser, isEmailVerified: false }

      await expect(requireVerifiedEmail(mockRequest as FastifyRequest)).rejects.toThrow(
        'Email verification required',
      )
    })

    it('should throw error when user not authenticated', async () => {
      mockRequest.authUser = undefined

      await expect(requireVerifiedEmail(mockRequest as FastifyRequest)).rejects.toThrow(
        'Authentication required',
      )
    })
  })
})
