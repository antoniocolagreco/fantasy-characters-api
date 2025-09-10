import type { FastifyReply, FastifyRequest } from 'fastify'

import { skillService } from '../skills.service'

import type {
    CreateSkillRequest,
    SkillListQuery,
    SkillParams,
    UpdateSkill,
} from '@/features/skills/v1/skills.http.schema'
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

export const skillController = {
    async getSkillById(request: FastifyRequest<{ Params: SkillParams }>, reply: FastifyReply) {
        const skill = await skillService.getById(request.params.id, request.user)
        setPublicResourceCache(reply)
        return reply.code(HTTP_STATUS.OK).send(success(skill, request.id))
    },

    async getSkillStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await skillService.getStats(request.user)
        setPublicListCache(reply)
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },

    async listSkills(
        request: FastifyRequest<{ Querystring: SkillListQuery }>,
        reply: FastifyReply
    ) {
        const isAnonymous = !request.user
        const cachePrefix = 'skills:list'
        if (isAnonymous) {
            const key = buildCacheKey(cachePrefix, request.query)
            type SkillListResult = Awaited<ReturnType<typeof skillService.list>>
            const hit = getCache<SkillListResult>(key)
            if (hit) {
                setPublicListCache(reply)
                return reply
                    .code(HTTP_STATUS.OK)
                    .send(paginated(hit.skills, hit.pagination, request.id))
            }
            const result = await skillService.list(request.query, request.user)
            setCache(key, result, 30_000)
            setPublicListCache(reply)
            return reply
                .code(HTTP_STATUS.OK)
                .send(paginated(result.skills, result.pagination, request.id))
        }
        const { skills, pagination } = await skillService.list(request.query, request.user)
        setPublicListCache(reply)
        return reply.code(HTTP_STATUS.OK).send(paginated(skills, pagination, request.id))
    },

    async createSkill(request: FastifyRequest<{ Body: CreateSkillRequest }>, reply: FastifyReply) {
        const { user } = request
        if (!user) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }
        const skill = await skillService.create(request.body, user)
        invalidateByPrefix('skills:list')
        setNoStore(reply)
        return reply.code(HTTP_STATUS.CREATED).send(success(skill, request.id))
    },

    async updateSkill(
        request: FastifyRequest<{ Params: SkillParams; Body: UpdateSkill }>,
        reply: FastifyReply
    ) {
        const { user } = request
        if (!user) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }
        const skill = await skillService.update(request.params.id, request.body, user)
        invalidateByPrefix('skills:list')
        setNoStore(reply)
        return reply.code(HTTP_STATUS.OK).send(success(skill, request.id))
    },

    async deleteSkill(request: FastifyRequest<{ Params: SkillParams }>, reply: FastifyReply) {
        const { user } = request
        if (!user) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }
        await skillService.delete(request.params.id, user)
        invalidateByPrefix('skills:list')
        setNoStore(reply)
        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },
} as const
