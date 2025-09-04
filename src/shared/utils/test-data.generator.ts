import { type Prisma } from '@prisma/client'
import { generateUUIDv7 } from './uuid'

// Test data generation utilities for consistent test data across the application

export interface TestDataOptions {
    count?: number
    overrides?: Record<string, unknown>
}

/**
 * Generate test user data
 */
export function generateTestUser(
    overrides: Partial<Prisma.UserCreateInput> = {}
): Prisma.UserCreateInput {
    const id = generateUUIDv7()
    const randomSuffix = Math.random().toString(36).substring(2, 8)

    return {
        id,
        email: `user-${randomSuffix}@test.com`,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$testHash', // Mock hash for testing
        role: 'USER',
        isEmailVerified: true,
        isActive: true,
        name: `Test User ${randomSuffix}`,
        bio: `Bio for test user ${randomSuffix}`,
        lastLogin: new Date(),
        isBanned: false,
        ...overrides,
    }
}

/**
 * Generate multiple test users
 */
export function generateTestUsers(
    count: number,
    baseOverrides: Partial<Prisma.UserCreateInput> = {}
): Prisma.UserCreateInput[] {
    return Array.from({ length: count }, (_, index) =>
        generateTestUser({
            ...baseOverrides,
            email: `user-${index}-${Math.random().toString(36).substring(2, 8)}@test.com`,
            name: `Test User ${index}`,
        })
    )
}

/**
 * Generate test refresh token data
 */
export function generateTestRefreshToken(
    userId: string,
    overrides: Partial<Prisma.RefreshTokenCreateInput> = {}
): Prisma.RefreshTokenCreateInput {
    const id = generateUUIDv7()
    const token = `refresh_${Math.random().toString(36).substring(2, 32)}`

    return {
        id,
        token,
        user: { connect: { id: userId } },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isRevoked: false,
        deviceInfo: 'Test Device',
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
        ...overrides,
    }
}

/**
 * Generate test image data
 */
export function generateTestImage(
    ownerId?: string,
    overrides: Partial<Prisma.ImageCreateInput> = {}
): Prisma.ImageCreateInput {
    const id = generateUUIDv7()
    const mockImageBuffer = Buffer.from('mock-image-data')

    return {
        id,
        blob: mockImageBuffer,
        description: 'Test image description',
        size: mockImageBuffer.length,
        mimeType: 'image/webp',
        width: 350,
        height: 450,
        visibility: 'PUBLIC',
        ...(ownerId && { owner: { connect: { id: ownerId } } }),
        ...overrides,
    }
}

/**
 * Generate test tag data
 */
export function generateTestTag(
    ownerId?: string,
    overrides: Partial<Prisma.TagCreateInput> = {}
): Prisma.TagCreateInput {
    const id = generateUUIDv7()
    const randomSuffix = Math.random().toString(36).substring(2, 8)

    return {
        id,
        name: `test-tag-${randomSuffix}`,
        description: `Test tag description ${randomSuffix}`,
        visibility: 'PUBLIC',
        ...(ownerId && { owner: { connect: { id: ownerId } } }),
        ...overrides,
    }
}

/**
 * Generate test race data
 */
export function generateTestRace(
    ownerId?: string,
    overrides: Partial<Prisma.RaceCreateInput> = {}
): Prisma.RaceCreateInput {
    const id = generateUUIDv7()
    const randomSuffix = Math.random().toString(36).substring(2, 8)

    return {
        id,
        name: `Test Race ${randomSuffix}`,
        description: `Test race description ${randomSuffix}`,
        healthModifier: 100,
        manaModifier: 100,
        staminaModifier: 100,
        strengthModifier: 10,
        constitutionModifier: 10,
        dexterityModifier: 10,
        intelligenceModifier: 10,
        wisdomModifier: 10,
        charismaModifier: 10,
        visibility: 'PUBLIC',
        ...(ownerId && { owner: { connect: { id: ownerId } } }),
        ...overrides,
    }
}

/**
 * Generate test archetype data
 */
export function generateTestArchetype(
    ownerId?: string,
    overrides: Partial<Prisma.ArchetypeCreateInput> = {}
): Prisma.ArchetypeCreateInput {
    const id = generateUUIDv7()
    const randomSuffix = Math.random().toString(36).substring(2, 8)

    return {
        id,
        name: `Test Archetype ${randomSuffix}`,
        description: `Test archetype description ${randomSuffix}`,
        visibility: 'PUBLIC',
        ...(ownerId && { owner: { connect: { id: ownerId } } }),
        ...overrides,
    }
}

/**
 * Generate test skill data
 */
export function generateTestSkill(
    ownerId?: string,
    overrides: Partial<Prisma.SkillCreateInput> = {}
): Prisma.SkillCreateInput {
    const id = generateUUIDv7()
    const randomSuffix = Math.random().toString(36).substring(2, 8)

    return {
        id,
        name: `Test Skill ${randomSuffix}`,
        description: `Test skill description ${randomSuffix}`,
        requiredLevel: 1,
        visibility: 'PUBLIC',
        ...(ownerId && { owner: { connect: { id: ownerId } } }),
        ...overrides,
    }
}

/**
 * Generate test perk data
 */
export function generateTestPerk(
    ownerId?: string,
    overrides: Partial<Prisma.PerkCreateInput> = {}
): Prisma.PerkCreateInput {
    const id = generateUUIDv7()
    const randomSuffix = Math.random().toString(36).substring(2, 8)

    return {
        id,
        name: `Test Perk ${randomSuffix}`,
        description: `Test perk description ${randomSuffix}`,
        requiredLevel: 0,
        visibility: 'PUBLIC',
        ...(ownerId && { owner: { connect: { id: ownerId } } }),
        ...overrides,
    }
}

/**
 * Generate test item data
 */
export function generateTestItem(
    ownerId?: string,
    overrides: Partial<Prisma.ItemCreateInput> = {}
): Prisma.ItemCreateInput {
    const id = generateUUIDv7()
    const randomSuffix = Math.random().toString(36).substring(2, 8)

    return {
        id,
        name: `Test Item ${randomSuffix}`,
        description: `Test item description ${randomSuffix}`,
        rarity: 'COMMON',
        slot: 'NONE',
        requiredLevel: 1,
        weight: 1.0,
        durability: 100,
        maxDurability: 100,
        value: 10,
        is2Handed: false,
        isThrowable: false,
        isConsumable: false,
        isQuestItem: false,
        isTradeable: true,
        visibility: 'PUBLIC',
        ...(ownerId && { owner: { connect: { id: ownerId } } }),
        ...overrides,
    }
}

/**
 * Generate test character data
 */
export function generateTestCharacter(
    ownerId: string,
    raceId: string,
    archetypeId: string,
    overrides: Partial<Prisma.CharacterCreateInput> = {}
): Prisma.CharacterCreateInput {
    const id = generateUUIDv7()
    const randomSuffix = Math.random().toString(36).substring(2, 8)

    return {
        id,
        name: `Test Character ${randomSuffix}`,
        sex: 'MALE',
        age: 25,
        description: `Test character description ${randomSuffix}`,
        level: 1,
        experience: 0,
        health: 100,
        mana: 100,
        stamina: 100,
        strength: 10,
        constitution: 10,
        dexterity: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        visibility: 'PUBLIC',
        owner: { connect: { id: ownerId } },
        race: { connect: { id: raceId } },
        archetype: { connect: { id: archetypeId } },
        ...overrides,
    }
}

/**
 * Generate test equipment data
 */
export function generateTestEquipment(
    characterId: string,
    overrides: Partial<Prisma.EquipmentCreateInput> = {}
): Prisma.EquipmentCreateInput {
    const id = generateUUIDv7()

    return {
        id,
        character: { connect: { id: characterId } },
        ...overrides,
    }
}

/**
 * Utility to clean test data (useful for test cleanup)
 */
export const TEST_DATA_CLEANUP_ORDER = [
    'Equipment',
    'Character',
    'Item',
    'Perk',
    'Skill',
    'Archetype',
    'Race',
    'Tag',
    'Image',
    'RefreshToken',
    'User',
] as const

/**
 * Generate a complete test dataset with related entities
 */
export function generateTestDataset() {
    const user = generateTestUser()
    const race = generateTestRace(user.id)
    const archetype = generateTestArchetype(user.id)
    const character = generateTestCharacter(user.id, race.id, archetype.id)
    const equipment = generateTestEquipment(character.id)
    const image = generateTestImage(user.id)
    const tag = generateTestTag(user.id)
    const skill = generateTestSkill(user.id)
    const perk = generateTestPerk(user.id)
    const item = generateTestItem(user.id)
    const refreshToken = generateTestRefreshToken(user.id)

    return {
        user,
        race,
        archetype,
        character,
        equipment,
        image,
        tag,
        skill,
        perk,
        item,
        refreshToken,
    }
}
