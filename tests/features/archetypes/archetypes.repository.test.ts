import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

import { archetypeRepository } from '@/features/archetypes'
import prismaService from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils'

describe('Archetypes Repository', () => {
    beforeAll(async () => {
        await prismaService.$connect()
    })

    beforeEach(async () => {
        await prismaService.archetype.deleteMany()
        await prismaService.user.deleteMany()
    })

    async function createUser(role: 'USER' | 'ADMIN' | 'MODERATOR' = 'USER') {
        const id = generateUUIDv7()
        await prismaService.user.create({
            data: {
                id,
                email: `${id}@repo.test`,
                passwordHash: 'hash',
                role,
                name: 'Repo Tester',
                isActive: true,
                isBanned: false,
                isEmailVerified: true,
            },
        })
        return id
    }

    it('creates and retrieves an archetype', async () => {
        const userId = await createUser()
        const created = await archetypeRepository.create({
            name: 'RepoArchetype',
            visibility: 'PUBLIC',
            ownerId: userId,
        })
        const fetched = await archetypeRepository.findById(created.id)
        expect(fetched?.name).toBe('RepoArchetype')
    })

    it('paginates and returns nextCursor', async () => {
        const userId = await createUser()
        for (let i = 0; i < 3; i++) {
            await archetypeRepository.create({
                name: `Arch-${i}`,
                visibility: 'PUBLIC',
                ownerId: userId,
            })
        }
        const firstPage = await archetypeRepository.findMany({
            limit: 2,
            sortBy: 'createdAt',
            sortDir: 'desc',
            filters: {},
        } as any)
        expect(firstPage.hasNext).toBe(true)
        expect(firstPage.nextCursor).toBeTypeOf('string')
        const secondPage = await archetypeRepository.findMany({
            limit: 2,
            cursor: firstPage.nextCursor,
            sortBy: 'createdAt',
            sortDir: 'desc',
            filters: {},
        } as any)
        expect(secondPage.hasNext).toBe(false)
    })

    it('handles invalid cursor format', async () => {
        const userId = await createUser()
        await archetypeRepository.create({
            name: 'ArchInvalid',
            visibility: 'PUBLIC',
            ownerId: userId,
        })
        await expect(
            archetypeRepository.findMany({
                limit: 10,
                cursor: 'not-base64',
                sortBy: 'createdAt',
                sortDir: 'desc',
                filters: {},
            } as any)
        ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    })

    it('maps unique constraint to conflict error on update', async () => {
        const userId = await createUser()
        const a1 = await archetypeRepository.create({
            name: 'DupA',
            visibility: 'PUBLIC',
            ownerId: userId,
        })
        await archetypeRepository.create({
            name: 'DupB',
            visibility: 'PUBLIC',
            ownerId: userId,
        })
        await expect(archetypeRepository.update(a1.id, { name: 'DupB' })).rejects.toMatchObject({
            code: 'CONFLICT',
        })
    })

    it('maps missing record to not found on update/delete', async () => {
        await expect(
            archetypeRepository.update(generateUUIDv7(), { name: 'X' })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' })
        await expect(archetypeRepository.delete(generateUUIDv7())).rejects.toMatchObject({
            code: 'NOT_FOUND',
        })
    })

    it('deletes existing archetype successfully', async () => {
        const userId = await createUser()
        const created = await archetypeRepository.create({
            name: 'DeleteMe',
            visibility: 'PUBLIC',
            ownerId: userId,
        })
        const result = await archetypeRepository.delete(created.id)
        expect(result).toBe(true)
        const after = await archetypeRepository.findById(created.id)
        expect(after).toBeNull()
    })
})
