import type { FastifyRequest, FastifyReply } from 'fastify'
import type { AuthUser } from '../shared/rbac.service'
import {
  createArchetype,
  findArchetypeById,
  updateArchetype,
  deleteArchetype,
  listArchetypes,
  getArchetypeStats,
} from './archetype.service'
import type {
  CreateArchetypeData,
  UpdateArchetypeData,
  ListArchetypesQuery,
} from './archetype.types'

/**
 * Convert null to undefined for consistency with service layer
 */
const normalizeUser = (user?: AuthUser | null): AuthUser | undefined => user ?? undefined

export const createArchetypeHandler = async (
  request: FastifyRequest<{ Body: CreateArchetypeData }>,
  reply: FastifyReply,
) => {
  const archetype = await createArchetype(request.body, normalizeUser(request.authUser))
  reply.status(201)
  return archetype
}

export const getArchetypeHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
) => {
  return await findArchetypeById(request.params.id, normalizeUser(request.authUser))
}

export const listArchetypesHandler = async (
  request: FastifyRequest<{ Querystring: ListArchetypesQuery }>,
  _reply: FastifyReply,
) => {
  return await listArchetypes(request.query, normalizeUser(request.authUser))
}

export const updateArchetypeHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateArchetypeData }>,
  _reply: FastifyReply,
) => {
  return await updateArchetype(request.params.id, request.body, normalizeUser(request.authUser))
}

export const deleteArchetypeHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  await deleteArchetype(request.params.id, normalizeUser(request.authUser))
  reply.status(204)
}

export const getArchetypeStatsHandler = async (request: FastifyRequest, _reply: FastifyReply) => {
  return await getArchetypeStats(normalizeUser(request.authUser))
}
