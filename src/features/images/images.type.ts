import type { Prisma } from '@prisma/client'
import type { Static } from '@sinclair/typebox'

import type {
    ImageSchema,
    ImageMetadataSchema,
    ImageListQuerySchema,
    ImageStatsSchema,
    CreateImageSchema,
    UpdateImageSchema,
} from './v1/images.schema'

import type { PaginatedResultOf } from '@/shared/schemas'

// Domain types derived from schemas (single source of truth)
export type Image = Static<typeof ImageSchema>
export type ImageMetadata = Static<typeof ImageMetadataSchema>
export type ImageListQuery = Static<typeof ImageListQuerySchema>
export type ImageStats = Static<typeof ImageStatsSchema>

// HTTP layer types (derived from request/response schemas)
export type CreateImageRequest = Static<typeof CreateImageSchema>
export type UpdateImageRequest = Static<typeof UpdateImageSchema>

// Repository layer types (extend domain with internal fields)
export type CreateImageInput = Omit<Image, 'id' | 'createdAt' | 'updatedAt'> & {
    blob: Buffer // Override to use Node.js Buffer instead of Uint8Array
}

export type UpdateImageInput = Partial<Omit<Image, 'id' | 'createdAt' | 'updatedAt'>> & {
    blob?: Buffer // Override to use Node.js Buffer instead of Uint8Array
}

// Service layer types (extend query types with internal params)
export type ListImagesParams = ImageListQuery & {
    ownerId?: string
    userId?: string
}

// Repository layer result types (raw database data)
export type RawImageListResult = {
    data: {
        id: string
        description: string | null
        size: number
        mimeType: string
        width: number
        height: number
        ownerId: string | null
        visibility: string
        createdAt: Date
        updatedAt: Date
    }[]
    pagination: {
        limit: number
        hasNext: boolean
        hasPrev: boolean
        startCursor?: string
        endCursor?: string
    }
}

// Use generic domain pagination type instead of manual definition
export type ListImagesResult = PaginatedResultOf<ImageMetadata>

// Prisma query types (for repository layer)
export type ImageWhereInput = Prisma.ImageWhereInput
export type ImageOrderByInput = Prisma.ImageOrderByWithRelationInput
