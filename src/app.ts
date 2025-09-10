import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import Fastify, { type FastifyInstance } from 'fastify'

import { archetypesRoutesV1 } from '@/features/archetypes/v1/archetypes.routes'
import { createOptionalAuthMiddleware } from '@/features/auth/auth.middleware'
import { authRoutesV1 } from '@/features/auth/v1/auth.routes'
import { charactersRoutesV1 } from '@/features/characters/v1/characters.routes'
import { equipmentRoutesV1 } from '@/features/equipment'
import { imageRoutes } from '@/features/images/v1/images.routes'
import { itemsRoutesV1 } from '@/features/items/v1/items.routes'
import { perksRoutesV1 } from '@/features/perks/v1/perks.routes'
import { racesRoutesV1 } from '@/features/races/v1/races.routes'
import { skillsRoutesV1 } from '@/features/skills/v1/skills.routes'
import { tagsRoutesV1 } from '@/features/tags/v1/tags.routes'
import { usersRoutesV1 } from '@/features/users/v1/users.routes'
import { config } from '@/infrastructure/config'
import prismaService from '@/infrastructure/database/prisma.service'
import { compressionPlugin } from '@/shared/plugins/compression.plugin'
import corsPlugin from '@/shared/plugins/cors.plugin'
import { errorHandlerPlugin } from '@/shared/plugins/error-handler.plugin'
import etagPlugin from '@/shared/plugins/etag.plugin'
import { healthCheckPlugin } from '@/shared/plugins/health.plugin'
import helmetPlugin from '@/shared/plugins/helmet.plugin'
import loggingPlugin from '@/shared/plugins/logging.plugin'
import { multipartPlugin } from '@/shared/plugins/multipart.plugin'
import rateLimitPlugin from '@/shared/plugins/rate-limit.plugin'
import sanitizationPlugin from '@/shared/plugins/sanitization.plugin'
import stableEtagPlugin from '@/shared/plugins/stable-etag.plugin'
import { swaggerPlugin } from '@/shared/plugins/swagger.plugin'
import validationPlugin from '@/shared/plugins/validation.plugin'
import { generateUUIDv7 } from '@/shared/utils/uuid'

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
        disableRequestLogging: true,
        genReqId: () => {
            return generateUUIDv7()
        },
        bodyLimit: 1_000_000, // 1 MB
        requestTimeout: 15_000, // 15 seconds
        onProtoPoisoning: 'remove',
        onConstructorPoisoning: 'remove',
    }).withTypeProvider<TypeBoxTypeProvider>()

    // Register plugins on root instance (avoid extra encapsulation)
    // Core plugins
    errorHandlerPlugin(app)
    await app.register(loggingPlugin)

    // Validation plugin BEFORE routes so all validators use our Ajv instance
    await app.register(validationPlugin)

    // Documentation plugin FIRST (so it can capture subsequent routes via onRoute)
    await app.register(swaggerPlugin)

    // Performance plugins
    await app.register(stableEtagPlugin) // compute stable ETags before compression/etag
    await app.register(compressionPlugin)
    await app.register(etagPlugin)

    // Security plugins
    await app.register(helmetPlugin)
    await app.register(corsPlugin)
    await app.register(rateLimitPlugin)
    await app.register(sanitizationPlugin)

    // Feature plugins (define routes AFTER swagger is registered)
    await app.register(multipartPlugin)
    await app.register(healthCheckPlugin)

    // Add Prisma to all requests (use undefined to satisfy Fastify's GetterSetter typing)
    app.decorateRequest('prisma', undefined)
    app.addHook('onRequest', async request => {
        request.prisma = prismaService
    })

    // Create authentication middleware instance (available for RBAC when needed)
    const authMiddleware = createOptionalAuthMiddleware({
        secret: config.JWT_SECRET,
        accessTokenTtl: config.JWT_ACCESS_EXPIRES_IN,
        refreshTokenTtl: config.JWT_REFRESH_EXPIRES_IN,
        issuer: 'fantasy-characters-api',
        audience: 'fantasy-characters-app',
    })

    // Apply optional authentication globally (parses JWT if present, but doesn't require it)
    app.addHook('preHandler', async (request, reply) => {
        // Cast for compatibility since headers are slightly different types
        const authRequest = request as unknown as import('@/shared/types/http').BasicAuthRequest
        const authReply = reply as unknown as import('@/shared/types/http').BasicReply
        authMiddleware(authRequest, authReply)
    })

    // API v1 routes
    await app.register(authRoutesV1, { prefix: '/api/v1' })
    await app.register(usersRoutesV1, { prefix: '/api/v1' })
    await app.register(tagsRoutesV1, { prefix: '/api/v1' })
    await app.register(skillsRoutesV1, { prefix: '/api/v1' })
    await app.register(perksRoutesV1, { prefix: '/api/v1' })
    await app.register(racesRoutesV1, { prefix: '/api/v1' })
    await app.register(archetypesRoutesV1, { prefix: '/api/v1' })
    await app.register(imageRoutes, { prefix: '/api/v1' })
    await app.register(itemsRoutesV1, { prefix: '/api/v1' })
    await app.register(charactersRoutesV1, { prefix: '/api/v1' })
    await app.register(equipmentRoutesV1, { prefix: '/api/v1' })

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

        app.log.info(`Docs available at http://localhost:${config.PORT}/docs`)
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
