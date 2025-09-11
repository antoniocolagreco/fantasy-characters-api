import { Prisma } from '@prisma/client'

import { tagRepository } from './tags.repository'
import type { CreateTagRequest, Tag, TagListQuery, TagStats, UpdateTag } from './tags.type'

import type { AuthenticatedUser } from '@/features/auth'
import { err } from '@/shared/errors'
import { maskHiddenEntity } from '@/shared/utils/mask-hidden.helper'
import { enforceModifyPermission, enforceViewPermission } from '@/shared/utils/permission.helper'
import { applySecurityFilters, canViewResource } from '@/shared/utils/rbac.helpers'

// ===== Tag Service =====
export const tagService = {
    async getById(id: string, user?: AuthenticatedUser): Promise<Tag> {
        const tag = await tagRepository.findById(id)
        if (!tag) {
            throw err('RESOURCE_NOT_FOUND', 'Tag not found')
        }

        // Conceal if not viewable
        enforceViewPermission(user, tag, 'Tag not found')
        return maskHiddenEntity(tag, user) as Tag
    },

    async getByName(name: string, user?: AuthenticatedUser): Promise<Tag | null> {
        const tag = await tagRepository.findByName(name)
        if (!tag) {
            return null
        }

        // Conceal existence on not-viewable
        if (!canViewResource(user, tag)) return null
        return maskHiddenEntity(tag, user) as Tag
    },

    async list(query: TagListQuery, user?: AuthenticatedUser) {
        // Build business filters from query parameters
        const businessFilters: Record<string, unknown> = {}

        // Handle visibility filter
        if (query.visibility !== undefined) {
            businessFilters.visibility = query.visibility
        }

        // Handle search filter
        if (query.search) {
            businessFilters.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ]
        }

        // Apply security filters using helper
        const secureFilters = applySecurityFilters(businessFilters, user)

        const { tags, hasNext, nextCursor } = await tagRepository.findMany({
            ...query,
            filters: secureFilters,
        })
        const maskedTags = tags.map(t => maskHiddenEntity(t, user) as Tag)
        return {
            tags: maskedTags,
            pagination: {
                hasNext,
                hasPrev: !!query.cursor,
                limit: query.limit ?? 20,
                ...(nextCursor && { nextCursor }),
                ...(query.cursor && { prevCursor: query.cursor }),
            },
        }
    },

    async create(data: CreateTagRequest, user: AuthenticatedUser): Promise<Tag> {
        // Check if tag with name already exists
        const existingTag = await tagRepository.findByName(data.name)
        if (existingTag) {
            throw err('RESOURCE_CONFLICT', 'Tag with this name already exists')
        }

        // Create tag with owner and default visibility
        const tagData = {
            ...data,
            ownerId: user.id,
            visibility: (data.visibility ?? 'PUBLIC') as 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
        }

        return tagRepository.create(tagData)
    },

    async update(id: string, data: UpdateTag, user: AuthenticatedUser): Promise<Tag> {
        // Get current tag
        const tag = await tagRepository.findById(id)
        if (!tag) {
            throw err('RESOURCE_NOT_FOUND', 'Tag not found')
        }

        // 404 if not viewable; 403 if viewable but not modifiable
        enforceModifyPermission(
            user,
            tag,
            'Tag not found',
            'You do not have permission to modify this tag'
        )

        // Check for name conflicts if name is being updated
        if (data.name && data.name !== tag.name) {
            const existingTag = await tagRepository.findByName(data.name)
            if (existingTag && existingTag.id !== id) {
                throw err('RESOURCE_CONFLICT', 'Tag with this name already exists')
            }
        }

        // Transform data to match Prisma types
        const updateData: Prisma.TagUpdateInput = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.visibility !== undefined) {
            updateData.visibility = data.visibility as 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
        }

        return tagRepository.update(id, updateData)
    },

    async delete(id: string, user: AuthenticatedUser): Promise<void> {
        // Get current tag
        const tag = await tagRepository.findById(id)
        if (!tag) {
            throw err('RESOURCE_NOT_FOUND', 'Tag not found')
        }

        // 404 if not viewable; 403 if viewable but not modifiable
        enforceModifyPermission(
            user,
            tag,
            'Tag not found',
            'You do not have permission to delete this tag'
        )

        await tagRepository.delete(id)
    },

    async getStats(user?: AuthenticatedUser): Promise<TagStats> {
        // Only admins and moderators can view comprehensive stats
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
            throw err('FORBIDDEN', 'You do not have permission to view tag statistics')
        }

        return tagRepository.getStats()
    },
} as const
