/**
 * Image types for the images feature
 * Type definitions extracted from schemas and for testing
 */

import type { Static } from '@sinclair/typebox'
import { imageResponseSchema, imageStatsResponseSchema } from './image.schema.js'

// Types extracted from schemas
export type ImageResponse = Static<typeof imageResponseSchema>

export type ImageStatsResponse = Static<typeof imageStatsResponseSchema>

// Helper types for testing
export type ImageListResponse = {
  data: ImageResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
