import { describe, expect, it, vi, beforeEach } from 'vitest'
import { FastifyRequest, FastifyReply } from 'fastify'
import { getHealth, getHealthz, getLiveness, getReadiness } from '../health.controller'
import * as healthService from '../health.service'
import * as errors from '../../shared/errors'
import { HTTP_STATUS } from '../../shared/constants'

// Mock the health service
vi.mock('../health.service')
vi.mock('../../shared/errors')

const mockedHealthService = vi.mocked(healthService)
const mockedErrors = vi.mocked(errors)

describe('Health Controller', () => {
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      log: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        fatal: vi.fn(),
        trace: vi.fn(),
        child: vi.fn(),
        level: 'info',
        silent: vi.fn(),
        msgPrefix: '',
      },
      url: '/health',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    }

    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockResolvedValue(undefined),
      header: vi.fn().mockReturnThis(),
    }
  })

  describe('getHealth', () => {
    it('should return 200 when health status is healthy', async () => {
      const mockHealthData = {
        status: 'healthy' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getPublicHealthStatus.mockResolvedValue(mockHealthData)

      await getHealth(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockedHealthService.getPublicHealthStatus).toHaveBeenCalledWith()
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should return 500 when health status is unhealthy', async () => {
      const mockHealthData = {
        status: 'unhealthy' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getPublicHealthStatus.mockResolvedValue(mockHealthData)

      await getHealth(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockedHealthService.getPublicHealthStatus).toHaveBeenCalledWith()
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should return 200 when health status is degraded', async () => {
      const mockHealthData = {
        status: 'degraded' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getPublicHealthStatus.mockResolvedValue(mockHealthData)

      await getHealth(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockedHealthService.getPublicHealthStatus).toHaveBeenCalledWith()
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should handle service errors and return 500', async () => {
      const mockError = new Error('Health service error')
      const mockAppError = {
        statusCode: 500,
        message: 'Health check failed',
        code: 'INTERNAL_ERROR',
      }
      const mockErrorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Health check failed',
          details: undefined,
          timestamp: '2023-01-01T00:00:00.000Z',
          path: '/health',
        },
      }

      mockedHealthService.getPublicHealthStatus.mockRejectedValue(mockError)
      mockedErrors.createInternalServerError.mockReturnValue(mockAppError as any)
      mockedErrors.createErrorResponse.mockReturnValue(mockErrorResponse)

      await getHealth(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.log?.error).toHaveBeenCalledWith(
        { error: mockError },
        'Public health check failed',
      )
      expect(mockedErrors.createInternalServerError).toHaveBeenCalledWith(
        'Health check failed',
        'Health service error',
      )
      expect(mockedErrors.createErrorResponse).toHaveBeenCalledWith(mockAppError, '/health')
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(mockReply.send).toHaveBeenCalledWith(mockErrorResponse)
    })

    it('should handle unknown errors', async () => {
      const mockError = 'Unknown error'
      const mockAppError = {
        statusCode: 500,
        message: 'Health check failed',
        code: 'INTERNAL_ERROR',
      }
      const mockErrorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Health check failed',
          details: undefined,
          timestamp: '2023-01-01T00:00:00.000Z',
          path: '/health',
        },
      }

      mockedHealthService.getPublicHealthStatus.mockRejectedValue(mockError)
      mockedErrors.createInternalServerError.mockReturnValue(mockAppError as any)
      mockedErrors.createErrorResponse.mockReturnValue(mockErrorResponse)

      await getHealth(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.log?.error).toHaveBeenCalledWith(
        { error: mockError },
        'Public health check failed',
      )
      expect(mockedErrors.createInternalServerError).toHaveBeenCalledWith(
        'Health check failed',
        'Unknown error',
      )
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })
  })

  describe('getHealthz', () => {
    it('should return 200 when health status is healthy', async () => {
      const mockHealthData = {
        status: 'healthy' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getBasicHealthStatus.mockResolvedValue(mockHealthData)

      await getHealthz(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockedHealthService.getBasicHealthStatus).toHaveBeenCalledWith()
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should return 200 when health status is degraded', async () => {
      const mockHealthData = {
        status: 'degraded' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getBasicHealthStatus.mockResolvedValue(mockHealthData)

      await getHealthz(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should return 500 when health status is unhealthy', async () => {
      const mockHealthData = {
        status: 'unhealthy' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getBasicHealthStatus.mockResolvedValue(mockHealthData)

      await getHealthz(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should handle service errors', async () => {
      const mockError = new Error('Healthz service error')

      mockedHealthService.getBasicHealthStatus.mockRejectedValue(mockError)

      await getHealthz(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.log?.error).toHaveBeenCalledWith(
        { error: mockError },
        'Healthz check failed',
      )
    })
  })

  describe('getLiveness', () => {
    it('should return 200 when liveness status is healthy', async () => {
      const mockHealthData = {
        status: 'healthy' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getLivenessStatus.mockResolvedValue(mockHealthData)

      await getLiveness(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockedHealthService.getLivenessStatus).toHaveBeenCalledWith()
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should return 200 when liveness status is degraded', async () => {
      const mockHealthData = {
        status: 'degraded' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getLivenessStatus.mockResolvedValue(mockHealthData)

      await getLiveness(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should return 500 when liveness status is unhealthy', async () => {
      const mockHealthData = {
        status: 'unhealthy' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getLivenessStatus.mockResolvedValue(mockHealthData)

      await getLiveness(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should handle service errors and return 500', async () => {
      const mockError = new Error('Liveness service error')

      mockedHealthService.getLivenessStatus.mockRejectedValue(mockError)

      await getLiveness(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.log?.error).toHaveBeenCalledWith(
        { error: mockError },
        'Liveness check failed',
      )
    })
  })

  describe('getReadiness', () => {
    it('should return 200 when readiness status is healthy', async () => {
      const mockHealthData = {
        status: 'healthy' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getReadinessStatus.mockResolvedValue(mockHealthData)

      await getReadiness(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockedHealthService.getReadinessStatus).toHaveBeenCalledWith()
      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.OK)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should return 503 when readiness status is degraded', async () => {
      const mockHealthData = {
        status: 'degraded' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getReadinessStatus.mockResolvedValue(mockHealthData)

      await getReadiness(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.SERVICE_UNAVAILABLE)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should return 503 when readiness status is unhealthy', async () => {
      const mockHealthData = {
        status: 'unhealthy' as const,
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      mockedHealthService.getReadinessStatus.mockResolvedValue(mockHealthData)

      await getReadiness(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.status).toHaveBeenCalledWith(HTTP_STATUS.SERVICE_UNAVAILABLE)
      expect(mockReply.send).toHaveBeenCalledWith(mockHealthData)
    })

    it('should handle service errors and return 500', async () => {
      const mockError = new Error('Readiness service error')

      mockedHealthService.getReadinessStatus.mockRejectedValue(mockError)

      await getReadiness(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockRequest.log?.error).toHaveBeenCalledWith(
        { error: mockError },
        'Readiness check failed',
      )
    })
  })
})
