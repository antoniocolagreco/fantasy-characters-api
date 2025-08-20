import type { FastifyInstance } from 'fastify'
import {
  createRaceRouteSchema,
  getRaceRouteSchema,
  updateRaceRouteSchema,
  deleteRaceRouteSchema,
  listRacesRouteSchema,
  raceStatsRouteSchema,
} from './race.schema.js'
import {
  createRaceHandler,
  getRaceHandler,
  updateRaceHandler,
  deleteRaceHandler,
  listRacesHandler,
  getRaceStatsHandler,
} from './race.controller.js'
import { authenticateUser, requireActiveUser } from '../auth/auth.middleware.js'

export const raceRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // GET /api/races - List races with pagination and filtering
  fastify.route({
    method: 'GET',
    url: '/',
    schema: listRacesRouteSchema,
    handler: listRacesHandler,
  })

  // GET /api/races/stats - Get race statistics
  fastify.route({
    method: 'GET',
    url: '/stats',
    schema: raceStatsRouteSchema,
    preHandler: [authenticateUser],
    handler: getRaceStatsHandler,
  })

  // GET /api/races/:id - Get race by ID
  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: getRaceRouteSchema,
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
