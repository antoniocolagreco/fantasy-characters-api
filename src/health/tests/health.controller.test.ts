/**
 * Health controller unit tests
 * Tests for health check controller functions using centralized test utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, createMockReply } from '../../shared/tests/test-utils'
import { HTTP_STATUS } from '../../shared/constants'

// Mock the health service before importing the controller
vi.mock('../health.service', () => ({
  getHealthStatus: vi.fn(),
  getLivenessStatus: vi.fn(),
  getReadinessStatus: vi.fn(),
}))

// Mock the shared modules
vi.mock('../../shared/errors', () => ({
  createInternalServerError: vi.fn(),
  createErrorResponse: vi.fn(),
}))

import { getHealth, getHealthz, getLiveness, getReadiness } from '../health.controller'
import { getHealthStatus, getLivenessStatus, getReadinessStatus } from '../health.service'
import { createInternalServerError, createErrorResponse } from '../../shared/errors'

describe('Health Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Common health data mock
  const mockHealthData = {
    status: 'healthy' as const,
    version: '1.0.0',
    timestamp: '2024-01-01T00:00:00.000Z',
    uptime: 1000,
    environment: 'test',
    checks: [
      {
        name: 'application',
        status: 'healthy' as const,
        timestamp: '2024-01-01T00:00:00.000Z',
        details: {},
      },
      {
        name: 'database',
        status: 'healthy' as const,
        timestamp: '2024-01-01T00:00:00.000Z',
        details: {},
      },
    ],
  }

  const mockUnhealthyData = {
    ...mockHealthData,
    status: 'unhealthy' as const,
    checks: [
      {
        name: 'application',
        status: 'unhealthy' as const,
        timestamp: '2024-01-01T00:00:00.000Z',
        details: {},
      },
    ],
  }

  describe('getHealth', () => {
    it('should return healthy status with 200', async () => {
      vi.mocked(getHealthStatus).mockResolvedValue(mockHealthData)

      const mockRequest = createMockRequest({ url: '/api/health' })
      const mockReply = createMockReply()

      await getHealth(mockRequest, mockReply)

      expect(getHealthStatus).toHaveBeenCalledWith('comprehensive')
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should return unhealthy status with 500', async () => {
      vi.mocked(getHealthStatus).mockResolvedValue(mockUnhealthyData)

      const mockRequest = createMockRequest({ url: '/api/health' })
      const mockReply = createMockReply()

      await getHealth(mockRequest, mockReply)

      expect(getHealthStatus).toHaveBeenCalledWith('comprehensive')
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(mockReply.send).toHaveBeenCalledWith(mockUnhealthyData)
    })

    it('should handle service errors gracefully', async () => {
      const error = new Error('Health service error')
      vi.mocked(getHealthStatus).mockRejectedValue(error)

      const mockError = new Error('Health check failed')
      Object.assign(mockError, { statusCode: 500, code: 'INTERNAL_SERVER_ERROR' })
      vi.mocked(createInternalServerError).mockReturnValue(mockError)

      const mockErrorResponse = {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Health check failed',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/api/health',
        },
      }
      vi.mocked(createErrorResponse).mockReturnValue(mockErrorResponse)

      const mockRequest = createMockRequest({ url: '/api/health' })
      const mockReply = createMockReply()

      await getHealth(mockRequest, mockReply)

      expect(mockRequest.log.error).toHaveBeenCalledWith({ error }, 'Health check failed')
      expect(createInternalServerError).toHaveBeenCalledWith(
        'Health check failed',
        'Health service error',
      )
      expect(createErrorResponse).toHaveBeenCalledWith(mockError, '/api/health')
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(mockReply.send).toHaveBeenCalledWith(mockErrorResponse)
    })
  })

  describe('getHealthz', () => {
    it('should return healthy status with 200', async () => {
      vi.mocked(getHealthStatus).mockResolvedValue(mockHealthData)

      const mockRequest = createMockRequest({ url: '/api/healthz' })
      const mockReply = createMockReply()

      await getHealthz(mockRequest, mockReply)

      expect(getHealthStatus).toHaveBeenCalledWith('basic')
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should return degraded status with 200', async () => {
      const degradedData = { ...mockHealthData, status: 'degraded' as const }
      vi.mocked(getHealthStatus).mockResolvedValue(degradedData)

      const mockRequest = createMockRequest({ url: '/api/healthz' })
      const mockReply = createMockReply()

      await getHealthz(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(degradedData)
    })

    it('should return unhealthy status with 500', async () => {
      vi.mocked(getHealthStatus).mockResolvedValue(mockUnhealthyData)

      const mockRequest = createMockRequest({ url: '/api/healthz' })
      const mockReply = createMockReply()

      await getHealthz(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(mockReply.send).toHaveBeenCalledWith(mockUnhealthyData)
    })

    it('should handle service errors gracefully', async () => {
      const error = new Error('Healthz service error')
      vi.mocked(getHealthStatus).mockRejectedValue(error)

      const mockError = new Error('Healthz check failed')
      Object.assign(mockError, { statusCode: 500, code: 'INTERNAL_SERVER_ERROR' })
      vi.mocked(createInternalServerError).mockReturnValue(mockError)

      const mockRequest = createMockRequest({ url: '/api/healthz' })
      const mockReply = createMockReply()

      await getHealthz(mockRequest, mockReply)

      expect(mockRequest.log.error).toHaveBeenCalledWith({ error }, 'Healthz check failed')
      expect(createInternalServerError).toHaveBeenCalledWith(
        'Healthz check failed',
        'Healthz service error',
      )
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
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
        checks: [
          {
            name: 'process',
            status: 'healthy' as const,
            timestamp: '2024-01-01T00:00:00.000Z',
            details: {},
          },
        ],
      }

      vi.mocked(getLivenessStatus).mockResolvedValue(livenessData)

      const mockRequest = createMockRequest({ url: '/api/live' })
      const mockReply = createMockReply()

      await getLiveness(mockRequest, mockReply)

      expect(getLivenessStatus).toHaveBeenCalled()
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(livenessData)
    })

    it('should return degraded status with 200 (liveness should rarely fail)', async () => {
      const degradedData = {
        status: 'degraded' as const,
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 1000,
        environment: 'test',
        checks: [
          {
            name: 'process',
            status: 'degraded' as const,
            timestamp: '2024-01-01T00:00:00.000Z',
            details: {},
          },
        ],
      }

      vi.mocked(getLivenessStatus).mockResolvedValue(degradedData)

      const mockRequest = createMockRequest({ url: '/api/live' })
      const mockReply = createMockReply()

      await getLiveness(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(degradedData)
    })

    it('should return unhealthy status with 500', async () => {
      const unhealthyData = {
        ...mockUnhealthyData,
        checks: [
          {
            name: 'process',
            status: 'unhealthy' as const,
            timestamp: '2024-01-01T00:00:00.000Z',
            details: {},
          },
        ],
      }

      vi.mocked(getLivenessStatus).mockResolvedValue(unhealthyData)

      const mockRequest = createMockRequest({ url: '/api/live' })
      const mockReply = createMockReply()

      await getLiveness(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(mockReply.send).toHaveBeenCalledWith(unhealthyData)
    })

    it('should handle service errors gracefully', async () => {
      const error = new Error('Liveness service error')
      vi.mocked(getLivenessStatus).mockRejectedValue(error)

      const mockError = new Error('Liveness check failed')
      Object.assign(mockError, { statusCode: 500, code: 'INTERNAL_SERVER_ERROR' })
      vi.mocked(createInternalServerError).mockReturnValue(mockError)

      const mockRequest = createMockRequest({ url: '/api/live' })
      const mockReply = createMockReply()

      await getLiveness(mockRequest, mockReply)

      expect(mockRequest.log.error).toHaveBeenCalledWith({ error }, 'Liveness check failed')
      expect(createInternalServerError).toHaveBeenCalledWith(
        'Liveness check failed',
        'Liveness service error',
      )
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
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
            details: {},
          },
          {
            name: 'memory',
            status: 'healthy' as const,
            timestamp: '2024-01-01T00:00:00.000Z',
            details: {},
          },
        ],
      }

      vi.mocked(getReadinessStatus).mockResolvedValue(readinessData)

      const mockRequest = createMockRequest({ url: '/api/ready' })
      const mockReply = createMockReply()

      await getReadiness(mockRequest, mockReply)

      expect(getReadinessStatus).toHaveBeenCalled()
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(readinessData)
    })

    it('should return degraded status with 503 (not ready to serve traffic)', async () => {
      const degradedData = {
        status: 'degraded' as const,
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 1000,
        environment: 'test',
        checks: [
          {
            name: 'database',
            status: 'degraded' as const,
            timestamp: '2024-01-01T00:00:00.000Z',
            details: {},
          },
          {
            name: 'memory',
            status: 'healthy' as const,
            timestamp: '2024-01-01T00:00:00.000Z',
            details: {},
          },
        ],
      }

      vi.mocked(getReadinessStatus).mockResolvedValue(degradedData)

      const mockRequest = createMockRequest({ url: '/api/ready' })
      const mockReply = createMockReply()

      await getReadiness(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.SERVICE_UNAVAILABLE)
      expect(mockReply.send).toHaveBeenCalledWith(degradedData)
    })

    it('should return unhealthy status with 503', async () => {
      const unhealthyData = {
        ...mockUnhealthyData,
        checks: [
          {
            name: 'database',
            status: 'unhealthy' as const,
            timestamp: '2024-01-01T00:00:00.000Z',
            details: {},
          },
          {
            name: 'memory',
            status: 'healthy' as const,
            timestamp: '2024-01-01T00:00:00.000Z',
            details: {},
          },
        ],
      }

      vi.mocked(getReadinessStatus).mockResolvedValue(unhealthyData)

      const mockRequest = createMockRequest({ url: '/api/ready' })
      const mockReply = createMockReply()

      await getReadiness(mockRequest, mockReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.SERVICE_UNAVAILABLE)
      expect(mockReply.send).toHaveBeenCalledWith(unhealthyData)
    })

    it('should handle service errors gracefully', async () => {
      const error = new Error('Readiness service error')
      vi.mocked(getReadinessStatus).mockRejectedValue(error)

      const mockError = new Error('Readiness check failed')
      Object.assign(mockError, { statusCode: 500, code: 'INTERNAL_SERVER_ERROR' })
      vi.mocked(createInternalServerError).mockReturnValue(mockError)

      const mockRequest = createMockRequest({ url: '/api/ready' })
      const mockReply = createMockReply()

      await getReadiness(mockRequest, mockReply)

      expect(mockRequest.log.error).toHaveBeenCalledWith({ error }, 'Readiness check failed')
      expect(createInternalServerError).toHaveBeenCalledWith(
        'Readiness check failed',
        'Readiness service error',
      )
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })
  })

  describe('Error handling edge cases', () => {
    it('should handle non-Error objects in error handling', async () => {
      vi.mocked(getHealthStatus).mockRejectedValue('String error')

      const mockError = new Error('Health check failed')
      Object.assign(mockError, { statusCode: 500 })
      vi.mocked(createInternalServerError).mockReturnValue(mockError)

      const mockRequest = createMockRequest({ url: '/api/health' })
      const mockReply = createMockReply()

      await getHealth(mockRequest, mockReply)

      expect(createInternalServerError).toHaveBeenCalledWith('Health check failed', 'Unknown error')
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })

    it('should handle null/undefined errors in error handling', async () => {
      vi.mocked(getHealthStatus).mockRejectedValue(null)

      const mockError = new Error('Health check failed')
      Object.assign(mockError, { statusCode: 500 })
      vi.mocked(createInternalServerError).mockReturnValue(mockError)

      const mockRequest = createMockRequest({ url: '/api/health' })
      const mockReply = createMockReply()

      await getHealth(mockRequest, mockReply)

      expect(createInternalServerError).toHaveBeenCalledWith('Health check failed', 'Unknown error')
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })
  })
})
