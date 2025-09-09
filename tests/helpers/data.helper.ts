import type {
    Prisma,
    Role,
    Tag,
    User,
    Visibility,
    Item,
    Rarity,
    Slot,
    Race,
    Archetype,
    Character,
    Sex,
} from '@prisma/client'

import { testPrisma } from '../setup'

import { passwordService } from '@/features/auth/password.service'
import { generateUUIDv7 } from '@/shared/utils/uuid'

interface TestData {
    users: User[]
    cleanup: () => Promise<void>
}

/**
 * Creates test users with proper relationships and cleanup
 */
export async function setupTestUsers(count: number = 3): Promise<TestData> {
    const users: User[] = []

    // Generate unique email suffixes to avoid conflicts
    const testId = generateUUIDv7().slice(-8)

    // Create different types of users for comprehensive testing
    const userConfigs = [
        { role: 'ADMIN' as Role, email: `admin-${testId}@test.local`, name: 'Admin User' },
        {
            role: 'MODERATOR' as Role,
            email: `moderator-${testId}@test.local`,
            name: 'Moderator User',
        },
        { role: 'USER' as Role, email: `user-${testId}@test.local`, name: 'Regular User' },
    ]

    for (let i = 0; i < Math.min(count, userConfigs.length); i++) {
        const config = userConfigs[i]
        if (!config) continue

        const passwordHash = await passwordService.hashPassword('test-password-123')

        const user = await testPrisma.user.create({
            data: {
                id: generateUUIDv7(),
                email: config.email,
                passwordHash,
                role: config.role,
                name: config.name,
                isEmailVerified: true,
                isActive: true,
                isBanned: false,
                lastLogin: new Date(),
            },
        })

        users.push(user)
    }

    // Add more generic users if needed
    for (let i = userConfigs.length; i < count; i++) {
        const passwordHash = await passwordService.hashPassword('test-password-123')
        const id = generateUUIDv7()

        const user = await testPrisma.user.create({
            data: {
                id,
                email: `user-${i}@test.local`,
                passwordHash,
                role: 'USER',
                name: `Test User ${i}`,
                isEmailVerified: true,
                isActive: true,
                isBanned: false,
                lastLogin: new Date(),
            },
        })

        users.push(user)
    }

    const cleanup = async () => {
        try {
            // Clean up in reverse dependency order
            await testPrisma.refreshToken.deleteMany({
                where: { userId: { in: users.map(u => u.id) } },
            })
            await testPrisma.user.deleteMany({
                where: { id: { in: users.map(u => u.id) } },
            })
        } catch {
            // Ignore cleanup errors to prevent unhandled rejections
        }
    }

    return { users, cleanup }
}

/**
 * Creates a single test user with sensible defaults
 */
export async function createTestUserInDb(
    options: {
        role?: Role
        email?: string
        name?: string
        isActive?: boolean
        isBanned?: boolean
        isEmailVerified?: boolean
    } = {}
): Promise<User> {
    const id = generateUUIDv7()
    const passwordHash = await passwordService.hashPassword('test-password-123')

    // Use full id to guarantee uniqueness + random microtime
    const uniqueEmail = options.email || `test-${id}-${Date.now()}@example.com`
    return testPrisma.user.create({
        data: {
            id,
            email: uniqueEmail,
            passwordHash,
            role: options.role || 'USER',
            name: options.name || `Test User ${id.slice(0, 8)}`,
            isEmailVerified: options.isEmailVerified ?? true,
            isActive: options.isActive ?? true,
            isBanned: options.isBanned ?? false,
            lastLogin: new Date(),
        },
    })
}

/**
 * Creates a single test tag with sensible defaults
 */
export async function createTestTag(
    options: {
        name?: string
        description?: string
        visibility?: Visibility
        ownerId?: string
    } = {}
): Promise<Tag> {
    const id = generateUUIDv7()

    const baseData = {
        id,
        name: options.name || `Test Tag ${id.slice(0, 8)}`,
        visibility: options.visibility || 'PUBLIC',
    }

    const dataWithOptionals = {
        ...baseData,
        ...(options.description !== undefined && { description: options.description }),
        ...(options.ownerId !== undefined && { ownerId: options.ownerId }),
    }

    return testPrisma.tag.create({ data: dataWithOptionals as Prisma.TagCreateInput })
}

/**
 * Creates a single test item with sensible defaults
 */
export async function createTestItem(
    options: {
        name?: string
        description?: string
        visibility?: Visibility
        ownerId?: string
        rarity?: string
        slot?: string
        requiredLevel?: number
        weight?: number
        durability?: number
        maxDurability?: number
        value?: number
    } = {}
): Promise<Item> {
    const id = generateUUIDv7()

    const rarityValue = ((): Rarity => {
        const r = options.rarity
        if (r === 'COMMON' || r === 'UNCOMMON' || r === 'RARE' || r === 'EPIC' || r === 'LEGENDARY')
            return r
        return 'COMMON'
    })()
    const slotValue = ((): Slot => {
        const s = options.slot
        const allowed: Slot[] = [
            'NONE',
            'HEAD',
            'FACE',
            'CHEST',
            'LEGS',
            'FEET',
            'HANDS',
            'ONE_HAND',
            'TWO_HANDS',
            'RING',
            'AMULET',
            'BELT',
            'BACKPACK',
            'CLOAK',
        ]
        return allowed.includes(s as Slot) ? (s as Slot) : 'NONE'
    })()

    const baseData: Prisma.ItemCreateInput = {
        id,
        name: options.name || `Test Item ${id.slice(0, 8)}`,
        visibility: (options.visibility as Visibility) || 'PUBLIC',
        rarity: rarityValue,
        slot: slotValue,
        requiredLevel: options.requiredLevel ?? 1,
        weight: options.weight ?? 1.0,
        durability: options.durability ?? 100,
        maxDurability: options.maxDurability ?? options.durability ?? 100,
        value: options.value ?? 0,
        is2Handed: false,
        isThrowable: false,
        isConsumable: false,
        isQuestItem: false,
        isTradeable: true,
    }

    const dataWithOptionals: Prisma.ItemCreateInput = {
        ...baseData,
        ...(options.description !== undefined && { description: options.description }),
        ...(options.ownerId !== undefined && { owner: { connect: { id: options.ownerId } } }),
    }

    return testPrisma.item.create({ data: dataWithOptionals })
}

/**
 * Creates a single test race with sensible defaults
 */
export async function createTestRace(
    options: {
        name?: string
        description?: string
        visibility?: Visibility
        ownerId?: string
    } = {}
): Promise<Race> {
    const id = generateUUIDv7()
    const baseData: Prisma.RaceCreateInput = {
        id,
        name: options.name || `Test Race ${id.slice(0, 8)}`,
        visibility: (options.visibility as Visibility) || 'PUBLIC',
        // default attribute modifiers rely on Prisma defaults; only override when needed
    }
    const dataWithOptionals: Prisma.RaceCreateInput = {
        ...baseData,
        ...(options.description !== undefined && { description: options.description }),
        ...(options.ownerId !== undefined && { owner: { connect: { id: options.ownerId } } }),
    }
    return testPrisma.race.create({ data: dataWithOptionals })
}

/**
 * Creates a single test archetype with sensible defaults
 */
export async function createTestArchetype(
    options: {
        name?: string
        description?: string
        visibility?: Visibility
        ownerId?: string
    } = {}
): Promise<Archetype> {
    const id = generateUUIDv7()
    const baseData: Prisma.ArchetypeCreateInput = {
        id,
        name: options.name || `Test Archetype ${id.slice(0, 8)}`,
        visibility: (options.visibility as Visibility) || 'PUBLIC',
    }
    const dataWithOptionals: Prisma.ArchetypeCreateInput = {
        ...baseData,
        ...(options.description !== undefined && { description: options.description }),
        ...(options.ownerId !== undefined && { owner: { connect: { id: options.ownerId } } }),
    }
    return testPrisma.archetype.create({ data: dataWithOptionals })
}

/**
 * Creates a single test character with sensible defaults
 */
export async function createTestCharacter(options: {
    name?: string
    visibility?: Visibility
    ownerId: string
    raceId: string
    archetypeId: string
    level?: number
    sex?: Sex
}): Promise<Character> {
    const id = generateUUIDv7()
    return testPrisma.character.create({
        data: {
            id,
            name: options.name || `Test Character ${id.slice(0, 8)}`,
            visibility: (options.visibility as Visibility) || 'PUBLIC',
            owner: { connect: { id: options.ownerId } },
            race: { connect: { id: options.raceId } },
            archetype: { connect: { id: options.archetypeId } },
            level: options.level ?? 1,
            sex: options.sex || 'MALE',
        },
    })
}

/**
 * Seeds the database with comprehensive test data
 */
export async function seedTestDatabase(): Promise<{
    adminUser: User
    moderatorUser: User
    regularUser: User
    bannedUser: User
    inactiveUser: User
    cleanup: () => Promise<void>
}> {
    // Generate unique identifier for this test run to avoid email conflicts
    const testId = generateUUIDv7().slice(-8)

    const [adminUser, moderatorUser, regularUser, bannedUser, inactiveUser] = await Promise.all([
        createTestUserInDb({
            role: 'ADMIN',
            email: `admin-${testId}@test.local`,
            name: 'Admin User',
        }),
        createTestUserInDb({
            role: 'MODERATOR',
            email: `moderator-${testId}@test.local`,
            name: 'Moderator User',
        }),
        createTestUserInDb({
            role: 'USER',
            email: `user-${testId}@test.local`,
            name: 'Regular User',
        }),
        createTestUserInDb({
            role: 'USER',
            email: `banned-${testId}@test.local`,
            name: 'Banned User',
            isBanned: true,
        }),
        createTestUserInDb({
            role: 'USER',
            email: `inactive-${testId}@test.local`,
            name: 'Inactive User',
            isActive: false,
        }),
    ])

    const cleanup = async () => {
        await cleanupTestData()
    }

    return {
        adminUser,
        moderatorUser,
        regularUser,
        bannedUser,
        inactiveUser,
        cleanup,
    }
}

/**
 * Cleans up all test data from the database
 */
export async function cleanupTestData(): Promise<void> {
    try {
        // Delete all test data in dependency order (child tables first)
        await testPrisma.refreshToken.deleteMany({})
        await testPrisma.character.deleteMany({})
        await testPrisma.item.deleteMany({})
        await testPrisma.image.deleteMany({})
        await testPrisma.archetype.deleteMany({})
        await testPrisma.race.deleteMany({})
        await testPrisma.tag.deleteMany({})
        await testPrisma.user.deleteMany({})
    } catch {
        // Ignore cleanup errors (e.g., when Prisma engine is shutting down)
        // This prevents unhandled promise rejections during test teardown
        // Errors during cleanup are expected when the test process is shutting down
    }
}
