/**
 * User Controller
 *
 * This controller handles HTTP requests for user-related operations.
 * It follows the established patterns from Chapter 3 infrastructure.
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../services/user.service.js'
import { getDatabase } from '../services/database.service.js'
import { createSuccessResponse } from '../utils/response.js'
import type { UserCreateRequest, UserUpdateRequest, UserListQuery } from '../schemas/user.js'

export class UserController {
    private readonly userService: UserService

    constructor() {
        this.userService = new UserService(getDatabase())
    }

    /**
     * Create a new user
     * POST /api/users
     */
    async create(request: FastifyRequest<{ Body: UserCreateRequest }>, reply: FastifyReply): Promise<void> {
        const user = await this.userService.create(request.body)
        reply.status(201).send(createSuccessResponse(user))
    }

    /**
     * Get user by ID
     * GET /api/users/:id
     */
    async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        const user = await this.userService.findByIdOrThrow(request.params.id)
        reply.send(createSuccessResponse(user))
    }

    /**
     * List users with pagination and filtering
     * GET /api/users
     */
    async list(request: FastifyRequest<{ Querystring: UserListQuery }>, reply: FastifyReply): Promise<void> {
        const result = await this.userService.findMany(request.query)

        reply.send(
            createSuccessResponse(result.data, {
                pagination: result.pagination
            })
        )
    }

    /**
     * Update user
     * PUT /api/users/:id
     */
    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UserUpdateRequest }>,
        reply: FastifyReply
    ): Promise<void> {
        const user = await this.userService.update(request.params.id, request.body)
        reply.send(createSuccessResponse(user))
    }

    /**
     * Delete user
     * DELETE /api/users/:id
     */
    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        await this.userService.delete(request.params.id)
        reply.status(204).send()
    }

    /**
     * Get user with statistics
     * GET /api/users/:id/stats
     */
    async getStats(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        const userStats = await this.userService.getUserWithStats(request.params.id)
        reply.send(createSuccessResponse(userStats))
    }
}
