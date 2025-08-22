import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  getCharacterEquipment,
  getEquipmentStats,
  updateCharacterEquipment,
  updateEquipmentSlot,
} from './equipment.service'
import type { BulkEquipmentUpdateData, SlotUpdateData } from './equipment.types'
import type { AuthUser } from '../shared/rbac.service'

/**
 * Convert null to undefined for consistency with service layer
 */
const normalizeUser = (user?: AuthUser | null): AuthUser | undefined => user ?? undefined

/**
 * Get character equipment controller
 */
export const getCharacterEquipmentController = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> => {
  const characterId = request.params.id
  const currentUser = request.authUser || null

  const equipment = await getCharacterEquipment(characterId, normalizeUser(currentUser))
  await reply.code(200).send(equipment)
}

/**
 * Update character equipment controller (bulk update)
 */
export const updateCharacterEquipmentController = async (
  request: FastifyRequest<{
    Params: { id: string }
    Body: BulkEquipmentUpdateData
  }>,
  reply: FastifyReply,
): Promise<void> => {
  const characterId = request.params.id
  const updateData = request.body
  const currentUser = request.authUser

  const equipment = await updateCharacterEquipment(
    characterId,
    updateData,
    normalizeUser(currentUser),
  )
  await reply.code(200).send(equipment)
}

/**
 * Update single equipment slot controller
 */
export const updateEquipmentSlotController = async (
  request: FastifyRequest<{
    Params: { id: string }
    Body: SlotUpdateData
  }>,
  reply: FastifyReply,
): Promise<void> => {
  const characterId = request.params.id
  const slotData = request.body
  const currentUser = request.authUser

  const equipment = await updateEquipmentSlot(characterId, slotData, normalizeUser(currentUser))
  await reply.code(200).send(equipment)
}

/**
 * Get equipment statistics controller
 */
export const getEquipmentStatsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const currentUser = request.authUser

  const stats = await getEquipmentStats(normalizeUser(currentUser))
  await reply.code(200).send(stats)
}
