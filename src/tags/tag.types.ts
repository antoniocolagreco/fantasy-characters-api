import type { Tag, Visibility } from '@prisma/client'
import type { Static } from '@sinclair/typebox'
import type { createTagSchema, updateTagSchema, listTagsQuerySchema } from './tag.schema.js'

// Database model types
export type TagModel = Tag

// Request/Response types
export type CreateTagData = Static<typeof createTagSchema>
export type UpdateTagData = Static<typeof updateTagSchema>
export type ListTagsQuery = Static<typeof listTagsQuerySchema>

// Service layer types
export type TagResponse = {
  id: string
  name: string
  description: string | null
  ownerId: string | null
  visibility: Visibility
  createdAt: Date
  updatedAt: Date
}

// Tag statistics data
export type TagStatsData = {
  totalTags: number
  publicTags: number
  privateTags: number
  orphanedTags: number
}
