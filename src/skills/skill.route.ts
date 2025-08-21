import type { FastifyInstance } from 'fastify'
import {
  createSkillRouteSchema,
  getSkillRouteSchema,
  updateSkillRouteSchema,
  deleteSkillRouteSchema,
  listSkillsRouteSchema,
  skillStatsRouteSchema,
} from './skill.schema'
import {
  createSkillHandler,
  getSkillHandler,
  updateSkillHandler,
  deleteSkillHandler,
  listSkillsHandler,
  getSkillStatsHandler,
} from './skill.controller'
import {
  authenticateUser,
  requireActiveUser,
  optionalAuthentication,
} from '../auth/auth.middleware'

export const skillRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // GET /api/skills - List skills with pagination and filtering
  fastify.route({
    method: 'GET',
    url: '/',
    schema: listSkillsRouteSchema,
    preHandler: [optionalAuthentication],
    handler: listSkillsHandler,
  })

  // GET /api/skills/stats - Get skill statistics
  fastify.route({
    method: 'GET',
    url: '/stats',
    schema: skillStatsRouteSchema,
    preHandler: [authenticateUser],
    handler: getSkillStatsHandler,
  })

  // GET /api/skills/:id - Get skill by ID
  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: getSkillRouteSchema,
    preHandler: [optionalAuthentication],
    handler: getSkillHandler,
  })

  // POST /api/skills - Create a new skill
  fastify.route({
    method: 'POST',
    url: '/',
    schema: createSkillRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: createSkillHandler,
  })

  // PUT /api/skills/:id - Update skill by ID
  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: updateSkillRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: updateSkillHandler,
  })

  // DELETE /api/skills/:id - Delete skill by ID
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: deleteSkillRouteSchema,
    preHandler: [authenticateUser, requireActiveUser],
    handler: deleteSkillHandler,
  })
}
