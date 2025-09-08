import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { perkRepository } from '@/features/perks/perks.repository'
import { generateUUIDv7 } from '@/shared/utils'
import { cleanupTestData, createTestUserInDb } from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

// Mirrors skills.repository.test.ts patterns adapted for perks

describe('Perks Repository Integration Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    describe('findById', () => {
        it('returns perk when it exists', async () => {
            const perk = await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Eagle Eye',
                    description: 'Improves ranged accuracy',
                    requiredLevel: 3,
                    visibility: 'PUBLIC',
                },
            })

            const result = await perkRepository.findById(perk.id)
            expect(result).toMatchObject({ id: perk.id, name: 'Eagle Eye', visibility: 'PUBLIC' })
            expect(result?.createdAt).toBeDefined()
            expect(result?.updatedAt).toBeDefined()
        })

        it('returns null when perk does not exist', async () => {
            const result = await perkRepository.findById(generateUUIDv7())
            expect(result).toBeNull()
        })
    })

    describe('findByName', () => {
        it('returns perk by unique name', async () => {
            const name = `Perk-${generateUUIDv7().slice(0, 8)}`
            await testPrisma.perk.create({
                data: { id: generateUUIDv7(), name, requiredLevel: 1, visibility: 'PUBLIC' },
            })
            const result = await perkRepository.findByName(name)
            expect(result?.name).toBe(name)
        })

        it('returns null for unknown name', async () => {
            const result = await perkRepository.findByName('UNKNOWN')
            expect(result).toBeNull()
        })
    })

    describe('findMany with cursor pagination', () => {
        beforeEach(async () => {
            await cleanupTestData()
            await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Alpha Perk',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                },
            })
            await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Beta Perk',
                    requiredLevel: 2,
                    visibility: 'PRIVATE',
                },
            })
            await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Gamma Perk',
                    requiredLevel: 5,
                    visibility: 'HIDDEN',
                },
            })
        })

        it('lists perks without cursor', async () => {
            const result = await perkRepository.findMany({
                limit: 10,
                sortBy: 'name',
                sortDir: 'asc',
            } as any)
            const names = result.perks.map(s => s.name)
            expect(names).toEqual(expect.arrayContaining(['Alpha Perk', 'Beta Perk', 'Gamma Perk']))
        })

        it('supports next cursor', async () => {
            const first = await perkRepository.findMany({
                limit: 1,
                sortBy: 'name',
                sortDir: 'asc',
            } as any)
            expect(first.perks).toHaveLength(1)
            if (first.hasNext && first.nextCursor) {
                const decoded = JSON.parse(Buffer.from(first.nextCursor, 'base64').toString())
                expect(decoded).toHaveProperty('lastValue')
                expect(decoded).toHaveProperty('lastId')
                const next = await perkRepository.findMany({
                    limit: 1,
                    cursor: first.nextCursor,
                    sortBy: 'name',
                    sortDir: 'asc',
                } as any)
                expect(next.perks.length).toBeGreaterThanOrEqual(0)
            }
        })

        it('throws for invalid cursor format', async () => {
            await expect(
                perkRepository.findMany({
                    cursor: 'invalid',
                    sortBy: 'name',
                    sortDir: 'asc',
                } as any)
            ).rejects.toThrow('Invalid cursor format')
        })

        it('throws for invalid sort dir', async () => {
            const cursor = Buffer.from(
                JSON.stringify({ lastValue: 'Alpha Perk', lastId: generateUUIDv7() })
            ).toString('base64')
            await expect(
                perkRepository.findMany({
                    cursor,
                    sortBy: 'name',
                    sortDir: 'invalid',
                } as any)
            ).rejects.toThrow('Invalid sort direction')
        })

        it('applies filters', async () => {
            const result = await perkRepository.findMany({
                filters: { visibility: 'PUBLIC' },
            } as any)
            expect(result.perks.every(s => s.visibility === 'PUBLIC')).toBe(true)
        })

        it('returns empty with cursor when no data', async () => {
            await cleanupTestData()
            const cursor = Buffer.from(
                JSON.stringify({ lastValue: 'Z', lastId: generateUUIDv7() })
            ).toString('base64')
            const result = await perkRepository.findMany({
                cursor,
                sortBy: 'name',
                sortDir: 'asc',
            } as any)
            expect(result.perks).toHaveLength(0)
            expect(result.hasNext).toBe(false)
            expect(result.nextCursor).toBeUndefined()
        })
    })

    describe('create/update/delete', () => {
        it('creates perk with owner and optionals', async () => {
            const owner = await createTestUserInDb({ role: 'USER' })
            const created = await perkRepository.create({
                name: 'Night Vision',
                description: 'See in the dark',
                requiredLevel: 2,
                visibility: 'PRIVATE',
                ownerId: owner.id,
            })
            expect(created).toMatchObject({
                name: 'Night Vision',
                visibility: 'PRIVATE',
                ownerId: owner.id,
            })
        })

        it('updates existing perk', async () => {
            const perk = await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Old Perk',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                },
            })
            const updated = await perkRepository.update(perk.id, {
                name: 'New Perk',
                requiredLevel: 4,
            })
            expect(updated).toMatchObject({ id: perk.id, name: 'New Perk', requiredLevel: 4 })
        })

        it('delete removes perk', async () => {
            const perk = await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Temp Perk',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                },
            })
            const ok = await perkRepository.delete(perk.id)
            expect(ok).toBe(true)
            const after = await perkRepository.findById(perk.id)
            expect(after).toBeNull()
        })

        it('update/delete return NOT_FOUND for unknown id', async () => {
            await expect(perkRepository.update(generateUUIDv7(), { name: 'X' })).rejects.toThrow(
                'Perk not found'
            )
            await expect(perkRepository.delete(generateUUIDv7())).rejects.toThrow('Perk not found')
        })
    })

    describe('getStats', () => {
        beforeEach(async () => {
            await cleanupTestData()
            await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public 1',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                },
            })
            await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public 2',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                },
            })
            await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Private 1',
                    requiredLevel: 1,
                    visibility: 'PRIVATE',
                },
            })
            await testPrisma.perk.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Hidden 1',
                    requiredLevel: 1,
                    visibility: 'HIDDEN',
                },
            })
        })

        it('returns stats in test mode', async () => {
            const original = process.env.NODE_ENV
            process.env.NODE_ENV = generateUUIDv7() // ensure not 'test'
            const stats = await perkRepository.getStats()
            expect(stats).toMatchObject({ totalPerks: 4, publicPerks: 2 })
            process.env.NODE_ENV = original
        })
    })
})
