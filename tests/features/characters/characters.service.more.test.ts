import { describe, it, expect, beforeEach } from 'vitest'

import { characterService } from '@/features/characters/characters.service'
import { seedTaxonomy } from '@/infrastructure/database/seed/taxonomy'
import { cleanupTestData, createTestUserInDb } from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

// Additional service tests focused on uncovered branches (filter building, range validation,
// ownership / visibility branches, relation updates, conflict detection, stats permissions).

async function seedBase() {
    const owner = await createTestUserInDb({ role: 'USER' })
    const { races, archetypes } = await seedTaxonomy(testPrisma, owner.id)
    return { owner, race: races[0]!, archetype: archetypes[0]! }
}

describe('characterService (additional branch coverage)', () => {
    beforeEach(async () => {
        await cleanupTestData()
    })

    it('list: filters by race using UUID branch and by race name substring branch', async () => {
        const { owner, race, archetype } = await seedBase()
        // Create two characters with same race
        await characterService.create(
            { name: 'ListUUID1', raceId: race.id, archetypeId: archetype.id },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        await characterService.create(
            { name: 'ListUUID2', raceId: race.id, archetypeId: archetype.id },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        // UUID branch
        const byId = await characterService.list({ race: race.id, limit: 50 }, owner)
        expect(byId.characters.length).toBe(2)
        // Name substring branch (take first 3 letters of race name)
        const prefix = race.name.slice(0, 3)
        const byName = await characterService.list({ race: prefix, limit: 50 }, owner)
        expect(byName.characters.length).toBeGreaterThanOrEqual(2)
    })

    it('list: search OR branch and multiple numeric range filters', async () => {
        const { owner, race, archetype } = await seedBase()
        await characterService.create(
            {
                name: 'SearchableAlpha',
                description: 'Brave hero',
                raceId: race.id,
                archetypeId: archetype.id,
                level: 10,
                strength: 20,
                intelligence: 15,
            },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        const result = await characterService.list(
            {
                search: 'hero',
                strengthMin: 10,
                strengthMax: 30,
                intelligenceMin: 10,
                intelligenceMax: 20,
                levelMin: 5,
                levelMax: 15,
                limit: 10,
            },
            owner
        )
        expect(result.characters.some(c => c.name === 'SearchableAlpha')).toBe(true)
    })

    it('list: invalid range throws (levelMin > levelMax)', async () => {
        const { owner } = await seedBase()
        await expect(
            characterService.list({ levelMin: 10, levelMax: 5, limit: 10 }, owner)
        ).rejects.toThrow()
    })

    it('getById: returns not found error when character missing', async () => {
        const { owner } = await seedBase()
        await expect(characterService.getById('non-existent-id', owner)).rejects.toThrow()
    })

    it('getByName: returns null when character not visible to user (hidden)', async () => {
        const { owner, race, archetype } = await seedBase()
        const hiddenOwner = owner
        await characterService.create(
            { name: 'HiddenVis', raceId: race.id, archetypeId: archetype.id, visibility: 'HIDDEN' },
            { id: hiddenOwner.id, email: hiddenOwner.email, role: hiddenOwner.role }
        )
        const other = await createTestUserInDb({ role: 'USER' })
        const fetched = await characterService.getByName('HiddenVis', {
            id: other.id,
            email: other.email,
            role: other.role,
        })
        expect(fetched).toBeNull()
    })

    it('update: name conflict branch', async () => {
        const { owner, race, archetype } = await seedBase()
        const c1 = await characterService.create(
            { name: 'Original1', raceId: race.id, archetypeId: archetype.id },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        await characterService.create(
            { name: 'Original2', raceId: race.id, archetypeId: archetype.id },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        await expect(
            characterService.update(
                c1.id,
                { name: 'Original2' },
                { id: owner.id, email: owner.email, role: owner.role }
            )
        ).rejects.toThrow()
    })

    it('update: relation + attribute fields (visibility, sex, raceId, archetypeId)', async () => {
        const { owner, race, archetype } = await seedBase()
        // Fetch different race/archetype from existing taxonomy to avoid reseeding
        const otherRace = await testPrisma.race.findFirst({
            where: { id: { not: race.id } },
            orderBy: { name: 'asc' },
        })
        const otherArch = await testPrisma.archetype.findFirst({
            where: { id: { not: archetype.id } },
            orderBy: { name: 'asc' },
        })
        if (!otherRace || !otherArch) throw new Error('Missing extra taxonomy for update test')
        const created = await characterService.create(
            { name: 'RelChange', raceId: race.id, archetypeId: archetype.id },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        const updated = await characterService.update(
            created.id,
            {
                visibility: 'PRIVATE',
                sex: 'FEMALE',
                raceId: otherRace.id,
                archetypeId: otherArch.id,
            },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        expect(updated.visibility).toBe('PRIVATE')
        expect(updated.sex).toBe('FEMALE')
        expect(updated.raceId).toBe(otherRace.id)
        expect(updated.archetypeId).toBe(otherArch.id)
    })

    it('delete: owner can delete and moderator can delete user character', async () => {
        const { owner, race, archetype } = await seedBase()
        const created = await characterService.create(
            { name: 'ToDelete1', raceId: race.id, archetypeId: archetype.id },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        // moderator deletion
        const mod = await createTestUserInDb({ role: 'MODERATOR' })
        await characterService.delete(created.id, { id: mod.id, email: mod.email, role: mod.role })
        // create another for owner self-delete
        const created2 = await characterService.create(
            { name: 'ToDelete2', raceId: race.id, archetypeId: archetype.id },
            { id: owner.id, email: owner.email, role: owner.role }
        )
        await characterService.delete(created2.id, {
            id: owner.id,
            email: owner.email,
            role: owner.role,
        })
        const remaining = await testPrisma.character.findMany({})
        expect(remaining.length).toBe(0)
    })

    it('getStats: moderator success path', async () => {
        const mod = await createTestUserInDb({ role: 'MODERATOR' })
        const stats = await characterService.getStats({
            id: mod.id,
            email: mod.email,
            role: mod.role,
        })
        expect(stats.totalCharacters).toBeGreaterThanOrEqual(0)
    })
})
