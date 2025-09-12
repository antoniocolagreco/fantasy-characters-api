import type {
    AuthUser,
    LoginRequest,
    LoginResult,
    RefreshTokenPayload,
    RefreshTokensResult,
    RegisterRequest,
    TokenPair,
} from './auth.domain.schema'

import { jwtService } from '@/features/auth/jwt.service'
import { passwordService } from '@/features/auth/password.service'
import { verificationService } from '@/features/auth/verification.service'
import { refreshTokenRepository, userService } from '@/features/users'
import { config } from '@/infrastructure/config'
import { mailer } from '@/infrastructure/email/mailer.service'
import { err } from '@/shared/errors'
import type { RoleLiterals } from '@/shared/schemas/common.schema'

/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 */
export const authService = {
    /**
     * Authenticate user with email and password
     */
    async login(credentials: LoginRequest, deviceInfo?: string): Promise<LoginResult> {
        const { email, password } = credentials

        // Get user by email
        const user = await userService.getByEmail(email)
        if (!user) {
            throw err('INVALID_CREDENTIALS', 'Invalid email or password')
        }

        // Verify password
        const isValidPassword = await passwordService.verifyPassword(user.passwordHash, password)
        if (!isValidPassword) {
            throw err('INVALID_CREDENTIALS', 'Invalid email or password')
        }

        // Check if user is active
        if (!user.isActive) {
            throw err('FORBIDDEN', 'Account is disabled')
        }

        // Check if user is banned
        if (user.isBanned) {
            throw err('FORBIDDEN', 'Account is banned')
        }

        // Generate tokens
        const tokenPair = await this.generateTokenPair(user.id, user.role, deviceInfo)

        // Update last login
        await userService.updateLastLogin(user.id)

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
        }
    },

    /**
     * Register a new user
     */
    async register(data: RegisterRequest): Promise<AuthUser> {
        const { email, password, name } = data

        // Check if user already exists
        const existingUser = await userService.getByEmail(email)
        if (existingUser) {
            throw err('EMAIL_ALREADY_EXISTS', 'User with this email already exists')
        }

        // Create user
        const userData = {
            email,
            password,
            role: 'USER' as const,
            isEmailVerified: false,
            isActive: true,
            ...(name && { name }),
        }

        const user = await userService.create(userData)

        // Send verification email if feature enabled
        if (config.EMAIL_VERIFICATION_ENABLED) {
            try {
                const token = await verificationService.issue(user.id)
                const base = process.env.APP_BASE_URL || ''
                const link = `${base}/api/v1/auth/verify/confirm?token=${encodeURIComponent(token)}`
                await mailer.send({
                    to: user.email,
                    subject: 'Verify your email',
                    html: `<p>Please verify your email by clicking the link below:</p><p><a href="${link}">Verify Email</a></p>`,
                })
            } catch {
                // Best-effort; do not block registration on email errors
            }
        }

        return {
            id: user.id,
            email: user.email,
            role: user.role,
        }
    },

    /**
     * Refresh access token using refresh token
     */
    async refreshTokens(
        refreshTokenValue: string,
        deviceInfo?: string
    ): Promise<RefreshTokensResult> {
        // Find and validate refresh token
        const refreshToken = await refreshTokenRepository.findByToken(refreshTokenValue)
        if (!refreshToken) {
            throw err('TOKEN_INVALID', 'Invalid refresh token')
        }

        if (refreshToken.isRevoked) {
            throw err('TOKEN_INVALID', 'Refresh token has been revoked')
        }

        if (new Date() > new Date(refreshToken.expiresAt)) {
            throw err('TOKEN_EXPIRED', 'Refresh token has expired')
        }

        // Get user
        const user = await userService.getById(refreshToken.userId)
        if (!user.isActive || user.isBanned) {
            throw err('FORBIDDEN', 'Account is disabled or banned')
        }

        // Generate new access token
        const accessToken = jwtService.generateAccessToken(
            { id: user.id, role: user.role as RoleLiterals, email: user.email },
            {
                secret: config.JWT_SECRET,
                accessTokenTtl: config.JWT_ACCESS_EXPIRES_IN,
                refreshTokenTtl: config.JWT_REFRESH_EXPIRES_IN,
                issuer: 'fantasy-characters-api',
                audience: 'fantasy-characters-app',
            }
        )

        // Optionally rotate refresh token (recommended for security)
        let newRefreshToken: string | undefined
        const shouldRotateRefreshToken = true // This could be configurable

        if (shouldRotateRefreshToken) {
            // Revoke old refresh token
            await refreshTokenRepository.revokeByToken(refreshTokenValue)

            // Generate new refresh token
            const newRefreshTokenPayload: RefreshTokenPayload = {
                token: '', // Will be generated by repository
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                ...(deviceInfo && { deviceInfo }),
            }

            const newRefreshTokenRecord =
                await refreshTokenRepository.create(newRefreshTokenPayload)
            newRefreshToken = newRefreshTokenRecord.token
        }

        return {
            accessToken,
            ...(newRefreshToken && { refreshToken: newRefreshToken }),
        }
    },

    /**
     * Logout user by revoking refresh token
     */
    async logout(refreshTokenValue: string): Promise<void> {
        const refreshToken = await refreshTokenRepository.findByToken(refreshTokenValue)
        if (refreshToken && !refreshToken.isRevoked) {
            await refreshTokenRepository.revokeByToken(refreshTokenValue)
        }
    },

    /**
     * Logout user from all devices by revoking all refresh tokens
     */
    async logoutAll(userId: string): Promise<void> {
        await refreshTokenRepository.revokeAllByUserId(userId)
    },

    /**
     * Change user password
     */
    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        await userService.changePassword(userId, currentPassword, newPassword)
    },

    /**
     * Generate access and refresh token pair
     */
    async generateTokenPair(userId: string, role: string, deviceInfo?: string): Promise<TokenPair> {
        // Get user email for JWT
        const user = await userService.getById(userId)

        // Generate access token
        const accessToken = jwtService.generateAccessToken(
            { id: userId, role: role as RoleLiterals, email: user.email },
            {
                secret: config.JWT_SECRET,
                accessTokenTtl: config.JWT_ACCESS_EXPIRES_IN,
                refreshTokenTtl: config.JWT_REFRESH_EXPIRES_IN,
                issuer: 'fantasy-characters-api',
                audience: 'fantasy-characters-app',
            }
        )

        // Generate refresh token
        const refreshTokenPayload: RefreshTokenPayload = {
            token: '', // Will be generated by repository
            userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            ...(deviceInfo && { deviceInfo }),
        }

        const refreshTokenRecord = await refreshTokenRepository.create(refreshTokenPayload)

        return {
            accessToken,
            refreshToken: refreshTokenRecord.token,
        }
    },
} as const
