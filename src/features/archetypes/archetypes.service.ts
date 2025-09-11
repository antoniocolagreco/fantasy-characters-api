import { Prisma } from '@prisma/client'

import { archetypeRepository } from './archetypes.repository'
import type {
    Archetype,
    ArchetypeListQuery,
    ArchetypeStats,
    CreateArchetype,
    UpdateArchetype,
} from './v1/archetypes.http.schema'

import type { AuthenticatedUser } from '@/features/auth'
import { err } from '@/shared/errors'
import { maskHiddenEntity } from '@/shared/utils/mask-hidden.helper'
import {
    applySecurityFilters,
    canModifyResource,
    canViewResource,
} from '@/shared/utils/rbac.helpers'

export const archetypeService = {
    async getById(id: string, user?: AuthenticatedUser): Promise<Archetype> {
        const archetype = await archetypeRepository.findById(id)
        if (!archetype) throw err('RESOURCE_NOT_FOUND', 'Archetype not found')
        if (!canViewResource(user, archetype))
            throw err('RESOURCE_NOT_FOUND', 'Archetype not found')
        return maskHiddenEntity(archetype, user) as Archetype
    },
    async getByName(name: string, user?: AuthenticatedUser): Promise<Archetype | null> {
        const archetype = await archetypeRepository.findByName(name)
        if (!archetype) return null
        if (!canViewResource(user, archetype)) return null
        return maskHiddenEntity(archetype, user) as Archetype
    },
    async list(query: ArchetypeListQuery, user?: AuthenticatedUser) {
        const businessFilters: Record<string, unknown> = {}
        if (query.visibility !== undefined) businessFilters.visibility = query.visibility
        if (query.search) {
            businessFilters.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ]
        }
        const secureFilters = applySecurityFilters(businessFilters, user)
        const { archetypes, hasNext, nextCursor } = await archetypeRepository.findMany({
            ...query,
            filters: secureFilters,
        })
        const masked = archetypes.map(a => maskHiddenEntity(a, user) as Archetype)
        return {
            archetypes: masked,
            pagination: {
                hasNext,
                hasPrev: !!query.cursor,
                limit: query.limit ?? 20,
                ...(nextCursor && { nextCursor }),
                ...(query.cursor && { prevCursor: query.cursor }),
            },
        }
    },
    async create(data: CreateArchetype, user: AuthenticatedUser): Promise<Archetype> {
        const existing = await archetypeRepository.findByName(data.name)
        if (existing) throw err('RESOURCE_CONFLICT', 'Archetype with this name already exists')
        return archetypeRepository.create({
            name: data.name,
            visibility: (data.visibility ?? 'PUBLIC') as 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
            ownerId: user.id,
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.imageId !== undefined ? { imageId: data.imageId } : {}),
        })
    },
    async update(id: string, data: UpdateArchetype, user: AuthenticatedUser): Promise<Archetype> {
        const current = await archetypeRepository.findById(id)
        if (!current) throw err('RESOURCE_NOT_FOUND', 'Archetype not found')
        if (!canModifyResource(user, current))
            throw err('FORBIDDEN', 'You do not have permission to modify this archetype')
        if (data.name && data.name !== current.name) {
            const existing = await archetypeRepository.findByName(data.name)
            if (existing && existing.id !== id) {
                throw err('RESOURCE_CONFLICT', 'Archetype with this name already exists')
            }
        }
        const updateData: Prisma.ArchetypeUpdateInput = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.visibility !== undefined)
            updateData.visibility = data.visibility as 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
        if (data.imageId !== undefined) updateData.image = { connect: { id: data.imageId } }
        return archetypeRepository.update(id, updateData)
    },
    async delete(id: string, user: AuthenticatedUser): Promise<void> {
        const current = await archetypeRepository.findById(id)
        if (!current) throw err('RESOURCE_NOT_FOUND', 'Archetype not found')
        if (!canModifyResource(user, current))
            throw err('FORBIDDEN', 'You do not have permission to delete this archetype')
        try {
            await archetypeRepository.delete(id)
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
                throw err('RESOURCE_IN_USE', 'Resource is referenced and cannot be deleted')
            }
            throw e
        }
    },
    async getStats(user?: AuthenticatedUser): Promise<ArchetypeStats> {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
            throw err('FORBIDDEN', 'You do not have permission to view archetype statistics')
        }
        return archetypeRepository.getStats()
    },
} as const
