/**
 * Health check routes
 * Defines the health check endpoints with security controls
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
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
            timestamp: { type: 'string', format: 'date-time' },
          },
          required: ['status', 'timestamp'],
        },
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
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            environment: { type: 'string' },
            checks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
                  timestamp: { type: 'string', format: 'date-time' },
                  details: { type: 'object' },
                },
                required: ['name', 'status', 'timestamp'],
              },
            },
          },
          required: ['status', 'timestamp'],
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
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
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
            timestamp: { type: 'string', format: 'date-time' },
          },
          required: ['status', 'timestamp'],
        },
        500: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            error: { type: 'string' },
          },
        },
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
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ready'] },
            timestamp: { type: 'string', format: 'date-time' },
          },
          required: ['status', 'timestamp'],
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['not ready'] },
            timestamp: { type: 'string', format: 'date-time' },
            error: { type: 'string' },
          },
        },
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
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['alive'] },
            timestamp: { type: 'string', format: 'date-time' },
          },
          required: ['status', 'timestamp'],
        },
        500: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['dead'] },
            timestamp: { type: 'string', format: 'date-time' },
            error: { type: 'string' },
          },
        },
      },
    },
    handler: getLiveness,
  })
}
