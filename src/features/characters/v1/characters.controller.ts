import type { FastifyReply, FastifyRequest } from 'fastify'

import { characterService } from '../characters.service'

import type {
    CharacterListQuery,
    CharacterParams,
    CreateCharacter,
    UpdateCharacter,
} from './characters.http.schema'

import { HTTP_STATUS } from '@/shared/constants'
import { err } from '@/shared/errors'
import { paginated, success } from '@/shared/utils'

export const characterController = {
    async listCharacters(
        request: FastifyRequest<{ Querystring: CharacterListQuery }>,
        reply: FastifyReply
    ) {
        const { characters, pagination } = await characterService.list(request.query, request.user)
        return reply.code(HTTP_STATUS.OK).send(paginated(characters, pagination, request.id))
    },
    async getCharacterById(
        request: FastifyRequest<{ Params: CharacterParams; Querystring: { expanded?: boolean } }>,
        reply: FastifyReply
    ) {
        const character = await characterService.getById(
            request.params.id,
            request.user,
            request.query.expanded === true
        )
        return reply.code(HTTP_STATUS.OK).send(success(character, request.id))
    },
    async getCharacterStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await characterService.getStats(request.user)
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },
    async createCharacter(request: FastifyRequest<{ Body: CreateCharacter }>, reply: FastifyReply) {
        if (!request.user) throw err('UNAUTHORIZED', 'Login required')
        const character = await characterService.create(request.body, request.user)
        return reply.code(HTTP_STATUS.CREATED).send(success(character, request.id))
    },
    async updateCharacter(
        request: FastifyRequest<{ Params: CharacterParams; Body: UpdateCharacter }>,
        reply: FastifyReply
    ) {
        if (!request.user) throw err('UNAUTHORIZED', 'Login required')
        const character = await characterService.update(
            request.params.id,
            request.body,
            request.user
        )
        return reply.code(HTTP_STATUS.OK).send(success(character, request.id))
    },
    async deleteCharacter(
        request: FastifyRequest<{ Params: CharacterParams }>,
        reply: FastifyReply
    ) {
        if (!request.user) throw err('UNAUTHORIZED', 'Login required')
        await characterService.delete(request.params.id, request.user)
        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },
} as const
