import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

export default fp(async (fastify: FastifyInstance) => {
    await fastify.register(rateLimit, {
        global: true,
        keyGenerator: (request: FastifyRequest) => {
            const userId = request.user?.id
            return userId ? `user:${userId}` : `ip:${request.ip}`
        },
        max: (_request: FastifyRequest, key: string) => {
            // Authenticated users get higher limits
            return key.startsWith('user:') ? 500 : 150
        },
        timeWindow: '1 minute',
        addHeaders: {
            'x-ratelimit-limit': true,
            'x-ratelimit-remaining': true,
            'x-ratelimit-reset': true,
        },
        errorResponseBuilder: (request: FastifyRequest, context) => {
            return {
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests',
                    status: 429,
                    retryAfter: context.after,
                },
                requestId: request.id,
                timestamp: new Date().toISOString(),
            }
        },
    })

    // Pre-defined rate limit configurations for different endpoint types
    fastify.decorate('rateLimitConfigs', {
        auth: {
            login: { max: 5, timeWindow: '1 minute' },
            register: { max: 3, timeWindow: '1 minute' },
            forgotPassword: { max: 3, timeWindow: '1 minute' },
            refreshToken: { max: 10, timeWindow: '1 minute' },
        },
        crud: {
            create: { max: 30, timeWindow: '1 minute' },
            update: { max: 50, timeWindow: '1 minute' },
            delete: { max: 15, timeWindow: '1 minute' },
            batch: { max: 5, timeWindow: '1 minute' },
        },
        expensive: {
            search: { max: 40, timeWindow: '1 minute' },
            upload: { max: 15, timeWindow: '1 minute' },
            analytics: { max: 20, timeWindow: '1 minute' },
        },
    })
})

declare module 'fastify' {
    interface FastifyInstance {
        rateLimitConfigs: {
            auth: {
                login: { max: number; timeWindow: string }
                register: { max: number; timeWindow: string }
                forgotPassword: { max: number; timeWindow: string }
                refreshToken: { max: number; timeWindow: string }
            }
            crud: {
                create: { max: number; timeWindow: string }
                update: { max: number; timeWindow: string }
                delete: { max: number; timeWindow: string }
                batch: { max: number; timeWindow: string }
            }
            expensive: {
                search: { max: number; timeWindow: string }
                upload: { max: number; timeWindow: string }
                analytics: { max: number; timeWindow: string }
            }
        }
    }
}
