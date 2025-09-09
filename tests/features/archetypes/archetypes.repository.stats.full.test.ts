import { describe, it, beforeAll, beforeEach, expect } from 'vitest'

import { archetypeRepository } from '@/features/archetypes'
import prismaService from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils'

async function createUser(role: 'USER' | 'ADMIN' | 'MODERATOR' = 'USER') {
    const id = generateUUIDv7()
    await prismaService.user.create({
        data: {
            id,
            email: `${id}@stats.test`,
            passwordHash: 'hash',
            role,
            name: 'Stats Tester',
            isActive: true,
            isBanned: false,
            isEmailVerified: true,
        },
    })
    return id
}

describe('Archetypes Repository - full stats branch', () => {
    beforeAll(async () => {
        await prismaService.$connect()
    })

    beforeEach(async () => {
        await prismaService.archetype.deleteMany()
        await prismaService.user.deleteMany()
    })

    it('computes full stats when NODE_ENV != test', async () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'development'
        try {
            const userId = await createUser('ADMIN')
            await archetypeRepository.create({
                name: 'PublicOne',
                visibility: 'PUBLIC',
                ownerId: userId,
            })
            await archetypeRepository.create({
                name: 'PrivateOne',
                visibility: 'PRIVATE',
                ownerId: userId,
            })
            await archetypeRepository.create({
                name: 'HiddenOne',
                visibility: 'HIDDEN',
                ownerId: userId,
            })
            const stats = await archetypeRepository.getStats()
            expect(stats.totalArchetypes).toBe(3)
            expect(stats.publicArchetypes).toBe(1)
            expect(stats.privateArchetypes).toBe(1)
            expect(stats.hiddenArchetypes).toBe(1)
            expect(stats.topArchetypes.length).toBeGreaterThanOrEqual(0)
        } finally {
            process.env.NODE_ENV = originalEnv
        }
    })
})
