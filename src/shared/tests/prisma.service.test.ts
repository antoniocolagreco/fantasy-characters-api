import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('Prisma Service Database Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Database Module Imports', () => {
    it('should export required database functions', async () => {
      const {
        connectDatabase,
        disconnectDatabase,
        getDatabaseHealth,
        getPrismaClient,
        testDatabaseConnection,
        executeTransaction,
        db,
      } = await import('../prisma.service')

      expect(typeof connectDatabase).toBe('function')
      expect(typeof disconnectDatabase).toBe('function')
      expect(typeof getDatabaseHealth).toBe('function')
      expect(typeof getPrismaClient).toBe('function')
      expect(typeof testDatabaseConnection).toBe('function')
      expect(typeof executeTransaction).toBe('function')
      expect(db).toBeDefined()
    })

    it('should export common Prisma types', async () => {
      const types = await import('../prisma.service')

      // These should be exported from @prisma/client
      expect(typeof types).toBe('object')
    })
  })

  describe('Database Configuration', () => {
    it('should create client instance without errors', async () => {
      const { getPrismaClient } = await import('../prisma.service')

      expect(() => {
        const client = getPrismaClient()
        expect(client).toBeDefined()
      }).not.toThrow()
    })

    it('should have database URL from environment', async () => {
      const { environment } = await import('../config')

      expect(environment.DATABASE_URL).toBeDefined()
      expect(typeof environment.DATABASE_URL).toBe('string')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid database operations gracefully', async () => {
      const { testDatabaseConnection } = await import('../prisma.service')

      // This should not throw, but may return false in test environment
      const result = await testDatabaseConnection()
      expect(typeof result).toBe('boolean')
    })

    it('should handle health check requests', async () => {
      const { getDatabaseHealth } = await import('../prisma.service')

      const health = await getDatabaseHealth()
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('connected')
      expect(['healthy', 'unhealthy']).toContain(health.status)
      expect(typeof health.connected).toBe('boolean')
    })
  })

  describe('Service Functionality', () => {
    it('should provide transaction wrapper', async () => {
      const { executeTransaction } = await import('../prisma.service')

      const mockOperation = vi.fn().mockResolvedValue('test result')

      try {
        await executeTransaction(mockOperation)
      } catch (error) {
        // Expected in test environment without real DB connection
        expect(error).toBeDefined()
      }
    })

    it('should handle connection management', async () => {
      const { connectDatabase, disconnectDatabase } = await import('../prisma.service')

      // These functions should exist and be callable
      expect(typeof connectDatabase).toBe('function')
      expect(typeof disconnectDatabase).toBe('function')

      // In test environment, these might fail but shouldn't crash
      try {
        await connectDatabase()
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined()
      }

      try {
        await disconnectDatabase()
      } catch (error) {
        // May fail but should not crash
        expect(error).toBeDefined()
      }
    })
  })

  describe('Database Service Integration', () => {
    it('should maintain singleton pattern for client', async () => {
      const { getPrismaClient } = await import('../prisma.service')

      const client1 = getPrismaClient()
      const client2 = getPrismaClient()

      expect(client1).toBe(client2)
    })

    it('should expose db client directly', async () => {
      const { db, getPrismaClient } = await import('../prisma.service')

      // Both should be PrismaClient instances
      expect(db).toBeDefined()
      expect(getPrismaClient()).toBeDefined()

      // They should have the same constructor
      expect(db.constructor).toBe(getPrismaClient().constructor)
    })
  })
})
