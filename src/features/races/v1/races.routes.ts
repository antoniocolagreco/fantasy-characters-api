import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'

import { raceController } from './races.controller'
import {
    CreateRaceSchema,
    RaceListQuerySchema,
    RaceListResponseSchema,
    RaceParamsSchema,
    RaceResponseSchema,
    RaceStatsResponseSchema,
    UpdateRaceSchema,
} from './races.http.schema'

import { rbac, toFastifyPreHandler } from '@/features/auth/rbac.middleware'
import { ErrorResponseSchema } from '@/shared/schemas'

export const racesRoutesV1: FastifyPluginAsync = async app => {
    app.withTypeProvider<TypeBoxTypeProvider>()

    app.get(
        '/races/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.read('races'))],
            schema: {
                tags: ['Races'],
                summary: 'Get race by ID',
                params: RaceParamsSchema,
                response: {
                    200: RaceResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        raceController.getRaceById
    )

    app.get(
        '/races/stats',
        {
            preHandler: [toFastifyPreHandler(rbac.read('races'))],
            schema: {
                tags: ['Races'],
                summary: 'Race statistics',
                response: {
                    200: RaceStatsResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        raceController.getRaceStats
    )

    app.get(
        '/races',
        {
            preHandler: [toFastifyPreHandler(rbac.read('races'))],
            schema: {
                tags: ['Races'],
                summary: 'List races',
                querystring: RaceListQuerySchema,
                response: {
                    200: RaceListResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        raceController.listRaces
    )

    app.post(
        '/races',
        {
            preHandler: [toFastifyPreHandler(rbac.create('races'))],
            schema: {
                tags: ['Races'],
                summary: 'Create race',
                body: CreateRaceSchema,
                response: {
                    201: RaceResponseSchema,
                    400: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        raceController.createRace
    )

    app.put(
        '/races/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.update('races'))],
            schema: {
                tags: ['Races'],
                summary: 'Update race',
                params: RaceParamsSchema,
                body: UpdateRaceSchema,
                response: {
                    200: RaceResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        raceController.updateRace
    )

    app.delete(
        '/races/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.delete('races'))],
            schema: {
                tags: ['Races'],
                summary: 'Delete race',
                params: RaceParamsSchema,
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
        raceController.deleteRace
    )
}
