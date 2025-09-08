import type { FastifyReply, FastifyRequest } from 'fastify'

import { perkService } from '../perks.service'

import type {
    CreatePerkRequest,
    PerkListQuery,
    PerkParams,
    UpdatePerk,
} from '@/features/perks/v1/perks.http.schema'
import { HTTP_STATUS } from '@/shared/constants'
import { paginated, success } from '@/shared/utils'

export const perkController = {
    async getPerkById(request: FastifyRequest<{ Params: PerkParams }>, reply: FastifyReply) {
        const perk = await perkService.getById(request.params.id, request.user)
        return reply.code(HTTP_STATUS.OK).send(success(perk, request.id))
    },

    async getPerkStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await perkService.getStats(request.user)
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },

    async listPerks(request: FastifyRequest<{ Querystring: PerkListQuery }>, reply: FastifyReply) {
        const { perks, pagination } = await perkService.list(request.query, request.user)
        return reply.code(HTTP_STATUS.OK).send(paginated(perks, pagination, request.id))
    },

    async createPerk(request: FastifyRequest<{ Body: CreatePerkRequest }>, reply: FastifyReply) {
        const { user } = request
        if (!user) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }
        const perk = await perkService.create(request.body, user)
        return reply.code(HTTP_STATUS.CREATED).send(success(perk, request.id))
    },

    async updatePerk(
        request: FastifyRequest<{ Params: PerkParams; Body: UpdatePerk }>,
        reply: FastifyReply
    ) {
        const { user } = request
        if (!user) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }
        const perk = await perkService.update(request.params.id, request.body, user)
        return reply.code(HTTP_STATUS.OK).send(success(perk, request.id))
    },

    async deletePerk(request: FastifyRequest<{ Params: PerkParams }>, reply: FastifyReply) {
        const { user } = request
        if (!user) {
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        }
        await perkService.delete(request.params.id, user)
        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },
} as const
