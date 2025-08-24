/**
 * Health check routes
 * Defines the health check endpoints with security controls and precise schemas
 */

import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import {
  getHealth,
  getInternalHealth,
  getHealthz,
  getLiveness,
  getReadiness,
} from './health.controller'
import { authenticateUser } from '../auth/auth.middleware'
import { BasicHealthResponseSchema, HealthResponseSchema, HealthErrorSchema } from './health.schema'

export const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Add schemas to fastify for validation and documentation
  fastify.addSchema({
    $id: 'BasicHealthResponse',
    ...BasicHealthResponseSchema,
  })
  fastify.addSchema({
    $id: 'DetailedHealthResponse',
    ...HealthResponseSchema,
  })
  fastify.addSchema({
    $id: 'HealthError',
    ...HealthErrorSchema,
  })

  // Public health check endpoint (minimal information)
  fastify.get('/health', {
    schema: {
      description: 'Get basic application health status (public)',
      tags: ['Health'],
      summary: 'Public Health Check',
      response: {
        200: { $ref: 'BasicHealthResponse#' },
        500: { $ref: 'HealthError#' },
      },
    },
    handler: getHealth,
  })

  // Detailed health check endpoint (requires authentication)
  fastify.get('/health/detailed', {
    preHandler: authenticateUser,
    schema: {
      description: 'Get detailed application health status (requires authentication)',
      tags: ['Health'],
      summary: 'Detailed Health Check',
      security: [{ bearerAuth: [] }],
      response: {
        200: { $ref: 'DetailedHealthResponse#' },
        401: { $ref: 'HealthError#' },
      },
    },
    handler: getInternalHealth,
  })

  // Kubernetes health check endpoints (no authentication for K8s probes)

  // Alternative health endpoint (common convention)
  fastify.get('/healthz', {
    schema: {
      description: 'Get application health status (Kubernetes style)',
      tags: ['Health'],
      summary: 'Health Check (K8s style)',
      response: {
        200: { $ref: 'BasicHealthResponse#' },
        500: { $ref: 'HealthError#' },
      },
    },
    handler: getHealthz,
  })

  // Readiness probe endpoint
  fastify.get('/ready', {
    schema: {
      description: 'Check if application is ready to serve requests',
      tags: ['Health'],
      summary: 'Readiness Check',
      response: {
        200: { $ref: 'BasicHealthResponse#' },
        503: { $ref: 'HealthError#' },
      },
    },
    handler: getReadiness,
  })

  // Liveness probe endpoint
  fastify.get('/live', {
    schema: {
      description: 'Check if application is alive',
      tags: ['Health'],
      summary: 'Liveness Check',
      response: {
        200: { $ref: 'BasicHealthResponse#' },
        500: { $ref: 'HealthError#' },
      },
    },
    handler: getLiveness,
  })
}
