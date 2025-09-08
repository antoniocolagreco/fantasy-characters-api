import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateUUIDv7 } from '@/shared/utils'

vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db')

const USER_1_ID = generateUUIDv7()
const USER_2_ID = generateUUIDv7()

// Mock randomBytes to return predictable output
vi.mock('node:crypto', () => ({
    randomBytes: vi.fn().mockReturnValue({
        toString: () => 'a'.repeat(64), // 64 hex chars
    }),
}))

// Use real uuid helper but make output deterministic
vi.mock('@/shared/utils', async orig => {
    const mod: any = await (orig as any)()
    return {
        ...mod,
        generateUUIDv7: () => '11111111-1111-4111-8111-111111111111',
    }
})

const { refreshTokenRepository } = await import('@/features/users/refresh-token.repository')
const prismaServiceModule = await import('@/infrastructure/database/prisma.service')

describe('refreshTokenRepository', () => {
    beforeEach(() => {
        const prisma = (prismaServiceModule as any).default
        prisma.refreshToken.create = vi.fn()
        prisma.refreshToken.findFirst = vi.fn()
        prisma.refreshToken.updateMany = vi.fn()
        prisma.refreshToken.deleteMany = vi.fn()
        prisma.refreshToken.findMany = vi.fn()
    })

    it('create returns normalized entity', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.create.mockResolvedValue({
            id: '11111111-1111-4111-8111-111111111111',
            token: 'tkn',
            userId: USER_1_ID,
            expiresAt: new Date('2025-01-10T00:00:00.000Z'),
            isRevoked: false,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            deviceInfo: 'ios',
            ipAddress: '127.0.0.1',
            userAgent: 'UA',
        })
        const entity = await refreshTokenRepository.create({
            token: 'tkn',
            userId: USER_1_ID,
            expiresAt: '2025-01-10T00:00:00.000Z',
            deviceInfo: 'ios',
            ipAddress: '127.0.0.1',
            userAgent: 'UA',
        })

        expect(entity).toEqual({
            id: '11111111-1111-4111-8111-111111111111',
            token: 'tkn',
            userId: USER_1_ID,
            expiresAt: '2025-01-10T00:00:00.000Z',
            isRevoked: false,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            deviceInfo: 'ios',
            ipAddress: '127.0.0.1',
            userAgent: 'UA',
        })
    })

    it('findByToken returns null when not found', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.findFirst.mockResolvedValue(null)
        const found = await refreshTokenRepository.findByToken('nope')
        expect(found).toBeNull()
    })

    it('findByToken returns normalized entity when found', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.findFirst.mockResolvedValue({
            id: 'id',
            token: 'tkn',
            userId: USER_1_ID,
            expiresAt: new Date('2025-01-10T00:00:00.000Z'),
            isRevoked: false,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        })
        const found = await refreshTokenRepository.findByToken('tkn')
        expect(found?.expiresAt).toBe('2025-01-10T00:00:00.000Z')
        expect(found?.createdAt).toBe('2025-01-01T00:00:00.000Z')
        expect(found?.updatedAt).toBe('2025-01-01T00:00:00.000Z')
    })

    it('revokeByToken throws when nothing updated', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.updateMany.mockResolvedValue({ count: 0 })
        await expect(refreshTokenRepository.revokeByToken('nope')).rejects.toMatchObject({
            code: 'RESOURCE_NOT_FOUND',
        })
    })

    it('revokeByToken resolves when items updated', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.updateMany.mockResolvedValue({ count: 2 })
        await expect(refreshTokenRepository.revokeByToken('ok')).resolves.toBeUndefined()
    })

    it('deleteExpired returns deleted count', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.deleteMany.mockResolvedValue({ count: 3 })
        const count = await refreshTokenRepository.deleteExpired()
        expect(count).toBe(3)
    })

    it('findActiveByUserId maps and normalizes fields', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.findMany.mockResolvedValue([
            {
                id: 'a',
                token: 't1',
                userId: generateUUIDv7(),
                expiresAt: new Date('2025-02-01T00:00:00.000Z'),
                isRevoked: false,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                deviceInfo: undefined,
                ipAddress: undefined,
                userAgent: undefined,
            },
        ])

        const items = await refreshTokenRepository.findActiveByUserId(generateUUIDv7())
        expect(items).toEqual([
            {
                id: 'a',
                token: 't1',
                userId: generateUUIDv7(),
                expiresAt: '2025-02-01T00:00:00.000Z',
                isRevoked: false,
                createdAt: '2025-01-01T00:00:00.000Z',
                updatedAt: '2025-01-02T00:00:00.000Z',
            },
        ])
    })

    // ===== Additional tests for branch coverage =====

    it('create generates random token when input token is empty string', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.create.mockResolvedValue({
            id: '11111111-1111-4111-8111-111111111111',
            token: 'generated-random-token',
            userId: USER_1_ID,
            expiresAt: new Date('2025-01-10T00:00:00.000Z'),
            isRevoked: false,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        })

        await refreshTokenRepository.create({
            token: '', // Empty string should trigger random generation
            userId: USER_1_ID,
            expiresAt: '2025-01-10T00:00:00.000Z',
        })

        expect(rt.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                id: expect.any(String),
                token: expect.any(String),
                userId: USER_1_ID,
                expiresAt: '2025-01-10T00:00:00.000Z',
            }),
        })

        // Verify token was generated (not empty)
        const callArgs = rt.create.mock.calls[0][0]
        expect(callArgs.data.token).not.toBe('')
        expect(callArgs.data.token.length).toBeGreaterThan(0)
    })

    it('create generates random token when input token is undefined', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.create.mockResolvedValue({
            id: '11111111-1111-4111-8111-111111111111',
            token: 'generated-random-token',
            userId: USER_1_ID,
            expiresAt: new Date('2025-01-10T00:00:00.000Z'),
            isRevoked: false,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        })

        await refreshTokenRepository.create({
            // No token field provided (undefined)
            userId: USER_1_ID,
            expiresAt: '2025-01-10T00:00:00.000Z',
        } as any)

        expect(rt.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                id: expect.any(String),
                token: expect.any(String),
                userId: USER_1_ID,
                expiresAt: '2025-01-10T00:00:00.000Z',
            }),
        })

        // Verify token was generated (not empty)
        const callArgs = rt.create.mock.calls[0][0]
        expect(callArgs.data.token).not.toBe('')
        expect(callArgs.data.token.length).toBeGreaterThan(0)
    })

    it('create returns entity without optional fields when they are null/undefined', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.create.mockResolvedValue({
            id: '11111111-1111-4111-8111-111111111111',
            token: 'tkn',
            userId: USER_1_ID,
            expiresAt: new Date('2025-01-10T00:00:00.000Z'),
            isRevoked: false,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            deviceInfo: null, // null values
            ipAddress: undefined, // undefined values
            userAgent: null,
        })

        const created = await refreshTokenRepository.create({
            token: 'tkn',
            userId: USER_1_ID,
            expiresAt: '2025-01-10T00:00:00.000Z',
        })

        // Should NOT include deviceInfo, ipAddress, userAgent fields
        expect(created).toEqual({
            id: '11111111-1111-4111-8111-111111111111',
            token: 'tkn',
            userId: USER_1_ID,
            expiresAt: '2025-01-10T00:00:00.000Z',
            isRevoked: false,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
        })
        expect(created).not.toHaveProperty('deviceInfo')
        expect(created).not.toHaveProperty('ipAddress')
        expect(created).not.toHaveProperty('userAgent')
    })

    it('findByToken returns entity without optional fields when they are null/undefined', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.findFirst.mockResolvedValue({
            id: 'id',
            token: 'tkn',
            userId: USER_1_ID,
            expiresAt: new Date('2025-01-10T00:00:00.000Z'),
            isRevoked: false,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            deviceInfo: null,
            ipAddress: undefined,
            userAgent: null,
        })

        const found = await refreshTokenRepository.findByToken('tkn')

        expect(found).toEqual({
            id: 'id',
            token: 'tkn',
            userId: USER_1_ID,
            expiresAt: '2025-01-10T00:00:00.000Z',
            isRevoked: false,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
        })
        expect(found).not.toHaveProperty('deviceInfo')
        expect(found).not.toHaveProperty('ipAddress')
        expect(found).not.toHaveProperty('userAgent')
    })

    it('revokeAllByUserId completes successfully', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.updateMany.mockResolvedValue({ count: 5 })

        await expect(refreshTokenRepository.revokeAllByUserId(USER_1_ID)).resolves.toBeUndefined()

        expect(rt.updateMany).toHaveBeenCalledWith({
            where: { userId: USER_1_ID, isRevoked: false },
            data: { isRevoked: true },
        })
    })

    it('findActiveByUserId includes optional fields when present', async () => {
        const rt = (prismaServiceModule as any).default.refreshToken
        rt.findMany.mockResolvedValue([
            {
                id: 'token1',
                token: 'token-value-1',
                userId: USER_2_ID,
                expiresAt: new Date('2025-12-31T23:59:59.000Z'),
                isRevoked: false,
                createdAt: new Date('2025-01-01T12:00:00.000Z'),
                updatedAt: new Date('2025-01-15T12:00:00.000Z'),
                deviceInfo: 'iPhone 15 Pro', // Present
                ipAddress: '192.168.1.100', // Present
                userAgent: 'Mozilla/5.0 Safari/537.36', // Present
            },
            {
                id: 'token2',
                token: 'token-value-2',
                userId: USER_2_ID,
                expiresAt: new Date('2025-11-30T23:59:59.000Z'),
                isRevoked: false,
                createdAt: new Date('2025-01-02T12:00:00.000Z'),
                updatedAt: new Date('2025-01-16T12:00:00.000Z'),
                deviceInfo: null, // Null - should be excluded
                ipAddress: undefined, // Undefined - should be excluded
                userAgent: 'Chrome/91.0.4472.124', // Present
            },
        ])

        const tokens = await refreshTokenRepository.findActiveByUserId(USER_2_ID)

        expect(tokens).toEqual([
            {
                id: 'token1',
                token: 'token-value-1',
                userId: USER_2_ID,
                expiresAt: '2025-12-31T23:59:59.000Z',
                isRevoked: false,
                createdAt: '2025-01-01T12:00:00.000Z',
                updatedAt: '2025-01-15T12:00:00.000Z',
                deviceInfo: 'iPhone 15 Pro',
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 Safari/537.36',
            },
            {
                id: 'token2',
                token: 'token-value-2',
                userId: USER_2_ID,
                expiresAt: '2025-11-30T23:59:59.000Z',
                isRevoked: false,
                createdAt: '2025-01-02T12:00:00.000Z',
                updatedAt: '2025-01-16T12:00:00.000Z',
                userAgent: 'Chrome/91.0.4472.124',
            },
        ])

        // Verify that the second token does NOT have deviceInfo and ipAddress properties
        expect(tokens[1]).not.toHaveProperty('deviceInfo')
        expect(tokens[1]).not.toHaveProperty('ipAddress')
        expect(tokens[1]).toHaveProperty('userAgent')
    })
})
