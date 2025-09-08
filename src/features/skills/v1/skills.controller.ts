import type { FastifyReply, FastifyRequest } from 'fastify'

import { skillService } from '../skills.service'

import type {
    CreateSkillRequest,
    SkillListQuery,
    SkillParams,
    UpdateSkill,
} from '@/features/skills/v1/skills.http.schema'
import { HTTP_STATUS } from '@/shared/constants'
import { paginated, success } from '@/shared/utils'

export const skillController = {
    async getSkillById(request: FastifyRequest<{ Params: SkillParams }>, reply: FastifyReply) {
        const skill = await skillService.getById(request.params.id, request.user)
        return reply.code(HTTP_STATUS.OK).send(success(skill, request.id))
    },

    async getSkillStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await skillService.getStats(request.user)
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },

    async listSkills(
        request: FastifyRequest<{ Querystring: SkillListQuery }>,
        reply: FastifyReply
    ) {
        const { skills, pagination } = await skillService.list(request.query, request.user)
        return reply.code(HTTP_STATUS.OK).send(paginated(skills, pagination, request.id))
    },

    async createSkill(request: FastifyRequest<{ Body: CreateSkillRequest }>, reply: FastifyReply) {
        const { user } = request
        if (!user) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }
        const skill = await skillService.create(request.body, user)
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
        return reply.code(HTTP_STATUS.OK).send(success(skill, request.id))
    },

    async deleteSkill(request: FastifyRequest<{ Params: SkillParams }>, reply: FastifyReply) {
        const { user } = request
        if (!user) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }
        await skillService.delete(request.params.id, user)
        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },
} as const
