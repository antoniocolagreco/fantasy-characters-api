import { Type, Static } from '@sinclair/typebox';

// Environment configuration schema
export const EnvironmentSchema = Type.Object({
  NODE_ENV: Type.Union(
    [
      Type.Literal('development'),
      Type.Literal('production'),
      Type.Literal('test'),
    ],
    { default: 'development' }
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
    { default: 'info' }
  ),

  // Database (for future chapters)
  DATABASE_URL: Type.String({ default: 'file:./dev.db' }),

  // Security (for future chapters)
  JWT_SECRET: Type.String({ minLength: 32 }),
  JWT_EXPIRES_IN: Type.String({ default: '7d' }),

  // Rate Limiting
  RATE_LIMIT_MAX: Type.Number({ minimum: 1, default: 100 }),
  RATE_LIMIT_TIMEWINDOW: Type.Number({ minimum: 1000, default: 60000 }),

  // CORS
  CORS_ORIGIN: Type.String({ default: 'http://localhost:3000' }),

  // Health Check
  HEALTH_CHECK_ENABLED: Type.Boolean({ default: true }),
});

export type EnvironmentConfig = Static<typeof EnvironmentSchema>;

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
    JWT_SECRET:
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production-123456789',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    RATE_LIMIT_TIMEWINDOW: parseInt(
      process.env.RATE_LIMIT_TIMEWINDOW || '60000',
      10
    ),
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    HEALTH_CHECK_ENABLED: process.env.HEALTH_CHECK_ENABLED !== 'false',
  };

  // In production, ensure JWT_SECRET is properly set
  if (env.NODE_ENV === 'production' && env.JWT_SECRET.includes('dev-secret')) {
    throw new Error('JWT_SECRET must be set to a secure value in production');
  }

  return env as EnvironmentConfig;
}

export const config = loadEnvironment();

// Export individual config sections for convenience
export const serverConfig = {
  port: config.PORT,
  host: config.HOST,
  nodeEnv: config.NODE_ENV,
};

export const apiConfig = {
  prefix: `/${config.API_VERSION}`, // Use version as prefix: /v1
  version: config.API_VERSION,
};

export const logConfig = {
  level: config.LOG_LEVEL,
  transport:
    config.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
};

export const securityConfig = {
  jwtSecret: config.JWT_SECRET,
  jwtExpiresIn: config.JWT_EXPIRES_IN,
  rateLimitMax: config.RATE_LIMIT_MAX,
  rateLimitTimeWindow: config.RATE_LIMIT_TIMEWINDOW,
  corsOrigin: config.CORS_ORIGIN,
};

export const healthConfig = {
  enabled: config.HEALTH_CHECK_ENABLED,
};
