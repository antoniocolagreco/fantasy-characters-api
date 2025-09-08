import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { generateUUIDv7 } from '@/shared/utils/uuid'

/**
 * Enhanced logging configuration plugin
 * Configures request ID generation and log redaction
 */
function loggingPlugin(fastify: FastifyInstance, _opts: unknown, done: () => void): void {
    // Confirm plugin registration at startup
    fastify.log.info({ plugin: 'logging-plugin' }, 'Logging plugin registered')
    // Add request correlation ID if not already present
    fastify.addHook('onRequest', (request, reply, hookDone) => {
        if (!request.id) {
            request.id = generateUUIDv7()
        }
        // Expose correlation id to clients early
        reply.header('x-request-id', request.id)
        // Mark start time for response time calculation (high-resolution)
        request.requestStartTime = process.hrtime.bigint()
        hookDone()
    })

    // Add response time logging
    fastify.addHook('onResponse', (request, reply, hookDone) => {
        const start = request.requestStartTime
        let responseTimeMs: number | undefined
        if (typeof start === 'bigint') {
            const diff = process.hrtime.bigint() - start
            responseTimeMs = Number(diff / 1_000_000n)
        }
        request.log.info(
            {
                source: 'logging-plugin',
                reqId: request.id,
                requestId: request.id,
                method: request.method,
                url: request.url,
                statusCode: reply.statusCode,
                responseTime: responseTimeMs !== undefined ? `${responseTimeMs}ms` : undefined,
                userAgent: request.headers['user-agent'],
                ip: request.ip,
                userId: request.user?.id,
            },
            'Request completed'
        )
        hookDone()
    })

    // Log errors with correlation IDs
    fastify.addHook('onError', (request, _reply, error, hookDone) => {
        request.log.error(
            {
                requestId: request.id,
                error: {
                    message: error.message,
                    stack: error.stack,
                },
                method: request.method,
                url: request.url,
                userId: request.user?.id,
            },
            'Request error occurred'
        )
        hookDone()
    })

    // Signal plugin is ready
    done()
}

export default fp(loggingPlugin, {
    name: 'logging-plugin',
})
