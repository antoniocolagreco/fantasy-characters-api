import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '@/features/auth'
import { itemRepository } from '@/features/items/items.repository'
import { itemService } from '@/features/items/items.service'
import { generateUUIDv7 } from '@/shared/utils'

vi.mock('@/features/items/items.repository', () => ({
    itemRepository: {
        findById: vi.fn(),
        findByName: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        getStats: vi.fn(),
    },
}))

describe('Item Service Unit Tests', () => {
    const user: AuthenticatedUser = { id: generateUUIDv7(), email: 'u@test', role: 'USER' }
    const admin: AuthenticatedUser = { id: generateUUIDv7(), email: 'a@test', role: 'ADMIN' }

    beforeEach(() => vi.clearAllMocks())

    it('getById returns item, enforces visibility', async () => {
        const id = generateUUIDv7()
        vi.mocked(itemRepository.findById).mockResolvedValue({
            id,
            name: 'Item',
            visibility: 'PUBLIC',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            rarity: 'COMMON',
            slot: 'NONE',
            requiredLevel: 1,
            weight: 1,
            durability: 100,
            maxDurability: 100,
            value: 0,
            is2Handed: false,
            isThrowable: false,
            isConsumable: false,
            isQuestItem: false,
            isTradeable: true,
        })
        const result = await itemService.getById(id, user)
        expect(result.id).toBe(id)
    })

    it('getById missing throws', async () => {
        vi.mocked(itemRepository.findById).mockResolvedValue(null)
        await expect(itemService.getById(generateUUIDv7(), user)).rejects.toThrow('Item not found')
    })

    it('create duplicate name prevented', async () => {
        vi.mocked(itemRepository.findByName).mockResolvedValue({
            id: generateUUIDv7(),
            name: 'Dup',
            visibility: 'PUBLIC',
            createdAt: '',
            updatedAt: '',
            rarity: 'COMMON',
            slot: 'NONE',
            requiredLevel: 1,
            weight: 1,
            durability: 100,
            maxDurability: 100,
            value: 0,
            is2Handed: false,
            isThrowable: false,
            isConsumable: false,
            isQuestItem: false,
            isTradeable: true,
        })
        await expect(itemService.create({ name: 'Dup' } as any, user)).rejects.toThrow(
            'Item with this name already exists'
        )
    })

    it('create success passes defaults', async () => {
        vi.mocked(itemRepository.findByName).mockResolvedValue(null)
        vi.mocked(itemRepository.create).mockResolvedValue({
            id: generateUUIDv7(),
            name: 'New',
            visibility: 'PUBLIC',
            createdAt: '',
            updatedAt: '',
            rarity: 'COMMON',
            slot: 'NONE',
            requiredLevel: 1,
            weight: 1,
            durability: 100,
            maxDurability: 100,
            value: 0,
            is2Handed: false,
            isThrowable: false,
            isConsumable: false,
            isQuestItem: false,
            isTradeable: true,
            ownerId: user.id,
        })
        const created = await itemService.create({ name: 'New' } as any, user)
        expect(created.name).toBe('New')
    })

    it('update permission denied', async () => {
        const id = generateUUIDv7()
        vi.mocked(itemRepository.findById).mockResolvedValue({
            id,
            name: 'Owned',
            ownerId: generateUUIDv7(),
            visibility: 'PRIVATE',
            createdAt: '',
            updatedAt: '',
            rarity: 'COMMON',
            slot: 'NONE',
            requiredLevel: 1,
            weight: 1,
            durability: 100,
            maxDurability: 100,
            value: 0,
            is2Handed: false,
            isThrowable: false,
            isConsumable: false,
            isQuestItem: false,
            isTradeable: true,
        })
        await expect(itemService.update(id, { name: 'X' } as any, user)).rejects.toThrow(
            'You do not have permission'
        )
    })

    it('getStats admin allowed, user forbidden', async () => {
        vi.mocked(itemRepository.getStats).mockResolvedValue({
            totalItems: 1,
            publicItems: 1,
            rareItems: 0,
            legendaryItems: 0,
            newItemsLast30Days: 1,
        })
        await expect(itemService.getStats(user)).rejects.toThrow('permission')
        const stats = await itemService.getStats(admin)
        expect(stats.totalItems).toBe(1)
    })
})
