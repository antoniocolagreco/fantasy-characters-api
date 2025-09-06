import { Type, type Static } from '@sinclair/typebox'

import { BaseEntitySchema, RoleSchema } from '@/shared/schemas'

// ===== User Schema (domain) =====
export const UserSchema = Type.Intersect(
    [
        BaseEntitySchema,
        Type.Object({
            email: Type.String({
                format: 'email',
                transform: ['trim', 'toLowerCase'],
            }),
            passwordHash: Type.String(),
            role: RoleSchema,
            isEmailVerified: Type.Boolean(),
            isActive: Type.Boolean(),
            name: Type.Optional(
                Type.String({
                    minLength: 1,
                    maxLength: 100,
                    transform: ['trim'],
                })
            ),
            bio: Type.Optional(Type.String({ maxLength: 1000, transform: ['trim'] })),
            oauthProvider: Type.Optional(Type.String()),
            oauthId: Type.Optional(Type.String()),
            lastPasswordChange: Type.Optional(Type.String({ format: 'date-time' })),
            lastLogin: Type.String({ format: 'date-time' }),
            isBanned: Type.Boolean(),
            banReason: Type.Optional(Type.String()),
            bannedUntil: Type.Optional(Type.String({ format: 'date-time' })),
            bannedById: Type.Optional(Type.String({ format: 'uuid' })),
            profilePictureId: Type.Optional(Type.String({ format: 'uuid' })),
        }),
    ],
    { $id: 'User' }
)

// Public projection (domain-level projection used across layers)
export const PublicUserSchema = Type.Pick(
    UserSchema,
    ['id', 'name', 'bio', 'role', 'profilePictureId', 'createdAt', 'updatedAt'],
    { $id: 'PublicUser' }
)

// ===== RefreshToken Schema (domain) =====
export const RefreshTokenSchema = Type.Intersect(
    [
        BaseEntitySchema,
        Type.Object({
            token: Type.String(),
            userId: Type.String({ format: 'uuid' }),
            expiresAt: Type.String({ format: 'date-time' }),
            isRevoked: Type.Boolean(),
            deviceInfo: Type.Optional(Type.String()),
            ipAddress: Type.Optional(Type.String()),
            userAgent: Type.Optional(Type.String()),
        }),
    ],
    { $id: 'RefreshToken' }
)

// ===== Domain Types =====
export type User = Static<typeof UserSchema>
export type PublicUser = Static<typeof PublicUserSchema>
export type RefreshToken = Static<typeof RefreshTokenSchema>
// Note: Do not re-export HTTP-layer schemas from domain to avoid cycles
