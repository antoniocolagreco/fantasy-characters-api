import type { FastifyInstance } from 'fastify'
import { authController } from './auth.controller.js'
import { authenticateUser, requireActiveUser } from './auth.middleware.js'
import {
  RegisterUserSchema,
  LoginUserSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
  RefreshTokenSchema,
  TokenResponseSchema,
  UserProfileSchema,
  SuccessMessageSchema,
  CommonAuthResponses,
} from './auth.schema.js'

/**
 * Authentication routes plugin
 * Provides endpoints for user registration, login, profile management, and account operations
 */
export const authRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // Add schemas to fastify for validation and documentation
  fastify.addSchema(RegisterUserSchema)
  fastify.addSchema(LoginUserSchema)
  fastify.addSchema(ChangePasswordSchema)
  fastify.addSchema(UpdateProfileSchema)
  fastify.addSchema(RefreshTokenSchema)
  fastify.addSchema(TokenResponseSchema)
  fastify.addSchema(UserProfileSchema)
  fastify.addSchema(SuccessMessageSchema)

  // Public routes (no authentication required)

  /**
   * Register a new user
   */
  fastify.post('/register', {
    schema: {
      description: 'Register a new user account',
      tags: ['Authentication'],
      body: { $ref: 'RegisterUserSchema#' },
      response: {
        201: {
          description: 'User registered successfully',
          content: {
            'application/json': {
              schema: TokenResponseSchema,
            },
          },
        },
        ...CommonAuthResponses,
      },
    },
    handler: authController.register,
  })

  /**
   * Login user
   */
  fastify.post('/login', {
    schema: {
      description: 'Authenticate user and return access token',
      tags: ['Authentication'],
      body: { $ref: 'LoginUserSchema#' },
      response: {
        200: {
          description: 'User authenticated successfully',
          content: {
            'application/json': {
              schema: TokenResponseSchema,
            },
          },
        },
        ...CommonAuthResponses,
      },
    },
    handler: authController.login,
  })

  // Protected routes (authentication required)

  /**
   * Logout user
   */
  fastify.post('/logout', {
    preHandler: [authenticateUser, requireActiveUser],
    schema: {
      description: 'Logout user (client-side token invalidation)',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'User logged out successfully',
          content: {
            'application/json': {
              schema: SuccessMessageSchema,
            },
          },
        },
        ...CommonAuthResponses,
      },
    },
    handler: authController.logout,
  })

  /**
   * Refresh access token using refresh token
   */
  fastify.post('/refresh', {
    schema: {
      description: 'Refresh access token using refresh token',
      tags: ['Authentication'],
      body: { $ref: 'RefreshTokenSchema#' },
      response: {
        200: {
          description: 'Access token refreshed successfully',
          content: {
            'application/json': {
              schema: TokenResponseSchema,
            },
          },
        },
        ...CommonAuthResponses,
      },
    },
    handler: authController.refresh,
  })

  /**
   * Get current user profile
   */
  fastify.get('/profile', {
    preHandler: [authenticateUser, requireActiveUser],
    schema: {
      description: 'Get current authenticated user profile',
      tags: ['Authentication', 'Profile'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'User profile retrieved successfully',
          content: {
            'application/json': {
              schema: UserProfileSchema,
            },
          },
        },
        ...CommonAuthResponses,
      },
    },
    handler: authController.getProfile,
  })

  /**
   * Update current user profile
   */
  fastify.put('/profile', {
    preHandler: [authenticateUser, requireActiveUser],
    schema: {
      description: 'Update current authenticated user profile',
      tags: ['Authentication', 'Profile'],
      security: [{ bearerAuth: [] }],
      body: { $ref: 'UpdateProfileSchema#' },
      response: {
        200: {
          description: 'User profile updated successfully',
          content: {
            'application/json': {
              schema: UserProfileSchema,
            },
          },
        },
        ...CommonAuthResponses,
      },
    },
    handler: authController.updateProfile,
  })

  /**
   * Change current user password
   */
  fastify.put('/password', {
    preHandler: [authenticateUser, requireActiveUser],
    schema: {
      description: 'Change current authenticated user password',
      tags: ['Authentication', 'Profile'],
      security: [{ bearerAuth: [] }],
      body: { $ref: 'ChangePasswordSchema#' },
      response: {
        200: {
          description: 'Password changed successfully',
          content: {
            'application/json': {
              schema: SuccessMessageSchema,
            },
          },
        },
        ...CommonAuthResponses,
      },
    },
    handler: authController.changePassword,
  })

  /**
   * Deactivate current user account
   */
  fastify.delete('/account', {
    preHandler: [authenticateUser, requireActiveUser],
    schema: {
      description: 'Deactivate current authenticated user account',
      tags: ['Authentication', 'Profile'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Account deactivated successfully',
          content: {
            'application/json': {
              schema: SuccessMessageSchema,
            },
          },
        },
        ...CommonAuthResponses,
      },
    },
    handler: authController.deactivateAccount,
  })
}
