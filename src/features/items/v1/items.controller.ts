// Stub controller (implementation in later tasks)
import type { FastifyReply, FastifyRequest } from 'fastify'

import { itemService } from '../items.service'

import type { CreateItem, ItemListQuery, ItemParams, UpdateItem } from './items.http.schema'

import { HTTP_STATUS } from '@/shared/constants'
import { paginated, success } from '@/shared/utils'

export const itemController = {
    async listItems(request: FastifyRequest<{ Querystring: ItemListQuery }>, reply: FastifyReply) {
        const { items, pagination } = await itemService.list(request.query, request.user)
        return reply.code(HTTP_STATUS.OK).send(paginated(items, pagination, request.id))
    },
    async getItemById(request: FastifyRequest<{ Params: ItemParams }>, reply: FastifyReply) {
        const item = await itemService.getById(request.params.id, request.user)
        return reply.code(HTTP_STATUS.OK).send(success(item, request.id))
    },
    async getItemStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await itemService.getStats(request.user)
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },
    async createItem(request: FastifyRequest<{ Body: CreateItem }>, reply: FastifyReply) {
        const { user } = request
        if (!user)
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        const item = await itemService.create(request.body, user)
        return reply.code(HTTP_STATUS.CREATED).send(success(item, request.id))
    },
    async updateItem(
        request: FastifyRequest<{ Params: ItemParams; Body: UpdateItem }>,
        reply: FastifyReply
    ) {
        const { user } = request
        if (!user)
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        const item = await itemService.update(request.params.id, request.body, user)
        return reply.code(HTTP_STATUS.OK).send(success(item, request.id))
    },
    async deleteItem(request: FastifyRequest<{ Params: ItemParams }>, reply: FastifyReply) {
        const { user } = request
        if (!user)
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        await itemService.delete(request.params.id, user)
        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },
} as const
