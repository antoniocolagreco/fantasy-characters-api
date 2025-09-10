import type { FastifyReply, FastifyRequest } from 'fastify'

import { archetypeService } from '../archetypes.service'

import type {
    ArchetypeListQuery,
    ArchetypeParams,
    CreateArchetype,
    UpdateArchetype,
} from './archetypes.http.schema'

import { HTTP_STATUS } from '@/shared/constants'
import {
    paginated,
    success,
    setNoStore,
    setPublicListCache,
    setPublicResourceCache,
} from '@/shared/utils'

export const archetypeController = {
    async listArchetypes(
        request: FastifyRequest<{ Querystring: ArchetypeListQuery }>,
        reply: FastifyReply
    ) {
        const { archetypes, pagination } = await archetypeService.list(request.query, request.user)
        setPublicListCache(reply)
        return reply.code(HTTP_STATUS.OK).send(paginated(archetypes, pagination, request.id))
    },
    async getArchetypeById(
        request: FastifyRequest<{ Params: ArchetypeParams }>,
        reply: FastifyReply
    ) {
        const archetype = await archetypeService.getById(request.params.id, request.user)
        setPublicResourceCache(reply)
        return reply.code(HTTP_STATUS.OK).send(success(archetype, request.id))
    },
    async getArchetypeStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await archetypeService.getStats(request.user)
        setPublicListCache(reply)
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },
    async createArchetype(request: FastifyRequest<{ Body: CreateArchetype }>, reply: FastifyReply) {
        const { user } = request
        if (!user)
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        const archetype = await archetypeService.create(request.body, user)
        setNoStore(reply)
        return reply.code(HTTP_STATUS.CREATED).send(success(archetype, request.id))
    },
    async updateArchetype(
        request: FastifyRequest<{ Params: ArchetypeParams; Body: UpdateArchetype }>,
        reply: FastifyReply
    ) {
        const { user } = request
        if (!user)
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        const archetype = await archetypeService.update(request.params.id, request.body, user)
        setNoStore(reply)
        return reply.code(HTTP_STATUS.OK).send(success(archetype, request.id))
    },
    async deleteArchetype(
        request: FastifyRequest<{ Params: ArchetypeParams }>,
        reply: FastifyReply
    ) {
        const { user } = request
        if (!user)
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        await archetypeService.delete(request.params.id, user)
        setNoStore(reply)
        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },
} as const
