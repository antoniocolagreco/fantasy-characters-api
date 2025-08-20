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
  CreatePerkData,
  UpdatePerkData,
  PerkResponse,
  PerkStatsData,
  ListPerksQuery,
} from './perk.types'

// Type for database perk
type PerkWithCounts = {
  id: string
  name: string
  description: string | null
  requiredLevel: number
  imageId: string | null
  ownerId: string | null
  visibility: Visibility
  createdAt: Date
  updatedAt: Date
}

// Helper function to transform database perk to response format
const transformPerk = (perk: PerkWithCounts): PerkResponse => {
  return {
    id: perk.id,
    name: perk.name,
    description: perk.description,
    requiredLevel: perk.requiredLevel,
    imageId: perk.imageId,
    ownerId: perk.ownerId,
    visibility: perk.visibility,
    createdAt: perk.createdAt,
    updatedAt: perk.updatedAt,
  }
}

/**
 * Create a new perk
 */
export const createPerk = async (
  data: CreatePerkData,
  currentUser: AuthUser | null,
): Promise<PerkResponse> => {
  enforceAuthentication(currentUser)

  // Check if perk name already exists
  const existingPerk = await db.perk.findUnique({
    where: { name: data.name },
  })

  if (existingPerk) {
    throw createConflictError(`Perk with name "${data.name}" already exists`)
  }

  // Validate image exists if provided
  if (data.imageId) {
    const image = await db.image.findUnique({
      where: { id: data.imageId },
    })

    if (!image) {
      throw createNotFoundError('Image not found')
    }

    // Check if user can access the image
    enforcePermission(
      rbacService.canAccessByVisibility(currentUser, image),
      'Insufficient permissions to use this image',
    )
  }

  // Create perk with current user as owner
  const perk = await db.perk.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      requiredLevel: data.requiredLevel ?? 0,
      imageId: data.imageId ?? null,
      visibility: (data.visibility as Visibility) || 'PUBLIC',
      ownerId: currentUser?.id ?? null,
    },
  })

  return transformPerk(perk)
}

/**
 * Find perk by ID with permission check
 */
export const findPerkById = async (
  id: string,
  currentUser: AuthUser | null,
): Promise<PerkResponse> => {
  const perk = await db.perk.findUnique({
    where: { id },
  })

  if (!perk) {
    throw createNotFoundError('Perk not found')
  }

  // Check visibility permissions
  enforcePermission(
    rbacService.canAccessByVisibility(currentUser, perk),
    'Insufficient permissions to access this perk',
  )

  return transformPerk(perk)
}

/**
 * List perks with pagination and filtering
 */
export const listPerks = async (
  query: ListPerksQuery,
  currentUser: AuthUser | null,
): Promise<{
  data: PerkResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> => {
  const page = query.page || 1
  const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT)
  const skip = (page - 1) * limit

  // Build filters
  const filters: Record<string, unknown> = {
    AND: [
      rbacService.getOwnershipFilter(currentUser), // RBAC filtering
      query.search
        ? {
            OR: [{ name: { contains: query.search } }, { description: { contains: query.search } }],
          }
        : {},
      query.minLevel !== undefined ? { requiredLevel: { gte: query.minLevel } } : {},
      query.maxLevel !== undefined ? { requiredLevel: { lte: query.maxLevel } } : {},
    ].filter(filter => Object.keys(filter).length > 0),
  }

  // Get total count for pagination
  const total = await db.perk.count({ where: filters })

  // Get perks with pagination
  const perks = await db.perk.findMany({
    where: filters,
    orderBy: [{ name: 'asc' }],
    skip,
    take: limit,
  })

  return {
    data: perks.map(transformPerk),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Update perk by ID
 */
export const updatePerk = async (
  id: string,
  data: UpdatePerkData,
  currentUser: AuthUser | null,
): Promise<PerkResponse> => {
  const perk = await findPerkById(id, currentUser)

  // Check modification permissions
  enforcePermission(
    rbacService.canModifyResource(currentUser, perk),
    'Insufficient permissions to modify this perk',
  )

  // Check for name conflicts if name is being updated
  if (data.name && data.name !== perk.name) {
    const existingPerk = await db.perk.findUnique({
      where: { name: data.name },
    })

    if (existingPerk) {
      throw createConflictError(`Perk with name "${data.name}" already exists`)
    }
  }

  // Validate image exists if provided
  if (data.imageId) {
    const image = await db.image.findUnique({
      where: { id: data.imageId },
    })

    if (!image) {
      throw createNotFoundError('Image not found')
    }

    // Check if user can access the image
    enforcePermission(
      rbacService.canAccessByVisibility(currentUser, image),
      'Insufficient permissions to use this image',
    )
  }

  // Update perk
  const updatedPerk = await db.perk.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.requiredLevel !== undefined && { requiredLevel: data.requiredLevel }),
      ...(data.imageId !== undefined && { imageId: data.imageId }),
      ...(data.visibility && { visibility: data.visibility as Visibility }),
    },
  })

  return transformPerk(updatedPerk)
}

/**
 * Delete perk by ID
 */
export const deletePerk = async (id: string, currentUser: AuthUser | null): Promise<void> => {
  const perk = await findPerkById(id, currentUser)

  // Check deletion permissions
  enforcePermission(
    rbacService.canDeleteResource(currentUser, perk),
    'Insufficient permissions to delete this perk',
  )

  // Check if perk is being used by any characters
  const charactersUsing = await db.character.count({
    where: {
      perks: {
        some: { id },
      },
    },
  })

  if (charactersUsing > 0) {
    throw createConflictError(
      `Cannot delete perk "${perk.name}" as it is being used by ${charactersUsing} character(s)`,
    )
  }

  // Check if perk is being used by any items
  const itemsUsing = await db.item.count({
    where: {
      bonusPerks: {
        some: { id },
      },
    },
  })

  if (itemsUsing > 0) {
    throw createConflictError(
      `Cannot delete perk "${perk.name}" as it is being used by ${itemsUsing} item(s)`,
    )
  }

  await db.perk.delete({
    where: { id },
  })
}

/**
 * Get perk statistics
 */
export const getPerkStats = async (currentUser: AuthUser | null): Promise<PerkStatsData> => {
  // Check permissions for viewing statistics
  enforcePermission(
    rbacService.canViewStatistics(currentUser),
    'Insufficient permissions to view perk statistics',
  )

  // Base filter for authorized perks
  const baseFilter = rbacService.getOwnershipFilter(currentUser)

  // Get basic counts
  const [totalPerks, publicPerks, privatePerks, orphanedPerks] = await Promise.all([
    db.perk.count({ where: baseFilter }),
    db.perk.count({
      where: { ...baseFilter, visibility: 'PUBLIC' },
    }),
    db.perk.count({
      where: { ...baseFilter, visibility: 'PRIVATE' },
    }),
    db.perk.count({
      where: { ...baseFilter, ownerId: null },
    }),
  ])

  // Get all perks for level calculations (only authorized perks)
  const perks = await db.perk.findMany({
    where: baseFilter,
    select: { requiredLevel: true },
  })

  // Calculate average required level
  const averageRequiredLevel =
    perks.length > 0 ? perks.reduce((sum, perk) => sum + perk.requiredLevel, 0) / perks.length : 0

  // Calculate perks by level range
  const perksByLevelRange = {
    noRequirement: perks.filter(perk => perk.requiredLevel === 0).length,
    beginner: perks.filter(perk => perk.requiredLevel >= 1 && perk.requiredLevel <= 10).length,
    intermediate: perks.filter(perk => perk.requiredLevel >= 11 && perk.requiredLevel <= 25).length,
    advanced: perks.filter(perk => perk.requiredLevel >= 26 && perk.requiredLevel <= 50).length,
    expert: perks.filter(perk => perk.requiredLevel >= 51).length,
  }

  return {
    totalPerks,
    publicPerks,
    privatePerks,
    orphanedPerks,
    averageRequiredLevel: Math.round(averageRequiredLevel * 100) / 100, // Round to 2 decimal places
    perksByLevelRange,
  }
}
