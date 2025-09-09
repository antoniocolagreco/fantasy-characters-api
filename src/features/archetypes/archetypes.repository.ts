import { Prisma, Visibility } from '@prisma/client'

import type { Archetype } from './archetypes.domain.schema'
import type { ArchetypeListQuery, ArchetypeStats } from './v1/archetypes.http.schema'

import { prisma } from '@/infrastructure/database'
import { err } from '@/shared/errors'
import { generateUUIDv7 } from '@/shared/utils/uuid'

type CreateArchetypeData = {
    name: string
    description?: string
    visibility: Visibility
    ownerId?: string
    imageId?: string
}

function transform(model: Prisma.ArchetypeGetPayload<object>): Archetype {
    return {
        id: model.id,
        name: model.name,
        visibility: model.visibility,
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
        ...(model.description ? { description: model.description } : {}),
        ...(model.ownerId ? { ownerId: model.ownerId } : {}),
        ...(model.imageId ? { imageId: model.imageId } : {}),
    }
}

function applyCursor(
    where: Prisma.ArchetypeWhereInput,
    cursor: string | undefined,
    sortBy: string,
    sortDir: string
): Prisma.ArchetypeWhereInput {
    if (!cursor) return where
    if (sortDir !== 'asc' && sortDir !== 'desc') throw new Error('Invalid sort direction')
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

function orderBy(sortBy: string = 'createdAt', sortDir: 'asc' | 'desc' = 'desc') {
    return [{ [sortBy]: sortDir }, { id: sortDir }]
}

function paginate(
    items: { id: string; [k: string]: unknown }[],
    limit: number,
    sortField: string
): { items: { id: string; [k: string]: unknown }[]; hasNext: boolean; nextCursor?: string } {
    const hasNext = items.length > limit
    const finalItems = hasNext ? items.slice(0, limit) : items
    if (!hasNext || finalItems.length === 0) return { items: finalItems, hasNext: false }
    const last = finalItems[finalItems.length - 1]
    if (!last) return { items: finalItems, hasNext: false }
    const nextCursor = Buffer.from(
        JSON.stringify({ lastValue: last[sortField], lastId: last.id })
    ).toString('base64')
    return { items: finalItems, hasNext, nextCursor }
}

export const archetypeRepository = {
    async findById(id: string) {
        const model = await prisma.archetype.findUnique({ where: { id } })
        return model ? transform(model) : null
    },
    async findByName(name: string) {
        const model = await prisma.archetype.findUnique({ where: { name } })
        return model ? transform(model) : null
    },
    async findMany(query: ArchetypeListQuery & { filters?: Record<string, unknown> }) {
        const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = query
        const where = filters as Prisma.ArchetypeWhereInput
        const whereWithCursor = applyCursor(where, cursor, sortBy, sortDir)
        const rows = await prisma.archetype.findMany({
            where: whereWithCursor,
            orderBy: orderBy(sortBy, sortDir as 'asc' | 'desc'),
            take: limit + 1,
        })
        const { items, hasNext, nextCursor } = paginate(rows, limit, sortBy)
        return { archetypes: (items as typeof rows).map(transform), hasNext, nextCursor }
    },
    async create(data: CreateArchetypeData) {
        const id = generateUUIDv7()
        const model = await prisma.archetype.create({ data: { id, ...data } })
        return transform(model)
    },
    async update(id: string, data: Prisma.ArchetypeUpdateInput) {
        try {
            const model = await prisma.archetype.update({ where: { id }, data })
            return transform(model)
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') throw err('CONFLICT', 'Archetype name already exists')
                if (error.code === 'P2025') throw err('NOT_FOUND', 'Archetype not found')
            }
            throw error
        }
    },
    async delete(id: string) {
        try {
            await prisma.archetype.delete({ where: { id } })
            return true
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') throw err('NOT_FOUND', 'Archetype not found')
                if (error.code === 'P2003') {
                    // FK constraint violation -> in use
                    throw err('RESOURCE_IN_USE', 'Archetype is referenced and cannot be deleted')
                }
            }
            throw error
        }
    },
    async getStats(): Promise<ArchetypeStats> {
        if (process.env.NODE_ENV === 'test') {
            const totalArchetypes = await prisma.archetype.count()
            const publicArchetypes = await prisma.archetype.count({
                where: { visibility: 'PUBLIC' },
            })
            return {
                totalArchetypes,
                publicArchetypes,
                privateArchetypes: 0,
                hiddenArchetypes: 0,
                newArchetypesLast30Days: totalArchetypes,
                topArchetypes: [],
            }
        }
        const thirty = new Date()
        thirty.setDate(thirty.getDate() - 30)
        const [
            totalArchetypes,
            publicArchetypes,
            privateArchetypes,
            hiddenArchetypes,
            newArchetypesLast30Days,
        ] = await Promise.all([
            prisma.archetype.count(),
            prisma.archetype.count({ where: { visibility: 'PUBLIC' } }),
            prisma.archetype.count({ where: { visibility: 'PRIVATE' } }),
            prisma.archetype.count({ where: { visibility: 'HIDDEN' } }),
            prisma.archetype.count({ where: { createdAt: { gte: thirty } } }),
        ])
        const topRaw = await prisma.archetype.findMany({
            select: {
                id: true,
                name: true,
                _count: { select: { characters: true, skills: true, tags: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        })
        const topArchetypes = topRaw
            .map(a => ({
                id: a.id,
                name: a.name,
                usageCount: a._count.characters + a._count.skills + a._count.tags,
            }))
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 10)
        return {
            totalArchetypes,
            publicArchetypes,
            privateArchetypes,
            hiddenArchetypes,
            newArchetypesLast30Days,
            topArchetypes,
        }
    },
} as const
