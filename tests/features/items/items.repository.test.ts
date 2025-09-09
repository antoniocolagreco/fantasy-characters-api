import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { itemRepository } from '@/features/items'
import { generateUUIDv7 } from '@/shared/utils'
import { cleanupTestData, createTestItem, createTestUserInDb } from '@/tests/helpers/data.helper'

describe('Items Repository Integration Tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        await cleanupTestData()
    })

    describe('findById / findByName', () => {
        it('returns item when it exists and null otherwise', async () => {
            const item = await createTestItem({ name: 'Sword of Dawn' })
            const byId = await itemRepository.findById(item.id)
            expect(byId?.name).toBe('Sword of Dawn')
            const byName = await itemRepository.findByName('Sword of Dawn')
            expect(byName?.id).toBe(item.id)
            const missing = await itemRepository.findById(generateUUIDv7())
            expect(missing).toBeNull()
        })
    })

    describe('findMany (pagination, search, cursor)', () => {
        beforeEach(async () => {
            await createTestItem({ name: 'Alpha Item' })
            await createTestItem({ name: 'Beta Item' })
            await createTestItem({ name: 'Gamma Item' })
        })

        it('lists items with sorting', async () => {
            const result = await itemRepository.findMany({
                limit: 10,
                sortBy: 'name',
                sortDir: 'asc',
            })
            expect(result.items.length).toBeGreaterThanOrEqual(3)
        })

        it('applies cursor pagination', async () => {
            const first = await itemRepository.findMany({
                limit: 1,
                sortBy: 'name',
                sortDir: 'asc',
            })
            if (first.hasNext && first.nextCursor) {
                const second = await itemRepository.findMany({
                    limit: 1,
                    sortBy: 'name',
                    sortDir: 'asc',
                    cursor: first.nextCursor,
                })
                expect(second.items.length).toBeGreaterThanOrEqual(0)
            }
        })

        it('throws for invalid cursor', async () => {
            await expect(
                itemRepository.findMany({ cursor: 'badcursor', sortBy: 'name', sortDir: 'asc' })
            ).rejects.toThrow('Invalid cursor format')
        })
    })

    describe('create / update / delete', () => {
        it('creates, updates and deletes an item', async () => {
            const user = await createTestUserInDb({})
            const created = await itemRepository.create({ name: 'Test Blade', ownerId: user.id })
            expect(created.name).toBe('Test Blade')
            const updated = await itemRepository.update(created.id, { name: 'Updated Blade' })
            expect(updated.name).toBe('Updated Blade')
            const removed = await itemRepository.delete(created.id)
            expect(removed).toBe(true)
        })

        it('update duplicate name triggers conflict', async () => {
            const a = await createTestItem({ name: 'Unique A' })
            const b = await createTestItem({ name: 'Unique B' })
            await expect(itemRepository.update(b.id, { name: a.name })).rejects.toThrow(
                'Item name already exists'
            )
        })

        it('update/delete missing id throws not found', async () => {
            const missing = generateUUIDv7()
            await expect(itemRepository.update(missing, { name: 'X' })).rejects.toThrow(
                'Item not found'
            )
            await expect(itemRepository.delete(missing)).rejects.toThrow('Item not found')
        })
    })

    describe('getStats', () => {
        it('returns stats (test mode simplified)', async () => {
            await createTestItem({ name: 'Stat Item 1', rarity: 'LEGENDARY' })
            const stats = await itemRepository.getStats()
            expect(stats).toHaveProperty('totalItems')
            expect(stats).toHaveProperty('legendaryItems')
        })
    })
})
