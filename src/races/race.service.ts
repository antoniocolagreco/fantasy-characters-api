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
import type {
  CreateRaceData,
  UpdateRaceData,
  RaceResponse,
  RaceStatsData,
  ListRacesQuery,
} from './race.types'

// Type for database race
type RaceWithCounts = {
  id: string
  name: string
  description: string | null
  healthModifier: number
  manaModifier: number
  staminaModifier: number
  strengthModifier: number
  constitutionModifier: number
  dexterityModifier: number
  intelligenceModifier: number
  wisdomModifier: number
  charismaModifier: number
  imageId: string | null
  ownerId: string | null
  visibility: Visibility
  createdAt: Date
  updatedAt: Date
}

// Helper function to transform database race to response format
const transformRace = (race: RaceWithCounts): RaceResponse => {
  return {
    id: race.id,
    name: race.name,
    description: race.description,
    healthModifier: race.healthModifier,
    manaModifier: race.manaModifier,
    staminaModifier: race.staminaModifier,
    strengthModifier: race.strengthModifier,
    constitutionModifier: race.constitutionModifier,
    dexterityModifier: race.dexterityModifier,
    intelligenceModifier: race.intelligenceModifier,
    wisdomModifier: race.wisdomModifier,
    charismaModifier: race.charismaModifier,
    imageId: race.imageId,
    ownerId: race.ownerId,
    visibility: race.visibility,
    createdAt: race.createdAt,
    updatedAt: race.updatedAt,
  }
}

/**
 * Create a new race
 */
export const createRace = async (
  data: CreateRaceData,
  currentUser: AuthUser | undefined,
): Promise<RaceResponse> => {
  enforceAuthentication(currentUser)

  // Check if race name already exists
  const existingRace = await db.race.findUnique({
    where: { name: data.name },
  })

  if (existingRace) {
    throw createConflictError(`Race with name "${data.name}" already exists`)
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

  // Create race with current user as owner
  const race = await db.race.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      healthModifier: data.healthModifier ?? 100,
      manaModifier: data.manaModifier ?? 100,
      staminaModifier: data.staminaModifier ?? 100,
      strengthModifier: data.strengthModifier ?? 10,
      constitutionModifier: data.constitutionModifier ?? 10,
      dexterityModifier: data.dexterityModifier ?? 10,
      intelligenceModifier: data.intelligenceModifier ?? 10,
      wisdomModifier: data.wisdomModifier ?? 10,
      charismaModifier: data.charismaModifier ?? 10,
      imageId: data.imageId ?? null,
      visibility: (data.visibility as Visibility) || 'PUBLIC',
      ownerId: currentUser?.id ?? null,
    },
  })

  return transformRace(race)
}

/**
 * Find race by ID with permission check
 */
export const findRaceById = async (
  id: string,
  currentUser: AuthUser | undefined,
): Promise<RaceResponse> => {
  const race = await db.race.findUnique({
    where: { id },
  })

  if (!race) {
    throw createNotFoundError('Race not found')
  }

  // Check visibility permissions
  enforcePermission(
    rbacService.canAccessByVisibility(currentUser, race),
    'Insufficient permissions to access this race',
  )

  return transformRace(race)
}

/**
 * List races with pagination and filtering
 */
export const listRaces = async (
  query: ListRacesQuery,
  currentUser: AuthUser | undefined,
): Promise<{
  races: RaceResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
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
      // Exact modifier filters
      query.strengthModifier !== undefined ? { strengthModifier: query.strengthModifier } : {},
      query.intelligenceModifier !== undefined
        ? { intelligenceModifier: query.intelligenceModifier }
        : {},
      // Range modifier filters
      query.minStrength !== undefined ? { strengthModifier: { gte: query.minStrength } } : {},
      query.maxStrength !== undefined ? { strengthModifier: { lte: query.maxStrength } } : {},
      query.minIntelligence !== undefined
        ? { intelligenceModifier: { gte: query.minIntelligence } }
        : {},
      query.maxIntelligence !== undefined
        ? { intelligenceModifier: { lte: query.maxIntelligence } }
        : {},
    ].filter(filter => Object.keys(filter).length > 0),
  }

  // Get total count for pagination
  const total = await db.race.count({ where: filters })

  // Get races with pagination
  const races = await db.race.findMany({
    where: filters,
    orderBy: [{ name: 'asc' }],
    skip,
    take: limit,
  })

  return {
    races: races.map(transformRace),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Update race by ID
 */
export const updateRace = async (
  id: string,
  data: UpdateRaceData,
  currentUser: AuthUser | undefined,
): Promise<RaceResponse> => {
  const race = await findRaceById(id, currentUser)

  // Check modification permissions
  enforcePermission(
    rbacService.canModifyResource(currentUser, race),
    'Insufficient permissions to modify this race',
  )

  // Check for name conflicts if name is being updated
  if (data.name && data.name !== race.name) {
    const existingRace = await db.race.findUnique({
      where: { name: data.name },
    })

    if (existingRace) {
      throw createConflictError(`Race with name "${data.name}" already exists`)
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

  // Update race
  const updatedRace = await db.race.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.healthModifier !== undefined && { healthModifier: data.healthModifier }),
      ...(data.manaModifier !== undefined && { manaModifier: data.manaModifier }),
      ...(data.staminaModifier !== undefined && { staminaModifier: data.staminaModifier }),
      ...(data.strengthModifier !== undefined && { strengthModifier: data.strengthModifier }),
      ...(data.constitutionModifier !== undefined && {
        constitutionModifier: data.constitutionModifier,
      }),
      ...(data.dexterityModifier !== undefined && { dexterityModifier: data.dexterityModifier }),
      ...(data.intelligenceModifier !== undefined && {
        intelligenceModifier: data.intelligenceModifier,
      }),
      ...(data.wisdomModifier !== undefined && { wisdomModifier: data.wisdomModifier }),
      ...(data.charismaModifier !== undefined && { charismaModifier: data.charismaModifier }),
      ...(data.imageId !== undefined && { imageId: data.imageId }),
      ...(data.visibility && { visibility: data.visibility as Visibility }),
    },
  })

  return transformRace(updatedRace)
}

/**
 * Delete race by ID
 */
export const deleteRace = async (id: string, currentUser: AuthUser | undefined): Promise<void> => {
  const race = await findRaceById(id, currentUser)

  // Check deletion permissions
  enforcePermission(
    rbacService.canDeleteResource(currentUser, race),
    'Insufficient permissions to delete this race',
  )

  // Check if race is being used by any characters
  const charactersUsing = await db.character.count({
    where: {
      raceId: id,
    },
  })

  if (charactersUsing > 0) {
    throw createConflictError(
      `Cannot delete race "${race.name}" as it is being used by ${charactersUsing} character(s)`,
    )
  }

  // Check if race is required by any archetypes
  const archetypesUsing = await db.archetype.count({
    where: {
      requiredRaces: {
        some: { id },
      },
    },
  })

  if (archetypesUsing > 0) {
    throw createConflictError(
      `Cannot delete race "${race.name}" as it is required by ${archetypesUsing} archetype(s)`,
    )
  }

  await db.race.delete({
    where: { id },
  })
}

/**
 * Get race statistics
 */
export const getRaceStats = async (currentUser: AuthUser | undefined): Promise<RaceStatsData> => {
  // Use base filter for authorized races (matches skills service approach)
  const baseFilter = rbacService.getOwnershipFilter(currentUser)

  // Get basic counts
  const [totalRaces, publicRaces, privateRaces, orphanedRaces] = await Promise.all([
    db.race.count({ where: baseFilter }),
    db.race.count({
      where: { ...baseFilter, visibility: 'PUBLIC' },
    }),
    db.race.count({
      where: { ...baseFilter, visibility: 'PRIVATE' },
    }),
    db.race.count({
      where: { ...baseFilter, ownerId: null },
    }),
  ])

  // Get all races for modifier calculations (only authorized races)
  const races = await db.race.findMany({
    where: baseFilter,
    select: {
      healthModifier: true,
      manaModifier: true,
      staminaModifier: true,
      strengthModifier: true,
      constitutionModifier: true,
      dexterityModifier: true,
      intelligenceModifier: true,
      wisdomModifier: true,
      charismaModifier: true,
    },
  })

  // Calculate average modifiers
  const averageModifiers = {
    health: 0,
    mana: 0,
    stamina: 0,
    strength: 0,
    constitution: 0,
    dexterity: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  }

  if (races.length > 0) {
    averageModifiers.health =
      races.reduce((sum, race) => sum + race.healthModifier, 0) / races.length
    averageModifiers.mana = races.reduce((sum, race) => sum + race.manaModifier, 0) / races.length
    averageModifiers.stamina =
      races.reduce((sum, race) => sum + race.staminaModifier, 0) / races.length
    averageModifiers.strength =
      races.reduce((sum, race) => sum + race.strengthModifier, 0) / races.length
    averageModifiers.constitution =
      races.reduce((sum, race) => sum + race.constitutionModifier, 0) / races.length
    averageModifiers.dexterity =
      races.reduce((sum, race) => sum + race.dexterityModifier, 0) / races.length
    averageModifiers.intelligence =
      races.reduce((sum, race) => sum + race.intelligenceModifier, 0) / races.length
    averageModifiers.wisdom =
      races.reduce((sum, race) => sum + race.wisdomModifier, 0) / races.length
    averageModifiers.charisma =
      races.reduce((sum, race) => sum + race.charismaModifier, 0) / races.length

    // Round to 2 decimal places
    Object.keys(averageModifiers).forEach(key => {
      averageModifiers[key as keyof typeof averageModifiers] =
        Math.round(averageModifiers[key as keyof typeof averageModifiers] * 100) / 100
    })
  }

  // Calculate popular modifier ranges
  const popularModifierRanges = {
    highStrength: races.filter(race => race.strengthModifier >= 12).length,
    highIntelligence: races.filter(race => race.intelligenceModifier >= 12).length,
    highDexterity: races.filter(race => race.dexterityModifier >= 12).length,
    highConstitution: races.filter(race => race.constitutionModifier >= 12).length,
    balanced: races.filter(
      race =>
        race.strengthModifier >= 9 &&
        race.strengthModifier <= 11 &&
        race.constitutionModifier >= 9 &&
        race.constitutionModifier <= 11 &&
        race.dexterityModifier >= 9 &&
        race.dexterityModifier <= 11 &&
        race.intelligenceModifier >= 9 &&
        race.intelligenceModifier <= 11 &&
        race.wisdomModifier >= 9 &&
        race.wisdomModifier <= 11 &&
        race.charismaModifier >= 9 &&
        race.charismaModifier <= 11,
    ).length,
  }

  return {
    totalRaces,
    publicRaces,
    privateRaces,
    orphanedRaces,
    averageModifiers,
    popularModifierRanges,
  }
}
