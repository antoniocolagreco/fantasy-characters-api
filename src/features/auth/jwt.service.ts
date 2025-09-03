import jwt from 'jsonwebtoken'
import { generateUUIDv7 } from '../../shared/utils'
import type { JwtClaims, AuthenticatedUser, JwtConfig } from './auth.schema'

/**
 * Generate an access token (JWT) for a user
 */
export function generateAccessToken(user: AuthenticatedUser, config: JwtConfig): string {
    const claims: JwtClaims = {
        sub: user.id,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + parseTtl(config.accessTokenTtl),
        jti: generateUUIDv7(),
    }

    return jwt.sign(claims, config.secret, {
        issuer: config.issuer,
        audience: config.audience,
    })
}

/**
 * Generate a refresh token (opaque UUID)
 */
export function generateRefreshToken(): string {
    return generateUUIDv7()
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string, config: JwtConfig): JwtClaims {
    try {
        const decoded = jwt.verify(token, config.secret, {
            issuer: config.issuer,
            audience: config.audience,
        }) as JwtClaims

        return decoded
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('TOKEN_EXPIRED')
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('TOKEN_INVALID')
        }
        throw new Error('TOKEN_INVALID')
    }
}

/**
 * Parse TTL string to seconds
 * Supports formats like "15m", "1h", "7d"
 */
export function parseTtl(ttl: string | number): number {
    if (typeof ttl === 'number') {
        return ttl
    }

    // Parse strings like "15m", "1h", "7d"
    const match = ttl.match(/^(\d+)([smhd])$/)
    if (!match?.[1] || !match?.[2]) {
        throw new Error(`Invalid TTL format: ${ttl}`)
    }

    const value = parseInt(match[1], 10)
    const unit = match[2]

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
            throw new Error(`Invalid TTL unit: ${unit}`)
    }
}
