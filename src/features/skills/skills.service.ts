import { Prisma } from '@prisma/client'

import { skillRepository } from './skills.repository'
import type {
    CreateSkillRequest,
    Skill,
    SkillListQuery,
    SkillStats,
    UpdateSkill,
} from './v1/skills.http.schema'

import type { AuthenticatedUser } from '@/features/auth'
import { err } from '@/shared/errors'
import { maskHiddenEntity } from '@/shared/utils/mask-hidden.helper'
import { enforceModifyPermission, enforceViewPermission } from '@/shared/utils/permission.helper'
import { applySecurityFilters, canViewResource } from '@/shared/utils/rbac.helpers'

export const skillService = {
    async getById(id: string, user?: AuthenticatedUser): Promise<Skill> {
        const skill = await skillRepository.findById(id)
        if (!skill) throw err('RESOURCE_NOT_FOUND', 'Skill not found')
        enforceViewPermission(user, skill, 'Skill not found')
        return maskHiddenEntity(skill, user) as Skill
    },

    async getByName(name: string, user?: AuthenticatedUser): Promise<Skill | null> {
        const skill = await skillRepository.findByName(name)
        if (!skill) return null
        if (!canViewResource(user, skill)) return null
        return maskHiddenEntity(skill, user) as Skill
    },

    async list(query: SkillListQuery, user?: AuthenticatedUser) {
        const businessFilters: Record<string, unknown> = {}

        if (query.visibility !== undefined) businessFilters.visibility = query.visibility

        if (query.search) {
            businessFilters.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ]
        }

        const secureFilters = applySecurityFilters(businessFilters, user)
        const { skills, hasNext, nextCursor } = await skillRepository.findMany({
            ...query,
            filters: secureFilters,
        })
        const maskedSkills = skills.map(s => maskHiddenEntity(s, user) as Skill)
        return {
            skills: maskedSkills,
            pagination: {
                hasNext,
                hasPrev: !!query.cursor,
                limit: query.limit ?? 20,
                ...(nextCursor && { nextCursor }),
                ...(query.cursor && { prevCursor: query.cursor }),
            },
        }
    },

    async create(data: CreateSkillRequest, user: AuthenticatedUser): Promise<Skill> {
        const existing = await skillRepository.findByName(data.name)
        if (existing) throw err('RESOURCE_CONFLICT', 'Skill with this name already exists')

        return skillRepository.create({
            name: data.name,
            requiredLevel: data.requiredLevel ?? 1,
            visibility: (data.visibility ?? 'PUBLIC') as 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
            ownerId: user.id,
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.imageId !== undefined ? { imageId: data.imageId } : {}),
        })
    },

    async update(id: string, data: UpdateSkill, user: AuthenticatedUser): Promise<Skill> {
        const current = await skillRepository.findById(id)
        if (!current) throw err('RESOURCE_NOT_FOUND', 'Skill not found')
        enforceModifyPermission(
            user,
            current,
            'Skill not found',
            'You do not have permission to modify this skill'
        )

        if (data.name && data.name !== current.name) {
            const existing = await skillRepository.findByName(data.name)
            if (existing && existing.id !== id) {
                throw err('RESOURCE_CONFLICT', 'Skill with this name already exists')
            }
        }

        const updateData: Prisma.SkillUpdateInput = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.requiredLevel !== undefined) updateData.requiredLevel = data.requiredLevel
        if (data.visibility !== undefined)
            updateData.visibility = data.visibility as 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
        // Image relation updates are handled via dedicated endpoints; ignore imageId here

        return skillRepository.update(id, updateData)
    },

    async delete(id: string, user: AuthenticatedUser): Promise<void> {
        const current = await skillRepository.findById(id)
        if (!current) throw err('RESOURCE_NOT_FOUND', 'Skill not found')
        enforceModifyPermission(
            user,
            current,
            'Skill not found',
            'You do not have permission to delete this skill'
        )
        try {
            await skillRepository.delete(id)
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
                throw err('RESOURCE_IN_USE', 'Resource is referenced and cannot be deleted')
            }
            throw e
        }
    },

    async getStats(user?: AuthenticatedUser): Promise<SkillStats> {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
            throw err('FORBIDDEN', 'You do not have permission to view skill statistics')
        }
        return skillRepository.getStats()
    },
} as const
