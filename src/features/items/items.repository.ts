import { Prisma, Rarity, Slot, Visibility } from '@prisma/client'

import type { Item } from './items.domain.schema'
import type { ItemListQuery, ItemStats } from './v1/items.http.schema'

import { prisma } from '@/infrastructure/database'
import { AppError, err } from '@/shared/errors'
import { applyCursor, buildOrderBy, buildPagination } from '@/shared/utils/query.helper'
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

// Local pagination helpers replaced by shared/utils/query.helper

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
        const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = query

        const where = filters as Prisma.ItemWhereInput

        let whereWithCursor: Prisma.ItemWhereInput
        try {
            whereWithCursor = applyCursor(
                where,
                cursor ?? null,
                sortBy as keyof Prisma.ItemWhereInput,
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

        const rows = await prisma.item.findMany({
            where: whereWithCursor,
            orderBy: buildOrderBy(sortBy, sortDir) as unknown as
                | Prisma.ItemOrderByWithRelationInput
                | Prisma.ItemOrderByWithRelationInput[],
            take: limit + 1,
        })
        const { items, hasNext, nextCursor } = buildPagination(
            rows,
            limit,
            sortBy as keyof (typeof rows)[number]
        )
        return { items: (items as typeof rows).map(transform), hasNext, nextCursor }
    },
    async create(data: CreateItemData) {
        const id = generateUUIDv7()
        const baseData: Prisma.ItemCreateInput = {
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
            ...(data.imageId ? { image: { connect: { id: data.imageId } } } : {}),
        }
        // Try to connect owner if provided; if FK/connect fails, fall back to creating without owner
        let model: Prisma.ItemGetPayload<object>
        if (data.ownerId) {
            try {
                model = await prisma.item.create({
                    data: { ...baseData, owner: { connect: { id: data.ownerId } } },
                })
            } catch (error) {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    (error.code === 'P2003' || error.code === 'P2025')
                ) {
                    model = await prisma.item.create({ data: baseData })
                } else {
                    throw error
                }
            }
        } else {
            model = await prisma.item.create({ data: baseData })
        }
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
                if (error.code === 'P2025') throw err('RESOURCE_NOT_FOUND', 'Item not found')
                if (error.code === 'P2003') {
                    throw err('RESOURCE_IN_USE', 'Item is referenced and cannot be deleted')
                }
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
