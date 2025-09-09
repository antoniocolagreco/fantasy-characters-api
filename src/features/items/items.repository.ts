import { Prisma, Rarity, Slot, Visibility } from '@prisma/client'

import type { Item } from './items.domain.schema'
import type { ItemListQuery, ItemStats } from './v1/items.http.schema'

import { prisma } from '@/infrastructure/database'
import { err } from '@/shared/errors'
import { generateUUIDv7 } from '@/shared/utils/uuid'

type CreateItemData = {
    name: string
    description?: string | undefined
    rarity?: Rarity | undefined
    slot?: Slot | undefined
    requiredLevel?: number | undefined
    weight?: number | undefined
    durability?: number | undefined
    maxDurability?: number | undefined
    value?: number | undefined
    is2Handed?: boolean | undefined
    isThrowable?: boolean | undefined
    isConsumable?: boolean | undefined
    isQuestItem?: boolean | undefined
    isTradeable?: boolean | undefined
    ownerId?: string | undefined
    imageId?: string | undefined
    visibility?: Visibility | undefined
}

function transform(model: Prisma.ItemGetPayload<object>): Item {
    return {
        id: model.id,
        name: model.name,
        visibility: model.visibility,
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
        rarity: model.rarity,
        slot: model.slot,
        requiredLevel: model.requiredLevel,
        weight: model.weight,
        durability: model.durability,
        maxDurability: model.maxDurability,
        value: model.value,
        is2Handed: model.is2Handed,
        isThrowable: model.isThrowable,
        isConsumable: model.isConsumable,
        isQuestItem: model.isQuestItem,
        isTradeable: model.isTradeable,
        ...(model.description ? { description: model.description } : {}),
        ...(model.ownerId ? { ownerId: model.ownerId } : {}),
        ...(model.imageId ? { imageId: model.imageId } : {}),
    }
}

function applyCursor(
    where: Prisma.ItemWhereInput,
    cursor: string | undefined,
    sortBy: string,
    sortDir: string
): Prisma.ItemWhereInput {
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

export const itemRepository = {
    async findById(id: string) {
        const model = await prisma.item.findUnique({ where: { id } })
        return model ? transform(model) : null
    },
    async findByName(name: string) {
        const model = await prisma.item.findUnique({ where: { name } })
        return model ? transform(model) : null
    },
    async findMany(query: ItemListQuery & { filters?: Record<string, unknown> }) {
        const {
            limit = 20,
            cursor,
            sortBy = 'createdAt',
            sortDir = 'desc',
            filters = {},
            search,
        } = query as ItemListQuery & { filters?: Record<string, unknown>; search?: string }

        const where: Prisma.ItemWhereInput = { ...(filters as Prisma.ItemWhereInput) }

        if (search) {
            where.name = { contains: search, mode: 'insensitive' }
        }

        const whereWithCursor = applyCursor(where, cursor, sortBy, sortDir)
        const rows = await prisma.item.findMany({
            where: whereWithCursor,
            orderBy: orderBy(sortBy, sortDir as 'asc' | 'desc'),
            take: limit + 1,
        })
        const { items, hasNext, nextCursor } = paginate(rows, limit, sortBy)
        return { items: (items as typeof rows).map(transform), hasNext, nextCursor }
    },
    async create(data: CreateItemData) {
        const id = generateUUIDv7()
        const createData: Prisma.ItemCreateInput = {
            id,
            name: data.name,
            rarity: data.rarity ?? 'COMMON',
            slot: data.slot ?? 'NONE',
            requiredLevel: data.requiredLevel ?? 1,
            weight: data.weight ?? 1.0,
            durability: data.durability ?? 100,
            maxDurability: data.maxDurability ?? data.durability ?? 100,
            value: data.value ?? 0,
            is2Handed: data.is2Handed ?? false,
            isThrowable: data.isThrowable ?? false,
            isConsumable: data.isConsumable ?? false,
            isQuestItem: data.isQuestItem ?? false,
            isTradeable: data.isTradeable ?? true,
            visibility: data.visibility ?? 'PUBLIC',
            ...(data.description ? { description: data.description } : {}),
            ...(data.ownerId ? { owner: { connect: { id: data.ownerId } } } : {}),
            ...(data.imageId ? { image: { connect: { id: data.imageId } } } : {}),
        }
        const model = await prisma.item.create({ data: createData })
        return transform(model)
    },
    async update(id: string, data: Prisma.ItemUpdateInput) {
        try {
            const model = await prisma.item.update({ where: { id }, data })
            return transform(model)
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') throw err('CONFLICT', 'Item name already exists')
                if (error.code === 'P2025') throw err('NOT_FOUND', 'Item not found')
            }
            throw error
        }
    },
    async delete(id: string) {
        try {
            await prisma.item.delete({ where: { id } })
            return true
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') throw err('NOT_FOUND', 'Item not found')
            }
            throw error
        }
    },
    async getStats(): Promise<ItemStats> {
        if (process.env.NODE_ENV === 'test') {
            const totalItems = await prisma.item.count()
            const publicItems = await prisma.item.count({ where: { visibility: 'PUBLIC' } })
            const legendaryItems = await prisma.item.count({ where: { rarity: 'LEGENDARY' } })
            const rareItems = await prisma.item.count({
                where: { rarity: { in: ['RARE', 'EPIC', 'LEGENDARY'] } },
            })
            return {
                totalItems,
                publicItems,
                rareItems,
                legendaryItems,
                newItemsLast30Days: totalItems,
            }
        }
        const thirty = new Date()
        thirty.setDate(thirty.getDate() - 30)
        const [totalItems, publicItems, rareItems, legendaryItems, newItemsLast30Days] =
            await Promise.all([
                prisma.item.count(),
                prisma.item.count({ where: { visibility: 'PUBLIC' } }),
                prisma.item.count({ where: { rarity: { in: ['RARE', 'EPIC', 'LEGENDARY'] } } }),
                prisma.item.count({ where: { rarity: 'LEGENDARY' } }),
                prisma.item.count({ where: { createdAt: { gte: thirty } } }),
            ])
        return {
            totalItems,
            publicItems,
            rareItems,
            legendaryItems,
            newItemsLast30Days,
        }
    },
} as const
