import { Type } from '@sinclair/typebox'

// Authentication Schemas

// User Registration Schema
export const RegisterUserSchema = Type.Object(
  {
    email: Type.String({ format: 'email', description: 'User email address' }),
    password: Type.String({
      minLength: 8,
      maxLength: 128,
      description: 'User password (minimum 8 characters)',
    }),
    name: Type.Optional(
      Type.String({
        minLength: 2,
        maxLength: 50,
        description: 'User display name',
      }),
    ),
    bio: Type.Optional(
      Type.String({
        maxLength: 500,
        description: 'User bio',
      }),
    ),
  },
  {
    $id: 'RegisterUserSchema',
    description: 'Schema for user registration',
  },
)

// User Login Schema
export const LoginUserSchema = Type.Object(
  {
    email: Type.String({ format: 'email', description: 'User email address' }),
    password: Type.String({ description: 'User password' }),
  },
  {
    $id: 'LoginUserSchema',
    description: 'Schema for user login',
  },
)

// Password Change Schema
export const ChangePasswordSchema = Type.Object(
  {
    currentPassword: Type.String({ description: 'Current password' }),
    newPassword: Type.String({
      minLength: 8,
      maxLength: 128,
      description: 'New password (minimum 8 characters)',
    }),
  },
  {
    $id: 'ChangePasswordSchema',
    description: 'Schema for changing password',
  },
)

// Profile Update Schema
export const UpdateProfileSchema = Type.Object(
  {
    name: Type.Optional(
      Type.String({
        minLength: 2,
        maxLength: 50,
        description: 'User display name',
      }),
    ),
    bio: Type.Optional(
      Type.String({
        maxLength: 500,
        description: 'User bio',
      }),
    ),
  },
  {
    $id: 'UpdateProfileSchema',
    description: 'Schema for updating user profile',
  },
)

// Refresh Token Schema
export const RefreshTokenSchema = Type.Object(
  {
    refreshToken: Type.String({ description: 'Refresh token' }),
  },
  {
    $id: 'RefreshTokenSchema',
    description: 'Schema for refresh token request',
  },
)

// JWT Token Response Schema
export const TokenResponseSchema = Type.Object(
  {
    accessToken: Type.String({ description: 'JWT access token' }),
    refreshToken: Type.String({ description: 'JWT refresh token' }),
    tokenType: Type.String({ default: 'Bearer', description: 'Token type' }),
    expiresIn: Type.String({ description: 'Token expiration time' }),
    user: Type.Object({
      id: Type.String({ description: 'User ID' }),
      email: Type.String({ description: 'User email' }),
      name: Type.Union([Type.String(), Type.Null()], {
        description: 'User display name',
      }),
      role: Type.String({ description: 'User role' }),
      isEmailVerified: Type.Boolean({ description: 'Email verification status' }),
      isActive: Type.Boolean({ description: 'User active status' }),
      lastLogin: Type.String({ format: 'date-time', description: 'Last login timestamp' }),
      createdAt: Type.String({ format: 'date-time', description: 'Account creation timestamp' }),
    }),
  },
  {
    $id: 'TokenResponseSchema',
    description: 'JWT token response schema',
  },
)

// User Profile Response Schema
export const UserProfileSchema = Type.Object(
  {
    id: Type.String({ description: 'User ID' }),
    email: Type.String({ description: 'User email' }),
    name: Type.Union([Type.String(), Type.Null()], {
      description: 'User display name',
    }),
    bio: Type.Union([Type.String(), Type.Null()], { description: 'User bio' }),
    role: Type.String({ description: 'User role' }),
    isEmailVerified: Type.Boolean({ description: 'Email verification status' }),
    isActive: Type.Boolean({ description: 'User active status' }),
    lastLogin: Type.String({ format: 'date-time', description: 'Last login timestamp' }),
    createdAt: Type.String({ format: 'date-time', description: 'Account creation timestamp' }),
    updatedAt: Type.String({ format: 'date-time', description: 'Last update timestamp' }),
  },
  {
    $id: 'UserProfileSchema',
    description: 'User profile response schema',
  },
)

// Authentication Error Schema
export const AuthErrorSchema = Type.Object(
  {
    message: Type.String({ description: 'Error message' }),
    statusCode: Type.Number({ description: 'HTTP status code' }),
    error: Type.String({ description: 'Error type' }),
  },
  {
    $id: 'AuthErrorSchema',
    description: 'Authentication error response schema',
  },
)

// Success Message Schema
export const SuccessMessageSchema = Type.Object(
  {
    message: Type.String({ description: 'Success message' }),
  },
  {
    $id: 'SuccessMessageSchema',
    description: 'Success message response schema',
  },
)

// Request parameter schemas
export const AuthParamsSchema = Type.Object(
  {
    id: Type.String({ description: 'User ID' }),
  },
  {
    $id: 'AuthParamsSchema',
    description: 'Authentication parameters schema',
  },
)

// Common response schemas for OpenAPI documentation
export const CommonAuthResponses = {
  400: {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: AuthErrorSchema,
      },
    },
  },
  401: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: AuthErrorSchema,
      },
    },
  },
  403: {
    description: 'Forbidden',
    content: {
      'application/json': {
        schema: AuthErrorSchema,
      },
    },
  },
  409: {
    description: 'Conflict',
    content: {
      'application/json': {
        schema: AuthErrorSchema,
      },
    },
  },
  500: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: AuthErrorSchema,
      },
    },
  },
} as const
