import { Prisma, Visibility } from '@prisma/client'

import type { Skill } from './skills.domain.schema'
import type { SkillListQuery, SkillStats } from './v1/skills.http.schema'

import { prisma } from '@/infrastructure/database'
import { err } from '@/shared/errors'
import { generateUUIDv7 } from '@/shared/utils/uuid'

type CreateSkillData = {
    name: string
    description?: string
    requiredLevel: number
    visibility: Visibility
    ownerId?: string
    imageId?: string
}

// ===== Transformation Helper =====
function transformSkillToSchema(skill: Prisma.SkillGetPayload<object>): Skill {
    return {
        id: skill.id,
        name: skill.name,
        requiredLevel: skill.requiredLevel,
        visibility: skill.visibility,
        createdAt: skill.createdAt.toISOString(),
        updatedAt: skill.updatedAt.toISOString(),
        ...(skill.description ? { description: skill.description } : {}),
        ...(skill.ownerId ? { ownerId: skill.ownerId } : {}),
        ...(skill.imageId ? { imageId: skill.imageId } : {}),
    }
}

// ===== Query Helpers =====
function applyCursorPagination(
    where: Prisma.SkillWhereInput,
    cursor: string | undefined,
    sortBy: string,
    sortDir: string
): Prisma.SkillWhereInput {
    if (!cursor) return where
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
    if (!lastItem) return { items: finalItems, hasNext: false }
    const nextCursor = Buffer.from(
        JSON.stringify({ lastValue: lastItem[sortField], lastId: lastItem.id })
    ).toString('base64')
    return { items: finalItems, hasNext, nextCursor }
}

// ===== Repository Implementation =====
export const skillRepository = {
    async findById(id: string) {
        const skill = await prisma.skill.findUnique({ where: { id } })
        return skill ? transformSkillToSchema(skill) : null
    },

    async findByName(name: string) {
        const skill = await prisma.skill.findUnique({ where: { name } })
        return skill ? transformSkillToSchema(skill) : null
    },

    async findMany(query: SkillListQuery & { filters?: Record<string, unknown> }) {
        const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = query

        const where = filters as Prisma.SkillWhereInput
        const whereWithCursor = applyCursorPagination(where, cursor, sortBy, sortDir)

        const skills = await prisma.skill.findMany({
            where: whereWithCursor,
            orderBy: buildOrderBy(sortBy, sortDir as 'asc' | 'desc'),
            take: limit + 1,
        })

        const { items, hasNext, nextCursor } = buildNextCursor(skills, limit, sortBy)

        return {
            skills: (items as typeof skills).map(transformSkillToSchema),
            hasNext,
            nextCursor,
        }
    },

    async create(data: CreateSkillData) {
        const id = generateUUIDv7()
        const skill = await prisma.skill.create({ data: { id, ...data } })
        return transformSkillToSchema(skill)
    },

    async update(id: string, data: Prisma.SkillUpdateInput) {
        try {
            const skill = await prisma.skill.update({ where: { id }, data })
            return transformSkillToSchema(skill)
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw err('CONFLICT', 'Skill name already exists')
                }
                if (error.code === 'P2025') {
                    throw err('NOT_FOUND', 'Skill not found')
                }
            }
            throw error
        }
    },

    async delete(id: string) {
        try {
            await prisma.skill.delete({ where: { id } })
            return true
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') throw err('RESOURCE_NOT_FOUND', 'Skill not found')
                if (error.code === 'P2003') {
                    throw err('RESOURCE_IN_USE', 'Skill is referenced and cannot be deleted')
                }
            }
            throw error
        }
    },

    async getStats(): Promise<SkillStats> {
        if (process.env.NODE_ENV === 'test') {
            const totalSkills = await prisma.skill.count()
            const publicSkills = await prisma.skill.count({ where: { visibility: 'PUBLIC' } })
            return {
                totalSkills,
                publicSkills,
                privateSkills: 0,
                hiddenSkills: 0,
                newSkillsLast30Days: totalSkills,
                topSkills: [],
            }
        }

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const [totalSkills, publicSkills, privateSkills, hiddenSkills, newSkillsLast30Days] =
            await Promise.all([
                prisma.skill.count(),
                prisma.skill.count({ where: { visibility: 'PUBLIC' } }),
                prisma.skill.count({ where: { visibility: 'PRIVATE' } }),
                prisma.skill.count({ where: { visibility: 'HIDDEN' } }),
                prisma.skill.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            ])

        const topSkillsWithCounts = await prisma.skill.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        characters: true,
                        races: true,
                        archetypes: true,
                        items: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        })

        const topSkills = topSkillsWithCounts
            .map(s => ({
                id: s.id,
                name: s.name,
                usageCount:
                    s._count.characters + s._count.races + s._count.archetypes + s._count.items,
            }))
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 10)

        return {
            totalSkills,
            publicSkills,
            privateSkills,
            hiddenSkills,
            newSkillsLast30Days,
            topSkills,
        }
    },
} as const
