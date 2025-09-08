import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '@/features/auth'
import { tagRepository } from '@/features/tags/tags.repository'
import { tagService } from '@/features/tags/tags.service'
import { generateUUIDv7 } from '@/shared/utils'

// Mock the repository
vi.mock('@/features/tags/tags.repository', () => ({
    tagRepository: {
        findByName: vi.fn(),
        findById: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        getStats: vi.fn(),
    },
}))

describe('Tag Service Unit Tests', () => {
    const mockUser: AuthenticatedUser = {
        id: generateUUIDv7(),
        email: 'user@example.com',
        role: 'USER',
    }

    const mockAdmin: AuthenticatedUser = {
        id: generateUUIDv7(),
        email: 'admin@example.com',
        role: 'ADMIN',
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('create', () => {
        it('should create a tag with default visibility', async () => {
            const tagData = {
                name: 'Test Tag',
                description: 'A test tag',
            }

            const mockCreatedTag = {
                id: 'mock-id',
                name: tagData.name,
                description: tagData.description,
                visibility: 'PUBLIC' as const,
                ownerId: mockUser.id,
                createdAt: '2025-01-01T00:00:00.000Z',
                updatedAt: '2025-01-01T00:00:00.000Z',
            }

            // Mock repository methods
            vi.mocked(tagRepository.findByName).mockResolvedValue(null)
            vi.mocked(tagRepository.create).mockResolvedValue(mockCreatedTag)

            const result = await tagService.create(tagData, mockUser)

            // Check that the result has the expected structure (not exact match due to real IDs)
            expect(result).toMatchObject({
                name: tagData.name,
                description: tagData.description,
                visibility: 'PUBLIC',
                ownerId: mockUser.id,
            })
            expect(result).toHaveProperty('id')
            expect(result).toHaveProperty('createdAt')
            expect(result).toHaveProperty('updatedAt')
        })

        it('should throw error for duplicate name', async () => {
            const tagData = {
                name: 'Existing Tag',
                description: 'A test tag',
            }

            const existingTag = {
                id: 'existing-id',
                name: tagData.name,
                description: 'Existing description',
                visibility: 'PUBLIC' as const,
                ownerId: 'other-user-id',
                createdAt: '2025-01-01T00:00:00.000Z',
                updatedAt: '2025-01-01T00:00:00.000Z',
            }

            vi.mocked(tagRepository.findByName).mockResolvedValue(existingTag)

            await expect(tagService.create(tagData, mockUser)).rejects.toThrow(
                'Tag with this name already exists'
            )
        })
    })

    describe('getById', () => {
        it('should return tag if user can view it', async () => {
            const tagId = 'test-tag-id'
            const mockTag = {
                id: tagId,
                name: 'Test Tag',
                description: 'A test tag',
                visibility: 'PUBLIC' as const,
                ownerId: mockUser.id,
                createdAt: '2025-01-01T00:00:00.000Z',
                updatedAt: '2025-01-01T00:00:00.000Z',
            }

            vi.mocked(tagRepository.findById).mockResolvedValue(mockTag)

            const result = await tagService.getById(tagId, mockUser)

            expect(result).toMatchObject({
                id: tagId,
                name: 'Test Tag',
                visibility: 'PUBLIC',
                ownerId: mockUser.id,
            })
        })

        it('should throw NOT_FOUND if tag does not exist', async () => {
            const tagId = 'non-existent-id'

            vi.mocked(tagRepository.findById).mockResolvedValue(null)

            await expect(tagService.getById(tagId, mockUser)).rejects.toThrow('Tag not found')
        })
    })

    describe('getStats', () => {
        it('should return stats for admin', async () => {
            const mockStats = {
                totalTags: 100,
                publicTags: 80,
                privateTags: 15,
                hiddenTags: 5,
                newTagsLast30Days: 10,
                topTags: [{ id: 'popular-tag-id', name: 'Popular Tag', usageCount: 50 }],
            }

            vi.mocked(tagRepository.getStats).mockResolvedValue(mockStats)

            const result = await tagService.getStats(mockAdmin)

            expect(result).toEqual(mockStats)
        })

        it('should throw FORBIDDEN for regular user', async () => {
            await expect(tagService.getStats(mockUser)).rejects.toThrow(
                'You do not have permission to view tag statistics'
            )
        })
    })
})
