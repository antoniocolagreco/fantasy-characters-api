/* Utility types and helpers for seeding */
import { type PrismaClient, type Prisma, Rarity, Slot, Visibility } from '@prisma/client'

import { generateUUIDv7 } from '@/shared/utils'

export interface ItemSpec {
    name: string
    slot: Slot
    rarity?: Rarity
    requiredLevel?: number
    description?: string
    damage?: number
    defense?: number
    bonuses?: Partial<
        Record<
            | 'bonusHealth'
            | 'bonusMana'
            | 'bonusStamina'
            | 'bonusStrength'
            | 'bonusConstitution'
            | 'bonusDexterity'
            | 'bonusIntelligence'
            | 'bonusWisdom'
            | 'bonusCharisma',
            number
        >
    >
    value?: number
    weight?: number
}

export function buildItemData(spec: ItemSpec, ownerId: string): Prisma.ItemCreateInput {
    const base: Prisma.ItemCreateInput = {
        id: generateUUIDv7(),
        name: spec.name,
        description: spec.description ?? `${spec.name} item`,
        rarity: spec.rarity ?? Rarity.COMMON,
        slot: spec.slot,
        requiredLevel: spec.requiredLevel ?? 1,
        damage: spec.damage ?? null,
        defense: spec.defense ?? null,
        value: spec.value ?? 0,
        weight: spec.weight ?? 1,
        visibility: Visibility.PUBLIC,
        owner: { connect: { id: ownerId } },
        ...Object.fromEntries(Object.entries(spec.bonuses ?? {}).map(([k, v]) => [k, v ?? null])),
    }
    return base
}

// Deterministic pseudo-random generator for reproducible seeds
export function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function randomFrom<T>(rand: () => number, arr: [T, ...T[]]): T {
    const idx = Math.floor(rand() * arr.length)
    const value = arr[idx]
    if (value === undefined) {
        // Fallback: return first element (array guaranteed non-empty by tuple type)
        return arr[0]
    }
    return value
}

export async function bulkCreateItems(prisma: PrismaClient, ownerId: string, specs: ItemSpec[]) {
    return Promise.all(specs.map(s => prisma.item.create({ data: buildItemData(s, ownerId) })))
}

export type SlotItemMap = Record<Slot, string[]>

export function buildSlotItemMap(items: { id: string; slot: Slot }[]): SlotItemMap {
    const initial: SlotItemMap = {
        NONE: [],
        HEAD: [],
        FACE: [],
        CHEST: [],
        LEGS: [],
        FEET: [],
        HANDS: [],
        ONE_HAND: [],
        TWO_HANDS: [],
        RING: [],
        AMULET: [],
        BELT: [],
        BACKPACK: [],
        CLOAK: [],
    }
    for (const it of items) initial[it.slot].push(it.id)
    return initial
}

export function pickFirst(map: SlotItemMap, slot: Slot): string | undefined {
    return map[slot][0]
}
