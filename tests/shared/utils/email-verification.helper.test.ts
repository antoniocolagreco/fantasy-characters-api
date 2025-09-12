import { describe, expect, it } from 'vitest'

import { requireVerifiedEmail } from '@/shared/utils/email-verification.helper'

type MockUserRow = { isEmailVerified: boolean } | null

function makePrismaMock(row: MockUserRow) {
    return {
        user: {
            findUnique: async (_args: unknown) => row,
        },
    }
}

describe('requireVerifiedEmail (unit)', () => {
    it('throws UNAUTHORIZED when user is missing', async () => {
        await expect(requireVerifiedEmail({}, undefined)).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        })
    })

    it('allows ADMIN without DB check', async () => {
        await expect(
            requireVerifiedEmail({}, { id: 'u1', email: 'a@x.dev', role: 'ADMIN' })
        ).resolves.toBeUndefined()
    })

    it('allows MODERATOR without DB check', async () => {
        await expect(
            requireVerifiedEmail({}, { id: 'u2', email: 'm@x.dev', role: 'MODERATOR' })
        ).resolves.toBeUndefined()
    })

    it('throws DATABASE_ERROR when prisma instance is invalid', async () => {
        await expect(
            requireVerifiedEmail(null, { id: 'u3', email: 'u@x.dev', role: 'USER' })
        ).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
    })

    it('throws FORBIDDEN when user is not verified', async () => {
        const prisma = makePrismaMock({ isEmailVerified: false })
        await expect(
            requireVerifiedEmail(prisma, { id: 'u4', email: 'u@x.dev', role: 'USER' })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('resolves when user is verified', async () => {
        const prisma = makePrismaMock({ isEmailVerified: true })
        await expect(
            requireVerifiedEmail(prisma, { id: 'u5', email: 'u@x.dev', role: 'USER' })
        ).resolves.toBeUndefined()
    })
})
