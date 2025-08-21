import type { Character, Sex, Visibility } from '@prisma/client'
import type { Static } from '@sinclair/typebox'
import type {
  CreateCharacterSchema,
  ListCharactersQuerySchema,
  UpdateCharacterSchema,
} from './character.schema'

// Database model types
export type CharacterModel = Character

// Request/Response types
export type CreateCharacterData = Static<typeof CreateCharacterSchema>
export type UpdateCharacterData = Static<typeof UpdateCharacterSchema>
export type ListCharactersQuery = Static<typeof ListCharactersQuerySchema>

// Service layer types
export type CharacterResponse = {
  id: string
  name: string
  sex: Sex
  age: number
  description: string | null
  level: number
  experience: number

  // Core attributes
  health: number
  mana: number
  stamina: number

  // Primary attributes
  strength: number
  constitution: number
  dexterity: number
  intelligence: number
  wisdom: number
  charisma: number

  // Required relationships
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

  // Optional relationships
  imageId: string | null
  image?: {
    id: string
    filename: string
    description: string | null
  } | null

  // Collections
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
  equipment?: {
    id: string
    characterId: string
    head: { id: string; name: string; description: string | null } | null
    face: { id: string; name: string; description: string | null } | null
    chest: { id: string; name: string; description: string | null } | null
    legs: { id: string; name: string; description: string | null } | null
    feet: { id: string; name: string; description: string | null } | null
    hands: { id: string; name: string; description: string | null } | null
    rightHand: { id: string; name: string; description: string | null } | null
    leftHand: { id: string; name: string; description: string | null } | null
    rightRing: { id: string; name: string; description: string | null } | null
    leftRing: { id: string; name: string; description: string | null } | null
    amulet: { id: string; name: string; description: string | null } | null
    belt: { id: string; name: string; description: string | null } | null
    backpack: { id: string; name: string; description: string | null } | null
    cloak: { id: string; name: string; description: string | null } | null
  } | null

  // Owner and metadata
  ownerId: string
  owner: {
    id: string
    email: string
    name: string | null
  }
  visibility: Visibility
  createdAt: Date
  updatedAt: Date
}

// Character creation data with calculated stats
export type CharacterCreationData = {
  name: string
  sex: Sex
  age: number
  description?: string | null
  level: number
  experience: number

  // Calculated core attributes (base + race modifiers)
  health: number
  mana: number
  stamina: number

  // Calculated primary attributes (base + race modifiers)
  strength: number
  constitution: number
  dexterity: number
  intelligence: number
  wisdom: number
  charisma: number

  // Required relationships
  raceId: string
  archetypeId: string

  // Optional relationships
  imageId?: string | null
  ownerId: string
  visibility: Visibility
}

// Character stats calculation context
export type CharacterStatsContext = {
  baseStrength: number
  baseConstitution: number
  baseDexterity: number
  baseIntelligence: number
  baseWisdom: number
  baseCharisma: number
  raceModifiers: {
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
}

// Character filter types for service layer
export type CharacterFilters = {
  // Pagination
  page?: number
  limit?: number

  // ID filtering
  raceId?: string
  archetypeId?: string
  ownerId?: string
  skillId?: string
  perkId?: string
  tagId?: string

  // Attribute filtering
  minLevel?: number
  maxLevel?: number
  sex?: Sex
  minAge?: number
  maxAge?: number
  minStrength?: number
  maxStrength?: number
  minConstitution?: number
  maxConstitution?: number
  minDexterity?: number
  maxDexterity?: number
  minIntelligence?: number
  maxIntelligence?: number
  minWisdom?: number
  maxWisdom?: number
  minCharisma?: number
  maxCharisma?: number
  minHealth?: number
  maxHealth?: number
  minMana?: number
  maxMana?: number
  minStamina?: number
  maxStamina?: number
  minExperience?: number
  maxExperience?: number

  // Visibility and ownership
  visibility?: Visibility
  includeOrphaned?: boolean

  // Search
  search?: string

  // Include relations
  includeRelations?: boolean

  // Sorting
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Character statistics types
export type CharacterStats = {
  totalCount: number
  byVisibility: Record<string, number>
  byOwnership: Array<{
    ownerId: string | null
    count: number
  }>
  levelDistribution: Record<number, number>
  averageLevel: number
  sexDistribution: {
    MALE: number
    FEMALE: number
  }
  raceDistribution: Array<{
    raceId: string
    raceName: string
    count: number
  }>
  archetypeDistribution: Array<{
    archetypeId: string
    archetypeName: string
    count: number
  }>
  attributeAverages: {
    strength: number
    constitution: number
    dexterity: number
    intelligence: number
    wisdom: number
    charisma: number
    health: number
    mana: number
    stamina: number
  }
  ageStatistics: {
    average: number
    median: number
    youngest: number
    oldest: number
  }
  skillsDistribution: Record<number, number>
  perksDistribution: Record<number, number>
  averageSkillsPerCharacter: number
  averagePerksPerCharacter: number
  popularSkills: Array<{
    skillId: string
    skillName: string
    count: number
  }>
  popularPerks: Array<{
    perkId: string
    perkName: string
    count: number
  }>
}

// Character validation result
export type CharacterValidationResult = {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

// Character build validation (race + archetype compatibility)
export type CharacterBuildValidation = {
  isRaceCompatible: boolean
  isArchetypeCompatible: boolean
  missingRequirements: string[]
  recommendations?: string[]
}
