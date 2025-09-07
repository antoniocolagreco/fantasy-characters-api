import { type Static, Type } from '@sinclair/typebox'

import { RoleSchema } from '@/shared/schemas'

// JWT Claims Schema
export const JwtClaimsSchema = Type.Object(
    {
        sub: Type.String({
            format: 'uuid',
            description: 'Subject (user ID)',
        }),
        role: RoleSchema,
        iat: Type.Integer({
            description: 'Issued at timestamp',
        }),
        exp: Type.Integer({
            description: 'Expiration timestamp',
        }),
        jti: Type.Optional(
            Type.String({
                format: 'uuid',
                description: 'JWT ID (optional)',
            })
        ),
    },
    {
        $id: 'JwtClaims',
        title: 'JWT Claims',
        description: 'JWT token claims/payload',
    }
)

// User Authentication Schemas
export const AuthenticatedUserSchema = Type.Object(
    {
        id: Type.String({
            format: 'uuid',
            description: 'User ID',
        }),
        role: RoleSchema,
        email: Type.String({
            format: 'email',
            description: 'User email address',
        }),
    },
    {
        $id: 'AuthenticatedUser',
        title: 'Authenticated User',
        description: 'Authenticated user information',
    }
)

// Token Schemas
export const TokenPairSchema = Type.Object(
    {
        accessToken: Type.String({
            description: 'JWT access token',
        }),
        refreshToken: Type.String({
            description: 'Refresh token',
        }),
    },
    {
        $id: 'TokenPair',
        title: 'Token Pair',
        description: 'Access and refresh token pair',
    }
)

export const RefreshTokenPayloadSchema = Type.Object(
    {
        token: Type.String({
            format: 'uuid',
            description: 'Refresh token ID',
        }),
        userId: Type.String({
            format: 'uuid',
            description: 'User ID this token belongs to',
        }),
        expiresAt: Type.String({
            format: 'date-time',
            description: 'When the refresh token expires',
        }),
        deviceInfo: Type.Optional(
            Type.String({
                description: 'Device information',
            })
        ),
        ipAddress: Type.Optional(
            Type.String({
                description: 'IP address where token was issued',
            })
        ),
        userAgent: Type.Optional(
            Type.String({
                description: 'User agent string',
            })
        ),
    },
    {
        $id: 'RefreshTokenPayload',
        title: 'Refresh Token Payload',
        description: 'Refresh token data structure',
    }
)

// JWT Configuration Schema
export const JwtConfigSchema = Type.Object(
    {
        secret: Type.String({
            minLength: 32,
            description: 'JWT signing secret',
        }),
        accessTokenTtl: Type.Union([
            Type.String({
                description: 'Access token TTL (string format)',
            }),
            Type.Integer({
                description: 'Access token TTL (seconds)',
            }),
        ]),
        refreshTokenTtl: Type.Union([
            Type.String({
                description: 'Refresh token TTL (string format)',
            }),
            Type.Integer({
                description: 'Refresh token TTL (seconds)',
            }),
        ]),
        issuer: Type.String({
            description: 'JWT issuer',
        }),
        audience: Type.String({
            description: 'JWT audience',
        }),
    },
    {
        $id: 'JwtConfig',
        title: 'JWT Configuration',
        description: 'JWT configuration settings',
    }
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
            description: 'User email address',
        }),
        // Login should accept existing passwords of any reasonable length; do not block short dev passwords
        password: Type.String({
            minLength: 4,
            maxLength: 128,
            description: 'User password',
        }),
    },
    {
        $id: 'LoginRequest',
        title: 'Login Request',
        description: 'User login credentials',
        additionalProperties: false,
    }
)

export const RegisterRequestSchema = Type.Object(
    {
        email: Type.String({
            format: 'email',
            transform: ['trim', 'toLowerCase'],
            description: 'User email address',
        }),
        password: Type.String({
            minLength: 8,
            maxLength: 128,
            description: 'User password (minimum 8 characters)',
        }),
        name: Type.Optional(
            Type.String({
                minLength: 1,
                maxLength: 100,
                transform: ['trim'],
                description: 'Optional display name',
            })
        ),
    },
    {
        $id: 'RegisterRequest',
        title: 'Register Request',
        description: 'User registration data',
        additionalProperties: false,
    }
)

export const RefreshTokenRequestSchema = Type.Object(
    {
        refreshToken: Type.String({
            format: 'uuid',
            description: 'Refresh token for getting new access token',
        }),
    },
    {
        $id: 'RefreshTokenRequest',
        title: 'Refresh Token Request',
        description: 'Request to refresh access token',
        additionalProperties: false,
    }
)

export const ChangePasswordRequestSchema = Type.Object(
    {
        currentPassword: Type.String({
            minLength: 8,
            maxLength: 128,
            description: 'Current password',
        }),
        newPassword: Type.String({
            minLength: 8,
            maxLength: 128,
            description: 'New password (minimum 8 characters)',
        }),
    },
    {
        $id: 'ChangePasswordRequest',
        title: 'Change Password Request',
        description: 'Request to change user password',
        additionalProperties: false,
    }
)
// Derive types for requests
export type LoginRequest = Static<typeof LoginRequestSchema>
export type RegisterRequest = Static<typeof RegisterRequestSchema>
export type RefreshTokenRequest = Static<typeof RefreshTokenRequestSchema>
export type ChangePasswordRequest = Static<typeof ChangePasswordRequestSchema>

// Service-specific schemas for auth operations
export const AuthUserSchema = Type.Object(
    {
        id: Type.String({
            format: 'uuid',
            description: 'User ID',
        }),
        email: Type.String({
            format: 'email',
            description: 'User email address',
        }),
        role: RoleSchema,
    },
    {
        $id: 'AuthUser',
        title: 'Auth User',
        description: 'User data for authentication operations',
    }
)

export const LoginResultSchema = Type.Intersect(
    [
        AuthUserSchema,
        Type.Object({
            accessToken: Type.String({
                description: 'JWT access token',
            }),
            refreshToken: Type.String({
                description: 'Refresh token',
            }),
        }),
    ],
    {
        $id: 'LoginResult',
        title: 'Login Result',
        description: 'Successful login response with user data and tokens',
    }
)

export const RefreshTokensResultSchema = Type.Object(
    {
        accessToken: Type.String({
            description: 'New JWT access token',
        }),
        refreshToken: Type.Optional(
            Type.String({
                description: 'New refresh token (if rotated)',
            })
        ),
    },
    {
        $id: 'RefreshTokensResult',
        title: 'Refresh Tokens Result',
        description: 'Result of token refresh operation',
    }
)

// Derive types for service operations
export type AuthUser = Static<typeof AuthUserSchema>
export type LoginResult = Static<typeof LoginResultSchema>
export type RefreshTokensResult = Static<typeof RefreshTokensResultSchema>
