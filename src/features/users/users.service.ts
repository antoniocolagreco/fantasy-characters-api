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

import { hashPassword, verifyPassword } from '@/features/auth/password.service'
import { err } from '@/shared/errors'

// (moved above for lint order)

// ===== User Service =====
export class UserService {
    async getById(id: string): Promise<User> {
        const user = await userRepository.findById(id)
        if (!user) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }
        return user
    }

    async getByEmail(email: string): Promise<User | null> {
        return userRepository.findByEmail(email)
    }

    async list(query: UserListQuery): Promise<ListUsersResult> {
        const { users, hasNext, nextCursor } = await userRepository.findMany(query)

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
    }

    async create(data: CreateUserInput): Promise<User> {
        // Check if user with email already exists
        const existingUser = await userRepository.findByEmail(data.email)
        if (existingUser) {
            throw err('EMAIL_ALREADY_EXISTS', 'User with this email already exists')
        }

        // Hash password
        const passwordHash = await hashPassword(data.password)

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
    }

    async update(id: string, data: UpdateUser): Promise<User> {
        // Check if user exists
        const existingUser = await userRepository.findById(id)
        if (!existingUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        // UpdateUser doesn't include email changes - that would be a separate endpoint

        return userRepository.update(id, data)
    }

    async delete(id: string): Promise<void> {
        // Check if user exists
        const existingUser = await userRepository.findById(id)
        if (!existingUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        // Revoke all refresh tokens before deletion
        await refreshTokenRepository.revokeAllByUserId(id)

        // Delete user
        await userRepository.delete(id)
    }

    async ban(id: string, banData: BanUser, bannedById: string): Promise<User> {
        // Check if user exists
        const existingUser = await userRepository.findById(id)
        if (!existingUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        // Check if user is already banned
        if (existingUser.isBanned) {
            throw err('RESOURCE_CONFLICT', 'User is already banned')
        }

        // Revoke all refresh tokens when banning
        await refreshTokenRepository.revokeAllByUserId(id)

        return userRepository.ban(id, banData, bannedById)
    }

    async unban(id: string): Promise<User> {
        // Check if user exists
        const existingUser = await userRepository.findById(id)
        if (!existingUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        // Check if user is banned
        if (!existingUser.isBanned) {
            throw err('RESOURCE_CONFLICT', 'User is not banned')
        }

        return userRepository.unban(id)
    }

    async getStats(): Promise<UserStats> {
        return userRepository.getStats()
    }

    async markEmailAsVerified(id: string): Promise<User> {
        const existingUser = await userRepository.findById(id)
        if (!existingUser) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        if (existingUser.isEmailVerified) {
            throw err('RESOURCE_CONFLICT', 'Email is already verified')
        }

        return userRepository.markEmailAsVerified(id)
    }

    async updateLastLogin(id: string): Promise<void> {
        await userRepository.updateLastLogin(id)
    }

    async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await userRepository.findById(id)
        if (!user) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }

        // Verify current password
        const isValidPassword = await verifyPassword(user.passwordHash, currentPassword)
        if (!isValidPassword) {
            throw err('UNAUTHORIZED', 'Current password is incorrect')
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword)

        // Update password
        await userRepository.updatePassword(id, newPasswordHash)

        // Revoke all refresh tokens to force re-authentication
        await refreshTokenRepository.revokeAllByUserId(id)
    }
}

// ===== Public User Service (safe for API responses) =====
export class PublicUserService {
    async getById(id: string): Promise<PublicUser> {
        const user = await publicUserRepository.findById(id)
        if (!user) {
            throw err('RESOURCE_NOT_FOUND', 'User not found')
        }
        return user
    }

    async list(
        query: UserListQuery
    ): Promise<{ users: PublicUser[]; pagination: ListUsersResult['pagination'] }> {
        const { users, hasNext, nextCursor } = await publicUserRepository.findMany(query)

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
    }
}

// ===== Singleton Export =====
export const userService = new UserService()
export const publicUserService = new PublicUserService()
