import type { Race, Visibility } from '@prisma/client'
import type { Static } from '@sinclair/typebox'
import type { createRaceSchema, updateRaceSchema, listRacesQuerySchema } from '@/races/race.schema'

// Database model types
export type RaceModel = Race

// Request/Response types
export type CreateRaceData = Static<typeof createRaceSchema>
export type UpdateRaceData = Static<typeof updateRaceSchema>
export type ListRacesQuery = Static<typeof listRacesQuerySchema>

// Service layer types
export type RaceResponse = {
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

// Race statistics data
export type RaceStatsData = {
  totalRaces: number
  publicRaces: number
  privateRaces: number
  orphanedRaces: number
  averageModifiers: {
    health: number
    mana: number
    stamina: number
    strength: number
    constitution: number
    dexterity: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  popularModifierRanges: {
    highStrength: number // races with strength ≥ 12
    highIntelligence: number // races with intelligence ≥ 12
    highDexterity: number // races with dexterity ≥ 12
    highConstitution: number // races with constitution ≥ 12
    balanced: number // races with all modifiers between 9-11
  }
}

// Attribute modifier validation helpers
export type AttributeModifiers = {
  healthModifier?: number
  manaModifier?: number
  staminaModifier?: number
  strengthModifier?: number
  constitutionModifier?: number
  dexterityModifier?: number
  intelligenceModifier?: number
  wisdomModifier?: number
  charismaModifier?: number
}

// Filtering types for race queries
export type RaceFilters = {
  minStrength?: number
  maxStrength?: number
  minIntelligence?: number
  maxIntelligence?: number
  search?: string
}
