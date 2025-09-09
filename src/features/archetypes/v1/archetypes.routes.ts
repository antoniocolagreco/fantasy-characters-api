import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'

import { archetypeController } from './archetypes.controller'
import {
    ArchetypeListQuerySchema,
    ArchetypeListResponseSchema,
    ArchetypeParamsSchema,
    ArchetypeResponseSchema,
    ArchetypeStatsResponseSchema,
    CreateArchetypeSchema,
    UpdateArchetypeSchema,
} from './archetypes.http.schema'

import { rbac, toFastifyPreHandler } from '@/features/auth/rbac.middleware'
import { ErrorResponseSchema } from '@/shared/schemas'

export const archetypesRoutesV1: FastifyPluginAsync = async app => {
    app.withTypeProvider<TypeBoxTypeProvider>()

    app.get(
        '/archetypes',
        {
            preHandler: [toFastifyPreHandler(rbac.read('archetypes'))],
            schema: {
                tags: ['Archetypes'],
                summary: 'List archetypes',
                querystring: ArchetypeListQuerySchema,
                response: {
                    200: ArchetypeListResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        archetypeController.listArchetypes
    )

    app.get(
        '/archetypes/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.read('archetypes'))],
            schema: {
                tags: ['Archetypes'],
                summary: 'Get archetype by ID',
                params: ArchetypeParamsSchema,
                response: {
                    200: ArchetypeResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        archetypeController.getArchetypeById
    )

    app.get(
        '/archetypes/stats',
        {
            preHandler: [toFastifyPreHandler(rbac.read('archetypes'))],
            schema: {
                tags: ['Archetypes'],
                summary: 'Archetype statistics',
                response: {
                    200: ArchetypeStatsResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        archetypeController.getArchetypeStats
    )

    app.post(
        '/archetypes',
        {
            preHandler: [toFastifyPreHandler(rbac.create('archetypes'))],
            schema: {
                tags: ['Archetypes'],
                summary: 'Create archetype',
                body: CreateArchetypeSchema,
                response: {
                    201: ArchetypeResponseSchema,
                    400: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        archetypeController.createArchetype
    )

    app.put(
        '/archetypes/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.update('archetypes'))],
            schema: {
                tags: ['Archetypes'],
                summary: 'Update archetype',
                params: ArchetypeParamsSchema,
                body: UpdateArchetypeSchema,
                response: {
                    200: ArchetypeResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        archetypeController.updateArchetype
    )

    app.delete(
        '/archetypes/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.delete('archetypes'))],
            schema: {
                tags: ['Archetypes'],
                summary: 'Delete archetype',
                params: ArchetypeParamsSchema,
                response: {
                    204: { type: 'null' },
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        archetypeController.deleteArchetype
    )
}
