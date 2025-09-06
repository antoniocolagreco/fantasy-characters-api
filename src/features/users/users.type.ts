import type { Static } from '@sinclair/typebox'

import type {
    BanUserSchema,
    CreateUserRequestSchema,
    CreateUserSchema,
    PublicUserSchema,
    RefreshTokenSchema,
    UpdateUserSchema,
    UserListQuerySchema,
    UserParamsSchema,
    UserSchema,
    UserStatsSchema,
} from './v1/users.http.schema'

import type { RefreshTokenPayload } from '@/features/auth'
import { PaginationSchema } from '@/shared/schemas'

// (moved to top for lint order)

// ===== Domain Types =====
export type User = Static<typeof UserSchema>
export type PublicUser = Static<typeof PublicUserSchema>
export type RefreshToken = Static<typeof RefreshTokenSchema>

// ===== Request Types =====
export type CreateUser = Static<typeof CreateUserSchema>
export type UpdateUser = Static<typeof UpdateUserSchema>
export type BanUser = Static<typeof BanUserSchema>

// ===== Parameter Types =====
export type UserParams = Static<typeof UserParamsSchema>

// ===== Query Types =====
export type UserListQuery = Static<typeof UserListQuerySchema>

// ===== Response Types =====
export type UserStats = Static<typeof UserStatsSchema>

// ===== Repository Types =====
export interface UserRepository {
    findById(id: string): Promise<User | null>
    findByEmail(email: string): Promise<User | null>
    findMany(
        query: UserListQuery
    ): Promise<{ users: User[]; hasNext: boolean; nextCursor?: string }>
    create(data: CreateUser): Promise<User>
    update(id: string, data: UpdateUser): Promise<User>
    delete(id: string): Promise<void>
    ban(id: string, data: BanUser, bannedById: string): Promise<User>
    unban(id: string): Promise<User>
    getStats(): Promise<UserStats>
    markEmailAsVerified(id: string): Promise<User>
    updateLastLogin(id: string): Promise<void>
    updatePassword(id: string, passwordHash: string): Promise<void>
}

export interface RefreshTokenRepository {
    create(data: RefreshTokenPayload): Promise<RefreshToken>
    findByToken(token: string): Promise<RefreshToken | null>
    revokeByToken(token: string): Promise<void>
    revokeAllByUserId(userId: string): Promise<void>
    deleteExpired(): Promise<number>
    findActiveByUserId(userId: string): Promise<RefreshToken[]>
}

// ===== Service Types =====
export type CreateUserInput = Static<typeof CreateUserRequestSchema>

export interface ListUsersResult {
    users: User[]
    pagination: Static<typeof PaginationSchema>
}
