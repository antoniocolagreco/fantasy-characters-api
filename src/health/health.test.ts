/**
 * Health check tests
 * Unit and integration tests for health check functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getHealthStatus } from './health.service.js'
import { healthConfig } from '../config/environment.js'

// Mock the environment config
vi.mock('../config/environment.js', () => ({
  healthConfig: {
    enabled: true,
  },
}))

describe('Health Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getHealthStatus', () => {
    it('should return health status when enabled', async () => {
      const health = await getHealthStatus()

      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('timestamp')
      expect(health).toHaveProperty('uptime')
      expect(health).toHaveProperty('version')
      expect(health).toHaveProperty('environment')
      expect(health).toHaveProperty('checks')

      expect(health.status).toMatch(/^(healthy|unhealthy|degraded)$/)
      expect(Array.isArray(health.checks)).toBe(true)
      expect(health.checks.length).toBeGreaterThan(0)
    })

    it('should include application check', async () => {
      const health = await getHealthStatus()
      const appCheck = health.checks.find(check => check.name === 'application')

      expect(appCheck).toBeDefined()
      expect(appCheck?.status).toBe('healthy')
      expect(appCheck?.details).toHaveProperty('nodeVersion')
      expect(appCheck?.details).toHaveProperty('platform')
      expect(appCheck?.details).toHaveProperty('architecture')
    })

    it('should include memory check', async () => {
      const health = await getHealthStatus()
      const memoryCheck = health.checks.find(check => check.name === 'memory')

      expect(memoryCheck).toBeDefined()
      expect(memoryCheck?.details).toHaveProperty('used')
      expect(memoryCheck?.details).toHaveProperty('total')
      expect(memoryCheck?.details).toHaveProperty('free')
      expect(memoryCheck?.details).toHaveProperty('utilization')
    })

    it('should include uptime check', async () => {
      const health = await getHealthStatus()
      const uptimeCheck = health.checks.find(check => check.name === 'uptime')

      expect(uptimeCheck).toBeDefined()
      expect(uptimeCheck?.status).toBe('healthy')
      expect(uptimeCheck?.details).toHaveProperty('seconds')
      expect(uptimeCheck?.details).toHaveProperty('formatted')
    })

    it('should include database check', async () => {
      const health = await getHealthStatus()
      const dbCheck = health.checks.find(check => check.name === 'database')

      expect(dbCheck).toBeDefined()
      // For now, database check just returns healthy
      expect(dbCheck?.status).toBe('healthy')
    })

    it('should throw error when health checks are disabled', async () => {
      // Mock disabled config
      vi.mocked(healthConfig).enabled = false

      await expect(getHealthStatus()).rejects.toThrow('Health checks are disabled')

      // Reset to enabled
      vi.mocked(healthConfig).enabled = true
    })

    it('should return healthy status when all checks pass', async () => {
      const health = await getHealthStatus()

      // All checks should be healthy in test environment
      const allHealthy = health.checks.every(check => check.status === 'healthy')
      expect(allHealthy).toBe(true)
      expect(health.status).toBe('healthy')
    })

    it('should have valid timestamp format', async () => {
      const health = await getHealthStatus()

      expect(() => new Date(health.timestamp)).not.toThrow()
      expect(health.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    })

    it('should have positive uptime', async () => {
      const health = await getHealthStatus()

      expect(health.uptime).toBeGreaterThanOrEqual(0)
      expect(typeof health.uptime).toBe('number')
    })

    it('should include environment information', async () => {
      const health = await getHealthStatus()

      expect(health.environment).toBeDefined()
      expect(typeof health.environment).toBe('string')
      expect(health.version).toBeDefined()
      expect(typeof health.version).toBe('string')
    })
  })
})
