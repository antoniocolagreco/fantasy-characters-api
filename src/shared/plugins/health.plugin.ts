import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import prismaService from '../../infrastructure/database/prisma.service'
import { HealthResponseSchema, ReadinessResponseSchema } from '../schemas/health.schema'

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
                description: 'Basic health check for monitoring and load balancers',
                response: {
                    200: HealthResponseSchema,
                    503: HealthResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                // Quick database connectivity check (skip in test environment)
                if (process.env.NODE_ENV !== 'test' && process.env.SKIP_DB_CHECK !== 'true') {
                    await Promise.race([
                        prismaService.$queryRaw`SELECT 1`,
                        new Promise((_resolve, reject) =>
                            globalThis.setTimeout(
                                () => reject(new Error('DB health timeout')),
                                3000
                            )
                        ),
                    ])
                }

                reply.header('Cache-Control', 'no-store')
                return reply.status(200).send({
                    status: 'ok' as const,
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                })
            } catch (error) {
                request.log.warn({ error }, 'Health check failed')
                reply.header('Cache-Control', 'no-store')
                return reply.status(503).send({
                    status: 'error' as const,
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    error: 'Database connection failed',
                })
            }
        }
    )

    // Readiness check endpoint
    fastify.get(
        '/api/ready',
        {
            schema: {
                tags: ['Health'],
                summary: 'Readiness check endpoint',
                description: 'Returns whether the service is ready to accept traffic',
                response: {
                    200: ReadinessResponseSchema,
                    503: ReadinessResponseSchema,
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const startTime = Date.now()
            let isReady = true

            // Check database connectivity
            let dbStatus: 'ready' | 'not_ready' = 'not_ready'
            let dbResponseTime = 0

            if (process.env.NODE_ENV === 'test' || process.env.SKIP_DB_CHECK === 'true') {
                dbStatus = 'ready'
                dbResponseTime = 0
            } else {
                try {
                    const dbStartTime = Date.now()
                    await Promise.race([
                        prismaService.$queryRaw`SELECT 1`,
                        new Promise((_resolve, reject) =>
                            globalThis.setTimeout(
                                () => reject(new Error('DB readiness timeout')),
                                5000
                            )
                        ),
                    ])
                    dbResponseTime = Date.now() - dbStartTime
                    dbStatus = 'ready'
                } catch (error) {
                    request.log.warn({ error }, 'Database readiness check failed')
                    dbResponseTime = Date.now() - startTime
                    isReady = false
                }
            }

            // Check migrations (simplified check - in real app would check _prisma_migrations table)
            let migrationsStatus: 'ready' | 'not_ready' = 'ready'
            if (process.env.NODE_ENV === 'production') {
                try {
                    // This will fail if migrations haven't been run
                    await prismaService.$queryRaw`SELECT 1 FROM "User" LIMIT 1`
                } catch (error) {
                    request.log.warn({ error }, 'Migration readiness check failed')
                    migrationsStatus = 'not_ready'
                    isReady = false
                }
            }

            const readinessData = {
                status: isReady ? ('ready' as const) : ('not_ready' as const),
                timestamp: new Date().toISOString(),
                checks: {
                    database: {
                        status: dbStatus,
                        responseTime: dbResponseTime,
                    },
                    migrations: {
                        status: migrationsStatus,
                    },
                },
            }

            const statusCode = isReady ? 200 : 503
            return reply.status(statusCode).send(readinessData)
        }
    )

    // Signal plugin is ready
    done()
}
