/**
 * Health controller unit tests
 * Tests for health check controller functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FastifyRequest, FastifyReply } from 'fastify'

// Mock the health service before importing the controller
vi.mock('./health.service.js', () => ({
  getHealthStatus: vi.fn(),
}))

import { getHealth } from './health.controller.js'
import { getHealthStatus } from './health.service.js'

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

      const mockRequest = {
        log: { error: vi.fn() },
        url: '/health',
      } as unknown as FastifyRequest

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as FastifyReply

      await getHealth(mockRequest, mockReply)

      expect(mockRequest.log.error).toHaveBeenCalled()
      expect(mockReply.status).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalled()
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

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as FastifyReply

      await getHealth(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith(unhealthyData)
    })
  })

  describe('Function structure', () => {
    it('should export getHealth function', () => {
      expect(getHealth).toBeDefined()
      expect(typeof getHealth).toBe('function')
    })

    it('should be an async function', () => {
      expect(getHealth.constructor.name).toBe('AsyncFunction')
    })
  })
})
