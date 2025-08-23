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
import Fastify, { type FastifyInstance } from 'fastify'

// Type declarations are automatically loaded from ambient modules

import { apiConfig, environment, logConfig, securityConfig, serverConfig } from './shared/config'
import { initializeAuditService, getAuditService } from './shared/audit.service'
import { archetypeRoutes } from './archetypes/archetype.route'
import { authRoutes } from './auth/auth.route'
import { characterRoutes } from './characters/character.route'
import equipmentRoutes from './equipment/equipment.route'
import { healthRoutes } from './health/health.route'
import { imageRoutes } from './images/image.route'
import { itemRoutes } from './items/item.route'
import { perkRoutes } from './perks/perk.route'
import { raceRoutes } from './races/race.route'
import { connectDatabase, disconnectDatabase } from './shared/database/index'
import { errorHandler, notFoundHandler } from './shared/errors'
import { skillRoutes } from './skills/skill.route'
import { tagRoutes } from './tags/tag.route'
import { userRoutes } from './users/user.route'

// Extend global interface for database connection tracking
declare global {
  var databaseConnected: boolean | undefined
}

// Create app factory function
// Factory function for tests - shares DB connection but creates new Fastify instances
export const createTestApp = async (): Promise<FastifyInstance> => {
  // In test environment, initialize database once globally
  if (!global.databaseConnected) {
    await connectDatabase()
    global.databaseConnected = true
  }

  return createApp()
}

// Factory function for fresh app instances
export const createApp = async (): Promise<FastifyInstance> => {
  // Create Fastify instance with configuration
  const app = Fastify({
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

    // Comprehensive CORS configuration with proper validation
    await app.register(cors, {
      origin:
        (process.env.NODE_ENV || environment.NODE_ENV) === 'development'
          ? true // Allow all origins in development for Swagger UI and testing
          : (origin, callback) => {
              // In production, validate against allowed origins list
              // Read from process.env to allow dynamic updates during testing
              const corsOrigin = process.env.CORS_ORIGIN || securityConfig.corsOrigin
              const allowedOrigins = corsOrigin.split(',').map(o => o.trim())

              // Allow requests with no origin (like mobile apps or Postman)
              if (!origin) {
                return callback(null, true)
              }

              // Check if the origin is in the allowed list
              if (allowedOrigins.includes(origin)) {
                return callback(null, true)
              }

              // Reject unauthorized origins
              return callback(new Error('Not allowed by CORS'), false)
            },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-request-id',
        'Accept',
        'Origin',
        'X-Requested-With',
        'Cache-Control',
        'If-None-Match',
        'If-Modified-Since',
      ],
      exposedHeaders: [
        'x-request-id',
        'Cache-Control',
        'ETag',
        'Last-Modified',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ],
      credentials: true,
      optionsSuccessStatus: 200, // For legacy browser support
      preflightContinue: false,
      maxAge: 86400, // 24 hours for preflight cache
    })

    // Comprehensive HTTP security headers configuration
    await app.register(helmet, {
      // Content Security Policy - strict in production, relaxed in development for Swagger UI
      contentSecurityPolicy:
        environment.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                workerSrc: ["'self'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: [],
              },
            }
          : {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", 'data:'],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
              },
            },

      // Cross-Origin Embedder Policy - enforced in production
      crossOriginEmbedderPolicy: environment.NODE_ENV === 'production',

      // Cross-Origin Opener Policy - enforced in production
      crossOriginOpenerPolicy:
        environment.NODE_ENV === 'production' ? { policy: 'same-origin' } : false,

      // Cross-Origin Resource Policy - enforced in production
      crossOriginResourcePolicy:
        environment.NODE_ENV === 'production' ? { policy: 'same-origin' } : false,

      // Origin Agent Cluster - enforced in production
      originAgentCluster: environment.NODE_ENV === 'production',

      // Referrer Policy - always enabled for privacy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

      // HTTPS Strict Transport Security - enabled in production
      strictTransportSecurity:
        environment.NODE_ENV === 'production'
          ? {
              maxAge: 31536000, // 1 year
              includeSubDomains: true,
              preload: true,
            }
          : false,

      // X-Content-Type-Options - disabled in test environment
      xContentTypeOptions: environment.NODE_ENV !== 'test',

      // X-DNS-Prefetch-Control - disabled in test environment
      xDnsPrefetchControl: environment.NODE_ENV !== 'test' ? { allow: false } : false,

      // X-Download-Options - disabled in test environment
      xDownloadOptions: environment.NODE_ENV !== 'test',

      // X-Frame-Options - disabled in test environment
      xFrameOptions: environment.NODE_ENV !== 'test' ? { action: 'deny' } : false,

      // X-Permitted-Cross-Domain-Policies - disabled in test environment
      xPermittedCrossDomainPolicies: environment.NODE_ENV !== 'test' ? false : false,

      // X-Powered-By - always disabled
      xPoweredBy: false,

      // X-XSS-Protection - disabled in test environment
      xXssProtection: environment.NODE_ENV !== 'test',
    })

    // Rate limiting (disabled in test environment)
    if (serverConfig.nodeEnv !== 'test') {
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
    }

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
          title: 'Fantasy Characters API',
          description:
            'A comprehensive RESTful API for managing fantasy characters with advanced security features including JWT authentication, RBAC authorization, comprehensive audit logging, and HTTP security headers. Features role-based access control with USER, MODERATOR, and ADMIN roles, data classification (PUBLIC, PRIVATE, HIDDEN), and complete CRUD operations for characters, races, archetypes, skills, perks, items, and equipment management.',
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
          {
            name: 'Health',
            description: 'Health check endpoints for monitoring and Kubernetes probes',
          },
          {
            name: 'Auth',
            description:
              'Authentication endpoints for login, logout, token refresh, and password management',
          },
          {
            name: 'Profile',
            description: 'User profile management endpoints for self-service operations',
          },
          {
            name: 'Users',
            description: 'User management endpoints (admin access required for most operations)',
          },
          {
            name: 'Images',
            description: 'Image upload and management endpoints with WebP optimization',
          },
          {
            name: 'Characters',
            description: 'Character management endpoints with stats calculation and relationships',
          },
          {
            name: 'Races',
            description: 'Fantasy race management with attribute modifiers and validation',
          },
          {
            name: 'Archetypes',
            description: 'Character class management with race requirements and restrictions',
          },
          {
            name: 'Skills',
            description: 'Skill management with level requirements and character progression',
          },
          {
            name: 'Perks',
            description: 'Character advantage/disadvantage system with level gating',
          },
          {
            name: 'Items',
            description: 'Equipment and consumable management with stats and rarity system',
          },
          {
            name: 'Equipment',
            description: 'Character equipment management with slot validation and stat calculation',
          },
          {
            name: 'Tags',
            description: 'Flexible tagging system for content organization and filtering',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description:
                'JWT Bearer token authentication. Obtain tokens via POST /auth/login, use in Authorization header as "Bearer TOKEN". Access tokens expire in 15 minutes, refresh tokens expire in 7 days. Supports three roles: USER (basic access), MODERATOR (content management), ADMIN (full access).',
            },
          },
          responses: {
            UnauthorizedError: {
              description: 'Authentication required - missing or invalid JWT token',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'string', example: 'UNAUTHORIZED' },
                          message: { type: 'string', example: 'Authentication required' },
                          timestamp: { type: 'string', format: 'date-time' },
                          path: { type: 'string', example: '/api/characters' },
                        },
                      },
                    },
                  },
                },
              },
            },
            ForbiddenError: {
              description: 'Insufficient permissions for this operation',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'string', example: 'FORBIDDEN' },
                          message: { type: 'string', example: 'Insufficient permissions' },
                          timestamp: { type: 'string', format: 'date-time' },
                          path: { type: 'string', example: '/api/users' },
                        },
                      },
                    },
                  },
                },
              },
            },
            RateLimitError: {
              description: 'Rate limit exceeded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'string', example: 'TOO_MANY_REQUESTS' },
                          message: { type: 'string', example: 'Rate limit exceeded, retry in 60s' },
                          timestamp: { type: 'string', format: 'date-time' },
                          path: { type: 'string', example: '/api/auth/login' },
                          retryAfter: { type: 'number', example: 60 },
                        },
                      },
                    },
                  },
                },
              },
              headers: {
                'X-RateLimit-Limit': {
                  description: 'Request limit per time window',
                  schema: { type: 'integer', example: 100 },
                },
                'X-RateLimit-Remaining': {
                  description: 'Remaining requests in current window',
                  schema: { type: 'integer', example: 0 },
                },
                'X-RateLimit-Reset': {
                  description: 'Time when rate limit resets (Unix timestamp)',
                  schema: { type: 'integer', example: 1625097600 },
                },
              },
            },
            ValidationError: {
              description: 'Input validation failed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'string', example: 'VALIDATION_ERROR' },
                          message: { type: 'string', example: 'Validation failed' },
                          timestamp: { type: 'string', format: 'date-time' },
                          path: { type: 'string', example: '/api/characters' },
                          details: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                field: { type: 'string', example: 'name' },
                                message: { type: 'string', example: 'Name is required' },
                                value: { type: 'string', example: '' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          headers: {
            'X-Request-ID': {
              description: 'Unique request identifier for tracing and debugging',
              schema: { type: 'string', example: 'req_1625097600_abc123' },
            },
            'Cache-Control': {
              description: 'Caching directives for client and proxy caches',
              schema: { type: 'string', example: 'public, max-age=300' },
            },
            ETag: {
              description: 'Entity tag for cache validation',
              schema: { type: 'string', example: '"abc123def456"' },
            },
            'Last-Modified': {
              description: 'Date and time when resource was last modified',
              schema: { type: 'string', format: 'date-time' },
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

        // Races routes (Chapter 9)
        await fastify.register(raceRoutes, { prefix: '/races' })

        // Archetypes routes (Chapter 10)
        await fastify.register(archetypeRoutes, { prefix: '/archetypes' })

        // Items routes (Chapter 11)
        await fastify.register(itemRoutes, { prefix: '/items' })

        // Equipment routes (Chapter 12)
        await fastify.register(equipmentRoutes)

        // Characters routes (Chapter 13)
        await fastify.register(characterRoutes)

        // Future routes will be added here in subsequent chapters:
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
  try {
    // Connect to database first ONLY if not already connected in test environment
    // This allows sharing DB connection across multiple app instances in tests
    if (environment.NODE_ENV === 'test') {
      if (!global.databaseConnected) {
        await connectDatabase()
        global.databaseConnected = true
      }
    } else {
      // In non-test environments, always connect
      await connectDatabase()
    }

    await registerPlugins()

    // Initialize audit service after logger is configured (skip in test environment)
    if (environment.NODE_ENV !== 'test') {
      initializeAuditService(app.log)

      // Log system startup event
      const auditService = getAuditService()
      auditService.logSystem({
        eventType: 'system.startup',
        severity: 'low',
        message: 'Fastify application starting up',
        details: {
          environment: environment.NODE_ENV,
          logLevel: logConfig.level,
          apiPrefix: apiConfig.prefix,
        },
      })
    }

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

  // Add graceful shutdown hook
  app.addHook('onClose', async instance => {
    instance.log.info('Shutting down Fastify application...')

    // Log shutdown event (skip in test environment)
    if (environment.NODE_ENV !== 'test') {
      try {
        const auditService = getAuditService()
        auditService.logSystem({
          eventType: 'system.shutdown',
          severity: 'low',
          message: 'Fastify application shutting down gracefully',
        })
      } catch {
        // Ignore audit service errors during shutdown
      }
    }

    // Only disconnect database if this is the main app instance (not test instances)
    if (!global.databaseConnected || instance === app) {
      await disconnectDatabase()
      global.databaseConnected = false
    }
  })

  return app
}

// For production use - create and export a single instance
export const app = await createApp()
