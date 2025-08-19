import sharp from 'sharp'
import { Prisma, Visibility } from '@prisma/client'
import { db } from '../shared/database/index.js'
import { createNotFoundError, createValidationError } from '../shared/errors.js'
import { IMAGE, CONTENT_TYPES } from '../shared/constants.js'
import {
  rbacService,
  type AuthUser,
  enforceAuthentication,
  enforcePermission,
} from '../shared/rbac.service.js'
import type {
  ImageCreateData,
  ImageResponse,
  ImageStatsData,
  ImageBinaryData,
} from './image.types.js'

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

// Type for selected image fields (without blob for performance)
type ImageWithoutBlob = {
  id: string
  description: string | null
  filename: string
  size: number
  mimeType: string
  width: number
  height: number
  ownerId: string | null
  visibility: Visibility
  createdAt: Date
  updatedAt: Date
}

const transformImageToResponse = (
  image: Prisma.ImageGetPayload<{}> | ImageWithoutBlob,
): ImageResponse => {
  const response: ImageResponse = {
    id: image.id,
    filename: image.filename,
    size: image.size,
    mimeType: image.mimeType,
    width: image.width,
    height: image.height,
    createdAt: image.createdAt.toISOString(),
    updatedAt: image.updatedAt.toISOString(),
  }

  if (image.description !== null) {
    response.description = image.description
  }

  if (image.ownerId !== null) {
    response.ownerId = image.ownerId
  }

  return response
}

// Service functions
export const createImage = async (
  data: ImageCreateData,
  currentUser?: AuthUser,
): Promise<ImageResponse> => {
  const { file, filename, mimeType, description, ownerId } = data

  // RBAC: Enforce authentication
  enforceAuthentication(currentUser ?? null)

  // RBAC: Check if user can create for the target owner
  if (ownerId && currentUser) {
    enforcePermission(
      rbacService.canCreateForUser(currentUser, ownerId),
      'You can only create images for yourself',
    )
  }

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
      ...(ownerId && { ownerId: ownerId }),
    },
  })

  return transformImageToResponse(image)
}

export const findImageById = async (id: string, currentUser?: AuthUser): Promise<ImageResponse> => {
  const image = await db.image.findUnique({
    where: { id },
  })

  if (!image) {
    throw createNotFoundError('Image')
  }

  // RBAC: Check if user can access this image based on visibility
  enforcePermission(
    rbacService.canAccessByVisibility(currentUser ?? null, image),
    'You do not have permission to access this image',
  )

  return transformImageToResponse(image)
}

export const getImageBinaryData = async (
  id: string,
  currentUser?: AuthUser,
): Promise<ImageBinaryData> => {
  const image = await db.image.findUnique({
    where: { id },
    select: {
      blob: true,
      mimeType: true,
      size: true,
      filename: true,
      ownerId: true,
      visibility: true,
    },
  })

  if (!image) {
    throw createNotFoundError('Image')
  }

  // RBAC: Check if user can access this image based on visibility
  enforcePermission(
    rbacService.canAccessByVisibility(currentUser ?? null, image),
    'You do not have permission to access this image',
  )

  return {
    blob: Buffer.from(image.blob),
    mimeType: image.mimeType,
    size: image.size,
    filename: image.filename,
  }
}

export const getImagesList = async (
  options: {
    page?: number
    limit?: number
    search?: string
    ownerId?: string
  },
  currentUser?: AuthUser,
): Promise<{
  images: ImageResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> => {
  const { page = 1, limit = 10, search, ownerId } = options

  const skip = (page - 1) * limit

  // Build where clause with RBAC filtering
  const baseFilter = rbacService.getOwnershipFilter(currentUser ?? null)
  const where: Prisma.ImageWhereInput = {
    ...baseFilter,
  }

  const andConditions: Prisma.ImageWhereInput[] = []

  if (search) {
    andConditions.push({
      OR: [{ filename: { contains: search } }, { description: { contains: search } }],
    })
  }

  if (ownerId) {
    // RBAC: Check if user can access other user's images
    if (currentUser) {
      enforcePermission(
        rbacService.canAccessUserProfile(currentUser, ownerId),
        'You cannot access images from this user',
      )
    }
    andConditions.push({ ownerId })
  }

  if (andConditions.length > 0) {
    where.AND = andConditions
  }

  // Get total count and images
  const [total, images] = await Promise.all([
    db.image.count({ where }),
    db.image.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        description: true,
        filename: true,
        size: true,
        mimeType: true,
        width: true,
        height: true,
        ownerId: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
        // Exclude blob data for performance
      },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    images: images.map(image => transformImageToResponse(image)),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

export const getImageStats = async (currentUser?: AuthUser): Promise<ImageStatsData> => {
  // RBAC: Only moderators and admins can view statistics
  enforcePermission(
    rbacService.canViewStatistics(currentUser ?? null),
    'You do not have permission to view image statistics',
  )

  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Apply RBAC filtering to statistics
  const baseFilter = rbacService.getOwnershipFilter(currentUser ?? null)

  // Get basic statistics
  const [totalImages, totalSizeResult, mimeTypeStats, recent24h, recent7d, recent30d] =
    await Promise.all([
      db.image.count({ where: baseFilter }),
      db.image.aggregate({
        where: baseFilter,
        _sum: { size: true },
        _avg: { size: true },
      }),
      db.image.groupBy({
        where: baseFilter,
        by: ['mimeType'],
        _count: { _all: true },
      }),
      db.image.count({
        where: { ...baseFilter, createdAt: { gte: last24Hours } },
      }),
      db.image.count({
        where: { ...baseFilter, createdAt: { gte: last7Days } },
      }),
      db.image.count({
        where: { ...baseFilter, createdAt: { gte: last30Days } },
      }),
    ])

  const totalSize = totalSizeResult._sum.size || 0
  const averageSize = totalSizeResult._avg.size || 0

  // Transform mime type stats
  const byMimeType: Record<string, number> = {}
  mimeTypeStats.forEach(stat => {
    byMimeType[stat.mimeType] = stat._count._all
  })

  return {
    totalImages,
    totalSize,
    averageSize,
    byMimeType,
    recentUploads: {
      last24Hours: recent24h,
      last7Days: recent7d,
      last30Days: recent30d,
    },
  }
}

export const deleteImage = async (id: string, currentUser?: AuthUser): Promise<void> => {
  // First, get the image to check ownership and permissions
  const image = await db.image.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      visibility: true,
    },
  })

  if (!image) {
    throw createNotFoundError('Image')
  }

  // RBAC: Check if user can delete this image
  enforcePermission(
    rbacService.canDeleteResource(currentUser ?? null, image),
    'You do not have permission to delete this image',
  )

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

export const updateImage = async (
  id: string,
  updateData: Partial<{
    description: string
    visibility: 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
  }>,
  currentUser?: AuthUser,
): Promise<ImageResponse | null> => {
  // First, get the image to check ownership and permissions
  const image = await db.image.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      visibility: true,
    },
  })

  if (!image) {
    throw createNotFoundError('Image')
  }

  // RBAC: Check if user can modify this image
  enforcePermission(
    rbacService.canModifyResource(currentUser ?? null, image),
    'You do not have permission to modify this image',
  )

  try {
    const updatedImage = await db.image.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        description: true,
        filename: true,
        mimeType: true,
        size: true,
        width: true,
        height: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return transformImageToResponse(updatedImage)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw createNotFoundError('Image')
    }
    throw error
  }
}
