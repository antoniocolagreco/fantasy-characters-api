import { processImageToWebP, validateImageFile } from './images.processing'
import {
    createImageInDb,
    deleteImageFromDb,
    findImageBlobByIdInDb,
    findImageMetadataByIdInDb,
    getImageStatsFromDb,
    listImagesInDb,
    updateImageInDb,
} from './images.repository'
import type {
    CreateImageInput,
    ImageStats,
    ListImagesParams,
    ListImagesResult,
    UpdateImageInput,
} from './images.type'
import type { ImageMetadata } from './v1/images.schema'

import type { AuthenticatedUser } from '@/features/auth'
import { err } from '@/shared/errors'
import {
    applySecurityFilters,
    canCreateResource,
    canModifyResource,
    canViewResource,
} from '@/shared/utils/rbac.helpers'

/**
 * Transform Prisma Image to API Image format
 */
function transformImageForApi(image: {
    id: string
    description: string | null
    size: number
    mimeType: string
    width: number
    height: number
    ownerId: string | null
    visibility: string
    createdAt: Date | string
    updatedAt: Date | string
}): ImageMetadata {
    const base = {
        id: image.id,
        size: image.size,
        mimeType: image.mimeType,
        width: image.width,
        height: image.height,
        visibility: image.visibility as 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
        createdAt:
            image.createdAt instanceof Date ? image.createdAt.toISOString() : image.createdAt,
        updatedAt:
            image.updatedAt instanceof Date ? image.updatedAt.toISOString() : image.updatedAt,
        url: `/api/v1/images/${image.id}/file`,
    }

    return {
        ...base,
        ...(image.description && { description: image.description }),
        ...(image.ownerId && { ownerId: image.ownerId }),
    }
}

/**
 * Image service - handles business logic for image management
 * Following new RBAC architecture: Service builds security filters, Repository applies them.
 */

export const imageService = {
    async createImage(
        data: {
            description?: string
            visibility?: 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
        },
        file: { mimetype: string; filename?: string },
        buffer: Buffer,
        user?: AuthenticatedUser
    ): Promise<ImageMetadata> {
        // Check if user can create content - users can only create content for themselves
        if (!canCreateResource(user, user?.id)) {
            throw err('FORBIDDEN', 'Cannot create images')
        }

        // Validate file before processing
        validateImageFile(file, buffer)

        // Process image to WebP
        const processed = await processImageToWebP(buffer)

        // Create image record - always assign to authenticated user
        const imageData: CreateImageInput = {
            blob: processed.buffer,
            size: processed.size,
            mimeType: processed.mimeType,
            width: processed.width,
            height: processed.height,
            visibility: data.visibility ?? 'PUBLIC',
        }

        // Only assign ownerId if user is authenticated
        if (user?.id) {
            imageData.ownerId = user.id
        }

        if (data.description) {
            imageData.description = data.description
        }

        const image = await createImageInDb(imageData)

        return transformImageForApi(image)
    },

    async getImageById(id: string, user?: AuthenticatedUser): Promise<ImageMetadata | null> {
        const image = await findImageMetadataByIdInDb(id)
        if (!image) {
            return null
        }

        // Check permissions using helper
        if (!canViewResource(user, image)) {
            throw err('FORBIDDEN', 'Access denied to this image')
        }

        return transformImageForApi(image)
    },

    async getImageFile(
        id: string,
        user?: AuthenticatedUser
    ): Promise<{ blob: Buffer; mimeType: string; size: number } | null> {
        // First get metadata to check permissions
        const metadata = await findImageMetadataByIdInDb(id)
        if (!metadata) {
            return null
        }

        // Check permissions using helper
        if (!canViewResource(user, metadata)) {
            throw err('FORBIDDEN', 'Access denied to this image')
        }

        // Get blob data
        return findImageBlobByIdInDb(id)
    },

    async updateImage(
        id: string,
        data: UpdateImageInput,
        user?: AuthenticatedUser
    ): Promise<ImageMetadata | null> {
        const existingImage = await findImageMetadataByIdInDb(id)
        if (!existingImage) {
            return null
        }

        // Check permissions using helper
        if (!canModifyResource(user, existingImage)) {
            throw err('FORBIDDEN', 'Access denied to modify this image')
        }

        const updatedImage = await updateImageInDb(id, data)
        if (!updatedImage) {
            return null
        }

        return transformImageForApi(updatedImage)
    },

    async deleteImage(id: string, user?: AuthenticatedUser): Promise<boolean> {
        const existingImage = await findImageMetadataByIdInDb(id)
        if (!existingImage) {
            return false
        }

        // Check permissions using helper
        if (!canModifyResource(user, existingImage)) {
            throw err('FORBIDDEN', 'Access denied to delete this image')
        }

        return deleteImageFromDb(id)
    },

    async listImages(
        params: ListImagesParams,
        user?: AuthenticatedUser
    ): Promise<ListImagesResult> {
        // Build business filters
        const businessFilters: Record<string, unknown> = {}

        if (params.ownerId) businessFilters.ownerId = params.ownerId
        if (params.visibility) businessFilters.visibility = params.visibility
        if (params.user) {
            businessFilters.owner = {
                OR: [
                    { id: params.user },
                    { email: { contains: params.user, mode: 'insensitive' } },
                    { name: { contains: params.user, mode: 'insensitive' } },
                ],
            }
        }

        // Apply security constraints using helper
        const secureFilters = applySecurityFilters(businessFilters, user)

        // Repository call with secure filters
        const rawResult = await listImagesInDb({
            ...params,
            filters: secureFilters,
        })

        // Transform raw data to API format
        return {
            data: rawResult.data.map(item => transformImageForApi(item)),
            pagination: rawResult.pagination,
        }
    },

    async getImageStats(ownerId?: string, user?: AuthenticatedUser): Promise<ImageStats> {
        // Permission checks for stats
        if (ownerId) {
            if (!user || (user.role !== 'ADMIN' && user.id !== ownerId)) {
                throw err('FORBIDDEN', 'Access denied to view these statistics')
            }
        }

        // Non-admin users can only see their own stats
        if (user && user.role !== 'ADMIN' && !ownerId) {
            ownerId = user.id
        }

        return getImageStatsFromDb(ownerId)
    },

    async replaceImageFile(
        id: string,
        file: { mimetype: string; filename?: string },
        buffer: Buffer,
        user?: AuthenticatedUser
    ): Promise<ImageMetadata | null> {
        const existingImage = await findImageMetadataByIdInDb(id)
        if (!existingImage) {
            return null
        }

        // Check permissions using helper
        if (!canModifyResource(user, existingImage)) {
            throw err('FORBIDDEN', 'Access denied to modify this image')
        }

        // Validate and process new image
        validateImageFile(file, buffer)
        const processed = await processImageToWebP(buffer)

        // Update image with new file data
        const updateData: UpdateImageInput = {
            blob: processed.buffer,
            size: processed.size,
            mimeType: processed.mimeType,
            width: processed.width,
            height: processed.height,
        }

        const updatedImage = await updateImageInDb(id, updateData)
        if (!updatedImage) {
            return null
        }

        return transformImageForApi(updatedImage)
    },
} as const
