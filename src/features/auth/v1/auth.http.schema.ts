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
        message: Type.String(),
        requestId: Type.Optional(Type.String()),
        timestamp: Type.Optional(Type.String({ format: 'date-time' })),
    },
    { $id: 'ChangePasswordResponse' }
)

export const LogoutResponseSchema = Type.Object(
    {
        message: Type.String(),
        requestId: Type.Optional(Type.String()),
        timestamp: Type.Optional(Type.String({ format: 'date-time' })),
    },
    { $id: 'LogoutResponse' }
)

// ===== Response Schemas (HTTP layer) =====
export const LoginResponseSchema = Type.Object(
    {
        data: Type.Intersect([
            AuthenticatedUserSchema,
            Type.Object({
                accessToken: Type.String(),
                refreshToken: Type.String(),
            }),
        ]),
        requestId: Type.Optional(Type.String()),
        timestamp: Type.Optional(Type.String({ format: 'date-time' })),
    },
    { $id: 'LoginResponse' }
)

export const RefreshTokenResponseSchema = Type.Object(
    {
        data: Type.Object({
            accessToken: Type.String(),
            refreshToken: Type.Optional(Type.String()),
        }),
        requestId: Type.Optional(Type.String()),
        timestamp: Type.Optional(Type.String({ format: 'date-time' })),
    },
    { $id: 'RefreshTokenResponse' }
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
