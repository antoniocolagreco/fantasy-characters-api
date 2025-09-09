import { type PrismaClient, Rarity, Slot, Visibility } from '@prisma/client'

import { buildSlotItemMap, type SlotItemMap } from './seed-utils'

import { generateUUIDv7 } from '@/shared/utils'

interface CreateItemArgs {
    name: string
    slot: Slot
    rarity: Rarity
    lvl: number
    damage?: number
    defense?: number
    stat?: { key: string; value: number }
}

function makeItemData(ownerId: string, a: CreateItemArgs) {
    return {
        id: generateUUIDv7(),
        name: a.name,
        slot: a.slot,
        rarity: a.rarity,
        requiredLevel: a.lvl,
        damage: a.damage ?? null,
        defense: a.defense ?? null,
        visibility: Visibility.PUBLIC,
        ownerId,
        value: (a.damage ?? 0) * 20 + (a.defense ?? 0) * 25 + a.lvl * 10,
        ...(a.stat ? { [a.stat.key]: a.stat.value } : {}),
    }
}

export async function seedBulkItems(prisma: PrismaClient, ownerId: string) {
    const itemsData: ReturnType<typeof makeItemData>[] = []
    const rarities: Rarity[] = [Rarity.COMMON, Rarity.UNCOMMON, Rarity.RARE, Rarity.EPIC]
    const weaponBases = ['Sword', 'Axe', 'Mace', 'Dagger']
    for (const rarity of rarities) {
        for (let lvl = 1; lvl <= 10; lvl++) {
            for (const base of weaponBases) {
                itemsData.push(
                    makeItemData(ownerId, {
                        name: `${rarity} ${base} Lv${lvl}`,
                        slot: Slot.ONE_HAND,
                        rarity,
                        lvl,
                        damage:
                            4 + lvl * (rarity === Rarity.COMMON ? 1 : rarities.indexOf(rarity) + 1),
                        stat: {
                            key: 'bonusStrength',
                            value: rarities.indexOf(rarity) + lvl,
                        },
                    })
                )
            }
        }
    }
    // Armor pieces
    const armorSlots: Slot[] = [Slot.HEAD, Slot.CHEST, Slot.LEGS, Slot.FEET, Slot.HANDS]
    for (const slot of armorSlots) {
        for (let lvl = 1; lvl <= 8; lvl++) {
            itemsData.push(
                makeItemData(ownerId, {
                    name: `Armor ${Slot[slot]} Lv${lvl}`,
                    slot,
                    rarity: Rarity.COMMON,
                    lvl,
                    defense: 2 + lvl,
                    stat: { key: 'bonusConstitution', value: lvl },
                })
            )
        }
    }
    // Rings & amulets for stats
    for (let i = 1; i <= 20; i++) {
        itemsData.push(
            makeItemData(ownerId, {
                name: `Ring of Vitality ${i}`,
                slot: Slot.RING,
                rarity: Rarity.UNCOMMON,
                lvl: Math.max(1, i % 10),
                stat: { key: 'bonusHealth', value: 5 + i },
            })
        )
        itemsData.push(
            makeItemData(ownerId, {
                name: `Amulet of Focus ${i}`,
                slot: Slot.AMULET,
                rarity: Rarity.UNCOMMON,
                lvl: Math.max(1, i % 10),
                stat: { key: 'bonusIntelligence', value: 3 + i },
            })
        )
    }
    // Belts & cloaks
    for (let i = 1; i <= 10; i++) {
        itemsData.push(
            makeItemData(ownerId, {
                name: `Belt of Fortitude ${i}`,
                slot: Slot.BELT,
                rarity: Rarity.RARE,
                lvl: i,
                stat: { key: 'bonusStamina', value: 4 + i },
            })
        )
        itemsData.push(
            makeItemData(ownerId, {
                name: `Cloak of Shadows ${i}`,
                slot: Slot.CLOAK,
                rarity: Rarity.RARE,
                lvl: i,
                stat: { key: 'bonusDexterity', value: 2 + i },
            })
        )
        itemsData.push(
            makeItemData(ownerId, {
                name: `Backpack ${i}`,
                slot: Slot.BACKPACK,
                rarity: Rarity.COMMON,
                lvl: 1,
            })
        )
    }

    const items = await prisma.$transaction(itemsData.map(d => prisma.item.create({ data: d })))
    const slotMap: SlotItemMap = buildSlotItemMap(items.map(i => ({ id: i.id, slot: i.slot })))
    return { items, slotMap }
}
