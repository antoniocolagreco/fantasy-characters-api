import { Type, type Static } from '@sinclair/typebox'

import {
    PublicUserSchema,
    RefreshTokenSchema,
    UserSchema,
} from '@/features/users/users.domain.schema'
import {
    PaginationQuerySchema,
    SortQuerySchema,
    createPaginatedResponseSchema,
    createSuccessResponseSchema,
    RoleSchema,
} from '@/shared/schemas'

// ===== Request Schemas (HTTP v1) =====
export const CreateUserRequestSchema = Type.Object(
    {
        email: Type.String({
            format: 'email',
            transform: ['trim', 'toLowerCase'],
        }),
        password: Type.String({
            minLength: 8,
            maxLength: 128,
        }),
        role: Type.Optional(RoleSchema),
        isEmailVerified: Type.Optional(Type.Boolean()),
        isActive: Type.Optional(Type.Boolean()),
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
            search: Type.Optional(
                Type.String({
                    minLength: 1,
                    maxLength: 100,
                    transform: ['trim', 'toLowerCase'],
                })
            ),
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

// ===== Response Schemas (HTTP v1) =====
export const UserResponseSchema = createSuccessResponseSchema(PublicUserSchema, 'UserResponse')

export const PublicUserResponseSchema = createSuccessResponseSchema(
    PublicUserSchema,
    'PublicUserResponse'
)

export const UserListResponseSchema = createPaginatedResponseSchema(
    PublicUserSchema,
    'UserListResponse'
)

export const UserStatsResponseSchema = createSuccessResponseSchema(
    UserStatsSchema,
    'UserStatsResponse'
)

// ===== Re-exports for domain schemas used by controllers/types =====
export { UserSchema, PublicUserSchema, RefreshTokenSchema }

// ===== Types =====
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
