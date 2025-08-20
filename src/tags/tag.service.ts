import { Visibility } from '@prisma/client'
import { db } from '../shared/database/index'
import { createNotFoundError, createConflictError } from '../shared/errors'
import { PAGINATION } from '../shared/constants'
import {
  rbacService,
  type AuthUser,
  enforceAuthentication,
  enforcePermission,
} from '../shared/rbac.service'
import type {
  CreateTagData,
  UpdateTagData,
  TagResponse,
  TagStatsData,
  ListTagsQuery,
} from './tag.types'

// Type for database tag
type TagWithCounts = {
  id: string
  name: string
  description: string | null
  ownerId: string | null
  visibility: Visibility
  createdAt: Date
  updatedAt: Date
}

// Helper function to transform database tag to response format
const transformTag = (tag: TagWithCounts): TagResponse => {
  return {
    id: tag.id,
    name: tag.name,
    description: tag.description,
    ownerId: tag.ownerId,
    visibility: tag.visibility,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  }
}

/**
 * Create a new tag
 */
export const createTag = async (
  data: CreateTagData,
  currentUser: AuthUser | null,
): Promise<TagResponse> => {
  enforceAuthentication(currentUser)

  // Check if tag name already exists
  const existingTag = await db.tag.findUnique({
    where: { name: data.name },
  })

  if (existingTag) {
    throw createConflictError(`Tag with name "${data.name}" already exists`)
  }

  // Create tag with current user as owner
  const tag = await db.tag.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      visibility: (data.visibility as Visibility) || 'PUBLIC',
      ownerId: currentUser?.id ?? null,
    },
  })

  return transformTag(tag)
}

/**
 * Find tag by ID with permission check
 */
export const findTagById = async (
  id: string,
  currentUser: AuthUser | null,
): Promise<TagResponse> => {
  const tag = await db.tag.findUnique({
    where: { id },
  })

  if (!tag) {
    throw createNotFoundError('Tag not found')
  }

  // Check access permissions
  enforcePermission(
    rbacService.canAccessByVisibility(currentUser, tag),
    'Insufficient permissions to access this tag',
  )

  return transformTag(tag)
}

/**
 * Update tag by ID
 */
export const updateTag = async (
  id: string,
  data: UpdateTagData,
  currentUser: AuthUser | null,
): Promise<TagResponse> => {
  const tag = await findTagById(id, currentUser)

  // Check modification permissions
  enforcePermission(
    rbacService.canModifyResource(currentUser, tag),
    'Insufficient permissions to modify this tag',
  )

  // Check if new name conflicts with existing tag
  if (data.name && data.name !== tag.name) {
    const existingTag = await db.tag.findUnique({
      where: { name: data.name },
    })

    if (existingTag) {
      throw createConflictError(`Tag with name "${data.name}" already exists`)
    }
  }

  const updatedTag = await db.tag.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.visibility && { visibility: data.visibility as Visibility }),
    },
  })

  return transformTag(updatedTag)
}

/**
 * Delete tag by ID
 */
export const deleteTag = async (id: string, currentUser: AuthUser | null): Promise<void> => {
  const tag = await findTagById(id, currentUser)

  // Check deletion permissions
  enforcePermission(
    rbacService.canDeleteResource(currentUser, tag),
    'Insufficient permissions to delete this tag',
  )

  await db.tag.delete({
    where: { id },
  })
}

/**
 * List tags with pagination and filtering
 */
export const listTags = async (
  query: ListTagsQuery,
  currentUser: AuthUser | null,
): Promise<{
  data: TagResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> => {
  const page = query.page || PAGINATION.DEFAULT_PAGE
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT
  const skip = (page - 1) * limit

  const filters = rbacService.getOwnershipFilter(currentUser)
  const orderBy = { name: 'asc' as const }

  const tags = await db.tag.findMany({
    where: filters,
    orderBy,
    skip,
    take: limit,
  })

  const total = await db.tag.count({ where: filters })
  const totalPages = Math.ceil(total / limit)

  return {
    data: tags.map(tag => transformTag(tag)),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

/**
 * Get tag statistics
 */
export const getTagStats = async (currentUser: AuthUser | null): Promise<TagStatsData> => {
  const filters = rbacService.getOwnershipFilter(currentUser)

  const [totalTags, publicTags, privateTags, orphanedTags] = await Promise.all([
    db.tag.count({ where: filters }),
    db.tag.count({ where: { ...filters, visibility: 'PUBLIC' } }),
    db.tag.count({ where: { ...filters, visibility: 'PRIVATE' } }),
    db.tag.count({ where: { ...filters, ownerId: null } }),
  ])

  return {
    totalTags,
    publicTags,
    privateTags,
    orphanedTags,
  }
}
