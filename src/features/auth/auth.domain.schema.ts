import { type Static, Type } from '@sinclair/typebox'

import { RoleSchema } from '@/shared/schemas'

// JWT Claims Schema
export const JwtClaimsSchema = Type.Object(
    {
        sub: Type.String({ format: 'uuid' }),
        role: RoleSchema,
        iat: Type.Integer(),
        exp: Type.Integer(),
        jti: Type.Optional(Type.String({ format: 'uuid' })),
    },
    { $id: 'JwtClaims' }
)

// User Authentication Schemas
export const AuthenticatedUserSchema = Type.Object(
    {
        id: Type.String({ format: 'uuid' }),
        role: RoleSchema,
        email: Type.String({ format: 'email' }),
    },
    { $id: 'AuthenticatedUser' }
)

// Token Schemas
export const TokenPairSchema = Type.Object(
    {
        accessToken: Type.String(),
        refreshToken: Type.String(),
    },
    { $id: 'TokenPair' }
)

export const RefreshTokenPayloadSchema = Type.Object(
    {
        token: Type.String({ format: 'uuid' }),
        userId: Type.String({ format: 'uuid' }),
        expiresAt: Type.String({ format: 'date-time' }),
        deviceInfo: Type.Optional(Type.String()),
        ipAddress: Type.Optional(Type.String()),
        userAgent: Type.Optional(Type.String()),
    },
    { $id: 'RefreshTokenPayload' }
)

// JWT Configuration Schema
export const JwtConfigSchema = Type.Object(
    {
        secret: Type.String({ minLength: 32 }),
        accessTokenTtl: Type.Union([Type.String(), Type.Integer()]),
        refreshTokenTtl: Type.Union([Type.String(), Type.Integer()]),
        issuer: Type.String(),
        audience: Type.String(),
    },
    { $id: 'JwtConfig' }
)

// Derive TypeScript types from schemas
export type JwtClaims = Static<typeof JwtClaimsSchema>
export type AuthenticatedUser = Static<typeof AuthenticatedUserSchema>
export type TokenPair = Static<typeof TokenPairSchema>
export type RefreshTokenPayload = Static<typeof RefreshTokenPayloadSchema>
export type JwtConfig = Static<typeof JwtConfigSchema>

// Request Schemas (domain-level, version-agnostic)
export const LoginRequestSchema = Type.Object(
    {
        email: Type.String({
            format: 'email',
            transform: ['trim', 'toLowerCase'],
        }),
        password: Type.String({
            minLength: 8,
            maxLength: 128,
        }),
    },
    { $id: 'LoginRequest', additionalProperties: false }
)

export const RegisterRequestSchema = Type.Object(
    {
        email: Type.String({
            format: 'email',
            transform: ['trim', 'toLowerCase'],
        }),
        password: Type.String({
            minLength: 8,
            maxLength: 128,
        }),
        name: Type.Optional(
            Type.String({
                minLength: 1,
                maxLength: 100,
                transform: ['trim'],
            })
        ),
    },
    { $id: 'RegisterRequest', additionalProperties: false }
)

export const RefreshTokenRequestSchema = Type.Object(
    {
        refreshToken: Type.String({ format: 'uuid' }),
    },
    { $id: 'RefreshTokenRequest', additionalProperties: false }
)

export const ChangePasswordRequestSchema = Type.Object(
    {
        currentPassword: Type.String({ minLength: 8, maxLength: 128 }),
        newPassword: Type.String({ minLength: 8, maxLength: 128 }),
    },
    { $id: 'ChangePasswordRequest', additionalProperties: false }
)
// Derive types for requests
export type LoginRequest = Static<typeof LoginRequestSchema>
export type RegisterRequest = Static<typeof RegisterRequestSchema>
export type RefreshTokenRequest = Static<typeof RefreshTokenRequestSchema>
export type ChangePasswordRequest = Static<typeof ChangePasswordRequestSchema>

// Service-specific schemas for auth operations
export const AuthUserSchema = Type.Object(
    {
        id: Type.String({ format: 'uuid' }),
        email: Type.String({ format: 'email' }),
        role: RoleSchema,
    },
    { $id: 'AuthUser' }
)

export const LoginResultSchema = Type.Intersect(
    [
        AuthUserSchema,
        Type.Object({
            accessToken: Type.String(),
            refreshToken: Type.String(),
        }),
    ],
    { $id: 'LoginResult' }
)

export const RefreshTokensResultSchema = Type.Object(
    {
        accessToken: Type.String(),
        refreshToken: Type.Optional(Type.String()),
    },
    { $id: 'RefreshTokensResult' }
)

// Derive types for service operations
export type AuthUser = Static<typeof AuthUserSchema>
export type LoginResult = Static<typeof LoginResultSchema>
export type RefreshTokensResult = Static<typeof RefreshTokensResultSchema>
