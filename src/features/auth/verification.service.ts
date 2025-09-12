import jwt from 'jsonwebtoken'

import { config } from '@/infrastructure/config'
import { err } from '@/shared/errors'

function ttlMs(): number {
    const hours = Number(process.env.EMAIL_VERIFICATION_TTL_HOURS || 24)
    return hours * 60 * 60 * 1000
}

export const verificationService = {
    async issue(userId: string): Promise<string> {
        const payload = { sub: userId, purpose: 'email-verify' as const }
        const token = jwt.sign(payload, config.JWT_SECRET, {
            expiresIn: Math.floor(ttlMs() / 1000),
            issuer: 'fantasy-characters-api',
            audience: 'email-verification',
        })
        return token
    },

    async confirm(token: string): Promise<{ userId: string }> {
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET, {
                issuer: 'fantasy-characters-api',
                audience: 'email-verification',
            }) as { sub?: string; purpose?: string }

            if (!decoded || decoded.purpose !== 'email-verify' || !decoded.sub) {
                throw err('TOKEN_INVALID', 'Invalid token')
            }
            return { userId: decoded.sub }
        } catch (e) {
            if (e instanceof jwt.TokenExpiredError) {
                throw err('TOKEN_EXPIRED', 'Verification token expired')
            }
            throw err('TOKEN_INVALID', 'Invalid verification token')
        }
    },
} as const
