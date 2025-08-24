import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { db } from '../../shared/prisma.service'
import { app } from '../../app'

describe('Item Controller', () => {
  let fastify: FastifyInstance
  let authToken: string
  let adminToken: string
  let userId: string
  let adminId: string

  beforeEach(async () => {
    fastify = app

    // Clean up database before each test
    await db.item.deleteMany({})
    await db.equipment.deleteMany({})
    await db.character.deleteMany({})
    await db.race.deleteMany({})
    await db.archetype.deleteMany({})
    await db.user.deleteMany({})

    // Create a test user
    const createdUser = await db.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        name: 'Test User',
        role: 'USER',
        isActive: true,
        isEmailVerified: true,
      },
    })

    // Create an admin user
    const createdAdmin = await db.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: 'hashedpassword123',
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
      },
    })

    userId = createdUser.id
    adminId = createdAdmin.id

    // Create JWT tokens for testing
    authToken = fastify.jwt.sign({
      userId: userId,
      role: 'USER',
    })

    adminToken = fastify.jwt.sign({
      userId: adminId,
      role: 'ADMIN',
    })
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.item.deleteMany({})
    await db.equipment.deleteMany({})
    await db.character.deleteMany({})
    await db.race.deleteMany({})
    await db.archetype.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('POST /api/items', () => {
    it('should create a new item successfully', async () => {
      const itemData = {
        name: 'Iron Sword',
        description: 'A well-balanced sword made of iron',
        damage: 25,
        rarity: 'COMMON',
        slot: 'ONE_HAND',
        requiredLevel: 5,
        weight: 2.5,
        value: 100,
        visibility: 'PUBLIC',
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: itemData,
      })

      expect(response.statusCode).toBe(201)
      const item = JSON.parse(response.body)
      expect(item).toMatchObject({
        name: 'Iron Sword',
        description: 'A well-balanced sword made of iron',
        damage: 25,
        rarity: 'COMMON',
        slot: 'ONE_HAND',
        requiredLevel: 5,
        weight: 2.5,
        value: 100,
        visibility: 'PUBLIC',
        ownerId: userId,
      })
    })

    it('should create an item with default values', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Basic Potion',
        },
      })

      expect(response.statusCode).toBe(201)
      const item = JSON.parse(response.body)
      expect(item).toMatchObject({
        name: 'Basic Potion',
        rarity: 'COMMON',
        slot: 'NONE',
        requiredLevel: 1,
        weight: 1.0,
        durability: 100,
        maxDurability: 100,
        value: 0,
        is2Handed: false,
        isThrowable: false,
        isConsumable: false,
        isQuestItem: false,
        isTradeable: true,
        visibility: 'PUBLIC',
      })
    })

    it('should create armor with defense stats', async () => {
      const itemData = {
        name: 'Leather Armor',
        description: 'Light armor for beginners',
        defense: 15,
        rarity: 'COMMON',
        slot: 'CHEST',
        requiredLevel: 1,
        weight: 5.0,
        value: 75,
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: itemData,
      })

      expect(response.statusCode).toBe(201)
      const item = JSON.parse(response.body)
      expect(item).toMatchObject({
        name: 'Leather Armor',
        defense: 15,
        slot: 'CHEST',
        damage: 0,
      })
    })

    it('should create a consumable item', async () => {
      const itemData = {
        name: 'Health Potion',
        description: 'Restores 50 health points',
        bonusHealth: 50,
        rarity: 'COMMON',
        slot: 'NONE',
        isConsumable: true,
        value: 25,
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: itemData,
      })

      expect(response.statusCode).toBe(201)
      const item = JSON.parse(response.body)
      expect(item).toMatchObject({
        name: 'Health Potion',
        bonusHealth: 50,
        isConsumable: true,
      })
    })

    it('should require authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        payload: {
          name: 'Test Item',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 409 for duplicate item name', async () => {
      const itemData = {
        name: 'Duplicate Item',
      }

      // Create first item
      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: itemData,
      })

      // Try to create duplicate
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: itemData,
      })

      expect(response.statusCode).toBe(409)
    })

    it('should validate durability constraints', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Broken Item',
          durability: 150,
          maxDurability: 100,
        },
      })

      expect(response.statusCode).toBe(409)
    })

    it('should validate two-handed weapon constraints', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Invalid Two-Handed',
          slot: 'HEAD',
          is2Handed: true,
        },
      })

      expect(response.statusCode).toBe(409)
    })
  })

  describe('GET /api/items/:id', () => {
    it('should get an item by ID', async () => {
      // Create an item first
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Item',
          description: 'A test item',
        },
      })

      const createdItem = JSON.parse(createResponse.body)

      // Get the item
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/items/${createdItem.id}`,
      })

      expect(response.statusCode).toBe(200)
      const item = JSON.parse(response.body)
      expect(item).toMatchObject({
        name: 'Test Item',
        description: 'A test item',
      })
    })

    it('should return 404 for non-existent item', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/items/non-existent-id',
      })

      expect(response.statusCode).toBe(404)
    })

    it('should respect visibility permissions', async () => {
      // Create a private item
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Private Item',
          visibility: 'PRIVATE',
        },
      })

      const createdItem = JSON.parse(createResponse.body)

      // Try to access without authentication
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/items/${createdItem.id}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PUT /api/items/:id', () => {
    it('should update an item successfully', async () => {
      // Create an item first
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Original Item',
          description: 'Original description',
          damage: 10,
        },
      })

      const createdItem = JSON.parse(createResponse.body)

      // Update the item
      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/items/${createdItem.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          description: 'Updated description',
          damage: 15,
        },
      })

      expect(response.statusCode).toBe(200)
      const item = JSON.parse(response.body)
      expect(item).toMatchObject({
        name: 'Original Item',
        description: 'Updated description',
        damage: 15,
      })
    })

    it('should require authentication', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/items/some-id',
        payload: {
          description: 'Updated',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should validate name uniqueness', async () => {
      // Create two items
      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Item 1' },
      })

      const item2Response = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Item 2' },
      })

      const item2 = JSON.parse(item2Response.body)

      // Try to update item 2 to have the same name as item 1
      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/items/${item2.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Item 1' },
      })

      expect(response.statusCode).toBe(409)
    })
  })

  describe('DELETE /api/items/:id', () => {
    it('should delete an item successfully', async () => {
      // Create an item first
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Item',
        },
      })

      const createdItem = JSON.parse(createResponse.body)

      // Delete the item
      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/items/${createdItem.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(204)

      // Verify item is deleted
      const getResponse = await fastify.inject({
        method: 'GET',
        url: `/api/items/${createdItem.id}`,
      })

      expect(getResponse.statusCode).toBe(404)
    })

    it('should require authentication', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/items/some-id',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should prevent deletion of equipped items', async () => {
      // Create required entities
      const race = await db.race.create({
        data: { name: 'Human', ownerId: userId },
      })

      const archetype = await db.archetype.create({
        data: { name: 'Fighter', ownerId: userId },
      })

      const character = await db.character.create({
        data: {
          name: 'Test Character',
          raceId: race.id,
          archetypeId: archetype.id,
          ownerId: userId,
        },
      })

      // Create an item
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Equipped Item',
          slot: 'HEAD',
        },
      })

      const createdItem = JSON.parse(createResponse.body)

      // Equip the item
      await db.equipment.create({
        data: {
          characterId: character.id,
          headId: createdItem.id,
        },
      })

      // Try to delete the equipped item
      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/items/${createdItem.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(409)
    })
  })

  describe('GET /api/items', () => {
    beforeEach(async () => {
      // Create test items
      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Common Sword', rarity: 'COMMON' },
      })

      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Rare Shield', rarity: 'RARE' },
      })

      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Epic Armor', rarity: 'EPIC' },
      })
    })

    it('should list items with pagination', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/items?page=1&limit=2',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toHaveLength(2)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      })
    })

    it('should filter items by rarity', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/items?rarity=RARE',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Rare Shield')
    })

    it('should search items by name', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/items?search=Sword',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Common Sword')
    })

    it('should filter by level range', async () => {
      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'High Level Item',
          requiredLevel: 50,
          rarity: 'LEGENDARY',
        },
      })

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/items?minLevel=40&maxLevel=60',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('High Level Item')
    })

    it('should filter by value range', async () => {
      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Expensive Item',
          value: 1000,
        },
      })

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/items?minValue=500&maxValue=1500',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Expensive Item')
    })

    it('should filter by item flags', async () => {
      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Consumable Item',
          isConsumable: true,
        },
      })

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/items?isConsumable=true',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Consumable Item')
    })
  })

  describe('GET /api/items/stats', () => {
    beforeEach(async () => {
      // Create test items with various properties
      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Common Sword',
          rarity: 'COMMON',
          slot: 'ONE_HAND',
          damage: 10,
        },
      })

      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Rare Armor',
          rarity: 'RARE',
          slot: 'CHEST',
          defense: 15,
        },
      })

      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Magic Ring',
          rarity: 'EPIC',
          slot: 'RING',
        },
      })

      await fastify.inject({
        method: 'POST',
        url: '/api/items',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Health Potion',
          rarity: 'COMMON',
          isConsumable: true,
        },
      })
    })

    it('should return comprehensive item statistics for admin', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/items/stats',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const stats = JSON.parse(response.body)

      expect(stats).toMatchObject({
        totalItems: 4,
        publicItems: 4,
        privateItems: 0,
        orphanedItems: 0,
      })

      expect(stats.itemsByRarity).toMatchObject({
        common: 2,
        rare: 1,
        epic: 1,
        legendary: 0,
      })

      expect(stats.itemsByType).toMatchObject({
        weapons: 1,
        armor: 1,
        accessories: 1,
        consumables: 1,
      })
    })

    it('should require admin permissions', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/items/stats',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should require authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/items/stats',
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
