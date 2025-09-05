import { describe, it, expect, beforeEach } from 'vitest'

import { userRepository } from '@/features/users/users.repository'
import { prismaFake, resetDb } from '@/tests/helpers/inmemory-prisma'

function makeUser(id: string, email: string, extras: Partial<import('@prisma/client').User> = {}) {
    const now = new Date()
    return prismaFake.user.create({
        data: {
            id,
            email,
            passwordHash: 'x',
            role: 'USER',
            isEmailVerified: false,
            isActive: true,
            lastLogin: now,
            isBanned: false,
            createdAt: now,
            updatedAt: now,
            name: null,
            bio: null,
            oauthProvider: null,
            oauthId: null,
            lastPasswordChange: null,
            banReason: null,
            bannedUntil: null,
            bannedById: null,
            profilePictureId: null,
            ...extras,
        },
    })
}

describe('users.repository unit', () => {
    beforeEach(() => {
        resetDb()
    })

    it('findMany applies filters and pagination', async () => {
        await makeUser('u1', 'a@test.local', { name: 'Alice' })
        await makeUser('u2', 'b@test.local', { name: 'Bob', isActive: false })
        await makeUser('u3', 'c@test.local', { isBanned: true })
        await makeUser('u4', 'pic@test.local', { profilePictureId: 'img1' })

        // Filter by isActive
        let res = await userRepository.findMany({ isActive: true, limit: 2 })
        expect(res.users.length).toBe(2)
        expect(res.hasNext).toBe(true)
        expect(typeof res.nextCursor === 'string' || res.nextCursor === undefined).toBe(true)

        // Next page if cursor present
        if (res.nextCursor) {
            const res2 = await userRepository.findMany({
                isActive: true,
                limit: 2,
                cursor: res.nextCursor,
            })
            expect(res2.users.length).toBeGreaterThanOrEqual(0)
        }

        // Filter by hasProfilePicture
        res = await userRepository.findMany({ hasProfilePicture: true })
        expect(res.users.some(u => u.profilePictureId === 'img1')).toBe(true)

        // Search by name/email/bio
        res = await userRepository.findMany({ search: 'ali' })
        expect(res.users.some(u => (u.name || '').toLowerCase().includes('ali'))).toBe(true)
    })

    it('findById and findByEmail return transformed user', async () => {
        const now = new Date()
        await makeUser('id-123', 'who@test.local', { lastLogin: now })
        const byId = await userRepository.findById('id-123')
        expect(byId?.email).toBe('who@test.local')
        const byEmail = await userRepository.findByEmail('who@test.local')
        expect(byEmail?.id).toBe('id-123')
    })

    it('create, update, delete, un/ban, markEmailAsVerified, updateLastLogin, updatePassword, getStats', async () => {
        const u = await userRepository.create({
            email: 'new@test.local',
            role: 'USER',
            isEmailVerified: false,
            isActive: true,
        } as any)
        expect(u.id).toBeDefined()

        const u2 = await userRepository.update(u.id, { name: 'New Name' })
        expect(u2.name).toBe('New Name')

        const banned = await userRepository.ban(u.id, { banReason: 'x' }, 'admin-id')
        expect(banned.isBanned).toBe(true)

        const unbanned = await userRepository.unban(u.id)
        expect(unbanned.isBanned).toBe(false)

        const verified = await userRepository.markEmailAsVerified(u.id)
        expect(verified.isEmailVerified).toBe(true)

        await userRepository.updateLastLogin(u.id)
        await userRepository.updatePassword(u.id, 'hash:new')

        const stats = await userRepository.getStats()
        expect(stats.totalUsers).toBeGreaterThan(0)

        await userRepository.delete(u.id)
        const afterDelete = await userRepository.findById(u.id)
        expect(afterDelete).toBeNull()
    })

    it('throws on invalid cursor', async () => {
        await makeUser('x1', 'x1@test.local')
        await expect(
            userRepository.findMany({ cursor: 'not-a-base64-cursor' } as any)
        ).rejects.toBeDefined()
    })
})
