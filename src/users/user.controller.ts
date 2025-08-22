/**
 * User controller - HTTP request/response handling
 * Handles user-related endpoints following functional programming principles
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createUser,
  getUserById,
  getUsersList,
  updateUser,
  deleteUser,
  getUserStats,
} from './user.service'
import { createErrorResponse, isAppError } from '../shared/errors'
import { HTTP_STATUS, MESSAGES } from '../shared/constants'
import { toErrorWithStatusCode } from '../shared/type-guards'
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserListQuery,
  UserIdParam,
} from './user.schema'

/**
 * Create a new user
 * POST /api/users
 */
export const createUserHandler = async (
  request: FastifyRequest<{ Body: CreateUserRequest }>,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const userData = request.body
    const newUser = await createUser(userData)

    await reply.status(HTTP_STATUS.CREATED).send({
      success: true,
      data: newUser,
      message: MESSAGES.CREATED,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    request.log.error({ error, body: request.body }, 'Failed to create user')

    if (isAppError(error)) {
      const errorResponse = createErrorResponse(error, request.url)
      await reply.status(error.statusCode).send(errorResponse)
    } else {
      const internalError = toErrorWithStatusCode(error, 'Failed to create user')
      const errorResponse = createErrorResponse(internalError, request.url)
      await reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(errorResponse)
    }
  }
}

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserByIdHandler = async (
  request: FastifyRequest<{ Params: UserIdParam }>,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const { id } = request.params
    const user = await getUserById(id, request.authUser)

    await reply.status(HTTP_STATUS.OK).send({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    request.log.error({ error, params: request.params }, 'Failed to get user by ID')

    if (isAppError(error)) {
      const errorResponse = createErrorResponse(error, request.url)
      await reply.status(error.statusCode).send(errorResponse)
    } else {
      const internalError = toErrorWithStatusCode(error, 'Failed to retrieve user')
      const errorResponse = createErrorResponse(internalError, request.url)
      await reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(errorResponse)
    }
  }
}

/**
 * Get users list with pagination and filtering
 * GET /api/users
 */
export const getUsersListHandler = async (
  request: FastifyRequest<{ Querystring: UserListQuery }>,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const query = request.query
    const result = await getUsersList(query, request.authUser)

    await reply.status(HTTP_STATUS.OK).send({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    request.log.error({ error, query: request.query }, 'Failed to get users list')

    if (isAppError(error)) {
      const errorResponse = createErrorResponse(error, request.url)
      await reply.status(error.statusCode).send(errorResponse)
    } else {
      const internalError = toErrorWithStatusCode(error, 'Failed to retrieve users list')
      const errorResponse = createErrorResponse(internalError, request.url)
      await reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(errorResponse)
    }
  }
}

/**
 * Update user by ID
 * PUT /api/users/:id
 */
export const updateUserHandler = async (
  request: FastifyRequest<{ Params: UserIdParam; Body: UpdateUserRequest }>,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const { id } = request.params
    const updateData = request.body
    const updatedUser = await updateUser(id, updateData, request.authUser)

    await reply.status(HTTP_STATUS.OK).send({
      success: true,
      data: updatedUser,
      message: MESSAGES.UPDATED,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    request.log.error(
      { error, params: request.params, body: request.body },
      'Failed to update user',
    )

    if (isAppError(error)) {
      const errorResponse = createErrorResponse(error, request.url)
      await reply.status(error.statusCode).send(errorResponse)
    } else {
      const internalError = toErrorWithStatusCode(error, 'Failed to update user')
      const errorResponse = createErrorResponse(internalError, request.url)
      await reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(errorResponse)
    }
  }
}

/**
 * Delete user by ID
 * DELETE /api/users/:id
 */
export const deleteUserHandler = async (
  request: FastifyRequest<{ Params: UserIdParam }>,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const { id } = request.params
    await deleteUser(id, request.authUser)

    await reply.status(HTTP_STATUS.NO_CONTENT).send()
  } catch (error) {
    request.log.error({ error, params: request.params }, 'Failed to delete user')

    if (isAppError(error)) {
      const errorResponse = createErrorResponse(error, request.url)
      await reply.status(error.statusCode).send(errorResponse)
    } else {
      const internalError = toErrorWithStatusCode(error, 'Failed to delete user')
      const errorResponse = createErrorResponse(internalError, request.url)
      await reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(errorResponse)
    }
  }
}

/**
 * Get user statistics
 * GET /api/users/stats
 */
export const getUserStatsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const stats = await getUserStats(request.authUser)

    await reply.status(HTTP_STATUS.OK).send({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    request.log.error({ error }, 'Failed to get user statistics')

    if (isAppError(error)) {
      const errorResponse = createErrorResponse(error, request.url)
      await reply.status(error.statusCode).send(errorResponse)
    } else {
      const internalError = toErrorWithStatusCode(error, 'Failed to retrieve user statistics')
      const errorResponse = createErrorResponse(internalError, request.url)
      await reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(errorResponse)
    }
  }
}
