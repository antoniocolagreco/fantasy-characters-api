import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { HealthController } from '../controllers/healthController.js';
import {
  HealthCheckResponseSchema,
  ErrorResponseSchema,
} from '../types/api.js';

export async function healthRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const healthController = new HealthController();

  // Health check endpoint
  fastify.get('/health', {
    schema: {
      description: 'Get API health status',
      tags: ['Health'],
      summary: 'Health Check',
      response: {
        200: {
          description: 'API is healthy',
          ...HealthCheckResponseSchema,
        },
        503: {
          description: 'API is unhealthy',
          ...ErrorResponseSchema,
        },
      },
    },
    handler: healthController.getHealth.bind(healthController),
  });

  // Additional health endpoints for more detailed monitoring
  fastify.get('/health/ready', {
    schema: {
      description: 'Check if API is ready to serve requests',
      tags: ['Health'],
      summary: 'Readiness Check',
      response: {
        200: {
          description: 'API is ready',
          type: 'object',
          properties: {
            status: { type: 'string', const: 'ready' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        503: {
          description: 'API is not ready',
          ...ErrorResponseSchema,
        },
      },
    },
    handler: async (request, reply) => {
      try {
        // In future chapters, we can add more sophisticated readiness checks
        // like database connectivity, external service availability, etc.
        reply.code(200).send({
          status: 'ready',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        request.log.error('Readiness check failed:', error);
        reply.code(503).send({
          error: {
            code: 'NOT_READY',
            message: 'API is not ready to serve requests',
            timestamp: new Date().toISOString(),
            path: request.url,
          },
        });
      }
    },
  });

  fastify.get('/health/live', {
    schema: {
      description: 'Check if API is alive (basic liveness probe)',
      tags: ['Health'],
      summary: 'Liveness Check',
      response: {
        200: {
          description: 'API is alive',
          type: 'object',
          properties: {
            status: { type: 'string', const: 'alive' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      // Simple liveness check - if we can respond, we're alive
      reply.code(200).send({
        status: 'alive',
        timestamp: new Date().toISOString(),
      });
    },
  });
}
