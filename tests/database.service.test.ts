import {
    initializeDatabase,
    getDatabase,
    closeDatabase,
    checkDatabaseHealth,
    checkMigrationStatus
} from '../src/services/database.service.js'

describe('Database Service', () => {
    beforeEach(async () => {
        // Ensure clean state for each test
        await closeDatabase()
    })

    afterAll(async () => {
        // Clean up after all tests
        await closeDatabase()
    })

    describe('initializeDatabase', () => {
        it('should initialize database connection', () => {
            const db = initializeDatabase()
            expect(db).toBeDefined()
            expect(typeof db.$connect).toBe('function')
        })

        it('should return same instance on subsequent calls', () => {
            const db1 = initializeDatabase()
            const db2 = initializeDatabase()
            expect(db1).toBe(db2)
        })
    })

    describe('getDatabase', () => {
        it('should return database instance when initialized', () => {
            initializeDatabase()
            const db = getDatabase()
            expect(db).toBeDefined()
        })

        it('should throw error when not initialized', async () => {
            await closeDatabase()
            expect(() => getDatabase()).toThrow('Database not initialized. Call initializeDatabase() first.')
        })
    })

    describe('closeDatabase', () => {
        it('should close database connection', async () => {
            initializeDatabase()
            await expect(closeDatabase()).resolves.not.toThrow()
        })

        it('should handle closing when not initialized', async () => {
            await closeDatabase() // Already closed
            await expect(closeDatabase()).resolves.not.toThrow()
        })
    })

    describe('checkDatabaseHealth', () => {
        it('should return healthy status when database is working', async () => {
            initializeDatabase()
            const health = await checkDatabaseHealth()

            expect(health).toEqual({
                status: 'healthy',
                message: 'Database connection is working'
            })
        })

        it('should return unhealthy status when database is not initialized', async () => {
            await closeDatabase()
            const health = await checkDatabaseHealth()

            expect(health.status).toBe('unhealthy')
            expect(health.message).toContain('Database not initialized')
        })
    })

    describe('checkMigrationStatus', () => {
        it('should return migration status when database is working', async () => {
            initializeDatabase()
            const status = await checkMigrationStatus()

            expect(status).toHaveProperty('applied')
            expect(status).toHaveProperty('pending')
            expect(typeof status.applied).toBe('boolean')
            expect(typeof status.pending).toBe('number')
        })

        it('should return default status when database check fails', async () => {
            await closeDatabase()
            const status = await checkMigrationStatus()

            expect(status).toEqual({
                applied: false,
                pending: 1
            })
        })
    })
})
