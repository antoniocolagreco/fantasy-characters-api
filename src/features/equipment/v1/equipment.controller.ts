import type { FastifyReply, FastifyRequest } from 'fastify'

import { equipmentService } from '../equipment.service'

import type { EquipmentParams, EquipmentUpdateInput } from './equipment.schema'

import { HTTP_STATUS } from '@/shared/constants/http-status'
import { success } from '@/shared/utils/response.helper'

export const equipmentController = {
    async getEquipment(request: FastifyRequest<{ Params: EquipmentParams }>, reply: FastifyReply) {
        const data = await equipmentService.getEquipment(request.params, request.user)
        return reply.code(HTTP_STATUS.OK).send(success(data, request.id))
    },
    async updateEquipment(
        request: FastifyRequest<{ Params: EquipmentParams; Body: EquipmentUpdateInput }>,
        reply: FastifyReply
    ) {
        const updated = await equipmentService.updateEquipment(
            request.params,
            request.body,
            request.user
        )
        return reply.code(HTTP_STATUS.OK).send(success(updated, request.id))
    },
    async getStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await equipmentService.getStats(request.user)
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },
}
