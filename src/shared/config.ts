import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import 'dotenv/config'

// Create AJV instance for validation
const ajv = new Ajv({
  allErrors: true,
  removeAdditional: false,
  strict: false,
})
addFormats(ajv)

// JWT token expiration pattern (e.g., '15m', '1h', '7d')
const JWT_EXPIRES_PATTERN = /^\d+[smhd]$/

// Environment configuration schema with comprehensive validation
export const EnvironmentSchema = Type.Object({
  // Core Environment
  NODE_ENV: Type.Union(
    [Type.Literal('development'), Type.Literal('production'), Type.Literal('test')],
    {
      default: 'development',
      description: 'Application environment mode',
    },
  ),

  // Server Configuration
  PORT: Type.Number({
    minimum: 1,
    maximum: 65535,
    default: 3000,
    description: 'Server port number',
  }),
  HOST: Type.String({
    default: '0.0.0.0',
    minLength: 1,
    description: 'Server host address',
  }),

  // API Configuration
  API_PREFIX: Type.String({
    default: '/api',
    pattern: '^/[a-zA-Z0-9/-]*$',
    description: 'API route prefix',
  }),
  API_VERSION: Type.String({
    default: 'v1',
    pattern: '^v\\d+$',
    description: 'API version identifier',
  }),

  // Logging Configuration
  LOG_LEVEL: Type.Union(
    [
      Type.Literal('fatal'),
      Type.Literal('error'),
      Type.Literal('warn'),
      Type.Literal('info'),
      Type.Literal('debug'),
      Type.Literal('trace'),
    ],
    {
      default: 'info',
      description: 'Logging level',
    },
  ),

  // Database Configuration (PostgreSQL required)
  DATABASE_URL: Type.String({
    default: 'postgresql://developer:password@localhost:5432/fantasy_character_api',
    minLength: 10,
    description: 'PostgreSQL connection string',
  }),

  // Authentication & Security
  JWT_SECRET: Type.String({
    minLength: 32,
    description: 'JWT signing secret (minimum 32 characters)',
  }),
  JWT_EXPIRES_IN: Type.String({
    default: '15m',
    pattern: JWT_EXPIRES_PATTERN.source,
    description: 'JWT expiration time (e.g., 15m, 1h, 7d)',
  }),
  REFRESH_TOKEN_EXPIRES_IN: Type.String({
    default: '7d',
    pattern: JWT_EXPIRES_PATTERN.source,
    description: 'Refresh token expiration time',
  }),

  // Password Hashing (Argon2) Configuration
  ARGON2_MEMORY_COST: Type.Number({
    minimum: 1024,
    maximum: 1024 * 1024, // 1GB max
    default: 65536,
    description: 'Argon2 memory cost in KB',
  }),
  ARGON2_TIME_COST: Type.Number({
    minimum: 1,
    maximum: 100,
    default: 3,
    description: 'Argon2 time cost (iterations)',
  }),
  ARGON2_PARALLELISM: Type.Number({
    minimum: 1,
    maximum: 64,
    default: 4,
    description: 'Argon2 parallelism factor',
  }),

  // Rate Limiting Configuration
  RATE_LIMIT_MAX: Type.Number({
    minimum: 1,
    maximum: 10000,
    default: 100,
    description: 'Maximum requests per time window',
  }),
  RATE_LIMIT_TIMEWINDOW: Type.Number({
    minimum: 1000,
    maximum: 3600000, // 1 hour max
    default: 60000,
    description: 'Rate limit time window in milliseconds',
  }),

  // CORS Configuration
  CORS_ORIGIN: Type.String({
    default: 'http://localhost:3000',
    description: 'CORS allowed origins (URL, *, true, or false)',
  }),

  // Health Check Configuration
  HEALTH_CHECK_ENABLED: Type.Boolean({
    default: true,
    description: 'Enable health check endpoints',
  }),

  // Caching Configuration
  CACHE_ENABLED: Type.Boolean({
    default: true,
    description: 'Enable response caching',
  }),
  CACHE_DEFAULT_TTL: Type.Number({
    minimum: 1,
    maximum: 86400, // 24 hours max
    default: 300,
    description: 'Default cache TTL in seconds',
  }),
  CACHE_MAX_ENTRIES: Type.Number({
    minimum: 1,
    maximum: 100000,
    default: 1000,
    description: 'Maximum cache entries',
  }),

  // RBAC Configuration
  RBAC_ENABLED: Type.Boolean({
    default: false,
    description: 'Enable Role-Based Access Control',
  }),

  // OAuth Configuration (Optional)
  GOOGLE_CLIENT_ID: Type.Optional(
    Type.String({
      minLength: 1,
      description: 'Google OAuth client ID',
    }),
  ),
  GOOGLE_CLIENT_SECRET: Type.Optional(
    Type.String({
      minLength: 1,
      description: 'Google OAuth client secret',
    }),
  ),
  GITHUB_CLIENT_ID: Type.Optional(
    Type.String({
      minLength: 1,
      description: 'GitHub OAuth client ID',
    }),
  ),
  GITHUB_CLIENT_SECRET: Type.Optional(
    Type.String({
      minLength: 1,
      description: 'GitHub OAuth client secret',
    }),
  ),

  // Session Management (for OAuth)
  SESSION_SECRET: Type.Optional(
    Type.String({
      minLength: 32,
      description: 'Session encryption secret (minimum 32 characters)',
    }),
  ),
})

export type EnvironmentConfig = Static<typeof EnvironmentSchema>

// Enhanced environment validation with production security checks
function validateEnvironment(env: Record<string, unknown>): void {
  // Validate using AJV
  const validate = ajv.compile(EnvironmentSchema)
  const isValid = validate(env)

  if (!isValid) {
    const errors = validate.errors
      ?.map(err => `${err.instancePath || 'root'}: ${err.message}`)
      .join(', ')
    throw new Error(`Environment validation failed: ${errors}`)
  }

  // Production-specific validations
  if (env.NODE_ENV === 'production') {
    // JWT Secret validation for production
    if (
      typeof env.JWT_SECRET === 'string' &&
      (env.JWT_SECRET.includes('dev-secret') ||
        env.JWT_SECRET.includes('change-this') ||
        env.JWT_SECRET.includes('your-') ||
        env.JWT_SECRET.length < 32)
    ) {
      throw new Error(
        'JWT_SECRET must be set to a secure, unique value in production (minimum 32 characters, no dev placeholders)',
      )
    }

    // Database URL validation for production
    if (
      typeof env.DATABASE_URL === 'string' &&
      (env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('developer:password'))
    ) {
      throw new Error(
        'DATABASE_URL must use production database credentials, not development defaults',
      )
    }

    // Session secret validation for production
    if (
      env.SESSION_SECRET &&
      typeof env.SESSION_SECRET === 'string' &&
      (env.SESSION_SECRET.includes('dev-secret') ||
        env.SESSION_SECRET.includes('your-') ||
        env.SESSION_SECRET.length < 64)
    ) {
      throw new Error(
        'SESSION_SECRET must be set to a secure, unique value in production (minimum 64 characters)',
      )
    }

    // CORS validation for production
    if (
      typeof env.CORS_ORIGIN === 'string' &&
      (env.CORS_ORIGIN === '*' || env.CORS_ORIGIN.includes('localhost'))
    ) {
      console.warn(
        'WARNING: CORS_ORIGIN allows all origins or localhost in production. Consider restricting to specific domains.',
      )
    }

    // RBAC should be enabled in production
    if (env.RBAC_ENABLED === false) {
      console.warn(
        'WARNING: RBAC_ENABLED is disabled in production. Consider enabling for security.',
      )
    }
  }
}

// Load and validate environment variables with comprehensive error handling
function loadEnvironment(): EnvironmentConfig {
  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT || '3000', 10),
      HOST: process.env.HOST || '0.0.0.0',
      API_PREFIX: process.env.API_PREFIX || '/api',
      API_VERSION: process.env.API_VERSION || 'v1',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      DATABASE_URL:
        process.env.DATABASE_URL ||
        'postgresql://developer:password@localhost:5432/fantasy_character_api',
      JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production-123456789',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
      REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      ARGON2_MEMORY_COST: parseInt(process.env.ARGON2_MEMORY_COST || '65536', 10),
      ARGON2_TIME_COST: parseInt(process.env.ARGON2_TIME_COST || '3', 10),
      ARGON2_PARALLELISM: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
      RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      RATE_LIMIT_TIMEWINDOW: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || '60000', 10),
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
      HEALTH_CHECK_ENABLED: process.env.HEALTH_CHECK_ENABLED !== 'false',
      CACHE_ENABLED: process.env.CACHE_ENABLED !== 'false',
      CACHE_DEFAULT_TTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10),
      CACHE_MAX_ENTRIES: parseInt(process.env.CACHE_MAX_ENTRIES || '1000', 10),
      RBAC_ENABLED: process.env.RBAC_ENABLED === 'true',
      // Optional OAuth fields
      ...(process.env.GOOGLE_CLIENT_ID && { GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID }),
      ...(process.env.GOOGLE_CLIENT_SECRET && {
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      }),
      ...(process.env.GITHUB_CLIENT_ID && { GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID }),
      ...(process.env.GITHUB_CLIENT_SECRET && {
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
      }),
      ...(process.env.SESSION_SECRET && { SESSION_SECRET: process.env.SESSION_SECRET }),
    }

    // Validate environment configuration
    validateEnvironment(env)

    return env as EnvironmentConfig
  } catch (error) {
    console.error('❌ Environment configuration error:', error)
    console.error('🔧 Please check your .env file and environment variables')
    process.exit(1)
  }
}

export const environment = loadEnvironment()

// Export individual config sections for convenience
export const serverConfig = {
  port: environment.PORT,
  host: environment.HOST,
  nodeEnv: environment.NODE_ENV,
}

export const apiConfig = {
  prefix: environment.API_PREFIX, // Use API_PREFIX: /api
  version: environment.API_VERSION,
}

export const logConfig = {
  level: environment.NODE_ENV === 'test' ? 'error' : environment.LOG_LEVEL,
  transport:
    environment.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
}

export const securityConfig = {
  jwtSecret: environment.JWT_SECRET,
  jwtExpiresIn: environment.JWT_EXPIRES_IN,
  refreshTokenExpiresIn: environment.REFRESH_TOKEN_EXPIRES_IN,
  rateLimitMax: environment.RATE_LIMIT_MAX,
  rateLimitTimeWindow: environment.RATE_LIMIT_TIMEWINDOW,
  corsOrigin: environment.CORS_ORIGIN,
}

export const argon2Config = {
  memoryCost: environment.ARGON2_MEMORY_COST,
  timeCost: environment.ARGON2_TIME_COST,
  parallelism: environment.ARGON2_PARALLELISM,
}

export const healthConfig = {
  enabled: environment.HEALTH_CHECK_ENABLED,
}

export const cacheConfig = {
  enabled: environment.CACHE_ENABLED,
  defaultTtl: environment.CACHE_DEFAULT_TTL,
  maxEntries: environment.CACHE_MAX_ENTRIES,
}

export const rbacConfig = {
  enabled: environment.RBAC_ENABLED,
}

export const oauthConfig = {
  google: {
    clientId: environment.GOOGLE_CLIENT_ID,
    clientSecret: environment.GOOGLE_CLIENT_SECRET,
    enabled: !!(environment.GOOGLE_CLIENT_ID && environment.GOOGLE_CLIENT_SECRET),
  },
  github: {
    clientId: environment.GITHUB_CLIENT_ID,
    clientSecret: environment.GITHUB_CLIENT_SECRET,
    enabled: !!(environment.GITHUB_CLIENT_ID && environment.GITHUB_CLIENT_SECRET),
  },
  sessionSecret: environment.SESSION_SECRET,
}

// Environment validation utility for external use
export const validateEnvironmentVariables = (): boolean => {
  try {
    loadEnvironment()
    return true
  } catch {
    return false
  }
}

// Get environment variable documentation
export const getEnvironmentDocumentation = (): Record<string, string> => {
  const props = EnvironmentSchema.properties as Record<string, { description?: string }>
  const docs: Record<string, string> = {}

  for (const [key, value] of Object.entries(props)) {
    if (value.description) {
      docs[key] = value.description
    }
  }

  return docs
}
