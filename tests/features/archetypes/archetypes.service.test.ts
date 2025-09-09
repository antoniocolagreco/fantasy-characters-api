import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { archetypeService } from '@/features/archetypes'
import prismaService from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils'

function authUser(id: string, role: 'USER' | 'ADMIN' | 'MODERATOR' = 'USER') {
    return { id, email: `${id}@svc.test`, role }
}

async function createDbUser(role: 'USER' | 'ADMIN' | 'MODERATOR' = 'USER') {
    const id = generateUUIDv7()
    await prismaService.user.create({
        data: {
            id,
            email: `${id}@svc.test`,
            passwordHash: 'hash',
            role,
            name: 'Svc Tester',
            isActive: true,
            isBanned: false,
            isEmailVerified: true,
        },
    })
    return id
}

describe('Archetypes Service', () => {
    beforeAll(async () => {
        await prismaService.$connect()
    })

    beforeEach(async () => {
        await prismaService.archetype.deleteMany()
        await prismaService.user.deleteMany()
    })

    it('creates and retrieves archetype', async () => {
        const userId = await createDbUser('ADMIN')
        const user = authUser(userId, 'ADMIN')
        const created = await archetypeService.create({ name: 'SvcArch' }, user as any)
        const fetched = await archetypeService.getById(created.id, user as any)
        expect(fetched.name).toBe('SvcArch')
    })

    it('prevents duplicate name creation', async () => {
        const userId = await createDbUser('ADMIN')
        const user = authUser(userId, 'ADMIN')
        await archetypeService.create({ name: 'DupSvc' }, user as any)
        await expect(
            archetypeService.create({ name: 'DupSvc' }, user as any)
        ).rejects.toMatchObject({ code: 'RESOURCE_CONFLICT' })
    })

    it('returns not found for missing archetype', async () => {
        const userId = await createDbUser('ADMIN')
        const user = authUser(userId, 'ADMIN')
        await expect(archetypeService.getById(generateUUIDv7(), user as any)).rejects.toMatchObject(
            {
                code: 'RESOURCE_NOT_FOUND',
            }
        )
    })

    it('hides non-viewable archetype (hidden owned by other user)', async () => {
        const ownerId = await createDbUser('USER')
        const otherId = await createDbUser('USER')
        const owner = authUser(ownerId, 'USER')
        await archetypeService.create(
            { name: 'HiddenOne', visibility: 'PRIVATE' as any },
            owner as any
        )
        const other = authUser(otherId, 'USER')
        await expect(
            archetypeService.getById(
                (await prismaService.archetype.findFirstOrThrow({ where: { name: 'HiddenOne' } }))
                    .id,
                other as any
            )
        ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' })
    })

    it('forbids update by non-owner user', async () => {
        const ownerId = await createDbUser('USER')
        const otherId = await createDbUser('USER')
        const created = await archetypeService.create(
            { name: 'OwnedArch' },
            authUser(ownerId) as any
        )
        await expect(
            archetypeService.update(created.id, { description: 'Hack' }, authUser(otherId) as any)
        ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('forbids delete by non-owner user', async () => {
        const ownerId = await createDbUser('USER')
        const otherId = await createDbUser('USER')
        const created = await archetypeService.create(
            { name: 'OwnedArchDel' },
            authUser(ownerId) as any
        )
        await expect(
            archetypeService.delete(created.id, authUser(otherId) as any)
        ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('lists with search and pagination (hasNext true)', async () => {
        const adminId = await createDbUser('ADMIN')
        const admin = authUser(adminId, 'ADMIN')
        for (let i = 0; i < 3; i++) {
            await archetypeService.create({ name: `SearchArch${i}` }, admin as any)
        }
        const page1 = await archetypeService.list(
            { limit: 2, search: 'SearchArch', sortBy: 'createdAt', sortDir: 'desc' } as any,
            admin as any
        )
        expect(page1.pagination.hasNext).toBe(true)
        expect(page1.pagination.nextCursor).toBeDefined()
    })

    it('update name conflict detection', async () => {
        const userId = await createDbUser('ADMIN')
        const user = authUser(userId, 'ADMIN')
        const a1 = await archetypeService.create({ name: 'SvcConflictA' }, user as any)
        await archetypeService.create({ name: 'SvcConflictB' }, user as any)
        await expect(
            archetypeService.update(a1.id, { name: 'SvcConflictB' }, user as any)
        ).rejects.toMatchObject({ code: 'RESOURCE_CONFLICT' })
    })
})
