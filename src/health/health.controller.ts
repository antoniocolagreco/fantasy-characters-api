/**
 * Health check controller
 * Handles HTTP requests for health check endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { getHealthStatus } from './health.service.js'
import { createInternalServerError, createErrorResponse } from '../shared/errors.js'
import { HTTP_STATUS } from '../shared/constants.js'

// Health check controller function
export const getHealth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const healthData = await getHealthStatus()

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
