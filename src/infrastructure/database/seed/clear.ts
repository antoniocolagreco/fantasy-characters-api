import type { PrismaClient } from '@prisma/client'

// Order matters due to FK constraints (Restrict / Cascade)
export async function clearDatabase(prisma: PrismaClient) {
    await prisma.equipment.deleteMany()
    await prisma.characterInventory.deleteMany()
    await prisma.characterSkill.deleteMany()
    await prisma.characterPerk.deleteMany()
    await prisma.character.deleteMany()
    await prisma.itemBonusSkill.deleteMany()
    await prisma.itemBonusPerk.deleteMany()
    await prisma.item.deleteMany()
    await prisma.skill.deleteMany()
    await prisma.perk.deleteMany()
    await prisma.archetypeRequiredRace.deleteMany()
    await prisma.archetypeSkill.deleteMany()
    await prisma.archetype.deleteMany()
    await prisma.raceSkill.deleteMany()
    await prisma.race.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.image.deleteMany()
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()
}
