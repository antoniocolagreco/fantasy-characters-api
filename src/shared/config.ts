import { Type, Static } from '@sinclair/typebox'

// Environment configuration schema
export const EnvironmentSchema = Type.Object({
  NODE_ENV: Type.Union(
    [Type.Literal('development'), Type.Literal('production'), Type.Literal('test')],
    {
      default: 'development',
    },
  ),

  // Server Configuration
  PORT: Type.Number({ minimum: 1, maximum: 65535, default: 3000 }),
  HOST: Type.String({ default: '0.0.0.0' }),

  // API Configuration
  API_PREFIX: Type.String({ default: '/api' }),
  API_VERSION: Type.String({ default: 'v1' }),

  // Logging
  LOG_LEVEL: Type.Union(
    [
      Type.Literal('fatal'),
      Type.Literal('error'),
      Type.Literal('warn'),
      Type.Literal('info'),
      Type.Literal('debug'),
      Type.Literal('trace'),
    ],
    { default: 'info' },
  ),

  // Database (for future chapters)
  DATABASE_URL: Type.String({ default: 'file:./dev.db' }),

  // Security (for future chapters)
  JWT_SECRET: Type.String({ minLength: 32 }),
  JWT_EXPIRES_IN: Type.String({ default: '7d' }),

  // Argon2 Configuration
  ARGON2_MEMORY_COST: Type.Number({ minimum: 1024, default: 65536 }),
  ARGON2_TIME_COST: Type.Number({ minimum: 1, default: 3 }),
  ARGON2_PARALLELISM: Type.Number({ minimum: 1, default: 4 }),

  // Rate Limiting
  RATE_LIMIT_MAX: Type.Number({ minimum: 1, default: 100 }),
  RATE_LIMIT_TIMEWINDOW: Type.Number({ minimum: 1000, default: 60000 }),

  // CORS
  CORS_ORIGIN: Type.String({ default: 'http://localhost:3000' }),

  // Health Check
  HEALTH_CHECK_ENABLED: Type.Boolean({ default: true }),
})

export type EnvironmentConfig = Static<typeof EnvironmentSchema>

// Load and validate environment variables
function loadEnvironment(): EnvironmentConfig {
  const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    HOST: process.env.HOST || '0.0.0.0',
    API_PREFIX: process.env.API_PREFIX || '/api',
    API_VERSION: process.env.API_VERSION || 'v1',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production-123456789',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    ARGON2_MEMORY_COST: parseInt(process.env.ARGON2_MEMORY_COST || '65536', 10),
    ARGON2_TIME_COST: parseInt(process.env.ARGON2_TIME_COST || '3', 10),
    ARGON2_PARALLELISM: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    RATE_LIMIT_TIMEWINDOW: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || '60000', 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    HEALTH_CHECK_ENABLED: process.env.HEALTH_CHECK_ENABLED !== 'false',
  }

  // In production, ensure JWT_SECRET is properly set
  if (env.NODE_ENV === 'production' && env.JWT_SECRET.includes('dev-secret')) {
    throw new Error('JWT_SECRET must be set to a secure value in production')
  }

  return env as EnvironmentConfig
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

// RBAC is always enabled - no configuration needed
