import {
    userRepository,
    publicUserRepository,
    refreshTokenRepository,
    type CreateUserInput,
    type UpdateUser,
    type BanUser,
    type UserListQuery,
    type ListUsersResult,
    type User,
    type PublicUser,
    type UserStats,
} from './index'

import type { AuthenticatedUser } from '@/features/auth'
import { passwordService } from '@/features/auth/password.service'
import { err } from '@/shared/errors'
import {
    applyUserSecurityFilters,
    canManageUser,
    canModifyResource,
    canViewResource,
} from '@/shared/utils/rbac.helpers'

// Permission helper for viewing user stats
function canViewUserStats(user?: AuthenticatedUser): boolean {
    return user?.role === 'ADMIN' || user?.role === 'MODERATOR'
}

// ===== User Service =====
export const userService = {
    async getById(id: string): Promise<User> {
        const user = await userRepository.findById(id)
        if (!user) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }
        return user
    },

    async getByEmail(email: string): Promise<User | null> {
        return userRepository.findByEmail(email)
    },

    async list(query: UserListQuery, user?: AuthenticatedUser): Promise<ListUsersResult> {
        // Build business filters from query parameters
        const businessFilters: Record<string, unknown> = {}

        if (query.role !== undefined) {
            businessFilters.role = query.role
        }
        if (query.isActive !== undefined) {
            businessFilters.isActive = query.isActive
        }
        if (query.isBanned !== undefined) {
            businessFilters.isBanned = query.isBanned
        }
        if (query.hasProfilePicture !== undefined) {
            if (query.hasProfilePicture) {
                businessFilters.profilePictureId = { not: null }
            } else {
                businessFilters.profilePictureId = null
            }
        }
        if (query.search) {
            businessFilters.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { bio: { contains: query.search, mode: 'insensitive' } },
            ]
        }

        // Apply security filters using helper
        const secureFilters = applyUserSecurityFilters(businessFilters, user)

        const { users, hasNext, nextCursor } = await userRepository.findMany({
            ...query,
            filters: secureFilters,
        })

        return {
            users,
            pagination: {
                hasNext,
                hasPrev: !!query.cursor,
                limit: query.limit ?? 20,
                ...(nextCursor && { nextCursor }),
                ...(query.cursor && { startCursor: query.cursor }),
            },
        }
    },

    async create(data: CreateUserInput): Promise<User> {
        // Check if user with email already exists
        const existingUser = await userRepository.findByEmail(data.email)
        if (existingUser) {
            throw err('EMAIL_ALREADY_EXISTS', 'User with this email already exists')
        }

        // Hash password
        const passwordHash = await passwordService.hashPassword(data.password)

        // Create user
        const userData = {
            email: data.email,
            passwordHash,
            role: data.role ?? 'USER',
            isEmailVerified: data.isEmailVerified ?? false,
            isActive: data.isActive ?? true,
            ...(data.name && { name: data.name }),
            ...(data.bio && { bio: data.bio }),
            ...(data.oauthProvider && { oauthProvider: data.oauthProvider }),
            ...(data.oauthId && { oauthId: data.oauthId }),
            ...(data.lastPasswordChange && { lastPasswordChange: data.lastPasswordChange }),
            ...(data.profilePictureId && { profilePictureId: data.profilePictureId }),
        }

        return userRepository.create(userData)
    },

    async update(id: string, data: UpdateUser, user?: AuthenticatedUser): Promise<User> {
        // Check if user exists
        const existingUser = await userRepository.findById(id)
        if (!existingUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        // Check permissions using standardized RBAC helper
        if (!canModifyResource(user, { ownerId: existingUser.id, ownerRole: existingUser.role })) {
            throw err('FORBIDDEN', 'Access denied to update this user')
        }

        return userRepository.update(id, data)
    },

    async delete(id: string, user?: AuthenticatedUser): Promise<void> {
        // Check if user exists
        const existingUser = await userRepository.findById(id)
        if (!existingUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        // Check permissions using standardized RBAC helper
        if (!canModifyResource(user, { ownerId: existingUser.id, ownerRole: existingUser.role })) {
            throw err('FORBIDDEN', 'Access denied to delete this user')
        }

        // Revoke all refresh tokens before deletion
        await refreshTokenRepository.revokeAllByUserId(id)

        // Delete user
        await userRepository.delete(id)
    },

    async ban(
        id: string,
        banData: BanUser,
        bannedById: string,
        user?: AuthenticatedUser
    ): Promise<User> {
        // Check if user exists
        const existingUser = await userRepository.findById(id)
        if (!existingUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        // Check permissions using standardized RBAC helper
        if (!canManageUser(user, { id: existingUser.id, role: existingUser.role })) {
            throw err('FORBIDDEN', 'Access denied to ban this user')
        }

        // Check if user is already banned
        if (existingUser.isBanned) {
            throw err('RESOURCE_CONFLICT', 'User is already banned')
        }

        // Revoke all refresh tokens when banning
        await refreshTokenRepository.revokeAllByUserId(id)

        return userRepository.ban(id, banData, bannedById)
    },

    async unban(id: string, user?: AuthenticatedUser): Promise<User> {
        // Check if user exists
        const existingUser = await userRepository.findById(id)
        if (!existingUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        // Check permissions using standardized RBAC helper
        if (!canManageUser(user, { id: existingUser.id, role: existingUser.role })) {
            throw err('FORBIDDEN', 'Access denied to unban this user')
        }

        // Check if user is banned
        if (!existingUser.isBanned) {
            throw err('RESOURCE_CONFLICT', 'User is not banned')
        }

        return userRepository.unban(id)
    },

    async getStats(user?: AuthenticatedUser): Promise<UserStats> {
        // Check permissions - only moderators and admins can view stats
        if (!canViewUserStats(user)) {
            throw err('FORBIDDEN', 'Access denied to view user statistics')
        }

        return userRepository.getStats()
    },

    async markEmailAsVerified(id: string): Promise<User> {
        const existingUser = await userRepository.findById(id)
        if (!existingUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        if (existingUser.isEmailVerified) {
            throw err('RESOURCE_CONFLICT', 'Email is already verified')
        }

        return userRepository.markEmailAsVerified(id)
    },

    async updateLastLogin(id: string): Promise<void> {
        await userRepository.updateLastLogin(id)
    },

    async changePassword(
        id: string,
        currentPassword: string,
        newPassword: string,
        user?: AuthenticatedUser
    ): Promise<void> {
        const existingUser = await userRepository.findById(id)
        if (!existingUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        // Check permissions - users can only change their own password
        if (user?.id !== id) {
            throw err('FORBIDDEN', 'Access denied - can only change your own password')
        }

        // Verify current password
        const isValidPassword = await passwordService.verifyPassword(
            existingUser.passwordHash,
            currentPassword
        )
        if (!isValidPassword) {
            throw err('UNAUTHORIZED', 'Current password is incorrect')
        }

        // Hash new password
        const newPasswordHash = await passwordService.hashPassword(newPassword)

        // Update password
        await userRepository.updatePassword(id, newPasswordHash)

        // Revoke all refresh tokens to force re-authentication
        await refreshTokenRepository.revokeAllByUserId(id)
    },
} as const

// ===== Public User Service (safe for API responses) =====
export const publicUserService = {
    async getById(id: string, user?: AuthenticatedUser): Promise<PublicUser> {
        // First, check if the target user exists
        const targetUser = await publicUserRepository.findById(id)
        if (!targetUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        // Apply security constraints using the helper
        const canAccess = canViewResource(user, { ownerId: targetUser.id, visibility: null })
        if (!canAccess) {
            // Conceal existence of users not viewable to caller
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        return targetUser
    },

    async list(
        query: UserListQuery,
        user?: AuthenticatedUser
    ): Promise<{ users: PublicUser[]; pagination: ListUsersResult['pagination'] }> {
        // Check permissions - only admins and moderators can list users
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
            throw err('FORBIDDEN', 'Access denied to list users')
        }

        // Build business filters from query parameters
        const businessFilters: Record<string, unknown> = {}

        if (query.role !== undefined) {
            businessFilters.role = query.role
        }
        if (query.isActive !== undefined) {
            businessFilters.isActive = query.isActive
        }
        if (query.isBanned !== undefined) {
            businessFilters.isBanned = query.isBanned
        }
        if (query.hasProfilePicture !== undefined) {
            if (query.hasProfilePicture) {
                businessFilters.profilePictureId = { not: null }
            } else {
                businessFilters.profilePictureId = null
            }
        }
        if (query.search) {
            businessFilters.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { bio: { contains: query.search, mode: 'insensitive' } },
            ]
        }

        // Apply security filters using helper
        const secureFilters = applyUserSecurityFilters(businessFilters, user)

        const { users, hasNext, nextCursor } = await publicUserRepository.findMany({
            ...query,
            filters: secureFilters,
        })

        return {
            users,
            pagination: {
                hasNext,
                hasPrev: !!query.cursor,
                limit: query.limit ?? 20,
                ...(nextCursor && { nextCursor }),
                ...(query.cursor && { startCursor: query.cursor }),
            },
        }
    },
} as const
