import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { generateUUIDv7 } from '../utils/uuid'

/**
 * Enhanced logging configuration plugin
 * Configures request ID generation and log redaction
 */
function loggingPlugin(fastify: FastifyInstance, _opts: unknown, done: () => void): void {
    // Add request correlation ID if not already present
    fastify.addHook('onRequest', (request, _reply, hookDone) => {
        if (!request.id) {
            request.id = generateUUIDv7()
        }
        hookDone()
    })

    // Add response time logging
    fastify.addHook('onResponse', (request, reply, hookDone) => {
        const responseTime = reply.elapsedTime
        request.log.info(
            {
                requestId: request.id,
                method: request.method,
                url: request.url,
                statusCode: reply.statusCode,
                responseTime: `${responseTime}ms`,
                userAgent: request.headers['user-agent'],
                ip: request.ip,
                userId: (request as { user?: { id: string } }).user?.id,
            },
            'Request completed'
        )
        hookDone()
    })

    // Expose correlation id to clients
    fastify.addHook('onSend', (request, reply, _payload, hookDone) => {
        if (request.id) {
            reply.header('x-request-id', String(request.id))
        }
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
                    code: error.code,
                },
                method: request.method,
                url: request.url,
                userId: (request as { user?: { id: string } }).user?.id,
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
