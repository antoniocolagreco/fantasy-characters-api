import { faker } from '@faker-js/faker'
import type {
    User,
    Character,
    Item,
    Race,
    Archetype,
    Skill,
    Perk,
    Tag,
    Image,
} from '@prisma/client'

// Set a seed for reproducible test data
faker.seed(123)

// Type for test data generation options
type TestDataOptions = {
    count?: number | undefined
    locale?: string
}

// Generate test users
export function generateTestUsers(
    options: TestDataOptions = {}
): Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] {
    const { count = 10 } = options

    return Array.from({ length: count }, () => ({
        email: faker.internet.email(),
        passwordHash: '$argon2id$v=19$m=4096,t=3,p=1$dGVzdGluZw$0a1e1e1e1e1e1e1e1e1e1e',
        role: faker.helpers.arrayElement(['USER', 'MODERATOR', 'ADMIN'] as const),
        isEmailVerified: faker.datatype.boolean(),
        isActive: true,
        name: faker.person.fullName(),
        bio: faker.lorem.sentence(),
        oauthProvider:
            faker.helpers.maybe(() => faker.helpers.arrayElement(['google', 'github']), {
                probability: 0.3,
            }) ?? null,
        oauthId: faker.helpers.maybe(() => faker.string.uuid(), { probability: 0.3 }) ?? null,
        lastPasswordChange: faker.date.recent(),
        lastLogin: faker.date.recent(),
        isBanned: false,
        banReason: null,
        bannedUntil: null,
        bannedById: null,
        profilePictureId: null,
    }))
}

// Generate test races
export function generateTestRaces(
    options: TestDataOptions = {}
): Omit<Race, 'id' | 'createdAt' | 'updatedAt'>[] {
    const { count = 10 } = options

    const raceNames = [
        'Human',
        'Elf',
        'Dwarf',
        'Halfling',
        'Orc',
        'Tiefling',
        'Dragonborn',
        'Gnome',
        'Half-Elf',
        'Half-Orc',
    ]

    return Array.from({ length: Math.min(count, raceNames.length) }, (_, i) => ({
        name: raceNames[i] ?? `Race ${i + 1}`,
        description: faker.lorem.paragraph(),
        healthModifier: faker.number.int({ min: 80, max: 120 }),
        manaModifier: faker.number.int({ min: 80, max: 120 }),
        staminaModifier: faker.number.int({ min: 80, max: 120 }),
        strengthModifier: faker.number.int({ min: 8, max: 12 }),
        constitutionModifier: faker.number.int({ min: 8, max: 12 }),
        dexterityModifier: faker.number.int({ min: 8, max: 12 }),
        intelligenceModifier: faker.number.int({ min: 8, max: 12 }),
        wisdomModifier: faker.number.int({ min: 8, max: 12 }),
        charismaModifier: faker.number.int({ min: 8, max: 12 }),
        ownerId: null,
        imageId: null,
        visibility: 'PUBLIC' as const,
    }))
}

// Generate test archetypes
export function generateTestArchetypes(
    options: TestDataOptions = {}
): Omit<Archetype, 'id' | 'createdAt' | 'updatedAt'>[] {
    const { count = 10 } = options

    const archetypeNames = [
        'Warrior',
        'Wizard',
        'Rogue',
        'Cleric',
        'Ranger',
        'Paladin',
        'Barbarian',
        'Sorcerer',
        'Bard',
        'Warlock',
    ]

    return Array.from({ length: Math.min(count, archetypeNames.length) }, (_, i) => ({
        name: archetypeNames[i] ?? `Archetype ${i + 1}`,
        description: faker.lorem.paragraph(),
        imageId: null,
        ownerId: null,
        visibility: 'PUBLIC' as const,
    }))
}

// Generate test skills
export function generateTestSkills(
    options: TestDataOptions = {}
): Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>[] {
    const { count = 20 } = options

    const skillTypes = [
        'Swordsmanship',
        'Archery',
        'Magic Missile',
        'Healing',
        'Stealth',
        'Lockpicking',
        'Fireball',
        'Shield Bash',
        'Lightning Bolt',
        'Backstab',
        'Divine Grace',
        'Eagle Eye',
        'Fire Wall',
        'Ice Spike',
        'Heal All',
        'Mana Burst',
        'Shadow Step',
        'Power Strike',
        'Shield Wall',
        'Thunder Storm',
    ]

    return Array.from({ length: count }, (_, i) => ({
        name: skillTypes[i] ?? `Skill ${i + 1}`,
        description: faker.lorem.paragraph(),
        requiredLevel: faker.number.int({ min: 1, max: 50 }),
        imageId: null,
        ownerId: null,
        visibility: 'PUBLIC' as const,
    }))
}

// Generate test perks
export function generateTestPerks(
    options: TestDataOptions = {}
): Omit<Perk, 'id' | 'createdAt' | 'updatedAt'>[] {
    const { count = 15 } = options

    const perkNames = [
        'Lucky',
        'Strong Back',
        'Eagle Eye',
        'Quick Reflexes',
        'Mana Efficiency',
        'Combat Veteran',
        'Iron Will',
        'Fleet Footed',
        'Keen Mind',
        'Lucky Break',
        'Swift Strike',
        'Magic Resist',
        'Dodge Master',
        'Critical Hit',
        'Spell Power',
    ]

    return Array.from({ length: count }, (_, i) => ({
        name: perkNames[i] ?? `Perk ${i + 1}`,
        description: faker.lorem.paragraph(),
        requiredLevel: faker.number.int({ min: 0, max: 25 }),
        imageId: null,
        ownerId: null,
        visibility: 'PUBLIC' as const,
    }))
}

// Generate test items
export function generateTestItems(
    options: TestDataOptions = {}
): Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[] {
    const { count = 30 } = options

    const itemTypes = [
        'Sword',
        'Shield',
        'Helmet',
        'Armor',
        'Boots',
        'Ring',
        'Amulet',
        'Bow',
        'Staff',
        'Dagger',
    ]
    const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const
    const slots = [
        'HEAD',
        'CHEST',
        'LEGS',
        'FEET',
        'HANDS',
        'ONE_HAND',
        'TWO_HANDS',
        'RING',
        'AMULET',
        'NONE',
    ] as const

    return Array.from({ length: count }, (_, i) => ({
        name: `${faker.lorem.word()} ${itemTypes[i % itemTypes.length]}`,
        description: faker.lorem.paragraph(),
        bonusHealth:
            faker.helpers.maybe(() => faker.number.int({ min: 5, max: 50 }), {
                probability: 0.3,
            }) ?? null,
        bonusMana:
            faker.helpers.maybe(() => faker.number.int({ min: 5, max: 50 }), {
                probability: 0.3,
            }) ?? null,
        bonusStamina:
            faker.helpers.maybe(() => faker.number.int({ min: 5, max: 50 }), {
                probability: 0.3,
            }) ?? null,
        bonusStrength:
            faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }), {
                probability: 0.4,
            }) ?? null,
        bonusConstitution:
            faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }), {
                probability: 0.4,
            }) ?? null,
        bonusDexterity:
            faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }), {
                probability: 0.4,
            }) ?? null,
        bonusIntelligence:
            faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }), {
                probability: 0.4,
            }) ?? null,
        bonusWisdom:
            faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }), {
                probability: 0.4,
            }) ?? null,
        bonusCharisma:
            faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }), {
                probability: 0.4,
            }) ?? null,
        damage:
            faker.helpers.maybe(() => faker.number.int({ min: 10, max: 100 }), {
                probability: 0.5,
            }) ?? null,
        defense:
            faker.helpers.maybe(() => faker.number.int({ min: 5, max: 50 }), {
                probability: 0.5,
            }) ?? null,
        rarity: faker.helpers.arrayElement(rarities),
        slot: faker.helpers.arrayElement(slots),
        requiredLevel: faker.number.int({ min: 1, max: 60 }),
        weight: faker.number.float({ min: 0.1, max: 20, fractionDigits: 1 }),
        durability: faker.number.int({ min: 50, max: 100 }),
        maxDurability: 100,
        value: faker.number.int({ min: 10, max: 1000 }),
        is2Handed: faker.datatype.boolean(),
        isThrowable: faker.datatype.boolean(),
        isConsumable: faker.datatype.boolean(),
        isQuestItem: faker.datatype.boolean(),
        isTradeable: faker.datatype.boolean(),
        ownerId: null,
        imageId: null,
        visibility: 'PUBLIC' as const,
    }))
}

// Generate test characters
export function generateTestCharacters(
    userIds: string[],
    raceIds: string[],
    archetypeIds: string[],
    options: TestDataOptions = {}
): Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[] {
    const { count = 20 } = options

    return Array.from({ length: count }, () => ({
        name: faker.person.firstName(),
        sex: faker.helpers.arrayElement(['MALE', 'FEMALE'] as const),
        age: faker.number.int({ min: 18, max: 100 }),
        description: faker.lorem.paragraph(),
        level: faker.number.int({ min: 1, max: 100 }),
        experience: faker.number.int({ min: 0, max: 1000000 }),
        imageId: null,
        ownerId: faker.helpers.arrayElement(userIds),
        health: faker.number.int({ min: 50, max: 200 }),
        mana: faker.number.int({ min: 50, max: 200 }),
        stamina: faker.number.int({ min: 50, max: 200 }),
        strength: faker.number.int({ min: 8, max: 20 }),
        constitution: faker.number.int({ min: 8, max: 20 }),
        dexterity: faker.number.int({ min: 8, max: 20 }),
        intelligence: faker.number.int({ min: 8, max: 20 }),
        wisdom: faker.number.int({ min: 8, max: 20 }),
        charisma: faker.number.int({ min: 8, max: 20 }),
        raceId: faker.helpers.arrayElement(raceIds),
        archetypeId: faker.helpers.arrayElement(archetypeIds),
        visibility: faker.helpers.arrayElement(['PUBLIC', 'PRIVATE'] as const),
    }))
}

// Generate test tags
export function generateTestTags(
    options: TestDataOptions = {}
): Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>[] {
    const { count = 25 } = options

    const tagNames = [
        'Combat',
        'Magic',
        'Healing',
        'Stealth',
        'Social',
        'Crafting',
        'Exploration',
        'Defense',
        'Offense',
        'Support',
        'Fire',
        'Ice',
        'Lightning',
        'Dark',
        'Light',
        'Nature',
        'Arcane',
        'Divine',
        'Physical',
        'Mental',
        'Ranged',
        'Melee',
        'Area Effect',
        'Single Target',
        'Buff',
    ]

    return Array.from({ length: count }, (_, i) => ({
        name: tagNames[i] ?? `Tag ${i + 1}`,
        description: faker.lorem.sentence(),
        ownerId: null,
        visibility: 'PUBLIC' as const,
    }))
}

// Helper to generate test images (metadata only, no blob)
export function generateTestImageMetadata(
    options: TestDataOptions = {}
): Omit<Image, 'id' | 'createdAt' | 'updatedAt' | 'blob'>[] {
    const { count = 10 } = options

    return Array.from({ length: count }, () => ({
        description: faker.lorem.sentence(),
        size: faker.number.int({ min: 1000, max: 5000000 }),
        mimeType: 'image/webp',
        width: faker.helpers.arrayElement([350, 512, 1024]),
        height: faker.helpers.arrayElement([450, 512, 1024]),
        ownerId: null,
        visibility: 'PUBLIC' as const,
    }))
}

// Utility to generate a complete test dataset
export function generateCompleteTestDataset(
    options: {
        users?: number
        races?: number
        archetypes?: number
        skills?: number
        perks?: number
        items?: number
        characters?: number
        tags?: number
        images?: number
    } = {}
) {
    return {
        users: generateTestUsers({ count: options.users }),
        races: generateTestRaces({ count: options.races }),
        archetypes: generateTestArchetypes({ count: options.archetypes }),
        skills: generateTestSkills({ count: options.skills }),
        perks: generateTestPerks({ count: options.perks }),
        items: generateTestItems({ count: options.items }),
        tags: generateTestTags({ count: options.tags }),
        imageMetadata: generateTestImageMetadata({ count: options.images }),
        // Note: characters need to be generated after users, races, and archetypes are created
        // Use generateTestCharacters() separately with actual IDs
    }
}
