import type { FastifyInstance } from 'fastify'
import {
  createItemRouteSchema,
  getItemRouteSchema,
  updateItemRouteSchema,
  deleteItemRouteSchema,
  listItemsRouteSchema,
  itemStatsRouteSchema,
} from './item.schema'
import {
  createItemHandler,
  getItemHandler,
  updateItemHandler,
  deleteItemHandler,
  listItemsHandler,
  getItemStatsHandler,
} from './item.controller'
import { authenticateUser, requireActiveUser } from '../auth/auth.middleware'

export const itemRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // GET /api/items - List items with pagination and filtering
  fastify.route({
    method: 'GET',
    url: '/',
    schema: listItemsRouteSchema,
    handler: listItemsHandler,
  })

  // GET /api/items/stats - Get item statistics
  fastify.route({
    method: 'GET',
    url: '/stats',
    schema: itemStatsRouteSchema,
    preHandler: [authenticateUser],
    handler: getItemStatsHandler,
  })

  // GET /api/items/:id - Get item by ID
  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: getItemRouteSchema,
    handler: getItemHandler,
  })

  // POST /api/items - Create a new item
  fastify.route({
    method: 'POST',
    url: '/',
    schema: createItemRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: createItemHandler,
  })

  // PUT /api/items/:id - Update item by ID
  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: updateItemRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: updateItemHandler,
  })

  // DELETE /api/items/:id - Delete item by ID
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: deleteItemRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: deleteItemHandler,
  })
}
