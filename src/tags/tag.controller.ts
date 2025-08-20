import type { FastifyRequest, FastifyReply } from 'fastify'
import { createTag, findTagById, updateTag, deleteTag, listTags, getTagStats } from './tag.service'
import type {
  CreateTagData,
  UpdateTagData,
  ListTagsQuery,
  TagResponse,
  TagStatsData,
} from './tag.types'

// Create a new tag
export const createTagHandler = async (
  request: FastifyRequest<{ Body: CreateTagData }>,
  reply: FastifyReply,
): Promise<TagResponse> => {
  const tag = await createTag(request.body, request.authUser)
  reply.status(201)
  return tag
}

// Get tag by ID
export const getTagHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
): Promise<TagResponse> => {
  return await findTagById(request.params.id, request.authUser)
}

// Update tag by ID
export const updateTagHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateTagData }>,
  _reply: FastifyReply,
): Promise<TagResponse> => {
  return await updateTag(request.params.id, request.body, request.authUser)
}

// Delete tag by ID
export const deleteTagHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> => {
  await deleteTag(request.params.id, request.authUser)
  reply.status(204)
}

// List tags with pagination and filtering
export const listTagsHandler = async (
  request: FastifyRequest<{ Querystring: ListTagsQuery }>,
  _reply: FastifyReply,
): Promise<{
  data: TagResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> => {
  return await listTags(request.query, request.authUser)
}

// Get global tag statistics
export const getTagStatsHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<TagStatsData> => {
  return await getTagStats(request.authUser)
}
