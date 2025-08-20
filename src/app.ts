/**
 * Fastify application setup
 * Configures Fastify server with all plugins and routes
 */

import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import fastifyJwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify from 'fastify'

import { apiConfig, environment, logConfig, securityConfig } from '@/shared/config.js'
import { authRoutes } from './auth/auth.route.js'
import { healthRoutes } from './health/health.route.js'
import { imageRoutes } from './images/image.route.js'
import { perkRoutes } from './perks/perk.route.js'
import { connectDatabase, disconnectDatabase } from './shared/database/index.js'
import { errorHandler, notFoundHandler } from './shared/errors.js'
import { skillRoutes } from './skills/skill.route.js'
import { tagRoutes } from './tags/tag.route.js'
import { userRoutes } from './users/user.route.js'

// Create Fastify instance with configuration
export const app = Fastify({
  logger: logConfig.transport
    ? {
        level: logConfig.level,
        transport: logConfig.transport,
      }
    : {
        level: logConfig.level,
      },
  disableRequestLogging: environment.NODE_ENV === 'test',
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  genReqId: () => `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
})

// Register plugins
const registerPlugins = async (): Promise<void> => {
  // Get current port from environment or default
  const currentPort = process.env.PORT || environment.PORT

  // CORS configuration
  // TODO: Configure restrictive CORS origins for production deployment
  // FIXME: Permissive CORS (origin: true) used in development for Swagger UI
  // In production, should use specific allowed origins from securityConfig
  await app.register(cors, {
    origin: environment.NODE_ENV === 'development' ? true : securityConfig.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
    optionsSuccessStatus: 200, // For legacy browser support
    preflightContinue: false,
  })

  // Security headers
  // TODO: Review security headers configuration before production deployment
  // FIXME: Most security headers are disabled in development for Swagger UI compatibility
  // In production, these should be properly configured for security
  await app.register(helmet, {
    // CSP disabled in development to allow Swagger UI to function properly
    contentSecurityPolicy: environment.NODE_ENV === 'production' ? true : false,
    // FIXME: These are disabled for development - re-enable for production
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    originAgentCluster: false,
    referrerPolicy: false,
    // HTTPS-only header - enabled only in production
    strictTransportSecurity: environment.NODE_ENV === 'production',
    // FIXME: Security headers disabled for Swagger compatibility - re-evaluate for production
    xContentTypeOptions: false,
    xDnsPrefetchControl: false,
    xDownloadOptions: false,
    xFrameOptions: false,
    xPermittedCrossDomainPolicies: false,
    xPoweredBy: false,
    xXssProtection: false,
  })

  // Rate limiting
  await app.register(rateLimit, {
    max: securityConfig.rateLimitMax,
    timeWindow: securityConfig.rateLimitTimeWindow,
    errorResponseBuilder: (request, context) => {
      // This function covers the errorResponseBuilder branch
      const retryAfterSeconds = Math.round(context.ttl / 1000)
      return {
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded, retry in ${retryAfterSeconds}s`,
          timestamp: new Date().toISOString(),
          path: request.url,
          retryAfter: retryAfterSeconds,
        },
      }
    },
  })

  // Sensible plugin for HTTP errors and utilities
  await app.register(sensible)

  // JWT authentication
  await app.register(fastifyJwt, {
    secret: securityConfig.jwtSecret,
  })

  // Multipart support for file uploads
  await app.register(multipart, {
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 1000000, // Max field value size in bytes (1MB)
      fields: 10, // Max number of non-file fields
      fileSize: 5 * 1024 * 1024, // Max file size in bytes (5MB)
      files: 1, // Max number of file fields
      headerPairs: 2000, // Max number of header key=>value pairs
    },
  })

  // Swagger documentation
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Fantasy Character API',
        description: 'A comprehensive RESTful API for managing fantasy characters',
        version: '1.0.0',
        contact: {
          name: 'Antonio Colagreco',
          email: 'nevenbridge@gmail.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: `http://localhost:${currentPort}${apiConfig.prefix}`,
          description: 'Current development server (localhost)',
        },
        {
          url: `http://127.0.0.1:${currentPort}${apiConfig.prefix}`,
          description: 'Current development server (127.0.0.1)',
        },
      ],
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Users', description: 'User management endpoints' },
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Profile', description: 'User profile management endpoints' },
        { name: 'Images', description: 'Image upload and management endpoints' },
        { name: 'Characters', description: 'Character management endpoints' },
        { name: 'Races', description: 'Race management endpoints' },
        { name: 'Archetypes', description: 'Archetype management endpoints' },
        { name: 'Skills', description: 'Skill management endpoints' },
        { name: 'Perks', description: 'Perk management endpoints' },
        { name: 'Items', description: 'Item management endpoints' },
        { name: 'Tags', description: 'Tag management endpoints' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token for authentication',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  })

  // Swagger UI
  // TODO: Review Swagger UI security configuration for production
  // FIXME: CSP disabled and permissive settings for development
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      tryItOutEnabled: true, // Allow testing endpoints directly from UI
      persistAuthorization: true, // Keep authorization between page reloads
    },
    uiHooks: {
      onRequest: (_request, _reply, next) => {
        next()
      },
      preHandler: (_request, _reply, next) => {
        next()
      },
    },
    staticCSP: false, // FIXME: CSP disabled for development - enable for production
    transformStaticCSP: header => header,
    transformSpecification: (swaggerObject, _request, _reply) => swaggerObject,
    transformSpecificationClone: true,
  })
}

// Register routes
const registerRoutes = async (): Promise<void> => {
  // API prefix for all routes
  await app.register(
    async fastify => {
      // Health check routes (no auth required)
      await fastify.register(healthRoutes)

      // User management routes (Chapter 3)
      await fastify.register(userRoutes)

      // Authentication routes (Chapter 4)
      await fastify.register(authRoutes, { prefix: '/auth' })

      // Image routes (Chapter 5)
      await fastify.register(imageRoutes, { prefix: '/images' })

      // Tag routes (Chapter 6)
      await fastify.register(tagRoutes, { prefix: '/tags' })

      // Skills routes (Chapter 7)
      await fastify.register(skillRoutes, { prefix: '/skills' })

      // Perks routes (Chapter 8)
      await fastify.register(perkRoutes, { prefix: '/perks' })

      // Future routes will be added here in subsequent chapters:
      // - Races routes (Chapter 9)
      // - Archetypes routes (Chapter 10)
      // - Items routes (Chapter 11)
      // - Characters routes (Chapter 12)
    },
    { prefix: apiConfig.prefix },
  )
}

// Add hooks
const setupHooks = (): void => {
  // Add request ID to response headers
  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-request-id', request.id)
    return payload
  })
}

// Setup error handlers
const setupErrorHandlers = (): void => {
  // Register custom error handlers
  app.setErrorHandler(errorHandler)
  app.setNotFoundHandler(notFoundHandler)
}

// Initialize application
const initializeApp = async (): Promise<void> => {
  try {
    // Connect to database first
    await connectDatabase()

    await registerPlugins()
    await registerRoutes()
    setupHooks()
    setupErrorHandlers()

    app.log.info('Fastify application initialized successfully')
    app.log.info(`Environment: ${environment.NODE_ENV}`)
    app.log.info(`Log level: ${logConfig.level}`)
    app.log.info(`API prefix: ${apiConfig.prefix}`)
  } catch (error) {
    app.log.error('Failed to initialize Fastify application: %s', String(error))
    throw error
  }
}

// Initialize the app
await initializeApp()

// Add graceful shutdown hook
app.addHook('onClose', async instance => {
  instance.log.info('Shutting down Fastify application...')
  await disconnectDatabase()
})
