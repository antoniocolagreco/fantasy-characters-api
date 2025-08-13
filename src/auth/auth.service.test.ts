/**
 * Auth service unit tests
 * Tests for authentication service functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcrypt'
import { Role } from '@prisma/client'

// Mock database
vi.mock('../shared/database/index.js', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
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
} from './auth.service.js'
import { db } from '../shared/database/index.js'

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'testpassword123'
      const hashedPassword = 'hashedPassword123'

      ;(bcrypt.hash as any).mockResolvedValue(hashedPassword)

      const result = await hashPassword(password)

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12)
      expect(result).toBe(hashedPassword)
    })

    it('should throw error when hashing fails', async () => {
      const password = 'testpassword123'

      ;(bcrypt.hash as any).mockRejectedValue(new Error('Hash failed'))

      await expect(hashPassword(password)).rejects.toThrow('Failed to hash password')
    })
  })

  describe('verifyPassword', () => {
    it('should verify password successfully', async () => {
      const password = 'testpassword123'
      const hashedPassword = 'hashedPassword123'

      ;(bcrypt.compare as any).mockResolvedValue(true)

      const result = await verifyPassword(password, hashedPassword)

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(true)
    })

    it('should return false for invalid password', async () => {
      const password = 'wrongpassword'
      const hashedPassword = 'hashedPassword123'

      ;(bcrypt.compare as any).mockResolvedValue(false)

      const result = await verifyPassword(password, hashedPassword)

      expect(result).toBe(false)
    })

    it('should throw error when verification fails', async () => {
      const password = 'testpassword123'
      const hashedPassword = 'hashedPassword123'

      ;(bcrypt.compare as any).mockRejectedValue(new Error('Compare failed'))

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
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      role: Role.USER,
      isEmailVerified: false,
      isActive: true,
      displayName: 'Test User',
      bio: null,
      oauthProvider: null,
      oauthId: null,
      lastPasswordChange: null,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profilePictureId: null,
    }

    it('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      ;(bcrypt.hash as any).mockResolvedValue('hashedPassword')
      vi.mocked(db.user.create).mockResolvedValue(mockUser)

      const result = await registerUser(userData)

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      })
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.displayName,
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
        displayName: 'Test User',
        bio: 'Test bio',
      }

      const userWithBio = { ...mockUser, bio: 'Test bio' }

      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      ;(bcrypt.hash as any).mockResolvedValue('hashedPassword')
      vi.mocked(db.user.create).mockResolvedValue(userWithBio)

      const result = await registerUser(userData)

      expect(result.bio).toBe('Test bio')
    })

    it('should register user with trimmed displayName and bio', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        displayName: '  Test User  ',
        bio: '  Test bio  ',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      ;(bcrypt.hash as any).mockResolvedValue('hashedPassword')
      vi.mocked(db.user.create).mockResolvedValue(mockUser)

      await registerUser(userData)

      expect(db.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          passwordHash: 'hashedPassword',
          displayName: 'Test User',
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
        displayName: 'Test User',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)

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
      ;(bcrypt.hash as any).mockResolvedValue('hashedPassword')
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
      ;(bcrypt.hash as any).mockResolvedValue('hashedPassword')
      vi.mocked(db.user.create).mockRejectedValue(new Error('Database error'))

      await expect(registerUser(userData)).rejects.toThrow('Failed to create user')
    })
  })

  describe('loginUser', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      role: Role.USER,
      isEmailVerified: false,
      isActive: true,
      displayName: 'Test User',
      bio: null,
      oauthProvider: null,
      oauthId: null,
      lastPasswordChange: null,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profilePictureId: null,
    }

    it('should authenticate user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockResolvedValue(true)

      const result = await loginUser(credentials)

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      })
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.displayName,
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

      const inactiveUser = { ...mockUser, isActive: false }
      vi.mocked(db.user.findUnique).mockResolvedValue(inactiveUser)

      await expect(loginUser(credentials)).rejects.toThrow('Account is deactivated')
    })

    it('should throw error for invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockResolvedValue(false)

      await expect(loginUser(credentials)).rejects.toThrow('Invalid email or password')
    })

    it('should handle database update error', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockResolvedValue(true)
      vi.mocked(db.user.update).mockRejectedValue(new Error('Database error'))

      await expect(loginUser(credentials)).rejects.toThrow('Failed to update login time')
    })
  })

  describe('getUserProfile', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      role: Role.USER,
      isEmailVerified: false,
      isActive: true,
      displayName: 'Test User',
      bio: null,
      oauthProvider: null,
      oauthId: null,
      lastPasswordChange: null,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profilePictureId: null,
    }

    it('should get user profile successfully', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)

      const result = await getUserProfile('123')

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      })
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.displayName,
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
      const inactiveUser = { ...mockUser, isActive: false }
      vi.mocked(db.user.findUnique).mockResolvedValue(inactiveUser)

      await expect(getUserProfile('123')).rejects.toThrow('Account is deactivated')
    })
  })

  describe('updateUserProfile', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      role: Role.USER,
      isEmailVerified: false,
      isActive: true,
      displayName: 'Test User',
      bio: 'Test bio',
      oauthProvider: null,
      oauthId: null,
      lastPasswordChange: null,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profilePictureId: null,
    }

    it('should update user profile successfully', async () => {
      const profileData = {
        displayName: 'Updated User',
        bio: 'Updated bio',
      }

      const updatedUser = { ...mockUser, ...profileData }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue(updatedUser)

      const result = await updateUserProfile('123', profileData)

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      })
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          displayName: 'Updated User',
          bio: 'Updated bio',
        },
      })
      expect(result.displayName).toBe('Updated User')
      expect(result.bio).toBe('Updated bio')
    })

    it('should trim display name and bio', async () => {
      const profileData = {
        displayName: '  Updated User  ',
        bio: '  Updated bio  ',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue(mockUser)

      await updateUserProfile('123', profileData)

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          displayName: 'Updated User',
          bio: 'Updated bio',
        },
      })
    })

    it('should handle empty values', async () => {
      const profileData = {
        displayName: '',
        bio: '',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue(mockUser)

      await updateUserProfile('123', profileData)

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          displayName: null,
          bio: null,
        },
      })
    })

    it('should throw error for non-existent user', async () => {
      const profileData = {
        displayName: 'Updated User',
        bio: 'Updated bio',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      await expect(updateUserProfile('123', profileData)).rejects.toThrow('User not found')
    })

    it('should throw error for inactive user', async () => {
      const profileData = {
        displayName: 'Updated User',
        bio: 'Updated bio',
      }

      const inactiveUser = { ...mockUser, isActive: false }
      vi.mocked(db.user.findUnique).mockResolvedValue(inactiveUser)

      await expect(updateUserProfile('123', profileData)).rejects.toThrow('Account is deactivated')
    })

    it('should handle database update error', async () => {
      const profileData = {
        displayName: 'Updated User',
        bio: 'Updated bio',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockRejectedValue(new Error('Database error'))

      await expect(updateUserProfile('123', profileData)).rejects.toThrow(
        'Failed to update profile',
      )
    })
  })

  describe('changeUserPassword', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      role: Role.USER,
      isEmailVerified: false,
      isActive: true,
      displayName: 'Test User',
      bio: null,
      oauthProvider: null,
      oauthId: null,
      lastPasswordChange: null,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profilePictureId: null,
    }

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockImplementation((password: string) => {
        if (password === 'oldPassword123') return Promise.resolve(true)
        if (password === 'newPassword123') return Promise.resolve(false)
        return Promise.resolve(false)
      })
      ;(bcrypt.hash as any).mockResolvedValue('newHashedPassword')
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

      const inactiveUser = { ...mockUser, isActive: false }
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

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockResolvedValue(false)

      await expect(changeUserPassword('123', passwordData)).rejects.toThrow(
        'Current password is incorrect',
      )
    })

    it('should throw error for weak new password', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'weak',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockResolvedValue(true)

      await expect(changeUserPassword('123', passwordData)).rejects.toThrow(
        'Password must be at least 8 characters long',
      )
    })

    it('should throw error when new password is same as current', async () => {
      const passwordData = {
        currentPassword: 'samePassword123',
        newPassword: 'samePassword123',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockResolvedValue(true)

      await expect(changeUserPassword('123', passwordData)).rejects.toThrow(
        'New password must be different from current password',
      )
    })

    it('should handle database update error', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockImplementation((password: string) => {
        if (password === 'oldPassword123') return Promise.resolve(true)
        if (password === 'newPassword123') return Promise.resolve(false)
        return Promise.resolve(false)
      })
      ;(bcrypt.hash as any).mockResolvedValue('newHashedPassword')
      vi.mocked(db.user.update).mockRejectedValue(new Error('Database error'))

      await expect(changeUserPassword('123', passwordData)).rejects.toThrow(
        'Failed to change password',
      )
    })
  })

  describe('deactivateUser', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      role: Role.USER,
      isEmailVerified: false,
      isActive: true,
      displayName: 'Test User',
      bio: null,
      oauthProvider: null,
      oauthId: null,
      lastPasswordChange: null,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profilePictureId: null,
    }

    it('should deactivate user successfully', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue({ ...mockUser, isActive: false })

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
      const inactiveUser = { ...mockUser, isActive: false }
      vi.mocked(db.user.findUnique).mockResolvedValue(inactiveUser)

      await expect(deactivateUser('123')).rejects.toThrow('Account is already deactivated')
    })

    it('should handle database update error', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockRejectedValue(new Error('Database error'))

      await expect(deactivateUser('123')).rejects.toThrow('Failed to deactivate account')
    })
  })

  describe('reactivateUser', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      role: Role.USER,
      isEmailVerified: false,
      isActive: false,
      displayName: 'Test User',
      bio: null,
      oauthProvider: null,
      oauthId: null,
      lastPasswordChange: null,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profilePictureId: null,
    }

    it('should reactivate user successfully', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockResolvedValue({ ...mockUser, isActive: true })

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
      const activeUser = { ...mockUser, isActive: true }
      vi.mocked(db.user.findUnique).mockResolvedValue(activeUser)

      await expect(reactivateUser('123')).rejects.toThrow('Account is already active')
    })

    it('should handle database update error', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(db.user.update).mockRejectedValue(new Error('Database error'))

      await expect(reactivateUser('123')).rejects.toThrow('Failed to reactivate account')
    })
  })
})
