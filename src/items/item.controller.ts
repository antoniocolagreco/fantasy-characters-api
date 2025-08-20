import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createItem,
  findItemById,
  updateItem,
  deleteItem,
  listItems,
  getItemStats,
} from './item.service'
import type {
  CreateItemData,
  UpdateItemData,
  ListItemsQuery,
  ItemResponse,
  ItemStatsData,
} from './item.types'

// Create a new item
export const createItemHandler = async (
  request: FastifyRequest<{ Body: CreateItemData }>,
  reply: FastifyReply,
): Promise<ItemResponse> => {
  const item = await createItem(request.body, request.authUser)
  reply.status(201)
  return item
}

// Get item by ID
export const getItemHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
): Promise<ItemResponse> => {
  return await findItemById(request.params.id, request.authUser)
}

// Update item by ID
export const updateItemHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateItemData }>,
  _reply: FastifyReply,
): Promise<ItemResponse> => {
  return await updateItem(request.params.id, request.body, request.authUser)
}

// Delete item by ID
export const deleteItemHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> => {
  await deleteItem(request.params.id, request.authUser)
  reply.status(204)
}

// List items with pagination and filtering
export const listItemsHandler = async (
  request: FastifyRequest<{ Querystring: ListItemsQuery }>,
  _reply: FastifyReply,
): Promise<{
  data: ItemResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> => {
  return await listItems(request.query, request.authUser)
}

// Get global item statistics
export const getItemStatsHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<ItemStatsData> => {
  return await getItemStats(request.authUser)
}
