import type { FastifyReply, FastifyRequest } from 'fastify'

import { publicUserService, userService } from '..'

import type {
    BanUser,
    CreateUserInput,
    UpdateUser,
    User,
    UserListQuery,
    UserParams,
} from '@/features/users/users.type'
import { HTTP_STATUS } from '@/shared/constants'
import { paginated, success } from '@/shared/utils'

export const userController = {
    async getUserById(request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) {
        const user = await publicUserService.getById(request.params.id)
        return reply.code(HTTP_STATUS.OK).send(success(user, request.id))
    },

    async listUsers(request: FastifyRequest<{ Querystring: UserListQuery }>, reply: FastifyReply) {
        const { users, pagination } = await publicUserService.list(request.query)
        return reply.code(HTTP_STATUS.OK).send(paginated(users, pagination, request.id))
    },

    async getUserStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await userService.getStats()
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },

    async createUser(request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) {
        const user = await userService.create(request.body)
        return reply.code(HTTP_STATUS.CREATED).send(success(user, request.id))
    },

    async updateUser(
        request: FastifyRequest<{ Params: UserParams; Body: UpdateUser }>,
        reply: FastifyReply
    ) {
        const user = await userService.update(request.params.id, request.body)
        return reply.code(HTTP_STATUS.OK).send(success(user, request.id))
    },

    async deleteUser(request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) {
        await userService.delete(request.params.id)
        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },

    async banUser(
        request: FastifyRequest<{ Params: UserParams; Body: BanUser }>,
        reply: FastifyReply
    ) {
        // Get bannedById from authenticated user
        const bannedById = request.user?.id
        if (!bannedById) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }

        // If banReason is not provided or empty, treat as unban
        const isUnban = !request.body.banReason && !request.body.bannedUntil

        let user: User
        if (isUnban) {
            user = await userService.unban(request.params.id)
        } else {
            user = await userService.ban(request.params.id, request.body, bannedById)
        }

        return reply.code(HTTP_STATUS.OK).send(success(user, request.id))
    },
} as const
