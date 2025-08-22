/**
 * Auth service unit tests
 * Tests for authentication service functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import argon2 from 'argon2'
import { Role } from '@prisma/client'

// Mock database
vi.mock('../../shared/database/index', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock argon2
vi.mock('argon2', () => ({
  default: {
    hash: vi.fn(),
    verify: vi.fn(),
    argon2id: 2,
  },
}))

import {
  hashPassword,
  verifyPassword,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  deactivateUser,
  reactivateUser,
  validatePasswordStrength,
} from '../auth.service'
import { db } from '../../shared/database/index'

describe('Auth Service', () => {
  // Helper function to create complete mock user with all required fields
  const createMockUser = (overrides: Partial<any> = {}) => ({
    id: '123',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    role: Role.USER,
    isEmailVerified: false,
    isActive: true,
    name: 'Test User',
    bio: null,
    oauthProvider: null,
    oauthId: null,
    lastPasswordChange: null,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    profilePictureId: null,
    isBanned: false,
    banReason: null,
    bannedUntil: null,
    bannedById: null,
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'testpassword123'
      const hashedPassword = 'hashedPassword123'

      ;(argon2.hash as any).mockResolvedValue(hashedPassword)

      const result = await hashPassword(password)

      expect(argon2.hash).toHaveBeenCalledWith(password, expect.any(Object))
      expect(result).toBe(hashedPassword)
    })

    it('should throw error when hashing fails', async () => {
      const password = 'testpassword123'

      ;(argon2.hash as any).mockRejectedValue(new Error('Hash failed'))

      await expect(hashPassword(password)).rejects.toThrow('Failed to hash password')
    })
  })

  describe('verifyPassword', () => {
    it('should verify password successfully', async () => {
      const password = 'testpassword123'
      const hashedPassword = 'hashedPassword123'

      ;(argon2.verify as any).mockResolvedValue(true)

      const result = await verifyPassword(password, hashedPassword)

      expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password)
      expect(result).toBe(true)
    })

    it('should return false for invalid password', async () => {
      const password = 'wrongpassword'
      const hashedPassword = 'hashedPassword123'

      ;(argon2.verify as any).mockResolvedValue(false)

      const result = await verifyPassword(password, hashedPassword)

      expect(result).toBe(false)
    })

    it('should throw error when verification fails', async () => {
      const password = 'testpassword123'
      const hashedPassword = 'hashedPassword123'

      ;(argon2.verify as any).mockRejectedValue(new Error('Compare failed'))

      await expect(verifyPassword(password, hashedPassword)).rejects.toThrow(
        'Failed to verify password',
      )
    })
  })

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const strongPassword = 'Password123!'

      expect(() => validatePasswordStrength(strongPassword)).not.toThrow()
    })

    it('should throw error for password too short', () => {
      const shortPassword = '123'

      expect(() => validatePasswordStrength(shortPassword)).toThrow(
        'Password must be at least 8 characters long',
      )
    })

    it('should throw error for password too long', () => {
      const longPassword = `${'a'.repeat(129)}1`

      expect(() => validatePasswordStrength(longPassword)).toThrow(
        'Password must be less than 128 characters',
      )
    })

    it('should throw error for password without letter', () => {
      const noLetterPassword = '12345678'

      expect(() => validatePasswordStrength(noLetterPassword)).toThrow(
        'Password must contain at least one letter and one number',
      )
    })

    it('should throw error for password without number', () => {
      const noNumberPassword = 'abcdefgh'

      expect(() => validatePasswordStrength(noNumberPassword)).toThrow(
        'Password must contain at least one letter and one number',
      )
    })
  })

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      ;(argon2.hash as any).mockResolvedValue('hashedPassword')
      vi.mocked(db.user.create).mockResolvedValue(mockUser)

      const result = await registerUser(userData)

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      })
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        bio: mockUser.bio,
        role: mockUser.role,
        isEmailVerified: mockUser.isEmailVerified,
        isActive: mockUser.isActive,
        lastLogin: mockUser.lastLogin.toISOString(),
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
      })
    })

    it('should register user with bio', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        bio: 'Test bio',
      }

      const userWithBio = createMockUser({ bio: 'Test bio' })

      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      ;(argon2.hash as any).mockResolvedValue('hashedPassword')
      vi.mocked(db.user.create).mockResolvedValue(userWithBio)

      const result = await registerUser(userData)

      expect(result.bio).toBe('Test bio')
    })

    it('should register user with trimmed name and bio', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: '  Test User  ',
        bio: '  Test bio  ',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      ;(argon2.hash as any).mockResolvedValue('hashedPassword')
      vi.mocked(db.user.create).mockResolvedValue(mockUser)

      await registerUser(userData)

      expect(db.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          passwordHash: 'hashedPassword',
          name: 'Test User',
          bio: 'Test bio',
          role: Role.USER,
          lastLogin: expect.any(Date),
        },
      })
    })

    it('should throw error for existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      }

      const existingUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(existingUser)

      await expect(registerUser(userData)).rejects.toThrow('User with this email already exists')
    })

    it('should throw error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        displayName: 'Test User',
      }

      await expect(registerUser(userData)).rejects.toThrow(
        'Password must be at least 8 characters long',
      )
    })

    it('should handle database P2002 error', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      ;(argon2.hash as any).mockResolvedValue('hashedPassword')
      vi.mocked(db.user.create).mockRejectedValue({ code: 'P2002' })

      await expect(registerUser(userData)).rejects.toThrow('User with this email already exists')
    })

    it('should handle general database error', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      ;(argon2.hash as any).mockResolvedValue('hashedPassword')
      vi.mocked(db.user.create).mockRejectedValue(new Error('Database error'))

      await expect(registerUser(userData)).rejects.toThrow('Failed to create user')
    })
  })

  describe('loginUser', () => {
    it('should authenticate user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue(mockUser)
      ;(argon2.verify as any).mockResolvedValue(true)

      const result = await loginUser(credentials)

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      })
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        bio: mockUser.bio,
        role: mockUser.role,
        isEmailVerified: mockUser.isEmailVerified,
        isActive: mockUser.isActive,
        lastLogin: mockUser.lastLogin.toISOString(),
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
      })
    })

    it('should throw error for non-existent user', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      await expect(loginUser(credentials)).rejects.toThrow('Invalid email or password')
    })

    it('should throw error for inactive user', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      const inactiveUser = createMockUser({ isActive: false })
      vi.mocked(db.user.findUnique).mockResolvedValue(inactiveUser)

      await expect(loginUser(credentials)).rejects.toThrow('Account is deactivated')
    })

    it('should throw error for invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(argon2.verify as any).mockResolvedValue(false)

      await expect(loginUser(credentials)).rejects.toThrow('Invalid email or password')
    })

    it('should handle database update error', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(argon2.verify as any).mockResolvedValue(true)
      vi.mocked(db.user.update).mockRejectedValue(new Error('Database error'))

      await expect(loginUser(credentials)).rejects.toThrow('Failed to update login time')
    })
  })

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = createMockUser()
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)

      const result = await getUserProfile('123')

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      })
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        bio: mockUser.bio,
        role: mockUser.role,
        isEmailVerified: mockUser.isEmailVerified,
        isActive: mockUser.isActive,
        lastLogin: mockUser.lastLogin.toISOString(),
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
      })
    })

    it('should throw error for non-existent user', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      await expect(getUserProfile('123')).rejects.toThrow('User not found')
    })

    it('should throw error for inactive user', async () => {
      const inactiveUser = createMockUser({ isActive: false })
      vi.mocked(db.user.findUnique).mockResolvedValue(inactiveUser)

      await expect(getUserProfile('123')).rejects.toThrow('Account is deactivated')
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const profileData = {
        name: 'Updated User',
        bio: 'Updated bio',
      }

      const mockUser = createMockUser()
      const updatedUser = createMockUser({ name: 'Updated User', bio: 'Updated bio' })

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue(updatedUser)

      const result = await updateUserProfile('123', profileData)

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      })
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          name: 'Updated User',
          bio: 'Updated bio',
        },
      })
      expect(result.name).toBe('Updated User')
      expect(result.bio).toBe('Updated bio')
    })

    it('should trim display name and bio', async () => {
      const profileData = {
        name: '  Updated User  ',
        bio: '  Updated bio  ',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue(mockUser)

      await updateUserProfile('123', profileData)

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          name: 'Updated User',
          bio: 'Updated bio',
        },
      })
    })

    it('should handle empty values', async () => {
      const profileData = {
        name: '',
        bio: '',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue(mockUser)

      await updateUserProfile('123', profileData)

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          name: null,
          bio: null,
        },
      })
    })

    it('should throw error for non-existent user', async () => {
      const profileData = {
        name: 'Updated User',
        bio: 'Updated bio',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      await expect(updateUserProfile('123', profileData)).rejects.toThrow('User not found')
    })

    it('should throw error for inactive user', async () => {
      const profileData = {
        name: 'Updated User',
        bio: 'Updated bio',
      }

      const inactiveUser = createMockUser({ isActive: false })
      vi.mocked(db.user.findUnique).mockResolvedValue(inactiveUser)

      await expect(updateUserProfile('123', profileData)).rejects.toThrow('Account is deactivated')
    })

    it('should handle database update error', async () => {
      const profileData = {
        name: 'Updated User',
        bio: 'Updated bio',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockRejectedValue(new Error('Database error'))

      await expect(updateUserProfile('123', profileData)).rejects.toThrow(
        'Failed to update profile',
      )
    })
  })

  describe('changeUserPassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(argon2.verify as any).mockImplementation((_hash: string, password: string) => {
        if (password === 'oldPassword123') return Promise.resolve(true)
        if (password === 'newPassword123') return Promise.resolve(false)
        return Promise.resolve(false)
      })
      ;(argon2.hash as any).mockResolvedValue('newHashedPassword')
      vi.mocked(db.user.update).mockResolvedValue(mockUser)

      await changeUserPassword('123', passwordData)

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          passwordHash: 'newHashedPassword',
          lastPasswordChange: expect.any(Date),
        },
      })
    })

    it('should throw error for non-existent user', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      await expect(changeUserPassword('123', passwordData)).rejects.toThrow('User not found')
    })

    it('should throw error for inactive user', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      }

      const inactiveUser = createMockUser({ isActive: false })
      vi.mocked(db.user.findUnique).mockResolvedValue(inactiveUser)

      await expect(changeUserPassword('123', passwordData)).rejects.toThrow(
        'Account is deactivated',
      )
    })

    it('should throw error for incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(argon2.verify as any).mockResolvedValue(false)

      await expect(changeUserPassword('123', passwordData)).rejects.toThrow(
        'Current password is incorrect',
      )
    })

    it('should throw error for weak new password', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'weak',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(argon2.verify as any).mockResolvedValue(true)

      await expect(changeUserPassword('123', passwordData)).rejects.toThrow(
        'Password must be at least 8 characters long',
      )
    })

    it('should throw error when new password is same as current', async () => {
      const passwordData = {
        currentPassword: 'samePassword123',
        newPassword: 'samePassword123',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(argon2.verify as any).mockResolvedValue(true)

      await expect(changeUserPassword('123', passwordData)).rejects.toThrow(
        'New password must be different from current password',
      )
    })

    it('should handle database update error', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      }

      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(argon2.verify as any).mockImplementation((_hash: string, password: string) => {
        if (password === 'oldPassword123') return Promise.resolve(true)
        if (password === 'newPassword123') return Promise.resolve(false)
        return Promise.resolve(false)
      })
      ;(argon2.hash as any).mockResolvedValue('newHashedPassword')
      vi.mocked(db.user.update).mockRejectedValue(new Error('Database error'))

      await expect(changeUserPassword('123', passwordData)).rejects.toThrow(
        'Failed to change password',
      )
    })
  })

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue(createMockUser({ isActive: false }))

      await deactivateUser('123')

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { isActive: false },
      })
    })

    it('should throw error for non-existent user', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      await expect(deactivateUser('123')).rejects.toThrow('User not found')
    })

    it('should throw error for already inactive user', async () => {
      const inactiveUser = createMockUser({ isActive: false })
      vi.mocked(db.user.findUnique).mockResolvedValue(inactiveUser)

      await expect(deactivateUser('123')).rejects.toThrow('Account is already deactivated')
    })

    it('should handle database update error', async () => {
      const mockUser = createMockUser()

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockRejectedValue(new Error('Database error'))

      await expect(deactivateUser('123')).rejects.toThrow('Failed to deactivate account')
    })
  })

  describe('reactivateUser', () => {
    it('should reactivate user successfully', async () => {
      const mockUser = createMockUser({ isActive: false })

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue(createMockUser({ isActive: true }))

      await reactivateUser('123')

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { isActive: true },
      })
    })

    it('should throw error for non-existent user', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      await expect(reactivateUser('123')).rejects.toThrow('User not found')
    })

    it('should throw error for already active user', async () => {
      const activeUser = createMockUser({ isActive: true })
      vi.mocked(db.user.findUnique).mockResolvedValue(activeUser)

      await expect(reactivateUser('123')).rejects.toThrow('Account is already active')
    })

    it('should handle database update error', async () => {
      const mockUser = createMockUser({ isActive: false })

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockRejectedValue(new Error('Database error'))

      await expect(reactivateUser('123')).rejects.toThrow('Failed to reactivate account')
    })
  })
})
