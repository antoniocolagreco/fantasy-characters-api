/**
 * Health controller unit tests
 * Tests for health check controller functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FastifyRequest, FastifyReply } from 'fastify'

// Mock the health service before importing the controller
vi.mock('@/health/health.service.js', () => ({
  getHealthStatus: vi.fn(),
  getLivenessStatus: vi.fn(),
  getReadinessStatus: vi.fn(),
}))

import { getHealth, getHealthz, getLiveness, getReadiness } from '@/health/health.controller.js'
import { getHealthStatus, getLivenessStatus, getReadinessStatus } from '@/health/health.service.js'

describe('Health Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getHealth', () => {
    it('should return health status successfully', async () => {
      const healthData = {
        status: 'healthy' as const,
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 1000,
        environment: 'test',
        checks: [],
      }

      vi.mocked(getHealthStatus).mockResolvedValue(healthData)

      const mockRequest = {
        log: { error: vi.fn() },
        url: '/health',
      } as unknown as FastifyRequest

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as FastifyReply

      await getHealth(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith(healthData)
    })

    it('should handle service errors gracefully', async () => {
      vi.mocked(getHealthStatus).mockRejectedValue(new Error('Service error'))

      const mockLogError = vi.fn()
      const mockRequest = {
        log: { error: mockLogError },
        url: '/health',
      } as unknown as FastifyRequest

      const mockStatus = vi.fn().mockReturnThis()
      const mockSend = vi.fn()
      const mockReply = {
        status: mockStatus,
        send: mockSend,
      } as unknown as FastifyReply

      await getHealth(mockRequest, mockReply)

      expect(mockLogError).toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalled()
    })

    it('should return 500 status for unhealthy service', async () => {
      const unhealthyData = {
        status: 'unhealthy' as const,
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 1000,
        environment: 'test',
        checks: [],
      }

      vi.mocked(getHealthStatus).mockResolvedValue(unhealthyData)

      const mockRequest = {
        log: { error: vi.fn() },
        url: '/health',
      } as unknown as FastifyRequest

      const mockStatus = vi.fn().mockReturnThis()
      const mockSend = vi.fn()
      const mockReply = {
        status: mockStatus,
        send: mockSend,
      } as unknown as FastifyReply

      await getHealth(mockRequest, mockReply)

      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalledWith(unhealthyData)
    })
  })

  describe('getHealthz', () => {
    it('should return health status successfully', async () => {
      const healthData = {
        status: 'healthy' as const,
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 1000,
        environment: 'test',
        checks: [],
      }

      vi.mocked(getHealthStatus).mockResolvedValue(healthData)

      const mockRequest = {
        log: { error: vi.fn() },
        url: '/healthz',
      } as unknown as FastifyRequest

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as FastifyReply

      await getHealthz(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith(healthData)
    })

    it('should handle service errors gracefully', async () => {
      vi.mocked(getHealthStatus).mockRejectedValue(new Error('Service error'))

      const mockLogError = vi.fn()
      const mockRequest = {
        log: { error: mockLogError },
        url: '/healthz',
      } as unknown as FastifyRequest

      const mockStatus = vi.fn().mockReturnThis()
      const mockSend = vi.fn()
      const mockReply = {
        status: mockStatus,
        send: mockSend,
      } as unknown as FastifyReply

      await getHealthz(mockRequest, mockReply)

      expect(mockLogError).toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalled()
    })
  })

  describe('getLiveness', () => {
    it('should return liveness status successfully', async () => {
      const livenessData = {
        status: 'healthy' as const,
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 1000,
        environment: 'test',
        checks: [],
      }

      vi.mocked(getLivenessStatus).mockResolvedValue(livenessData)

      const mockRequest = {
        log: { error: vi.fn() },
        url: '/live',
      } as unknown as FastifyRequest

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as FastifyReply

      await getLiveness(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith(livenessData)
    })

    it('should handle service errors gracefully', async () => {
      vi.mocked(getLivenessStatus).mockRejectedValue(new Error('Service error'))

      const mockLogError = vi.fn()
      const mockRequest = {
        log: { error: mockLogError },
        url: '/live',
      } as unknown as FastifyRequest

      const mockStatus = vi.fn().mockReturnThis()
      const mockSend = vi.fn()
      const mockReply = {
        status: mockStatus,
        send: mockSend,
      } as unknown as FastifyReply

      await getLiveness(mockRequest, mockReply)

      expect(mockLogError).toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalled()
    })

    it('should return 500 status for unhealthy liveness check', async () => {
      const unhealthyData = {
        status: 'unhealthy' as const,
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 1000,
        environment: 'test',
        checks: [],
      }

      vi.mocked(getLivenessStatus).mockResolvedValue(unhealthyData)

      const mockRequest = {
        log: { error: vi.fn() },
        url: '/live',
      } as unknown as FastifyRequest

      const mockStatus = vi.fn().mockReturnThis()
      const mockSend = vi.fn()
      const mockReply = {
        status: mockStatus,
        send: mockSend,
      } as unknown as FastifyReply

      await getLiveness(mockRequest, mockReply)

      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalledWith(unhealthyData)
    })
  })

  describe('getReadiness', () => {
    it('should return readiness status successfully', async () => {
      const readinessData = {
        status: 'healthy' as const,
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 1000,
        environment: 'test',
        checks: [
          {
            name: 'database',
            status: 'healthy' as const,
            timestamp: '2024-01-01T00:00:00.000Z',
            details: { responseTime: 10 },
          },
          {
            name: 'memory',
            status: 'healthy' as const,
            timestamp: '2024-01-01T00:00:00.000Z',
            details: { usage: 50 },
          },
        ],
      }

      vi.mocked(getReadinessStatus).mockResolvedValue(readinessData)

      const mockRequest = {
        log: { error: vi.fn() },
        url: '/ready',
      } as unknown as FastifyRequest

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as FastifyReply

      await getReadiness(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith(readinessData)
    })

    it('should handle service errors gracefully', async () => {
      vi.mocked(getReadinessStatus).mockRejectedValue(new Error('Service error'))

      const mockLogError = vi.fn()
      const mockRequest = {
        log: { error: mockLogError },
        url: '/ready',
      } as unknown as FastifyRequest

      const mockStatus = vi.fn().mockReturnThis()
      const mockSend = vi.fn()
      const mockReply = {
        status: mockStatus,
        send: mockSend,
      } as unknown as FastifyReply

      await getReadiness(mockRequest, mockReply)

      expect(mockLogError).toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalled()
    })

    it('should return 503 status for not ready service', async () => {
      const notReadyData = {
        status: 'unhealthy' as const,
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 1000,
        environment: 'test',
        checks: [
          {
            name: 'database',
            status: 'unhealthy' as const,
            timestamp: '2024-01-01T00:00:00.000Z',
            details: { responseTime: 5000 },
          },
        ],
      }

      vi.mocked(getReadinessStatus).mockResolvedValue(notReadyData)

      const mockRequest = {
        log: { error: vi.fn() },
        url: '/ready',
      } as unknown as FastifyRequest

      const mockStatus = vi.fn().mockReturnThis()
      const mockSend = vi.fn()
      const mockReply = {
        status: mockStatus,
        send: mockSend,
      } as unknown as FastifyReply

      await getReadiness(mockRequest, mockReply)

      expect(mockStatus).toHaveBeenCalledWith(503)
      expect(mockSend).toHaveBeenCalledWith(notReadyData)
    })
  })

  describe('Function exports and structure', () => {
    it('should export all controller functions', () => {
      expect(getHealth).toBeDefined()
      expect(getHealthz).toBeDefined()
      expect(getLiveness).toBeDefined()
      expect(getReadiness).toBeDefined()

      expect(typeof getHealth).toBe('function')
      expect(typeof getHealthz).toBe('function')
      expect(typeof getLiveness).toBe('function')
      expect(typeof getReadiness).toBe('function')
    })

    it('should have async functions', () => {
      expect(getHealth.constructor.name).toBe('AsyncFunction')
      expect(getHealthz.constructor.name).toBe('AsyncFunction')
      expect(getLiveness.constructor.name).toBe('AsyncFunction')
      expect(getReadiness.constructor.name).toBe('AsyncFunction')
    })
  })
})
