/**
 * RBAC Service Tests - Complete test suite for Role-Based Access Control
 * Target: 90%+ coverage for critical security functionality
 */

import { describe, it, expect } from 'vitest'
import { Role, Visibility } from '@prisma/client'
import {
  rbacService,
  isRbacEnabled,
  hasRoleOrHigher,
  canAccessByVisibility,
  canModifyResource,
  canDeleteResource,
  canCreateForUser,
  canAccessUserProfile,
  canModifyUserProfile,
  canAccessAdminFeatures,
  canAccessModeratorFeatures,
  canViewStatistics,
  enforcePermission,
  enforceAuthentication,
  filterVisibleResources,
  getOwnershipFilter,
  type AuthUser,
  type ResourceOwnership,
} from '../rbac.service'

// Mock users for testing
const mockUser: AuthUser = {
  id: 'user-123',
  role: 'USER' as Role,
  isActive: true,
  isEmailVerified: true,
}

const mockModerator: AuthUser = {
  id: 'mod-123',
  role: 'MODERATOR' as Role,
  isActive: true,
  isEmailVerified: true,
}

const mockAdmin: AuthUser = {
  id: 'admin-123',
  role: 'ADMIN' as Role,
  isActive: true,
  isEmailVerified: true,
}

const mockResource: ResourceOwnership = {
  ownerId: 'user-123',
  visibility: 'PUBLIC' as Visibility,
}

const mockOrphanedResource: ResourceOwnership = {
  ownerId: null,
  visibility: 'PUBLIC' as Visibility,
}

describe('RBAC Service', () => {
  describe('isRbacEnabled', () => {
    it('should always return true', () => {
      expect(isRbacEnabled()).toBe(true)
    })
  })

  describe('hasRoleOrHigher', () => {
    it('should return true for same role', () => {
      expect(hasRoleOrHigher('USER', 'USER')).toBe(true)
      expect(hasRoleOrHigher('MODERATOR', 'MODERATOR')).toBe(true)
      expect(hasRoleOrHigher('ADMIN', 'ADMIN')).toBe(true)
    })

    it('should return true for higher role', () => {
      expect(hasRoleOrHigher('MODERATOR', 'USER')).toBe(true)
      expect(hasRoleOrHigher('ADMIN', 'USER')).toBe(true)
      expect(hasRoleOrHigher('ADMIN', 'MODERATOR')).toBe(true)
    })

    it('should return false for lower role', () => {
      expect(hasRoleOrHigher('USER', 'MODERATOR')).toBe(false)
      expect(hasRoleOrHigher('USER', 'ADMIN')).toBe(false)
      expect(hasRoleOrHigher('MODERATOR', 'ADMIN')).toBe(false)
    })
  })

  describe('canAccessByVisibility', () => {
    describe('PUBLIC visibility', () => {
      const publicResource = { visibility: 'PUBLIC' as Visibility, ownerId: 'other-user' }

      it('should allow access for any user', () => {
        expect(canAccessByVisibility(mockUser, publicResource)).toBe(true)
        expect(canAccessByVisibility(mockModerator, publicResource)).toBe(true)
        expect(canAccessByVisibility(mockAdmin, publicResource)).toBe(true)
      })

      it('should allow access for unauthenticated users', () => {
        expect(canAccessByVisibility(null, publicResource)).toBe(true)
      })
    })

    describe('PRIVATE visibility', () => {
      const privateResource = { visibility: 'PRIVATE' as Visibility, ownerId: 'user-123' }
      const otherPrivateResource = { visibility: 'PRIVATE' as Visibility, ownerId: 'other-user' }

      it('should allow access for resource owner', () => {
        expect(canAccessByVisibility(mockUser, privateResource)).toBe(true)
      })

      it('should deny access for non-owner users', () => {
        expect(canAccessByVisibility(mockUser, otherPrivateResource)).toBe(false)
      })

      it('should allow access for moderators', () => {
        expect(canAccessByVisibility(mockModerator, otherPrivateResource)).toBe(true)
      })

      it('should allow access for admins', () => {
        expect(canAccessByVisibility(mockAdmin, otherPrivateResource)).toBe(true)
      })

      it('should deny access for unauthenticated users', () => {
        expect(canAccessByVisibility(null, privateResource)).toBe(false)
      })
    })

    describe('HIDDEN visibility', () => {
      const hiddenResource = { visibility: 'HIDDEN' as Visibility, ownerId: 'user-123' }

      it('should deny access for regular users', () => {
        expect(canAccessByVisibility(mockUser, hiddenResource)).toBe(false)
      })

      it('should deny access for moderators', () => {
        expect(canAccessByVisibility(mockModerator, hiddenResource)).toBe(false)
      })

      it('should allow access for admins', () => {
        expect(canAccessByVisibility(mockAdmin, hiddenResource)).toBe(true)
      })

      it('should deny access for unauthenticated users', () => {
        expect(canAccessByVisibility(null, hiddenResource)).toBe(false)
      })
    })

    it('should return false for invalid visibility', () => {
      const invalidResource = { visibility: 'INVALID' as Visibility, ownerId: 'user-123' }
      expect(canAccessByVisibility(mockUser, invalidResource)).toBe(false)
    })
  })

  describe('canModifyResource', () => {
    it('should allow owner to modify their resource', () => {
      expect(canModifyResource(mockUser, mockResource)).toBe(true)
    })

    it('should deny non-owner users to modify resource', () => {
      const otherResource = { ownerId: 'other-user', visibility: 'PUBLIC' as Visibility }
      expect(canModifyResource(mockUser, otherResource)).toBe(false)
    })

    it('should allow moderator to modify public resources', () => {
      const publicResource = { ownerId: 'other-user', visibility: 'PUBLIC' as Visibility }
      expect(canModifyResource(mockModerator, publicResource)).toBe(true)
    })

    it('should allow moderator to modify orphaned resources', () => {
      expect(canModifyResource(mockModerator, mockOrphanedResource)).toBe(true)
    })

    it('should deny moderator to modify private resources of others', () => {
      const otherPrivateResource = { ownerId: 'other-user', visibility: 'PRIVATE' as Visibility }
      expect(canModifyResource(mockModerator, otherPrivateResource)).toBe(false)
    })

    it('should allow admin to modify any resource', () => {
      const anyResource = { ownerId: 'other-user', visibility: 'PRIVATE' as Visibility }
      expect(canModifyResource(mockAdmin, anyResource)).toBe(true)
    })

    it('should deny unauthenticated users', () => {
      expect(canModifyResource(null, mockResource)).toBe(false)
    })
  })

  describe('canDeleteResource', () => {
    it('should allow owner to delete their resource', () => {
      expect(canDeleteResource(mockUser, mockResource)).toBe(true)
    })

    it('should deny non-owner users to delete resource', () => {
      const otherResource = { ownerId: 'other-user', visibility: 'PUBLIC' as Visibility }
      expect(canDeleteResource(mockUser, otherResource)).toBe(false)
    })

    it('should allow moderator to delete orphaned resources', () => {
      expect(canDeleteResource(mockModerator, mockOrphanedResource)).toBe(true)
    })

    it('should deny moderator to delete resources owned by others', () => {
      const otherResource = { ownerId: 'other-user', visibility: 'PUBLIC' as Visibility }
      expect(canDeleteResource(mockModerator, otherResource)).toBe(false)
    })

    it('should allow admin to delete any resource', () => {
      const anyResource = { ownerId: 'other-user', visibility: 'PRIVATE' as Visibility }
      expect(canDeleteResource(mockAdmin, anyResource)).toBe(true)
    })

    it('should deny unauthenticated users', () => {
      expect(canDeleteResource(null, mockResource)).toBe(false)
    })
  })

  describe('canCreateForUser', () => {
    it('should allow user to create for themselves', () => {
      expect(canCreateForUser(mockUser, 'user-123')).toBe(true)
    })

    it('should deny user to create for others', () => {
      expect(canCreateForUser(mockUser, 'other-user')).toBe(false)
    })

    it('should allow admin to create for anyone', () => {
      expect(canCreateForUser(mockAdmin, 'other-user')).toBe(true)
    })

    it('should deny unauthenticated users', () => {
      expect(canCreateForUser(null, 'user-123')).toBe(false)
    })
  })

  describe('canAccessUserProfile', () => {
    it('should allow user to access their own profile', () => {
      expect(canAccessUserProfile(mockUser, 'user-123')).toBe(true)
    })

    it('should deny user to access other profiles', () => {
      expect(canAccessUserProfile(mockUser, 'other-user')).toBe(false)
    })

    it('should allow moderator to access any profile', () => {
      expect(canAccessUserProfile(mockModerator, 'other-user')).toBe(true)
    })

    it('should allow admin to access any profile', () => {
      expect(canAccessUserProfile(mockAdmin, 'other-user')).toBe(true)
    })

    it('should deny unauthenticated users', () => {
      expect(canAccessUserProfile(null, 'user-123')).toBe(false)
    })
  })

  describe('canModifyUserProfile', () => {
    it('should allow user to modify their own profile', () => {
      expect(canModifyUserProfile(mockUser, 'user-123')).toBe(true)
    })

    it('should deny user to modify other profiles', () => {
      expect(canModifyUserProfile(mockUser, 'other-user')).toBe(false)
    })

    it('should deny moderator to modify other profiles', () => {
      expect(canModifyUserProfile(mockModerator, 'other-user')).toBe(false)
    })

    it('should allow admin to modify any profile', () => {
      expect(canModifyUserProfile(mockAdmin, 'other-user')).toBe(true)
    })

    it('should deny unauthenticated users', () => {
      expect(canModifyUserProfile(null, 'user-123')).toBe(false)
    })
  })

  describe('canAccessAdminFeatures', () => {
    it('should deny regular users', () => {
      expect(canAccessAdminFeatures(mockUser)).toBe(false)
    })

    it('should deny moderators', () => {
      expect(canAccessAdminFeatures(mockModerator)).toBe(false)
    })

    it('should allow admins', () => {
      expect(canAccessAdminFeatures(mockAdmin)).toBe(true)
    })

    it('should deny unauthenticated users', () => {
      expect(canAccessAdminFeatures(null)).toBe(false)
    })
  })

  describe('canAccessModeratorFeatures', () => {
    it('should deny regular users', () => {
      expect(canAccessModeratorFeatures(mockUser)).toBe(false)
    })

    it('should allow moderators', () => {
      expect(canAccessModeratorFeatures(mockModerator)).toBe(true)
    })

    it('should allow admins', () => {
      expect(canAccessModeratorFeatures(mockAdmin)).toBe(true)
    })

    it('should deny unauthenticated users', () => {
      expect(canAccessModeratorFeatures(null)).toBe(false)
    })
  })

  describe('canViewStatistics', () => {
    it('should deny regular users', () => {
      expect(canViewStatistics(mockUser)).toBe(false)
    })

    it('should allow moderators', () => {
      expect(canViewStatistics(mockModerator)).toBe(true)
    })

    it('should allow admins', () => {
      expect(canViewStatistics(mockAdmin)).toBe(true)
    })

    it('should deny unauthenticated users', () => {
      expect(canViewStatistics(null)).toBe(false)
    })
  })

  describe('enforcePermission', () => {
    it('should not throw when permission is granted', () => {
      expect(() => enforcePermission(true)).not.toThrow()
    })

    it('should throw ForbiddenError when permission is denied', () => {
      expect(() => enforcePermission(false)).toThrow('Access denied')
    })

    it('should throw custom message when provided', () => {
      expect(() => enforcePermission(false, 'Custom message')).toThrow('Custom message')
    })
  })

  describe('enforceAuthentication', () => {
    it('should not throw when user is authenticated', () => {
      expect(() => enforceAuthentication(mockUser)).not.toThrow()
    })

    it('should throw UnauthorizedError when user is null', () => {
      expect(() => enforceAuthentication(null)).toThrow('Authentication required')
    })
  })

  describe('filterVisibleResources', () => {
    const resources = [
      { id: '1', visibility: 'PUBLIC' as Visibility, ownerId: 'user-123' },
      { id: '2', visibility: 'PRIVATE' as Visibility, ownerId: 'user-123' },
      { id: '3', visibility: 'PRIVATE' as Visibility, ownerId: 'other-user' },
      { id: '4', visibility: 'HIDDEN' as Visibility, ownerId: 'user-123' },
      { id: '5', visibility: 'PUBLIC' as Visibility, ownerId: null },
    ]

    it('should filter resources for regular user', () => {
      const filtered = filterVisibleResources(mockUser, resources)
      expect(filtered).toHaveLength(3) // public + own private
      expect(filtered.map(r => r.id)).toEqual(['1', '2', '5'])
    })

    it('should filter resources for moderator', () => {
      const filtered = filterVisibleResources(mockModerator, resources)
      expect(filtered).toHaveLength(4) // public + all private (no hidden)
      expect(filtered.map(r => r.id)).toEqual(['1', '2', '3', '5'])
    })

    it('should filter resources for admin', () => {
      const filtered = filterVisibleResources(mockAdmin, resources)
      expect(filtered).toHaveLength(5) // all resources
      expect(filtered.map(r => r.id)).toEqual(['1', '2', '3', '4', '5'])
    })

    it('should filter resources for unauthenticated user', () => {
      const filtered = filterVisibleResources(null, resources)
      expect(filtered).toHaveLength(2) // only public
      expect(filtered.map(r => r.id)).toEqual(['1', '5'])
    })
  })

  describe('getOwnershipFilter', () => {
    it('should return public-only filter for unauthenticated users', () => {
      const filter = getOwnershipFilter(null)
      expect(filter).toEqual({
        OR: [{ visibility: 'PUBLIC' }],
      })
    })

    it('should return empty filter for admin (see everything)', () => {
      const filter = getOwnershipFilter(mockAdmin)
      expect(filter).toEqual({})
    })

    it('should return empty filter for moderator (see everything)', () => {
      const filter = getOwnershipFilter(mockModerator)
      expect(filter).toEqual({})
    })

    it('should return public + own private filter for regular user', () => {
      const filter = getOwnershipFilter(mockUser)
      expect(filter).toEqual({
        OR: [{ visibility: 'PUBLIC' }, { ownerId: 'user-123', visibility: 'PRIVATE' }],
      })
    })
  })

  describe('rbacService object', () => {
    it('should export all functions', () => {
      expect(rbacService.isRbacEnabled).toBe(isRbacEnabled)
      expect(rbacService.hasRoleOrHigher).toBe(hasRoleOrHigher)
      expect(rbacService.canAccessByVisibility).toBe(canAccessByVisibility)
      expect(rbacService.canModifyResource).toBe(canModifyResource)
      expect(rbacService.canDeleteResource).toBe(canDeleteResource)
      expect(rbacService.canCreateForUser).toBe(canCreateForUser)
      expect(rbacService.canAccessUserProfile).toBe(canAccessUserProfile)
      expect(rbacService.canModifyUserProfile).toBe(canModifyUserProfile)
      expect(rbacService.canAccessAdminFeatures).toBe(canAccessAdminFeatures)
      expect(rbacService.canAccessModeratorFeatures).toBe(canAccessModeratorFeatures)
      expect(rbacService.canViewStatistics).toBe(canViewStatistics)
      expect(rbacService.enforcePermission).toBe(enforcePermission)
      expect(rbacService.enforceAuthentication).toBe(enforceAuthentication)
      expect(rbacService.filterVisibleResources).toBe(filterVisibleResources)
      expect(rbacService.getOwnershipFilter).toBe(getOwnershipFilter)
    })
  })
})
