import { Type, type Static } from '@sinclair/typebox'

import {
    LoginRequestSchema,
    RegisterRequestSchema,
    RefreshTokenRequestSchema,
    ChangePasswordRequestSchema,
    AuthenticatedUserSchema,
} from '../auth.domain.schema'

import { createSuccessResponseSchema } from '@/shared/schemas'

// ===== Re-export auth schemas =====
export {
    LoginRequestSchema,
    RegisterRequestSchema,
    RefreshTokenRequestSchema,
    ChangePasswordRequestSchema,
} from '../auth.domain.schema'

// ===== Response Schemas =====
export const RegisterResponseSchema = createSuccessResponseSchema(
    AuthenticatedUserSchema,
    'RegisterResponse'
)

export const ChangePasswordResponseSchema = Type.Object(
    {
        message: Type.String({
            description: 'Success message',
        }),
        requestId: Type.Optional(
            Type.String({
                description: 'Request ID',
            })
        ),
        timestamp: Type.Optional(
            Type.String({
                format: 'date-time',
                description: 'Response timestamp',
            })
        ),
    },
    {
        $id: 'ChangePasswordResponse',
        title: 'Change Password Response',
        description: 'Response for successful password change',
    }
)

export const LogoutResponseSchema = Type.Object(
    {
        message: Type.String({
            description: 'Success message',
        }),
        requestId: Type.Optional(
            Type.String({
                description: 'Request ID',
            })
        ),
        timestamp: Type.Optional(
            Type.String({
                format: 'date-time',
                description: 'Response timestamp',
            })
        ),
    },
    {
        $id: 'LogoutResponse',
        title: 'Logout Response',
        description: 'Response for successful logout',
    }
)

// ===== Response Schemas (HTTP layer) =====
export const LoginResponseSchema = Type.Object(
    {
        data: Type.Intersect([
            AuthenticatedUserSchema,
            Type.Object({
                accessToken: Type.String({
                    description: 'JWT access token',
                }),
                refreshToken: Type.String({
                    description: 'Refresh token',
                }),
            }),
        ]),
        requestId: Type.Optional(
            Type.String({
                description: 'Request ID',
            })
        ),
        timestamp: Type.Optional(
            Type.String({
                format: 'date-time',
                description: 'Response timestamp',
            })
        ),
    },
    {
        $id: 'LoginResponse',
        title: 'Login Response',
        description: 'Successful login response with user data and tokens',
    }
)

export const RefreshTokenResponseSchema = Type.Object(
    {
        data: Type.Object({
            accessToken: Type.String({
                description: 'New JWT access token',
            }),
            refreshToken: Type.Optional(
                Type.String({
                    description: 'New refresh token (if rotated)',
                })
            ),
        }),
        requestId: Type.Optional(
            Type.String({
                description: 'Request ID',
            })
        ),
        timestamp: Type.Optional(
            Type.String({
                format: 'date-time',
                description: 'Response timestamp',
            })
        ),
    },
    {
        $id: 'RefreshTokenResponse',
        title: 'Refresh Token Response',
        description: 'Response for successful token refresh',
    }
)

// ===== TypeScript Types =====
export type LoginRequest = Static<typeof LoginRequestSchema>
export type RegisterRequest = Static<typeof RegisterRequestSchema>
export type RefreshTokenRequest = Static<typeof RefreshTokenRequestSchema>
export type ChangePasswordRequest = Static<typeof ChangePasswordRequestSchema>
export type LoginResponse = Static<typeof LoginResponseSchema>
export type RegisterResponse = Static<typeof RegisterResponseSchema>
export type RefreshTokenResponse = Static<typeof RefreshTokenResponseSchema>
export type ChangePasswordResponse = Static<typeof ChangePasswordResponseSchema>
export type LogoutResponse = Static<typeof LogoutResponseSchema>
