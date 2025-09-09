#!/usr/bin/env tsx

// Modular seed orchestrator – heavy logic extracted into /seed/*.ts helpers
// Keeps this file small (SRP) and easier to maintain.

import { PrismaClient } from '@prisma/client'

import { seedAdminUser } from './seed/admin'
import { seedCharacters } from './seed/characters'
import { clearDatabase } from './seed/clear'
import { seedBulkItems } from './seed/items'
import { seedTaxonomy } from './seed/taxonomy'

import { logger } from '@/infrastructure/logging/logger.service'

const prisma = new PrismaClient()

async function main() {
    logger.info('Seeding database (modular)...')
    await clearDatabase(prisma)

    const admin = await seedAdminUser(prisma)
    const { images, races, archetypes, skills, perks, tags } = await seedTaxonomy(prisma, admin.id)
    const { items, slotMap } = await seedBulkItems(prisma, admin.id)
    const characters = await seedCharacters(prisma, {
        adminId: admin.id,
        images,
        races,
        archetypes,
        skills,
        perks,
        tags,
        items,
        slotMap,
    })

    logger.info('Database seed completed.')
    const summary = await Promise.all([
        prisma.user.count().then(v => ['Users', v] as const),
        prisma.image.count().then(v => ['Images', v] as const),
        prisma.race.count().then(v => ['Races', v] as const),
        prisma.archetype.count().then(v => ['Archetypes', v] as const),
        prisma.skill.count().then(v => ['Skills', v] as const),
        prisma.perk.count().then(v => ['Perks', v] as const),
        prisma.item.count().then(v => ['Items', v] as const),
        prisma.character.count().then(v => ['Characters', v] as const),
        prisma.equipment.count().then(v => ['Equipment', v] as const),
        prisma.tag.count().then(v => ['Tags', v] as const),
        prisma.characterInventory.count().then(v => ['InventoryRows', v] as const),
    ])
    for (const [label, value] of summary) logger.info(`${label}: ${value}`)
    logger.info(`Seeded ${characters.length} characters fully equipped.`)
}

main()
    .catch(err => {
        logger.error({ err }, 'Seed failed')
        process.exit(1)
    })
    .finally(() => {
        void prisma.$disconnect()
    })
