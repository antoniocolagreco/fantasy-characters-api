import type { Skill, Visibility } from '@prisma/client'
import type { Static } from '@sinclair/typebox'
import type { createSkillSchema, updateSkillSchema, listSkillsQuerySchema } from './skill.schema'

// Database model types
export type SkillModel = Skill

// Request/Response types
export type CreateSkillData = Static<typeof createSkillSchema>
export type UpdateSkillData = Static<typeof updateSkillSchema>
export type ListSkillsQuery = Static<typeof listSkillsQuerySchema>

// Service layer types
export type SkillResponse = {
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

// Skill statistics data
export type SkillStatsData = {
  totalSkills: number
  publicSkills: number
  privateSkills: number
  orphanedSkills: number
  averageRequiredLevel: number
  skillsByLevelRange: {
    beginner: number // levels 1-10
    intermediate: number // levels 11-25
    advanced: number // levels 26-50
    expert: number // levels 51+
  }
}
