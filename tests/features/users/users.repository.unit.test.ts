import { describe, it, expect } from 'vitest'

import { userRepository } from '@/features/users/users.repository'
import { generateUUIDv7 } from '@/shared/utils'
import { testPrisma } from '@/tests/setup'

function makeUser(id: string, email: string, extras: Partial<import('@prisma/client').User> = {}) {
    const now = new Date()
    return testPrisma.user.create({
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
    it('findMany applies filters and pagination', async () => {
        await makeUser(generateUUIDv7(), 'a@test.local', { name: 'Alice' })
        await makeUser(generateUUIDv7(), 'b@test.local', { name: 'Bob', isActive: false })
        await makeUser(generateUUIDv7(), 'c@test.local', { isBanned: true })

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

        // Filter by processed hasProfilePicture filter (as service would send it)
        res = await userRepository.findMany({
            filters: { profilePictureId: { not: null } },
        })
        expect(res.users.length).toBe(0)

        // Search by name/email/bio using OR condition (as service would send it)
        res = await userRepository.findMany({
            filters: {
                OR: [
                    { name: { contains: 'ali', mode: 'insensitive' } },
                    { email: { contains: 'ali', mode: 'insensitive' } },
                    { bio: { contains: 'ali', mode: 'insensitive' } },
                ],
            },
        })
        expect(res.users.some(u => (u.name || '').toLowerCase().includes('ali'))).toBe(true)
    })

    it('findById and findByEmail return transformed user', async () => {
        const now = new Date()
        const userId = generateUUIDv7()
        await makeUser(userId, 'who@test.local', { lastLogin: now })
        const byId = await userRepository.findById(userId)
        expect(byId?.email).toBe('who@test.local')
        const byEmail = await userRepository.findByEmail('who@test.local')
        expect(byEmail?.id).toBe(userId)
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

        const banned = await userRepository.ban(u.id, { banReason: 'x' }, generateUUIDv7())
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
        await makeUser(generateUUIDv7(), 'x1@test.local')
        await expect(
            userRepository.findMany({ cursor: 'not-a-base64-cursor' } as any)
        ).rejects.toBeDefined()
    })
})
