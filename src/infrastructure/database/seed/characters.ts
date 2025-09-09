import { type PrismaClient, Visibility, Sex, Slot } from '@prisma/client'

import { pickFirst, type SlotItemMap } from './seed-utils'

import { generateUUIDv7 } from '@/shared/utils'

interface IdOnly {
    id: string
}
interface CharactersArgs {
    adminId: string
    images: IdOnly[]
    races: IdOnly[]
    archetypes: IdOnly[]
    skills: IdOnly[]
    perks: IdOnly[]
    tags: IdOnly[]
    items: IdOnly[]
    slotMap: SlotItemMap
}

export async function seedCharacters(prisma: PrismaClient, args: CharactersArgs) {
    const { adminId, images, races, archetypes } = args
    function safeGet<T>(arr: T[], idx: number): T {
        if (arr.length === 0) throw new Error('Expected non-empty array in seed')
        const el = arr[idx % arr.length]
        if (!el) throw new Error('Failed to resolve element in seed')
        return el
    }
    const makeChar = (name: string, raceIdx: number, archIdx: number, lvl: number) => {
        const race = safeGet(races, raceIdx)
        const archetype = safeGet(archetypes, archIdx)
        return {
            id: generateUUIDv7(),
            name,
            sex: lvl % 2 === 0 ? Sex.FEMALE : Sex.MALE,
            age: 18 + lvl * 2,
            level: lvl,
            experience: lvl * lvl * 100,
            ownerId: adminId,
            raceId: race.id,
            archetypeId: archetype.id,
            imageId: images[(raceIdx + archIdx) % images.length]?.id ?? null,
            visibility: Visibility.PUBLIC,
        }
    }

    const characterDefs = [
        makeChar('Aria Lightblade', 0, 0, 5),
        makeChar('Eldarian Starweaver', 1, 1, 8),
        makeChar('Thorin Ironforge', 2, 3, 6),
        makeChar('Pippin Nimblefingers', 3, 2, 4),
    ]

    // Add extra generated characters to showcase variety
    for (let i = 1; i <= 6; i++) {
        characterDefs.push(
            makeChar(`Generated Hero ${i}`, i % races.length, i % archetypes.length, 2 + (i % 9))
        )
    }

    const characters = await prisma.$transaction(
        characterDefs.map(d => prisma.character.create({ data: d }))
    )

    // Equipment creation – ensure each character has something in every slot if available
    const equipPromises = characters.map(c => {
        const slotFieldMap: [Slot, string][] = [
            [Slot.HEAD, 'headId'],
            [Slot.FACE, 'faceId'],
            [Slot.CHEST, 'chestId'],
            [Slot.LEGS, 'legsId'],
            [Slot.FEET, 'feetId'],
            [Slot.HANDS, 'handsId'],
            [Slot.ONE_HAND, 'rightHandId'],
            [Slot.ONE_HAND, 'leftHandId'],
            [Slot.RING, 'rightRingId'],
            [Slot.RING, 'leftRingId'],
            [Slot.AMULET, 'amuletId'],
            [Slot.BELT, 'beltId'],
            [Slot.BACKPACK, 'backpackId'],
            [Slot.CLOAK, 'cloakId'],
        ]
        const equipmentData: {
            id: string
            characterId: string
            [k: string]: string | null | undefined
        } = {
            id: generateUUIDv7(),
            characterId: c.id,
        }
        for (const [slot, field] of slotFieldMap) {
            const itemId = pickFirst(args.slotMap, slot)
            if (itemId) equipmentData[field] = itemId
        }
        return prisma.equipment.create({ data: equipmentData })
    })
    await Promise.all(equipPromises)

    // Assign some inventory rows (first 30 items each 1 qty)
    const invItems = args.items.slice(0, 30)
    const inventoryRows = characters.flatMap(c =>
        invItems.map(it => ({ characterId: c.id, itemId: it.id, quantity: 1 }))
    )
    await prisma.characterInventory.createMany({ data: inventoryRows, skipDuplicates: true })

    return characters
}
