import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getPrismaClient,
  connectDatabase,
  disconnectDatabase,
  testDatabaseConnection,
  getDatabaseHealth,
  executeTransaction,
} from './prisma.service'

// Mock console methods to avoid log noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('Prisma Service', () => {
  beforeEach(async () => {
    // Clean up any existing connections
    await disconnectDatabase()
  })

  afterEach(async () => {
    // Clean up after each test
    await disconnectDatabase()
  })

  describe('getPrismaClient', () => {
    it('should return a Prisma client instance', () => {
      const client = getPrismaClient()
      expect(client).toBeDefined()
      expect(typeof client.$connect).toBe('function')
      expect(typeof client.$disconnect).toBe('function')
    })

    it('should return the same instance on multiple calls', () => {
      const client1 = getPrismaClient()
      const client2 = getPrismaClient()
      expect(client1).toBe(client2)
    })
  })

  describe('connectDatabase', () => {
    it('should connect to the database successfully', async () => {
      await expect(connectDatabase()).resolves.not.toThrow()
    })

    it('should handle connection errors gracefully', async () => {
      // Mock a connection error
      const client = getPrismaClient()
      const originalConnect = client.$connect
      client.$connect = vi.fn().mockRejectedValue(new Error('Connection failed'))

      await expect(connectDatabase()).rejects.toThrow('Connection failed')

      // Restore original method
      client.$connect = originalConnect
    })
  })

  describe('disconnectDatabase', () => {
    it('should disconnect from the database successfully', async () => {
      await connectDatabase()
      await expect(disconnectDatabase()).resolves.not.toThrow()
    })

    it('should handle disconnect when not connected', async () => {
      await expect(disconnectDatabase()).resolves.not.toThrow()
    })
  })

  describe('testDatabaseConnection', () => {
    it('should return true for successful connection', async () => {
      await connectDatabase()
      const result = await testDatabaseConnection()
      expect(result).toBe(true)
    })

    it('should return false for failed connection', async () => {
      const client = getPrismaClient()
      const originalQueryRaw = client.$queryRaw
      client.$queryRaw = vi.fn().mockRejectedValue(new Error('Query failed'))

      const result = await testDatabaseConnection()
      expect(result).toBe(false)

      // Restore original method
      client.$queryRaw = originalQueryRaw
    })
  })

  describe('getDatabaseHealth', () => {
    it('should return healthy status when database is working', async () => {
      await connectDatabase()
      const health = await getDatabaseHealth()

      expect(health.status).toBe('healthy')
      expect(health.connected).toBe(true)
      expect(health.version).toBeDefined()
      expect(health.errorMessage).toBeUndefined()
    })

    it('should return unhealthy status when database fails', async () => {
      const client = getPrismaClient()
      const originalQueryRaw = client.$queryRaw
      client.$queryRaw = vi.fn().mockRejectedValue(new Error('Database error'))

      const health = await getDatabaseHealth()

      expect(health.status).toBe('unhealthy')
      expect(health.connected).toBe(false)
      expect(health.errorMessage).toBe('Database error')

      // Restore original method
      client.$queryRaw = originalQueryRaw
    })
  })

  describe('executeTransaction', () => {
    it('should execute transaction successfully', async () => {
      await connectDatabase()

      const result = await executeTransaction(async client => {
        // Simple query within transaction
        await client.$queryRaw`SELECT 1`
        return 'success'
      })

      expect(result).toBe('success')
    })

    it('should handle transaction errors', async () => {
      await connectDatabase()

      await expect(
        executeTransaction(async () => {
          throw new Error('Transaction error')
        }),
      ).rejects.toThrow('Transaction error')
    })
  })
})
