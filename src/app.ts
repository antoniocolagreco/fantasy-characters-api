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
// import sanitizationPlugin from './shared/plugins/sanitization.plugin' // Temporarily disabled
import { swaggerPlugin } from './shared/plugins/swagger.plugin'
import { generateUUIDv7 } from './shared/utils/uuid'

/**
 * Build and configure Fastify application instance
 */
export async function buildApp(): Promise<FastifyInstance> {
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

    // Register plugins on root instance (avoid extra encapsulation)
    // Core plugins
    errorHandlerPlugin(app)
    await app.register(loggingPlugin)

    // Documentation plugin FIRST (so it can capture subsequent routes via onRoute)
    await app.register(swaggerPlugin)

    // Performance plugins
    await app.register(compressionPlugin)

    // Security plugins
    await app.register(helmetPlugin)
    await app.register(corsPlugin)
    await app.register(rateLimitPlugin)

    // Feature plugins (define routes AFTER swagger is registered)
    await app.register(multipartPlugin)
    await app.register(healthCheckPlugin)

    return app
}

/**
 * Start the Fastify server
 */
export async function startServer(): Promise<FastifyInstance> {
    const app = await buildApp()

    try {
        await app.listen({
            port: config.PORT,
            host: '0.0.0.0',
        })

        // app.log.info(`Server listening on port ${config.PORT}`)
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
