import sharp from 'sharp'
import { Prisma } from '@prisma/client'
import { db } from '../shared/database/index.js'
import { createNotFoundError, createValidationError } from '../shared/errors.js'
import { IMAGE, CONTENT_TYPES } from '../shared/constants.js'

// Types
export type ImageCreateData = {
  file: Buffer
  filename: string
  mimeType: string
  description?: string | undefined
  uploadedById?: string | undefined
}

export type ImageResponse = {
  id: string
  description: string | null
  filename: string
  size: number
  mimeType: string
  width: number
  height: number
  uploadedById: string | null
  createdAt: Date
  updatedAt: Date
}

// Utility functions
const validateImageFile = (file: Buffer, mimeType: string): void => {
  if (!IMAGE.ALLOWED_TYPES.includes(mimeType as (typeof IMAGE.ALLOWED_TYPES)[number])) {
    throw createValidationError(
      `Invalid file type. Allowed types: ${IMAGE.ALLOWED_TYPES.join(', ')}`,
    )
  }

  if (file.length > IMAGE.MAX_SIZE) {
    throw createValidationError(
      `File too large. Maximum size is ${IMAGE.MAX_SIZE / (1024 * 1024)}MB`,
    )
  }
}

const processImage = async (
  inputBuffer: Buffer,
  mimeType: string,
): Promise<{ buffer: Buffer; width: number; height: number }> => {
  try {
    // Validate file before processing
    validateImageFile(inputBuffer, mimeType)

    // Process image with Sharp
    const image = sharp(inputBuffer)
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) {
      throw createValidationError('Invalid image: Unable to read dimensions')
    }

    // Resize if needed while maintaining aspect ratio
    let processedImage = image
    if (metadata.width > IMAGE.MAX_WIDTH || metadata.height > IMAGE.MAX_HEIGHT) {
      processedImage = image.resize(IMAGE.MAX_WIDTH, IMAGE.MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: false,
      })
    }

    // Convert to WebP
    const buffer = await processedImage.webp({ quality: IMAGE.QUALITY }).toBuffer()

    // Get final dimensions
    const finalMetadata = await sharp(buffer).metadata()

    if (!finalMetadata.width || !finalMetadata.height) {
      throw createValidationError('Failed to get final image dimensions')
    }

    return {
      buffer,
      width: finalMetadata.width,
      height: finalMetadata.height,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw error
    }
    throw createValidationError(
      `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

const transformImageToResponse = (image: Prisma.ImageGetPayload<{}>): ImageResponse => ({
  id: image.id,
  description: image.description,
  filename: image.filename,
  size: image.size,
  mimeType: image.mimeType,
  width: image.width,
  height: image.height,
  uploadedById: image.uploadedById,
  createdAt: image.createdAt,
  updatedAt: image.updatedAt,
})

// Service functions
export const createImage = async (data: ImageCreateData): Promise<ImageResponse> => {
  const { file, filename, mimeType, description, uploadedById } = data

  // Process the image
  const { buffer, width, height } = await processImage(file, mimeType)

  // Create the image record
  const image = await db.image.create({
    data: {
      blob: buffer,
      description: description?.trim() || null,
      filename: filename.trim(),
      size: buffer.length,
      mimeType: CONTENT_TYPES.IMAGE_WEBP,
      width,
      height,
      ...(uploadedById && { uploadedById }),
    },
  })

  return transformImageToResponse(image)
}

export const findImageById = async (id: string): Promise<ImageResponse> => {
  const image = await db.image.findUnique({
    where: { id },
  })

  if (!image) {
    throw createNotFoundError('Image')
  }

  return transformImageToResponse(image)
}

export const deleteImage = async (id: string): Promise<void> => {
  try {
    await db.image.delete({
      where: { id },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw createNotFoundError('Image')
    }
    throw error
  }
}

// Check if user can access image (for authorization)
export const canUserAccessImage = async (imageId: string, userId: string): Promise<boolean> => {
  const image = await db.image.findUnique({
    where: { id: imageId },
    select: { uploadedById: true },
  })

  if (!image) {
    return false
  }

  // If no uploader is set, anyone can access
  if (!image.uploadedById) {
    return true
  }

  // Only the uploader can access their own images
  return image.uploadedById === userId
}
