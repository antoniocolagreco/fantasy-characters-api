import { PrismaClient } from '@prisma/client'

// Test database configuration
const TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'postgresql://fantasy_user:fantasy_password@localhost:5432/fantasy_characters_dev'

// Create a dedicated Prisma client for tests
export const testPrisma = new PrismaClient({
    datasources: {
        db: {
            url: TEST_DATABASE_URL,
        },
    },
    log:
        process.env.NODE_ENV === 'test' && process.env.DEBUG === 'true'
            ? ['query', 'info', 'warn', 'error']
            : ['warn', 'error'],
})

/**
 * Connect to test database
 */
export async function connectTestDatabase(): Promise<void> {
    try {
        await testPrisma.$connect()
        // Test the connection
        await testPrisma.$queryRaw`SELECT 1`
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to connect to test database:', error)
        throw error
    }
}

/**
 * Disconnect from test database
 */
export async function disconnectTestDatabase(): Promise<void> {
    try {
        await testPrisma.$disconnect()
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error disconnecting test database:', error)
        throw error
    }
}

/**
 * Clean all test data from database
 */
export async function cleanTestDatabase(): Promise<void> {
    try {
        // Delete in correct order to respect foreign key constraints
        await testPrisma.equipment.deleteMany()
        await testPrisma.character.deleteMany()
        await testPrisma.item.deleteMany()
        await testPrisma.skill.deleteMany()
        await testPrisma.perk.deleteMany()
        await testPrisma.archetype.deleteMany()
        await testPrisma.race.deleteMany()
        await testPrisma.tag.deleteMany()
        await testPrisma.image.deleteMany()
        await testPrisma.refreshToken.deleteMany()
        await testPrisma.user.deleteMany()
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error cleaning test database:', error)
        throw error
    }
}
