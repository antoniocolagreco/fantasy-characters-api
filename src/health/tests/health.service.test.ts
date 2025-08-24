/**
 * Health service unit tests
 * Tests for health check service functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the database module
vi.mock('../../shared/prisma.service', () => ({
  getDatabaseHealth: vi.fn(),
}))

// Mock the cache middleware
vi.mock('../../shared/cache.middleware', () => ({
  CacheConfig: {
    getStats: vi.fn(),
  },
}))

// Mock the config module
vi.mock('../../shared/config', () => ({
  healthConfig: {
    name: 'fantasy-characters-api',
    version: '1.0.0',
    environment: 'test',
    enabled: true, // Enable health checks for testing
  },
  cacheConfig: {
    enabled: true,
    defaultTtl: 300,
    maxEntries: 1000,
  },
}))

// Store original NODE_ENV
const originalNodeEnv = process.env.NODE_ENV

import { getHealthStatus, getLivenessStatus, getReadinessStatus } from '../health.service'
import { getDatabaseHealth } from '../../shared/prisma.service'
import { CacheConfig } from '../../shared/cache.middleware'

describe('Health Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock process.uptime to return a consistent value
    vi.spyOn(process, 'uptime').mockReturnValue(1000)
    // Set NODE_ENV to test for consistent environment detection
    process.env.NODE_ENV = 'test'

    // Mock cache stats
    vi.mocked(CacheConfig.getStats).mockReturnValue({
      enabled: true,
      hitRate: 75.5,
      size: 100,
      maxEntries: 1000,
    })
  })

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv
    vi.restoreAllMocks()
  })

  describe('getHealthStatus', () => {
    it('should return comprehensive health status by default', async () => {
      // Mock database health
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })

      const health = await getHealthStatus()

      expect(health.status).toBeDefined()
      expect(health.timestamp).toBeDefined()
      expect(health.uptime).toBe(1000)
      expect(health.version).toBeDefined()
      expect(health.environment).toBe('test')
      expect(Array.isArray(health.checks)).toBe(true)
      expect(health.checks?.length).toBeGreaterThan(0)
    })

    it('should include application check in comprehensive mode', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })

      const health = await getHealthStatus('comprehensive')
      const appCheck = health.checks?.find(check => check.name === 'application')

      expect(appCheck).toBeDefined()
      expect(appCheck?.status).toBe('healthy')
      expect(appCheck?.details).toHaveProperty('nodeVersion')
      expect(appCheck?.details).toHaveProperty('platform')
      expect(appCheck?.details).toHaveProperty('architecture')
    })

    it('should include memory check with details', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })

      const health = await getHealthStatus()
      const memoryCheck = health.checks?.find(check => check.name === 'memory')

      expect(memoryCheck).toBeDefined()
      expect(memoryCheck?.status).toBeDefined()
      expect(memoryCheck?.details).toHaveProperty('used')
      expect(memoryCheck?.details).toHaveProperty('total')
      expect(memoryCheck?.details).toHaveProperty('free')
      expect(memoryCheck?.details).toHaveProperty('utilization')
    })

    it('should include database check', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })

      const health = await getHealthStatus()
      const dbCheck = health.checks?.find(check => check.name === 'database')

      expect(dbCheck).toBeDefined()
      expect(dbCheck?.status).toBe('healthy')
      expect(dbCheck?.details).toHaveProperty('connected', true)
      expect(dbCheck?.details).toHaveProperty('version', '3.0.0')
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(getDatabaseHealth).mockRejectedValue(new Error('Database connection failed'))

      const health = await getHealthStatus()
      const dbCheck = health.checks?.find(check => check.name === 'database')

      expect(dbCheck).toBeDefined()
      expect(dbCheck?.status).toBe('unhealthy')
      expect(dbCheck?.details).toHaveProperty('connected', false)
      expect(dbCheck?.details).toHaveProperty('errorMessage', 'Database connection failed')
    })

    it('should determine overall status based on individual checks', async () => {
      // Mock healthy database
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })

      const health = await getHealthStatus()
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
    })

    it('should return unhealthy status when database is unhealthy', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'unhealthy',
        connected: false,
        errorMessage: 'Connection timeout',
      })

      const health = await getHealthStatus()
      expect(health.status).toBe('unhealthy')
    })
  })

  describe('getLivenessStatus', () => {
    it('should return lightweight liveness probe', async () => {
      const health = await getLivenessStatus()

      expect(health.checks).toHaveLength(1)
      expect(health.checks?.[0]?.name).toBe('process')
      expect(health.checks?.[0]?.status).toBe('healthy')
      expect(health.checks?.[0]?.details).toHaveProperty('pid')
      expect(health.checks?.[0]?.details).toHaveProperty('uptime')
    })

    it('should be healthy when process is running', async () => {
      const health = await getLivenessStatus()

      expect(health.status).toBe('healthy')
      expect(health.uptime).toBe(1000)
    })
  })

  describe('getReadinessStatus', () => {
    it('should include database and memory checks', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })

      const health = await getReadinessStatus()

      expect(health.checks).toHaveLength(3) // database, memory, cache
      const checkNames = health.checks?.map(check => check.name)
      expect(checkNames).toContain('database')
      expect(checkNames).toContain('memory')
      expect(checkNames).toContain('cache')
    })

    it('should be unhealthy when database is not ready', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'unhealthy',
        connected: false,
        errorMessage: 'Database not ready',
      })

      const health = await getReadinessStatus()
      expect(health.status).toBe('unhealthy')
    })
  })

  describe('Different health check levels', () => {
    beforeEach(() => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })
    })

    it('should return basic health status', async () => {
      const health = await getHealthStatus('basic')

      expect(health.checks).toHaveLength(3) // process, memory, cache
      const checkNames = health.checks?.map(check => check.name)
      expect(checkNames).toContain('process')
      expect(checkNames).toContain('memory')
      expect(checkNames).toContain('cache')
    })

    it('should return readiness health status', async () => {
      const health = await getHealthStatus('readiness')

      expect(health.checks).toHaveLength(3) // database, memory, cache
      const checkNames = health.checks?.map(check => check.name)
      expect(checkNames).toContain('database')
      expect(checkNames).toContain('memory')
      expect(checkNames).toContain('cache')
    })

    it('should return comprehensive health status', async () => {
      const health = await getHealthStatus('comprehensive')

      expect(health.checks?.length).toBeGreaterThanOrEqual(4)
      const checkNames = health.checks?.map(check => check.name)
      expect(checkNames).toContain('application')
      expect(checkNames).toContain('memory')
      expect(checkNames).toContain('uptime')
      expect(checkNames).toContain('database')
    })
  })

  describe('Memory status determination', () => {
    it('should handle memory usage thresholds', async () => {
      // Mock high memory usage (96% should be degraded)
      const mockMemoryUsage = vi.fn().mockReturnValue({
        rss: 1000 * 1024 * 1024, // 1GB
        heapTotal: 100 * 1024 * 1024, // 100MB
        heapUsed: 96 * 1024 * 1024, // 96MB (96% utilization)
        external: 10 * 1024 * 1024, // 10MB
        arrayBuffers: 5 * 1024 * 1024, // 5MB
      })

      vi.spyOn(process, 'memoryUsage').mockImplementation(mockMemoryUsage)

      const health = await getHealthStatus('basic')
      const memoryCheck = health.checks?.find(check => check.name === 'memory')

      expect(memoryCheck?.status).toBe('degraded') // 96% should be degraded

      // Restore original function
      vi.restoreAllMocks()
    })
  })

  describe('Uptime formatting', () => {
    it('should format uptime correctly', async () => {
      // Mock memory usage to avoid undefined heapTotal error
      const mockMemoryUsage = vi.fn().mockReturnValue({
        rss: 1000 * 1024 * 1024, // 1GB
        heapTotal: 200 * 1024 * 1024, // 200MB
        heapUsed: 100 * 1024 * 1024, // 100MB (50% utilization)
        external: 10 * 1024 * 1024, // 10MB
        arrayBuffers: 5 * 1024 * 1024, // 5MB
      })
      vi.spyOn(process, 'memoryUsage').mockImplementation(mockMemoryUsage)
      vi.spyOn(process, 'uptime').mockReturnValue(3661) // 1 hour, 1 minute, 1 second

      const health = await getHealthStatus()
      const uptimeCheck = health.checks?.find(check => check.name === 'uptime')

      expect(uptimeCheck?.details).toHaveProperty('formatted')
      expect(typeof uptimeCheck?.details?.formatted).toBe('string')

      // Restore mocks
      vi.restoreAllMocks()
    })
  })

  describe('Memory status edge cases', () => {
    it('should mark memory as unhealthy when utilization > 98%', async () => {
      // Mock memory usage to simulate high memory utilization (>98%)
      const mockMemoryUsage = vi.fn().mockReturnValue({
        rss: 1024 * 1024 * 1024, // 1GB
        heapTotal: 200 * 1024 * 1024, // 200MB
        heapUsed: 199 * 1024 * 1024, // 199MB (99.5% utilization)
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024,
      })
      vi.spyOn(process, 'memoryUsage').mockImplementation(mockMemoryUsage)

      const health = await getHealthStatus()
      const memoryCheck = health.checks?.find(check => check.name === 'memory')

      expect(memoryCheck?.status).toBe('unhealthy')
      expect(memoryCheck?.details?.utilization).toBeGreaterThan(98)

      // Restore mocks
      vi.restoreAllMocks()
    })
  })

  describe('Health check configuration', () => {
    it('should throw error when health checks are disabled', async () => {
      // Mock config to disable health checks
      const { healthConfig } = await import('../../shared/config')
      const originalEnabled = healthConfig.enabled
      healthConfig.enabled = false

      await expect(getHealthStatus()).rejects.toThrow('Health checks are disabled')

      // Restore original config
      healthConfig.enabled = originalEnabled
    })
  })

  describe('Basic health status function', () => {
    it('should return basic health status', async () => {
      const { getBasicHealthStatus } = await import('../health.service')

      const health = await getBasicHealthStatus()

      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('timestamp')
      expect(health).toHaveProperty('uptime')
      expect(health).toHaveProperty('version')
      expect(health).toHaveProperty('environment')
      expect(health).toHaveProperty('checks')
      expect(Array.isArray(health.checks)).toBe(true)
    })
  })

  describe('Cache health check integration', () => {
    it('should include cache check in comprehensive health status', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })

      const health = await getHealthStatus('comprehensive')
      const cacheCheck = health.checks?.find(check => check.name === 'cache')

      expect(cacheCheck).toBeDefined()
      expect(cacheCheck?.status).toBe('healthy')
      expect(cacheCheck?.details).toEqual({
        enabled: true,
        hitRate: 75.5,
        size: 100,
        maxEntries: 1000,
        utilization: 10,
      })
    })

    it('should show degraded cache status when hit rate is low', async () => {
      vi.mocked(CacheConfig.getStats).mockReturnValue({
        enabled: true,
        hitRate: 15, // Low hit rate
        size: 50,
        maxEntries: 1000,
      })

      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })

      const health = await getHealthStatus('comprehensive')
      const cacheCheck = health.checks?.find(check => check.name === 'cache')

      expect(cacheCheck?.status).toBe('degraded')
    })

    it('should show degraded cache status when cache is disabled', async () => {
      vi.mocked(CacheConfig.getStats).mockReturnValue({
        enabled: false,
        hitRate: 0,
        size: 0,
        maxEntries: 1000,
      })

      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })

      const health = await getHealthStatus('comprehensive')
      const cacheCheck = health.checks?.find(check => check.name === 'cache')

      expect(cacheCheck?.status).toBe('degraded')
    })

    it('should show degraded cache status when near capacity', async () => {
      vi.mocked(CacheConfig.getStats).mockReturnValue({
        enabled: true,
        hitRate: 80,
        size: 950, // Near max capacity (95%)
        maxEntries: 1000,
      })

      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })

      const health = await getHealthStatus('comprehensive')
      const cacheCheck = health.checks?.find(check => check.name === 'cache')

      expect(cacheCheck?.status).toBe('degraded')
    })

    it('should include cache check in basic health status', async () => {
      const health = await getHealthStatus('basic')
      const cacheCheck = health.checks?.find(check => check.name === 'cache')

      expect(cacheCheck).toBeDefined()
      expect(cacheCheck?.status).toBe('healthy')
    })

    it('should include cache check in readiness probe', async () => {
      vi.mocked(getDatabaseHealth).mockResolvedValue({
        status: 'healthy',
        connected: true,
        version: '3.0.0',
      })

      const health = await getHealthStatus('readiness')
      const cacheCheck = health.checks?.find(check => check.name === 'cache')

      expect(cacheCheck).toBeDefined()
      expect(cacheCheck?.status).toBe('healthy')
    })
  })
})
