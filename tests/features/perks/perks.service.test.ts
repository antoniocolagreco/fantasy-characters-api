import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '@/features/auth'
import { perkRepository } from '@/features/perks/perks.repository'
import { perkService } from '@/features/perks/perks.service'
import { generateUUIDv7 } from '@/shared/utils'

vi.mock('@/features/perks/perks.repository', () => ({
    perkRepository: {
        findByName: vi.fn(),
        findById: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        getStats: vi.fn(),
    },
}))

describe('Perk Service Unit Tests', () => {
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
        it('creates a perk with defaults', async () => {
            const data = { name: 'Lockpick', description: 'Open locked containers' }
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
            vi.mocked(perkRepository.findByName).mockResolvedValue(null)
            vi.mocked(perkRepository.create).mockResolvedValue(created as any)

            const result = await perkService.create(data as any, mockUser)
            expect(result).toMatchObject({
                name: 'Lockpick',
                requiredLevel: 1,
                visibility: 'PUBLIC',
            })
        })

        it('throws on duplicate name', async () => {
            vi.mocked(perkRepository.findByName).mockResolvedValue({
                id: 'x',
                name: 'Lockpick',
            } as any)
            await expect(perkService.create({ name: 'Lockpick' } as any, mockUser)).rejects.toThrow(
                'Perk with this name already exists'
            )
        })
    })

    describe('getById', () => {
        it('returns perk when viewable', async () => {
            const id = generateUUIDv7()
            vi.mocked(perkRepository.findById).mockResolvedValue({
                id,
                name: 'Sneak Attack',
                visibility: 'PUBLIC',
                ownerId: mockUser.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as any)
            const result = await perkService.getById(id, mockUser)
            expect(result).toMatchObject({ id, name: 'Sneak Attack' })
        })

        it('throws RESOURCE_NOT_FOUND when missing', async () => {
            vi.mocked(perkRepository.findById).mockResolvedValue(null)
            await expect(perkService.getById('missing', mockUser)).rejects.toThrow('Perk not found')
        })
    })

    describe('getStats', () => {
        it('returns stats for admin', async () => {
            const stats = {
                totalPerks: 1,
                publicPerks: 1,
                privatePerks: 0,
                hiddenPerks: 0,
                newPerksLast30Days: 1,
                topPerks: [],
            }
            vi.mocked(perkRepository.getStats).mockResolvedValue(stats as any)
            const result = await perkService.getStats(mockAdmin)
            expect(result).toEqual(stats)
        })

        it('forbids regular users', async () => {
            await expect(perkService.getStats(mockUser)).rejects.toThrow(
                'You do not have permission to view perk statistics'
            )
        })
    })
})
