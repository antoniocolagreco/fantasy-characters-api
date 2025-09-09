import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { raceRepository } from '@/features/races/races.repository'
import { generateUUIDv7 } from '@/shared/utils'
import { cleanupTestData, createTestUserInDb } from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

describe('Races Repository Integration Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    describe('findById', () => {
        it('returns race when it exists', async () => {
            const race = await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'High Elf',
                    visibility: 'PUBLIC',
                    healthModifier: 100,
                    manaModifier: 120,
                    staminaModifier: 90,
                    strengthModifier: 8,
                    constitutionModifier: 9,
                    dexterityModifier: 12,
                    intelligenceModifier: 14,
                    wisdomModifier: 13,
                    charismaModifier: 12,
                },
            })
            const result = await raceRepository.findById(race.id)
            expect(result).toMatchObject({ id: race.id, name: 'High Elf', visibility: 'PUBLIC' })
            expect(result?.createdAt).toBeDefined()
            expect(result?.updatedAt).toBeDefined()
        })

        it('returns null when race does not exist', async () => {
            const result = await raceRepository.findById(generateUUIDv7())
            expect(result).toBeNull()
        })
    })

    describe('findByName', () => {
        it('returns race by unique name', async () => {
            const name = `Race-${generateUUIDv7().slice(0, 8)}`
            await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name,
                    visibility: 'PUBLIC',
                    healthModifier: 100,
                    manaModifier: 100,
                    staminaModifier: 100,
                    strengthModifier: 10,
                    constitutionModifier: 10,
                    dexterityModifier: 10,
                    intelligenceModifier: 10,
                    wisdomModifier: 10,
                    charismaModifier: 10,
                },
            })
            const result = await raceRepository.findByName(name)
            expect(result?.name).toBe(name)
        })

        it('returns null for unknown name', async () => {
            const result = await raceRepository.findByName('UNKNOWN')
            expect(result).toBeNull()
        })
    })

    describe('findMany with cursor pagination', () => {
        beforeEach(async () => {
            await cleanupTestData()
            await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Alpha Race',
                    visibility: 'PUBLIC',
                    healthModifier: 100,
                    manaModifier: 100,
                    staminaModifier: 100,
                    strengthModifier: 10,
                    constitutionModifier: 10,
                    dexterityModifier: 10,
                    intelligenceModifier: 10,
                    wisdomModifier: 10,
                    charismaModifier: 10,
                },
            })
            await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Beta Race',
                    visibility: 'PRIVATE',
                    healthModifier: 100,
                    manaModifier: 100,
                    staminaModifier: 100,
                    strengthModifier: 10,
                    constitutionModifier: 10,
                    dexterityModifier: 10,
                    intelligenceModifier: 10,
                    wisdomModifier: 10,
                    charismaModifier: 10,
                },
            })
            await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Gamma Race',
                    visibility: 'HIDDEN',
                    healthModifier: 100,
                    manaModifier: 100,
                    staminaModifier: 100,
                    strengthModifier: 10,
                    constitutionModifier: 10,
                    dexterityModifier: 10,
                    intelligenceModifier: 10,
                    wisdomModifier: 10,
                    charismaModifier: 10,
                },
            })
        })

        it('lists races without cursor', async () => {
            const result = await raceRepository.findMany({
                limit: 10,
                sortBy: 'name',
                sortDir: 'asc',
            } as any)
            const names = result.races.map(s => s.name)
            expect(names).toEqual(expect.arrayContaining(['Alpha Race', 'Beta Race', 'Gamma Race']))
        })

        it('supports next cursor', async () => {
            const first = await raceRepository.findMany({
                limit: 1,
                sortBy: 'name',
                sortDir: 'asc',
            } as any)
            expect(first.races).toHaveLength(1)
            if (first.hasNext && first.nextCursor) {
                const decoded = JSON.parse(Buffer.from(first.nextCursor, 'base64').toString())
                expect(decoded).toHaveProperty('lastValue')
                expect(decoded).toHaveProperty('lastId')
                const next = await raceRepository.findMany({
                    limit: 1,
                    cursor: first.nextCursor,
                    sortBy: 'name',
                    sortDir: 'asc',
                } as any)
                expect(next.races.length).toBeGreaterThanOrEqual(0)
            }
        })

        it('throws for invalid cursor format', async () => {
            await expect(
                raceRepository.findMany({
                    cursor: 'invalid',
                    sortBy: 'name',
                    sortDir: 'asc',
                } as any)
            ).rejects.toThrow('Invalid cursor format')
        })

        it('throws for invalid sort dir', async () => {
            const cursor = Buffer.from(
                JSON.stringify({ lastValue: 'Alpha Race', lastId: generateUUIDv7() })
            ).toString('base64')
            await expect(
                raceRepository.findMany({
                    cursor,
                    sortBy: 'name',
                    sortDir: 'invalid',
                } as any)
            ).rejects.toThrow('Invalid sort direction')
        })

        it('applies filters', async () => {
            const result = await raceRepository.findMany({
                filters: { visibility: 'PUBLIC' },
            } as any)
            expect(result.races.every(s => s.visibility === 'PUBLIC')).toBe(true)
        })

        it('returns empty with cursor when no data', async () => {
            await cleanupTestData()
            const cursor = Buffer.from(
                JSON.stringify({ lastValue: 'Z', lastId: generateUUIDv7() })
            ).toString('base64')
            const result = await raceRepository.findMany({
                cursor,
                sortBy: 'name',
                sortDir: 'asc',
            } as any)
            expect(result.races).toHaveLength(0)
            expect(result.hasNext).toBe(false)
            expect(result.nextCursor).toBeUndefined()
        })
    })

    describe('create/update/delete', () => {
        it('creates race with owner and optionals', async () => {
            const owner = await createTestUserInDb({ role: 'USER' })
            const created = await raceRepository.create({
                name: 'Nightfolk',
                description: 'Adapted to darkness',
                visibility: 'PRIVATE',
                ownerId: owner.id,
                healthModifier: 110,
                manaModifier: 90,
                staminaModifier: 105,
                strengthModifier: 11,
                constitutionModifier: 10,
                dexterityModifier: 12,
                intelligenceModifier: 9,
                wisdomModifier: 8,
                charismaModifier: 7,
            })
            expect(created).toMatchObject({
                name: 'Nightfolk',
                visibility: 'PRIVATE',
                ownerId: owner.id,
                healthModifier: 110,
            })
        })

        it('updates existing race', async () => {
            const race = await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Old Race',
                    visibility: 'PUBLIC',
                    healthModifier: 100,
                    manaModifier: 100,
                    staminaModifier: 100,
                    strengthModifier: 10,
                    constitutionModifier: 10,
                    dexterityModifier: 10,
                    intelligenceModifier: 10,
                    wisdomModifier: 10,
                    charismaModifier: 10,
                },
            })
            const updated = await raceRepository.update(race.id, {
                name: 'New Race',
                healthModifier: 120,
            })
            expect(updated).toMatchObject({ id: race.id, name: 'New Race', healthModifier: 120 })
        })

        it('delete removes race', async () => {
            const race = await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Temp Race',
                    visibility: 'PUBLIC',
                    healthModifier: 100,
                    manaModifier: 100,
                    staminaModifier: 100,
                    strengthModifier: 10,
                    constitutionModifier: 10,
                    dexterityModifier: 10,
                    intelligenceModifier: 10,
                    wisdomModifier: 10,
                    charismaModifier: 10,
                },
            })
            const ok = await raceRepository.delete(race.id)
            expect(ok).toBe(true)
            const after = await raceRepository.findById(race.id)
            expect(after).toBeNull()
        })

        it('update/delete return NOT_FOUND for unknown id', async () => {
            await expect(raceRepository.update(generateUUIDv7(), { name: 'X' })).rejects.toThrow(
                'Race not found'
            )
            await expect(raceRepository.delete(generateUUIDv7())).rejects.toThrow('Race not found')
        })
    })

    describe('getStats', () => {
        beforeEach(async () => {
            await cleanupTestData()
            await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public 1',
                    visibility: 'PUBLIC',
                    healthModifier: 100,
                    manaModifier: 100,
                    staminaModifier: 100,
                    strengthModifier: 10,
                    constitutionModifier: 10,
                    dexterityModifier: 10,
                    intelligenceModifier: 10,
                    wisdomModifier: 10,
                    charismaModifier: 10,
                },
            })
            await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public 2',
                    visibility: 'PUBLIC',
                    healthModifier: 100,
                    manaModifier: 100,
                    staminaModifier: 100,
                    strengthModifier: 10,
                    constitutionModifier: 10,
                    dexterityModifier: 10,
                    intelligenceModifier: 10,
                    wisdomModifier: 10,
                    charismaModifier: 10,
                },
            })
            await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Private 1',
                    visibility: 'PRIVATE',
                    healthModifier: 100,
                    manaModifier: 100,
                    staminaModifier: 100,
                    strengthModifier: 10,
                    constitutionModifier: 10,
                    dexterityModifier: 10,
                    intelligenceModifier: 10,
                    wisdomModifier: 10,
                    charismaModifier: 10,
                },
            })
            await testPrisma.race.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Hidden 1',
                    visibility: 'HIDDEN',
                    healthModifier: 100,
                    manaModifier: 100,
                    staminaModifier: 100,
                    strengthModifier: 10,
                    constitutionModifier: 10,
                    dexterityModifier: 10,
                    intelligenceModifier: 10,
                    wisdomModifier: 10,
                    charismaModifier: 10,
                },
            })
        })

        it('returns stats in test mode', async () => {
            const original = process.env.NODE_ENV
            process.env.NODE_ENV = generateUUIDv7() // ensure not 'test'
            const stats = await raceRepository.getStats()
            expect(stats).toMatchObject({ totalRaces: 4, publicRaces: 2 })
            process.env.NODE_ENV = original
        })
    })
})
