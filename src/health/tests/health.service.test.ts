/**
 * Health service unit tests
 * Tests for health check service functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the database module
vi.mock('@/shared/database/index', () => ({
  getDatabaseHealth: vi.fn(),
}))

// Mock the config module
vi.mock('@/shared/config', () => ({
  healthConfig: {
    name: 'fantasy-characters-api',
    version: '1.0.0',
    environment: 'test',
    enabled: true, // Enable health checks for testing
  },
}))

// Store original NODE_ENV
const originalNodeEnv = process.env.NODE_ENV

import { getHealthStatus, getLivenessStatus, getReadinessStatus } from '@/health/health.service'
import { getDatabaseHealth } from '@/shared/database/index'

describe('Health Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock process.uptime to return a consistent value
    vi.spyOn(process, 'uptime').mockReturnValue(1000)
    // Set NODE_ENV to test for consistent environment detection
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv
    vi.restoreAllMocks()
  })

  describe('getHealthStatus (comprehensive)', () => {
    it('should return healthy status when all checks pass', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.46.0',
      })

      const result = await getHealthStatus()

      expect(result.status).toBe('healthy')
      expect(result.version).toBe('1.0.0')
      expect(result.environment).toBe('test')
      expect(result.uptime).toBe(1000)
      expect(result.checks).toHaveLength(4) // application, memory, uptime, database
    })

    it('should return unhealthy status when database check fails', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'unhealthy',
        connected: false,
        errorMessage: 'Connection timeout',
      })

      const result = await getHealthStatus()

      expect(result.status).toBe('unhealthy')
    })

    it('should handle database check errors gracefully', async () => {
      vi.mocked(getDatabaseHealth).mockRejectedValue(new Error('Database connection failed'))

      const result = await getHealthStatus()

      expect(result.status).toBe('unhealthy')
    })
  })

  describe('getLivenessStatus (lightweight)', () => {
    it('should return healthy status for basic application check', async () => {
      const result = await getLivenessStatus()

      expect(result.status).toBe('healthy')
      expect(result.version).toBe('1.0.0')
      expect(result.environment).toBe('test')
      expect(result.uptime).toBe(1000)
      expect(result.checks).toHaveLength(1) // ONLY process check for liveness (Kubernetes best practice)

      const processCheck = result.checks.find(check => check.name === 'process')
      expect(processCheck).toBeDefined()
      expect(processCheck?.status).toBe('healthy')
    })

    it('should not include database checks', async () => {
      const result = await getLivenessStatus()
      expect(result.checks.some(check => check.name === 'database')).toBe(false)
      expect(getDatabaseHealth).not.toHaveBeenCalled()
    })
  })

  describe('getReadinessStatus (comprehensive)', () => {
    it('should return healthy status when all checks pass', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.46.0',
      })

      const result = await getReadinessStatus()

      expect(result.status).toBe('healthy')
      expect(result.checks).toHaveLength(2) // database, memory (focus on external dependencies)

      const databaseCheck = result.checks.find(check => check.name === 'database')
      expect(databaseCheck).toBeDefined()
      expect(databaseCheck?.status).toBe('healthy')

      const memoryCheck = result.checks.find(check => check.name === 'memory')
      expect(memoryCheck).toBeDefined()
    })

    it('should return unhealthy status when database is not ready', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'unhealthy',
        connected: false,
        errorMessage: 'Connection timeout',
      })

      const result = await getReadinessStatus()

      expect(result.status).toBe('unhealthy')
    })
  })

  describe('Memory check functionality', () => {
    it('should return healthy for normal memory usage', async () => {
      // Mock normal memory usage (50% of heap limit)
      const mockMemoryUsage = {
        rss: 100 * 1024 * 1024, // 100MB
        heapUsed: 500 * 1024 * 1024, // 500MB
        heapTotal: 1000 * 1024 * 1024, // 1000MB
        external: 50 * 1024 * 1024, // 50MB
        arrayBuffers: 10 * 1024 * 1024, // 10MB
      }
      vi.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage)

      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.46.0',
      })

      const result = await getHealthStatus()

      const memoryCheck = result.checks.find(check => check.name === 'memory')
      expect(memoryCheck?.status).toBe('healthy')
    })

    it('should return degraded for high memory usage', async () => {
      // Mock high memory usage (96% of heap limit)
      const mockMemoryUsage = {
        rss: 100 * 1024 * 1024, // 100MB
        heapUsed: 960 * 1024 * 1024, // 960MB
        heapTotal: 1000 * 1024 * 1024, // 1000MB
        external: 50 * 1024 * 1024, // 50MB
        arrayBuffers: 10 * 1024 * 1024, // 10MB
      }
      vi.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage)

      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.46.0',
      })

      const result = await getHealthStatus()

      const memoryCheck = result.checks.find(check => check.name === 'memory')
      expect(memoryCheck?.status).toBe('degraded')
      expect(result.status).toBe('degraded')
    })

    it('should return unhealthy for critical memory usage', async () => {
      // Mock critical memory usage (99% of heap limit)
      const mockMemoryUsage = {
        rss: 100 * 1024 * 1024, // 100MB
        heapUsed: 990 * 1024 * 1024, // 990MB
        heapTotal: 1000 * 1024 * 1024, // 1000MB
        external: 50 * 1024 * 1024, // 50MB
        arrayBuffers: 10 * 1024 * 1024, // 10MB
      }
      vi.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage)

      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.46.0',
      })

      const result = await getHealthStatus()

      const memoryCheck = result.checks.find(check => check.name === 'memory')
      expect(memoryCheck?.status).toBe('unhealthy')
      expect(result.status).toBe('unhealthy')
    })
  })

  describe('Function exports', () => {
    it('should export all health check functions', () => {
      expect(getHealthStatus).toBeDefined()
      expect(getLivenessStatus).toBeDefined()
      expect(getReadinessStatus).toBeDefined()

      expect(typeof getHealthStatus).toBe('function')
      expect(typeof getLivenessStatus).toBe('function')
      expect(typeof getReadinessStatus).toBe('function')
    })
  })

  describe('Edge cases and error handling', () => {
    it('should use default version when npm_package_version is not set', async () => {
      // Store original and delete npm_package_version
      const originalVersion = process.env.npm_package_version
      delete process.env.npm_package_version

      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.46.0',
      })

      const result = await getHealthStatus()

      expect(result.version).toBe('1.0.0') // Default version

      // Restore original value
      if (originalVersion) {
        process.env.npm_package_version = originalVersion
      }
    })

    it('should use default environment when NODE_ENV is not set', async () => {
      // Store original and delete NODE_ENV
      const originalEnv = process.env.NODE_ENV
      delete process.env.NODE_ENV

      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.46.0',
      })

      const result = await getHealthStatus()

      expect(result.environment).toBe('development') // Default environment

      // Restore original value
      process.env.NODE_ENV = originalEnv
    })

    it('should handle zero uptime scenario for process check', async () => {
      // Mock process.uptime to return 0
      vi.spyOn(process, 'uptime').mockReturnValue(0)

      const result = await getLivenessStatus()

      expect(result.status).toBe('unhealthy')
      const processCheck = result.checks.find(check => check.name === 'process')
      expect(processCheck?.status).toBe('unhealthy')
    })

    it('should handle zero uptime scenario for uptime check', async () => {
      // Mock process.uptime to return 0
      vi.spyOn(process, 'uptime').mockReturnValue(0)

      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.46.0',
      })

      const result = await getHealthStatus('comprehensive')

      const uptimeCheck = result.checks.find(check => check.name === 'uptime')
      expect(uptimeCheck?.status).toBe('unhealthy')
      expect(result.status).toBe('unhealthy')
    })
  })

  describe('formatUptime function coverage', () => {
    it('should format uptime correctly for different time ranges', async () => {
      // Test different uptime scenarios
      const testCases = [
        { uptime: 0, expected: '0s' },
        { uptime: 30, expected: '30s' },
        { uptime: 90, expected: '1m 30s' },
        { uptime: 3661, expected: '1h 1m 1s' },
        { uptime: 90061, expected: '1d 1h 1m 1s' },
        { uptime: 86400, expected: '1d' },
        { uptime: 3600, expected: '1h' },
        { uptime: 60, expected: '1m' },
      ]

      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.46.0',
      })

      for (const testCase of testCases) {
        vi.spyOn(process, 'uptime').mockReturnValue(testCase.uptime)

        const result = await getHealthStatus('comprehensive')
        const uptimeCheck = result.checks.find(check => check.name === 'uptime')

        expect(uptimeCheck?.details?.formatted).toBe(testCase.expected)
      }
    })
  })

  describe('Database error handling', () => {
    it('should handle database errors with non-Error objects', async () => {
      // Mock database health to throw a non-Error object
      vi.mocked(getDatabaseHealth).mockRejectedValue('String error')

      const result = await getHealthStatus('comprehensive')

      const databaseCheck = result.checks.find(check => check.name === 'database')
      expect(databaseCheck?.status).toBe('unhealthy')
      expect(databaseCheck?.details?.errorMessage).toBe('Unknown database error')
    })
  })
})
