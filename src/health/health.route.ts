/**
 * Health check routes
 * Defines the health check endpoints with security controls and precise schemas
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import {
  getHealth,
  getInternalHealth,
  getHealthz,
  getLiveness,
  getReadiness,
} from './health.controller'
import { authenticateUser } from '../auth/auth.middleware'
import { BasicHealthResponseSchema, HealthResponseSchema, HealthErrorSchema } from './health.schema'

export const healthRoutes = async (
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> => {
  // Public health check endpoint (minimal information)
  fastify.get('/health', {
    schema: {
      description: 'Get basic application health status (public)',
      tags: ['Health'],
      summary: 'Public Health Check',
      response: {
        200: BasicHealthResponseSchema,
        500: HealthErrorSchema,
      },
    },
    handler: getHealth,
  })

  // Internal health check endpoint (detailed information - requires authentication)
  fastify.get('/internal/health', {
    preHandler: authenticateUser,
    schema: {
      description: 'Get detailed application health status (internal - requires authentication)',
      tags: ['Health'],
      summary: 'Internal Health Check',
      security: [{ bearerAuth: [] }],
      response: {
        200: HealthResponseSchema,
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        500: HealthErrorSchema,
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
        200: BasicHealthResponseSchema,
        500: HealthErrorSchema,
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
        200: HealthResponseSchema,
        500: HealthErrorSchema,
        503: HealthErrorSchema,
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
        200: HealthResponseSchema,
        500: HealthErrorSchema,
      },
    },
    handler: getLiveness,
  })
}
