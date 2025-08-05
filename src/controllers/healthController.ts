import { FastifyRequest, FastifyReply } from 'fastify';
import { HealthCheckResponse } from '../types/api.js';
import { config } from '../config/environment.js';

export class HealthController {
  /**
   * Get API health status
   * Returns comprehensive health information including system metrics
   */
  async getHealth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Convert bytes to MB for better readability
      const memoryUsedMB =
        Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;
      const memoryTotalMB =
        Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100;
      const memoryPercentage = Math.round((memoryUsedMB / memoryTotalMB) * 100);

      const healthResponse: HealthCheckResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.NODE_ENV,
        uptime: Math.round(uptime * 100) / 100,
        memory: {
          used: memoryUsedMB,
          total: memoryTotalMB,
          percentage: memoryPercentage,
        },
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid,
        },
      };

      reply.code(200).send(healthResponse);
    } catch (error) {
      request.log.error('Health check failed:', error);

      reply.code(503).send({
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      });
    }
  }
}
