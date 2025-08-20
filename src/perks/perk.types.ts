import type { Perk, Visibility } from '@prisma/client'
import type { Static } from '@sinclair/typebox'
import type { createPerkSchema, updatePerkSchema, listPerksQuerySchema } from '@/perks/perk.schema'

// Database model types
export type PerkModel = Perk

// Request/Response types
export type CreatePerkData = Static<typeof createPerkSchema>
export type UpdatePerkData = Static<typeof updatePerkSchema>
export type ListPerksQuery = Static<typeof listPerksQuerySchema>

// Service layer types
export type PerkResponse = {
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

// Perk statistics data
export type PerkStatsData = {
  totalPerks: number
  publicPerks: number
  privatePerks: number
  orphanedPerks: number
  averageRequiredLevel: number
  perksByLevelRange: {
    noRequirement: number // level 0
    beginner: number // levels 1-10
    intermediate: number // levels 11-25
    advanced: number // levels 26-50
    expert: number // levels 51+
  }
}
