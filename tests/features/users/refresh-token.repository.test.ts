import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db')

// Use real uuid helper but make output deterministic
vi.mock('../../../src/shared/utils', async orig => {
    const mod: any = await (orig as any)()
    return {
        ...mod,
        generateUUIDv7: () => '11111111-1111-4111-8111-111111111111',
    }
})

const { refreshTokenRepository } = await import(
    '../../../src/features/users/refresh-token.repository'
)
const prismaServiceModule = await import('../../../src/infrastructure/database/prisma.service')

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
            userId: 'user-1',
            expiresAt: new Date('2025-01-10T00:00:00.000Z'),
            isRevoked: false,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            deviceInfo: 'ios',
            ipAddress: '127.0.0.1',
            userAgent: 'UA',
        })

        const created = await refreshTokenRepository.create({
            token: 'tkn',
            userId: 'user-1',
            expiresAt: '2025-01-10T00:00:00.000Z',
            deviceInfo: 'ios',
            ipAddress: '127.0.0.1',
            userAgent: 'UA',
        })

        expect(created).toEqual({
            id: '11111111-1111-4111-8111-111111111111',
            token: 'tkn',
            userId: 'user-1',
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
            userId: 'user-1',
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
                userId: 'u',
                expiresAt: new Date('2025-02-01T00:00:00.000Z'),
                isRevoked: false,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                deviceInfo: undefined,
                ipAddress: undefined,
                userAgent: undefined,
            },
        ])

        const items = await refreshTokenRepository.findActiveByUserId('u')
        expect(items).toEqual([
            {
                id: 'a',
                token: 't1',
                userId: 'u',
                expiresAt: '2025-02-01T00:00:00.000Z',
                isRevoked: false,
                createdAt: '2025-01-01T00:00:00.000Z',
                updatedAt: '2025-01-02T00:00:00.000Z',
            },
        ])
    })
})
