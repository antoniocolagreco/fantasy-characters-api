import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'

import { userController } from './users.controller'
import {
    UserListQuerySchema,
    UserParamsSchema,
    UserResponseSchema,
    UserListResponseSchema,
    UserStatsResponseSchema,
    CreateUserRequestSchema,
    UpdateUserSchema,
    BanUserSchema,
} from './users.http.schema'

import { rbac, toFastifyPreHandler } from '@/features/auth/rbac.middleware'
import { ErrorResponseSchema } from '@/shared/schemas'

export const usersRoutesV1: FastifyPluginAsync = async app => {
    app.withTypeProvider<TypeBoxTypeProvider>()

    // GET /api/v1/users/:id
    app.get(
        '/users/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.read('users'))],
            schema: {
                tags: ['Users'],
                summary: 'Get user by ID',
                params: UserParamsSchema,
                response: {
                    200: UserResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        userController.getUserById
    )

    // GET /api/v1/users
    app.get(
        '/users',
        {
            preHandler: [toFastifyPreHandler(rbac.read('users'))],
            schema: {
                tags: ['Users'],
                summary: 'List users',
                querystring: UserListQuerySchema,
                response: {
                    200: UserListResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        userController.listUsers
    )

    // GET /api/v1/users/stats
    app.get(
        '/users/stats',
        {
            preHandler: [toFastifyPreHandler(rbac.read('users'))],
            schema: {
                tags: ['Users'],
                summary: 'User statistics',
                response: {
                    200: UserStatsResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        userController.getUserStats
    )

    // POST /api/v1/users
    app.post(
        '/users',
        {
            preHandler: [toFastifyPreHandler(rbac.create('users'))],
            schema: {
                tags: ['Users'],
                summary: 'Create user',
                body: CreateUserRequestSchema,
                response: {
                    201: UserResponseSchema,
                    400: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        userController.createUser
    )

    // PUT /api/v1/users/:id
    app.put(
        '/users/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.update('users'))],
            schema: {
                tags: ['Users'],
                summary: 'Update user',
                params: UserParamsSchema,
                body: UpdateUserSchema,
                response: {
                    200: UserResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        userController.updateUser
    )

    // DELETE /api/v1/users/:id
    app.delete(
        '/users/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.delete('users'))],
            schema: {
                tags: ['Users'],
                summary: 'Delete user',
                params: UserParamsSchema,
                response: {
                    204: { type: 'null' },
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        userController.deleteUser
    )

    // POST /api/v1/users/:id/ban
    app.post(
        '/users/:id/ban',
        {
            preHandler: [toFastifyPreHandler(rbac.manage('users'))],
            schema: {
                tags: ['Users'],
                summary: 'Ban/unban user',
                params: UserParamsSchema,
                body: BanUserSchema,
                response: {
                    200: UserResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        userController.banUser
    )
}
