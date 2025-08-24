import { describe, it, expect } from 'vitest'
import type { FastifyRequest } from 'fastify'
import { getAuthUser, requireAuthUser } from '../auth-helpers'
import type { AuthUser } from '../../auth/auth.types'

// Helper function to create a mock FastifyRequest with only the properties we need
const createMockRequest = (authUser?: AuthUser): FastifyRequest =>
  ({ authUser }) as unknown as FastifyRequest

describe('Auth Helpers', () => {
  describe('getAuthUser', () => {
    it('should return the authenticated user when present', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'user@test.com',
        role: 'USER',
        isActive: true,
        isEmailVerified: true,
      }

      const mockRequest = createMockRequest(mockUser)

      const result = getAuthUser(mockRequest)

      expect(result).toEqual(mockUser)
    })

    it('should return null when authUser is undefined', () => {
      const mockRequest = createMockRequest(undefined)

      const result = getAuthUser(mockRequest)

      expect(result).toBeNull()
    })

    it('should return null when request has no authUser property', () => {
      const mockRequest = createMockRequest()

      const result = getAuthUser(mockRequest)

      expect(result).toBeNull()
    })
  })

  describe('requireAuthUser', () => {
    it('should return the authenticated user when present', () => {
      const mockUser: AuthUser = {
        id: 'user-456',
        email: 'admin@test.com',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
      }

      const mockRequest = createMockRequest(mockUser)

      const result = requireAuthUser(mockRequest)

      expect(result).toEqual(mockUser)
    })

    it('should throw error when authUser is undefined', () => {
      const mockRequest = createMockRequest(undefined)

      expect(() => requireAuthUser(mockRequest)).toThrow('Authentication required')
    })

    it('should throw error when request has no authUser property', () => {
      const mockRequest = createMockRequest()

      expect(() => requireAuthUser(mockRequest)).toThrow('Authentication required')
    })

    it('should handle all user roles correctly', () => {
      const roles: Array<AuthUser['role']> = ['USER', 'MODERATOR', 'ADMIN']

      roles.forEach(role => {
        const mockUser: AuthUser = {
          id: `user-${role.toLowerCase()}`,
          email: `${role.toLowerCase()}@test.com`,
          role,
          isActive: true,
          isEmailVerified: true,
        }

        const mockRequest = createMockRequest(mockUser)

        const result = requireAuthUser(mockRequest)

        expect(result).toEqual(mockUser)
        expect(result.role).toBe(role)
      })
    })

    it('should handle inactive user correctly', () => {
      const mockUser: AuthUser = {
        id: 'inactive-user',
        email: 'inactive@test.com',
        role: 'USER',
        isActive: false,
        isEmailVerified: true,
      }

      const mockRequest = createMockRequest(mockUser)

      const result = requireAuthUser(mockRequest)

      expect(result).toEqual(mockUser)
      expect(result.isActive).toBe(false)
    })

    it('should handle unverified email user correctly', () => {
      const mockUser: AuthUser = {
        id: 'unverified-user',
        email: 'unverified@test.com',
        role: 'USER',
        isActive: true,
        isEmailVerified: false,
      }

      const mockRequest = createMockRequest(mockUser)

      const result = requireAuthUser(mockRequest)

      expect(result).toEqual(mockUser)
      expect(result.isEmailVerified).toBe(false)
    })
  })
})
