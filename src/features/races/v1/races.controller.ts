import type { FastifyReply, FastifyRequest } from 'fastify'

import { raceService } from '../races.service'

import type {
    CreateRace,
    RaceListQuery,
    RaceParams,
    UpdateRace,
} from '@/features/races/v1/races.http.schema'
import { HTTP_STATUS } from '@/shared/constants'
import { paginated, success } from '@/shared/utils'

export const raceController = {
    async getRaceById(request: FastifyRequest<{ Params: RaceParams }>, reply: FastifyReply) {
        const race = await raceService.getById(request.params.id, request.user)
        return reply.code(HTTP_STATUS.OK).send(success(race, request.id))
    },
    async getRaceStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await raceService.getStats(request.user)
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },
    async listRaces(request: FastifyRequest<{ Querystring: RaceListQuery }>, reply: FastifyReply) {
        const { races, pagination } = await raceService.list(request.query, request.user)
        return reply.code(HTTP_STATUS.OK).send(paginated(races, pagination, request.id))
    },
    async createRace(request: FastifyRequest<{ Body: CreateRace }>, reply: FastifyReply) {
        const { user } = request
        if (!user)
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        const race = await raceService.create(request.body, user)
        return reply.code(HTTP_STATUS.CREATED).send(success(race, request.id))
    },
    async updateRace(
        request: FastifyRequest<{ Params: RaceParams; Body: UpdateRace }>,
        reply: FastifyReply
    ) {
        const { user } = request
        if (!user)
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        const race = await raceService.update(request.params.id, request.body, user)
        return reply.code(HTTP_STATUS.OK).send(success(race, request.id))
    },
    async deleteRace(request: FastifyRequest<{ Params: RaceParams }>, reply: FastifyReply) {
        const { user } = request
        if (!user)
            return reply.code(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Authentication required' })
        await raceService.delete(request.params.id, user)
        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },
} as const
