import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsync } from 'fastify'

import { authController } from './auth.controller'
import {
    ChangePasswordRequestSchema,
    ChangePasswordResponseSchema,
    LoginRequestSchema,
    LoginResponseSchema,
    LogoutResponseSchema,
    RefreshTokenRequestSchema,
    RefreshTokenResponseSchema,
    RegisterRequestSchema,
    RegisterResponseSchema,
} from './auth.http.schema'

import { createAuthMiddleware } from '@/features/auth/auth.middleware'
import { verificationController } from '@/features/auth/v1/verification.controller'
import { config } from '@/infrastructure/config'
import type { BasicAuthRequest, BasicReply } from '@/shared'
import { ErrorResponseSchema } from '@/shared/schemas'

export const authRoutesV1: FastifyPluginAsync = async app => {
    app.withTypeProvider<TypeBoxTypeProvider>()

    // Create required auth middleware instance
    const authMiddleware = createAuthMiddleware({
        secret: config.JWT_SECRET,
        accessTokenTtl: config.JWT_ACCESS_EXPIRES_IN,
        refreshTokenTtl: config.JWT_REFRESH_EXPIRES_IN,
        issuer: 'fantasy-characters-api',
        audience: 'fantasy-characters-app',
    })

    // POST /api/v1/auth/login
    app.post(
        '/auth/login',
        {
            schema: {
                tags: ['Authentication'],
                summary: 'Login user',
                body: LoginRequestSchema,
                response: {
                    200: LoginResponseSchema,
                    400: ErrorResponseSchema,
                    401: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        authController.login
    )

    // POST /api/v1/auth/register
    app.post(
        '/auth/register',
        {
            schema: {
                tags: ['Authentication'],
                summary: 'Register new user',
                body: RegisterRequestSchema,
                response: {
                    201: RegisterResponseSchema,
                    400: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        authController.register
    )

    // POST /api/v1/auth/refresh
    app.post(
        '/auth/refresh',
        {
            schema: {
                tags: ['Authentication'],
                summary: 'Refresh access token',
                body: RefreshTokenRequestSchema,
                response: {
                    200: RefreshTokenResponseSchema,
                    400: ErrorResponseSchema,
                    401: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        authController.refreshToken
    )

    // POST /api/v1/auth/logout
    app.post(
        '/auth/logout',
        {
            schema: {
                tags: ['Authentication'],
                summary: 'Logout user',
                body: RefreshTokenRequestSchema,
                response: {
                    200: LogoutResponseSchema,
                    400: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        authController.logout
    )

    // POST /api/v1/auth/logout-all
    app.post(
        '/auth/logout-all',
        {
            preHandler: async (request, reply) => {
                const authRequest = request as BasicAuthRequest
                const authReply = reply as BasicReply
                authMiddleware(authRequest, authReply)
            },
            schema: {
                tags: ['Authentication'],
                summary: 'Logout from all devices',
                response: {
                    200: LogoutResponseSchema,
                    401: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        authController.logoutAll
    )

    // PUT /api/v1/auth/change-password
    app.put(
        '/auth/change-password',
        {
            preHandler: async (request, reply) => {
                const authRequest = request as BasicAuthRequest
                const authReply = reply as BasicReply
                authMiddleware(authRequest, authReply)
            },
            schema: {
                tags: ['Authentication'],
                summary: 'Change user password',
                body: ChangePasswordRequestSchema,
                response: {
                    200: ChangePasswordResponseSchema,
                    400: ErrorResponseSchema,
                    401: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        authController.changePassword
    )

    // POST /api/v1/auth/verify/send (auth required)
    app.post(
        '/auth/verify/send',
        {
            preHandler: async (request, reply) => {
                const authRequest = request as BasicAuthRequest
                const authReply = reply as BasicReply
                authMiddleware(authRequest, authReply)
            },
            config: { rateLimit: app.rateLimitConfigs.auth.verifySend },
            schema: {
                tags: ['Authentication'],
                summary: 'Send email verification link',
                // Explicit empty body to satisfy content-type application/json without payload
                body: Type.Object({}, { additionalProperties: false }),
                response: {
                    200: LogoutResponseSchema,
                    202: LogoutResponseSchema,
                    401: ErrorResponseSchema,
                    429: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        verificationController.send
    )

    // GET /api/v1/auth/verify/confirm
    app.get(
        '/auth/verify/confirm',
        {
            // Confirmation is public; keep default global rate limit
            schema: {
                tags: ['Authentication'],
                summary: 'Confirm email verification',
                querystring: Type.Object({ token: Type.Optional(Type.String()) }),
                response: {
                    200: LogoutResponseSchema,
                    400: ErrorResponseSchema,
                    429: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        verificationController.confirm
    )
}
