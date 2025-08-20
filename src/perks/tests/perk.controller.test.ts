import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { db } from '../../shared/database/index.js'
import { app } from '../../app.js'

describe('Perk Controller', () => {
  let fastify: FastifyInstance
  let authToken: string
  let adminToken: string
  let userId: string
  let adminId: string

  beforeEach(async () => {
    fastify = app

    // Clean up database before each test
    await db.perk.deleteMany({})
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
    await db.perk.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('POST /api/perks', () => {
    it('should create a new perk successfully', async () => {
      const perkData = {
        name: 'Toughness',
        description: 'Increases maximum health by 20%',
        requiredLevel: 3,
        visibility: 'PUBLIC',
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: perkData,
      })

      expect(response.statusCode).toBe(201)
      const perk = JSON.parse(response.body)
      expect(perk).toMatchObject({
        name: 'Toughness',
        description: 'Increases maximum health by 20%',
        requiredLevel: 3,
        visibility: 'PUBLIC',
        ownerId: userId,
      })
    })

    it('should create a perk with default values', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/perks',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Basic Perk',
        },
      })

      expect(response.statusCode).toBe(201)
      const perk = JSON.parse(response.body)
      expect(perk).toMatchObject({
        name: 'Basic Perk',
        description: '',
        requiredLevel: 0,
        visibility: 'PUBLIC',
      })
    })

    it('should return 401 when not authenticated', async () => {
      const perkData = {
        name: 'Test Perk',
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        payload: perkData,
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 400 for invalid data', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 409 for duplicate perk name', async () => {
      const perkData = {
        name: 'Duplicate Perk',
      }

      // Create first perk
      await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: perkData,
      })

      // Try to create duplicate
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: perkData,
      })

      expect(response.statusCode).toBe(409)
      const error = JSON.parse(response.body)
      expect(error.message).toContain('already exists')
    })
  })

  describe('GET /api/perks/:id', () => {
    it('should get a perk by ID', async () => {
      // Create a perk first
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Perk',
          description: 'A test perk',
          requiredLevel: 5,
        },
      })

      const createdPerk = JSON.parse(createResponse.body)

      // Get the perk
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/perks/${createdPerk.id}`,
      })

      expect(response.statusCode).toBe(200)
      const perk = JSON.parse(response.body)
      expect(perk).toMatchObject({
        name: 'Test Perk',
        description: 'A test perk',
        requiredLevel: 5,
      })
    })

    it('should return 404 for non-existent perk', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/perks/non-existent-id',
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('PUT /api/perks/:id', () => {
    it('should update a perk successfully', async () => {
      // Create a perk first
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Original Perk',
          description: 'Original description',
          requiredLevel: 5,
        },
      })

      const createdPerk = JSON.parse(createResponse.body)

      // Update the perk
      const updateData = {
        name: 'Updated Perk',
        description: 'Updated description',
        requiredLevel: 10,
      }

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/perks/${createdPerk.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)
      const updatedPerk = JSON.parse(response.body)
      expect(updatedPerk).toMatchObject({
        name: 'Updated Perk',
        description: 'Updated description',
        requiredLevel: 10,
      })
    })

    it('should return 401 when not authenticated', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/perks/some-id',
        payload: { name: 'Updated Perk' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 404 for non-existent perk', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/perks/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Updated Perk' },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 403 when user tries to update perk they do not own', async () => {
      // Create perk with admin user
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'Admin Perk',
        },
      })

      const createdPerk = JSON.parse(createResponse.body)

      // Try to update with regular user
      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/perks/${createdPerk.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Hacked Perk' },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('DELETE /api/perks/:id', () => {
    it('should delete a perk successfully', async () => {
      // Create a perk first
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Perk to Delete',
        },
      })

      const createdPerk = JSON.parse(createResponse.body)

      // Delete the perk
      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/perks/${createdPerk.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(204)

      // Verify perk is deleted
      const getResponse = await fastify.inject({
        method: 'GET',
        url: `/api/perks/${createdPerk.id}`,
      })

      expect(getResponse.statusCode).toBe(404)
    })

    it('should return 401 when not authenticated', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/perks/some-id',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 404 for non-existent perk', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/perks/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET /api/perks', () => {
    beforeEach(async () => {
      // Create test perks with different levels
      await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: 'Beginner Perk', requiredLevel: 1, visibility: 'PUBLIC' },
      })
      await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: 'Intermediate Perk', requiredLevel: 15, visibility: 'PUBLIC' },
      })
      await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: 'Advanced Perk', requiredLevel: 30, visibility: 'PUBLIC' },
      })
      await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: 'No Requirement Perk', requiredLevel: 0, visibility: 'PUBLIC' },
      })
    })

    it('should list all perks with default pagination', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/perks',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toHaveLength(4)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 4,
        totalPages: 1,
      })
    })

    it('should filter perks by minimum level', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/perks?minLevel=15',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toHaveLength(2)
      expect(result.data.every((perk: any) => perk.requiredLevel >= 15)).toBe(true)
    })

    it('should filter perks by maximum level', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/perks?maxLevel=15',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toHaveLength(3)
      expect(result.data.every((perk: any) => perk.requiredLevel <= 15)).toBe(true)
    })

    it('should search perks by name', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/perks?search=beginner',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Beginner Perk')
    })

    it('should apply pagination correctly', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/perks?page=1&limit=2',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toHaveLength(2)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 4,
        totalPages: 2,
      })
    })
  })

  describe('GET /api/perks/stats', () => {
    beforeEach(async () => {
      // Create test perks with different levels and visibility
      await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: 'Public Perk 1', requiredLevel: 0, visibility: 'PUBLIC' },
      })
      await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: 'Public Perk 2', requiredLevel: 5, visibility: 'PUBLIC' },
      })
      await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: 'Private Perk', requiredLevel: 15, visibility: 'PRIVATE' },
      })
      await fastify.inject({
        method: 'POST',
        url: '/api/perks',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: 'Advanced Perk', requiredLevel: 30, visibility: 'PUBLIC' },
      })
    })

    it('should return perk statistics for admin user', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/perks/stats',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const stats = JSON.parse(response.body)
      expect(stats).toMatchObject({
        totalPerks: 4,
        publicPerks: 3,
        privatePerks: 1,
        orphanedPerks: 0,
      })
      expect(stats.averageRequiredLevel).toBeGreaterThanOrEqual(0)
      expect(stats.perksByLevelRange).toBeDefined()
    })

    it('should return 403 for regular user', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/perks/stats',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should return 401 when not authenticated', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/perks/stats',
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
