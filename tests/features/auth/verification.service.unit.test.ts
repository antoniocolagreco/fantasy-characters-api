import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'

import { verificationService } from '@/features/auth/verification.service'
import { config } from '@/infrastructure/config'
import { AppError } from '@/shared/errors'

describe('VerificationService (unit)', () => {
    it('issues a signed JWT token with expected claims', async () => {
        const userId = '01234567-89ab-cdef-0123-456789abcdef'
        const token = await verificationService.issue(userId)

        const decoded = jwt.verify(token, config.JWT_SECRET, {
            audience: 'email-verification',
            issuer: 'fantasy-characters-api',
        }) as { sub?: string; purpose?: string }

        expect(decoded.sub).toBe(userId)
        expect(decoded.purpose).toBe('email-verify')
    })

    it('confirms a valid token and returns userId', async () => {
        const userId = '11111111-1111-1111-1111-111111111111'
        const token = await verificationService.issue(userId)
        const { userId: confirmed } = await verificationService.confirm(token)
        expect(confirmed).toBe(userId)
    })

    it('throws TOKEN_INVALID for malformed token', async () => {
        await expect(verificationService.confirm('invalid.token')).rejects.toBeInstanceOf(AppError)
        try {
            await verificationService.confirm('invalid.token')
        } catch (e) {
            expect((e as AppError).code).toBe('TOKEN_INVALID')
        }
    })

    it('throws TOKEN_EXPIRED for expired token', async () => {
        const userId = '22222222-2222-2222-2222-222222222222'
        // Manually craft an already-expired token matching expected claims
        const expired = jwt.sign({ sub: userId, purpose: 'email-verify' }, config.JWT_SECRET, {
            expiresIn: -1,
            audience: 'email-verification',
            issuer: 'fantasy-characters-api',
        })

        await expect(verificationService.confirm(expired)).rejects.toBeInstanceOf(AppError)
        try {
            await verificationService.confirm(expired)
        } catch (e) {
            expect((e as AppError).code).toBe('TOKEN_EXPIRED')
        }
    })
})
