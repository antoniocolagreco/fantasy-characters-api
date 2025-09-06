import jwt from 'jsonwebtoken'

import type { AuthenticatedUser, JwtClaims, JwtConfig } from '@/features/auth/auth.domain.schema'
import { err } from '@/shared/errors'
import { generateUUIDv7 } from '@/shared/utils'

/**
 * JWT service for token generation and verification
 */
export const jwtService = {
    /**
     * Generate an access token (JWT) for a user
     */
    generateAccessToken(user: AuthenticatedUser, config: JwtConfig): string {
        const claims: JwtClaims = {
            sub: user.id,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.parseTtl(config.accessTokenTtl),
            jti: generateUUIDv7(),
        }

        return jwt.sign(claims, config.secret, {
            issuer: config.issuer,
            audience: config.audience,
        })
    },

    /**
     * Generate a refresh token (opaque UUID)
     */
    generateRefreshToken(): string {
        return generateUUIDv7()
    },

    /**
     * Verify and decode an access token
     */
    verifyAccessToken(token: string, config: JwtConfig): JwtClaims {
        try {
            const decoded = jwt.verify(token, config.secret, {
                issuer: config.issuer,
                audience: config.audience,
            }) as JwtClaims

            return decoded
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw err('TOKEN_EXPIRED', 'Token has expired')
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw err('TOKEN_INVALID', 'Invalid token')
            }
            throw err('TOKEN_INVALID', 'Token verification failed')
        }
    },

    /**
     * Parse TTL string to seconds
     * Supports formats like "15m", "1h", "7d"
     */
    parseTtl(ttl: string | number): number {
        if (typeof ttl === 'number') {
            return ttl
        }

        // Parse strings like "15m", "1h", "7d"
        const match = ttl.match(/^(\d+)([smhd])$/)
        if (!match?.[1] || !match?.[2]) {
            throw err('INVALID_FORMAT', `Invalid TTL format: ${ttl}`)
        }

        const [, valueStr, unit] = match
        const value = parseInt(valueStr, 10)

        switch (unit) {
            case 's':
                return value
            case 'm':
                return value * 60
            case 'h':
                return value * 60 * 60
            case 'd':
                return value * 60 * 60 * 24
            default:
                throw err('INVALID_FORMAT', `Invalid TTL unit: ${unit}`)
        }
    },
} as const
