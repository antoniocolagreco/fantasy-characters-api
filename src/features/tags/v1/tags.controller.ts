import type { FastifyReply, FastifyRequest } from 'fastify'

import { tagService } from '../tags.service'

import type {
    CreateTagRequest,
    TagListQuery,
    TagParams,
    UpdateTag,
} from '@/features/tags/tags.type'
import { HTTP_STATUS } from '@/shared/constants'
import { paginated, success } from '@/shared/utils'

export const tagController = {
    async getTagById(request: FastifyRequest<{ Params: TagParams }>, reply: FastifyReply) {
        const tag = await tagService.getById(request.params.id, request.user)
        return reply.code(HTTP_STATUS.OK).send(success(tag, request.id))
    },

    async listTags(request: FastifyRequest<{ Querystring: TagListQuery }>, reply: FastifyReply) {
        const { tags, pagination } = await tagService.list(request.query, request.user)
        return reply.code(HTTP_STATUS.OK).send(paginated(tags, pagination, request.id))
    },

    async getTagStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await tagService.getStats(request.user)
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },

    async createTag(request: FastifyRequest<{ Body: CreateTagRequest }>, reply: FastifyReply) {
        const { user } = request
        if (!user) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }

        const tag = await tagService.create(request.body, user)
        return reply.code(HTTP_STATUS.CREATED).send(success(tag, request.id))
    },

    async updateTag(
        request: FastifyRequest<{ Params: TagParams; Body: UpdateTag }>,
        reply: FastifyReply
    ) {
        const { user } = request
        if (!user) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }

        const tag = await tagService.update(request.params.id, request.body, user)
        return reply.code(HTTP_STATUS.OK).send(success(tag, request.id))
    },

    async deleteTag(request: FastifyRequest<{ Params: TagParams }>, reply: FastifyReply) {
        const { user } = request
        if (!user) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }

        await tagService.delete(request.params.id, user)
        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },
} as const
