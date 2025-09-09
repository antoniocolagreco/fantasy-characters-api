import { describe, it, expect, afterAll, beforeEach } from 'vitest'

import { characterRepository } from '@/features/characters/characters.repository'
import { generateUUIDv7 } from '@/shared/utils/uuid'
import {
    cleanupTestData,
    createTestRace,
    createTestArchetype,
    createTestUserInDb,
} from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

// Simple narrow type to avoid depending on HTTP layer types
interface MinimalUser {
    id: string
}

async function seedBasic(ownerId: string) {
    const race = await createTestRace({ ownerId })
    const archetype = await createTestArchetype({ ownerId })
    return { race, archetype }
}

describe('characterRepository', () => {
    let owner: MinimalUser
    afterAll(async () => {
        await cleanupTestData()
    })
    beforeEach(async () => {
        await testPrisma.character.deleteMany({})
        await testPrisma.race.deleteMany({})
        await testPrisma.archetype.deleteMany({})
        await testPrisma.user.deleteMany({})
        owner = await createTestUserInDb({})
    })

    it('creates and fetches a character by id and name', async () => {
        const { race, archetype } = await seedBasic(owner.id)
        const created = await characterRepository.create({
            name: 'RepoChar1',
            visibility: 'PUBLIC',
            ownerId: owner.id,
            level: 1,
            experience: 0,
            health: 100,
            mana: 100,
            stamina: 100,
            strength: 10,
            constitution: 10,
            dexterity: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
            age: 18,
            sex: 'MALE',
            raceId: race.id,
            archetypeId: archetype.id,
        })
        expect(created.id).toBeDefined()
        const byId = await characterRepository.findById(created.id)
        expect(byId?.name).toBe('RepoChar1')
        const byName = await characterRepository.findByName('RepoChar1')
        expect(byName?.id).toBe(created.id)
    })

    it('paginates with cursor', async () => {
        const { race, archetype } = await seedBasic(owner.id)
        for (let i = 0; i < 5; i++) {
            await characterRepository.create({
                name: `CursorChar${i}-${generateUUIDv7().slice(0, 4)}`,
                visibility: 'PUBLIC',
                ownerId: owner.id,
                level: 1,
                experience: 0,
                health: 100,
                mana: 100,
                stamina: 100,
                strength: 10,
                constitution: 10,
                dexterity: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
                age: 18,
                sex: 'MALE',
                raceId: race.id,
                archetypeId: archetype.id,
            })
        }
        const first = await characterRepository.findMany({
            limit: 2,
            sortBy: 'createdAt',
            sortDir: 'desc',
            filters: {},
        })
        expect(first.characters.length).toBe(2)
        expect(first.hasNext).toBe(true)
        expect(first.nextCursor).toBeDefined()
        const second = await characterRepository.findMany({
            limit: 2,
            sortBy: 'createdAt',
            sortDir: 'desc',
            // Only include cursor when defined to satisfy exactOptionalPropertyTypes
            ...(first.nextCursor ? { cursor: first.nextCursor } : {}),
            filters: {},
        })
        expect(second.characters.length).toBe(2)
    })

    it('updates a character', async () => {
        const { race, archetype } = await seedBasic(owner.id)
        const created = await characterRepository.create({
            name: 'UpdateChar',
            visibility: 'PUBLIC',
            ownerId: owner.id,
            level: 1,
            experience: 0,
            health: 100,
            mana: 100,
            stamina: 100,
            strength: 10,
            constitution: 10,
            dexterity: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
            age: 18,
            sex: 'MALE',
            raceId: race.id,
            archetypeId: archetype.id,
        })
        const updated = await characterRepository.update(created.id, { level: 5 })
        expect(updated.level).toBe(5)
    })

    it('deletes a character', async () => {
        const { race, archetype } = await seedBasic(owner.id)
        const created = await characterRepository.create({
            name: 'DeleteChar',
            visibility: 'PUBLIC',
            ownerId: owner.id,
            level: 1,
            experience: 0,
            health: 100,
            mana: 100,
            stamina: 100,
            strength: 10,
            constitution: 10,
            dexterity: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
            age: 18,
            sex: 'MALE',
            raceId: race.id,
            archetypeId: archetype.id,
        })
        await characterRepository.delete(created.id)
        const shouldBeNull = await characterRepository.findById(created.id)
        expect(shouldBeNull).toBeNull()
    })

    it('update returns conflict error when renaming to existing name', async () => {
        const { race, archetype } = await seedBasic(owner.id)
        const a = await characterRepository.create({
            name: 'NameA',
            visibility: 'PUBLIC',
            ownerId: owner.id,
            level: 1,
            experience: 0,
            health: 100,
            mana: 100,
            stamina: 100,
            strength: 10,
            constitution: 10,
            dexterity: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
            age: 18,
            sex: 'MALE',
            raceId: race.id,
            archetypeId: archetype.id,
        })
        const b = await characterRepository.create({
            name: 'NameB',
            visibility: 'PUBLIC',
            ownerId: owner.id,
            level: 1,
            experience: 0,
            health: 100,
            mana: 100,
            stamina: 100,
            strength: 10,
            constitution: 10,
            dexterity: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
            age: 18,
            sex: 'MALE',
            raceId: race.id,
            archetypeId: archetype.id,
        })
        expect(a.id).not.toBe(b.id)
        await expect(characterRepository.update(b.id, { name: 'NameA' })).rejects.toThrow()
    })

    it('delete non-existent character returns NOT_FOUND error', async () => {
        await expect(
            characterRepository.delete('00000000-0000-0000-0000-000000000000')
        ).rejects.toThrow()
    })
})
