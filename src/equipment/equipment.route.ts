import type { FastifyInstance } from 'fastify'
import {
  getCharacterEquipmentController,
  updateCharacterEquipmentController,
  updateEquipmentSlotController,
  getEquipmentStatsController,
} from './equipment.controller'
import {
  EquipmentResponseSchema,
  EquipmentBulkUpdateSchema,
  EquipmentSlotUpdateSchema,
  EquipmentStatsResponseSchema,
  EquipmentErrorResponseSchema,
} from './equipment.schema'
import { authenticateUser, requireRoles, optionalAuthentication } from '../auth/auth.middleware'
import { CacheMiddleware } from '../shared/cache.middleware'

const equipmentRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // Equipment statistics endpoint (global)
  fastify.get('/equipment/stats', {
    preHandler: [authenticateUser, requireRoles(['MODERATOR', 'ADMIN']), CacheMiddleware.stats()],
    schema: {
      tags: ['Equipment'],
      summary: 'Get equipment statistics',
      description: 'Get equipment usage statistics (requires MODERATOR or ADMIN role)',
      response: {
        200: EquipmentStatsResponseSchema,
        401: EquipmentErrorResponseSchema,
        403: EquipmentErrorResponseSchema,
      },
    },
    handler: getEquipmentStatsController,
  })

  // Character equipment endpoints (sub-resources)
  fastify.get('/characters/:id/equipment', {
    preHandler: [optionalAuthentication],
    schema: {
      tags: ['Equipment'],
      summary: 'Get character equipment',
      description: 'Get all equipped items for a character',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Character ID' },
        },
      },
      response: {
        200: EquipmentResponseSchema,
        404: EquipmentErrorResponseSchema,
        403: EquipmentErrorResponseSchema,
      },
    },
    handler: getCharacterEquipmentController,
  })

  fastify.put('/characters/:id/equipment', {
    preHandler: [authenticateUser],
    schema: {
      tags: ['Equipment'],
      summary: 'Update character equipment (bulk)',
      description: 'Update multiple equipment slots at once',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Character ID' },
        },
      },
      body: EquipmentBulkUpdateSchema,
      response: {
        200: EquipmentResponseSchema,
        400: EquipmentErrorResponseSchema,
        403: EquipmentErrorResponseSchema,
        404: EquipmentErrorResponseSchema,
      },
    },
    handler: updateCharacterEquipmentController,
  })

  fastify.patch('/characters/:id/equipment', {
    preHandler: [authenticateUser],
    schema: {
      tags: ['Equipment'],
      summary: 'Update single equipment slot',
      description: 'Equip or unequip an item in a specific slot',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Character ID' },
        },
      },
      body: EquipmentSlotUpdateSchema,
      response: {
        200: EquipmentResponseSchema,
        400: EquipmentErrorResponseSchema,
        403: EquipmentErrorResponseSchema,
        404: EquipmentErrorResponseSchema,
      },
    },
    handler: updateEquipmentSlotController,
  })
}

export default equipmentRoutes
