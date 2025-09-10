import { describe, expect, it } from 'vitest'

import { maskEquipmentSlots } from '@/shared/utils/mask-hidden.helper'

describe('maskEquipmentSlots (extended)', () => {
    const viewer = { id: 'user-1', role: 'USER', email: 'u@test.local' }

    const hiddenSword = {
        id: 'item-1',
        name: 'Sword of Secrets',
        description: 'A hidden blade',
        visibility: 'HIDDEN',
        ownerId: 'owner-2',
    }

    it('masks hidden slot by default for non-privileged viewer', () => {
        const equipment = { rightHand: hiddenSword }
        const masked = maskEquipmentSlots(equipment, viewer)
        expect(masked).toBeTruthy()
        expect((masked as any).rightHand).toBeTruthy()
        expect((masked as any).rightHand.name).toBe('[HIDDEN]')
        expect((masked as any).rightHand.description).toBe('[HIDDEN]')
    })

    it('nulls hidden slot when nullIfNotViewable is true', () => {
        const equipment = { rightHand: hiddenSword }
        const masked = maskEquipmentSlots(equipment, viewer, { nullIfNotViewable: true })
        expect(masked).toBeTruthy()
        expect((masked as any).rightHand).toBeNull()
    })
})
