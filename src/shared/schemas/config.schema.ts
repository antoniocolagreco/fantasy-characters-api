import { Type, type Static } from '@sinclair/typebox'

export const ConfigSchema = Type.Object(
    {
        NODE_ENV: Type.Union([
            Type.Literal('development'),
            Type.Literal('production'),
            Type.Literal('test'),
        ]),
        PORT: Type.Integer({ minimum: 1, maximum: 65535, default: 3000 }),
        HOST: Type.String({ default: '0.0.0.0' }),

        // Database
        DATABASE_URL: Type.String({ minLength: 1 }),

        // Authentication
        JWT_SECRET: Type.String({ minLength: 32 }),
        JWT_REFRESH_SECRET: Type.String({ minLength: 32 }),
        JWT_ACCESS_EXPIRES_IN: Type.String({ default: '15m' }),
        JWT_REFRESH_EXPIRES_IN: Type.String({ default: '30d' }),

        // CORS
        CORS_ORIGINS: Type.String({ default: 'http://localhost:3000' }),
        CORS_CREDENTIALS: Type.Boolean({ default: true }),

        // OAuth (optional)
        OAUTH_ENABLED: Type.Boolean({ default: false }),
        GOOGLE_CLIENT_ID: Type.Optional(Type.String()),
        GOOGLE_CLIENT_SECRET: Type.Optional(Type.String()),
        GOOGLE_CALLBACK_URL: Type.Optional(Type.String()),
        GITHUB_CLIENT_ID: Type.Optional(Type.String()),
        GITHUB_CLIENT_SECRET: Type.Optional(Type.String()),
        GITHUB_CALLBACK_URL: Type.Optional(Type.String()),

        // Security
        RATE_LIMIT_MAX: Type.Integer({ minimum: 1, default: 100 }),
        RATE_LIMIT_WINDOW: Type.String({ default: '1 minute' }),

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
        LOG_PRETTY: Type.Boolean({ default: false }),

        // Features
        RBAC_ENABLED: Type.Boolean({ default: true }),

        // File upload
        MAX_FILE_SIZE: Type.Integer({ minimum: 1024, default: 5 * 1024 * 1024 }), // 5MB
    },
    { $id: 'ConfigSchema' }
)

export type Config = Static<typeof ConfigSchema>
