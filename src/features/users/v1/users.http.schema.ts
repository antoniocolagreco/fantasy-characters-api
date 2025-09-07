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
            description: 'User email address',
        }),
        password: Type.String({
            minLength: 8,
            maxLength: 128,
            description: 'User password',
        }),
        role: Type.Optional(RoleSchema),
        isEmailVerified: Type.Optional(
            Type.Boolean({
                description: 'Whether the email is verified',
            })
        ),
        isActive: Type.Optional(
            Type.Boolean({
                description: 'Whether the user account is active',
            })
        ),
        name: Type.Optional(
            Type.String({
                minLength: 1,
                maxLength: 100,
                transform: ['trim'],
                description: 'User display name',
            })
        ),
        bio: Type.Optional(
            Type.String({
                maxLength: 1000,
                transform: ['trim'],
                description: 'User biography',
            })
        ),
        oauthProvider: Type.Optional(
            Type.String({
                description: 'OAuth provider name',
            })
        ),
        oauthId: Type.Optional(
            Type.String({
                description: 'OAuth provider user ID',
            })
        ),
        lastPasswordChange: Type.Optional(
            Type.String({
                format: 'date-time',
                description: 'Last password change timestamp',
            })
        ),
        profilePictureId: Type.Optional(
            Type.String({
                format: 'uuid',
                description: 'Profile picture image ID',
            })
        ),
    },
    {
        $id: 'CreateUserRequest',
        title: 'Create User Request',
        description: 'Request data for creating a new user',
    }
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
    {
        $id: 'CreateUser',
        title: 'Create User',
        description: 'User data for creation (without system-generated fields)',
    }
)

export const UpdateUserSchema = Type.Partial(
    Type.Pick(UserSchema, ['name', 'bio', 'isEmailVerified', 'isActive', 'profilePictureId']),
    {
        $id: 'UpdateUser',
        title: 'Update User',
        description: 'Updateable user fields',
    }
)

export const BanUserSchema = Type.Object(
    {
        banReason: Type.Optional(
            Type.String({
                minLength: 1,
                maxLength: 500,
                description: 'Reason for banning the user',
            })
        ),
        bannedUntil: Type.Optional(
            Type.String({
                format: 'date-time',
                description: 'When the ban expires (leave empty for permanent ban)',
            })
        ),
    },
    {
        $id: 'BanUser',
        title: 'Ban User',
        description: 'Ban/unban user request data',
    }
)

// ===== Parameter Schemas =====
export const UserParamsSchema = Type.Object(
    {
        id: Type.String({
            format: 'uuid',
            description: 'User ID',
        }),
    },
    {
        $id: 'UserParams',
        title: 'User Parameters',
        description: 'URL parameters for user endpoints',
    }
)

// ===== Query Schemas =====
export const UserListQuerySchema = Type.Intersect(
    [
        Type.Object({
            role: Type.Optional(RoleSchema),
            isActive: Type.Optional(
                Type.Boolean({
                    description: 'Filter by active status',
                })
            ),
            isBanned: Type.Optional(
                Type.Boolean({
                    description: 'Filter by banned status',
                })
            ),
            hasProfilePicture: Type.Optional(
                Type.Boolean({
                    description: 'Filter by whether user has a profile picture',
                })
            ),
            search: Type.Optional(
                Type.String({
                    minLength: 1,
                    maxLength: 100,
                    transform: ['trim', 'toLowerCase'],
                    description: 'Search in user names and emails',
                })
            ),
        }),
        PaginationQuerySchema,
        SortQuerySchema,
    ],
    {
        $id: 'UserListQuery',
        title: 'User List Query',
        description: 'Query parameters for listing users',
    }
)

// ===== Stats Schema =====
export const UserStatsSchema = Type.Object(
    {
        totalUsers: Type.Number({
            description: 'Total number of users',
        }),
        activeUsers: Type.Number({
            description: 'Number of active users',
        }),
        bannedUsers: Type.Number({
            description: 'Number of banned users',
        }),
        unverifiedUsers: Type.Number({
            description: 'Number of users with unverified emails',
        }),
        usersByRole: Type.Object({
            USER: Type.Number({
                description: 'Number of users with USER role',
            }),
            MODERATOR: Type.Number({
                description: 'Number of users with MODERATOR role',
            }),
            ADMIN: Type.Number({
                description: 'Number of users with ADMIN role',
            }),
        }),
        newUsersLast30Days: Type.Number({
            description: 'Number of users created in the last 30 days',
        }),
    },
    {
        $id: 'UserStats',
        title: 'User Statistics',
        description: 'Statistical information about users',
    }
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
