import { equipmentRepository } from './equipment.repository'
import type { EquipmentUpdateInput, EquipmentParams } from './v1/equipment.schema'

import type { AuthenticatedUser } from '@/features/auth'
import { characterRepository } from '@/features/characters/characters.repository'
import { itemRepository } from '@/features/items/items.repository'
import { err } from '@/shared/errors'
import { canModifyResource, canViewResource } from '@/shared/utils/rbac.helpers'

function assertOwnershipPermission(
    user: AuthenticatedUser | undefined,
    character: { ownerId?: string; ownerRole?: string; visibility?: string }
) {
    if (!canViewResource(user, character)) {
        throw err('RESOURCE_NOT_FOUND', 'Character not found')
    }
    if (!user) {
        throw err('UNAUTHORIZED', 'Login required')
    }
    if (!canModifyResource(user, character)) {
        throw err('FORBIDDEN', 'You do not have permission to modify this equipment')
    }
}

const EMPTY = (characterId: string) => ({
    characterId,
    headId: null,
    faceId: null,
    chestId: null,
    legsId: null,
    feetId: null,
    handsId: null,
    rightHandId: null,
    leftHandId: null,
    rightRingId: null,
    leftRingId: null,
    amuletId: null,
    beltId: null,
    backpackId: null,
    cloakId: null,
})

type MinimalItem = { id: string; slot: string; is2Handed: boolean }

async function validateSlots(payload: EquipmentUpdateInput) {
    if (payload.handsId && (payload.rightHandId || payload.leftHandId)) {
        throw err('VALIDATION_ERROR', 'Cannot combine handsId with individual hand slots')
    }
    if (payload.rightHandId && payload.leftHandId && payload.rightHandId === payload.leftHandId) {
        throw err('VALIDATION_ERROR', 'Cannot equip the same item in both hands')
    }

    // Collect unique item IDs from payload
    const slotIdPairs: [keyof EquipmentUpdateInput, string][] = []
    const slotKeys: (keyof EquipmentUpdateInput)[] = [
        'headId',
        'faceId',
        'chestId',
        'legsId',
        'feetId',
        'handsId',
        'rightHandId',
        'leftHandId',
        'rightRingId',
        'leftRingId',
        'amuletId',
        'beltId',
        'backpackId',
        'cloakId',
    ]
    for (const k of slotKeys) {
        const val = payload[k]
        if (typeof val === 'string') slotIdPairs.push([k, val])
    }
    if (slotIdPairs.length === 0) return payload

    // Fetch all items in parallel (dedupe first)
    const uniqueIds = [...new Set(slotIdPairs.map(([, id]) => id))]
    const fetched = await Promise.all(uniqueIds.map(id => itemRepository.findById(id)))
    const itemById = new Map<string, MinimalItem>()
    fetched.forEach((item, idx) => {
        const sourceId = uniqueIds[idx] as string | undefined
        if (!sourceId || !item) {
            throw err('VALIDATION_ERROR', `Item not found: ${sourceId || 'unknown'}`)
        }
        itemById.set(sourceId, { id: item.id, slot: item.slot, is2Handed: !!item.is2Handed })
    })

    const expected: Record<string, string[]> = {
        headId: ['HEAD'],
        faceId: ['FACE'],
        chestId: ['CHEST'],
        legsId: ['LEGS'],
        feetId: ['FEET'],
        handsId: ['TWO_HANDS'],
        rightHandId: ['ONE_HAND'],
        leftHandId: ['ONE_HAND'],
        rightRingId: ['RING'],
        leftRingId: ['RING'],
        amuletId: ['AMULET'],
        beltId: ['BELT'],
        backpackId: ['BACKPACK'],
        cloakId: ['CLOAK'],
    }

    // Two-hand conflict: if a two-handed item is placed in one hand, reject
    const checkTwoHandMisuse = (item: MinimalItem, slot: string) => {
        if (
            (item.slot === 'TWO_HANDS' || item.is2Handed) &&
            (slot === 'rightHandId' || slot === 'leftHandId')
        ) {
            throw err(
                'VALIDATION_ERROR',
                'Two-handed item cannot be equipped in a single hand slot'
            )
        }
        if (slot === 'handsId' && !(item.slot === 'TWO_HANDS' || item.is2Handed)) {
            throw err('VALIDATION_ERROR', 'handsId requires a two-handed item')
        }
    }

    for (const [slotKey, id] of slotIdPairs) {
        const item = itemById.get(id)
        if (!item) throw err('VALIDATION_ERROR', `Item not found: ${id}`)
        const allowed = expected[slotKey as string]
        if (allowed && !allowed.includes(item.slot)) {
            // Special case: allowing two-handed item in handsId already enforced above
            throw err(
                'VALIDATION_ERROR',
                `Item ${id} with slot ${item.slot} cannot be equipped in ${slotKey}`
            )
        }
        checkTwoHandMisuse(item, slotKey as string)
    }

    // If both right and left hand items present ensure neither is two-handed (already checked individually) but also ensure not mixing with handsId (already early)
    return payload
}

export const equipmentService = {
    async getEquipment(params: EquipmentParams, user?: AuthenticatedUser) {
        const charWithRole = await characterRepository.findByIdWithOwnerRole(params.id)
        if (!charWithRole) {
            throw err('RESOURCE_NOT_FOUND', 'Character not found')
        }
        const character = { ...charWithRole.character, ownerRole: charWithRole.ownerRole }
        if (!canViewResource(user, character)) {
            throw err('RESOURCE_NOT_FOUND', 'Character not found')
        }
        const record = await equipmentRepository.findByCharacterId(params.id)
        return record || EMPTY(params.id)
    },
    async updateEquipment(
        params: EquipmentParams,
        payload: EquipmentUpdateInput,
        user?: AuthenticatedUser
    ) {
        const charWithRole = await characterRepository.findByIdWithOwnerRole(params.id)
        if (!charWithRole) {
            throw err('RESOURCE_NOT_FOUND', 'Character not found')
        }
        const character = { ...charWithRole.character, ownerRole: charWithRole.ownerRole }
        assertOwnershipPermission(user, character)
        const validated = await validateSlots(payload)
        const updated = await equipmentRepository.upsert(params.id, validated)
        return updated
    },
    async getStats(user?: AuthenticatedUser) {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
            throw err('FORBIDDEN', 'You do not have permission to view equipment statistics')
        }
        return equipmentRepository.getStats()
    },
}
