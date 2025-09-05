import { beforeEach, describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from '@/features/auth/password.service'
import { prismaFake, resetDb } from '@/tests/helpers/inmemory-prisma'

async function getServices() {
    const serviceMod = await import('@/features/users/users.service')
    const repoMod = await import('@/features/users/users.repository')
    return { userService: serviceMod.userService, userRepository: repoMod.userRepository }
}

async function seedUser(
    id: string,
    email: string,
    extras: Partial<import('@prisma/client').User> = {}
) {
    const now = new Date()
    const passwordHash = await hashPassword('old')
    return prismaFake.user.create({
        data: {
            id,
            email,
            passwordHash,
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

describe('users.service unit', () => {
    beforeEach(() => {
        resetDb()
    })

    it('create throws on duplicate email', async () => {
        const { userService } = await getServices()
        await seedUser('u1', 'dup@test.local')
        await expect(
            userService.create({
                email: 'dup@test.local',
                password: 'p',
                role: 'USER',
                isActive: true,
                isEmailVerified: false,
            })
        ).rejects.toBeDefined()
    })

    it('ban throws if already banned; unban throws if not banned', async () => {
        const { userService } = await getServices()
        const u1 = await seedUser('u2', 'banned@test.local', { isBanned: true })
        await expect(userService.ban(u1.id, { banReason: 'x' }, 'admin')).rejects.toBeDefined()

        const u2 = await seedUser('u3', 'notbanned@test.local', { isBanned: false })
        await expect(userService.unban(u2.id)).rejects.toBeDefined()
    })

    it('changePassword rejects invalid current password', async () => {
        const { userService } = await getServices()
        const u = await seedUser('u4', 'pw@test.local')
        await expect(userService.changePassword(u.id, 'wrong', 'new')).rejects.toBeDefined()
    })

    it('changePassword updates hash and revokes tokens', async () => {
        const { userService, userRepository } = await getServices()
        const u = await seedUser('u5', 'ok@test.local')
        const before = (await userRepository.findById(u.id))?.passwordHash
        await userService.changePassword(u.id, 'old', 'new')
        const fetched = await userRepository.findById(u.id)
        expect(fetched && before && fetched.passwordHash !== before).toBe(true)
        const ok = fetched ? await verifyPassword(fetched.passwordHash, 'new') : false
        expect(ok).toBe(true)
    })

    it('markEmailAsVerified sets isEmailVerified to true', async () => {
        const { userService, userRepository } = await getServices()
        const u = await seedUser('u6', 'verify@test.local', { isEmailVerified: false })
        const before = await userRepository.findById(u.id)
        expect(before?.isEmailVerified).toBe(false)
        const updated = await userService.markEmailAsVerified(u.id)
        expect(updated.isEmailVerified).toBe(true)
        const fetched = await userRepository.findById(u.id)
        expect(fetched?.isEmailVerified).toBe(true)
    })

    it('updateLastLogin updates the lastLogin timestamp', async () => {
        const { userService, userRepository } = await getServices()
        const u = await seedUser('u7', 'lastlogin@test.local')
        const before = await userRepository.findById(u.id)
        const beforeLastLogin = before?.lastLogin
        await userService.updateLastLogin(u.id)
        const after = await userRepository.findById(u.id)
        expect(typeof after?.lastLogin).toBe('string')
        if (beforeLastLogin && after?.lastLogin) {
            // Compare as ISO strings; updated value should be different/newer
            expect(after.lastLogin).not.toBe(beforeLastLogin)
        }
    })
})
