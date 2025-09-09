import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'

import { perkController } from './perks.controller'
import {
    CreatePerkRequestSchema,
    PerkListQuerySchema,
    PerkListResponseSchema,
    PerkParamsSchema,
    PerkResponseSchema,
    PerkStatsResponseSchema,
    UpdatePerkSchema,
} from './perks.http.schema'

import { rbac, toFastifyPreHandler } from '@/features/auth/rbac.middleware'
import { ErrorResponseSchema } from '@/shared/schemas'

export const perksRoutesV1: FastifyPluginAsync = async app => {
    app.withTypeProvider<TypeBoxTypeProvider>()

    // GET /api/v1/perks/:id
    app.get(
        '/perks/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.read('perks'))],
            schema: {
                tags: ['Perks'],
                summary: 'Get perk by ID',
                params: PerkParamsSchema,
                response: {
                    200: PerkResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        perkController.getPerkById
    )

    // GET /api/v1/perks/stats
    app.get(
        '/perks/stats',
        {
            preHandler: [toFastifyPreHandler(rbac.read('perks'))],
            schema: {
                tags: ['Perks'],
                summary: 'Perk statistics',
                response: {
                    200: PerkStatsResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        perkController.getPerkStats
    )

    // GET /api/v1/perks
    app.get(
        '/perks',
        {
            preHandler: [toFastifyPreHandler(rbac.read('perks'))],
            schema: {
                tags: ['Perks'],
                summary: 'List perks',
                querystring: PerkListQuerySchema,
                response: {
                    200: PerkListResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        perkController.listPerks
    )

    // POST /api/v1/perks
    app.post(
        '/perks',
        {
            preHandler: [toFastifyPreHandler(rbac.create('perks'))],
            schema: {
                tags: ['Perks'],
                summary: 'Create perk',
                body: CreatePerkRequestSchema,
                response: {
                    201: PerkResponseSchema,
                    400: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        perkController.createPerk
    )

    // PUT /api/v1/perks/:id
    app.put(
        '/perks/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.update('perks'))],
            schema: {
                tags: ['Perks'],
                summary: 'Update perk',
                params: PerkParamsSchema,
                body: UpdatePerkSchema,
                response: {
                    200: PerkResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        perkController.updatePerk
    )

    // DELETE /api/v1/perks/:id
    app.delete(
        '/perks/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.delete('perks'))],
            schema: {
                tags: ['Perks'],
                summary: 'Delete perk',
                params: PerkParamsSchema,
                response: {
                    204: { type: 'null' },
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        perkController.deletePerk
    )
}
