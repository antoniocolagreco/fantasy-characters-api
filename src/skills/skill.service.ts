import { Visibility } from '@prisma/client'
import { db } from '../shared/prisma.service'
import { createNotFoundError, createConflictError } from '../shared/errors'
import { PAGINATION } from '../shared/constants'
import {
  rbacService,
  type AuthUser,
  enforceAuthentication,
  enforcePermission,
} from '../shared/rbac.service'
import { CacheInvalidation } from '../shared/cache.middleware'
import type {
  CreateSkillData,
  UpdateSkillData,
  SkillResponse,
  SkillStatsData,
  ListSkillsQuery,
} from './skill.types'

// Type for database skill
type SkillWithCounts = {
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

// Helper function to transform database skill to response format
const transformSkill = (skill: SkillWithCounts): SkillResponse => {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    requiredLevel: skill.requiredLevel,
    imageId: skill.imageId,
    ownerId: skill.ownerId,
    visibility: skill.visibility,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
  }
}

/**
 * Create a new skill
 */
export const createSkill = async (
  data: CreateSkillData,
  currentUser: AuthUser | undefined,
): Promise<SkillResponse> => {
  enforceAuthentication(currentUser)

  // Check if skill name already exists
  const existingSkill = await db.skill.findUnique({
    where: { name: data.name },
  })

  if (existingSkill) {
    throw createConflictError(`Skill with name "${data.name}" already exists`)
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

  // Create skill with current user as owner
  const skill = await db.skill.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      requiredLevel: data.requiredLevel ?? 1,
      imageId: data.imageId ?? null,
      visibility: (data.visibility as Visibility) || 'PUBLIC',
      ownerId: currentUser?.id ?? null,
    },
  })

  // Invalidate relevant caches
  CacheInvalidation.lists()
  CacheInvalidation.stats()
  CacheInvalidation.resource('skills')

  return transformSkill(skill)
}

/**
 * Find skill by ID with permission check
 */
export const findSkillById = async (
  id: string,
  currentUser: AuthUser | undefined,
): Promise<SkillResponse> => {
  const skill = await db.skill.findUnique({
    where: { id },
  })

  if (!skill) {
    throw createNotFoundError('Skill not found')
  }

  // Check access permissions
  enforcePermission(
    rbacService.canAccessByVisibility(currentUser, skill),
    'Insufficient permissions to access this skill',
  )

  return transformSkill(skill)
}

/**
 * Update skill by ID
 */
export const updateSkill = async (
  id: string,
  data: UpdateSkillData,
  currentUser: AuthUser | undefined,
): Promise<SkillResponse> => {
  const skill = await findSkillById(id, currentUser)

  // Check modification permissions
  enforcePermission(
    rbacService.canModifyResource(currentUser, skill),
    'Insufficient permissions to modify this skill',
  )

  // Check if new name conflicts with existing skill
  if (data.name && data.name !== skill.name) {
    const existingSkill = await db.skill.findUnique({
      where: { name: data.name },
    })

    if (existingSkill) {
      throw createConflictError(`Skill with name "${data.name}" already exists`)
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

  const updatedSkill = await db.skill.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.requiredLevel !== undefined && { requiredLevel: data.requiredLevel }),
      ...(data.imageId !== undefined && { imageId: data.imageId }),
      ...(data.visibility && { visibility: data.visibility as Visibility }),
    },
  })

  // Invalidate relevant caches
  CacheInvalidation.lists()
  CacheInvalidation.stats()
  CacheInvalidation.resource('skills', id)

  return transformSkill(updatedSkill)
}

/**
 * Delete skill by ID
 */
export const deleteSkill = async (id: string, currentUser: AuthUser | undefined): Promise<void> => {
  const skill = await findSkillById(id, currentUser)

  // Check deletion permissions
  enforcePermission(
    rbacService.canDeleteResource(currentUser, skill),
    'Insufficient permissions to delete this skill',
  )

  // Check if skill is being used by characters
  const skillUsage = await db.character.count({
    where: {
      skills: {
        some: { id },
      },
    },
  })

  if (skillUsage > 0) {
    throw createConflictError('Cannot delete skill that is being used by characters')
  }

  await db.skill.delete({
    where: { id },
  })

  // Invalidate relevant caches
  CacheInvalidation.lists()
  CacheInvalidation.stats()
  CacheInvalidation.resource('skills', id)
}

/**
 * List skills with pagination and filtering
 */
export const listSkills = async (
  query: ListSkillsQuery,
  currentUser: AuthUser | undefined,
): Promise<{
  data: SkillResponse[]
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

  const baseFilters = rbacService.getOwnershipFilter(currentUser)

  // Build the where clause
  const whereClause: Record<string, unknown> = { ...baseFilters }

  // Add search filtering
  if (query.search) {
    whereClause.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  // Add level range filtering
  if (query.minLevel || query.maxLevel) {
    const levelFilter: Record<string, number> = {}
    if (query.minLevel) levelFilter.gte = query.minLevel
    if (query.maxLevel) levelFilter.lte = query.maxLevel
    whereClause.requiredLevel = levelFilter
  }

  const orderBy = { name: 'asc' as const }

  const skills = await db.skill.findMany({
    where: whereClause,
    orderBy,
    skip,
    take: limit,
  })

  const total = await db.skill.count({ where: whereClause })
  const totalPages = Math.ceil(total / limit)

  return {
    data: skills.map(skill => transformSkill(skill)),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

/**
 * Get skill statistics
 */
export const getSkillStats = async (currentUser: AuthUser | undefined): Promise<SkillStatsData> => {
  const filters = rbacService.getOwnershipFilter(currentUser)

  const [
    totalSkills,
    publicSkills,
    privateSkills,
    orphanedSkills,
    beginnerSkills,
    intermediateSkills,
    advancedSkills,
    expertSkills,
    averageLevel,
  ] = await Promise.all([
    db.skill.count({ where: filters }),
    db.skill.count({ where: { ...filters, visibility: 'PUBLIC' } }),
    db.skill.count({ where: { ...filters, visibility: 'PRIVATE' } }),
    db.skill.count({ where: { ...filters, ownerId: null } }),
    db.skill.count({ where: { ...filters, requiredLevel: { gte: 1, lte: 10 } } }),
    db.skill.count({ where: { ...filters, requiredLevel: { gte: 11, lte: 25 } } }),
    db.skill.count({ where: { ...filters, requiredLevel: { gte: 26, lte: 50 } } }),
    db.skill.count({ where: { ...filters, requiredLevel: { gte: 51 } } }),
    db.skill.aggregate({
      where: filters,
      _avg: { requiredLevel: true },
    }),
  ])

  return {
    totalSkills,
    publicSkills,
    privateSkills,
    orphanedSkills,
    averageRequiredLevel: Math.round(averageLevel._avg.requiredLevel || 0),
    skillsByLevelRange: {
      beginner: beginnerSkills,
      intermediate: intermediateSkills,
      advanced: advancedSkills,
      expert: expertSkills,
    },
  }
}
