import { describe, it, expect } from 'vitest'
import type { FastifyRequest } from 'fastify'
import { getAuthUser, requireAuthUser } from '../auth-helpers'
import type { AuthUser } from '../rbac.service'

describe('Auth Helpers', () => {
  describe('getAuthUser', () => {
    it('should return the authenticated user when present', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        role: 'USER',
        isActive: true,
        isEmailVerified: true,
      }

      const mockRequest = {
        authUser: mockUser,
      } as FastifyRequest

      const result = getAuthUser(mockRequest)

      expect(result).toEqual(mockUser)
    })

    it('should return null when authUser is undefined', () => {
      const mockRequest = {
        authUser: undefined,
      } as FastifyRequest

      const result = getAuthUser(mockRequest)

      expect(result).toBeNull()
    })

    it('should return null when request has no authUser property', () => {
      const mockRequest = {} as FastifyRequest

      const result = getAuthUser(mockRequest)

      expect(result).toBeNull()
    })
  })

  describe('requireAuthUser', () => {
    it('should return the authenticated user when present', () => {
      const mockUser: AuthUser = {
        id: 'user-456',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
      }

      const mockRequest = {
        authUser: mockUser,
      } as FastifyRequest

      const result = requireAuthUser(mockRequest)

      expect(result).toEqual(mockUser)
    })

    it('should throw error when authUser is undefined', () => {
      const mockRequest = {
        authUser: undefined,
      } as FastifyRequest

      expect(() => requireAuthUser(mockRequest)).toThrow('Authentication required')
    })

    it('should throw error when request has no authUser property', () => {
      const mockRequest = {} as FastifyRequest

      expect(() => requireAuthUser(mockRequest)).toThrow('Authentication required')
    })

    it('should handle all user roles correctly', () => {
      const roles: Array<AuthUser['role']> = ['USER', 'MODERATOR', 'ADMIN']

      roles.forEach(role => {
        const mockUser: AuthUser = {
          id: `user-${role.toLowerCase()}`,
          role,
          isActive: true,
          isEmailVerified: true,
        }

        const mockRequest = {
          authUser: mockUser,
        } as FastifyRequest

        const result = requireAuthUser(mockRequest)

        expect(result).toEqual(mockUser)
        expect(result.role).toBe(role)
      })
    })

    it('should handle inactive user correctly', () => {
      const mockUser: AuthUser = {
        id: 'inactive-user',
        role: 'USER',
        isActive: false,
        isEmailVerified: true,
      }

      const mockRequest = {
        authUser: mockUser,
      } as FastifyRequest

      const result = requireAuthUser(mockRequest)

      expect(result).toEqual(mockUser)
      expect(result.isActive).toBe(false)
    })

    it('should handle unverified email user correctly', () => {
      const mockUser: AuthUser = {
        id: 'unverified-user',
        role: 'USER',
        isActive: true,
        isEmailVerified: false,
      }

      const mockRequest = {
        authUser: mockUser,
      } as FastifyRequest

      const result = requireAuthUser(mockRequest)

      expect(result).toEqual(mockUser)
      expect(result.isEmailVerified).toBe(false)
    })
  })
})
