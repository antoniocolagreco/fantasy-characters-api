/**
 * User routes - endpoint definitions
 * Defines user management endpoints with OpenAPI documentation
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import {
  createUserHandler,
  getUserByIdHandler,
  getUsersListHandler,
  updateUserHandler,
  deleteUserHandler,
  getUserStatsHandler,
} from './user.controller'
import {
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UserResponseSchema,
  UserListQuerySchema,
  UserIdParamSchema,
  UserStatsResponseSchema,
} from './user.schema'
import { authenticateUser, requireRoles, requireSelfOrAdmin } from '../auth/auth.middleware'

export const userRoutes = async (
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> => {
  // Create new user
  fastify.post('/users', {
    schema: {
      description: 'Create a new user account',
      tags: ['Users'],
      summary: 'Create User',
      body: CreateUserRequestSchema,
      response: {
        201: {
          description: 'User created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: UserResponseSchema,
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          description: 'Validation error or bad request',
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
        409: {
          description: 'Email already exists',
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: createUserHandler,
  })

  // Get users list with pagination and filtering
  fastify.get('/users', {
    preHandler: [authenticateUser, requireRoles(['MODERATOR', 'ADMIN'])],
    schema: {
      description: 'Get a paginated list of users with optional filtering',
      tags: ['Users'],
      summary: 'List Users',
      querystring: UserListQuerySchema,
      response: {
        200: {
          description: 'Users retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'array',
              items: UserResponseSchema,
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', minimum: 1 },
                pageSize: { type: 'integer', minimum: 1 },
                total: { type: 'integer', minimum: 0 },
                totalPages: { type: 'integer', minimum: 0 },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: getUsersListHandler,
  })

  // Get user statistics (must be before /:id route to avoid conflicts)
  fastify.get('/users/stats', {
    preHandler: [authenticateUser, requireRoles(['ADMIN'])],
    schema: {
      description: 'Get user statistics and metrics',
      tags: ['Users'],
      summary: 'Get User Statistics',
      response: {
        200: {
          description: 'User statistics retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: UserStatsResponseSchema,
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: getUserStatsHandler,
  })

  // Get user by ID
  fastify.get('/users/:id', {
    preHandler: [authenticateUser, requireSelfOrAdmin('id')],
    schema: {
      description: 'Get a specific user by their ID',
      tags: ['Users'],
      summary: 'Get User by ID',
      params: UserIdParamSchema,
      response: {
        200: {
          description: 'User retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: UserResponseSchema,
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          description: 'Invalid user ID format',
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: getUserByIdHandler,
  })

  // Update user by ID
  fastify.put('/users/:id', {
    preHandler: [authenticateUser, requireSelfOrAdmin('id')],
    schema: {
      description: 'Update an existing user by their ID',
      tags: ['Users'],
      summary: 'Update User',
      params: UserIdParamSchema,
      body: UpdateUserRequestSchema,
      response: {
        200: {
          description: 'User updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: UserResponseSchema,
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          description: 'Validation error or invalid ID format',
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
        409: {
          description: 'Email already exists',
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: updateUserHandler,
  })

  // Delete user by ID
  fastify.delete('/users/:id', {
    preHandler: [authenticateUser, requireRoles(['ADMIN'])],
    schema: {
      description: 'Delete a user by their ID (CASCADE deletes related data)',
      tags: ['Users'],
      summary: 'Delete User',
      params: UserIdParamSchema,
      response: {
        204: {
          description: 'User deleted successfully',
          type: 'null',
        },
        400: {
          description: 'Invalid user ID format',
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: deleteUserHandler,
  })
}
