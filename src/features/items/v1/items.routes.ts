// Stub routes (full CRUD in later tasks)
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'

import { itemController } from './items.controller'
import {
    CreateItemSchema,
    ItemListQuerySchema,
    ItemListResponseSchema,
    ItemParamsSchema,
    ItemResponseSchema,
    ItemStatsResponseSchema,
    UpdateItemSchema,
} from './items.http.schema'

import { rbac, toFastifyPreHandler } from '@/features/auth/rbac.middleware'
import { ErrorResponseSchema } from '@/shared/schemas'

export const itemsRoutesV1: FastifyPluginAsync = async app => {
    app.withTypeProvider<TypeBoxTypeProvider>()

    app.get(
        '/items',
        {
            preHandler: [toFastifyPreHandler(rbac.read('items'))],
            schema: {
                tags: ['Items'],
                summary: 'List items',
                querystring: ItemListQuerySchema,
                response: {
                    200: ItemListResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                },
            },
        },
        itemController.listItems
    )

    app.get(
        '/items/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.read('items'))],
            schema: {
                tags: ['Items'],
                summary: 'Get item by ID',
                params: ItemParamsSchema,
                response: {
                    200: ItemResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                },
            },
        },
        itemController.getItemById
    )

    app.get(
        '/items/stats',
        {
            preHandler: [toFastifyPreHandler(rbac.read('items'))],
            schema: {
                tags: ['Items'],
                summary: 'Item statistics',
                response: {
                    200: ItemStatsResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                },
            },
        },
        itemController.getItemStats
    )

    app.post(
        '/items',
        {
            preHandler: [toFastifyPreHandler(rbac.create('items'))],
            schema: {
                tags: ['Items'],
                summary: 'Create item',
                body: CreateItemSchema,
                response: {
                    201: ItemResponseSchema,
                    400: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                },
            },
        },
        itemController.createItem
    )

    app.put(
        '/items/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.update('items'))],
            schema: {
                tags: ['Items'],
                summary: 'Update item',
                params: ItemParamsSchema,
                body: UpdateItemSchema,
                response: {
                    200: ItemResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                },
            },
        },
        itemController.updateItem
    )

    app.delete(
        '/items/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.delete('items'))],
            schema: {
                tags: ['Items'],
                summary: 'Delete item',
                params: ItemParamsSchema,
                response: {
                    204: { type: 'null' },
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                },
            },
        },
        itemController.deleteItem
    )
}
