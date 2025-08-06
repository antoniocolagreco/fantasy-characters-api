/**
 * User Validation Schemas
 *
 * This module defines TypeBox schemas for user-related API operations,
 * following the validation patterns established in the shared infrastructure.
 */

import { Type, Static } from '@sinclair/typebox'
import { UuidSchema, EmailSchema, NameSchema, DescriptionSchema } from '../utils/validation.js'

// Role enum schema
export const RoleSchema = Type.Union([Type.Literal('USER'), Type.Literal('ADMIN'), Type.Literal('MODERATOR')])

export type UserRole = Static<typeof RoleSchema>

// Core User Schemas
export const UserCreateSchema = Type.Object(
    {
        email: EmailSchema,
        displayName: Type.Optional(NameSchema),
        bio: Type.Optional(DescriptionSchema),
        role: Type.Optional(RoleSchema)
    },
    {
        additionalProperties: false,
        description: 'Schema for creating a new user'
    }
)

export type UserCreateRequest = Static<typeof UserCreateSchema>

export const UserUpdateSchema = Type.Object(
    {
        displayName: Type.Optional(NameSchema),
        bio: Type.Optional(DescriptionSchema),
        isActive: Type.Optional(Type.Boolean()),
        isEmailVerified: Type.Optional(Type.Boolean()),
        role: Type.Optional(RoleSchema)
    },
    {
        additionalProperties: false,
        description: 'Schema for updating user information'
    }
)

export type UserUpdateRequest = Static<typeof UserUpdateSchema>

// User Response Schema (excludes sensitive data)
export const UserResponseSchema = Type.Object(
    {
        id: UuidSchema,
        email: EmailSchema,
        displayName: Type.Union([NameSchema, Type.Null()]),
        bio: Type.Union([DescriptionSchema, Type.Null()]),
        role: RoleSchema,
        isEmailVerified: Type.Boolean(),
        isActive: Type.Boolean(),
        profilePictureId: Type.Union([UuidSchema, Type.Null()]),
        lastLogin: Type.String({ format: 'date-time' }),
        createdAt: Type.String({ format: 'date-time' }),
        updatedAt: Type.String({ format: 'date-time' })
    },
    {
        description: 'User response schema (excludes sensitive data)'
    }
)

export type UserResponse = Static<typeof UserResponseSchema>

// User with stats response (includes counts)
export const UserWithStatsSchema = Type.Object(
    {
        ...UserResponseSchema.properties,
        stats: Type.Object({
            totalCharacters: Type.Number({ minimum: 0 }),
            totalImages: Type.Number({ minimum: 0 }),
            totalItems: Type.Number({ minimum: 0 }),
            totalTags: Type.Number({ minimum: 0 })
        })
    },
    {
        description: 'User response with statistics'
    }
)

export type UserWithStats = Static<typeof UserWithStatsSchema>

// User List Query Schema
export const UserListQuerySchema = Type.Object(
    {
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
        search: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        role: Type.Optional(RoleSchema),
        isActive: Type.Optional(Type.Boolean()),
        isEmailVerified: Type.Optional(Type.Boolean()),
        sortBy: Type.Optional(
            Type.Union([
                Type.Literal('email'),
                Type.Literal('displayName'),
                Type.Literal('createdAt'),
                Type.Literal('lastLogin')
            ])
        ),
        sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')]))
    },
    {
        additionalProperties: false,
        description: 'Schema for user list query parameters'
    }
)

export type UserListQuery = Static<typeof UserListQuerySchema>
