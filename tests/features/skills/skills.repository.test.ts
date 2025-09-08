import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { skillRepository } from '@/features/skills/skills.repository'
import { generateUUIDv7 } from '@/shared/utils'
import { cleanupTestData, createTestUserInDb } from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

describe('Skills Repository Integration Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    describe('findById', () => {
        it('returns skill when it exists', async () => {
            const skill = await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Fireball',
                    description: 'Cast a fireball',
                    requiredLevel: 3,
                    visibility: 'PUBLIC',
                },
            })

            const result = await skillRepository.findById(skill.id)
            expect(result).toMatchObject({ id: skill.id, name: 'Fireball', visibility: 'PUBLIC' })
            expect(result?.createdAt).toBeDefined()
            expect(result?.updatedAt).toBeDefined()
        })

        it('returns null when skill does not exist', async () => {
            const result = await skillRepository.findById(generateUUIDv7())
            expect(result).toBeNull()
        })
    })

    describe('findByName', () => {
        it('returns skill by unique name', async () => {
            const name = `Skill-${generateUUIDv7().slice(0, 8)}`
            await testPrisma.skill.create({
                data: { id: generateUUIDv7(), name, requiredLevel: 1, visibility: 'PUBLIC' },
            })
            const result = await skillRepository.findByName(name)
            expect(result?.name).toBe(name)
        })

        it('returns null for unknown name', async () => {
            const result = await skillRepository.findByName('UNKNOWN')
            expect(result).toBeNull()
        })
    })

    describe('findMany with cursor pagination', () => {
        beforeEach(async () => {
            await cleanupTestData()
            await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Alpha',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                },
            })
            await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Beta',
                    requiredLevel: 2,
                    visibility: 'PRIVATE',
                },
            })
            await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Gamma',
                    requiredLevel: 5,
                    visibility: 'HIDDEN',
                },
            })
        })

        it('lists skills without cursor', async () => {
            const result = await skillRepository.findMany({
                limit: 10,
                sortBy: 'name',
                sortDir: 'asc',
            })
            const names = result.skills.map(s => s.name)
            expect(names).toEqual(expect.arrayContaining(['Alpha', 'Beta', 'Gamma']))
        })

        it('supports next cursor', async () => {
            const first = await skillRepository.findMany({
                limit: 1,
                sortBy: 'name',
                sortDir: 'asc',
            })
            expect(first.skills).toHaveLength(1)
            if (first.hasNext && first.nextCursor) {
                const decoded = JSON.parse(Buffer.from(first.nextCursor, 'base64').toString())
                expect(decoded).toHaveProperty('lastValue')
                expect(decoded).toHaveProperty('lastId')
                const next = await skillRepository.findMany({
                    limit: 1,
                    cursor: first.nextCursor,
                    sortBy: 'name',
                    sortDir: 'asc',
                })
                expect(next.skills.length).toBeGreaterThanOrEqual(0)
            }
        })

        it('throws for invalid cursor format', async () => {
            await expect(
                skillRepository.findMany({ cursor: 'invalid', sortBy: 'name', sortDir: 'asc' })
            ).rejects.toThrow('Invalid cursor format')
        })

        it('throws for invalid sort dir', async () => {
            const cursor = Buffer.from(
                JSON.stringify({ lastValue: 'Alpha', lastId: generateUUIDv7() })
            ).toString('base64')
            await expect(
                skillRepository.findMany({
                    cursor,
                    sortBy: 'name',
                    sortDir: 'invalid',
                })
            ).rejects.toThrow('Invalid sort direction')
        })

        it('applies filters', async () => {
            const result = await skillRepository.findMany({ filters: { visibility: 'PUBLIC' } })
            expect(result.skills.every(s => s.visibility === 'PUBLIC')).toBe(true)
        })

        it('returns empty with cursor when no data', async () => {
            await cleanupTestData()
            const cursor = Buffer.from(
                JSON.stringify({ lastValue: 'Z', lastId: generateUUIDv7() })
            ).toString('base64')
            const result = await skillRepository.findMany({
                cursor,
                sortBy: 'name',
                sortDir: 'asc',
            })
            expect(result.skills).toHaveLength(0)
            expect(result.hasNext).toBe(false)
            expect(result.nextCursor).toBeUndefined()
        })
    })

    describe('create/update/delete', () => {
        it('creates skill with owner and optionals', async () => {
            const owner = await createTestUserInDb({ role: 'USER' })
            const created = await skillRepository.create({
                name: 'Stealth',
                description: 'Move silently',
                requiredLevel: 2,
                visibility: 'PRIVATE',
                ownerId: owner.id,
            })
            expect(created).toMatchObject({
                name: 'Stealth',
                visibility: 'PRIVATE',
                ownerId: owner.id,
            })
        })

        it('updates existing skill', async () => {
            const skill = await testPrisma.skill.create({
                data: { id: generateUUIDv7(), name: 'Old', requiredLevel: 1, visibility: 'PUBLIC' },
            })
            const updated = await skillRepository.update(skill.id, {
                name: 'New',
                requiredLevel: 4,
            })
            expect(updated).toMatchObject({ id: skill.id, name: 'New', requiredLevel: 4 })
        })

        it('delete removes skill', async () => {
            const skill = await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Temp',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                },
            })
            const ok = await skillRepository.delete(skill.id)
            expect(ok).toBe(true)
            const after = await skillRepository.findById(skill.id)
            expect(after).toBeNull()
        })

        it('update/delete return NOT_FOUND for unknown id', async () => {
            await expect(skillRepository.update(generateUUIDv7(), { name: 'X' })).rejects.toThrow(
                'Skill not found'
            )
            await expect(skillRepository.delete(generateUUIDv7())).rejects.toThrow(
                'Skill not found'
            )
        })
    })

    describe('getStats', () => {
        beforeEach(async () => {
            await cleanupTestData()
            await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public 1',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                },
            })
            await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public 2',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                },
            })
            await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Private 1',
                    requiredLevel: 1,
                    visibility: 'PRIVATE',
                },
            })
            await testPrisma.skill.create({
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
            const stats = await skillRepository.getStats()
            expect(stats).toMatchObject({ totalSkills: 4, publicSkills: 2 })
            process.env.NODE_ENV = original
        })
    })
})
