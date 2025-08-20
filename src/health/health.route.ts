/**
 * Health check routes
 * Defines the health check endpoints
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getHealth, getHealthz, getLiveness, getReadiness } from './health.controller'

export const healthRoutes = async (
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> => {
  // Health check endpoint
  fastify.get('/health', {
    schema: {
      description: 'Get application health status',
      tags: ['Health'],
      summary: 'Health Check',
    },
    handler: getHealth,
  })

  // Alternative health endpoint (common convention)
  fastify.get('/healthz', {
    schema: {
      description: 'Get application health status (Kubernetes style)',
      tags: ['Health'],
      summary: 'Health Check (K8s style)',
    },
    handler: getHealthz,
  })

  // Readiness probe endpoint
  fastify.get('/ready', {
    schema: {
      description: 'Check if application is ready to serve requests',
      tags: ['Health'],
      summary: 'Readiness Check',
    },
    handler: getReadiness,
  })

  // Liveness probe endpoint
  fastify.get('/live', {
    schema: {
      description: 'Check if application is alive',
      tags: ['Health'],
      summary: 'Liveness Check',
    },
    handler: getLiveness,
  })
}
