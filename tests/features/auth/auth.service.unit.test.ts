import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies with correct paths
vi.mock('@/features/users/users.service', () => ({
    userService: {
        getByEmail: vi.fn(),
        getById: vi.fn(),
        create: vi.fn(),
        updateLastLogin: vi.fn(),
        changePassword: vi.fn(),
    },
}))

vi.mock('@/features/users/refresh-token.repository', () => ({
    refreshTokenRepository: {
        findByToken: vi.fn(),
        create: vi.fn(),
        revokeByToken: vi.fn(),
        revokeAllByUserId: vi.fn(),
    },
}))

vi.mock('@/features/auth/jwt.service', () => ({
    jwtService: {
        generateAccessToken: vi.fn(),
    },
}))

vi.mock('@/features/auth/password.service', () => ({
    passwordService: {
        verifyPassword: vi.fn(),
        hashPassword: vi.fn(),
    },
}))

// Import the service AFTER mocks are set up
import { authService } from '@/features/auth/auth.service'
import { jwtService } from '@/features/auth/jwt.service'
import { passwordService } from '@/features/auth/password.service'
import { refreshTokenRepository } from '@/features/users/refresh-token.repository'
import { userService } from '@/features/users/users.service'
import { generateUUIDv7 } from '@/shared/utils/uuid'

describe('AuthService', () => {
    let testUserId: string
    let refreshTokenId: string
    let refreshTokenValue: string
    let newUserId: string
    let mockUser: any
    let mockRefreshToken: any

    beforeEach(() => {
        vi.clearAllMocks()
        testUserId = generateUUIDv7()
        refreshTokenId = generateUUIDv7()
        refreshTokenValue = generateUUIDv7()
        newUserId = generateUUIDv7()

        mockUser = {
            id: testUserId,
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

        mockRefreshToken = {
            id: refreshTokenId,
            token: refreshTokenValue,
            userId: testUserId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isRevoked: false,
            deviceInfo: 'test-device',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
        }
    })

    describe('login', () => {
        const credentials = {
            email: 'test@example.com',
            password: 'password123',
        }

        it('should successfully login with valid credentials', async () => {
            // Arrange
            vi.mocked(userService.getByEmail).mockResolvedValue(mockUser)
            vi.mocked(userService.getById).mockResolvedValue(mockUser) // For generateTokenPair
            vi.mocked(passwordService.verifyPassword).mockResolvedValue(true)
            vi.mocked(jwtService.generateAccessToken).mockReturnValue('access-token')
            vi.mocked(refreshTokenRepository.create).mockResolvedValue(mockRefreshToken)

            // Act
            const result = await authService.login(credentials, 'test-device')

            // Assert
            expect(result).toEqual({
                id: testUserId,
                email: 'test@example.com',
                role: 'USER',
                accessToken: 'access-token',
                refreshToken: refreshTokenValue,
            })
            expect(userService.updateLastLogin).toHaveBeenCalledWith(testUserId)
        })

        it('should throw error when user does not exist', async () => {
            // Arrange
            vi.mocked(userService.getByEmail).mockResolvedValue(null)

            // Act & Assert
            await expect(authService.login(credentials)).rejects.toThrow(
                'Invalid email or password'
            )
        })

        it('should throw error when password is invalid', async () => {
            // Arrange
            vi.mocked(userService.getByEmail).mockResolvedValue(mockUser)
            vi.mocked(passwordService.verifyPassword).mockResolvedValue(false)

            // Act & Assert
            await expect(authService.login(credentials)).rejects.toThrow(
                'Invalid email or password'
            )
        })

        it('should throw error when user is not active', async () => {
            // Arrange
            const inactiveUser = { ...mockUser, isActive: false }
            vi.mocked(userService.getByEmail).mockResolvedValue(inactiveUser)
            vi.mocked(passwordService.verifyPassword).mockResolvedValue(true)

            // Act & Assert
            await expect(authService.login(credentials)).rejects.toThrow('Account is disabled')
        })

        it('should throw error when user is banned', async () => {
            // Arrange
            const bannedUser = { ...mockUser, isBanned: true }
            vi.mocked(userService.getByEmail).mockResolvedValue(bannedUser)
            vi.mocked(passwordService.verifyPassword).mockResolvedValue(true)

            // Act & Assert
            await expect(authService.login(credentials)).rejects.toThrow('Account is banned')
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
                id: newUserId,
                email: 'newuser@example.com',
                role: 'USER' as const,
                name: 'New User',
            }
            vi.mocked(userService.create).mockResolvedValue(createdUser as any)

            // Act
            const result = await authService.register(registerData)

            // Assert
            expect(result).toMatchObject({
                id: expect.any(String),
                email: 'newuser@example.com',
                role: 'USER',
            })
        })

        it('should throw error when user already exists', async () => {
            // Arrange
            vi.mocked(userService.getByEmail).mockResolvedValue(mockUser)

            // Act & Assert
            await expect(authService.register(registerData)).rejects.toThrow(
                'User with this email already exists'
            )
        })
    })
})
