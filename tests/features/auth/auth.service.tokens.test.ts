import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mocks
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

// Imports
import { authService } from '@/features/auth/auth.service'
import { jwtService } from '@/features/auth/jwt.service'
import { refreshTokenRepository } from '@/features/users/refresh-token.repository'
import { userService } from '@/features/users/users.service'
import { generateUUIDv7 } from '@/shared/utils/uuid'

describe('AuthService - token and session flows', () => {
    const userId = generateUUIDv7()
    const refreshTokenValue = generateUUIDv7()
    const accessToken = 'access-token'

    const baseUser = {
        id: userId,
        email: 'u@example.com',
        role: 'USER' as const,
        isActive: true,
        isBanned: false,
    }

    const baseRefreshToken = {
        id: generateUUIDv7(),
        token: refreshTokenValue,
        userId,
        isRevoked: false,
        deviceInfo: 'device',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(jwtService.generateAccessToken).mockReturnValue(accessToken)
        vi.mocked(userService.getById).mockResolvedValue(baseUser as any)
    })

    describe('refreshTokens', () => {
        it('rotates refresh token and returns new access + refresh tokens', async () => {
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(baseRefreshToken as any)
            const newToken = { ...baseRefreshToken, token: 'new-refresh-token' }
            vi.mocked(refreshTokenRepository.create).mockResolvedValue(newToken as any)

            const result = await authService.refreshTokens(refreshTokenValue, 'device-1')

            expect(result).toMatchObject({ accessToken })
            expect(result.refreshToken).toBe('new-refresh-token')
            expect(refreshTokenRepository.revokeByToken).toHaveBeenCalledWith(refreshTokenValue)
            expect(refreshTokenRepository.create).toHaveBeenCalled()
        })

        it('throws when token not found', async () => {
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(null)
            await expect(authService.refreshTokens('missing')).rejects.toThrow(
                'Invalid refresh token'
            )
        })

        it('throws when token revoked', async () => {
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue({
                ...baseRefreshToken,
                isRevoked: true,
            } as any)
            await expect(authService.refreshTokens(refreshTokenValue)).rejects.toThrow(
                'Refresh token has been revoked'
            )
        })

        it('throws when token expired', async () => {
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue({
                ...baseRefreshToken,
                expiresAt: new Date(Date.now() - 1000).toISOString(),
            } as any)
            await expect(authService.refreshTokens(refreshTokenValue)).rejects.toThrow(
                'Refresh token has expired'
            )
        })

        it('throws when user disabled or banned', async () => {
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(baseRefreshToken as any)
            vi.mocked(userService.getById).mockResolvedValue({
                ...baseUser,
                isActive: false,
            } as any)
            await expect(authService.refreshTokens(refreshTokenValue)).rejects.toThrow(
                'Account is disabled or banned'
            )
        })
    })

    describe('logout', () => {
        it('revokes refresh token if active', async () => {
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(baseRefreshToken as any)
            await authService.logout(refreshTokenValue)
            expect(refreshTokenRepository.revokeByToken).toHaveBeenCalledWith(refreshTokenValue)
        })

        it('does nothing if token absent or already revoked', async () => {
            vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue({
                ...baseRefreshToken,
                isRevoked: true,
            } as any)
            await authService.logout(refreshTokenValue)
            expect(refreshTokenRepository.revokeByToken).not.toHaveBeenCalled()
        })
    })

    describe('logoutAll', () => {
        it('revokes all tokens for user', async () => {
            await authService.logoutAll(userId)
            expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(userId)
        })
    })

    describe('changePassword', () => {
        it('delegates to userService', async () => {
            await authService.changePassword(userId, 'old', 'new')
            expect(userService.changePassword).toHaveBeenCalledWith(userId, 'old', 'new')
        })
    })

    describe('generateTokenPair', () => {
        it('returns access and refresh tokens', async () => {
            vi.mocked(refreshTokenRepository.create).mockResolvedValue({
                id: generateUUIDv7(),
                token: 'fresh-refresh',
                userId,
                isRevoked: false,
                expiresAt: new Date(Date.now() + 1000).toISOString(),
            } as any)

            const result = await authService.generateTokenPair(userId, 'USER', 'device')

            expect(jwtService.generateAccessToken).toHaveBeenCalled()
            expect(result).toMatchObject({ accessToken, refreshToken: 'fresh-refresh' })
        })
    })
})
