/**
 * Health check controller
 * Handles HTTP requests for health check endpoints with security considerations
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import {
  getPublicHealthStatus,
  getInternalHealthStatus,
  getLivenessStatus,
  getReadinessStatus,
  getBasicHealthStatus,
} from './health.service'
import { createInternalServerError, createErrorResponse } from '../shared/errors'
import { HTTP_STATUS } from '../shared/constants'
import { environment } from '../shared/config'

// Helper function to add security headers conditionally based on environment
const addSecurityHeaders = (reply: FastifyReply): void => {
  // Always add cache control headers for health endpoints
  reply.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  reply.header('X-Robots-Tag', 'noindex, nofollow')

  // Only add X-Content-Type-Options if not in test environment (same as app-level helmet config)
  if (environment.NODE_ENV !== 'test') {
    reply.header('X-Content-Type-Options', 'nosniff')
  }
}

// Public health check (minimal information)
export const getHealth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    // Log health check access for security monitoring
    request.log.info(
      {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        endpoint: request.url,
      },
      'Public health check accessed',
    )

    const healthData = await getPublicHealthStatus()

    // Return appropriate HTTP status based on health
    const httpStatus =
      healthData.status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR

    // Add security headers (conditionally based on environment)
    addSecurityHeaders(reply)

    await reply.status(httpStatus).send(healthData)
  } catch (error) {
    request.log.error({ error }, 'Public health check failed')

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

// Internal health check (detailed information - requires authentication)
export const getInternalHealth = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    // Log internal health check access for security monitoring
    request.log.warn(
      {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        endpoint: request.url,
        user: (request as { user?: { id: string } }).user?.id || 'anonymous',
      },
      'Internal health check accessed',
    )

    const healthData = await getInternalHealthStatus()

    // Return appropriate HTTP status based on health
    const httpStatus =
      healthData.status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR

    // Add security headers (conditionally based on environment)
    addSecurityHeaders(reply)

    await reply.status(httpStatus).send(healthData)
  } catch (error) {
    request.log.error({ error }, 'Internal health check failed')

    const appError = createInternalServerError(
      'Internal health check failed',
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
    const healthData = await getBasicHealthStatus()

    // Healthz should return 200 for healthy/degraded, 500 only for truly unhealthy
    const httpStatus =
      healthData.status === 'unhealthy' ? HTTP_STATUS.INTERNAL_SERVER_ERROR : HTTP_STATUS.OK

    // Add security headers (conditionally based on environment)
    addSecurityHeaders(reply)

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

    // Add security headers (conditionally based on environment)
    addSecurityHeaders(reply)

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

    // Add security headers (conditionally based on environment)
    addSecurityHeaders(reply)

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
