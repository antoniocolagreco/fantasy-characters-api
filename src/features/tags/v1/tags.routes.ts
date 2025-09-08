import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'

import { tagController } from './tags.controller'
import {
    CreateTagRequestSchema,
    TagListQuerySchema,
    TagListResponseSchema,
    TagParamsSchema,
    TagResponseSchema,
    TagStatsResponseSchema,
    UpdateTagSchema,
} from './tags.http.schema'

import { rbac, toFastifyPreHandler } from '@/features/auth/rbac.middleware'
import { ErrorResponseSchema } from '@/shared/schemas'

export const tagsRoutesV1: FastifyPluginAsync = async app => {
    app.withTypeProvider<TypeBoxTypeProvider>()

    // GET /api/v1/tags/:id
    app.get(
        '/tags/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.read('tags'))],
            schema: {
                tags: ['Tags'],
                summary: 'Get tag by ID',
                params: TagParamsSchema,
                response: {
                    200: TagResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        tagController.getTagById
    )

    // GET /api/v1/tags
    app.get(
        '/tags',
        {
            preHandler: [toFastifyPreHandler(rbac.read('tags'))],
            schema: {
                tags: ['Tags'],
                summary: 'List tags',
                querystring: TagListQuerySchema,
                response: {
                    200: TagListResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        tagController.listTags
    )

    // GET /api/v1/tags/stats
    app.get(
        '/tags/stats',
        {
            preHandler: [toFastifyPreHandler(rbac.read('tags'))],
            schema: {
                tags: ['Tags'],
                summary: 'Tag statistics',
                response: {
                    200: TagStatsResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        tagController.getTagStats
    )

    // POST /api/v1/tags
    app.post(
        '/tags',
        {
            preHandler: [toFastifyPreHandler(rbac.create('tags'))],
            schema: {
                tags: ['Tags'],
                summary: 'Create tag',
                body: CreateTagRequestSchema,
                response: {
                    201: TagResponseSchema,
                    400: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        tagController.createTag
    )

    // PUT /api/v1/tags/:id
    app.put(
        '/tags/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.update('tags'))],
            schema: {
                tags: ['Tags'],
                summary: 'Update tag',
                params: TagParamsSchema,
                body: UpdateTagSchema,
                response: {
                    200: TagResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        tagController.updateTag
    )

    // DELETE /api/v1/tags/:id
    app.delete(
        '/tags/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.delete('tags'))],
            schema: {
                tags: ['Tags'],
                summary: 'Delete tag',
                params: TagParamsSchema,
                response: {
                    204: { type: 'null' },
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        tagController.deleteTag
    )
}
