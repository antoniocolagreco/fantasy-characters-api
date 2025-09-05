import type { RefreshTokenRepository } from '@/features/users/users.type'
import { prisma } from '@/infrastructure/database'
import { err } from '@/shared/errors'
import { generateUUIDv7 } from '@/shared/utils'

// ===== Repository Implementation =====
export const refreshTokenRepository: RefreshTokenRepository = {
    async create(data) {
        const refreshToken = await prisma.refreshToken.create({
            data: {
                id: generateUUIDv7(),
                ...data,
            },
        })

        return {
            id: refreshToken.id,
            token: refreshToken.token,
            userId: refreshToken.userId,
            expiresAt: refreshToken.expiresAt.toISOString(),
            isRevoked: refreshToken.isRevoked,
            createdAt: refreshToken.createdAt.toISOString(),
            updatedAt: refreshToken.updatedAt.toISOString(),
            ...(refreshToken.deviceInfo && { deviceInfo: refreshToken.deviceInfo }),
            ...(refreshToken.ipAddress && { ipAddress: refreshToken.ipAddress }),
            ...(refreshToken.userAgent && { userAgent: refreshToken.userAgent }),
        }
    },

    async findByToken(token) {
        const refreshToken = await prisma.refreshToken.findFirst({
            where: {
                token,
                isRevoked: false,
                expiresAt: { gt: new Date() },
            },
        })

        if (!refreshToken) {
            return null
        }

        return {
            id: refreshToken.id,
            token: refreshToken.token,
            userId: refreshToken.userId,
            expiresAt: refreshToken.expiresAt.toISOString(),
            isRevoked: refreshToken.isRevoked,
            createdAt: refreshToken.createdAt.toISOString(),
            updatedAt: refreshToken.updatedAt.toISOString(),
            ...(refreshToken.deviceInfo && { deviceInfo: refreshToken.deviceInfo }),
            ...(refreshToken.ipAddress && { ipAddress: refreshToken.ipAddress }),
            ...(refreshToken.userAgent && { userAgent: refreshToken.userAgent }),
        }
    },

    async revokeByToken(token) {
        const result = await prisma.refreshToken.updateMany({
            where: { token, isRevoked: false },
            data: { isRevoked: true },
        })

        if (result.count === 0) {
            throw err('RESOURCE_NOT_FOUND', 'Refresh token not found')
        }
    },

    async revokeAllByUserId(userId) {
        await prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        })
    },

    async deleteExpired() {
        const result = await prisma.refreshToken.deleteMany({
            where: {
                OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
            },
        })

        return result.count
    },

    async findActiveByUserId(userId) {
        const refreshTokens = await prisma.refreshToken.findMany({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        })

        return refreshTokens.map(token => ({
            id: token.id,
            token: token.token,
            userId: token.userId,
            expiresAt: token.expiresAt.toISOString(),
            isRevoked: token.isRevoked,
            createdAt: token.createdAt.toISOString(),
            updatedAt: token.updatedAt.toISOString(),
            ...(token.deviceInfo && { deviceInfo: token.deviceInfo }),
            ...(token.ipAddress && { ipAddress: token.ipAddress }),
            ...(token.userAgent && { userAgent: token.userAgent }),
        }))
    },
}
