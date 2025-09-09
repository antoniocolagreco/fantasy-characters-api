import type { FastifyInstance } from 'fastify'

import { equipmentController } from './equipment.controller'
import {
    EquipmentParamsSchema,
    EquipmentUpdateSchema,
    GetEquipmentResponseSchema,
    GetEquipmentStatsResponseSchema,
} from './equipment.schema'

import { rbac, toFastifyPreHandler } from '@/features/auth/rbac.middleware'
import { ErrorResponseSchema } from '@/shared/schemas'

export async function equipmentRoutesV1(app: FastifyInstance) {
    app.get(
        '/characters/:id/equipment',
        {
            preHandler: [toFastifyPreHandler(rbac.read('characters'))],
            schema: {
                tags: ['Equipment'],
                summary: 'Get character equipment',
                params: EquipmentParamsSchema,
                response: { 200: GetEquipmentResponseSchema, 404: ErrorResponseSchema },
            },
        },
        equipmentController.getEquipment
    )

    app.put(
        '/characters/:id/equipment',
        {
            preHandler: [toFastifyPreHandler(rbac.update('characters'))],
            schema: {
                tags: ['Equipment'],
                summary: 'Update character equipment',
                params: EquipmentParamsSchema,
                body: EquipmentUpdateSchema,
                response: {
                    200: GetEquipmentResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                },
            },
        },
        equipmentController.updateEquipment
    )

    app.get(
        '/equipment/stats',
        {
            preHandler: [toFastifyPreHandler(rbac.read('equipment'))],
            schema: {
                tags: ['Equipment'],
                summary: 'Equipment statistics',
                response: { 200: GetEquipmentStatsResponseSchema, 403: ErrorResponseSchema },
            },
        },
        equipmentController.getStats
    )
}
