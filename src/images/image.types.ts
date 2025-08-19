/**
 * Image types for the images feature
 * Type definitions extracted from schemas and for testing
 */

import type { Static } from '@sinclair/typebox'
import { imageResponseSchema, imageStatsResponseSchema } from './image.schema.js'

// Types extracted from schemas
export type ImageResponse = Static<typeof imageResponseSchema>

export type ImageStatsResponse = Static<typeof imageStatsResponseSchema>

// Service types for image operations
export type ImageCreateData = {
  file: Buffer
  filename: string
  mimeType: string
  description?: string | undefined
  ownerId?: string | undefined
}

export type ImageBinaryData = {
  blob: Buffer
  mimeType: string
  size: number
  filename: string
}

// Database response type (matches Prisma Image model)
export type ImageDatabaseResponse = {
  id: string
  description: string | null
  filename: string
  size: number
  mimeType: string
  width: number
  height: number
  ownerId: string | null
  createdAt: Date
  updatedAt: Date
}

export type ImageStatsData = {
  totalImages: number
  totalSize: number
  averageSize: number
  byMimeType: Record<string, number>
  recentUploads: {
    last24Hours: number
    last7Days: number
    last30Days: number
  }
}

// Helper types for testing and API responses
export type ImageListResponse = {
  data: ImageResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
