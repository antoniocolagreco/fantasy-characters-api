import { Prisma, Role } from '@prisma/client'

import type {
    BanUser,
    CreateUser,
    PublicUser,
    UpdateUser,
    User,
    UserListQuery,
    UserStats,
} from '@/features/users/users.type'
import { prisma } from '@/infrastructure/database'
import { err } from '@/shared/errors'
import { generateUUIDv7 } from '@/shared/utils'

// ===== Transformation Helpers =====
function transformUserToSchema(user: Prisma.UserGetPayload<object>): User {
    return {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin.toISOString(),
        isBanned: user.isBanned,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        ...(user.name && { name: user.name }),
        ...(user.bio && { bio: user.bio }),
        ...(user.oauthProvider && { oauthProvider: user.oauthProvider }),
        ...(user.oauthId && { oauthId: user.oauthId }),
        ...(user.lastPasswordChange && {
            lastPasswordChange: user.lastPasswordChange.toISOString(),
        }),
        ...(user.banReason && { banReason: user.banReason }),
        ...(user.bannedUntil && { bannedUntil: user.bannedUntil.toISOString() }),
        ...(user.bannedById && { bannedById: user.bannedById }),
        ...(user.profilePictureId && { profilePictureId: user.profilePictureId }),
    }
}

function transformUserToPublicSchema(user: Prisma.UserGetPayload<object>): PublicUser {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin.toISOString(),
        isBanned: user.isBanned,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        ...(user.name && { name: user.name }),
        ...(user.bio && { bio: user.bio }),
        ...(user.profilePictureId && { profilePictureId: user.profilePictureId }),
    }
}

// ===== Query Helpers =====

function applyCursorPagination(
    where: Prisma.UserWhereInput,
    cursor: string | undefined,
    sortBy: string,
    sortDir: string
): Prisma.UserWhereInput {
    if (!cursor) return where

    // Validate sortDir at runtime
    if (sortDir !== 'asc' && sortDir !== 'desc') {
        throw new Error('Invalid sort direction')
    }

    try {
        const { lastValue, lastId } = JSON.parse(Buffer.from(cursor, 'base64').toString())
        const op = sortDir === 'desc' ? 'lt' : 'gt'

        return {
            ...where,
            OR: [{ [sortBy]: { [op]: lastValue } }, { [sortBy]: lastValue, id: { [op]: lastId } }],
        }
    } catch {
        throw err('VALIDATION_ERROR', 'Invalid cursor format')
    }
}

function buildOrderBy(sortBy: string = 'createdAt', sortDir: 'asc' | 'desc' = 'desc') {
    return [{ [sortBy]: sortDir }, { id: sortDir }]
}

function buildNextCursor(
    items: { id: string; [key: string]: unknown }[],
    limit: number,
    sortField: string
): { items: { id: string; [key: string]: unknown }[]; hasNext: boolean; nextCursor?: string } {
    const hasNext = items.length > limit
    const finalItems = hasNext ? items.slice(0, limit) : items

    if (!hasNext || finalItems.length === 0) {
        return { items: finalItems, hasNext: false }
    }

    const lastItem = finalItems[finalItems.length - 1]
    if (!lastItem) {
        return { items: finalItems, hasNext: false }
    }

    const nextCursor = Buffer.from(
        JSON.stringify({
            lastValue: lastItem[sortField],
            lastId: lastItem.id,
        })
    ).toString('base64')

    return { items: finalItems, hasNext, nextCursor }
}

// ===== Repository Implementation =====
export const userRepository = {
    async findById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
        })

        if (!user) {
            return null
        }

        return transformUserToSchema(user)
    },

    async findByEmail(email: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return null
        }

        return transformUserToSchema(user)
    },

    async findMany(query: UserListQuery & { filters?: Record<string, unknown> }) {
        const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = query

        // Use pre-built filters from service layer
        const where = filters as Prisma.UserWhereInput
        const whereWithCursor = applyCursorPagination(where, cursor, sortBy, sortDir)

        // Execute query
        const users = await prisma.user.findMany({
            where: whereWithCursor,
            orderBy: buildOrderBy(sortBy, sortDir as 'asc' | 'desc'),
            take: limit + 1,
        })

        // Build pagination response
        const { items, hasNext, nextCursor } = buildNextCursor(
            users as { id: string; [key: string]: unknown }[],
            limit,
            sortBy
        )

        return {
            users: (items as typeof users).map(transformUserToSchema),
            hasNext,
            nextCursor,
        }
    },

    async create(data: CreateUser) {
        const createData = {
            ...data,
            id: generateUUIDv7(),
            passwordHash: '', // This should be provided by the service layer
            role: (data.role || 'USER') as Role,
            name: data.name || null,
            bio: data.bio || null,
            oauthProvider: data.oauthProvider || null,
            oauthId: data.oauthId || null,
            lastPasswordChange: data.lastPasswordChange ? new Date(data.lastPasswordChange) : null,
            profilePictureId: data.profilePictureId || null,
        }

        const user = await prisma.user.create({
            data: createData,
        })

        return transformUserToSchema(user)
    },

    async update(id: string, data: UpdateUser) {
        try {
            const updateData = {
                ...Object.fromEntries(
                    Object.entries(data).filter(([, value]) => value !== undefined)
                ),
                updatedAt: new Date(),
            }

            const user = await prisma.user.update({
                where: { id },
                data: updateData,
            })

            return transformUserToSchema(user)
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw err('RESOURCE_NOT_FOUND', 'User not found')
            }
            throw error
        }
    },

    async delete(id: string): Promise<void> {
        try {
            await prisma.user.delete({
                where: { id },
            })
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw err('RESOURCE_NOT_FOUND', 'User not found')
            }
            throw error
        }
    },

    async ban(id: string, banData: BanUser, bannedById: string) {
        try {
            const updateData = {
                isBanned: true,
                banReason: banData.banReason || null,
                bannedUntil: banData.bannedUntil ? new Date(banData.bannedUntil) : null,
                bannedById,
                updatedAt: new Date(),
            }

            const user = await prisma.user.update({
                where: { id },
                data: updateData,
            })

            return transformUserToSchema(user)
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw err('RESOURCE_NOT_FOUND', 'User not found')
            }
            throw error
        }
    },

    async unban(id: string) {
        try {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    isBanned: false,
                    banReason: null,
                    bannedUntil: null,
                    bannedById: null,
                    updatedAt: new Date(),
                },
            })

            return transformUserToSchema(user)
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw err('RESOURCE_NOT_FOUND', 'User not found')
            }
            throw error
        }
    },

    async getStats(): Promise<UserStats> {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const [totalUsers, activeUsers, bannedUsers, unverifiedUsers, roleStats, newUsers] =
            await Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { isActive: true } }),
                prisma.user.count({ where: { isBanned: true } }),
                prisma.user.count({ where: { isEmailVerified: false } }),
                prisma.user.groupBy({
                    by: ['role'],
                    _count: { role: true },
                }),
                prisma.user.count({
                    where: { createdAt: { gte: thirtyDaysAgo } },
                }),
            ])

        const usersByRole = {
            USER: 0,
            MODERATOR: 0,
            ADMIN: 0,
        }

        for (const stat of roleStats) {
            usersByRole[stat.role] = stat._count.role
        }

        return {
            totalUsers,
            activeUsers,
            bannedUsers,
            unverifiedUsers,
            usersByRole,
            newUsersLast30Days: newUsers,
        }
    },

    async markEmailAsVerified(id: string) {
        try {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    isEmailVerified: true,
                    updatedAt: new Date(),
                },
            })

            return transformUserToSchema(user)
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw err('RESOURCE_NOT_FOUND', 'User not found')
            }
            throw error
        }
    },

    async updateLastLogin(id: string): Promise<void> {
        try {
            await prisma.user.update({
                where: { id },
                data: {
                    lastLogin: new Date(),
                    updatedAt: new Date(),
                },
            })
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw err('RESOURCE_NOT_FOUND', 'User not found')
            }
            throw error
        }
    },

    async updatePassword(id: string, passwordHash: string): Promise<void> {
        try {
            await prisma.user.update({
                where: { id },
                data: {
                    passwordHash,
                    lastPasswordChange: new Date(),
                    updatedAt: new Date(),
                },
            })
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw err('RESOURCE_NOT_FOUND', 'User not found')
            }
            throw error
        }
    },
}

// ===== Public Repository (without sensitive data) =====
export const publicUserRepository = {
    async findById(id: string): Promise<PublicUser | null> {
        const user = await prisma.user.findUnique({
            where: { id },
        })

        if (!user) {
            return null
        }

        return transformUserToPublicSchema(user)
    },

    async findMany(
        query: UserListQuery & { filters?: Record<string, unknown> }
    ): Promise<{ users: PublicUser[]; hasNext: boolean; nextCursor?: string }> {
        const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = query

        // Use pre-built filters from service layer
        const where = filters as Prisma.UserWhereInput
        const whereWithCursor = applyCursorPagination(where, cursor, sortBy, sortDir)

        // Execute query
        const users = await prisma.user.findMany({
            where: whereWithCursor,
            orderBy: buildOrderBy(sortBy, sortDir as 'asc' | 'desc'),
            take: limit + 1,
        })

        // Build pagination response
        const { items, hasNext, nextCursor } = buildNextCursor(
            users as { id: string; [key: string]: unknown }[],
            limit,
            sortBy
        )

        return {
            users: (items as typeof users).map(transformUserToPublicSchema),
            hasNext,
            ...(nextCursor && { nextCursor }),
        }
    },
}
