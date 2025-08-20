import { Visibility } from '@prisma/client'
import { db } from '../shared/database/index'
import { createNotFoundError, createConflictError, createValidationError } from '../shared/errors'
import { PAGINATION } from '../shared/constants'
import {
  rbacService,
  type AuthUser,
  enforceAuthentication,
  enforcePermission,
} from '../shared/rbac.service'
import type {
  CreateArchetypeData,
  UpdateArchetypeData,
  ArchetypeResponse,
  ArchetypeStatsData,
  ListArchetypesQuery,
} from './archetype.types'

type ArchetypeWithCounts = {
  id: string
  name: string
  description: string | null
  imageId: string | null
  ownerId: string | null
  visibility: Visibility
  createdAt: Date
  updatedAt: Date
}

const transformArchetype = (archetype: ArchetypeWithCounts): ArchetypeResponse => {
  return {
    id: archetype.id,
    name: archetype.name,
    description: archetype.description,
    imageId: archetype.imageId,
    ownerId: archetype.ownerId,
    owner: null,
    skills: [],
    requiredRaces: [],
    tags: [],
    charactersCount: 0,
    visibility: archetype.visibility,
    createdAt: archetype.createdAt,
    updatedAt: archetype.updatedAt,
  }
}

export const createArchetype = async (
  data: CreateArchetypeData,
  currentUser: AuthUser | null,
): Promise<ArchetypeResponse> => {
  enforceAuthentication(currentUser)

  const existingArchetype = await db.archetype.findUnique({
    where: { name: data.name },
  })

  if (existingArchetype) {
    throw createConflictError(`Archetype with name "${data.name}" already exists`)
  }

  if (data.imageId) {
    const image = await db.image.findUnique({
      where: { id: data.imageId },
    })

    if (!image) {
      throw createNotFoundError('Image not found')
    }

    enforcePermission(
      rbacService.canAccessByVisibility(currentUser, image),
      'Insufficient permissions to use this image',
    )
  }

  const archetype = await db.archetype.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      imageId: data.imageId ?? null,
      ownerId: currentUser?.id ?? null,
      visibility: (data.visibility as Visibility) ?? 'PUBLIC',
    },
  })

  return transformArchetype(archetype)
}

export const findArchetypeById = async (
  id: string,
  currentUser: AuthUser | null,
): Promise<ArchetypeResponse> => {
  const archetype = await db.archetype.findUnique({
    where: { id },
  })

  if (!archetype) {
    throw createNotFoundError('Archetype not found')
  }

  enforcePermission(
    rbacService.canAccessByVisibility(currentUser, archetype),
    'Insufficient permissions to access this archetype',
  )

  return transformArchetype(archetype)
}

export const listArchetypes = async (query: ListArchetypesQuery, currentUser: AuthUser | null) => {
  const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, search, ownerId, visibility } = query

  const validatedLimit = Math.min(limit, PAGINATION.MAX_LIMIT)
  const skip = (page - 1) * validatedLimit

  const filters: Record<string, unknown> = {
    ...rbacService.getOwnershipFilter(currentUser),
  }

  if (search) {
    filters.OR = [{ name: { contains: search } }, { description: { contains: search } }]
  }

  if (ownerId) {
    filters.ownerId = ownerId
  }

  if (visibility) {
    filters.visibility = visibility as Visibility
  }

  const [archetypes, totalCount] = await Promise.all([
    db.archetype.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      skip,
      take: validatedLimit,
    }),
    db.archetype.count({ where: filters }),
  ])

  const totalPages = Math.ceil(totalCount / validatedLimit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return {
    archetypes: archetypes.map(transformArchetype),
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext,
      hasPrev,
    },
  }
}

export const updateArchetype = async (
  id: string,
  data: UpdateArchetypeData,
  currentUser: AuthUser | null,
): Promise<ArchetypeResponse> => {
  const existingArchetype = await db.archetype.findUnique({
    where: { id },
  })

  if (!existingArchetype) {
    throw createNotFoundError('Archetype not found')
  }

  enforcePermission(
    rbacService.canModifyResource(currentUser, existingArchetype),
    'Insufficient permissions to modify this archetype',
  )

  if (data.name && data.name !== existingArchetype.name) {
    const conflictArchetype = await db.archetype.findUnique({
      where: { name: data.name },
    })

    if (conflictArchetype) {
      throw createConflictError(`Archetype with name "${data.name}" already exists`)
    }
  }

  if (data.imageId !== undefined && data.imageId !== null) {
    const image = await db.image.findUnique({
      where: { id: data.imageId },
    })

    if (!image) {
      throw createNotFoundError('Image not found')
    }

    enforcePermission(
      rbacService.canAccessByVisibility(currentUser, image),
      'Insufficient permissions to use this image',
    )
  }

  // Update archetype
  const updatedArchetype = await db.archetype.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.imageId !== undefined && { imageId: data.imageId }),
      ...(data.visibility !== undefined && { visibility: data.visibility as Visibility }),
    },
  })

  return transformArchetype(updatedArchetype)
}

export const deleteArchetype = async (id: string, currentUser: AuthUser | null): Promise<void> => {
  const existingArchetype = await db.archetype.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          characters: true,
        },
      },
    },
  })

  if (!existingArchetype) {
    throw createNotFoundError('Archetype not found')
  }

  enforcePermission(
    rbacService.canDeleteResource(currentUser, existingArchetype),
    'Insufficient permissions to delete this archetype',
  )

  if (existingArchetype._count.characters > 0) {
    throw createValidationError(
      `Cannot delete archetype "${existingArchetype.name}" as it is used by ${existingArchetype._count.characters} character(s)`,
    )
  }

  await db.archetype.delete({
    where: { id },
  })
}

export const getArchetypeStats = async (
  currentUser: AuthUser | null,
): Promise<ArchetypeStatsData> => {
  enforcePermission(
    rbacService.canViewStatistics(currentUser),
    'Insufficient permissions to view statistics',
  )

  const totalCount = await db.archetype.count()

  return {
    totalCount,
    byVisibility: {},
    byOwnership: [],
    skillsDistribution: {},
    requiredRacesDistribution: {},
    tagsDistribution: {},
    charactersDistribution: {},
    averageSkillsPerArchetype: 0,
    averageRequiredRacesPerArchetype: 0,
    averageTagsPerArchetype: 0,
    averageCharactersPerArchetype: 0,
  }
}
