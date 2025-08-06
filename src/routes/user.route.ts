/**
 * User Routes
 *
 * This module defines the HTTP routes for user-related operations.
 * It follows the established patterns from Chapter 3 infrastructure.
 */

import { FastifyInstance } from 'fastify'
import { Type } from '@sinclair/typebox'
import { UserController } from '../controllers/user.controller.js'
import {
    UserCreateSchema,
    UserUpdateSchema,
    UserResponseSchema,
    UserWithStatsSchema,
    UserListQuerySchema
} from '../schemas/user.js'
import { IdParamSchema } from '../utils/validation.js'
import { SuccessResponseSchema } from '../schemas/api.js'

/**
 * User routes configuration
 */
export async function userRoutes(fastify: FastifyInstance): Promise<void> {
    const userController = new UserController()
    // Create user
    fastify.post(
        '/users',
        {
            schema: {
                description: 'Create a new user',
                tags: ['Users'],
                body: UserCreateSchema,
                response: {
                    201: SuccessResponseSchema(UserResponseSchema)
                }
            }
        },
        userController.create.bind(userController)
    )

    // Get user by ID
    fastify.get(
        '/users/:id',
        {
            schema: {
                description: 'Get user by ID',
                tags: ['Users'],
                params: IdParamSchema,
                response: {
                    200: SuccessResponseSchema(UserResponseSchema)
                }
            }
        },
        userController.getById.bind(userController)
    )

    // List users
    fastify.get(
        '/users',
        {
            schema: {
                description: 'List users with pagination and filtering',
                tags: ['Users'],
                querystring: UserListQuerySchema,
                response: {
                    200: SuccessResponseSchema(Type.Array(UserResponseSchema))
                }
            }
        },
        userController.list.bind(userController)
    )

    // Update user
    fastify.put(
        '/users/:id',
        {
            schema: {
                description: 'Update user',
                tags: ['Users'],
                params: IdParamSchema,
                body: UserUpdateSchema,
                response: {
                    200: SuccessResponseSchema(UserResponseSchema)
                }
            }
        },
        userController.update.bind(userController)
    )

    // Delete user
    fastify.delete(
        '/users/:id',
        {
            schema: {
                description: 'Delete user',
                tags: ['Users'],
                params: IdParamSchema,
                response: {
                    204: {
                        type: 'null',
                        description: 'User deleted successfully'
                    }
                }
            }
        },
        userController.delete.bind(userController)
    )

    // Get user statistics
    fastify.get(
        '/users/:id/stats',
        {
            schema: {
                description: 'Get user statistics',
                tags: ['Users'],
                params: IdParamSchema,
                response: {
                    200: SuccessResponseSchema(UserWithStatsSchema)
                }
            }
        },
        userController.getStats.bind(userController)
    )
}
