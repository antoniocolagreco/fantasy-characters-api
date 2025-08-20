import type { Archetype, Visibility } from '@prisma/client'
import type { Static } from '@sinclair/typebox'
import type {
  createArchetypeSchema,
  updateArchetypeSchema,
  listArchetypesQuerySchema,
} from '@/archetypes/archetype.schema'

// Database model types
export type ArchetypeModel = Archetype

// Request/Response types
export type CreateArchetypeData = Static<typeof createArchetypeSchema>
export type UpdateArchetypeData = Static<typeof updateArchetypeSchema>
export type ListArchetypesQuery = Static<typeof listArchetypesQuerySchema>

// Service layer types
export type ArchetypeResponse = {
  id: string
  name: string
  description: string | null
  imageId: string | null
  ownerId: string | null
  owner?: {
    id: string
    name: string | null
    email: string
  } | null
  skills: Array<{
    id: string
    name: string
    description: string | null
    requiredLevel: number
  }>
  requiredRaces: Array<{
    id: string
    name: string
    description: string | null
  }>
  tags: Array<{
    id: string
    name: string
    description: string | null
  }>
  charactersCount: number
  visibility: Visibility
  createdAt: Date
  updatedAt: Date
}

// Archetype statistics data
export type ArchetypeStatsData = {
  totalCount: number
  byVisibility: Record<string, number>
  byOwnership: Array<{
    ownerId: string | null
    count: number
  }>
  skillsDistribution: Record<number, number>
  requiredRacesDistribution: Record<number, number>
  tagsDistribution: Record<number, number>
  charactersDistribution: Record<number, number>
  averageSkillsPerArchetype: number
  averageRequiredRacesPerArchetype: number
  averageTagsPerArchetype: number
  averageCharactersPerArchetype: number
}
