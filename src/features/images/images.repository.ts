import type { Image, Prisma } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

import type {
    CreateImageInput,
    ImageStats,
    ListImagesParams,
    RawImageListResult,
    UpdateImageInput,
} from './images.type'

import { prisma } from '@/infrastructure/database/prisma.service'
import {
    applyCursor,
    applyCursorByPath,
    buildOrderBy,
    buildOrderByPath,
    buildPagination,
    buildPaginationWith,
} from '@/shared/utils/query.helper'
import { generateUUIDv7 } from '@/shared/utils/uuid'

/**
 * Image repository - handles all database operations for images
 * Following new RBAC architecture: Repository accepts pre-built filters from service.
 */

export async function createImageInDb(data: CreateImageInput): Promise<Image> {
    const createData: Prisma.ImageCreateInput = {
        id: generateUUIDv7(),
        blob: data.blob,
        size: data.size,
        mimeType: data.mimeType,
        width: data.width,
        height: data.height,
        visibility: (data.visibility ?? 'PUBLIC') as 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
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
    const row = await prisma.image.findUnique({
        where: { id },
        select: {
            blob: true,
            mimeType: true,
            size: true,
        },
    })

    if (!row) return null

    // Prisma may return Uint8Array for bytes; convert to Buffer for downstream code
    const blob = Buffer.isBuffer(row.blob)
        ? (row.blob as Buffer)
        : Buffer.from(row.blob as unknown as Uint8Array)

    return { blob, mimeType: row.mimeType, size: row.size }
}

export async function updateImageInDb(id: string, data: UpdateImageInput): Promise<Image | null> {
    try {
        // Remove ownerId from update data as it's a relation field
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ownerId, ...updateData } = data
        return await prisma.image.update({
            where: { id },
            data: updateData as Prisma.ImageUpdateInput,
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

export async function listImagesInDb(
    params: ListImagesParams & { filters?: Record<string, unknown> }
): Promise<RawImageListResult> {
    const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc', filters } = params

    // Use pre-built filters from service if provided, otherwise build basic ones
    let where: Prisma.ImageWhereInput

    if (filters) {
        // Filters come pre-secured from service layer
        where = filters as Prisma.ImageWhereInput
    } else {
        // Fallback for direct repository usage (should not happen in production)
        where = {}
        if (params.ownerId) where.ownerId = params.ownerId
        if (params.visibility)
            where.visibility = params.visibility as 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
        if (params.user) {
            where.owner = {
                OR: [
                    { id: params.user },
                    { email: { contains: params.user, mode: 'insensitive' } },
                    { name: { contains: params.user, mode: 'insensitive' } },
                ],
            }
        }
    }

    // Apply cursor pagination using shared helpers
    if (cursor) {
        try {
            where =
                sortBy === 'email'
                    ? (applyCursorByPath(
                          where,
                          cursor,
                          'owner.email',
                          sortDir
                      ) as Prisma.ImageWhereInput)
                    : (applyCursor(
                          where,
                          cursor,
                          sortBy as keyof Prisma.ImageWhereInput,
                          sortDir
                      ) as Prisma.ImageWhereInput)
        } catch {
            // Preserve legacy behavior: ignore invalid cursor for images list
        }
    }

    // Execute query (excluding blob for list operations)
    const items = await prisma.image.findMany({
        where,
        orderBy:
            sortBy === 'email'
                ? (buildOrderByPath(
                      'owner.email',
                      sortDir
                  ) as Prisma.ImageOrderByWithRelationInput[])
                : (buildOrderBy(sortBy, sortDir) as Prisma.ImageOrderByWithRelationInput[]),
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
            ...(sortBy === 'email' && {
                owner: {
                    select: {
                        email: true,
                    },
                },
            }),
        },
    })

    // Build pagination response using shared helpers
    if (sortBy === 'email') {
        const {
            items: trimmed,
            hasNext,
            nextCursor,
        } = buildPaginationWith(
            items,
            limit,
            (it: (typeof items)[number]) =>
                (it as { owner?: { email?: string } | null }).owner?.email
        )
        return {
            data: trimmed as unknown as Omit<Image, 'blob'>[],
            pagination: {
                limit,
                hasNext,
                hasPrev: Boolean(cursor),
                ...(nextCursor && { nextCursor }),
                ...(cursor && { prevCursor: cursor }),
            },
        }
    }

    const {
        items: trimmed,
        hasNext,
        nextCursor,
    } = buildPagination(items, limit, sortBy as keyof (typeof items)[number])
    return {
        data: trimmed,
        pagination: {
            limit,
            hasNext,
            hasPrev: Boolean(cursor),
            ...(nextCursor && { nextCursor }),
            ...(cursor && { prevCursor: cursor }),
        },
    }
}

export async function getImageStatsFromDb(ownerId?: string): Promise<ImageStats> {
    const where: Prisma.ImageWhereInput = ownerId ? { ownerId } : {}

    // Get total counts and aggregates
    const [totalCount, visibilityStats, sizeStats] = await Promise.all([
        // Total count
        prisma.image.count({ where }),

        // Count by visibility
        prisma.image.groupBy({
            by: ['visibility'],
            where,
            _count: true,
        }),

        // Size aggregates
        prisma.image.aggregate({
            where,
            _sum: { size: true },
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

    return {
        total: totalCount,
        byVisibility,
        totalSize: sizeStats._sum.size ?? 0,
    }
}
