/**
 * User Service
 *
 * This service handles all user-related business logic and database operations.
 * It follows the established patterns from Chapter 3 infrastructure.
 */

import { PrismaClient, User, Role } from '@prisma/client'
import { ValidationError, NotFoundError, DuplicateResourceError } from '../types/errors.js'
import { validateUuid, validateEmail, validateAndSanitizePagination } from '../utils/validation.js'
import type {
    UserCreateRequest,
    UserUpdateRequest,
    UserResponse,
    UserWithStats,
    UserListQuery
} from '../schemas/user.js'
import type { Pagination } from '../schemas/api.js'

export class UserService {
    constructor(private readonly prisma: PrismaClient) {}

    /**
     * Creates a new user
     */
    async create(data: UserCreateRequest): Promise<UserResponse> {
        // Validate email format
        if (!validateEmail(data.email)) {
            throw new ValidationError('Invalid email format')
        }

        // Validate optional fields
        if (data.displayName && data.displayName.length > 100) {
            throw new ValidationError('Display name must be 100 characters or less')
        }

        if (data.bio && data.bio.length > 1000) {
            throw new ValidationError('Bio must be 1000 characters or less')
        }

        try {
            // Generate a temporary password hash for simplicity (will be replaced in auth chapter)
            const passwordHash = '$2b$12$placeholder.hash.for.development.only'

            const user = await this.prisma.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    displayName: data.displayName || null,
                    bio: data.bio || null,
                    role: data.role ? (data.role as Role) : Role.USER
                }
            })

            return this.transformToResponse(user)
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
                const prismaError = error as { meta?: { target?: string[] } }
                if (prismaError.meta?.target?.includes('email')) {
                    throw new DuplicateResourceError('User', 'email', data.email)
                }
            }
            throw error
        }
    }

    /**
     * Finds a user by ID
     */
    async findById(id: string): Promise<UserResponse | null> {
        if (!validateUuid(id)) {
            throw new ValidationError('Invalid user ID format')
        }

        const user = await this.prisma.user.findUnique({
            where: { id }
        })

        return user ? this.transformToResponse(user) : null
    }

    /**
     * Finds a user by ID or throws NotFoundError
     */
    async findByIdOrThrow(id: string): Promise<UserResponse> {
        const user = await this.findById(id)
        if (!user) {
            throw new NotFoundError('User', id)
        }
        return user
    }

    /**
     * Finds a user by email
     */
    async findByEmail(email: string): Promise<UserResponse | null> {
        const user = await this.prisma.user.findUnique({
            where: { email }
        })

        return user ? this.transformToResponse(user) : null
    }

    /**
     * Finds multiple users with pagination and filtering
     */
    async findMany(query: UserListQuery): Promise<{
        data: UserResponse[]
        pagination: Pagination
    }> {
        const { page, limit } = validateAndSanitizePagination(query.page, query.limit)

        // Build where clause
        const where: Record<string, unknown> = {}

        if (query.role) {
            where.role = query.role as Role
        }

        if (query.isActive !== undefined) {
            where.isActive = query.isActive
        }

        if (query.isEmailVerified !== undefined) {
            where.isEmailVerified = query.isEmailVerified
        }

        if (query.search) {
            where.OR = [{ email: { contains: query.search } }, { displayName: { contains: query.search } }]
        }

        // Build order by clause
        let orderBy: Record<string, string> = { createdAt: 'desc' } // Default sort

        if (query.sortBy) {
            const sortOrder = query.sortOrder || 'asc'
            orderBy = { [query.sortBy]: sortOrder }
        }

        // Execute queries
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit
            }),
            this.prisma.user.count({ where })
        ])

        const totalPages = Math.ceil(total / limit)

        return {
            data: users.map((user) => this.transformToResponse(user)),
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        }
    }

    /**
     * Updates a user
     */
    async update(id: string, data: UserUpdateRequest): Promise<UserResponse> {
        if (!validateUuid(id)) {
            throw new ValidationError('Invalid user ID format')
        }

        // Validate optional fields
        if (data.displayName && data.displayName.length > 100) {
            throw new ValidationError('Display name must be 100 characters or less')
        }

        if (data.bio && data.bio.length > 1000) {
            throw new ValidationError('Bio must be 1000 characters or less')
        }

        try {
            const updateData: Record<string, unknown> = {}

            if (data.displayName !== undefined) {
                updateData.displayName = data.displayName || null
            }

            if (data.bio !== undefined) {
                updateData.bio = data.bio || null
            }

            if (data.isActive !== undefined) {
                updateData.isActive = data.isActive
            }

            if (data.isEmailVerified !== undefined) {
                updateData.isEmailVerified = data.isEmailVerified
            }

            if (data.role !== undefined) {
                updateData.role = data.role as Role
            }

            const user = await this.prisma.user.update({
                where: { id },
                data: updateData
            })

            return this.transformToResponse(user)
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
                throw new NotFoundError('User', id)
            }
            throw error
        }
    }

    /**
     * Deletes a user
     */
    async delete(id: string): Promise<void> {
        if (!validateUuid(id)) {
            throw new ValidationError('Invalid user ID format')
        }

        try {
            await this.prisma.user.delete({
                where: { id }
            })
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
                throw new NotFoundError('User', id)
            }
            throw error
        }
    }

    /**
     * Gets a user with statistics
     */
    async getUserWithStats(id: string): Promise<UserWithStats> {
        const user = await this.findByIdOrThrow(id)

        // Get related counts
        const [totalCharacters, totalImages, totalItems, totalTags] = await Promise.all([
            this.prisma.character.count({ where: { userId: id } }),
            this.prisma.image.count({ where: { uploadedById: id } }),
            this.prisma.item.count({ where: { userId: id } }),
            this.prisma.tag.count({ where: { createdById: id } })
        ])

        return {
            ...user,
            stats: {
                totalCharacters,
                totalImages,
                totalItems,
                totalTags
            }
        }
    }

    /**
     * Transforms a Prisma User to UserResponse (excludes sensitive data)
     */
    transformToResponse(user: User): UserResponse {
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            bio: user.bio,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            profilePictureId: user.profilePictureId,
            lastLogin: user.lastLogin instanceof Date ? user.lastLogin.toISOString() : user.lastLogin,
            createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
            updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt
        }
    }
}
