import type { Image, Prisma } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

import type {
    CreateImageInput,
    ImageStats,
    ListImagesParams,
    ListImagesResult,
    UpdateImageInput,
} from './images.type'

import { prisma } from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils/uuid'

/**
 * Image repository - handles all database operations for images
 */

export async function createImageInDb(data: CreateImageInput): Promise<Image> {
    const createData: Prisma.ImageCreateInput = {
        id: generateUUIDv7(),
        blob: data.blob,
        size: data.size,
        mimeType: data.mimeType,
        width: data.width,
        height: data.height,
        visibility: data.visibility ?? 'PUBLIC',
        ...(data.description !== undefined && { description: data.description }),
        ...(data.ownerId && {
            owner: {
                connect: { id: data.ownerId },
            },
        }),
    }

    return prisma.image.create({
        data: createData,
    })
}

export async function findImageByIdInDb(id: string): Promise<Image | null> {
    return prisma.image.findUnique({
        where: { id },
    })
}

export async function findImageMetadataByIdInDb(id: string): Promise<Omit<Image, 'blob'> | null> {
    return prisma.image.findUnique({
        where: { id },
        select: {
            id: true,
            description: true,
            size: true,
            mimeType: true,
            width: true,
            height: true,
            ownerId: true,
            visibility: true,
            createdAt: true,
            updatedAt: true,
        },
    })
}

export async function findImageBlobByIdInDb(
    id: string
): Promise<{ blob: Buffer; mimeType: string; size: number } | null> {
    return prisma.image.findUnique({
        where: { id },
        select: {
            blob: true,
            mimeType: true,
            size: true,
        },
    })
}

export async function updateImageInDb(id: string, data: UpdateImageInput): Promise<Image | null> {
    try {
        return await prisma.image.update({
            where: { id },
            data,
        })
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return null
        }
        throw error
    }
}

export async function deleteImageFromDb(id: string): Promise<boolean> {
    try {
        await prisma.image.delete({
            where: { id },
        })
        return true
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return false
        }
        throw error
    }
}

export async function listImagesInDb(params: ListImagesParams): Promise<ListImagesResult> {
    const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc' } = params

    // Build where clause manually for type safety
    const where: Prisma.ImageWhereInput = {}

    if (params.ownerId) where.ownerId = params.ownerId
    if (params.visibility) where.visibility = params.visibility
    if (params.mimeType) where.mimeType = params.mimeType

    if (params.minWidth || params.maxWidth) {
        where.width = {
            ...(params.minWidth && { gte: params.minWidth }),
            ...(params.maxWidth && { lte: params.maxWidth }),
        }
    }

    if (params.minHeight || params.maxHeight) {
        where.height = {
            ...(params.minHeight && { gte: params.minHeight }),
            ...(params.maxHeight && { lte: params.maxHeight }),
        }
    }

    if (params.search) {
        where.description = {
            contains: params.search,
            mode: 'insensitive',
        }
    }

    // Apply cursor pagination manually
    if (cursor) {
        try {
            const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString()) as {
                lastValue: unknown
                lastId: string
            }
            const { lastValue, lastId } = decoded
            const op = sortDir === 'desc' ? 'lt' : 'gt'

            where.OR = [
                { [sortBy]: { [op]: lastValue } },
                { [sortBy]: lastValue, id: { [op]: lastId } },
            ]
        } catch {
            // Invalid cursor, ignore
        }
    }

    // Execute query (excluding blob for list operations)
    const items = await prisma.image.findMany({
        where,
        orderBy: [{ [sortBy]: sortDir }, { id: sortDir }],
        take: limit + 1,
        select: {
            id: true,
            description: true,
            size: true,
            mimeType: true,
            width: true,
            height: true,
            ownerId: true,
            visibility: true,
            createdAt: true,
            updatedAt: true,
        },
    })

    // Build pagination response
    const hasNext = items.length > limit
    const finalItems = hasNext ? items.slice(0, limit) : items

    let nextCursor: string | undefined
    if (hasNext && finalItems.length > 0) {
        const lastItem = finalItems[finalItems.length - 1]
        if (lastItem) {
            nextCursor = Buffer.from(
                JSON.stringify({
                    lastValue: lastItem[sortBy as keyof typeof lastItem],
                    lastId: lastItem.id,
                })
            ).toString('base64')
        }
    }

    return {
        data: finalItems.map(item => ({
            id: item.id,
            description: item.description || undefined,
            size: item.size,
            mimeType: item.mimeType,
            width: item.width,
            height: item.height,
            ownerId: item.ownerId || undefined,
            visibility: item.visibility as 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
        })) as ListImagesResult['data'],
        pagination: {
            limit,
            hasNext,
            hasPrev: !!cursor,
            ...(nextCursor && { endCursor: nextCursor }),
            ...(cursor && { startCursor: cursor }),
        },
    }
}

export async function getImageStatsFromDb(ownerId?: string): Promise<ImageStats> {
    const where: Prisma.ImageWhereInput = ownerId ? { ownerId } : {}

    // Get total counts and aggregates
    const [totalCount, visibilityStats, mimeTypeStats, sizeStats] = await Promise.all([
        // Total count
        prisma.image.count({ where }),

        // Count by visibility
        prisma.image.groupBy({
            by: ['visibility'],
            where,
            _count: true,
        }),

        // Count by MIME type
        prisma.image.groupBy({
            by: ['mimeType'],
            where,
            _count: true,
        }),

        // Size and dimension aggregates
        prisma.image.aggregate({
            where,
            _sum: { size: true },
            _avg: { size: true, width: true, height: true },
        }),
    ])

    // Transform visibility stats
    const byVisibility = {
        PUBLIC: 0,
        PRIVATE: 0,
        HIDDEN: 0,
    }

    for (const stat of visibilityStats) {
        byVisibility[stat.visibility as keyof typeof byVisibility] = stat._count
    }

    // Transform MIME type stats
    const byMimeType: Record<string, number> = {}
    for (const stat of mimeTypeStats) {
        byMimeType[stat.mimeType] = stat._count
    }

    return {
        total: totalCount,
        byVisibility,
        byMimeType,
        totalSize: sizeStats._sum.size ?? 0,
        averageSize: sizeStats._avg.size ?? 0,
        averageWidth: sizeStats._avg.width ?? 0,
        averageHeight: sizeStats._avg.height ?? 0,
    }
}
