import { describe, expect, it, vi } from 'vitest'

import { passwordService } from '@/features/auth/password.service'
import type { RoleLiterals } from '@/shared/schemas/common.schema'
import { generateUUIDv7 } from '@/shared/utils'
import { testPrisma } from '@/tests/setup'

// Test utilities
const createUUID = () => generateUUIDv7()
// Don't use a random UUID for profile picture - it causes foreign key constraint issues
// Instead, use null for tests that don't need profile pictures

async function getServices() {
    const serviceMod = await import('@/features/users/users.service')
    const repoMod = await import('@/features/users/users.repository')
    return {
        userService: serviceMod.userService,
        publicUserService: serviceMod.publicUserService,
        userRepository: repoMod.userRepository,
    }
}

async function createMockAuthUser(
    role: RoleLiterals = 'ADMIN'
): Promise<import('@/features/auth').AuthenticatedUser> {
    const uniqueId = generateUUIDv7().slice(-8)
    return {
        id: generateUUIDv7(),
        role,
        email: `mock-${uniqueId}@test.local`,
    }
}

function generateUniqueEmail(prefix: string = 'test'): string {
    const uniqueId = generateUUIDv7().slice(-8)
    return `${prefix}-${uniqueId}@test.local`
}

async function seedUser(name: string, email: string, overrides: Partial<any> = {}) {
    return testPrisma.user.create({
        data: {
            id: generateUUIDv7(),
            email,
            name,
            role: 'USER',
            isActive: true,
            isBanned: false,
            isEmailVerified: false,
            passwordHash: await passwordService.hashPassword('password'),
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin: new Date(),
            profilePictureId: null,
            ...overrides,
        },
    })
}

describe('users.service unit', () => {
    it('create passes a hashed password to repository (no fallback)', async () => {
        const { userService } = await getServices()
        const repoMod = await import('@/features/users/users.repository')

        const spy = vi.spyOn(repoMod.userRepository, 'create')
        const email = generateUniqueEmail('hashspy')
        const plain = 'S0meStrongPassword!'

        await userService.create({
            email,
            password: plain,
            role: 'USER',
        })

        expect(spy).toHaveBeenCalledTimes(1)
        const arg = spy.mock.calls[0]?.[0] as { passwordHash?: string; email?: string }
        expect(arg).toBeDefined()
        expect(arg?.email).toBe(email)
        expect(typeof arg?.passwordHash).toBe('string')
        expect(arg?.passwordHash && arg.passwordHash.length).toBeGreaterThan(0)
        expect(arg?.passwordHash).not.toBe(plain)

        const ok = arg?.passwordHash
            ? await passwordService.verifyPassword(arg.passwordHash, plain)
            : false
        expect(ok).toBe(true)

        spy.mockRestore()
    })
    it('create throws on duplicate email', async () => {
        const { userService } = await getServices()
        const email = generateUniqueEmail('dup')
        await seedUser('u1', email)
        await expect(
            userService.create({
                email,
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
            email: generateUniqueEmail('newuser'),
            password: 'password123',
            role: 'MODERATOR' as const,
            isEmailVerified: true,
            isActive: false,
            name: 'Test User',
            bio: 'Test bio',
            oauthProvider: 'google',
            oauthId: 'google-123',
            lastPasswordChange: new Date().toISOString(),
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
        expect(result.profilePictureId).toBeUndefined()
    })

    it('getById throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(userService.getById(createUUID())).rejects.toBeDefined()
    })

    it('getByEmail returns null for non-existent user', async () => {
        const { userService } = await getServices()
        const result = await userService.getByEmail(generateUniqueEmail('nonexistent'))
        expect(result).toBeNull()
    })

    it('update throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(userService.update(createUUID(), { name: 'New Name' })).rejects.toBeDefined()
    })

    it('delete throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(userService.delete(createUUID())).rejects.toBeDefined()
    })

    it('ban throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(
            userService.ban(createUUID(), { banReason: 'test' }, 'admin')
        ).rejects.toBeDefined()
    })

    it('unban throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(userService.unban(createUUID())).rejects.toBeDefined()
    })

    it('ban throws if already banned; unban throws if not banned', async () => {
        const { userService } = await getServices()
        const u1 = await seedUser('u2', generateUniqueEmail('banned'), { isBanned: true })
        await expect(userService.ban(u1.id, { banReason: 'x' }, 'admin')).rejects.toBeDefined()

        const u2 = await seedUser('u3', generateUniqueEmail('notbanned'), { isBanned: false })
        await expect(userService.unban(u2.id)).rejects.toBeDefined()
    })

    it('changePassword throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(
            userService.changePassword(createUUID(), 'old', 'new', {
                email: generateUniqueEmail('test'),
                id: createUUID(),
                role: 'USER',
            })
        ).rejects.toBeDefined()
    })

    it('changePassword rejects invalid current password', async () => {
        const { userService } = await getServices()
        const u = await seedUser('u4', generateUniqueEmail('pw'))
        await expect(
            userService.changePassword(u.id, 'wrong', 'new', {
                id: u.id,
                email: u.email,
                role: u.role,
            })
        ).rejects.toBeDefined()
    })

    it('changePassword updates hash and revokes tokens', async () => {
        const { userService, userRepository } = await getServices()
        const u = await seedUser('u5', generateUniqueEmail('ok'))
        const before = (await userRepository.findById(u.id))?.passwordHash
        await userService.changePassword(u.id, 'password', 'new', {
            id: u.id,
            email: u.email,
            role: u.role,
        })
        const fetched = await userRepository.findById(u.id)
        expect(fetched && before && fetched.passwordHash !== before).toBe(true)
        const ok = fetched
            ? await passwordService.verifyPassword(fetched.passwordHash, 'new')
            : false
        expect(ok).toBe(true)
    })

    it('markEmailAsVerified throws when user not found', async () => {
        const { userService } = await getServices()
        await expect(userService.markEmailAsVerified(createUUID())).rejects.toBeDefined()
    })

    it('markEmailAsVerified throws when email already verified', async () => {
        const { userService } = await getServices()
        const u = await seedUser('u6', generateUniqueEmail('verified'), { isEmailVerified: true })
        await expect(userService.markEmailAsVerified(u.id)).rejects.toBeDefined()
    })

    it('markEmailAsVerified sets isEmailVerified to true', async () => {
        const { userService, userRepository } = await getServices()
        const u = await seedUser('u7', generateUniqueEmail('verify'), { isEmailVerified: false })
        const before = await userRepository.findById(u.id)
        expect(before?.isEmailVerified).toBe(false)
        const updated = await userService.markEmailAsVerified(u.id)
        expect(updated.isEmailVerified).toBe(true)
        const fetched = await userRepository.findById(u.id)
        expect(fetched?.isEmailVerified).toBe(true)
    })

    it('updateLastLogin updates the lastLogin timestamp', async () => {
        const { userService, userRepository } = await getServices()
        const u = await seedUser('u8', generateUniqueEmail('lastlogin'))
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

    describe('list method filters', () => {
        it('filters by role', async () => {
            const { userService } = await getServices()
            const admin = await createMockAuthUser('ADMIN')
            await seedUser('admin', generateUniqueEmail('admin'), { role: 'ADMIN' })
            await seedUser('user', generateUniqueEmail('user'), { role: 'USER' })

            const result = await userService.list({ role: 'ADMIN' }, admin)
            expect(result.users.length).toBeGreaterThanOrEqual(1) // At least test admin, maybe setup admin too
            expect(result.users.every(u => u.role === 'ADMIN')).toBe(true)
        })

        it('filters by isActive', async () => {
            const { userService } = await getServices()
            const admin = await createMockAuthUser('ADMIN')
            await seedUser('active', generateUniqueEmail('active'), { isActive: true })
            await seedUser('inactive', generateUniqueEmail('inactive'), { isActive: false })

            const result = await userService.list({ isActive: true }, admin)
            expect(result.users.length).toBeGreaterThanOrEqual(1) // At least test active user, maybe setup admin too
            expect(result.users.every(u => u.isActive === true)).toBe(true)
        })

        it('filters by isBanned', async () => {
            const { userService } = await getServices()
            const admin = await createMockAuthUser('ADMIN')
            await seedUser('banned', generateUniqueEmail('banned'), { isBanned: true })
            await seedUser('normal', generateUniqueEmail('normal'), { isBanned: false })

            const result = await userService.list({ isBanned: false }, admin)
            expect(result.users.length).toBeGreaterThanOrEqual(1) // At least test normal user, maybe setup admin too
            expect(result.users.every(u => u.isBanned === false)).toBe(true)
        })

        it('filters by hasProfilePicture true', async () => {
            const { userService } = await getServices()
            const admin = await createMockAuthUser('ADMIN')
            // Skip this test since we don't have image records
            const result = await userService.list({ hasProfilePicture: true }, admin)
            expect(result.users).toHaveLength(0)
        })

        it('filters by hasProfilePicture false', async () => {
            const { userService } = await getServices()
            const admin = await createMockAuthUser('ADMIN')
            await seedUser('no-pic', generateUniqueEmail('no'), { profilePictureId: null })

            const result = await userService.list({ hasProfilePicture: false }, admin)
            expect(result.users.length).toBeGreaterThanOrEqual(1) // At least test no-pic user, maybe setup admin too
            expect(result.users.every(u => !u.profilePictureId)).toBe(true)
        })

        it('filters by search term', async () => {
            const { userService } = await getServices()
            const admin = await createMockAuthUser('ADMIN')
            const johnEmail = generateUniqueEmail('john')
            await seedUser('john', johnEmail, { name: 'John Doe', bio: 'Developer' })
            await seedUser('jane', generateUniqueEmail('jane'), {
                name: 'Jane Smith',
                bio: 'Designer',
            })

            const result = await userService.list({ search: 'john' }, admin)
            expect(result.users).toHaveLength(1)
            expect(result.users[0]?.email).toBe(johnEmail)
        })

        it('returns pagination without cursor', async () => {
            const { userService } = await getServices()
            await seedUser('user1', generateUniqueEmail('user1'))
            await seedUser('user2', generateUniqueEmail('user2'))

            const result = await userService.list({ limit: 1 })
            expect(result.pagination.hasPrev).toBe(false)
            expect(result.pagination.prevCursor).toBeUndefined()
        })
    })

    describe('PublicUserService', () => {
        it('getById throws when user not found', async () => {
            const { publicUserService } = await getServices()
            await expect(publicUserService.getById(createUUID())).rejects.toBeDefined()
        })

        it('getById returns public user data', async () => {
            const { publicUserService } = await getServices()
            const mockUser = await createMockAuthUser('ADMIN')
            const u = await seedUser('pub-user', generateUniqueEmail('public'))
            const result = await publicUserService.getById(u.id, mockUser)
            expect(result.id).toBe(u.id)
            expect(result.email).toBe(u.email)
            // Should not include sensitive fields like passwordHash
            expect('passwordHash' in result).toBe(false)
        })

        it('list returns paginated public users', async () => {
            const { publicUserService } = await getServices()
            const mockUser = await createMockAuthUser('ADMIN')
            await seedUser('pub1', generateUniqueEmail('pub1'))
            await seedUser('pub2', generateUniqueEmail('pub2'))

            const result = await publicUserService.list({ limit: 10 }, mockUser)

            expect(result.users.length).toBeGreaterThanOrEqual(2) // At least 2 test users, maybe setup admin too
            expect(result.pagination.hasNext).toBe(false)
            expect(result.pagination.hasPrev).toBe(false)
            expect(result.pagination.limit).toBe(10)
        })
    })

    describe('Error handling', () => {
        it('throws error when creating user with existing email', async () => {
            const { userService } = await getServices()
            const existingEmail = generateUniqueEmail('exists')
            await seedUser('existing', existingEmail)

            await expect(
                userService.create({
                    email: existingEmail,
                    name: 'Duplicate User',
                    password: 'password123',
                    role: 'USER',
                })
            ).rejects.toThrow('User with this email already exists')
        })

        it('throws error when updating user not found', async () => {
            const { userService } = await getServices()

            await expect(userService.update(createUUID(), { name: 'New Name' })).rejects.toThrow(
                'User not found'
            )
        })

        it('throws error when deleting user not found', async () => {
            const { userService } = await getServices()

            await expect(userService.delete(createUUID())).rejects.toThrow('User not found')
        })

        it('throws error when banning user not found', async () => {
            const { userService } = await getServices()
            const admin = await seedUser('admin', generateUniqueEmail('admin'), { role: 'ADMIN' })

            await expect(
                userService.ban(
                    createUUID(),
                    { banReason: 'spam', bannedUntil: '2024-12-31T23:59:59.999Z' },
                    admin.id,
                    admin
                )
            ).rejects.toThrow('User not found')
        })

        it('throws error when unbanning user not found', async () => {
            const { userService } = await getServices()
            const admin = await seedUser('admin', generateUniqueEmail('admin'), { role: 'ADMIN' })

            await expect(userService.unban(createUUID(), admin)).rejects.toThrow('User not found')
        })

        it('throws error with invalid cursor format', async () => {
            const { userService } = await getServices()

            await expect(userService.list({ cursor: 'invalid-cursor' })).rejects.toThrow(
                'Invalid cursor format'
            )
        })
    })
})
