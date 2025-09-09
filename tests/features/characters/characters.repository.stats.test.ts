import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { characterRepository } from '@/features/characters/characters.repository'
import { generateUUIDv7 } from '@/shared/utils/uuid'
import {
    createTestArchetype,
    createTestRace,
    createTestUserInDb,
} from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

// This file specifically targets uncovered branches in characters.repository.getStats

async function seedBase(ownerId: string) {
    const race = await createTestRace({ ownerId })
    const archetypeA = await createTestArchetype({ ownerId, name: `ArchA-${generateUUIDv7()}` })
    const archetypeB = await createTestArchetype({ ownerId, name: `ArchB-${generateUUIDv7()}` })
    const archetypeC = await createTestArchetype({ ownerId, name: `ArchC-${generateUUIDv7()}` })
    return { race, archetypeA, archetypeB, archetypeC }
}

describe('characterRepository.getStats', () => {
    const originalEnv = process.env.NODE_ENV
    beforeEach(async () => {
        await testPrisma.character.deleteMany({})
        await testPrisma.archetype.deleteMany({})
        await testPrisma.race.deleteMany({})
        await testPrisma.user.deleteMany({})
    })
    afterEach(() => {
        process.env.NODE_ENV = originalEnv
    })

    it('returns simplified stats in test environment branch', async () => {
        process.env.NODE_ENV = 'test'
        const user = await createTestUserInDb({})
        const { race, archetypeA } = await seedBase(user.id)
        // create a single public character to ensure counts increment
        await characterRepository.create({
            name: 'StatCharTest',
            visibility: 'PUBLIC',
            ownerId: user.id,
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
            archetypeId: archetypeA.id,
        })
        const stats = await characterRepository.getStats()
        expect(stats.totalCharacters).toBe(1)
        expect(stats.publicCharacters).toBe(1)
        expect(stats.privateCharacters).toBe(0)
        expect(stats.hiddenCharacters).toBe(0)
        expect(stats.topArchetypes.length).toBe(0)
    })

    it('returns full stats in non-test environment branch', async () => {
        process.env.NODE_ENV = 'ci' // force non-test branch
        const user = await createTestUserInDb({})
        const { race, archetypeA, archetypeB, archetypeC } = await seedBase(user.id)
        // Create 6 characters: 4 public (distributed), 1 private, 1 hidden
        const baseData = {
            ownerId: user.id,
            level: 5,
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
            sex: 'MALE' as const,
            raceId: race.id,
        }
        await characterRepository.create({
            ...baseData,
            name: 'PubA1',
            visibility: 'PUBLIC',
            archetypeId: archetypeA.id,
        })
        await characterRepository.create({
            ...baseData,
            name: 'PrivA2',
            visibility: 'PRIVATE',
            archetypeId: archetypeA.id,
        })
        await characterRepository.create({
            ...baseData,
            name: 'HiddenA3',
            visibility: 'HIDDEN',
            archetypeId: archetypeA.id,
        })
        await characterRepository.create({
            ...baseData,
            name: 'PubB1',
            visibility: 'PUBLIC',
            archetypeId: archetypeB.id,
        })
        await characterRepository.create({
            ...baseData,
            name: 'PubB2',
            visibility: 'PUBLIC',
            archetypeId: archetypeB.id,
        })
        await characterRepository.create({
            ...baseData,
            name: 'PubC1',
            visibility: 'PUBLIC',
            archetypeId: archetypeC.id,
        })
        const stats = await characterRepository.getStats()
        expect(stats.totalCharacters).toBe(6)
        expect(stats.publicCharacters).toBe(4)
        expect(stats.privateCharacters).toBe(1)
        expect(stats.hiddenCharacters).toBe(1)
        expect(stats.topArchetypes.length).toBeGreaterThan(0)
        const [first] = stats.topArchetypes
        if (first) expect(first.count).toBeGreaterThanOrEqual(3)
        expect(stats.averageLevel).toBeGreaterThan(0)
    })
})
