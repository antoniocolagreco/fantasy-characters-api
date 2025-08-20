/**
 * Health check controller
 * Handles HTTP requests for health check endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { getHealthStatus, getLivenessStatus, getReadinessStatus } from './health.service'
import { createInternalServerError, createErrorResponse } from '../shared/errors'
import { HTTP_STATUS } from '../shared/constants'

// Standard health check (comprehensive)
export const getHealth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const healthData = await getHealthStatus('comprehensive')

    // Return appropriate HTTP status based on health
    const httpStatus =
      healthData.status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR

    await reply.status(httpStatus).send(healthData)
  } catch (error) {
    request.log.error({ error }, 'Health check failed')

    const appError = createInternalServerError(
      'Health check failed',
      error instanceof Error ? error.message : 'Unknown error',
    ) as Error & {
      statusCode: number
      code?: string
      details?: unknown
    }

    const errorResponse = createErrorResponse(appError, request.url)
    await reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(errorResponse)
  }
}

// Kubernetes-style health check (basic checks without heavy dependencies)
export const getHealthz = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const healthData = await getHealthStatus('basic')

    // Healthz should return 200 for healthy/degraded, 500 only for truly unhealthy
    const httpStatus =
      healthData.status === 'unhealthy' ? HTTP_STATUS.INTERNAL_SERVER_ERROR : HTTP_STATUS.OK

    await reply.status(httpStatus).send(healthData)
  } catch (error) {
    request.log.error({ error }, 'Healthz check failed')

    const appError = createInternalServerError(
      'Healthz check failed',
      error instanceof Error ? error.message : 'Unknown error',
    ) as Error & {
      statusCode: number
      code?: string
      details?: unknown
    }

    const errorResponse = createErrorResponse(appError, request.url)
    await reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(errorResponse)
  }
}

// Liveness probe (minimal check - only process health)
export const getLiveness = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const healthData = await getLivenessStatus()

    // Liveness should almost never fail - only if process is truly dead
    // Return 200 even for degraded memory, 500 only if process check fails
    const httpStatus =
      healthData.status === 'unhealthy' ? HTTP_STATUS.INTERNAL_SERVER_ERROR : HTTP_STATUS.OK

    await reply.status(httpStatus).send(healthData)
  } catch (error) {
    request.log.error({ error }, 'Liveness check failed')

    const appError = createInternalServerError(
      'Liveness check failed',
      error instanceof Error ? error.message : 'Unknown error',
    ) as Error & {
      statusCode: number
      code?: string
      details?: unknown
    }

    const errorResponse = createErrorResponse(appError, request.url)
    await reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(errorResponse)
  }
}

// Readiness probe (external dependencies check)
export const getReadiness = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const healthData = await getReadinessStatus()

    // Readiness uses 503 when not ready to serve traffic (external deps failing)
    // This tells Kubernetes to stop sending traffic but not restart the pod
    const httpStatus =
      healthData.status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE

    await reply.status(httpStatus).send(healthData)
  } catch (error) {
    request.log.error({ error }, 'Readiness check failed')

    const appError = createInternalServerError(
      'Readiness check failed',
      error instanceof Error ? error.message : 'Unknown error',
    ) as Error & {
      statusCode: number
      code?: string
      details?: unknown
    }

    const errorResponse = createErrorResponse(appError, request.url)
    await reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(errorResponse)
  }
}
