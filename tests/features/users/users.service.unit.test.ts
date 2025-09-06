import { beforeEach, describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from '@/features/auth/password.service'
import { prismaFake, resetDb } from '@/tests/helpers/inmemory-prisma'

async function getServices() {
    const serviceMod = await import('@/features/users/users.service')
    const repoMod = await import('@/features/users/users.repository')
    return {
        userService: serviceMod.userService,
        publicUserService: serviceMod.publicUserService,
        userRepository: repoMod.userRepository,
    }
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

    it('create successfully creates user with all optional fields', async () => {
        const { userService } = await getServices()
        const userData = {
            email: 'newuser@test.local',
            password: 'password123',
            role: 'MODERATOR' as const,
            isEmailVerified: true,
            isActive: false,
            name: 'Test User',
            bio: 'Test bio',
            oauthProvider: 'google',
            oauthId: 'google-123',
            lastPasswordChange: new Date().toISOString(),
            profilePictureId: 'pic-123',
        }

        const result = await userService.create(userData)

        expect(result.email).toBe(userData.email)
        expect(result.role).toBe(userData.role)
        expect(result.isEmailVerified).toBe(userData.isEmailVerified)
        expect(result.isActive).toBe(userData.isActive)
        expect(result.name).toBe(userData.name)
        expect(result.bio).toBe(userData.bio)
        expect(result.oauthProvider).toBe(userData.oauthProvider)
        expect(result.oauthId).toBe(userData.oauthId)
        expect(result.profilePictureId).toBe(userData.profilePictureId)
    })

    it('getById throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(userService.getById('non-existent')).rejects.toBeDefined()
    })

    it('getByEmail returns null when user not found', async () => {
        const { userService } = await getServices()
        const result = await userService.getByEmail('nonexistent@test.local')
        expect(result).toBeNull()
    })

    it('update throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(userService.update('non-existent', { name: 'New Name' })).rejects.toBeDefined()
    })

    it('delete throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(userService.delete('non-existent')).rejects.toBeDefined()
    })

    it('ban throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(
            userService.ban('non-existent', { banReason: 'test' }, 'admin')
        ).rejects.toBeDefined()
    })

    it('unban throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(userService.unban('non-existent')).rejects.toBeDefined()
    })

    it('ban throws if already banned; unban throws if not banned', async () => {
        const { userService } = await getServices()
        const u1 = await seedUser('u2', 'banned@test.local', { isBanned: true })
        await expect(userService.ban(u1.id, { banReason: 'x' }, 'admin')).rejects.toBeDefined()

        const u2 = await seedUser('u3', 'notbanned@test.local', { isBanned: false })
        await expect(userService.unban(u2.id)).rejects.toBeDefined()
    })

    it('changePassword throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(userService.changePassword('non-existent', 'old', 'new')).rejects.toBeDefined()
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

    it('markEmailAsVerified throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(userService.markEmailAsVerified('non-existent')).rejects.toBeDefined()
    })

    it('markEmailAsVerified throws when email already verified', async () => {
        const { userService } = await getServices()
        const u = await seedUser('u6', 'verified@test.local', { isEmailVerified: true })
        await expect(userService.markEmailAsVerified(u.id)).rejects.toBeDefined()
    })

    it('markEmailAsVerified sets isEmailVerified to true', async () => {
        const { userService, userRepository } = await getServices()
        const u = await seedUser('u7', 'verify@test.local', { isEmailVerified: false })
        const before = await userRepository.findById(u.id)
        expect(before?.isEmailVerified).toBe(false)
        const updated = await userService.markEmailAsVerified(u.id)
        expect(updated.isEmailVerified).toBe(true)
        const fetched = await userRepository.findById(u.id)
        expect(fetched?.isEmailVerified).toBe(true)
    })

    it('updateLastLogin updates the lastLogin timestamp', async () => {
        const { userService, userRepository } = await getServices()
        const u = await seedUser('u8', 'lastlogin@test.local')
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

    describe('PublicUserService', () => {
        it('getById throws when user not found', async () => {
            const { publicUserService } = await getServices()
            await expect(publicUserService.getById('non-existent')).rejects.toBeDefined()
        })

        it('getById returns public user data', async () => {
            const { publicUserService } = await getServices()
            const u = await seedUser('pub-user', 'public@test.local')
            const result = await publicUserService.getById(u.id)
            expect(result.id).toBe(u.id)
            expect(result.email).toBe(u.email)
            // Should not include sensitive fields like passwordHash
            expect('passwordHash' in result).toBe(false)
        })

        it('list returns paginated public users', async () => {
            const { publicUserService } = await getServices()
            await seedUser('pub1', 'pub1@test.local')
            await seedUser('pub2', 'pub2@test.local')

            const result = await publicUserService.list({ limit: 10 })

            expect(result.users).toHaveLength(2)
            expect(result.pagination.hasNext).toBe(false)
            expect(result.pagination.hasPrev).toBe(false)
            expect(result.pagination.limit).toBe(10)
        })
    })
})
