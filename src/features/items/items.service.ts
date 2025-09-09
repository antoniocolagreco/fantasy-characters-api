// Stub service (implementation in later tasks)
import { Prisma, type Rarity, type Slot, type Visibility } from '@prisma/client'

import { itemRepository } from './items.repository'
import type { CreateItem, Item, ItemListQuery, ItemStats, UpdateItem } from './v1/items.http.schema'

import type { AuthenticatedUser } from '@/features/auth'
import { err } from '@/shared/errors'
import { maskHiddenEntity } from '@/shared/utils/mask-hidden.helper'
import {
    applySecurityFilters,
    canModifyResource,
    canViewResource,
} from '@/shared/utils/rbac.helpers'

export const itemService = {
    async getById(id: string, user?: AuthenticatedUser): Promise<Item> {
        const item = await itemRepository.findById(id)
        if (!item) throw err('RESOURCE_NOT_FOUND', 'Item not found')
        if (!canViewResource(user, item)) throw err('RESOURCE_NOT_FOUND', 'Item not found')
        return maskHiddenEntity(item, user) as Item
    },
    async getByName(name: string, user?: AuthenticatedUser): Promise<Item | null> {
        const item = await itemRepository.findByName(name)
        if (!item) return null
        if (!canViewResource(user, item)) return null
        return maskHiddenEntity(item, user) as Item
    },
    async list(query: ItemListQuery, user?: AuthenticatedUser) {
        const businessFilters: Record<string, unknown> = {}
        if (query.visibility !== undefined) businessFilters.visibility = query.visibility
        if (query.search) {
            businessFilters.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ]
        }
        const secureFilters = applySecurityFilters(businessFilters, user)
        const { items, hasNext, nextCursor } = await itemRepository.findMany({
            ...query,
            filters: secureFilters,
        })
        const maskedItems = items.map(i => maskHiddenEntity(i, user) as Item)
        return {
            items: maskedItems,
            pagination: {
                hasNext,
                hasPrev: !!query.cursor,
                limit: query.limit ?? 20,
                ...(nextCursor && { nextCursor }),
                ...(query.cursor && { startCursor: query.cursor }),
            },
        }
    },
    async create(data: CreateItem, user: AuthenticatedUser): Promise<Item> {
        const existing = await itemRepository.findByName(data.name)
        if (existing) throw err('RESOURCE_CONFLICT', 'Item with this name already exists')
        const visibility: Visibility = (data as { visibility?: Visibility }).visibility ?? 'PUBLIC'
        const rarity: Rarity | undefined = data.rarity as Rarity | undefined
        const slot: Slot | undefined = data.slot as Slot | undefined
        return itemRepository.create({
            name: data.name,
            rarity,
            slot,
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
            ownerId: user.id,
            visibility,
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.imageId !== undefined ? { imageId: data.imageId } : {}),
        })
    },
    async update(id: string, data: UpdateItem, user: AuthenticatedUser): Promise<Item> {
        const current = await itemRepository.findById(id)
        if (!current) throw err('RESOURCE_NOT_FOUND', 'Item not found')
        if (!canModifyResource(user, current))
            throw err('FORBIDDEN', 'You do not have permission to modify this item')
        if (data.name && data.name !== current.name) {
            const existing = await itemRepository.findByName(data.name)
            if (existing && existing.id !== id) {
                throw err('RESOURCE_CONFLICT', 'Item with this name already exists')
            }
        }
        const updateData: Prisma.ItemUpdateInput = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if ((data as { visibility?: Visibility }).visibility !== undefined) {
            updateData.visibility = (data as { visibility?: Visibility }).visibility as Visibility
        }
        if (data.imageId !== undefined) updateData.image = { connect: { id: data.imageId } }
        if (data.rarity !== undefined) {
            updateData.rarity = data.rarity as Rarity
        }
        if (data.slot !== undefined) {
            updateData.slot = data.slot as Slot
        }
        if (data.requiredLevel !== undefined) updateData.requiredLevel = data.requiredLevel
        if (data.weight !== undefined) updateData.weight = data.weight
        if (data.durability !== undefined) updateData.durability = data.durability
        if (data.maxDurability !== undefined) updateData.maxDurability = data.maxDurability
        if (data.value !== undefined) updateData.value = data.value
        if (data.is2Handed !== undefined) updateData.is2Handed = data.is2Handed
        if (data.isThrowable !== undefined) updateData.isThrowable = data.isThrowable
        if (data.isConsumable !== undefined) updateData.isConsumable = data.isConsumable
        if (data.isQuestItem !== undefined) updateData.isQuestItem = data.isQuestItem
        if (data.isTradeable !== undefined) updateData.isTradeable = data.isTradeable
        return itemRepository.update(id, updateData)
    },
    async delete(id: string, user: AuthenticatedUser): Promise<void> {
        const current = await itemRepository.findById(id)
        if (!current) throw err('RESOURCE_NOT_FOUND', 'Item not found')
        if (!canModifyResource(user, current))
            throw err('FORBIDDEN', 'You do not have permission to delete this item')
        try {
            await itemRepository.delete(id)
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
                throw err('RESOURCE_IN_USE', 'Resource is referenced and cannot be deleted')
            }
            throw e
        }
    },
    async getStats(user?: AuthenticatedUser): Promise<ItemStats> {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
            throw err('FORBIDDEN', 'You do not have permission to view item statistics')
        }
        return itemRepository.getStats()
    },
} as const
