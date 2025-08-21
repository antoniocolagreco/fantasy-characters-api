/**
 * Character routes - Route definitions and middleware setup
 * Defines character-related endpoints with authentication and authorization
 */

import type { FastifyInstance } from 'fastify'
import { authenticateUser, optionalAuthentication } from '../auth/auth.middleware'
import {
  createCharacterHandler,
  getCharacterByIdHandler,
  listCharactersHandler,
  updateCharacterHandler,
  deleteCharacterHandler,
  getCharacterStatsHandler,
} from './character.controller'
import {
  CharacterResponseSchema,
  CreateCharacterSchema,
  UpdateCharacterSchema,
  ListCharactersQuerySchema,
  ListCharactersResponseSchema,
  CharacterStatsSchema,
  CharacterParamSchema,
  CharacterNotFoundSchema,
  CharacterConflictSchema,
  CharacterForbiddenSchema,
  CharacterBadRequestSchema,
} from './character.schema'

/**
 * Character routes plugin
 */
export const characterRoutes = async (fastify: FastifyInstance) => {
  // Get character statistics - public endpoint for basic stats
  fastify.get('/characters/stats', {
    schema: {
      tags: ['Characters'],
      summary: 'Get character statistics',
      description: 'Retrieve character statistics including counts and distributions',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: CharacterStatsSchema,
          },
        },
      },
    },
    handler: getCharacterStatsHandler,
  })

  // List characters with filtering and pagination - public endpoint
  fastify.get('/characters', {
    schema: {
      tags: ['Characters'],
      summary: 'List characters',
      description: 'Retrieve characters with filtering, pagination, and visibility controls',
      querystring: ListCharactersQuerySchema,
      response: {
        200: ListCharactersResponseSchema,
      },
    },
    handler: listCharactersHandler,
  })

  // Get character by ID - public endpoint with visibility controls
  fastify.get('/characters/:id', {
    preHandler: [optionalAuthentication],
    schema: {
      tags: ['Characters'],
      summary: 'Get character by ID',
      description: 'Retrieve character details by ID with optional relationship data',
      params: CharacterParamSchema,
      querystring: {
        type: 'object',
        properties: {
          includeRelations: {
            type: 'string',
            enum: ['true', 'false'],
            description: 'Include related entities (race, archetype, skills, etc.)',
          },
        },
      },
      response: {
        200: CharacterResponseSchema,
        404: CharacterNotFoundSchema,
        403: CharacterForbiddenSchema,
      },
    },
    handler: getCharacterByIdHandler,
  })

  // Create new character
  fastify.post('/characters', {
    preHandler: [authenticateUser],
    schema: {
      tags: ['Characters'],
      summary: 'Create character',
      description: 'Create a new character with race/archetype validation and stat calculation',
      body: CreateCharacterSchema,
      response: {
        201: CharacterResponseSchema,
        400: CharacterBadRequestSchema,
        409: CharacterConflictSchema,
      },
    },
    handler: createCharacterHandler,
  })

  // Update character by ID
  fastify.put('/characters/:id', {
    preHandler: [authenticateUser],
    schema: {
      tags: ['Characters'],
      summary: 'Update character',
      description: 'Update character data with ownership validation and stat recalculation',
      params: CharacterParamSchema,
      body: UpdateCharacterSchema,
      response: {
        200: CharacterResponseSchema,
        404: CharacterNotFoundSchema,
        403: CharacterForbiddenSchema,
        409: CharacterConflictSchema,
      },
    },
    handler: updateCharacterHandler,
  })

  // Delete character by ID
  fastify.delete('/characters/:id', {
    preHandler: [authenticateUser],
    schema: {
      tags: ['Characters'],
      summary: 'Delete character',
      description: 'Delete character with ownership validation',
      params: CharacterParamSchema,
      response: {
        204: {
          type: 'null',
          description: 'Character deleted successfully',
        },
        404: CharacterNotFoundSchema,
        403: CharacterForbiddenSchema,
      },
    },
    handler: deleteCharacterHandler,
  })
}
