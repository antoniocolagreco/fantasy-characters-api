import type { FastifyInstance } from 'fastify'
import {
  createArchetypeRouteSchema,
  getArchetypeRouteSchema,
  updateArchetypeRouteSchema,
  deleteArchetypeRouteSchema,
  listArchetypesRouteSchema,
  archetypeStatsRouteSchema,
} from './archetype.schema'
import {
  createArchetypeHandler,
  getArchetypeHandler,
  updateArchetypeHandler,
  deleteArchetypeHandler,
  listArchetypesHandler,
  getArchetypeStatsHandler,
} from './archetype.controller'
import { authenticateUser, requireActiveUser } from '../auth/auth.middleware'

export const archetypeRoutes = async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: listArchetypesRouteSchema,
    handler: listArchetypesHandler,
  })

  fastify.route({
    method: 'GET',
    url: '/stats',
    schema: archetypeStatsRouteSchema,
    preHandler: [authenticateUser],
    handler: getArchetypeStatsHandler,
  })

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: getArchetypeRouteSchema,
    handler: getArchetypeHandler,
  })

  fastify.route({
    method: 'POST',
    url: '/',
    schema: createArchetypeRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: createArchetypeHandler,
  })

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: updateArchetypeRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: updateArchetypeHandler,
  })

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: deleteArchetypeRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: deleteArchetypeHandler,
  })
}
