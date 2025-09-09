import { Prisma } from '@prisma/client'

import { prisma } from '@/infrastructure/database'
import { generateUUIDv7 } from '@/shared/utils/uuid'

export interface EquipmentSlots {
    headId?: string | null
    faceId?: string | null
    chestId?: string | null
    legsId?: string | null
    feetId?: string | null
    handsId?: string | null
    rightHandId?: string | null
    leftHandId?: string | null
    rightRingId?: string | null
    leftRingId?: string | null
    amuletId?: string | null
    beltId?: string | null
    backpackId?: string | null
    cloakId?: string | null
}

export interface EquipmentRecord extends EquipmentSlots {
    id: string
    characterId: string
    createdAt: string
    updatedAt: string
}

function transform(row: Prisma.EquipmentGetPayload<object>): EquipmentRecord {
    return {
        id: row.id,
        characterId: row.characterId,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        headId: row.headId ?? null,
        faceId: row.faceId ?? null,
        chestId: row.chestId ?? null,
        legsId: row.legsId ?? null,
        feetId: row.feetId ?? null,
        handsId: row.handsId ?? null,
        rightHandId: row.rightHandId ?? null,
        leftHandId: row.leftHandId ?? null,
        rightRingId: row.rightRingId ?? null,
        leftRingId: row.leftRingId ?? null,
        amuletId: row.amuletId ?? null,
        beltId: row.beltId ?? null,
        backpackId: row.backpackId ?? null,
        cloakId: row.cloakId ?? null,
    }
}

export const equipmentRepository = {
    async findByCharacterId(characterId: string): Promise<EquipmentRecord | null> {
        const row = await prisma.equipment.findUnique({ where: { characterId } })
        return row ? transform(row) : null
    },
    async upsert(characterId: string, slots: EquipmentSlots): Promise<EquipmentRecord> {
        const row = await prisma.equipment.upsert({
            where: { characterId },
            create: { id: generateUUIDv7(), characterId, ...slots },
            update: { ...slots },
        })
        return transform(row)
    },
    async getStats() {
        const [
            total,
            head,
            face,
            chest,
            legs,
            feet,
            hands,
            rightHand,
            leftHand,
            rightRing,
            leftRing,
            amulet,
            belt,
            backpack,
            cloak,
        ] = await Promise.all([
            prisma.equipment.count(),
            prisma.equipment.count({ where: { headId: { not: null } } }),
            prisma.equipment.count({ where: { faceId: { not: null } } }),
            prisma.equipment.count({ where: { chestId: { not: null } } }),
            prisma.equipment.count({ where: { legsId: { not: null } } }),
            prisma.equipment.count({ where: { feetId: { not: null } } }),
            prisma.equipment.count({ where: { handsId: { not: null } } }),
            prisma.equipment.count({ where: { rightHandId: { not: null } } }),
            prisma.equipment.count({ where: { leftHandId: { not: null } } }),
            prisma.equipment.count({ where: { rightRingId: { not: null } } }),
            prisma.equipment.count({ where: { leftRingId: { not: null } } }),
            prisma.equipment.count({ where: { amuletId: { not: null } } }),
            prisma.equipment.count({ where: { beltId: { not: null } } }),
            prisma.equipment.count({ where: { backpackId: { not: null } } }),
            prisma.equipment.count({ where: { cloakId: { not: null } } }),
        ])
        return {
            totalEquippedCharacters: total,
            headSlotUsage: head,
            faceSlotUsage: face,
            chestSlotUsage: chest,
            legsSlotUsage: legs,
            feetSlotUsage: feet,
            handsSlotUsage: hands,
            rightHandSlotUsage: rightHand,
            leftHandSlotUsage: leftHand,
            rightRingSlotUsage: rightRing,
            leftRingSlotUsage: leftRing,
            amuletSlotUsage: amulet,
            beltSlotUsage: belt,
            backpackSlotUsage: backpack,
            cloakSlotUsage: cloak,
        }
    },
}
