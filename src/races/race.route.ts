import type { FastifyInstance } from 'fastify'
import {
  createRaceRouteSchema,
  getRaceRouteSchema,
  updateRaceRouteSchema,
  deleteRaceRouteSchema,
  listRacesRouteSchema,
  raceStatsRouteSchema,
} from './race.schema'
import {
  createRaceHandler,
  getRaceHandler,
  updateRaceHandler,
  deleteRaceHandler,
  listRacesHandler,
  getRaceStatsHandler,
} from './race.controller'
import {
  authenticateUser,
  requireActiveUser,
  optionalAuthentication,
} from '../auth/auth.middleware'
import { CacheMiddleware } from '../shared/cache.middleware'

export const raceRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // GET /api/races - List races with pagination and filtering
  fastify.route({
    method: 'GET',
    url: '/',
    schema: listRacesRouteSchema,
    preHandler: [optionalAuthentication, CacheMiddleware.publicList()],
    handler: listRacesHandler,
  })

  // GET /api/races/stats - Get race statistics
  fastify.route({
    method: 'GET',
    url: '/stats',
    schema: raceStatsRouteSchema,
    preHandler: [authenticateUser, CacheMiddleware.stats()],
    handler: getRaceStatsHandler,
  })

  // GET /api/races/:id - Get race by ID
  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: getRaceRouteSchema,
    preHandler: [optionalAuthentication, CacheMiddleware.medium()],
    handler: getRaceHandler,
  })

  // POST /api/races - Create a new race
  fastify.route({
    method: 'POST',
    url: '/',
    schema: createRaceRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: createRaceHandler,
  })

  // PUT /api/races/:id - Update race by ID
  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: updateRaceRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: updateRaceHandler,
  })

  // DELETE /api/races/:id - Delete race by ID
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: deleteRaceRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: deleteRaceHandler,
  })
}
