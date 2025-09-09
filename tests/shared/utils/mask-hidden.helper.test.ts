import { describe, it, expect } from 'vitest'

import { hiddenMasking } from '@/shared/utils/mask-hidden.helper'

// Helper to build minimal AuthenticatedUser-compatible object
function user(id: string, role: 'USER' | 'MODERATOR' | 'ADMIN') {
    return { id, role, email: `${id}@test.dev` }
}

describe('mask-hidden.helper', () => {
    const base = (overrides: Record<string, unknown> = {}) => ({
        id: 'x',
        name: 'Secret Name',
        description: 'Secret Desc',
        visibility: 'HIDDEN',
        ownerId: 'owner-1',
        ...overrides,
    })

    it('returns same entity when not hidden', () => {
        const entity = base({ visibility: 'PUBLIC' })
        const masked = hiddenMasking.maskHiddenEntity(entity, undefined)
        expect(masked).toBe(entity)
    })

    it('masks descriptive fields for anonymous viewer', () => {
        const entity = base()
        const masked = hiddenMasking.maskHiddenEntity(entity, undefined)
        expect(masked).not.toBe(entity)
        expect(masked?.name).toBe('[HIDDEN]')
        expect(masked?.description).toBe('[HIDDEN]')
    })

    it('does not mask for owner', () => {
        const entity = base()
        const masked = hiddenMasking.maskHiddenEntity(entity, user('owner-1', 'USER'))
        expect(masked).toBe(entity)
    })

    it('does not mask for moderator', () => {
        const entity = base()
        const masked = hiddenMasking.maskHiddenEntity(entity, user('mod', 'MODERATOR'))
        expect(masked).toBe(entity)
    })

    it('masks arrays efficiently (returns original if no change)', () => {
        const arr = [base({ visibility: 'PUBLIC' }), base({ visibility: 'PUBLIC' })]
        const masked = hiddenMasking.maskHiddenEntities(arr, undefined)
        expect(masked).toBe(arr)
    })

    it('masks arrays with mix preserving order', () => {
        const arr = [base(), base({ visibility: 'PUBLIC' })]
        const masked = hiddenMasking.maskHiddenEntities(arr, undefined)!
        expect(masked).not.toBe(arr)
        expect(masked[0]!.name).toBe('[HIDDEN]')
        expect(masked[1]!.name).not.toBe('[HIDDEN]')
    })

    it('masks equipment slot entities', () => {
        const equipment = {
            head: base(),
            chest: base({ visibility: 'PUBLIC' }),
            rightHand: null,
        }
        const masked = hiddenMasking.maskEquipmentSlots(equipment, undefined) as typeof equipment
        expect(masked).not.toBe(equipment)
        expect(masked.head?.name).toBe('[HIDDEN]')
        expect(masked.chest?.name).toBe('Secret Name')
        expect(masked.rightHand).toBeNull()
    })
})
