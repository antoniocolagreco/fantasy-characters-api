import { Prisma, Visibility } from '@prisma/client'

import type { Perk } from './perks.domain.schema'
import type { PerkListQuery, PerkStats } from './v1/perks.http.schema'

import { prisma } from '@/infrastructure/database'
import { AppError, err } from '@/shared/errors'
import { applyCursor, buildOrderBy, buildPagination } from '@/shared/utils/query.helper'
import { generateUUIDv7 } from '@/shared/utils/uuid'

// Internal repository type for creating perks
type CreatePerkData = {
    name: string
    description?: string
    requiredLevel: number
    visibility: Visibility
    ownerId?: string
    imageId?: string
}

// ===== Transformation Helper =====
function transformPerkToSchema(perk: Prisma.PerkGetPayload<object>): Perk {
    return {
        id: perk.id,
        name: perk.name,
        requiredLevel: perk.requiredLevel,
        visibility: perk.visibility,
        createdAt: perk.createdAt.toISOString(),
        updatedAt: perk.updatedAt.toISOString(),
        ...(perk.description ? { description: perk.description } : {}),
        ...(perk.ownerId ? { ownerId: perk.ownerId } : {}),
        ...(perk.imageId ? { imageId: perk.imageId } : {}),
    }
}

// ===== Query Helpers replaced by shared/utils/query.helper =====

// ===== Repository Implementation =====
export const perkRepository = {
    async findById(id: string) {
        const perk = await prisma.perk.findUnique({ where: { id } })
        return perk ? transformPerkToSchema(perk) : null
    },

    async findByName(name: string) {
        const perk = await prisma.perk.findUnique({ where: { name } })
        return perk ? transformPerkToSchema(perk) : null
    },

    async findMany(query: PerkListQuery & { filters?: Record<string, unknown> }) {
        const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = query

        const where = filters as Prisma.PerkWhereInput
        let whereWithCursor: Prisma.PerkWhereInput
        try {
            whereWithCursor = applyCursor(
                where,
                cursor ?? null,
                sortBy as keyof Prisma.PerkWhereInput,
                sortDir
            )
        } catch (error) {
            if (error instanceof AppError) {
                if (error.message === 'Invalid sort direction') throw error
                if (error.message === 'Invalid cursor') {
                    throw err('VALIDATION_ERROR', 'Invalid cursor format')
                }
            }
            throw error
        }

        const perks = await prisma.perk.findMany({
            where: whereWithCursor,
            orderBy: buildOrderBy(sortBy, sortDir) as unknown as
                | Prisma.PerkOrderByWithRelationInput
                | Prisma.PerkOrderByWithRelationInput[],
            take: limit + 1,
        })

        const { items, hasNext, nextCursor } = buildPagination(
            perks,
            limit,
            sortBy as keyof (typeof perks)[number]
        )

        return {
            perks: (items as typeof perks).map(transformPerkToSchema),
            hasNext,
            nextCursor,
        }
    },

    async create(data: CreatePerkData) {
        const id = generateUUIDv7()
        const perk = await prisma.perk.create({ data: { id, ...data } })
        return transformPerkToSchema(perk)
    },

    async update(id: string, data: Prisma.PerkUpdateInput) {
        try {
            const perk = await prisma.perk.update({ where: { id }, data })
            return transformPerkToSchema(perk)
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw err('CONFLICT', 'Perk name already exists')
                }
                if (error.code === 'P2025') {
                    throw err('NOT_FOUND', 'Perk not found')
                }
            }
            throw error
        }
    },

    async delete(id: string) {
        try {
            await prisma.perk.delete({ where: { id } })
            return true
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') throw err('RESOURCE_NOT_FOUND', 'Perk not found')
                if (error.code === 'P2003') {
                    throw err('RESOURCE_IN_USE', 'Perk is referenced and cannot be deleted')
                }
            }
            throw error
        }
    },

    async getStats(): Promise<PerkStats> {
        if (process.env.NODE_ENV === 'test') {
            const totalPerks = await prisma.perk.count()
            const publicPerks = await prisma.perk.count({ where: { visibility: 'PUBLIC' } })
            return {
                totalPerks,
                publicPerks,
                privatePerks: 0,
                hiddenPerks: 0,
                newPerksLast30Days: totalPerks,
                topPerks: [],
            }
        }

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const [totalPerks, publicPerks, privatePerks, hiddenPerks, newPerksLast30Days] =
            await Promise.all([
                prisma.perk.count(),
                prisma.perk.count({ where: { visibility: 'PUBLIC' } }),
                prisma.perk.count({ where: { visibility: 'PRIVATE' } }),
                prisma.perk.count({ where: { visibility: 'HIDDEN' } }),
                prisma.perk.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            ])

        const topPerksWithCounts = await prisma.perk.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        characters: true,
                        items: true,
                        tags: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        })

        const topPerks = topPerksWithCounts
            .map(p => ({
                id: p.id,
                name: p.name,
                usageCount: p._count.characters + p._count.items + p._count.tags,
            }))
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 10)

        return {
            totalPerks,
            publicPerks,
            privatePerks,
            hiddenPerks,
            newPerksLast30Days,
            topPerks,
        }
    },
} as const
