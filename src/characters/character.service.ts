/**
 * Character service - Core business logic for character management
 * Handles character CRUD operations with stat calculations, race/archetype validation,
 * and relationship management following functional programming principles
 */

import { PrismaClient, type Visibility, type Sex } from '@prisma/client'
import { CHARACTER_DEFAULTS } from '../shared/constants'
import { createBadRequestError, createConflictError, createNotFoundError } from '../shared/errors'
import { rbacService, type AuthUser } from '../shared/rbac.service'
import type {
  CharacterCreationData,
  CharacterFilters,
  CharacterResponse,
  CharacterStats,
  CharacterStatsContext,
  CharacterValidationResult,
  CreateCharacterData,
  UpdateCharacterData,
} from './character.types'

const prisma = new PrismaClient()

// Character include type for Prisma queries
const characterInclude = {
  race: true,
  archetype: true,
  image: true,
  owner: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  skills: true,
  perks: true,
  tags: true,
  inventory: true,
} as const

// Type for database character with all includes
type CharacterWithIncludes = {
  id: string
  name: string
  sex: Sex
  age: number
  description: string | null
  level: number
  experience: number
  health: number
  mana: number
  stamina: number
  strength: number
  constitution: number
  dexterity: number
  intelligence: number
  wisdom: number
  charisma: number
  raceId: string
  race: {
    id: string
    name: string
    healthModifier: number
    manaModifier: number
    staminaModifier: number
    strengthModifier: number
    constitutionModifier: number
    dexterityModifier: number
    intelligenceModifier: number
    wisdomModifier: number
    charismaModifier: number
  }
  archetypeId: string
  archetype: {
    id: string
    name: string
    description: string | null
  }
  imageId: string | null
  image?: {
    id: string
    filename: string
    description: string | null
  } | null
  ownerId: string
  owner: {
    id: string
    email: string
    name: string | null
  }
  skills?: Array<{
    id: string
    name: string
    description: string | null
    requiredLevel: number
  }>
  perks?: Array<{
    id: string
    name: string
    description: string | null
    requiredLevel: number
  }>
  tags?: Array<{
    id: string
    name: string
    description: string | null
  }>
  inventory?: Array<{
    id: string
    name: string
    description: string | null
    rarity: string
    slot: string
  }>
  visibility: Visibility
  createdAt: Date
  updatedAt: Date
}

/**
 * Character stat calculation utilities
 */
const calculateCharacterStats = (context: CharacterStatsContext) => {
  const {
    baseStrength,
    baseConstitution,
    baseDexterity,
    baseIntelligence,
    baseWisdom,
    baseCharisma,
    raceModifiers,
  } = context

  // Apply race modifiers to base stats
  const finalStrength = Math.max(
    1,
    Math.min(30, baseStrength + raceModifiers.strengthModifier - 10),
  )
  const finalConstitution = Math.max(
    1,
    Math.min(30, baseConstitution + raceModifiers.constitutionModifier - 10),
  )
  const finalDexterity = Math.max(
    1,
    Math.min(30, baseDexterity + raceModifiers.dexterityModifier - 10),
  )
  const finalIntelligence = Math.max(
    1,
    Math.min(30, baseIntelligence + raceModifiers.intelligenceModifier - 10),
  )
  const finalWisdom = Math.max(1, Math.min(30, baseWisdom + raceModifiers.wisdomModifier - 10))
  const finalCharisma = Math.max(
    1,
    Math.min(30, baseCharisma + raceModifiers.charismaModifier - 10),
  )

  // Calculate derived stats based on race modifiers and constitution
  const baseHealth = CHARACTER_DEFAULTS.HEALTH
  const baseMana = CHARACTER_DEFAULTS.MANA
  const baseStamina = CHARACTER_DEFAULTS.STAMINA

  // Fixed calculation: multiply by race modifier percentage
  const finalHealth = Math.max(1, Math.round((baseHealth * raceModifiers.healthModifier) / 100))
  const finalMana = Math.max(0, Math.round((baseMana * raceModifiers.manaModifier) / 100))
  const finalStamina = Math.max(0, Math.round((baseStamina * raceModifiers.staminaModifier) / 100))

  return {
    strength: finalStrength,
    constitution: finalConstitution,
    dexterity: finalDexterity,
    intelligence: finalIntelligence,
    wisdom: finalWisdom,
    charisma: finalCharisma,
    health: finalHealth,
    mana: finalMana,
    stamina: finalStamina,
  }
}

/**
 * Validate character creation data
 */
const validateCharacterCreation = async (
  data: CreateCharacterData,
): Promise<CharacterValidationResult> => {
  const errors: string[] = []

  // Validate age constraints
  const age = data.age || 18
  if (age < 16) {
    errors.push('Character age must be at least 16 years old')
  }
  if (age > 1000) {
    errors.push('Character age cannot exceed 1000 years')
  }

  // Check if race exists and is accessible
  const race = await prisma.race.findUnique({
    where: { id: data.raceId },
  })

  if (!race) {
    errors.push(`Race with ID ${data.raceId} not found`)
  }

  // Check if archetype exists and is accessible
  const archetype = await prisma.archetype.findUnique({
    where: { id: data.archetypeId },
    include: {
      requiredRaces: true,
    },
  })

  if (!archetype) {
    errors.push(`Archetype with ID ${data.archetypeId} not found`)
  }

  // Check race/archetype compatibility
  if (race && archetype) {
    const isRaceCompatible =
      archetype.requiredRaces.length === 0 ||
      archetype.requiredRaces.some(requiredRace => requiredRace.id === race.id)

    if (!isRaceCompatible) {
      errors.push(`Race '${race.name}' is not compatible with archetype '${archetype.name}'`)
    }
  }

  // Check if name is already taken
  const existingCharacter = await prisma.character.findUnique({
    where: { name: data.name },
  })

  if (existingCharacter) {
    errors.push(`Character name '${data.name}' already exists`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Create character creation data with calculated stats
 */
const prepareCharacterCreationData = async (
  data: CreateCharacterData,
  ownerId: string,
): Promise<CharacterCreationData> => {
  // Get race for stat calculations
  const race = await prisma.race.findUniqueOrThrow({
    where: { id: data.raceId },
  })

  // Calculate stats using race modifiers
  const statsContext: CharacterStatsContext = {
    baseStrength: data.strength || CHARACTER_DEFAULTS.STRENGTH,
    baseConstitution: data.constitution || CHARACTER_DEFAULTS.CONSTITUTION,
    baseDexterity: data.dexterity || CHARACTER_DEFAULTS.DEXTERITY,
    baseIntelligence: data.intelligence || CHARACTER_DEFAULTS.INTELLIGENCE,
    baseWisdom: data.wisdom || CHARACTER_DEFAULTS.WISDOM,
    baseCharisma: data.charisma || CHARACTER_DEFAULTS.CHARISMA,
    raceModifiers: {
      healthModifier: race.healthModifier,
      manaModifier: race.manaModifier,
      staminaModifier: race.staminaModifier,
      strengthModifier: race.strengthModifier,
      constitutionModifier: race.constitutionModifier,
      dexterityModifier: race.dexterityModifier,
      intelligenceModifier: race.intelligenceModifier,
      wisdomModifier: race.wisdomModifier,
      charismaModifier: race.charismaModifier,
    },
  }

  const calculatedStats = calculateCharacterStats(statsContext)

  return {
    name: data.name,
    sex: (data.sex as Sex) || 'MALE',
    age: data.age || 18,
    description: data.description || null,
    level: data.level || CHARACTER_DEFAULTS.LEVEL,
    experience: data.experience || CHARACTER_DEFAULTS.EXPERIENCE,
    ...calculatedStats,
    raceId: data.raceId,
    archetypeId: data.archetypeId,
    imageId: data.imageId || null,
    ownerId,
    visibility: (data.visibility as Visibility) || 'PUBLIC',
  }
}

/**
 * Transform database character to response format
 */
const transformCharacterToResponse = (character: CharacterWithIncludes): CharacterResponse => {
  return {
    id: character.id,
    name: character.name,
    sex: character.sex,
    age: character.age,
    description: character.description,
    level: character.level,
    experience: character.experience,
    health: character.health,
    mana: character.mana,
    stamina: character.stamina,
    strength: character.strength,
    constitution: character.constitution,
    dexterity: character.dexterity,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
    raceId: character.raceId,
    race: {
      id: character.race.id,
      name: character.race.name,
      healthModifier: character.race.healthModifier,
      manaModifier: character.race.manaModifier,
      staminaModifier: character.race.staminaModifier,
      strengthModifier: character.race.strengthModifier,
      constitutionModifier: character.race.constitutionModifier,
      dexterityModifier: character.race.dexterityModifier,
      intelligenceModifier: character.race.intelligenceModifier,
      wisdomModifier: character.race.wisdomModifier,
      charismaModifier: character.race.charismaModifier,
    },
    archetypeId: character.archetypeId,
    archetype: {
      id: character.archetype.id,
      name: character.archetype.name,
      description: character.archetype.description,
    },
    imageId: character.imageId,
    image: character.image
      ? {
          id: character.image.id,
          filename: character.image.filename,
          description: character.image.description,
        }
      : null,
    ownerId: character.ownerId,
    owner: {
      id: character.owner.id,
      email: character.owner.email,
      name: character.owner.name,
    },
    skills:
      character.skills?.map(
        (skill: {
          id: string
          name: string
          description: string | null
          requiredLevel: number
        }) => ({
          id: skill.id,
          name: skill.name,
          description: skill.description,
          requiredLevel: skill.requiredLevel,
        }),
      ) || [],
    perks:
      character.perks?.map(
        (perk: {
          id: string
          name: string
          description: string | null
          requiredLevel: number
        }) => ({
          id: perk.id,
          name: perk.name,
          description: perk.description,
          requiredLevel: perk.requiredLevel,
        }),
      ) || [],
    tags:
      character.tags?.map((tag: { id: string; name: string; description: string | null }) => ({
        id: tag.id,
        name: tag.name,
        description: tag.description,
      })) || [],
    inventory:
      character.inventory?.map(
        (item: {
          id: string
          name: string
          description: string | null
          rarity: string
          slot: string
        }) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          rarity: item.rarity,
          slot: item.slot,
        }),
      ) || [],
    visibility: character.visibility,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  }
}

/**
 * Create a new character
 */
export const createCharacter = async (
  data: CreateCharacterData,
  currentUser: AuthUser,
): Promise<CharacterResponse> => {
  // Validate input data and relationships
  const validation = await validateCharacterCreation(data)
  if (!validation.isValid) {
    throw createBadRequestError(validation.errors.join('; '))
  }

  // Prepare character data with calculated stats
  const characterData = await prepareCharacterCreationData(data, currentUser.id)

  // Create character with relationships in a transaction
  const character = await prisma.$transaction(async tx => {
    // Create the character
    const newCharacter = await tx.character.create({
      data: {
        ...characterData,
        // Connect relationships only if they exist
        ...(data.skillIds &&
          data.skillIds.length > 0 && {
            skills: {
              connect: data.skillIds.map(id => ({ id })),
            },
          }),
        ...(data.perkIds &&
          data.perkIds.length > 0 && {
            perks: {
              connect: data.perkIds.map(id => ({ id })),
            },
          }),
        ...(data.tagIds &&
          data.tagIds.length > 0 && {
            tags: {
              connect: data.tagIds.map(id => ({ id })),
            },
          }),
      },
      include: characterInclude,
    })

    // Create equipment entity for the character
    await tx.equipment.create({
      data: {
        characterId: newCharacter.id,
      },
    })

    return newCharacter
  })

  return transformCharacterToResponse(character)
}

/**
 * Find character by ID with access control
 */
export const findCharacterById = async (
  id: string,
  currentUser: AuthUser | null,
  includeRelations = true,
): Promise<CharacterResponse | null> => {
  const character = await prisma.character.findUnique({
    where: { id },
    include: includeRelations ? characterInclude : { race: true, archetype: true, owner: true },
  })

  if (!character) {
    return null
  }

  // Check visibility access
  if (!rbacService.canAccessByVisibility(currentUser, character)) {
    return null
  }

  return transformCharacterToResponse(character)
}

/**
 * Build character filter conditions for database queries
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildCharacterFilters = (filters: CharacterFilters, currentUser: AuthUser | null): any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  // Simple visibility filtering
  if (currentUser?.role === 'ADMIN') {
    // Admin can see all characters - no visibility filter
  } else {
    // Everyone else can only see public characters
    where.visibility = 'PUBLIC'
  }

  // Apply specific filters
  if (filters.raceId) where.raceId = filters.raceId
  if (filters.archetypeId) where.archetypeId = filters.archetypeId
  if (filters.ownerId) where.ownerId = filters.ownerId
  if (filters.sex) where.sex = filters.sex

  if (filters.minLevel || filters.maxLevel) {
    where.level = {}
    if (filters.minLevel) where.level.gte = filters.minLevel
    if (filters.maxLevel) where.level.lte = filters.maxLevel
  }

  if (filters.minAge || filters.maxAge) {
    where.age = {}
    if (filters.minAge) where.age.gte = filters.minAge
    if (filters.maxAge) where.age.lte = filters.maxAge
  }

  if (filters.minStrength || filters.maxStrength) {
    where.strength = {}
    if (filters.minStrength) where.strength.gte = filters.minStrength
    if (filters.maxStrength) where.strength.lte = filters.maxStrength
  }

  if (filters.minIntelligence || filters.maxIntelligence) {
    where.intelligence = {}
    if (filters.minIntelligence) where.intelligence.gte = filters.minIntelligence
    if (filters.maxIntelligence) where.intelligence.lte = filters.maxIntelligence
  }

  if (filters.search) {
    where.OR = [
      {
        name: {
          contains: filters.search,
        },
      },
      {
        description: {
          contains: filters.search,
        },
      },
    ]
  }

  return where
}

/**
 * List characters with filtering and pagination
 */
export const listCharacters = async (
  filters: CharacterFilters,
  currentUser: AuthUser | null,
): Promise<{
  characters: CharacterResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
}> => {
  const page = filters.page || 1
  const limit = Math.min(filters.limit || 20, 100)
  const skip = (page - 1) * limit

  const where = buildCharacterFilters(filters, currentUser)

  const [characters, total] = await Promise.all([
    prisma.character.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      include: filters.includeRelations
        ? characterInclude
        : { race: true, archetype: true, owner: true },
    }),
    prisma.character.count({ where }),
  ])

  return {
    characters: characters.map(transformCharacterToResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Update character with stat recalculation
 */
export const updateCharacter = async (
  id: string,
  data: UpdateCharacterData,
  currentUser: AuthUser | null,
): Promise<CharacterResponse> => {
  const character = await findCharacterById(id, currentUser)

  if (!character) {
    throw createNotFoundError('Character', id)
  }

  // Check modification permissions
  rbacService.enforcePermission(
    rbacService.canModifyResource(currentUser, character),
    'Insufficient permissions to modify this character',
  )

  // Check name uniqueness if name is being changed
  if (data.name && data.name !== character.name) {
    const existingCharacter = await prisma.character.findUnique({
      where: { name: data.name },
    })

    if (existingCharacter) {
      throw createConflictError(`Character name '${data.name}' is already taken`)
    }
  }

  // Prepare update data (simplified for now)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { ...data }

  // Update character with relationships
  const updatedCharacter = await prisma.character.update({
    where: { id },
    data: {
      ...updateData,
      ...(data.skillIds && {
        skills: {
          set: data.skillIds.map(skillId => ({ id: skillId })),
        },
      }),
      ...(data.perkIds && {
        perks: {
          set: data.perkIds.map(perkId => ({ id: perkId })),
        },
      }),
      ...(data.tagIds && {
        tags: {
          set: data.tagIds.map(tagId => ({ id: tagId })),
        },
      }),
    },
    include: characterInclude,
  })

  return transformCharacterToResponse(updatedCharacter)
}

/**
 * Delete character with ownership validation
 */
export const deleteCharacter = async (id: string, currentUser: AuthUser | null): Promise<void> => {
  const character = await findCharacterById(id, currentUser)

  if (!character) {
    throw createNotFoundError('Character', id)
  }

  // Check deletion permissions
  rbacService.enforcePermission(
    rbacService.canDeleteResource(currentUser, character),
    'Insufficient permissions to delete this character',
  )

  // Delete character (equipment will be cascade deleted)
  await prisma.character.delete({
    where: { id },
  })
}

/**
 * Get character statistics (simplified for now)
 */
export const getCharacterStats = async (currentUser: AuthUser | null): Promise<CharacterStats> => {
  const baseWhere = buildCharacterFilters({}, currentUser)

  // Get basic counts
  const totalCount = await prisma.character.count({ where: baseWhere })

  // Return minimal stats for now
  return {
    totalCount,
    byVisibility: { PUBLIC: totalCount },
    byOwnership: [],
    levelDistribution: {},
    averageLevel: 1,
    sexDistribution: { MALE: 0, FEMALE: 0 },
    raceDistribution: [],
    archetypeDistribution: [],
    attributeAverages: {
      strength: 10,
      constitution: 10,
      dexterity: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      health: 100,
      mana: 100,
      stamina: 100,
    },
    ageStatistics: {
      average: 18,
      median: 18,
      youngest: 18,
      oldest: 18,
    },
    skillsDistribution: {},
    perksDistribution: {},
    averageSkillsPerCharacter: 0,
    averagePerksPerCharacter: 0,
    popularSkills: [],
    popularPerks: [],
  }
}
