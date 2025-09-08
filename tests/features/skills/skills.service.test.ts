import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '@/features/auth'
import { skillRepository } from '@/features/skills/skills.repository'
import { skillService } from '@/features/skills/skills.service'
import { generateUUIDv7 } from '@/shared/utils'

vi.mock('@/features/skills/skills.repository', () => ({
    skillRepository: {
        findByName: vi.fn(),
        findById: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        getStats: vi.fn(),
    },
}))
describe('Skill Service Unit Tests', () => {
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
        it('creates a skill with defaults', async () => {
            const data = { name: 'Track', description: 'Track targets' }
            const created = {
                id: generateUUIDv7(),
                name: data.name,
                description: data.description,
                requiredLevel: 1,
                visibility: 'PUBLIC' as const,
                ownerId: mockUser.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            vi.mocked(skillRepository.findByName).mockResolvedValue(null)
            vi.mocked(skillRepository.create).mockResolvedValue(created as any)

            const result = await skillService.create(data, mockUser)
            expect(result).toMatchObject({ name: 'Track', requiredLevel: 1, visibility: 'PUBLIC' })
        })

        it('throws on duplicate name', async () => {
            vi.mocked(skillRepository.findByName).mockResolvedValue({
                id: 'x',
                name: 'Track',
            } as any)
            await expect(skillService.create({ name: 'Track' } as any, mockUser)).rejects.toThrow(
                'Skill with this name already exists'
            )
        })
    })

    describe('getById', () => {
        it('returns skill when viewable', async () => {
            const id = generateUUIDv7()
            vi.mocked(skillRepository.findById).mockResolvedValue({
                id,
                name: 'Sneak',
                visibility: 'PUBLIC',
                ownerId: mockUser.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as any)
            const result = await skillService.getById(id, mockUser)
            expect(result).toMatchObject({ id, name: 'Sneak' })
        })

        it('throws NOT_FOUND when missing', async () => {
            vi.mocked(skillRepository.findById).mockResolvedValue(null)
            await expect(skillService.getById('missing', mockUser)).rejects.toThrow(
                'Skill not found'
            )
        })
    })

    describe('getStats', () => {
        it('returns stats for admin', async () => {
            const stats = {
                totalSkills: 1,
                publicSkills: 1,
                privateSkills: 0,
                hiddenSkills: 0,
                newSkillsLast30Days: 1,
                topSkills: [],
            }
            vi.mocked(skillRepository.getStats).mockResolvedValue(stats as any)
            const result = await skillService.getStats(mockAdmin)
            expect(result).toEqual(stats)
        })

        it('forbids regular users', async () => {
            await expect(skillService.getStats(mockUser)).rejects.toThrow(
                'You do not have permission to view skill statistics'
            )
        })
    })
})
