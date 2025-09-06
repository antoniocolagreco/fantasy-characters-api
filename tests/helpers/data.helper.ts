import type { User, Role } from '@prisma/client'

import { hashPassword } from '@/features/auth/password.service'
import prismaService from '@/infrastructure/database/prisma.service'
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

    // Create different types of users for comprehensive testing
    const userConfigs = [
        { role: 'ADMIN' as Role, email: 'admin@test.local', name: 'Admin User' },
        { role: 'MODERATOR' as Role, email: 'moderator@test.local', name: 'Moderator User' },
        { role: 'USER' as Role, email: 'user@test.local', name: 'Regular User' },
    ]

    for (let i = 0; i < Math.min(count, userConfigs.length); i++) {
        const config = userConfigs[i]
        if (!config) continue

        const passwordHash = await hashPassword('test-password-123')

        const user = await prismaService.user.create({
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
        const passwordHash = await hashPassword('test-password-123')
        const id = generateUUIDv7()

        const user = await prismaService.user.create({
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
        // Clean up in reverse dependency order
        await prismaService.refreshToken.deleteMany({
            where: { userId: { in: users.map(u => u.id) } },
        })
        await prismaService.user.deleteMany({
            where: { id: { in: users.map(u => u.id) } },
        })
    }

    return { users, cleanup }
}

/**
 * Comprehensive test database cleanup
 */
export async function cleanupTestData(): Promise<void> {
    // Clean up in dependency order (children first, then parents)
    await prismaService.refreshToken.deleteMany()
    await prismaService.user.deleteMany()

    // Add more entities as they're implemented
    // await prismaService.character.deleteMany()
    // await prismaService.item.deleteMany()
    // etc.
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
    const passwordHash = await hashPassword('test-password-123')

    return prismaService.user.create({
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
    const [adminUser, moderatorUser, regularUser, bannedUser, inactiveUser] = await Promise.all([
        createTestUserInDb({
            role: 'ADMIN',
            email: 'admin@test.local',
            name: 'Admin User',
        }),
        createTestUserInDb({
            role: 'MODERATOR',
            email: 'moderator@test.local',
            name: 'Moderator User',
        }),
        createTestUserInDb({
            role: 'USER',
            email: 'user@test.local',
            name: 'Regular User',
        }),
        createTestUserInDb({
            role: 'USER',
            email: 'banned@test.local',
            name: 'Banned User',
            isBanned: true,
        }),
        createTestUserInDb({
            role: 'USER',
            email: 'inactive@test.local',
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
