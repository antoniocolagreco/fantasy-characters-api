import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { Role } from '@prisma/client'
import {
  register,
  login,
  logout,
  getProfile,
  getProfileById,
  updateProfile,
  updateProfileById,
  changePassword,
  changePasswordById,
  deactivateAccount,
  deactivateAccountById,
} from '../auth.controller'
import * as authService from '../auth.service'
import * as jwtUtils from '../jwt.utils'

// Mock the dependencies
vi.mock('../auth.service')
vi.mock('../jwt.utils')

describe('Auth Controller', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    bio: null,
    role: Role.USER,
    isEmailVerified: false,
    isActive: true,
    lastLogin: '2025-08-13T18:52:48.501Z',
    createdAt: '2025-08-13T18:52:48.501Z',
    updatedAt: '2025-08-13T18:52:48.501Z',
  }

  const mockTokenResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
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
  }

  let mockRequest: Partial<FastifyRequest> & { authUser?: any }
  let mockReply: Partial<FastifyReply>

  beforeEach(() => {
    vi.clearAllMocks()

    mockReply = {
      status: vi.fn().mockReturnThis(),
    }

    mockRequest = {
      body: {},
      params: {},
    }
  })

  describe('register', () => {
    it('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      }

      mockRequest.body = userData
      vi.mocked(authService.registerUser).mockResolvedValue(mockUser)
      vi.mocked(jwtUtils.createTokenResponse).mockReturnValue(mockTokenResponse)

      const result = await register(
        mockRequest as FastifyRequest<{ Body: typeof userData }>,
        mockReply as FastifyReply,
      )

      expect(authService.registerUser).toHaveBeenCalledWith(userData)
      expect(jwtUtils.createTokenResponse).toHaveBeenCalledWith(mockUser)
      expect(mockReply.status).toHaveBeenCalledWith(201)
      expect(result).toEqual(mockTokenResponse)
    })
  })

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      mockRequest.body = loginData
      vi.mocked(authService.loginUser).mockResolvedValue(mockUser)
      vi.mocked(jwtUtils.createTokenResponse).mockReturnValue(mockTokenResponse)

      const result = await login(
        mockRequest as FastifyRequest<{ Body: typeof loginData }>,
        mockReply as FastifyReply,
      )

      expect(authService.loginUser).toHaveBeenCalledWith(loginData)
      expect(jwtUtils.createTokenResponse).toHaveBeenCalledWith(mockUser)
      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(result).toEqual(mockTokenResponse)
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const result = await logout(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(result).toEqual({ message: 'Logged out successfully' })
    })
  })

  describe('getProfile', () => {
    it('should get current user profile successfully', async () => {
      mockRequest.authUser = mockUser
      vi.mocked(authService.getUserProfile).mockResolvedValue(mockUser)

      const result = await getProfile(mockRequest as FastifyRequest)

      expect(result).toEqual(mockUser)
    })

    it('should throw error when user not authenticated', async () => {
      mockRequest.authUser = undefined

      await expect(getProfile(mockRequest as FastifyRequest)).rejects.toThrow(
        'User not authenticated',
      )
    })
  })

  describe('getProfileById', () => {
    it('should get user profile by ID successfully', async () => {
      mockRequest.params = { id: '123' }
      vi.mocked(authService.getUserProfile).mockResolvedValue(mockUser)

      const result = await getProfileById(mockRequest as FastifyRequest<{ Params: { id: string } }>)

      expect(authService.getUserProfile).toHaveBeenCalledWith('123')
      expect(result).toEqual(mockUser)
    })
  })

  describe('updateProfile', () => {
    it('should update current user profile successfully', async () => {
      const profileData = { name: 'Updated Name' }
      mockRequest.body = profileData
      mockRequest.authUser = mockUser
      vi.mocked(authService.updateUserProfile).mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      })

      const result = await updateProfile(
        mockRequest as FastifyRequest<{ Body: typeof profileData }>,
      )

      expect(authService.updateUserProfile).toHaveBeenCalledWith(mockUser.id, profileData)
      expect(result).toEqual({ ...mockUser, name: 'Updated Name' })
    })

    it('should throw error when user not authenticated', async () => {
      const profileData = { name: 'Updated Name' }
      mockRequest.body = profileData
      mockRequest.authUser = undefined

      await expect(
        updateProfile(mockRequest as FastifyRequest<{ Body: typeof profileData }>),
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('updateProfileById', () => {
    it('should update user profile by ID successfully', async () => {
      const profileData = { name: 'Updated Name' }
      mockRequest.params = { id: '123' }
      mockRequest.body = profileData
      vi.mocked(authService.updateUserProfile).mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      })

      const result = await updateProfileById(
        mockRequest as FastifyRequest<{ Params: { id: string }; Body: typeof profileData }>,
      )

      expect(authService.updateUserProfile).toHaveBeenCalledWith('123', profileData)
      expect(result).toEqual({ ...mockUser, name: 'Updated Name' })
    })
  })

  describe('changePassword', () => {
    it('should change current user password successfully', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      }
      mockRequest.body = passwordData
      mockRequest.authUser = mockUser
      vi.mocked(authService.changeUserPassword).mockResolvedValue()

      const result = await changePassword(
        mockRequest as FastifyRequest<{ Body: typeof passwordData }>,
        mockReply as FastifyReply,
      )

      expect(authService.changeUserPassword).toHaveBeenCalledWith(mockUser.id, passwordData)
      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(result).toEqual({ message: 'Password changed successfully' })
    })

    it('should throw error when user not authenticated', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      }
      mockRequest.body = passwordData
      mockRequest.authUser = undefined

      await expect(
        changePassword(
          mockRequest as FastifyRequest<{ Body: typeof passwordData }>,
          mockReply as FastifyReply,
        ),
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('changePasswordById', () => {
    it('should change password by user ID successfully', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      }
      mockRequest.params = { id: '123' }
      mockRequest.body = passwordData
      vi.mocked(authService.changeUserPassword).mockResolvedValue()

      const result = await changePasswordById(
        mockRequest as FastifyRequest<{ Params: { id: string }; Body: typeof passwordData }>,
        mockReply as FastifyReply,
      )

      expect(authService.changeUserPassword).toHaveBeenCalledWith('123', passwordData)
      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(result).toEqual({ message: 'Password changed successfully' })
    })
  })

  describe('deactivateAccount', () => {
    it('should deactivate current user account successfully', async () => {
      mockRequest.authUser = mockUser
      vi.mocked(authService.deactivateUser).mockResolvedValue()

      const result = await deactivateAccount(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
      )

      expect(authService.deactivateUser).toHaveBeenCalledWith(mockUser.id)
      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(result).toEqual({ message: 'Account deactivated successfully' })
    })

    it('should throw error when user not authenticated', async () => {
      mockRequest.authUser = undefined

      await expect(
        deactivateAccount(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('deactivateAccountById', () => {
    it('should deactivate user account by ID successfully', async () => {
      mockRequest.params = { id: '123' }
      vi.mocked(authService.deactivateUser).mockResolvedValue()

      const result = await deactivateAccountById(
        mockRequest as FastifyRequest<{ Params: { id: string } }>,
        mockReply as FastifyReply,
      )

      expect(authService.deactivateUser).toHaveBeenCalledWith('123')
      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(result).toEqual({ message: 'Account deactivated successfully' })
    })
  })
})
