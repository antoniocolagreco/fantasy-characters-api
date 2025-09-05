import { Value } from '@sinclair/typebox/value'

import 'dotenv/config'
import { type Config, ConfigSchema } from '@/shared/schemas'

export function loadConfig(): Config {
    const rawConfig = {
        NODE_ENV: process.env.NODE_ENV ?? 'development',
        PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
        HOST: process.env.HOST ?? '0.0.0.0',

        DATABASE_URL: process.env.DATABASE_URL,

        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
        JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',

        CORS_ORIGINS: process.env.CORS_ORIGINS ?? 'http://localhost:3000',
        CORS_CREDENTIALS: process.env.CORS_CREDENTIALS !== 'false',

        OAUTH_ENABLED: process.env.OAUTH_ENABLED === 'true',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
        GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL,

        RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100,
        RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW ?? '1 minute',

        LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
        LOG_PRETTY: process.env.LOG_PRETTY === 'true',

        RBAC_ENABLED: process.env.RBAC_ENABLED !== 'false',

        MAX_FILE_SIZE: process.env.MAX_FILE_SIZE
            ? parseInt(process.env.MAX_FILE_SIZE, 10)
            : 5 * 1024 * 1024,
    }

    const result = Value.Check(ConfigSchema, rawConfig)
    if (!result) {
        const errors = [...Value.Errors(ConfigSchema, rawConfig)]
        const errorMessages = errors.map(e => `${e.path}: ${e.message}`).join(', ')
        throw new Error(`Invalid configuration: ${errorMessages}`)
    }

    return rawConfig as Config
}

// Export validated config instance for convenience
export const config = loadConfig()
