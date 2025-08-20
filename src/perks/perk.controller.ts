import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createPerk,
  findPerkById,
  updatePerk,
  deletePerk,
  listPerks,
  getPerkStats,
} from './perk.service.js'
import type {
  CreatePerkData,
  UpdatePerkData,
  ListPerksQuery,
  PerkResponse,
  PerkStatsData,
} from './perk.types.js'

// Create a new perk
export const createPerkHandler = async (
  request: FastifyRequest<{ Body: CreatePerkData }>,
  reply: FastifyReply,
): Promise<PerkResponse> => {
  const perk = await createPerk(request.body, request.authUser)
  reply.status(201)
  return perk
}

// Get perk by ID
export const getPerkHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
): Promise<PerkResponse> => {
  return await findPerkById(request.params.id, request.authUser)
}

// Update perk by ID
export const updatePerkHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdatePerkData }>,
  _reply: FastifyReply,
): Promise<PerkResponse> => {
  return await updatePerk(request.params.id, request.body, request.authUser)
}

// Delete perk by ID
export const deletePerkHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> => {
  await deletePerk(request.params.id, request.authUser)
  reply.status(204)
}

// List perks with pagination and filtering
export const listPerksHandler = async (
  request: FastifyRequest<{ Querystring: ListPerksQuery }>,
  _reply: FastifyReply,
): Promise<{
  data: PerkResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> => {
  return await listPerks(request.query, request.authUser)
}

// Get global perk statistics
export const getPerkStatsHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<PerkStatsData> => {
  return await getPerkStats(request.authUser)
}
