/**
 * User schemas for validation and documentation
 * TypeBox schemas for user-related endpoints
 */

import { Type, type Static } from '@sinclair/typebox'
import { ListPaginationQuerySchema } from '../shared/schemas/pagination.schema.js'

// User role enum schema
export const UserRoleSchema = Type.Union(
  [Type.Literal('USER'), Type.Literal('ADMIN'), Type.Literal('MODERATOR')],
  {
    description: 'User role in the system',
  },
)

// Base user schema (common fields)
export const BaseUserSchema = Type.Object(
  {
    email: Type.String({
      format: 'email',
      description: 'User email address (unique)',
      examples: ['user@example.com'],
    }),
    displayName: Type.Optional(
      Type.String({
        minLength: 2,
        maxLength: 100,
        description: 'Display name for the user',
        examples: ['John Doe'],
      }),
    ),
    bio: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'User biography or description',
        examples: ['Fantasy enthusiast and character creator'],
      }),
    ),
  },
  {
    additionalProperties: false,
  },
)

// Create user request schema
export const CreateUserRequestSchema = Type.Object(
  {
    ...BaseUserSchema.properties,
    passwordHash: Type.String({
      minLength: 8,
      maxLength: 128,
      description: 'User password (will be hashed)',
      examples: ['SecurePassword123!'],
    }),
    role: Type.Optional(UserRoleSchema),
  },
  {
    additionalProperties: false,
    description: 'Data required to create a new user',
  },
)

// Update user request schema (all fields optional except validation constraints)
export const UpdateUserRequestSchema = Type.Object(
  {
    email: Type.Optional(
      Type.String({
        format: 'email',
        description: 'User email address (unique)',
        examples: ['newemail@example.com'],
      }),
    ),
    displayName: Type.Optional(
      Type.String({
        minLength: 2,
        maxLength: 100,
        description: 'Display name for the user',
        examples: ['Jane Smith'],
      }),
    ),
    bio: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'User biography or description',
        examples: ['Updated bio text'],
      }),
    ),
    role: Type.Optional(UserRoleSchema),
    isActive: Type.Optional(
      Type.Boolean({
        description: 'Whether the user account is active',
        examples: [true, false],
      }),
    ),
    isEmailVerified: Type.Optional(
      Type.Boolean({
        description: 'Whether the user email is verified',
        examples: [true, false],
      }),
    ),
  },
  {
    additionalProperties: false,
    description: 'Data for updating an existing user (all fields optional)',
  },
)

// User response schema (what gets returned to clients)
export const UserResponseSchema = Type.Object(
  {
    id: Type.String({
      format: 'uuid',
      description: 'Unique user identifier',
      examples: ['123e4567-e89b-12d3-a456-426614174000'],
    }),
    email: Type.String({
      format: 'email',
      description: 'User email address',
      examples: ['user@example.com'],
    }),
    displayName: Type.Union([Type.String(), Type.Null()], {
      description: 'Display name for the user',
      examples: ['John Doe', null],
    }),
    bio: Type.Union([Type.String(), Type.Null()], {
      description: 'User biography or description',
      examples: ['Fantasy enthusiast', null],
    }),
    role: UserRoleSchema,
    isEmailVerified: Type.Boolean({
      description: 'Whether the user email is verified',
      examples: [true, false],
    }),
    isActive: Type.Boolean({
      description: 'Whether the user account is active',
      examples: [true, false],
    }),
    profilePictureId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()], {
      description: 'ID of the user profile picture image',
      examples: ['123e4567-e89b-12d3-a456-426614174000', null],
    }),
    lastLogin: Type.String({
      format: 'date-time',
      description: 'Timestamp of last login',
      examples: ['2023-08-13T10:30:00.000Z'],
    }),
    createdAt: Type.String({
      format: 'date-time',
      description: 'User creation timestamp',
      examples: ['2023-08-13T10:30:00.000Z'],
    }),
    updatedAt: Type.String({
      format: 'date-time',
      description: 'User last update timestamp',
      examples: ['2023-08-13T10:30:00.000Z'],
    }),
  },
  {
    additionalProperties: false,
    description: 'User information returned in API responses',
  },
)

// User list query schema (extends pagination with user-specific filters)
export const UserListQuerySchema = Type.Object(
  {
    ...ListPaginationQuerySchema.properties,
    role: Type.Optional(UserRoleSchema),
    isActive: Type.Optional(
      Type.Boolean({
        description: 'Filter by active status',
        examples: [true, false],
      }),
    ),
    isEmailVerified: Type.Optional(
      Type.Boolean({
        description: 'Filter by email verification status',
        examples: [true, false],
      }),
    ),
    search: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Search in email and display name',
        examples: ['john', 'admin@example.com'],
      }),
    ),
  },
  {
    additionalProperties: false,
    description: 'Query parameters for listing users',
  },
)

// User list response schema
export const UserListResponseSchema = Type.Object(
  {
    users: Type.Array(UserResponseSchema, {
      description: 'Array of users',
    }),
    pagination: Type.Object({
      page: Type.Integer({ minimum: 1, description: 'Current page number' }),
      pageSize: Type.Integer({ minimum: 1, description: 'Items per page' }),
      total: Type.Integer({ minimum: 0, description: 'Total number of users' }),
      totalPages: Type.Integer({ minimum: 0, description: 'Total number of pages' }),
    }),
  },
  {
    additionalProperties: false,
    description: 'Response for user list endpoint',
  },
)

// User ID parameter schema
export const UserIdParamSchema = Type.Object(
  {
    id: Type.String({
      format: 'uuid',
      description: 'User ID',
      examples: ['123e4567-e89b-12d3-a456-426614174000'],
    }),
  },
  {
    additionalProperties: false,
  },
)

// Type exports for use in controllers and services
export type CreateUserRequest = Static<typeof CreateUserRequestSchema>
export type UpdateUserRequest = Static<typeof UpdateUserRequestSchema>
export type UserResponse = Static<typeof UserResponseSchema>
export type UserListQuery = Static<typeof UserListQuerySchema>
export type UserListResponse = Static<typeof UserListResponseSchema>
export type UserIdParam = Static<typeof UserIdParamSchema>
export type UserRole = Static<typeof UserRoleSchema>
