import { Prisma } from '@prisma/client'

import { raceRepository } from './races.repository'
import type { CreateRace, Race, RaceListQuery, RaceStats, UpdateRace } from './v1/races.http.schema'

import type { AuthenticatedUser } from '@/features/auth'
import { prisma } from '@/infrastructure/database'
import { err } from '@/shared/errors'
import { maskHiddenEntity } from '@/shared/utils/mask-hidden.helper'
import {
    applySecurityFilters,
    canModifyResource,
    canViewResource,
} from '@/shared/utils/rbac.helpers'

export const raceService = {
    async getById(id: string, user?: AuthenticatedUser): Promise<Race> {
        const race = await raceRepository.findById(id)
        if (!race) throw err('RESOURCE_NOT_FOUND', 'Race not found')
        if (!canViewResource(user, race)) throw err('RESOURCE_NOT_FOUND', 'Race not found')
        const masked = maskHiddenEntity(race, user) as Race
        return masked
    },

    async getByName(name: string, user?: AuthenticatedUser): Promise<Race | null> {
        const race = await raceRepository.findByName(name)
        if (!race) return null
        if (!canViewResource(user, race)) return null
        const masked = maskHiddenEntity(race, user) as Race
        return masked
    },

    async list(query: RaceListQuery, user?: AuthenticatedUser) {
        const businessFilters: Record<string, unknown> = {}
        if (query.visibility !== undefined) businessFilters.visibility = query.visibility
        if (query.search) {
            businessFilters.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ]
        }
        const secureFilters = applySecurityFilters(businessFilters, user)
        const { races, hasNext, nextCursor } = await raceRepository.findMany({
            ...query,
            filters: secureFilters,
        })
        const maskedRaces = races.map(r => maskHiddenEntity(r, user) as Race)
        return {
            races: maskedRaces,
            pagination: {
                hasNext,
                hasPrev: !!query.cursor,
                limit: query.limit ?? 20,
                ...(nextCursor && { nextCursor }),
                ...(query.cursor && { startCursor: query.cursor }),
            },
        }
    },

    async create(data: CreateRace, user: AuthenticatedUser): Promise<Race> {
        const existing = await raceRepository.findByName(data.name)
        if (existing) throw err('RESOURCE_CONFLICT', 'Race with this name already exists')
        return raceRepository.create({
            name: data.name,
            visibility: (data.visibility ?? 'PUBLIC') as 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
            ownerId: user.id,
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.imageId !== undefined ? { imageId: data.imageId } : {}),
            healthModifier: data.healthModifier ?? 100,
            manaModifier: data.manaModifier ?? 100,
            staminaModifier: data.staminaModifier ?? 100,
            strengthModifier: data.strengthModifier ?? 10,
            constitutionModifier: data.constitutionModifier ?? 10,
            dexterityModifier: data.dexterityModifier ?? 10,
            intelligenceModifier: data.intelligenceModifier ?? 10,
            wisdomModifier: data.wisdomModifier ?? 10,
            charismaModifier: data.charismaModifier ?? 10,
        })
    },

    async update(id: string, data: UpdateRace, user: AuthenticatedUser): Promise<Race> {
        const current = await raceRepository.findById(id)
        if (!current) throw err('RESOURCE_NOT_FOUND', 'Race not found')
        if (!canModifyResource(user, current))
            throw err('FORBIDDEN', 'You do not have permission to modify this race')
        if (data.name && data.name !== current.name) {
            const existing = await raceRepository.findByName(data.name)
            if (existing && existing.id !== id) {
                throw err('RESOURCE_CONFLICT', 'Race with this name already exists')
            }
        }
        const updateData: Prisma.RaceUpdateInput = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.visibility !== undefined)
            updateData.visibility = data.visibility as 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
        if (data.imageId !== undefined) updateData.image = { connect: { id: data.imageId } }
        if (data.healthModifier !== undefined) updateData.healthModifier = data.healthModifier
        if (data.manaModifier !== undefined) updateData.manaModifier = data.manaModifier
        if (data.staminaModifier !== undefined) updateData.staminaModifier = data.staminaModifier
        if (data.strengthModifier !== undefined) updateData.strengthModifier = data.strengthModifier
        if (data.constitutionModifier !== undefined)
            updateData.constitutionModifier = data.constitutionModifier
        if (data.dexterityModifier !== undefined)
            updateData.dexterityModifier = data.dexterityModifier
        if (data.intelligenceModifier !== undefined)
            updateData.intelligenceModifier = data.intelligenceModifier
        if (data.wisdomModifier !== undefined) updateData.wisdomModifier = data.wisdomModifier
        if (data.charismaModifier !== undefined) updateData.charismaModifier = data.charismaModifier
        return raceRepository.update(id, updateData)
    },

    async delete(id: string, user: AuthenticatedUser): Promise<void> {
        const current = await raceRepository.findById(id)
        if (!current) throw err('RESOURCE_NOT_FOUND', 'Race not found')
        if (!canModifyResource(user, current))
            throw err('FORBIDDEN', 'You do not have permission to delete this race')
        // Pre-check usage to return deterministic 409 instead of relying solely on FK constraint
        const usage = await prisma.character.count({ where: { raceId: id } })
        if (usage > 0) {
            throw err('RESOURCE_IN_USE', 'Resource is referenced and cannot be deleted')
        }
        await raceRepository.delete(id)
    },

    async getStats(user?: AuthenticatedUser): Promise<RaceStats> {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
            throw err('FORBIDDEN', 'You do not have permission to view race statistics')
        }
        return raceRepository.getStats()
    },
} as const
