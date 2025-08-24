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

import { archetypeRoutes } from './archetypes/archetype.route'
import { authRoutes } from './auth/auth.route'
import { characterRoutes } from './characters/character.route'
import equipmentRoutes from './equipment/equipment.route'
import { healthRoutes } from './health/health.route'
import { imageRoutes } from './images/image.route'
import { itemRoutes } from './items/item.route'
import { perkRoutes } from './perks/perk.route'
import { raceRoutes } from './races/race.route'
import { getAuditService, initializeAuditService } from './shared/audit.service'
import { apiConfig, environment, logConfig, securityConfig, serverConfig } from './shared/config'
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
          description: `
A comprehensive RESTful API for managing fantasy characters with advanced security features including JWT authentication, RBAC authorization, comprehensive audit logging, and HTTP security headers. Features role-based access control with USER, MODERATOR, and ADMIN roles, data classification (PUBLIC, PRIVATE, HIDDEN), and complete CRUD operations for characters, races, archetypes, skills, perks, items, and equipment management.

#### 🧪 Test Credentials (Seeded)

- **ADMIN**: admin@fantasy-api.com / admin123 - Full system access
- **MODERATOR**: moderator@fantasy-api.com / mod123 - Content moderation
- **USER**: user@fantasy-api.com / user123 - Own content management
- **USER**: designer@fantasy-api.com / design123 - Game designer role
          `,
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
          schemas: {
            // Enum Schemas
            Role: {
              type: 'string',
              enum: ['USER', 'MODERATOR', 'ADMIN'],
              description: 'User role with hierarchical permissions',
              example: 'USER',
            },
            Visibility: {
              type: 'string',
              enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'],
              description: 'Content visibility level',
              example: 'PUBLIC',
            },
            Sex: {
              type: 'string',
              enum: ['MALE', 'FEMALE'],
              description: 'Character biological sex',
              example: 'MALE',
            },
            Rarity: {
              type: 'string',
              enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'],
              description: 'Item rarity classification',
              example: 'COMMON',
            },
            Slot: {
              type: 'string',
              enum: [
                'NONE',
                'HEAD',
                'FACE',
                'CHEST',
                'LEGS',
                'FEET',
                'HANDS',
                'ONE_HAND',
                'TWO_HANDS',
                'RING',
                'AMULET',
                'BELT',
                'BACKPACK',
                'CLOAK',
              ],
              description: 'Equipment slot type for items',
              example: 'HEAD',
            },

            // Common Data Types
            UUID: {
              type: 'string',
              format: 'uuid',
              description: 'Universally unique identifier',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            Timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp',
              example: '2023-12-01T10:00:00.000Z',
            },
            Email: {
              type: 'string',
              format: 'email',
              description: 'Valid email address',
              example: 'user@example.com',
            },
            Password: {
              type: 'string',
              minLength: 8,
              maxLength: 128,
              description: 'User password (minimum 8 characters)',
              example: 'SecurePassword123!',
            },
            Name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Name field with length validation',
              example: 'Aragorn',
            },
            Description: {
              type: 'string',
              maxLength: 1000,
              description: 'Optional description field',
              example: 'A brave warrior from the north',
            },

            // Error Schemas
            Error: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    code: {
                      type: 'string',
                      description: 'Error code identifier',
                      examples: ['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED'],
                    },
                    message: {
                      type: 'string',
                      description: 'Human-readable error message',
                      examples: ['Validation failed', 'Resource not found'],
                    },
                    timestamp: { $ref: '#/components/schemas/Timestamp' },
                    path: {
                      type: 'string',
                      description: 'Request path where error occurred',
                      example: '/api/characters',
                    },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: {
                            type: 'string',
                            description: 'Field that failed validation',
                            example: 'name',
                          },
                          message: {
                            type: 'string',
                            description: 'Field-specific error message',
                            example: 'Name is required',
                          },
                          value: {
                            description: 'Invalid value that was provided',
                          },
                        },
                      },
                      description: 'Detailed validation errors',
                    },
                  },
                },
              },
            },
            ValidationError: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', enum: ['VALIDATION_ERROR'] },
                    message: { type: 'string', example: 'Validation failed' },
                    timestamp: { $ref: '#/components/schemas/Timestamp' },
                    path: { type: 'string', example: '/api/characters' },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string', example: 'name' },
                          message: { type: 'string', example: 'Name is required' },
                          value: {},
                        },
                      },
                    },
                  },
                },
              },
            },
            NotFoundError: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', enum: ['NOT_FOUND'] },
                    message: { type: 'string', example: 'Resource not found' },
                    timestamp: { $ref: '#/components/schemas/Timestamp' },
                    path: { type: 'string', example: '/api/characters/123' },
                  },
                },
              },
            },
            ConflictError: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', enum: ['CONFLICT'] },
                    message: { type: 'string', example: 'Resource conflict' },
                    timestamp: { $ref: '#/components/schemas/Timestamp' },
                    path: { type: 'string', example: '/api/characters' },
                  },
                },
              },
            },

            // Pagination Schemas
            PaginationQuery: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  minimum: 1,
                  default: 1,
                  description: 'Current page number (starts from 1)',
                  example: 1,
                },
                pageSize: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 100,
                  default: 10,
                  description: 'Items per page (1-100)',
                  example: 10,
                },
                sortBy: {
                  type: 'string',
                  minLength: 1,
                  description: 'Field to sort by (entity-specific)',
                  example: 'name',
                },
                sortOrder: {
                  type: 'string',
                  enum: ['asc', 'desc'],
                  description: 'Sort order: ascending or descending',
                  example: 'asc',
                },
              },
            },
            PaginationMeta: {
              type: 'object',
              properties: {
                total: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Total number of items',
                  example: 150,
                },
                page: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Current page number',
                  example: 1,
                },
                pageSize: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 100,
                  description: 'Items per page',
                  example: 10,
                },
                totalPages: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Total number of pages',
                  example: 15,
                },
              },
            },

            // User Schemas
            User: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/UUID' },
                email: { $ref: '#/components/schemas/Email' },
                name: {
                  oneOf: [{ $ref: '#/components/schemas/Name' }, { type: 'null' }],
                  description: 'User display name',
                },
                bio: {
                  oneOf: [{ type: 'string', maxLength: 500 }, { type: 'null' }],
                  description: 'User biography',
                },
                role: { $ref: '#/components/schemas/Role' },
                isEmailVerified: {
                  type: 'boolean',
                  description: 'Email verification status',
                  example: true,
                },
                isActive: {
                  type: 'boolean',
                  description: 'User account status',
                  example: true,
                },
                lastLogin: { $ref: '#/components/schemas/Timestamp' },
                createdAt: { $ref: '#/components/schemas/Timestamp' },
                updatedAt: { $ref: '#/components/schemas/Timestamp' },
                profilePictureId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Profile picture image ID',
                },
              },
              required: [
                'id',
                'email',
                'role',
                'isEmailVerified',
                'isActive',
                'lastLogin',
                'createdAt',
                'updatedAt',
              ],
            },
            CreateUser: {
              type: 'object',
              properties: {
                email: { $ref: '#/components/schemas/Email' },
                password: { $ref: '#/components/schemas/Password' },
                name: { $ref: '#/components/schemas/Name' },
                bio: { type: 'string', maxLength: 500 },
                role: { $ref: '#/components/schemas/Role' },
              },
              required: ['email', 'password'],
            },
            UpdateUser: {
              type: 'object',
              properties: {
                email: { $ref: '#/components/schemas/Email' },
                name: { $ref: '#/components/schemas/Name' },
                bio: { type: 'string', maxLength: 500 },
                role: { $ref: '#/components/schemas/Role' },
                isEmailVerified: { type: 'boolean' },
                isActive: { type: 'boolean' },
              },
            },

            // Authentication Schemas
            LoginRequest: {
              type: 'object',
              properties: {
                email: { $ref: '#/components/schemas/Email' },
                password: { type: 'string', description: 'User password' },
              },
              required: ['email', 'password'],
            },
            RegisterRequest: {
              type: 'object',
              properties: {
                email: { $ref: '#/components/schemas/Email' },
                password: { $ref: '#/components/schemas/Password' },
                name: { $ref: '#/components/schemas/Name' },
                bio: { type: 'string', maxLength: 500 },
              },
              required: ['email', 'password'],
            },
            TokenResponse: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  description: 'JWT access token (expires in 15 minutes)',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token (expires in 7 days)',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                tokenType: {
                  type: 'string',
                  default: 'Bearer',
                  description: 'Token type for Authorization header',
                  example: 'Bearer',
                },
                expiresIn: {
                  type: 'string',
                  description: 'Access token expiration time',
                  example: '15m',
                },
                user: { $ref: '#/components/schemas/User' },
              },
              required: ['accessToken', 'refreshToken', 'tokenType', 'expiresIn', 'user'],
            },
            RefreshTokenRequest: {
              type: 'object',
              properties: {
                refreshToken: {
                  type: 'string',
                  description: 'Valid refresh token',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
              required: ['refreshToken'],
            },
            ChangePasswordRequest: {
              type: 'object',
              properties: {
                currentPassword: { type: 'string', description: 'Current user password' },
                newPassword: { $ref: '#/components/schemas/Password' },
              },
              required: ['currentPassword', 'newPassword'],
            },

            // Image Schemas
            Image: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/UUID' },
                filename: {
                  type: 'string',
                  description: 'Original filename',
                  example: 'character-portrait.webp',
                },
                description: {
                  oneOf: [{ $ref: '#/components/schemas/Description' }, { type: 'null' }],
                  description: 'Image description',
                },
                size: {
                  type: 'integer',
                  minimum: 0,
                  description: 'File size in bytes',
                  example: 245760,
                },
                mimeType: {
                  type: 'string',
                  description: 'MIME type (always image/webp after processing)',
                  example: 'image/webp',
                },
                width: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 350,
                  description: 'Image width in pixels',
                  example: 300,
                },
                height: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 450,
                  description: 'Image height in pixels',
                  example: 400,
                },
                ownerId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Owner user ID (null for orphaned images)',
                },
                visibility: { $ref: '#/components/schemas/Visibility' },
                createdAt: { $ref: '#/components/schemas/Timestamp' },
                updatedAt: { $ref: '#/components/schemas/Timestamp' },
              },
              required: [
                'id',
                'filename',
                'size',
                'mimeType',
                'width',
                'height',
                'visibility',
                'createdAt',
                'updatedAt',
              ],
            },
            ImageUpload: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'Image file (JPEG, PNG, or WebP, max 5MB)',
                },
                description: { $ref: '#/components/schemas/Description' },
                visibility: { $ref: '#/components/schemas/Visibility' },
              },
              required: ['file'],
            },
            UpdateImage: {
              type: 'object',
              properties: {
                description: { $ref: '#/components/schemas/Description' },
                visibility: { $ref: '#/components/schemas/Visibility' },
              },
            },

            // Tag Schemas
            Tag: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/UUID' },
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 50,
                  description: 'Unique tag name',
                  example: 'warrior',
                },
                description: {
                  oneOf: [{ $ref: '#/components/schemas/Description' }, { type: 'null' }],
                  description: 'Tag description',
                },
                ownerId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Owner user ID (null for orphaned tags)',
                },
                visibility: { $ref: '#/components/schemas/Visibility' },
                createdAt: { $ref: '#/components/schemas/Timestamp' },
                updatedAt: { $ref: '#/components/schemas/Timestamp' },
              },
              required: ['id', 'name', 'visibility', 'createdAt', 'updatedAt'],
            },
            CreateTag: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 50,
                  description: 'Unique tag name',
                  example: 'warrior',
                },
                description: { $ref: '#/components/schemas/Description' },
                visibility: { $ref: '#/components/schemas/Visibility' },
              },
              required: ['name'],
            },
            UpdateTag: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 50,
                  description: 'Updated tag name',
                },
                description: { $ref: '#/components/schemas/Description' },
                visibility: { $ref: '#/components/schemas/Visibility' },
              },
            },

            // Race Schemas
            Race: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/UUID' },
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                  description: 'Unique race name',
                  example: 'Elf',
                },
                description: {
                  oneOf: [{ $ref: '#/components/schemas/Description' }, { type: 'null' }],
                  description: 'Race description',
                },
                healthModifier: {
                  type: 'integer',
                  description: 'Health percentage modifier (100 = no change)',
                  example: 120,
                },
                manaModifier: {
                  type: 'integer',
                  description: 'Mana percentage modifier (100 = no change)',
                  example: 150,
                },
                staminaModifier: {
                  type: 'integer',
                  description: 'Stamina percentage modifier (100 = no change)',
                  example: 90,
                },
                strengthModifier: {
                  type: 'integer',
                  description: 'Strength attribute modifier',
                  example: 12,
                },
                constitutionModifier: {
                  type: 'integer',
                  description: 'Constitution attribute modifier',
                  example: 8,
                },
                dexterityModifier: {
                  type: 'integer',
                  description: 'Dexterity attribute modifier',
                  example: 15,
                },
                intelligenceModifier: {
                  type: 'integer',
                  description: 'Intelligence attribute modifier',
                  example: 10,
                },
                wisdomModifier: {
                  type: 'integer',
                  description: 'Wisdom attribute modifier',
                  example: 13,
                },
                charismaModifier: {
                  type: 'integer',
                  description: 'Charisma attribute modifier',
                  example: 11,
                },
                imageId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Race image ID',
                },
                ownerId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Owner user ID (null for orphaned races)',
                },
                visibility: { $ref: '#/components/schemas/Visibility' },
                createdAt: { $ref: '#/components/schemas/Timestamp' },
                updatedAt: { $ref: '#/components/schemas/Timestamp' },
              },
              required: [
                'id',
                'name',
                'healthModifier',
                'manaModifier',
                'staminaModifier',
                'strengthModifier',
                'constitutionModifier',
                'dexterityModifier',
                'intelligenceModifier',
                'wisdomModifier',
                'charismaModifier',
                'visibility',
                'createdAt',
                'updatedAt',
              ],
            },
            CreateRace: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                  description: 'Unique race name',
                  example: 'Elf',
                },
                description: { $ref: '#/components/schemas/Description' },
                healthModifier: {
                  type: 'integer',
                  minimum: 50,
                  maximum: 200,
                  default: 100,
                  description: 'Health percentage modifier',
                },
                manaModifier: {
                  type: 'integer',
                  minimum: 50,
                  maximum: 200,
                  default: 100,
                  description: 'Mana percentage modifier',
                },
                staminaModifier: {
                  type: 'integer',
                  minimum: 50,
                  maximum: 200,
                  default: 100,
                  description: 'Stamina percentage modifier',
                },
                strengthModifier: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  default: 10,
                  description: 'Strength attribute modifier',
                },
                constitutionModifier: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  default: 10,
                  description: 'Constitution attribute modifier',
                },
                dexterityModifier: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  default: 10,
                  description: 'Dexterity attribute modifier',
                },
                intelligenceModifier: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  default: 10,
                  description: 'Intelligence attribute modifier',
                },
                wisdomModifier: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  default: 10,
                  description: 'Wisdom attribute modifier',
                },
                charismaModifier: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  default: 10,
                  description: 'Charisma attribute modifier',
                },
                imageId: { $ref: '#/components/schemas/UUID' },
                visibility: { $ref: '#/components/schemas/Visibility' },
              },
              required: ['name'],
            },

            // Skill Schemas
            Skill: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/UUID' },
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                  description: 'Unique skill name',
                  example: 'Swordsmanship',
                },
                description: {
                  oneOf: [{ $ref: '#/components/schemas/Description' }, { type: 'null' }],
                  description: 'Skill description',
                },
                requiredLevel: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 100,
                  description: 'Minimum character level required',
                  example: 5,
                },
                imageId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Skill image ID',
                },
                ownerId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Owner user ID (null for orphaned skills)',
                },
                visibility: { $ref: '#/components/schemas/Visibility' },
                createdAt: { $ref: '#/components/schemas/Timestamp' },
                updatedAt: { $ref: '#/components/schemas/Timestamp' },
              },
              required: ['id', 'name', 'requiredLevel', 'visibility', 'createdAt', 'updatedAt'],
            },
            CreateSkill: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                  description: 'Unique skill name',
                  example: 'Swordsmanship',
                },
                description: { $ref: '#/components/schemas/Description' },
                requiredLevel: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 100,
                  default: 1,
                  description: 'Minimum character level required',
                },
                imageId: { $ref: '#/components/schemas/UUID' },
                visibility: { $ref: '#/components/schemas/Visibility' },
              },
              required: ['name'],
            },

            // Perk Schemas
            Perk: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/UUID' },
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                  description: 'Unique perk name',
                  example: 'Iron Will',
                },
                description: {
                  oneOf: [{ $ref: '#/components/schemas/Description' }, { type: 'null' }],
                  description: 'Perk description',
                },
                requiredLevel: {
                  type: 'integer',
                  minimum: 0,
                  maximum: 100,
                  description: 'Minimum character level required',
                  example: 10,
                },
                imageId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Perk image ID',
                },
                ownerId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Owner user ID (null for orphaned perks)',
                },
                visibility: { $ref: '#/components/schemas/Visibility' },
                createdAt: { $ref: '#/components/schemas/Timestamp' },
                updatedAt: { $ref: '#/components/schemas/Timestamp' },
              },
              required: ['id', 'name', 'requiredLevel', 'visibility', 'createdAt', 'updatedAt'],
            },
            CreatePerk: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                  description: 'Unique perk name',
                  example: 'Iron Will',
                },
                description: { $ref: '#/components/schemas/Description' },
                requiredLevel: {
                  type: 'integer',
                  minimum: 0,
                  maximum: 100,
                  default: 0,
                  description: 'Minimum character level required',
                },
                imageId: { $ref: '#/components/schemas/UUID' },
                visibility: { $ref: '#/components/schemas/Visibility' },
              },
              required: ['name'],
            },

            // Archetype Schemas
            Archetype: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/UUID' },
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                  description: 'Unique archetype name',
                  example: 'Warrior',
                },
                description: {
                  oneOf: [{ $ref: '#/components/schemas/Description' }, { type: 'null' }],
                  description: 'Archetype description',
                },
                imageId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Archetype image ID',
                },
                ownerId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Owner user ID (null for orphaned archetypes)',
                },
                visibility: { $ref: '#/components/schemas/Visibility' },
                createdAt: { $ref: '#/components/schemas/Timestamp' },
                updatedAt: { $ref: '#/components/schemas/Timestamp' },
              },
              required: ['id', 'name', 'visibility', 'createdAt', 'updatedAt'],
            },
            CreateArchetype: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                  description: 'Unique archetype name',
                  example: 'Warrior',
                },
                description: { $ref: '#/components/schemas/Description' },
                imageId: { $ref: '#/components/schemas/UUID' },
                visibility: { $ref: '#/components/schemas/Visibility' },
              },
              required: ['name'],
            },

            // Item Schemas
            Item: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/UUID' },
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                  description: 'Unique item name',
                  example: 'Excalibur',
                },
                description: {
                  oneOf: [{ $ref: '#/components/schemas/Description' }, { type: 'null' }],
                  description: 'Item description',
                },
                // Attribute bonuses
                bonusHealth: {
                  oneOf: [{ type: 'integer' }, { type: 'null' }],
                  description: 'Health bonus granted by item',
                },
                bonusMana: {
                  oneOf: [{ type: 'integer' }, { type: 'null' }],
                  description: 'Mana bonus granted by item',
                },
                bonusStamina: {
                  oneOf: [{ type: 'integer' }, { type: 'null' }],
                  description: 'Stamina bonus granted by item',
                },
                bonusStrength: {
                  oneOf: [{ type: 'integer' }, { type: 'null' }],
                  description: 'Strength bonus granted by item',
                },
                bonusConstitution: {
                  oneOf: [{ type: 'integer' }, { type: 'null' }],
                  description: 'Constitution bonus granted by item',
                },
                bonusDexterity: {
                  oneOf: [{ type: 'integer' }, { type: 'null' }],
                  description: 'Dexterity bonus granted by item',
                },
                bonusIntelligence: {
                  oneOf: [{ type: 'integer' }, { type: 'null' }],
                  description: 'Intelligence bonus granted by item',
                },
                bonusWisdom: {
                  oneOf: [{ type: 'integer' }, { type: 'null' }],
                  description: 'Wisdom bonus granted by item',
                },
                bonusCharisma: {
                  oneOf: [{ type: 'integer' }, { type: 'null' }],
                  description: 'Charisma bonus granted by item',
                },
                // Combat stats
                damage: {
                  oneOf: [{ type: 'integer' }, { type: 'null' }],
                  description: 'Damage value for weapons',
                },
                defense: {
                  oneOf: [{ type: 'integer' }, { type: 'null' }],
                  description: 'Defense value for armor',
                },
                // Item properties
                rarity: { $ref: '#/components/schemas/Rarity' },
                slot: { $ref: '#/components/schemas/Slot' },
                requiredLevel: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 100,
                  description: 'Minimum level required to use item',
                  example: 15,
                },
                weight: {
                  type: 'number',
                  minimum: 0,
                  description: 'Item weight',
                  example: 2.5,
                },
                durability: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Current durability',
                  example: 95,
                },
                maxDurability: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Maximum durability',
                  example: 100,
                },
                value: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Item value in gold',
                  example: 250,
                },
                // Item flags
                is2Handed: {
                  type: 'boolean',
                  description: 'Whether item requires two hands',
                  example: false,
                },
                isThrowable: {
                  type: 'boolean',
                  description: 'Whether item can be thrown',
                  example: false,
                },
                isConsumable: {
                  type: 'boolean',
                  description: 'Whether item is consumed on use',
                  example: false,
                },
                isQuestItem: {
                  type: 'boolean',
                  description: 'Whether item is a quest item',
                  example: false,
                },
                isTradeable: {
                  type: 'boolean',
                  description: 'Whether item can be traded',
                  example: true,
                },
                imageId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Item image ID',
                },
                ownerId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Owner user ID (null for orphaned items)',
                },
                visibility: { $ref: '#/components/schemas/Visibility' },
                createdAt: { $ref: '#/components/schemas/Timestamp' },
                updatedAt: { $ref: '#/components/schemas/Timestamp' },
              },
              required: [
                'id',
                'name',
                'rarity',
                'slot',
                'requiredLevel',
                'weight',
                'durability',
                'maxDurability',
                'value',
                'is2Handed',
                'isThrowable',
                'isConsumable',
                'isQuestItem',
                'isTradeable',
                'visibility',
                'createdAt',
                'updatedAt',
              ],
            },
            CreateItem: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                  description: 'Unique item name',
                  example: 'Excalibur',
                },
                description: { $ref: '#/components/schemas/Description' },
                bonusHealth: { type: 'integer' },
                bonusMana: { type: 'integer' },
                bonusStamina: { type: 'integer' },
                bonusStrength: { type: 'integer' },
                bonusConstitution: { type: 'integer' },
                bonusDexterity: { type: 'integer' },
                bonusIntelligence: { type: 'integer' },
                bonusWisdom: { type: 'integer' },
                bonusCharisma: { type: 'integer' },
                damage: { type: 'integer', minimum: 0 },
                defense: { type: 'integer', minimum: 0 },
                rarity: { $ref: '#/components/schemas/Rarity' },
                slot: { $ref: '#/components/schemas/Slot' },
                requiredLevel: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 100,
                  default: 1,
                },
                weight: {
                  type: 'number',
                  minimum: 0,
                  default: 1.0,
                },
                durability: {
                  type: 'integer',
                  minimum: 0,
                  default: 100,
                },
                maxDurability: {
                  type: 'integer',
                  minimum: 1,
                  default: 100,
                },
                value: {
                  type: 'integer',
                  minimum: 0,
                  default: 0,
                },
                is2Handed: { type: 'boolean', default: false },
                isThrowable: { type: 'boolean', default: false },
                isConsumable: { type: 'boolean', default: false },
                isQuestItem: { type: 'boolean', default: false },
                isTradeable: { type: 'boolean', default: true },
                imageId: { $ref: '#/components/schemas/UUID' },
                visibility: { $ref: '#/components/schemas/Visibility' },
              },
              required: ['name'],
            },

            // Character Schemas
            Character: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/UUID' },
                name: {
                  type: 'string',
                  minLength: 2,
                  maxLength: 100,
                  description: 'Unique character name',
                  example: 'Aragorn',
                },
                sex: { $ref: '#/components/schemas/Sex' },
                age: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 10000,
                  description: 'Character age',
                  example: 25,
                },
                description: {
                  oneOf: [{ $ref: '#/components/schemas/Description' }, { type: 'null' }],
                  description: 'Character description',
                },
                level: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 100,
                  description: 'Character level',
                  example: 15,
                },
                experience: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Character experience points',
                  example: 12500,
                },
                // Core attributes
                health: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Character health points',
                  example: 150,
                },
                mana: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Character mana points',
                  example: 120,
                },
                stamina: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Character stamina points',
                  example: 100,
                },
                // Primary attributes
                strength: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  description: 'Strength attribute',
                  example: 18,
                },
                constitution: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  description: 'Constitution attribute',
                  example: 16,
                },
                dexterity: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  description: 'Dexterity attribute',
                  example: 14,
                },
                intelligence: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  description: 'Intelligence attribute',
                  example: 12,
                },
                wisdom: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  description: 'Wisdom attribute',
                  example: 13,
                },
                charisma: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 30,
                  description: 'Charisma attribute',
                  example: 15,
                },
                // Required relationships
                raceId: { $ref: '#/components/schemas/UUID' },
                archetypeId: { $ref: '#/components/schemas/UUID' },
                // Optional relationships
                imageId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                  description: 'Character image ID',
                },
                ownerId: { $ref: '#/components/schemas/UUID' },
                visibility: { $ref: '#/components/schemas/Visibility' },
                createdAt: { $ref: '#/components/schemas/Timestamp' },
                updatedAt: { $ref: '#/components/schemas/Timestamp' },
              },
              required: [
                'id',
                'name',
                'sex',
                'age',
                'level',
                'experience',
                'health',
                'mana',
                'stamina',
                'strength',
                'constitution',
                'dexterity',
                'intelligence',
                'wisdom',
                'charisma',
                'raceId',
                'archetypeId',
                'ownerId',
                'visibility',
                'createdAt',
                'updatedAt',
              ],
            },
            CreateCharacter: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  minLength: 2,
                  maxLength: 100,
                  description: 'Character name (must be unique)',
                  example: 'Aragorn',
                },
                sex: { $ref: '#/components/schemas/Sex' },
                age: {
                  type: 'integer',
                  minimum: 16,
                  maximum: 1000,
                  default: 18,
                  description: 'Character age',
                },
                description: { $ref: '#/components/schemas/Description' },
                raceId: { $ref: '#/components/schemas/UUID' },
                archetypeId: { $ref: '#/components/schemas/UUID' },
                level: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 100,
                  default: 1,
                },
                experience: {
                  type: 'integer',
                  minimum: 0,
                  default: 0,
                },
                strength: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 20,
                  default: 10,
                },
                constitution: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 20,
                  default: 10,
                },
                dexterity: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 20,
                  default: 10,
                },
                intelligence: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 20,
                  default: 10,
                },
                wisdom: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 20,
                  default: 10,
                },
                charisma: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 20,
                  default: 10,
                },
                imageId: { $ref: '#/components/schemas/UUID' },
                skillIds: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UUID' },
                  maxItems: 20,
                  description: 'Array of skill IDs',
                },
                perkIds: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UUID' },
                  maxItems: 20,
                  description: 'Array of perk IDs',
                },
                tagIds: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UUID' },
                  maxItems: 10,
                  description: 'Array of tag IDs',
                },
                visibility: { $ref: '#/components/schemas/Visibility' },
              },
              required: ['name', 'raceId', 'archetypeId'],
            },

            // Equipment Schemas
            Equipment: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/UUID' },
                characterId: { $ref: '#/components/schemas/UUID' },
                // Equipment slots
                headId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                faceId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                chestId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                legsId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                feetId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                handsId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                rightHandId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                leftHandId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                rightRingId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                leftRingId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                amuletId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                beltId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                backpackId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                cloakId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                createdAt: { $ref: '#/components/schemas/Timestamp' },
                updatedAt: { $ref: '#/components/schemas/Timestamp' },
              },
              required: ['id', 'characterId', 'createdAt', 'updatedAt'],
            },
            UpdateEquipment: {
              type: 'object',
              properties: {
                headId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                faceId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                chestId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                legsId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                feetId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                handsId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                rightHandId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                leftHandId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                rightRingId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                leftRingId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                amuletId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                beltId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                backpackId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
                cloakId: {
                  oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                },
              },
            },

            // Statistics Schemas
            Stats: {
              type: 'object',
              properties: {
                totalCount: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Total number of items',
                  example: 150,
                },
                byVisibility: {
                  type: 'object',
                  additionalProperties: { type: 'integer' },
                  description: 'Count by visibility level',
                },
                byOwnership: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      ownerId: {
                        oneOf: [{ $ref: '#/components/schemas/UUID' }, { type: 'null' }],
                      },
                      count: { type: 'integer', minimum: 0 },
                    },
                  },
                  description: 'Count by ownership',
                },
                createdToday: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Items created today',
                },
                createdThisWeek: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Items created this week',
                },
                createdThisMonth: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Items created this month',
                },
              },
              required: [
                'totalCount',
                'byVisibility',
                'byOwnership',
                'createdToday',
                'createdThisWeek',
                'createdThisMonth',
              ],
            },

            // Success Message Schemas
            SuccessMessage: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Success message',
                  example: 'Operation completed successfully',
                },
              },
              required: ['message'],
            },
            DeleteSuccess: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Deletion success message',
                  example: 'Resource deleted successfully',
                },
              },
              required: ['message'],
            },

            // Health Check Schemas
            HealthCheck: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['ok', 'error'],
                  description: 'Health check status',
                  example: 'ok',
                },
                timestamp: { $ref: '#/components/schemas/Timestamp' },
                uptime: {
                  type: 'number',
                  description: 'Server uptime in seconds',
                  example: 3600,
                },
                version: {
                  type: 'string',
                  description: 'API version',
                  example: '1.0.0',
                },
                environment: {
                  type: 'string',
                  description: 'Current environment',
                  example: 'development',
                },
                database: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['connected', 'disconnected', 'error'],
                      description: 'Database connection status',
                      example: 'connected',
                    },
                    responseTime: {
                      type: 'number',
                      description: 'Database response time in milliseconds',
                      example: 25,
                    },
                  },
                  required: ['status', 'responseTime'],
                },
              },
              required: ['status', 'timestamp', 'uptime', 'version', 'environment', 'database'],
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

    // Swagger UI configuration with production security considerations
    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        tryItOutEnabled: environment.NODE_ENV !== 'production', // Disable testing in production
        persistAuthorization: environment.NODE_ENV !== 'production', // No persistence in production
        filter: environment.NODE_ENV === 'production', // Enable filtering in production
        syntaxHighlight: {
          activate: environment.NODE_ENV !== 'production',
          theme: 'agate',
        },
      },
      uiHooks: {
        onRequest: (_request, _reply, next) => {
          next()
        },
        preHandler: (_request, _reply, next) => {
          next()
        },
      },
      staticCSP: environment.NODE_ENV === 'production', // Enable CSP in production
      transformStaticCSP: header => {
        // In production, enforce strict CSP for Swagger UI
        if (environment.NODE_ENV === 'production') {
          return "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
        }
        return header
      },
      transformSpecification: (swaggerObject, _request, _reply) => {
        // Remove internal endpoints or sensitive information in production
        if (environment.NODE_ENV === 'production') {
          // Could filter out internal-only endpoints here if needed
        }
        return swaggerObject
      },
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
