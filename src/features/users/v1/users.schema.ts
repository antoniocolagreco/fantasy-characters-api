import { Type, type Static } from '@sinclair/typebox'

import {
    BaseEntitySchema,
    RoleSchema,
    PaginationQuerySchema,
    SortQuerySchema,
    createSuccessResponseSchema,
    createPaginatedResponseSchema,
} from '../../../shared/schemas'

// ===== User Schema =====
export const UserSchema = Type.Intersect(
    [
        BaseEntitySchema,
        Type.Object({
            email: Type.String({ format: 'email' }),
            passwordHash: Type.String(),
            role: RoleSchema,
            isEmailVerified: Type.Boolean(),
            isActive: Type.Boolean(),
            name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
            bio: Type.Optional(Type.String({ maxLength: 1000 })),
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

// User without sensitive fields (for public display)
export const PublicUserSchema = Type.Pick(
    UserSchema,
    ['id', 'name', 'bio', 'role', 'profilePictureId', 'createdAt', 'updatedAt'],
    { $id: 'PublicUser' }
)

// ===== RefreshToken Schema =====
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

// ===== Request Schemas =====
export const CreateUserRequestSchema = Type.Object(
    {
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 8, maxLength: 128 }),
        role: Type.Optional(RoleSchema),
        isEmailVerified: Type.Optional(Type.Boolean()),
        isActive: Type.Optional(Type.Boolean()),
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        bio: Type.Optional(Type.String({ maxLength: 1000 })),
        oauthProvider: Type.Optional(Type.String()),
        oauthId: Type.Optional(Type.String()),
        lastPasswordChange: Type.Optional(Type.String({ format: 'date-time' })),
        profilePictureId: Type.Optional(Type.String({ format: 'uuid' })),
    },
    { $id: 'CreateUserRequest' }
)

export const CreateUserSchema = Type.Omit(
    UserSchema,
    [
        'id',
        'passwordHash',
        'lastLogin',
        'isBanned',
        'banReason',
        'bannedUntil',
        'bannedById',
        'createdAt',
        'updatedAt',
    ],
    { $id: 'CreateUser' }
)

export const UpdateUserSchema = Type.Partial(
    Type.Pick(UserSchema, ['name', 'bio', 'isEmailVerified', 'isActive', 'profilePictureId']),
    { $id: 'UpdateUser' }
)

export const BanUserSchema = Type.Object(
    {
        banReason: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
        bannedUntil: Type.Optional(Type.String({ format: 'date-time' })),
    },
    { $id: 'BanUser' }
)

// ===== Parameter Schemas =====
export const UserParamsSchema = Type.Object(
    {
        id: Type.String({ format: 'uuid' }),
    },
    { $id: 'UserParams' }
)

// ===== Query Schemas =====
export const UserListQuerySchema = Type.Intersect(
    [
        Type.Object({
            role: Type.Optional(RoleSchema),
            isActive: Type.Optional(Type.Boolean()),
            isBanned: Type.Optional(Type.Boolean()),
            hasProfilePicture: Type.Optional(Type.Boolean()),
            search: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        }),
        PaginationQuerySchema,
        SortQuerySchema,
    ],
    { $id: 'UserListQuery' }
)

// ===== Stats Schema =====
export const UserStatsSchema = Type.Object(
    {
        totalUsers: Type.Number(),
        activeUsers: Type.Number(),
        bannedUsers: Type.Number(),
        unverifiedUsers: Type.Number(),
        usersByRole: Type.Object({
            USER: Type.Number(),
            MODERATOR: Type.Number(),
            ADMIN: Type.Number(),
        }),
        newUsersLast30Days: Type.Number(),
    },
    { $id: 'UserStats' }
)

// ===== Response Schemas =====
export const UserResponseSchema = createSuccessResponseSchema(UserSchema, 'UserResponse')

export const PublicUserResponseSchema = createSuccessResponseSchema(
    PublicUserSchema,
    'PublicUserResponse'
)

export const UserListResponseSchema = createPaginatedResponseSchema(UserSchema, 'UserListResponse')

export const UserStatsResponseSchema = createSuccessResponseSchema(
    UserStatsSchema,
    'UserStatsResponse'
)

// ===== TypeScript Types =====
export type User = Static<typeof UserSchema>
export type PublicUser = Static<typeof PublicUserSchema>
export type RefreshToken = Static<typeof RefreshTokenSchema>
export type CreateUserRequest = Static<typeof CreateUserRequestSchema>
export type CreateUser = Static<typeof CreateUserSchema>
export type UpdateUser = Static<typeof UpdateUserSchema>
export type BanUser = Static<typeof BanUserSchema>
export type UserParams = Static<typeof UserParamsSchema>
export type UserListQuery = Static<typeof UserListQuerySchema>
export type UserStats = Static<typeof UserStatsSchema>
