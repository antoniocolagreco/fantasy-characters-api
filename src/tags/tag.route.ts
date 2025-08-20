import type { FastifyInstance } from 'fastify'
import {
  createTagHandler,
  getTagHandler,
  updateTagHandler,
  deleteTagHandler,
  listTagsHandler,
  getTagStatsHandler,
} from './tag.controller'
import {
  createTagRouteSchema,
  updateTagRouteSchema,
  getTagRouteSchema,
  deleteTagRouteSchema,
  listTagsRouteSchema,
  tagStatsRouteSchema,
} from './tag.schema'
import { authenticateUser, requireActiveUser } from '../auth/auth.middleware'

export const tagRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // GET /api/tags - List tags with pagination and filtering
  fastify.route({
    method: 'GET',
    url: '/',
    schema: listTagsRouteSchema,
    handler: listTagsHandler,
  })

  // GET /api/tags/stats - Get tag statistics
  fastify.route({
    method: 'GET',
    url: '/stats',
    schema: tagStatsRouteSchema,
    preHandler: [authenticateUser],
    handler: getTagStatsHandler,
  })

  // GET /api/tags/:id - Get tag by ID
  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: getTagRouteSchema,
    handler: getTagHandler,
  })

  // POST /api/tags - Create a new tag
  fastify.route({
    method: 'POST',
    url: '/',
    schema: createTagRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: createTagHandler,
  })

  // PUT /api/tags/:id - Update tag by ID
  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: updateTagRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: updateTagHandler,
  })

  // DELETE /api/tags/:id - Delete tag by ID
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: deleteTagRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: deleteTagHandler,
  })
}
