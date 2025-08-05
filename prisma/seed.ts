import {
    PrismaClient,
    Role,
    Rarity,
    Slot,
    User,
    Race,
    Archetype,
    Skill,
    Perk,
    Tag,
    Item,
    Character
} from '@prisma/client'

const prisma = new PrismaClient()

// Sample data following functional programming principles
const sampleUsers = [
    {
        email: 'admin@fantasy-api.com',
        passwordHash: '$2b$12$K.PrQg7Cz7C7v6YJW4k.VeHH.bOZLfMZW4KZs4J9ZYc2K.HZJ0x/2', // "admin123"
        role: Role.ADMIN,
        displayName: 'System Administrator',
        bio: 'System administrator for the Fantasy Character API',
        isEmailVerified: true,
        isActive: true
    },
    {
        email: 'player1@fantasy-api.com',
        passwordHash: '$2b$12$K.PrQg7Cz7C7v6YJW4k.VeHH.bOZLfMZW4KZs4J9ZYc2K.HZJ0x/3', // "player123"
        role: Role.USER,
        displayName: 'Aragorn Ranger',
        bio: 'A skilled ranger from the northern lands',
        isEmailVerified: true,
        isActive: true
    }
]

const sampleRaces = [
    {
        name: 'Human',
        description: 'Versatile and ambitious, humans are the most common race in fantasy worlds.',
        healthModifier: 100,
        manaModifier: 100,
        staminaModifier: 100,
        strengthModifier: 10,
        constitutionModifier: 10,
        dexterityModifier: 10,
        intelligenceModifier: 10,
        wisdomModifier: 10,
        charismaModifier: 10
    },
    {
        name: 'Elf',
        description: 'Graceful and long-lived, elves are known for their magic and agility.',
        healthModifier: 90,
        manaModifier: 120,
        staminaModifier: 110,
        strengthModifier: 8,
        constitutionModifier: 8,
        dexterityModifier: 12,
        intelligenceModifier: 12,
        wisdomModifier: 11,
        charismaModifier: 11
    },
    {
        name: 'Dwarf',
        description: 'Hardy and resilient, dwarves are master craftsmen and warriors.',
        healthModifier: 120,
        manaModifier: 80,
        staminaModifier: 90,
        strengthModifier: 12,
        constitutionModifier: 13,
        dexterityModifier: 8,
        intelligenceModifier: 9,
        wisdomModifier: 11,
        charismaModifier: 8
    },
    {
        name: 'Halfling',
        description: 'Small but brave, halflings are known for their luck and nimbleness.',
        healthModifier: 85,
        manaModifier: 95,
        staminaModifier: 120,
        strengthModifier: 7,
        constitutionModifier: 9,
        dexterityModifier: 13,
        intelligenceModifier: 10,
        wisdomModifier: 12,
        charismaModifier: 11
    }
]

const sampleArchetypes = [
    {
        name: 'Warrior',
        description: 'Masters of combat, warriors excel in physical confrontation and battlefield tactics.'
    },
    {
        name: 'Wizard',
        description: 'Students of arcane magic, wizards wield powerful spells and ancient knowledge.'
    },
    {
        name: 'Cleric',
        description: 'Divine spellcasters who serve gods and heal allies while smiting enemies.'
    }
]

const sampleSkills = [
    {
        name: 'Sword Mastery',
        description: 'Expertise in wielding various types of swords with deadly precision.',
        requiredLevel: 1
    },
    {
        name: 'Fireball',
        description: 'Launch a ball of fire that explodes on impact, dealing area damage.',
        requiredLevel: 3
    },
    {
        name: 'Healing Light',
        description: 'Channel divine energy to restore health to yourself or allies.',
        requiredLevel: 1
    },
    {
        name: 'Stealth',
        description: 'Move unseen and unheard, perfect for reconnaissance and surprise attacks.',
        requiredLevel: 2
    }
]

const samplePerks = [
    {
        name: 'Iron Will',
        description: 'Mental fortitude that provides resistance to mind-affecting spells.',
        requiredLevel: 5
    },
    {
        name: 'Lucky',
        description: 'Fortune favors you, providing bonus chances for critical successes.',
        requiredLevel: 0
    },
    {
        name: 'Tough',
        description: 'Additional hit points and resistance to physical damage.',
        requiredLevel: 3
    }
]

const sampleTags = [
    { name: 'Combat', description: 'Related to fighting and warfare' },
    { name: 'Magic', description: 'Related to arcane or divine magic' },
    { name: 'Stealth', description: 'Related to sneaking and hiding' },
    { name: 'Social', description: 'Related to interaction and persuasion' },
    { name: 'Utility', description: 'General purpose and helpful abilities' }
]

const sampleItems = [
    {
        name: 'Iron Sword',
        description: 'A well-crafted iron sword, reliable and sharp.',
        rarity: Rarity.COMMON,
        slot: Slot.MAIN_HAND,
        damage: 8,
        requiredLevel: 1,
        weight: 3.0,
        value: 50,
        isWeapon: true,
        isTradeable: true
    },
    {
        name: 'Leather Armor',
        description: 'Flexible leather armor that provides basic protection.',
        rarity: Rarity.COMMON,
        slot: Slot.CHEST,
        defense: 5,
        requiredLevel: 1,
        weight: 8.0,
        value: 75,
        isArmor: true,
        isTradeable: true
    },
    {
        name: 'Healing Potion',
        description: 'A magical potion that restores health when consumed.',
        rarity: Rarity.COMMON,
        slot: Slot.NONE,
        bonusHealth: 50,
        requiredLevel: 1,
        weight: 0.5,
        value: 25,
        isConsumable: true,
        isTradeable: true
    },
    {
        name: 'Staff of Wisdom',
        description: 'An ancient staff that enhances magical abilities.',
        rarity: Rarity.RARE,
        slot: Slot.MAIN_HAND,
        damage: 5,
        bonusIntelligence: 3,
        bonusWisdom: 2,
        bonusMana: 20,
        requiredLevel: 5,
        weight: 2.0,
        value: 500,
        isWeapon: true,
        is2Handed: true,
        isTradeable: true
    }
]

// Functional approach to seeding
const seedUsers = async (): Promise<User[]> => {
    console.log('Seeding users...')
    const users: User[] = []
    for (const userData of sampleUsers) {
        const user = await prisma.user.create({ data: userData })
        users.push(user)
    }
    return users
}

const seedRaces = async (): Promise<Race[]> => {
    console.log('Seeding races...')
    const races: Race[] = []
    for (const raceData of sampleRaces) {
        const race = await prisma.race.create({ data: raceData })
        races.push(race)
    }
    return races
}

const seedArchetypes = async (): Promise<Archetype[]> => {
    console.log('Seeding archetypes...')
    const archetypes: Archetype[] = []
    for (const archetypeData of sampleArchetypes) {
        const archetype = await prisma.archetype.create({ data: archetypeData })
        archetypes.push(archetype)
    }
    return archetypes
}

const seedSkills = async (): Promise<Skill[]> => {
    console.log('Seeding skills...')
    const skills: Skill[] = []
    for (const skillData of sampleSkills) {
        const skill = await prisma.skill.create({ data: skillData })
        skills.push(skill)
    }
    return skills
}

const seedPerks = async (): Promise<Perk[]> => {
    console.log('Seeding perks...')
    const perks: Perk[] = []
    for (const perkData of samplePerks) {
        const perk = await prisma.perk.create({ data: perkData })
        perks.push(perk)
    }
    return perks
}

const seedTags = async (): Promise<Tag[]> => {
    console.log('Seeding tags...')
    const tags: Tag[] = []
    for (const tagData of sampleTags) {
        const tag = await prisma.tag.create({ data: tagData })
        tags.push(tag)
    }
    return tags
}

const seedItems = async (): Promise<Item[]> => {
    console.log('Seeding items...')
    const items: Item[] = []
    for (const itemData of sampleItems) {
        const item = await prisma.item.create({ data: itemData })
        items.push(item)
    }
    return items
}

const seedCharacters = async (
    users: User[],
    races: Race[],
    archetypes: Archetype[],
    skills: Skill[]
): Promise<Character[]> => {
    console.log('Seeding characters...')

    // Create a sample character for the player user
    const playerUser = users.find((u) => u.role === Role.USER)
    const humanRace = races.find((r) => r.name === 'Human')
    const warriorArchetype = archetypes.find((a) => a.name === 'Warrior')
    const swordMastery = skills.find((s) => s.name === 'Sword Mastery')

    if (playerUser && humanRace && warriorArchetype) {
        const character = await prisma.character.create({
            data: {
                name: 'Thorin Ironshield',
                description: 'A brave human warrior with a noble heart and strong sword arm.',
                level: 3,
                experience: 750,
                health: 120,
                mana: 50,
                stamina: 100,
                strength: 15,
                constitution: 14,
                dexterity: 12,
                intelligence: 10,
                wisdom: 11,
                charisma: 13,
                userId: playerUser.id,
                raceId: humanRace.id,
                archetypeId: warriorArchetype.id,
                isPublic: true,
                skills: swordMastery ? { connect: { id: swordMastery.id } } : undefined
            }
        })
        return [character]
    }
    return []
}

// Main seed function
const seed = async () => {
    try {
        console.log('Starting database seeding...')

        // Clear existing data (development only)
        console.log('Clearing existing data...')
        await prisma.character.deleteMany()
        await prisma.item.deleteMany()
        await prisma.tag.deleteMany()
        await prisma.perk.deleteMany()
        await prisma.skill.deleteMany()
        await prisma.archetype.deleteMany()
        await prisma.race.deleteMany()
        await prisma.image.deleteMany()
        await prisma.user.deleteMany()

        // Seed all entities
        const users = await seedUsers()
        const races = await seedRaces()
        const archetypes = await seedArchetypes()
        const skills = await seedSkills()
        const perks = await seedPerks()
        const tags = await seedTags()
        const items = await seedItems()
        const characters = await seedCharacters(users, races, archetypes, skills)

        console.log('Database seeding completed successfully!')
        console.log(`Created:`)
        console.log(`  - ${users.length} users`)
        console.log(`  - ${races.length} races`)
        console.log(`  - ${archetypes.length} archetypes`)
        console.log(`  - ${skills.length} skills`)
        console.log(`  - ${perks.length} perks`)
        console.log(`  - ${tags.length} tags`)
        console.log(`  - ${items.length} items`)
        console.log(`  - ${characters.length} characters`)
    } catch (error) {
        console.error('Error seeding database:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Execute if run directly
const isMainModule = process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js')

if (isMainModule) {
    seed().catch((error) => {
        console.error(error)
        process.exit(1)
    })
}

export { seed }
