import { execSync } from 'child_process'

import { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, beforeEach, vi } from 'vitest'

import { generateUUIDv7 } from '@/shared/utils'

// Create a dedicated Prisma client for tests with explicit URL
export const testPrisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://fantasy_user:fantasy_password@localhost:5432/fantasy_characters_dev',
        },
    },
    // Completely silent during tests - only show logs if explicitly requested
    log: process.env.DEBUG === 'true' ? ['query', 'info', 'warn', 'error'] : [],
})

/**
 * Clean all test data from database
 */
export async function cleanTestDatabase(): Promise<void> {
    try {
        // 1. Auth/session first
        await testPrisma.refreshToken.deleteMany({})

        // 2. Join/association tables (Restrict FKs) - delete BEFORE parent entities
        await testPrisma.characterInventory.deleteMany({})
        await testPrisma.characterSkill.deleteMany({})
        await testPrisma.characterPerk.deleteMany({})
        await testPrisma.itemBonusSkill.deleteMany({})
        await testPrisma.itemBonusPerk.deleteMany({})
        await testPrisma.raceSkill.deleteMany({})
        await testPrisma.archetypeRequiredRace.deleteMany({})
        await testPrisma.archetypeSkill.deleteMany({})

        // 3. Dependent entities
        await testPrisma.equipment.deleteMany({})
        await testPrisma.character.deleteMany({})
        await testPrisma.item.deleteMany({})
        await testPrisma.perk.deleteMany({})
        await testPrisma.skill.deleteMany({})
        await testPrisma.archetype.deleteMany({})
        await testPrisma.race.deleteMany({})
        await testPrisma.tag.deleteMany({})
        await testPrisma.image.deleteMany({})

        // 4. Users last
        await testPrisma.user.deleteMany({})
    } catch {
        // Ignore cleanup errors during test teardown to prevent unhandled rejections
        // This is expected when the Prisma engine is shutting down
    }
}

/**
 * Setup test database connection
 */
async function connectTestDatabase(): Promise<void> {
    try {
        await testPrisma.$connect()
        await testPrisma.$queryRaw`SELECT 1 as test`
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to connect to test database:', error)
        throw error
    }
}

/**
 * Disconnect from test database
 */
async function disconnectTestDatabase(): Promise<void> {
    try {
        await testPrisma.$disconnect()
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error disconnecting from test database:', error)
    }
}

/**
 * Setup test database
 */
export async function setupTestDatabase(): Promise<void> {
    try {
        await connectTestDatabase()

        // Run migrations if needed (in CI/dev environments)
        if (process.env.NODE_ENV !== 'test' || process.env.CI === 'true') {
            execSync('npx prisma migrate deploy', {
                stdio: 'inherit',
                env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
            })
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to setup test database:', error)
        throw error
    }
}

/**
 * Teardown test database
 */
export async function teardownTestDatabase(): Promise<void> {
    try {
        await disconnectTestDatabase()
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error disconnecting test database:', error)
        throw error
    }
}

// Test environment setup
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'silent'
process.env.RBAC_ENABLED = 'true'
// Ensure required env vars for config and auth across all tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-with-minimum-32-characters!!'
process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-with-min-32-chars!!'
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'

// Use test database URL or fall back to development database
process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'postgresql://fantasy_user:fantasy_password@localhost:5432/fantasy_characters_dev'

// Mock Prisma service to use our test database client
vi.mock('../src/infrastructure/database/prisma.service', () => ({
    default: testPrisma,
    prisma: testPrisma,
}))
vi.mock('../src/infrastructure/database', () => ({
    prisma: testPrisma,
}))
vi.mock('@/infrastructure/database/prisma.service', () => ({
    default: testPrisma,
    prisma: testPrisma,
}))
vi.mock('@/infrastructure/database', () => ({
    prisma: testPrisma,
}))

// Mock image processing functions for tests - will be overridden for specific tests
vi.mock('../src/features/images/images.processing', async importOriginal => {
    const actual = (await importOriginal()) as Record<string, unknown>
    return {
        ...actual,
        validateImageFile: vi.fn(() => {
            // Do nothing - skip validation in tests
        }),
        processImageToWebP: vi.fn((buffer: Buffer) => {
            return Promise.resolve({
                buffer,
                size: buffer.length,
                mimeType: 'image/webp',
                width: 800,
                height: 600,
            })
        }),
    }
})

vi.mock('@/features/images/images.processing', async importOriginal => {
    const actual = (await importOriginal()) as Record<string, unknown>
    return {
        ...actual,
        validateImageFile: vi.fn(() => {
            // Do nothing - skip validation in tests
        }),
        processImageToWebP: vi.fn((buffer: Buffer) => {
            return Promise.resolve({
                buffer,
                size: buffer.length,
                mimeType: 'image/webp',
                width: 800,
                height: 600,
            })
        }),
    }
})

beforeAll(async () => {
    // Setup test database
    await setupTestDatabase()
})

beforeEach(async () => {
    // Clean up database between tests and seed minimal data
    await cleanTestDatabase()

    // Seed an ADMIN so RBAC finds a real user if controllers/read ownership or user lookups happen
    // Use a unique email to avoid conflicts with test-specific users
    const adminId = generateUUIDv7()
    const uniqueId = generateUUIDv7().slice(-8)
    await testPrisma.user.create({
        data: {
            id: adminId,
            email: `setup-admin-${uniqueId}@test.local`,
            passwordHash: '$argon2id$v=19$m=4096,t=3,p=1$dGVzdGluZw$0a1e1e1e1e1e1e1e1e1e1e',
            role: 'ADMIN',
            isEmailVerified: true,
            isActive: true,
            lastLogin: new Date(),
            isBanned: false,
            name: 'Setup Admin',
        },
    })
})

afterAll(async () => {
    // Cleanup after all tests
    await teardownTestDatabase()

    // Force garbage collection if available
    if (global.gc) {
        global.gc()
    }
})
