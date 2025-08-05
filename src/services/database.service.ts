import { PrismaClient } from '@prisma/client'

// Database connection using functional approach
let prisma: PrismaClient | null = null

// Initialize database connection
export const initializeDatabase = (): PrismaClient => {
    if (!prisma) {
        prisma = new PrismaClient({
            log: ['query', 'info', 'warn', 'error']
        })
    }
    return prisma
}

// Get database instance
export const getDatabase = (): PrismaClient => {
    if (!prisma) {
        throw new Error('Database not initialized. Call initializeDatabase() first.')
    }
    return prisma
}

// Close database connection
export const closeDatabase = async (): Promise<void> => {
    if (prisma) {
        await prisma.$disconnect()
        prisma = null
    }
}

// Database health check
export const checkDatabaseHealth = async (): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> => {
    try {
        const db = getDatabase()
        await db.$queryRaw`SELECT 1`
        return { status: 'healthy', message: 'Database connection is working' }
    } catch (error) {
        return {
            status: 'unhealthy',
            message: error instanceof Error ? error.message : 'Unknown database error'
        }
    }
}

// Database migration check
export const checkMigrationStatus = async (): Promise<{ applied: boolean; pending: number }> => {
    try {
        const db = getDatabase()
        // Check if migrations table exists and get status
        const result =
            await db.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'`
        return { applied: Array.isArray(result) && result.length > 0, pending: 0 }
    } catch (_error) {
        return { applied: false, pending: 1 }
    }
}
