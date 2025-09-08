import { Prisma } from '@prisma/client'

import { perkRepository } from './perks.repository'
import type {
    CreatePerkRequest,
    Perk,
    PerkListQuery,
    PerkStats,
    UpdatePerk,
} from './v1/perks.http.schema'

import type { AuthenticatedUser } from '@/features/auth'
import { err } from '@/shared/errors'
import {
    applySecurityFilters,
    canModifyResource,
    canViewResource,
} from '@/shared/utils/rbac.helpers'

export const perkService = {
    async getById(id: string, user?: AuthenticatedUser): Promise<Perk> {
        const perk = await perkRepository.findById(id)
        if (!perk) throw err('RESOURCE_NOT_FOUND', 'Perk not found')
        if (!canViewResource(user, perk)) throw err('RESOURCE_NOT_FOUND', 'Perk not found')
        return perk
    },

    async getByName(name: string, user?: AuthenticatedUser): Promise<Perk | null> {
        const perk = await perkRepository.findByName(name)
        if (!perk) return null
        if (!canViewResource(user, perk)) return null
        return perk
    },

    async list(query: PerkListQuery, user?: AuthenticatedUser) {
        const businessFilters: Record<string, unknown> = {}
        if (query.visibility !== undefined) businessFilters.visibility = query.visibility
        if (query.search) {
            businessFilters.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ]
        }
        const secureFilters = applySecurityFilters(businessFilters, user)
        const { perks, hasNext, nextCursor } = await perkRepository.findMany({
            ...query,
            filters: secureFilters,
        })
        return {
            perks,
            pagination: {
                hasNext,
                hasPrev: !!query.cursor,
                limit: query.limit ?? 20,
                ...(nextCursor && { nextCursor }),
                ...(query.cursor && { startCursor: query.cursor }),
            },
        }
    },

    async create(data: CreatePerkRequest, user: AuthenticatedUser): Promise<Perk> {
        const existing = await perkRepository.findByName(data.name)
        if (existing) throw err('RESOURCE_CONFLICT', 'Perk with this name already exists')
        return perkRepository.create({
            name: data.name,
            requiredLevel: data.requiredLevel ?? 1,
            visibility: (data.visibility ?? 'PUBLIC') as 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
            ownerId: user.id,
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.imageId !== undefined ? { imageId: data.imageId } : {}),
        })
    },

    async update(id: string, data: UpdatePerk, user: AuthenticatedUser): Promise<Perk> {
        const current = await perkRepository.findById(id)
        if (!current) throw err('RESOURCE_NOT_FOUND', 'Perk not found')
        if (!canModifyResource(user, current))
            throw err('FORBIDDEN', 'You do not have permission to modify this perk')
        if (data.name && data.name !== current.name) {
            const existing = await perkRepository.findByName(data.name)
            if (existing && existing.id !== id) {
                throw err('RESOURCE_CONFLICT', 'Perk with this name already exists')
            }
        }
        const updateData: Prisma.PerkUpdateInput = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.requiredLevel !== undefined) updateData.requiredLevel = data.requiredLevel
        if (data.visibility !== undefined)
            updateData.visibility = data.visibility as 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
        return perkRepository.update(id, updateData)
    },

    async delete(id: string, user: AuthenticatedUser): Promise<void> {
        const current = await perkRepository.findById(id)
        if (!current) throw err('RESOURCE_NOT_FOUND', 'Perk not found')
        if (!canModifyResource(user, current))
            throw err('FORBIDDEN', 'You do not have permission to delete this perk')
        await perkRepository.delete(id)
    },

    async getStats(user?: AuthenticatedUser): Promise<PerkStats> {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
            throw err('FORBIDDEN', 'You do not have permission to view perk statistics')
        }
        return perkRepository.getStats()
    },
} as const
