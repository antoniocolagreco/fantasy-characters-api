import type { PrismaClient } from '@prisma/client'

import type { AuthenticatedUser } from '@/features/auth'
import { err } from '@/shared/errors'

function isPrisma(client: unknown): client is PrismaClient {
    return typeof client === 'object' && client !== null && 'user' in client
}

/**
 * Enforce that the given user has a verified email.
 * Admins and Moderators are exempt.
 */
export async function requireVerifiedEmail(
    prisma: unknown,
    user: AuthenticatedUser | undefined
): Promise<void> {
    if (!user) throw err('UNAUTHORIZED', 'Login required')
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') return
    if (!isPrisma(prisma)) throw err('DATABASE_ERROR', 'Prisma instance not available')

    const row = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isEmailVerified: true },
    })
    if (!row?.isEmailVerified) throw err('FORBIDDEN', 'Email not verified')
}
