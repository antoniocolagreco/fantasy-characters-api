import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { db } from '../../shared/database/index'
import { app } from '../../app'

describe('Race Controller', () => {
  let fastify: FastifyInstance
  let authToken: string
  let userId: string
  let adminId: string

  beforeEach(async () => {
    fastify = app

    // Clean up database before each test in proper order due to foreign key constraints
    await db.character.deleteMany({})
    await db.archetype.deleteMany({})
    await db.race.deleteMany({})
    await db.image.deleteMany({})
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

    // Create JWT token for testing
    authToken = fastify.jwt.sign({
      userId: userId,
      role: 'USER',
    })
  })

  afterEach(async () => {
    // Clean up database after each test in proper order due to foreign key constraints
    await db.character.deleteMany({})
    await db.archetype.deleteMany({})
    await db.race.deleteMany({})
    await db.image.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('POST /api/races', () => {
    it('should create a new race successfully', async () => {
      const raceData = {
        name: 'Elf',
        description: 'Graceful forest dwellers',
        strengthModifier: 8,
        intelligenceModifier: 14,
        dexterityModifier: 12,
        healthModifier: 90,
        manaModifier: 130,
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/races',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: raceData,
      })

      expect(response.statusCode).toBe(201)
      const race = JSON.parse(response.body)
      expect(race).toMatchObject({
        name: 'Elf',
        description: 'Graceful forest dwellers',
        strengthModifier: 8,
        intelligenceModifier: 14,
        dexterityModifier: 12,
        healthModifier: 90,
        manaModifier: 130,
        ownerId: userId,
        visibility: 'PUBLIC',
      })
      expect(race.id).toBeDefined()
      expect(race.createdAt).toBeDefined()
      expect(race.updatedAt).toBeDefined()
    })

    it('should create a race with default values', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/races',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Human' },
      })

      expect(response.statusCode).toBe(201)
      const race = JSON.parse(response.body)
      expect(race).toMatchObject({
        name: 'Human',
        description: '',
        strengthModifier: 10,
        constitutionModifier: 10,
        dexterityModifier: 10,
        intelligenceModifier: 10,
        wisdomModifier: 10,
        charismaModifier: 10,
        healthModifier: 100,
        manaModifier: 100,
        staminaModifier: 100,
        visibility: 'PUBLIC',
      })
    })

    it('should return 409 if race name already exists', async () => {
      // Create initial race
      await db.race.create({
        data: {
          name: 'Dwarf',
          ownerId: userId,
        },
      })

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/races',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Dwarf' },
      })

      expect(response.statusCode).toBe(409)
      expect(JSON.parse(response.body).message).toContain('already exists')
    })

    it('should return 401 if not authenticated', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/races',
        payload: { name: 'Orc' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should validate modifier ranges', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/races',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Invalid Race',
          strengthModifier: 25, // Too high
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/races/:id', () => {
    let raceId: string

    beforeEach(async () => {
      const race = await db.race.create({
        data: {
          name: 'Test Race',
          description: 'A test race',
          strengthModifier: 12,
          ownerId: userId,
          visibility: 'PUBLIC',
        },
      })
      raceId = race.id
    })

    it('should get race by ID', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/races/${raceId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const race = JSON.parse(response.body)
      expect(race).toMatchObject({
        name: 'Test Race',
        description: 'A test race',
        strengthModifier: 12,
      })
    })

    it('should return 404 if race not found', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/races/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 403 if user cannot access private race', async () => {
      // Create a private race owned by admin
      const privateRace = await db.race.create({
        data: {
          name: 'Private Race',
          visibility: 'PRIVATE',
          ownerId: adminId,
        },
      })

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/races/${privateRace.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('PUT /api/races/:id', () => {
    let raceId: string

    beforeEach(async () => {
      const race = await db.race.create({
        data: {
          name: 'Test Race',
          ownerId: userId,
        },
      })
      raceId = race.id
    })

    it('should update race successfully', async () => {
      const updateData = {
        name: 'Updated Race',
        description: 'Updated description',
        strengthModifier: 15,
      }

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/races/${raceId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)
      const race = JSON.parse(response.body)
      expect(race).toMatchObject(updateData)
    })

    it('should return 404 if race not found', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/races/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'New Name' },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 403 if user cannot modify race', async () => {
      // Create a race owned by admin
      const adminRace = await db.race.create({
        data: {
          name: 'Admin Race',
          ownerId: adminId,
        },
      })

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/races/${adminRace.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Updated Name' },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should return 401 if not authenticated', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/races/${raceId}`,
        payload: { name: 'New Name' },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /api/races/:id', () => {
    let raceId: string

    beforeEach(async () => {
      const race = await db.race.create({
        data: {
          name: 'Test Race',
          ownerId: userId,
        },
      })
      raceId = race.id
    })

    it('should delete race successfully', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/races/${raceId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(204)

      // Verify race is deleted
      const deletedRace = await db.race.findUnique({ where: { id: raceId } })
      expect(deletedRace).toBeNull()
    })

    it('should return 404 if race not found', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/races/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 403 if user cannot delete race', async () => {
      // Create a race owned by admin
      const adminRace = await db.race.create({
        data: {
          name: 'Admin Race',
          ownerId: adminId,
        },
      })

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/races/${adminRace.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should return 409 if race is used by characters', async () => {
      // Create an archetype first
      const archetype = await db.archetype.create({
        data: {
          name: 'Test Archetype',
          ownerId: adminId,
        },
      })

      // Create a character using this race
      await db.character.create({
        data: {
          name: 'Test Character',
          raceId: raceId,
          archetypeId: archetype.id,
          ownerId: userId,
        },
      })

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/races/${raceId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(409)
      expect(JSON.parse(response.body).message).toContain('is being used by')
    })

    it('should return 401 if not authenticated', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/races/${raceId}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /api/races', () => {
    beforeEach(async () => {
      // Create test races
      await db.race.createMany({
        data: [
          {
            name: 'Human',
            strengthModifier: 10,
            intelligenceModifier: 10,
            ownerId: userId,
            visibility: 'PUBLIC',
          },
          {
            name: 'Elf',
            strengthModifier: 8,
            intelligenceModifier: 14,
            ownerId: userId,
            visibility: 'PUBLIC',
          },
          {
            name: 'Dwarf',
            strengthModifier: 14,
            intelligenceModifier: 8,
            ownerId: adminId,
            visibility: 'PUBLIC',
          },
          {
            name: 'Private Race',
            strengthModifier: 12,
            ownerId: adminId,
            visibility: 'PRIVATE',
          },
        ],
      })
    })

    it('should list all accessible races', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/races',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.races).toHaveLength(3) // Excluding private race
      expect(result.total).toBe(3)
      expect(result.races.map((r: any) => r.name)).toEqual(
        expect.arrayContaining(['Human', 'Elf', 'Dwarf']),
      )
    })

    it('should filter by strength modifier', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/races?strengthModifier=14',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.races).toHaveLength(1)
      expect(result.races[0].name).toBe('Dwarf')
    })

    it('should filter by intelligence modifier', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/races?intelligenceModifier=14',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.races).toHaveLength(1)
      expect(result.races[0].name).toBe('Elf')
    })

    it('should search by name', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/races?search=Hum',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.races).toHaveLength(1)
      expect(result.races[0].name).toBe('Human')
    })

    it('should paginate results', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/races?page=1&limit=2',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.races).toHaveLength(2)
      expect(result.total).toBe(3)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(2)
      expect(result.totalPages).toBe(2)
    })

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/races?page=-1&limit=0',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(400) // Schema validation should fail
    })
  })

  describe('GET /api/races/stats', () => {
    beforeEach(async () => {
      // Create test races for statistics
      await db.race.createMany({
        data: [
          {
            name: 'Human',
            strengthModifier: 10,
            intelligenceModifier: 10,
            ownerId: userId,
            visibility: 'PUBLIC',
          },
          {
            name: 'Elf',
            strengthModifier: 8,
            intelligenceModifier: 14,
            dexterityModifier: 12,
            healthModifier: 90,
            manaModifier: 130,
            ownerId: userId,
            visibility: 'PUBLIC',
          },
          {
            name: 'Dwarf',
            strengthModifier: 14,
            constitutionModifier: 13,
            intelligenceModifier: 8,
            healthModifier: 120,
            manaModifier: 80,
            ownerId: adminId,
            visibility: 'PUBLIC',
          },
          {
            name: 'Private Race',
            strengthModifier: 12,
            ownerId: adminId,
            visibility: 'PRIVATE',
          },
          {
            name: 'Orphaned Race',
            strengthModifier: 11,
            ownerId: null,
            visibility: 'PUBLIC',
          },
        ],
      })
    })

    it('should return race statistics for authenticated user', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/races/stats',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const stats = JSON.parse(response.body)
      expect(stats).toMatchObject({
        totalRaces: 4, // User can see 4 races (excluding private)
        publicRaces: 4,
        privateRaces: 0, // User cannot see admin's private races
        orphanedRaces: 1,
      })
      expect(stats.averageModifiers).toBeDefined()
      expect(stats.popularModifierRanges).toBeDefined()
    })

    it('should return 401 if not authenticated', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/races/stats',
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
