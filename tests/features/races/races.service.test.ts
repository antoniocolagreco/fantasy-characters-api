import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '@/features/auth'
import { raceRepository } from '@/features/races/races.repository'
import { raceService } from '@/features/races/races.service'
import { generateUUIDv7 } from '@/shared/utils'

vi.mock('@/features/races/races.repository', () => ({
    raceRepository: {
        findByName: vi.fn(),
        findById: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        getStats: vi.fn(),
    },
}))

describe('Race Service Unit Tests', () => {
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
        it('creates a race with defaults', async () => {
            const data = { name: 'Orc', description: 'Strong warriors' }
            const created = {
                id: generateUUIDv7(),
                name: data.name,
                description: data.description,
                visibility: 'PUBLIC' as const,
                ownerId: mockUser.id,
                healthModifier: 100,
                manaModifier: 100,
                staminaModifier: 100,
                strengthModifier: 10,
                constitutionModifier: 10,
                dexterityModifier: 10,
                intelligenceModifier: 10,
                wisdomModifier: 10,
                charismaModifier: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            vi.mocked(raceRepository.findByName).mockResolvedValue(null)
            vi.mocked(raceRepository.create).mockResolvedValue(created as any)

            const result = await raceService.create(data as any, mockUser)
            expect(result).toMatchObject({
                name: 'Orc',
                visibility: 'PUBLIC',
                ownerId: mockUser.id,
            })
        })

        it('throws on duplicate name', async () => {
            vi.mocked(raceRepository.findByName).mockResolvedValue({ id: 'x', name: 'Orc' } as any)
            await expect(raceService.create({ name: 'Orc' } as any, mockUser)).rejects.toThrow(
                'Race with this name already exists'
            )
        })
    })

    describe('getById', () => {
        it('returns race when viewable', async () => {
            const id = generateUUIDv7()
            vi.mocked(raceRepository.findById).mockResolvedValue({
                id,
                name: 'Human',
                visibility: 'PUBLIC',
                ownerId: mockUser.id,
                healthModifier: 100,
                manaModifier: 100,
                staminaModifier: 100,
                strengthModifier: 10,
                constitutionModifier: 10,
                dexterityModifier: 10,
                intelligenceModifier: 10,
                wisdomModifier: 10,
                charismaModifier: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as any)
            const result = await raceService.getById(id, mockUser)
            expect(result).toMatchObject({ id, name: 'Human' })
        })

        it('throws RESOURCE_NOT_FOUND when missing', async () => {
            vi.mocked(raceRepository.findById).mockResolvedValue(null)
            await expect(raceService.getById('missing', mockUser)).rejects.toThrow('Race not found')
        })
    })

    describe('getStats', () => {
        it('returns stats for admin', async () => {
            const stats = {
                totalRaces: 1,
                publicRaces: 1,
                privateRaces: 0,
                hiddenRaces: 0,
                newRacesLast30Days: 1,
                topRaces: [],
            }
            vi.mocked(raceRepository.getStats).mockResolvedValue(stats as any)
            const result = await raceService.getStats(mockAdmin)
            expect(result).toEqual(stats)
        })

        it('forbids regular users', async () => {
            await expect(raceService.getStats(mockUser)).rejects.toThrow(
                'You do not have permission to view race statistics'
            )
        })
    })
})
