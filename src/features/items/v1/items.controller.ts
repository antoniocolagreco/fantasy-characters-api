// Stub controller (implementation in later tasks)
import type { FastifyReply, FastifyRequest } from 'fastify'

import { itemService } from '../items.service'

import type { CreateItem, ItemListQuery, ItemParams, UpdateItem } from './items.http.schema'

import { HTTP_STATUS } from '@/shared/constants'
import {
    paginated,
    success,
    buildCacheKey,
    getCache,
    setCache,
    invalidateByPrefix,
    setNoStore,
    setPublicListCache,
    setPublicResourceCache,
} from '@/shared/utils'

export const itemController = {
    async listItems(request: FastifyRequest<{ Querystring: ItemListQuery }>, reply: FastifyReply) {
        const isAnonymous = !request.user
        const cachePrefix = 'items:list'
        if (isAnonymous) {
            const key = buildCacheKey(cachePrefix, request.query)
            type ItemListResult = Awaited<ReturnType<typeof itemService.list>>
            const hit = getCache<ItemListResult>(key)
            if (hit) {
                setPublicListCache(reply)
                return reply
                    .code(HTTP_STATUS.OK)
                    .send(paginated(hit.items, hit.pagination, request.id))
            }
            const result = await itemService.list(request.query, request.user)
            setCache(key, result, 30_000)
            setPublicListCache(reply)
            return reply
                .code(HTTP_STATUS.OK)
                .send(paginated(result.items, result.pagination, request.id))
        }
        const { items, pagination } = await itemService.list(request.query, request.user)
        setPublicListCache(reply)
        return reply.code(HTTP_STATUS.OK).send(paginated(items, pagination, request.id))
    },
    async getItemById(request: FastifyRequest<{ Params: ItemParams }>, reply: FastifyReply) {
        const item = await itemService.getById(request.params.id, request.user)
        setPublicResourceCache(reply)
        return reply.code(HTTP_STATUS.OK).send(success(item, request.id))
    },
    async getItemStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await itemService.getStats(request.user)
        setPublicListCache(reply)
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },
    async createItem(request: FastifyRequest<{ Body: CreateItem }>, reply: FastifyReply) {
        const { user } = request
        if (!user)
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        const item = await itemService.create(request.body, user)
        invalidateByPrefix('items:list')
        setNoStore(reply)
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
        invalidateByPrefix('items:list')
        setNoStore(reply)
        return reply.code(HTTP_STATUS.OK).send(success(item, request.id))
    },
    async deleteItem(request: FastifyRequest<{ Params: ItemParams }>, reply: FastifyReply) {
        const { user } = request
        if (!user)
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        await itemService.delete(request.params.id, user)
        invalidateByPrefix('items:list')
        setNoStore(reply)
        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },
} as const
