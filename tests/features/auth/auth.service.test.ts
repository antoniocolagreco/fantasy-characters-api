import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authService } from '@/features/auth/auth.service'
import { generateAccessToken } from '@/features/auth/jwt.service'
import { verifyPassword } from '@/features/auth/password.service'
import { refreshTokenRepository, userService } from '@/features/users'
import { err } from '@/shared/errors'

// Mock dependencies
vi.mock('@/features/users', () => ({
    userService: {
        getByEmail: vi.fn(),
        getById: vi.fn(),
        create: vi.fn(),
        updateLastLogin: vi.fn(),
        changePassword: vi.fn(),
    },
    refreshTokenRepository: {
        findByToken: vi.fn(),
        create: vi.fn(),
        revokeByToken: vi.fn(),
        revokeAllByUserId: vi.fn(),
    },
}))

vi.mock('@/features/auth/jwt.service', () => ({
    generateAccessToken: vi.fn(),
}))

vi.mock('@/features/auth/password.service', () => ({
    verifyPassword: vi.fn(),
}))

vi.mock('@/shared/errors', () => ({
    err: vi.fn(),
}))

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('login', () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            passwordHash: 'hashed-password',
            role: 'USER' as const,
            isActive: true,
            isBanned: false,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            lastLogin: '2023-01-01T00:00:00.000Z',
            isEmailVerified: true,
        }

        const credentials = {
            email: 'test@example.com',
            password: 'password123',
        }

        it('should successfully login with valid credentials', async () => {
            // Arrange
            vi.mocked(userService.getByEmail).mockResolvedValue(mockUser)
            vi.mocked(verifyPassword).mockResolvedValue(true)
            vi.mocked(generateAccessToken).mockReturnValue('access-token')
            vi.mocked(refreshTokenRepository.create).mockResolvedValue({
                id: 'token-id',
                token: 'refresh-token',
                userId: 'user-123',
                expiresAt: '2024-01-01T00:00:00.000Z',
                isRevoked: false,
                deviceInfo: 'test-device',
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-01T00:00:00.000Z',
            })

            // Act
            const result = await authService.login(credentials, 'test-device')

            // Assert
            expect(result).toEqual({
                id: 'user-123',
                email: 'test@example.com',
                role: 'USER',
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            })
            expect(userService.updateLastLogin).toHaveBeenCalledWith('user-123')
        })

        it('should throw error when user does not exist', async () => {
            // Arrange
            vi.mocked(userService.getByEmail).mockResolvedValue(null)
            const mockError = new Error('INVALID_CREDENTIALS: Invalid email or password')
            Object.assign(mockError, { code: 'INVALID_CREDENTIALS', status: 401 })
            vi.mocked(err).mockReturnValue(mockError as any)

            // Act & Assert
            await expect(authService.login(credentials)).rejects.toThrow()
            expect(err).toHaveBeenCalledWith('INVALID_CREDENTIALS', 'Invalid email or password')
        })

        it('should throw error when password is invalid', async () => {
            // Arrange
            vi.mocked(userService.getByEmail).mockResolvedValue(mockUser)
            vi.mocked(verifyPassword).mockResolvedValue(false)
            const mockError = new Error('INVALID_CREDENTIALS: Invalid email or password')
            Object.assign(mockError, { code: 'INVALID_CREDENTIALS', status: 401 })
            vi.mocked(err).mockReturnValue(mockError as any)

            // Act & Assert
            await expect(authService.login(credentials)).rejects.toThrow()
            expect(err).toHaveBeenCalledWith('INVALID_CREDENTIALS', 'Invalid email or password')
        })

        it('should throw error when user is not active', async () => {
            // Arrange
            const inactiveUser = { ...mockUser, isActive: false }
            vi.mocked(userService.getByEmail).mockResolvedValue(inactiveUser)
            vi.mocked(verifyPassword).mockResolvedValue(true)
            const mockError = new Error('FORBIDDEN: Account is disabled')
            Object.assign(mockError, { code: 'FORBIDDEN', status: 403 })
            vi.mocked(err).mockReturnValue(mockError as any)

            // Act & Assert
            await expect(authService.login(credentials)).rejects.toThrow()
            expect(err).toHaveBeenCalledWith('FORBIDDEN', 'Account is disabled')
        })

        it('should throw error when user is banned', async () => {
            // Arrange
            const bannedUser = { ...mockUser, isBanned: true }
            vi.mocked(userService.getByEmail).mockResolvedValue(bannedUser)
            vi.mocked(verifyPassword).mockResolvedValue(true)
            const mockError = new Error('FORBIDDEN: Account is banned')
            Object.assign(mockError, { code: 'FORBIDDEN', status: 403 })
            vi.mocked(err).mockReturnValue(mockError as any)

            // Act & Assert
            await expect(authService.login(credentials)).rejects.toThrow()
            expect(err).toHaveBeenCalledWith('FORBIDDEN', 'Account is banned')
        })
    })

    describe('register', () => {
        const registerData = {
            email: 'newuser@example.com',
            password: 'password123',
            name: 'New User',
        }

        it('should successfully register a new user', async () => {
            // Arrange
            vi.mocked(userService.getByEmail).mockResolvedValue(null)
            const createdUser = {
                id: 'user-456',
                email: 'newuser@example.com',
                role: 'USER' as const,
                name: 'New User',
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-01T00:00:00.000Z',
                lastLogin: '2023-01-01T00:00:00.000Z',
                isEmailVerified: false,
                isActive: true,
                isBanned: false,
                passwordHash: 'hashed-password',
            }
            vi.mocked(userService.create).mockResolvedValue(createdUser as any)

            // Act
            const result = await authService.register(registerData)

            // Assert
            expect(result).toEqual({
                id: 'user-456',
                email: 'newuser@example.com',
                role: 'USER',
            })
            expect(userService.create).toHaveBeenCalledWith({
                email: 'newuser@example.com',
                password: 'password123',
                role: 'USER',
                isEmailVerified: false,
                isActive: true,
                name: 'New User',
            })
        })

        it('should throw error when user already exists', async () => {
            // Arrange
            const existingUser = {
                id: 'existing-user',
                email: 'newuser@example.com',
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-01T00:00:00.000Z',
                lastLogin: '2023-01-01T00:00:00.000Z',
                isEmailVerified: true,
                isActive: true,
                isBanned: false,
                passwordHash: 'hashed-password',
                role: 'USER' as const,
            }
            vi.mocked(userService.getByEmail).mockResolvedValue(existingUser as any)
            const mockError = new Error('EMAIL_ALREADY_EXISTS: User with this email already exists')
            Object.assign(mockError, { code: 'EMAIL_ALREADY_EXISTS', status: 409 })
            vi.mocked(err).mockReturnValue(mockError as any)

            // Act & Assert
            await expect(authService.register(registerData)).rejects.toThrow()
            expect(err).toHaveBeenCalledWith(
                'EMAIL_ALREADY_EXISTS',
                'User with this email already exists'
            )
        })

        it('should register user without name when not provided', async () => {
            // Arrange
            const registerDataWithoutName = {
                email: 'newuser@example.com',
                password: 'password123',
            }
            vi.mocked(userService.getByEmail).mockResolvedValue(null)
            const createdUser = {
                id: 'user-456',
                email: 'newuser@example.com',
                role: 'USER' as const,
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-01T00:00:00.000Z',
                lastLogin: '2023-01-01T00:00:00.000Z',
                isEmailVerified: false,
                isActive: true,
                isBanned: false,
                passwordHash: 'hashed-password',
            }
            vi.mocked(userService.create).mockResolvedValue(createdUser as any)

            // Act
            const result = await authService.register(registerDataWithoutName)

            // Assert
            expect(result).toEqual({
                id: 'user-456',
                email: 'newuser@example.com',
                role: 'USER',
            })
            expect(userService.create).toHaveBeenCalledWith({
                email: 'newuser@example.com',
                password: 'password123',
                role: 'USER',
                isEmailVerified: false,
                isActive: true,
            })
        })
    })

    describe('refreshTokens', () => {
        const refreshTokenValue = 'refresh-token-123'
        const mockRefreshToken = {
            id: 'token-id',
            token: 'refresh-token-123',
            userId: 'user-123',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isRevoked: false,
            deviceInfo: 'test-device',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
        }

        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            role: 'USER' as const,
            isActive: true,
            isBanned: false,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            lastLogin: '2023-01-01T00:00:00.000Z',
            isEmailVerified: true,
            passwordHash: 'hashed-password',
        }

        it('should successfully refresh tokens with rotation', async () => {
            // Arrange
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
            vi.mocked(userService.getById).mockResolvedValue(mockUser as any)
            vi.mocked(generateAccessToken).mockReturnValue('new-access-token')
            vi.mocked(refreshTokenRepository.create).mockResolvedValue({
                ...mockRefreshToken,
                token: 'new-refresh-token',
            })

            // Act
            const result = await authService.refreshTokens(refreshTokenValue, 'device-info')

            // Assert
            expect(result).toEqual({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            })
            expect(refreshTokenRepository.revokeByToken).toHaveBeenCalledWith(refreshTokenValue)
        })

        it('should throw error when refresh token is not found', async () => {
            // Arrange
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(null)
            const mockError = new Error('TOKEN_INVALID: Invalid refresh token')
            Object.assign(mockError, { code: 'TOKEN_INVALID', status: 401 })
            vi.mocked(err).mockReturnValue(mockError as any)

            // Act & Assert
            await expect(authService.refreshTokens(refreshTokenValue)).rejects.toThrow()
            expect(err).toHaveBeenCalledWith('TOKEN_INVALID', 'Invalid refresh token')
        })

        it('should throw error when refresh token is revoked', async () => {
            // Arrange
            const revokedToken = { ...mockRefreshToken, isRevoked: true }
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(revokedToken)
            const mockError = new Error('TOKEN_INVALID: Refresh token has been revoked')
            Object.assign(mockError, { code: 'TOKEN_INVALID', status: 401 })
            vi.mocked(err).mockReturnValue(mockError as any)

            // Act & Assert
            await expect(authService.refreshTokens(refreshTokenValue)).rejects.toThrow()
            expect(err).toHaveBeenCalledWith('TOKEN_INVALID', 'Refresh token has been revoked')
        })

        it('should throw error when refresh token is expired', async () => {
            // Arrange
            const expiredToken = {
                ...mockRefreshToken,
                expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
            }
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(expiredToken)
            const mockError = new Error('TOKEN_EXPIRED: Refresh token has expired')
            Object.assign(mockError, { code: 'TOKEN_EXPIRED', status: 401 })
            vi.mocked(err).mockReturnValue(mockError as any)

            // Act & Assert
            await expect(authService.refreshTokens(refreshTokenValue)).rejects.toThrow()
            expect(err).toHaveBeenCalledWith('TOKEN_EXPIRED', 'Refresh token has expired')
        })

        it('should throw error when user is not active', async () => {
            // Arrange
            const inactiveUser = { ...mockUser, isActive: false }
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
            vi.mocked(userService.getById).mockResolvedValue(inactiveUser as any)
            const mockError = new Error('FORBIDDEN: Account is disabled or banned')
            Object.assign(mockError, { code: 'FORBIDDEN', status: 403 })
            vi.mocked(err).mockReturnValue(mockError as any)

            // Act & Assert
            await expect(authService.refreshTokens(refreshTokenValue)).rejects.toThrow()
            expect(err).toHaveBeenCalledWith('FORBIDDEN', 'Account is disabled or banned')
        })

        it('should throw error when user is banned', async () => {
            // Arrange
            const bannedUser = { ...mockUser, isBanned: true }
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
            vi.mocked(userService.getById).mockResolvedValue(bannedUser as any)
            const mockError = new Error('FORBIDDEN: Account is disabled or banned')
            Object.assign(mockError, { code: 'FORBIDDEN', status: 403 })
            vi.mocked(err).mockReturnValue(mockError as any)

            // Act & Assert
            await expect(authService.refreshTokens(refreshTokenValue)).rejects.toThrow()
            expect(err).toHaveBeenCalledWith('FORBIDDEN', 'Account is disabled or banned')
        })
    })

    describe('logout', () => {
        it('should successfully logout when valid refresh token exists', async () => {
            // Arrange
            const refreshTokenValue = 'refresh-token-123'
            const mockRefreshToken = {
                id: 'token-id',
                token: refreshTokenValue,
                userId: 'user-123',
                isRevoked: false,
                expiresAt: '2024-01-01T00:00:00.000Z',
                deviceInfo: 'test-device',
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-01T00:00:00.000Z',
            }
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)

            // Act
            await authService.logout(refreshTokenValue)

            // Assert
            expect(refreshTokenRepository.revokeByToken).toHaveBeenCalledWith(refreshTokenValue)
        })

        it('should handle logout when refresh token does not exist', async () => {
            // Arrange
            const refreshTokenValue = 'non-existent-token'
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(null)

            // Act
            await authService.logout(refreshTokenValue)

            // Assert
            expect(refreshTokenRepository.revokeByToken).not.toHaveBeenCalled()
        })

        it('should handle logout when refresh token is already revoked', async () => {
            // Arrange
            const refreshTokenValue = 'refresh-token-123'
            const revokedToken = {
                id: 'token-id',
                token: refreshTokenValue,
                userId: 'user-123',
                isRevoked: true,
                expiresAt: '2024-01-01T00:00:00.000Z',
                deviceInfo: 'test-device',
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-01T00:00:00.000Z',
            }
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(revokedToken)

            // Act
            await authService.logout(refreshTokenValue)

            // Assert
            expect(refreshTokenRepository.revokeByToken).not.toHaveBeenCalled()
        })
    })

    describe('logoutAll', () => {
        it('should successfully logout from all devices', async () => {
            // Arrange
            const userId = 'user-123'

            // Act
            await authService.logoutAll(userId)

            // Assert
            expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(userId)
        })
    })

    describe('changePassword', () => {
        it('should successfully change password', async () => {
            // Arrange
            const userId = 'user-123'
            const currentPassword = 'old-password'
            const newPassword = 'new-password'

            // Act
            await authService.changePassword(userId, currentPassword, newPassword)

            // Assert
            expect(userService.changePassword).toHaveBeenCalledWith(
                userId,
                currentPassword,
                newPassword
            )
        })
    })
})
