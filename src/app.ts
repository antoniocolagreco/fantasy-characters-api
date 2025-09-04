import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import Fastify, { type FastifyInstance } from 'fastify'
import { config } from './infrastructure/config'
import { compressionPlugin } from './shared/plugins/compression.plugin'
import corsPlugin from './shared/plugins/cors.plugin'
import { errorHandlerPlugin } from './shared/plugins/error-handler.plugin'
import { healthCheckPlugin } from './shared/plugins/health.plugin'
import helmetPlugin from './shared/plugins/helmet.plugin'
import loggingPlugin from './shared/plugins/logging.plugin'
import { multipartPlugin } from './shared/plugins/multipart.plugin'
import rateLimitPlugin from './shared/plugins/rate-limit.plugin'
import sanitizationPlugin from './shared/plugins/sanitization.plugin'
import { swaggerPlugin } from './shared/plugins/swagger.plugin'
import { generateUUIDv7 } from './shared/utils/uuid'

/**
 * Build and configure Fastify application instance
 */
export function buildApp(): FastifyInstance {
    const app = Fastify({
        logger: {
            level: config.LOG_LEVEL,
            redact: {
                paths: [
                    'req.headers.authorization',
                    'res.headers["set-cookie"]',
                    'password',
                    'token',
                    'JWT_SECRET',
                    'DATABASE_URL',
                ],
                remove: true,
            },
        },
        genReqId: () => {
            return generateUUIDv7()
        },
        bodyLimit: 1_000_000, // 1 MB
        requestTimeout: 15_000, // 15 seconds
    }).withTypeProvider<TypeBoxTypeProvider>()

    // Register plugins in order
    app.register(async fastify => {
        // Core plugins
        errorHandlerPlugin(fastify)
        await fastify.register(loggingPlugin)

        // Performance plugins
        await fastify.register(compressionPlugin)

        // Security plugins
        await fastify.register(helmetPlugin)
        await fastify.register(corsPlugin)
        await fastify.register(rateLimitPlugin)
        await fastify.register(sanitizationPlugin)

        // Documentation plugin
        await fastify.register(swaggerPlugin)

        // Feature plugins
        await fastify.register(multipartPlugin)
        await fastify.register(healthCheckPlugin)
    })

    return app
}

/**
 * Start the Fastify server
 */
export async function startServer(): Promise<FastifyInstance> {
    const app = buildApp()

    try {
        await app.listen({
            port: config.PORT,
            host: '0.0.0.0',
        })

        app.log.info(`Server listening on port ${config.PORT}`)
        return app
    } catch (error) {
        app.log.error(error)
        process.exit(1)
    }
}

/**
 * Graceful shutdown handler
 */
export async function stopServer(app: FastifyInstance): Promise<void> {
    try {
        await app.close()
        app.log.info('Server closed gracefully')
    } catch (error) {
        app.log.error({ error }, 'Error closing server')
        process.exit(1)
    }
}
