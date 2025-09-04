import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { Type } from '@sinclair/typebox'
import prismaService from '../../infrastructure/database/prisma.service'

const HealthResponseSchema = Type.Object({
    status: Type.Literal('healthy'),
    timestamp: Type.String({ format: 'date-time' }),
    version: Type.String(),
    uptime: Type.Number(),
    environment: Type.String(),
    database: Type.Object({
        status: Type.Union([Type.Literal('connected'), Type.Literal('disconnected')]),
        responseTime: Type.Number(),
    }),
})

/**
 * Health check plugin
 */
export function healthCheckPlugin(
    fastify: FastifyInstance,
    _opts: unknown,
    done: () => void
): void {
    fastify.get(
        '/api/health',
        {
            schema: {
                tags: ['Health'],
                summary: 'Health check endpoint',
                description: 'Returns the health status of the API and its dependencies',
                response: {
                    200: HealthResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const startTime = Date.now()

            // Check database connectivity (skip in test to keep suite fast/stable)
            let databaseStatus: 'connected' | 'disconnected' = 'disconnected'
            let databaseResponseTime = 0

            if (process.env.NODE_ENV === 'test' || process.env.SKIP_DB_CHECK === 'true') {
                databaseStatus = 'disconnected'
                databaseResponseTime = 0
            } else {
                try {
                    const dbStartTime = Date.now()
                    // Avoid hanging when DB is unavailable: cap to ~3s
                    await Promise.race([
                        prismaService.$queryRaw`SELECT 1`,
                        new Promise((_resolve, reject) =>
                            globalThis.setTimeout(
                                () => reject(new Error('DB health timeout')),
                                3000
                            )
                        ),
                    ])
                    databaseResponseTime = Date.now() - dbStartTime
                    databaseStatus = 'connected'
                } catch (error) {
                    request.log.warn({ error }, 'Database health check failed')
                    databaseResponseTime = Date.now() - startTime
                }
            }

            const healthData = {
                status: 'healthy' as const,
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                uptime: process.uptime(),
                environment: process.env.NODE_ENV ?? 'development',
                database: {
                    status: databaseStatus,
                    responseTime: databaseResponseTime,
                },
            }

            return reply.status(200).send(healthData)
        }
    )

    // Signal plugin is ready
    done()
}
