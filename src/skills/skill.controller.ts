import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createSkill,
  findSkillById,
  updateSkill,
  deleteSkill,
  listSkills,
  getSkillStats,
} from './skill.service'
import type {
  CreateSkillData,
  UpdateSkillData,
  ListSkillsQuery,
  SkillResponse,
  SkillStatsData,
} from './skill.types'
import type { AuthUser } from '../shared/rbac.service'

/**
 * Convert null to undefined for consistency with service layer
 */
const normalizeUser = (user?: AuthUser | null): AuthUser | undefined => user ?? undefined

// Create a new skill
export const createSkillHandler = async (
  request: FastifyRequest<{ Body: CreateSkillData }>,
  reply: FastifyReply,
): Promise<SkillResponse> => {
  const skill = await createSkill(request.body, normalizeUser(request.authUser))
  reply.status(201)
  return skill
}

// Get skill by ID
export const getSkillHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
): Promise<SkillResponse> => {
  return await findSkillById(request.params.id, normalizeUser(request.authUser))
}

// Update skill by ID
export const updateSkillHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateSkillData }>,
  _reply: FastifyReply,
): Promise<SkillResponse> => {
  return await updateSkill(request.params.id, request.body, normalizeUser(request.authUser))
}

// Delete skill by ID
export const deleteSkillHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> => {
  await deleteSkill(request.params.id, normalizeUser(request.authUser))
  reply.status(204)
}

// List skills with pagination and filtering
export const listSkillsHandler = async (
  request: FastifyRequest<{ Querystring: ListSkillsQuery }>,
  _reply: FastifyReply,
): Promise<{
  data: SkillResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> => {
  return await listSkills(request.query, normalizeUser(request.authUser))
}

// Get global skill statistics
export const getSkillStatsHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<SkillStatsData> => {
  return await getSkillStats(normalizeUser(request.authUser))
}
