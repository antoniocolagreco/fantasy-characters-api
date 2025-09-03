#!/usr/bin/env tsx
/* eslint-disable no-console */

import { PrismaClient, Rarity, Role, Sex, Slot, Visibility } from '@prisma/client'
import { generateUUIDv7 } from '../../shared/utils/uuid'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting database seed...')

    // Clear existing data in correct order (respecting foreign key constraints)
    await prisma.equipment.deleteMany()
    await prisma.character.deleteMany()
    await prisma.item.deleteMany()
    await prisma.skill.deleteMany()
    await prisma.perk.deleteMany()
    await prisma.archetype.deleteMany()
    await prisma.race.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.image.deleteMany()
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()

    console.log('Creating admin user...')

    // Create admin user
    const adminUser = await prisma.user.create({
        data: {
            id: generateUUIDv7(),
            email: 'admin@fantasy-api.dev',
            passwordHash:
                '$argon2id$v=19$m=65536,t=3,p=4$lBX5nAE8wTVvQD6ZK5bQ7A$7BJ+wOvzYMc6N5RD2eZF9Q4K9MQq2Y8R7F2L3M4V5N6',
            name: 'System Administrator',
            role: Role.USER, // Will be promoted to ADMIN after creation
            isEmailVerified: true,
            isActive: true,
        },
    })

    // Update to ADMIN role (this simulates the business rule that users can't create ADMINs directly)
    await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: Role.ADMIN },
    })

    console.log('Creating sample races...')

    // Create sample races
    const races = await Promise.all([
        prisma.race.create({
            data: {
                id: generateUUIDv7(),
                name: 'Human',
                description:
                    'Versatile and adaptable, humans are the most common race in most fantasy worlds.',
                healthModifier: 100,
                manaModifier: 100,
                staminaModifier: 100,
                strengthModifier: 10,
                constitutionModifier: 10,
                dexterityModifier: 10,
                intelligenceModifier: 10,
                wisdomModifier: 10,
                charismaModifier: 12,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.race.create({
            data: {
                id: generateUUIDv7(),
                name: 'Elf',
                description:
                    'Graceful and long-lived, elves are known for their connection to magic and nature.',
                healthModifier: 90,
                manaModifier: 120,
                staminaModifier: 110,
                strengthModifier: 8,
                constitutionModifier: 8,
                dexterityModifier: 14,
                intelligenceModifier: 12,
                wisdomModifier: 12,
                charismaModifier: 10,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.race.create({
            data: {
                id: generateUUIDv7(),
                name: 'Dwarf',
                description:
                    'Hardy and stout, dwarves are renowned for their craftsmanship and resilience.',
                healthModifier: 120,
                manaModifier: 80,
                staminaModifier: 120,
                strengthModifier: 12,
                constitutionModifier: 14,
                dexterityModifier: 8,
                intelligenceModifier: 10,
                wisdomModifier: 12,
                charismaModifier: 8,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.race.create({
            data: {
                id: generateUUIDv7(),
                name: 'Halfling',
                description:
                    'Small but brave, halflings are known for their luck and love of comfort.',
                healthModifier: 85,
                manaModifier: 95,
                staminaModifier: 100,
                strengthModifier: 6,
                constitutionModifier: 10,
                dexterityModifier: 15,
                intelligenceModifier: 10,
                wisdomModifier: 13,
                charismaModifier: 12,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    console.log('Creating sample archetypes...')

    // Create sample archetypes
    const archetypes = await Promise.all([
        prisma.archetype.create({
            data: {
                id: generateUUIDv7(),
                name: 'Warrior',
                description:
                    'Masters of combat and warfare, warriors excel in physical confrontations.',
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.archetype.create({
            data: {
                id: generateUUIDv7(),
                name: 'Wizard',
                description:
                    'Scholars of the arcane arts, wizards wield powerful magic through study and intellect.',
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.archetype.create({
            data: {
                id: generateUUIDv7(),
                name: 'Rogue',
                description:
                    'Cunning and stealthy, rogues rely on skill and guile to overcome obstacles.',
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.archetype.create({
            data: {
                id: generateUUIDv7(),
                name: 'Cleric',
                description:
                    'Divine spellcasters who channel the power of their deity to heal and protect.',
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    console.log('Creating sample skills...')

    // Create sample skills
    const skills = await Promise.all([
        prisma.skill.create({
            data: {
                id: generateUUIDv7(),
                name: 'Sword Fighting',
                description: 'The art of combat with bladed weapons.',
                requiredLevel: 1,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.skill.create({
            data: {
                id: generateUUIDv7(),
                name: 'Fireball',
                description: 'A powerful evocation spell that creates a fiery explosion.',
                requiredLevel: 3,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.skill.create({
            data: {
                id: generateUUIDv7(),
                name: 'Stealth',
                description: 'The ability to move unseen and unheard.',
                requiredLevel: 1,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.skill.create({
            data: {
                id: generateUUIDv7(),
                name: 'Healing Light',
                description: 'A divine spell that restores health to the wounded.',
                requiredLevel: 1,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    console.log('Creating sample perks...')

    // Create sample perks
    const perks = await Promise.all([
        prisma.perk.create({
            data: {
                id: generateUUIDv7(),
                name: 'Combat Veteran',
                description: 'Years of battle experience provide +2 to all combat rolls.',
                requiredLevel: 5,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.perk.create({
            data: {
                id: generateUUIDv7(),
                name: 'Arcane Scholar',
                description: 'Deep study of magic grants +3 to Intelligence-based skill checks.',
                requiredLevel: 3,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.perk.create({
            data: {
                id: generateUUIDv7(),
                name: 'Lucky',
                description: 'Fortune favors you - reroll any natural 1 once per encounter.',
                requiredLevel: 1,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    console.log('Creating sample items...')

    // Create sample items
    const items = await Promise.all([
        prisma.item.create({
            data: {
                id: generateUUIDv7(),
                name: 'Steel Sword',
                description: 'A well-crafted blade of tempered steel.',
                rarity: Rarity.COMMON,
                slot: Slot.ONE_HAND,
                requiredLevel: 1,
                damage: 8,
                bonusStrength: 1,
                weight: 3.0,
                value: 150,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.item.create({
            data: {
                id: generateUUIDv7(),
                name: 'Wizard Staff',
                description: 'A mystical staff that amplifies magical power.',
                rarity: Rarity.UNCOMMON,
                slot: Slot.TWO_HANDS,
                requiredLevel: 3,
                bonusIntelligence: 2,
                bonusMana: 20,
                weight: 2.5,
                value: 300,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.item.create({
            data: {
                id: generateUUIDv7(),
                name: 'Leather Armor',
                description: 'Flexible armor made from treated leather.',
                rarity: Rarity.COMMON,
                slot: Slot.CHEST,
                requiredLevel: 1,
                defense: 3,
                bonusDexterity: 1,
                weight: 4.0,
                value: 100,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.item.create({
            data: {
                id: generateUUIDv7(),
                name: 'Ring of Protection',
                description: 'A magical ring that wards off harm.',
                rarity: Rarity.RARE,
                slot: Slot.RING,
                requiredLevel: 5,
                defense: 2,
                bonusHealth: 15,
                weight: 0.1,
                value: 800,
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    console.log('Creating sample characters...')

    // Create sample characters
    const characters = await Promise.all([
        prisma.character.create({
            data: {
                id: generateUUIDv7(),
                name: 'Aria Lightblade',
                sex: Sex.FEMALE,
                age: 25,
                description: 'A brave warrior with a strong sense of justice.',
                level: 5,
                experience: 2500,
                health: 120,
                mana: 100,
                stamina: 110,
                strength: 15,
                constitution: 14,
                dexterity: 12,
                intelligence: 10,
                wisdom: 11,
                charisma: 13,
                ownerId: adminUser.id,
                raceId: races[0].id, // Human
                archetypeId: archetypes[0].id, // Warrior
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.character.create({
            data: {
                id: generateUUIDv7(),
                name: 'Eldarian Starweaver',
                sex: Sex.MALE,
                age: 150,
                description: 'An ancient elf wizard with profound knowledge of the arcane.',
                level: 8,
                experience: 6400,
                health: 90,
                mana: 160,
                stamina: 100,
                strength: 8,
                constitution: 10,
                dexterity: 14,
                intelligence: 18,
                wisdom: 16,
                charisma: 12,
                ownerId: adminUser.id,
                raceId: races[1].id, // Elf
                archetypeId: archetypes[1].id, // Wizard
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.character.create({
            data: {
                id: generateUUIDv7(),
                name: 'Thorin Ironforge',
                sex: Sex.MALE,
                age: 95,
                description: 'A stout dwarf cleric devoted to protecting his companions.',
                level: 6,
                experience: 3600,
                health: 140,
                mana: 90,
                stamina: 130,
                strength: 12,
                constitution: 16,
                dexterity: 8,
                intelligence: 11,
                wisdom: 15,
                charisma: 10,
                ownerId: adminUser.id,
                raceId: races[2].id, // Dwarf
                archetypeId: archetypes[3].id, // Cleric
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.character.create({
            data: {
                id: generateUUIDv7(),
                name: 'Pippin Nimblefingers',
                sex: Sex.MALE,
                age: 28,
                description: 'A clever halfling rogue with a talent for finding trouble.',
                level: 4,
                experience: 1800,
                health: 85,
                mana: 95,
                stamina: 100,
                strength: 8,
                constitution: 10,
                dexterity: 17,
                intelligence: 12,
                wisdom: 13,
                charisma: 14,
                ownerId: adminUser.id,
                raceId: races[3].id, // Halfling
                archetypeId: archetypes[2].id, // Rogue
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    console.log('Creating equipment for characters...')

    // Create equipment for first character (Aria)
    await prisma.equipment.create({
        data: {
            id: generateUUIDv7(),
            characterId: characters[0].id,
            rightHandId: items[0].id, // Steel Sword
            chestId: items[2].id, // Leather Armor
        },
    })

    // Create equipment for second character (Eldarian)
    await prisma.equipment.create({
        data: {
            id: generateUUIDv7(),
            characterId: characters[1].id,
            rightHandId: items[1].id, // Wizard Staff
        },
    })

    console.log('Creating tags and relationships...')

    // Create some tags
    const tags = await Promise.all([
        prisma.tag.create({
            data: {
                id: generateUUIDv7(),
                name: 'Combat',
                description: 'Related to fighting and warfare',
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.tag.create({
            data: {
                id: generateUUIDv7(),
                name: 'Magic',
                description: 'Related to spells and arcane arts',
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.tag.create({
            data: {
                id: generateUUIDv7(),
                name: 'Stealth',
                description: 'Related to sneaking and hiding',
                ownerId: adminUser.id,
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    // Associate skills with characters
    await prisma.character.update({
        where: { id: characters[0].id },
        data: {
            skills: { connect: [{ id: skills[0].id }] }, // Sword Fighting
            perks: { connect: [{ id: perks[0].id }] }, // Combat Veteran
            tags: { connect: [{ id: tags[0].id }] }, // Combat
        },
    })

    await prisma.character.update({
        where: { id: characters[1].id },
        data: {
            skills: { connect: [{ id: skills[1].id }] }, // Fireball
            perks: { connect: [{ id: perks[1].id }] }, // Arcane Scholar
            tags: { connect: [{ id: tags[1].id }] }, // Magic
        },
    })

    console.log('Database seed completed successfully!')

    // Log summary
    const userCount = await prisma.user.count()
    const raceCount = await prisma.race.count()
    const archetypeCount = await prisma.archetype.count()
    const skillCount = await prisma.skill.count()
    const perkCount = await prisma.perk.count()
    const itemCount = await prisma.item.count()
    const characterCount = await prisma.character.count()
    const equipmentCount = await prisma.equipment.count()
    const tagCount = await prisma.tag.count()

    console.log(`Created:
    - Users: ${userCount}
    - Races: ${raceCount}
    - Archetypes: ${archetypeCount}
    - Skills: ${skillCount}
    - Perks: ${perkCount}
    - Items: ${itemCount}
    - Characters: ${characterCount}
    - Equipment: ${equipmentCount}
    - Tags: ${tagCount}`)
}

main()
    .catch(error => {
        console.error('Seed failed:', error)
        process.exit(1)
    })
    .finally(() => {
        void prisma.$disconnect()
    })
