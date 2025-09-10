// Utility to mask descriptive string fields when an entity is HIDDEN and
// the viewer is not privileged (not owner, not MODERATOR/ADMIN).
// Simplicity rule: a shared allow-list of descriptive fields common across entities.

import type { AuthenticatedUser } from '@/features/auth'

const HIDDEN_SENTINEL = '[HIDDEN]'

// Shared descriptive fields (keep minimal; extend cautiously)
const DESCRIPTIVE_FIELDS: ReadonlyArray<string> = ['name', 'description', 'bio', 'title']

interface BaseVisibleEntity {
    visibility?: string | null
    ownerId?: string | null
    [k: string]: unknown
}

function isPrivileged(user: AuthenticatedUser | undefined, ownerId?: string | null): boolean {
    if (!user) return false
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') return true
    return !!ownerId && ownerId === user.id
}

// Mask a single entity (shallow). Returns same instance if no changes.
export function maskHiddenEntity<T extends BaseVisibleEntity>(
    entity: T | null | undefined,
    user?: AuthenticatedUser
): T | null | undefined {
    if (!entity) return entity
    if (entity.visibility !== 'HIDDEN') return entity
    if (isPrivileged(user, entity.ownerId)) return entity

    let clone: Record<string, unknown> | null = null
    for (const field of DESCRIPTIVE_FIELDS) {
        const value = entity[field]
        if (typeof value === 'string' || value === null || value === undefined) {
            if (field in entity) {
                if (!clone) clone = { ...entity }
                clone[field] = HIDDEN_SENTINEL
            }
        }
    }
    return clone ? (clone as T) : entity
}

// Convenience for arrays
export function maskHiddenEntities<T extends BaseVisibleEntity>(
    entities: T[] | null | undefined,
    user?: AuthenticatedUser
): T[] | null | undefined {
    if (!entities) return entities
    let changed = false
    const out = entities.map(e => {
        const masked = maskHiddenEntity(e, user)
        if (masked !== e) changed = true
        return masked as T
    })
    return changed ? out : entities
}

// Equipment slot helper: accepts an object whose properties may be item-like entities
export function maskEquipmentSlots<T extends Record<string, unknown>>(
    equipment: T | null | undefined,
    user?: AuthenticatedUser,
    options?: { nullIfNotViewable?: boolean }
): T | null | undefined {
    if (!equipment) return equipment
    const slotKeys = [
        'head',
        'face',
        'chest',
        'legs',
        'feet',
        'hands',
        'rightHand',
        'leftHand',
        'rightRing',
        'leftRing',
        'amulet',
        'belt',
        'backpack',
        'cloak',
    ] as const
    let clone: Record<string, unknown> | null = null
    const source = equipment as Record<string, unknown>
    for (const key of slotKeys) {
        const val = source[key]
        if (val && typeof val === 'object') {
            const masked = maskHiddenEntity(val as BaseVisibleEntity, user)
            if (masked !== val) {
                if (!clone) clone = { ...source }
                // If not viewable at all and option set, null out; else apply masked value
                if (options?.nullIfNotViewable && masked && typeof masked === 'object') {
                    const { visibility: vis, ownerId } = masked as BaseVisibleEntity
                    // If the original was hidden and viewer not privileged, maskHiddenEntity returns a clone with sentinel
                    // We still keep it masked unless explicit nulling desired and canView=false.
                    // Determine visibility using canView semantics loosely: if hidden and not privileged, null it.
                    if (vis === 'HIDDEN' && !isPrivileged(user, ownerId)) {
                        clone[key] = null
                    } else {
                        clone[key] = masked
                    }
                } else {
                    clone[key] = masked
                }
            }
        }
    }
    return clone ? (clone as T) : equipment
}

export const hiddenMasking = {
    maskHiddenEntity,
    maskHiddenEntities,
    maskEquipmentSlots,
    DESCRIPTIVE_FIELDS,
    HIDDEN_SENTINEL,
} as const
