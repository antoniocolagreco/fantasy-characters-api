import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { db } from '../../shared/prisma.service'
import { app } from '../../app'

describe('Archetype Controller', () => {
  let fastify: FastifyInstance
  let authToken: string
  let userId: string
  let adminId: string

  beforeEach(async () => {
    fastify = app

    await db.character.deleteMany({})
    await db.archetype.deleteMany({})
    await db.race.deleteMany({})
    await db.image.deleteMany({})
    await db.user.deleteMany({})

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

    authToken = fastify.jwt.sign({
      userId: userId,
      role: 'USER',
      isActive: true,
      isEmailVerified: true,
    })
  })

  afterEach(async () => {
    await db.character.deleteMany({})
    await db.archetype.deleteMany({})
    await db.race.deleteMany({})
    await db.image.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('POST /api/archetypes', () => {
    it('should create an archetype successfully', async () => {
      const archetypeData = {
        name: 'Warrior',
        description: 'Strong melee fighter',
        visibility: 'PUBLIC',
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: archetypeData,
      })

      expect(response.statusCode).toBe(201)
      const responseBody = JSON.parse(response.body)
      expect(responseBody).toMatchObject({
        name: 'Warrior',
        description: 'Strong melee fighter',
        ownerId: userId,
        visibility: 'PUBLIC',
      })
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '',
        description: 'Strong melee fighter',
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/archetypes',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: invalidData,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 401 without authentication', async () => {
      const archetypeData = {
        name: 'Warrior',
        description: 'Strong melee fighter',
        visibility: 'PUBLIC',
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/archetypes',
        payload: archetypeData,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /api/archetypes', () => {
    beforeEach(async () => {
      await db.archetype.createMany({
        data: [
          {
            name: 'Warrior',
            description: 'Strong melee fighter',
            ownerId: userId,
            visibility: 'PUBLIC',
          },
          {
            name: 'Mage',
            description: 'Magical spellcaster',
            ownerId: userId,
            visibility: 'PUBLIC',
          },
        ],
      })
    })

    it('should list archetypes successfully', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/archetypes',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseBody = JSON.parse(response.body)
      expect(responseBody.archetypes).toHaveLength(2)
      expect(responseBody.pagination).toBeDefined()
    })

    it('should filter archetypes by search', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/archetypes?search=Warrior',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseBody = JSON.parse(response.body)
      expect(responseBody.archetypes).toHaveLength(1)
      expect(responseBody.archetypes[0].name).toBe('Warrior')
    })
  })

  describe('GET /api/archetypes/:id', () => {
    let archetypeId: string

    beforeEach(async () => {
      const archetype = await db.archetype.create({
        data: {
          name: 'Warrior',
          description: 'Strong melee fighter',
          ownerId: userId,
          visibility: 'PUBLIC',
        },
      })
      archetypeId = archetype.id
    })

    it('should get archetype by id successfully', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/archetypes/${archetypeId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseBody = JSON.parse(response.body)
      expect(responseBody).toMatchObject({
        id: archetypeId,
        name: 'Warrior',
        description: 'Strong melee fighter',
      })
    })

    it('should return 404 for non-existent archetype', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/archetypes/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('PUT /api/archetypes/:id', () => {
    let archetypeId: string

    beforeEach(async () => {
      const archetype = await db.archetype.create({
        data: {
          name: 'Warrior',
          description: 'Strong melee fighter',
          ownerId: userId,
          visibility: 'PUBLIC',
        },
      })
      archetypeId = archetype.id
    })

    it('should update archetype successfully', async () => {
      const updateData = {
        name: 'Elite Warrior',
        description: 'Very strong melee fighter',
      }

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/archetypes/${archetypeId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)
      const responseBody = JSON.parse(response.body)
      expect(responseBody).toMatchObject({
        id: archetypeId,
        name: 'Elite Warrior',
        description: 'Very strong melee fighter',
      })
    })

    it('should return 404 for non-existent archetype', async () => {
      const updateData = {
        name: 'Updated Warrior',
      }

      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/archetypes/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: updateData,
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('DELETE /api/archetypes/:id', () => {
    let archetypeId: string

    beforeEach(async () => {
      const archetype = await db.archetype.create({
        data: {
          name: 'Warrior',
          description: 'Strong melee fighter',
          ownerId: userId,
          visibility: 'PUBLIC',
        },
      })
      archetypeId = archetype.id
    })

    it('should delete archetype successfully', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/archetypes/${archetypeId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(204)

      const deletedArchetype = await db.archetype.findUnique({
        where: { id: archetypeId },
      })
      expect(deletedArchetype).toBeNull()
    })

    it('should return 404 for non-existent archetype', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/archetypes/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET /api/archetypes/stats', () => {
    beforeEach(async () => {
      await db.archetype.createMany({
        data: [
          {
            name: 'Warrior',
            description: 'Strong melee fighter',
            ownerId: userId,
            visibility: 'PUBLIC',
          },
          {
            name: 'Mage',
            description: 'Magical spellcaster',
            ownerId: userId,
            visibility: 'PUBLIC',
          },
        ],
      })
    })

    it('should return statistics for admin', async () => {
      const adminToken = fastify.jwt.sign({
        userId: adminId,
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
      })

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/archetypes/stats',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.statusCode !== 200) {
        console.warn('Stats endpoint error response:', response.body)
      }
      expect(response.statusCode).toBe(200)
      const responseBody = JSON.parse(response.body)
      expect(responseBody).toMatchObject({
        totalCount: 2,
      })
    })

    it('should return 403 for non-admin user', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/archetypes/stats',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
    })
  })
})
