import type { Prisma, Role, Tag, User, Visibility } from '@prisma/client'

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

    return testPrisma.user.create({
        data: {
            id,
            email: options.email || `test-${id.slice(0, 8)}@example.com`,
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
        await testPrisma.image.deleteMany({})
        await testPrisma.tag.deleteMany({})
        await testPrisma.user.deleteMany({})
    } catch {
        // Ignore cleanup errors (e.g., when Prisma engine is shutting down)
        // This prevents unhandled promise rejections during test teardown
        // Errors during cleanup are expected when the test process is shutting down
    }
}
