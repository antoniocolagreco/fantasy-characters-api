import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

import { characterService } from '@/features/characters/characters.service'
import { seedTaxonomy } from '@/infrastructure/database/seed/taxonomy'
import { cleanupTestData, createTestUserInDb } from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

interface TestCtx {
    ownerId: string
    raceId: string
    archetypeId: string
}

async function seed(): Promise<TestCtx> {
    const owner = await createTestUserInDb({ role: 'USER' })
    const { races, archetypes } = await seedTaxonomy(testPrisma, owner.id)
    return { ownerId: owner.id, raceId: races[0]!.id, archetypeId: archetypes[0]!.id }
}

describe('characterService', () => {
    beforeAll(async () => {
        // nothing global yet
    })
    afterAll(async () => {
        await cleanupTestData()
    })
    beforeEach(async () => {
        await testPrisma.character.deleteMany({})
    })

    it('creates and retrieves a character (owner can view)', async () => {
        const { ownerId, raceId, archetypeId } = await seed()
        const owner = await testPrisma.user.findUnique({ where: { id: ownerId } })
        if (!owner) throw new Error('owner missing')
        const created = await characterService.create(
            {
                name: 'ServiceChar1',
                raceId,
                archetypeId,
            },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        const fetched = await characterService.getById(created.id, {
            id: owner.id,
            email: owner.email,
            role: owner.role,
        })
        expect(fetched.id).toBe(created.id)
    })

    it('prevents regular user from seeing private character of another user', async () => {
        const { ownerId, raceId, archetypeId } = await seed()
        const owner = await testPrisma.user.findUnique({ where: { id: ownerId } })
        if (!owner) throw new Error('owner missing')
        const created = await characterService.create(
            { name: 'PrivateChar', raceId, archetypeId, visibility: 'PRIVATE' },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        // Another user tries to fetch
        const other = await createTestUserInDb({ role: 'USER' })
        await expect(
            characterService.getById(created.id, {
                id: other.id,
                email: other.email,
                role: other.role,
            })
        ).rejects.toThrow()
    })

    it('allows moderator to view hidden character', async () => {
        const { ownerId, raceId, archetypeId } = await seed()
        const owner = await testPrisma.user.findUnique({ where: { id: ownerId } })
        if (!owner) throw new Error('owner missing')
        const created = await characterService.create(
            { name: 'HiddenChar', raceId, archetypeId, visibility: 'HIDDEN' },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        const mod = await createTestUserInDb({ role: 'MODERATOR' })
        const fetched = await characterService.getById(created.id, {
            id: mod.id,
            email: mod.email,
            role: mod.role,
        })
        expect(fetched.id).toBe(created.id)
    })

    it('enforces unique name on create', async () => {
        const { ownerId, raceId, archetypeId } = await seed()
        const owner = await testPrisma.user.findUnique({ where: { id: ownerId } })
        if (!owner) throw new Error('owner missing')
        await characterService.create(
            { name: 'UniqueName', raceId, archetypeId },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        await expect(
            characterService.create(
                { name: 'UniqueName', raceId, archetypeId },
                { id: owner.id, email: owner.email, role: owner.role }
            )
        ).rejects.toThrow()
    })

    it('prevents non-owner user from updating another user character', async () => {
        const { ownerId, raceId, archetypeId } = await seed()
        const owner = await testPrisma.user.findUnique({ where: { id: ownerId } })
        if (!owner) throw new Error('owner missing')
        const created = await characterService.create(
            { name: 'UpdateForbidden', raceId, archetypeId },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        const other = await createTestUserInDb({ role: 'USER' })
        await expect(
            characterService.update(
                created.id,
                { level: 2 },
                {
                    id: other.id,
                    email: other.email,
                    role: other.role,
                }
            )
        ).rejects.toThrow()
    })

    it('allows owner to update own character', async () => {
        const { ownerId, raceId, archetypeId } = await seed()
        const owner = await testPrisma.user.findUnique({ where: { id: ownerId } })
        if (!owner) throw new Error('owner missing')
        const created = await characterService.create(
            { name: 'UpdateAllowed', raceId, archetypeId },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        const updated = await characterService.update(
            created.id,
            { level: 3 },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        expect(updated.level).toBe(3)
    })

    it('moderator can update user public character', async () => {
        const { ownerId, raceId, archetypeId } = await seed()
        const owner = await testPrisma.user.findUnique({ where: { id: ownerId } })
        if (!owner) throw new Error('owner missing')
        const created = await characterService.create(
            { name: 'ModeratorUpdate', raceId, archetypeId },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        const mod = await createTestUserInDb({ role: 'MODERATOR' })
        const updated = await characterService.update(
            created.id,
            { level: 4 },
            { id: mod.id, email: mod.email, role: mod.role }
        )
        expect(updated.level).toBe(4)
    })

    it('getStats forbidden for regular user', async () => {
        const { ownerId } = await seed()
        const owner = await testPrisma.user.findUnique({ where: { id: ownerId } })
        if (!owner) throw new Error('owner missing')
        await expect(
            characterService.getStats({ id: owner.id, email: owner.email, role: owner.role })
        ).rejects.toThrow()
    })
})
