import type { FastifyInstance } from 'fastify'
import {
  createPerkRouteSchema,
  getPerkRouteSchema,
  updatePerkRouteSchema,
  deletePerkRouteSchema,
  listPerksRouteSchema,
  perkStatsRouteSchema,
} from './perk.schema'
import {
  createPerkHandler,
  getPerkHandler,
  updatePerkHandler,
  deletePerkHandler,
  listPerksHandler,
  getPerkStatsHandler,
} from './perk.controller'
import {
  authenticateUser,
  requireActiveUser,
  optionalAuthentication,
} from '../auth/auth.middleware'
import { CacheMiddleware } from '../shared/cache.middleware'

export const perkRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // GET /api/perks - List perks with pagination and filtering
  fastify.route({
    method: 'GET',
    url: '/',
    schema: listPerksRouteSchema,
    preHandler: [optionalAuthentication, CacheMiddleware.publicList()],
    handler: listPerksHandler,
  })

  // GET /api/perks/stats - Get perk statistics
  fastify.route({
    method: 'GET',
    url: '/stats',
    schema: perkStatsRouteSchema,
    preHandler: [authenticateUser, CacheMiddleware.stats()],
    handler: getPerkStatsHandler,
  })

  // GET /api/perks/:id - Get perk by ID
  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: getPerkRouteSchema,
    preHandler: [optionalAuthentication, CacheMiddleware.medium()],
    handler: getPerkHandler,
  })

  // POST /api/perks - Create a new perk
  fastify.route({
    method: 'POST',
    url: '/',
    schema: createPerkRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: createPerkHandler,
  })

  // PUT /api/perks/:id - Update perk by ID
  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: updatePerkRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: updatePerkHandler,
  })

  // DELETE /api/perks/:id - Delete perk by ID
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: deletePerkRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: deletePerkHandler,
  })
}
