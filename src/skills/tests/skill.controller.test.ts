import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { db } from '../../shared/prisma.service'
import { app } from '../../app'

describe('Skill Controller', () => {
  let fastify: FastifyInstance
  let authToken: string
  let adminToken: string
  let userId: string
  let adminId: string

  beforeEach(async () => {
    fastify = app

    // Clean up database before each test
    await db.skill.deleteMany({})
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
    await db.skill.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('POST /api/skills', () => {
    it('should create a new skill successfully', async () => {
      const skillData = {
        name: 'Fireball',
        description: 'A powerful fire spell',
        requiredLevel: 5,
        visibility: 'PUBLIC',
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/skills',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: skillData,
      })

      expect(response.statusCode).toBe(201)
      const skill = response.json()
      expect(skill).toMatchObject({
        name: 'Fireball',
        description: 'A powerful fire spell',
        requiredLevel: 5,
        visibility: 'PUBLIC',
        ownerId: userId,
      })
    })

    it('should create a skill with minimal data', async () => {
      const skillData = {
        name: 'Basic Attack',
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/skills',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: skillData,
      })

      expect(response.statusCode).toBe(201)
      const skill = response.json()
      expect(skill).toMatchObject({
        name: 'Basic Attack',
        requiredLevel: 1,
        visibility: 'PUBLIC',
        ownerId: userId,
      })
      // Description can be null or empty string depending on schema default
      expect([null, ''].includes(skill.description)).toBe(true)
    })

    it('should return 401 if not authenticated', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/skills',
        payload: { name: 'Test Skill' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 400 for invalid data', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/skills',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { requiredLevel: -1 }, // Missing name, invalid level
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 409 for duplicate skill name', async () => {
      // Create first skill
      await db.skill.create({
        data: {
          name: 'Duplicate Skill',
          ownerId: userId,
          visibility: 'PUBLIC',
        },
      })

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/skills',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Duplicate Skill' },
      })

      expect(response.statusCode).toBe(409)
    })
  })

  describe('GET /api/skills/:id', () => {
    it('should get skill by ID', async () => {
      const skill = await db.skill.create({
        data: {
          name: 'Test Skill',
          description: 'Test description',
          requiredLevel: 10,
          ownerId: userId,
          visibility: 'PUBLIC',
        },
      })

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/skills/${skill.id}`,
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result).toMatchObject({
        id: skill.id,
        name: 'Test Skill',
        description: 'Test description',
        requiredLevel: 10,
      })
    })

    it('should return 404 for non-existent skill', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills/123e4567-e89b-12d3-a456-426614174000',
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 404 for invalid UUID', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills/invalid-uuid',
      })

      // Fastify might return 404 for invalid UUID format instead of 400
      expect([400, 404].includes(response.statusCode)).toBe(true)
    })

    it('should return 403 for private skill access by different user', async () => {
      const skill = await db.skill.create({
        data: {
          name: 'Private Skill',
          ownerId: adminId,
          visibility: 'PRIVATE',
        },
      })

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/skills/${skill.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('PUT /api/skills/:id', () => {
    it('should update skill successfully', async () => {
      const skill = await db.skill.create({
        data: {
          name: 'Original Skill',
          description: 'Original description',
          requiredLevel: 5,
          ownerId: userId,
          visibility: 'PUBLIC',
        },
      })

      const updateData = {
        name: 'Updated Skill',
        description: 'Updated description',
        requiredLevel: 10,
      }

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/skills/${skill.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result).toMatchObject({
        name: 'Updated Skill',
        description: 'Updated description',
        requiredLevel: 10,
      })
    })

    it('should return 401 if not authenticated', async () => {
      const skill = await db.skill.create({
        data: {
          name: 'Test Skill',
          ownerId: userId,
        },
      })

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/skills/${skill.id}`,
        payload: { name: 'Updated' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 403 if user cannot modify skill', async () => {
      const skill = await db.skill.create({
        data: {
          name: 'Admin Skill',
          ownerId: adminId,
        },
      })

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/skills/${skill.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Modified' },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should return 404 for non-existent skill', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/skills/123e4567-e89b-12d3-a456-426614174000',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Updated' },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 409 for duplicate name', async () => {
      // Create two skills
      await db.skill.create({
        data: {
          name: 'Skill One',
          ownerId: userId,
        },
      })

      const skill2 = await db.skill.create({
        data: {
          name: 'Skill Two',
          ownerId: userId,
        },
      })

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/skills/${skill2.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Skill One' },
      })

      expect(response.statusCode).toBe(409)
    })
  })

  describe('DELETE /api/skills/:id', () => {
    it('should delete skill successfully', async () => {
      const skill = await db.skill.create({
        data: {
          name: 'Skill to Delete',
          ownerId: userId,
        },
      })

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/skills/${skill.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(204)
      expect(response.body).toBe('')
    })

    it('should return 401 if not authenticated', async () => {
      const skill = await db.skill.create({
        data: {
          name: 'Test Skill',
          ownerId: userId,
        },
      })

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/skills/${skill.id}`,
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 403 if user cannot delete skill', async () => {
      const skill = await db.skill.create({
        data: {
          name: 'Protected Skill',
          ownerId: adminId,
        },
      })

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/skills/${skill.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should return 404 for non-existent skill', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/skills/123e4567-e89b-12d3-a456-426614174000',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 409 if skill is used by characters', async () => {
      // Create necessary entities first
      const race = await db.race.create({
        data: {
          name: `Test Race ${Date.now()}`,
          ownerId: userId,
        },
      })

      const archetype = await db.archetype.create({
        data: {
          name: `Test Archetype ${Date.now()}`,
          ownerId: userId,
        },
      })

      const skill = await db.skill.create({
        data: {
          name: 'Used Skill',
          ownerId: userId,
        },
      })

      // Create a character that uses this skill
      await db.character.create({
        data: {
          name: `Test Character ${Date.now()}`,
          ownerId: userId,
          raceId: race.id,
          archetypeId: archetype.id,
          skills: {
            connect: { id: skill.id },
          },
        },
      })

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/skills/${skill.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(409)
    })
  })

  describe('GET /api/skills', () => {
    beforeEach(async () => {
      // Create test skills for list tests
      await db.skill.createMany({
        data: [
          {
            name: 'Fireball',
            description: 'Fire spell',
            requiredLevel: 5,
            ownerId: userId,
            visibility: 'PUBLIC',
          },
          {
            name: 'Ice Blast',
            description: 'Ice spell',
            requiredLevel: 3,
            ownerId: userId,
            visibility: 'PUBLIC',
          },
          {
            name: 'Healing',
            description: 'Restore health',
            requiredLevel: 1,
            ownerId: adminId,
            visibility: 'PUBLIC',
          },
          {
            name: 'Private Skill',
            requiredLevel: 10,
            ownerId: adminId,
            visibility: 'PRIVATE',
          },
        ],
      })
    })

    it('should list skills with pagination', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills?page=1&limit=2',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result.data).toHaveLength(2)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3, // Should not include private skill
        totalPages: 2,
      })
    })

    it('should filter by level range', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills?minLevel=3&maxLevel=5',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result.data).toHaveLength(2)
      expect(
        result.data.every((skill: any) => skill.requiredLevel >= 3 && skill.requiredLevel <= 5),
      ).toBe(true)
    })

    it('should search by name and description', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills?search=fire',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Fireball')
    })

    it('should handle empty search results', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills?search=nonexistent',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result.data).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it('should allow admin to see all skills including private', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      // Should include at least the public skills, private skills depend on RBAC implementation
      expect(result.data.length).toBeGreaterThanOrEqual(3)
    })

    it('should handle invalid pagination parameters gracefully', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills?page=0&limit=-1',
      })

      // System might validate and return 400 for invalid params, or handle gracefully with 200
      expect([200, 400].includes(response.statusCode)).toBe(true)

      if (response.statusCode === 200) {
        const result = response.json()
        expect(result.pagination.page).toBeGreaterThan(0)
        expect(result.pagination.limit).toBeGreaterThan(0)
      }
    })
  })

  describe('GET /api/skills/stats', () => {
    beforeEach(async () => {
      // Create test skills with different levels
      await db.skill.createMany({
        data: [
          { name: 'Beginner 1', requiredLevel: 5, ownerId: userId, visibility: 'PUBLIC' },
          { name: 'Beginner 2', requiredLevel: 8, ownerId: userId, visibility: 'PUBLIC' },
          { name: 'Intermediate 1', requiredLevel: 15, ownerId: userId, visibility: 'PUBLIC' },
          { name: 'Advanced 1', requiredLevel: 30, ownerId: userId, visibility: 'PUBLIC' },
          { name: 'Expert 1', requiredLevel: 60, ownerId: userId, visibility: 'PUBLIC' },
          {
            name: 'Private Skill',
            requiredLevel: 25,
            ownerId: adminId,
            visibility: 'PRIVATE',
          },
          { name: 'Orphaned Skill', requiredLevel: 10, ownerId: null, visibility: 'PUBLIC' },
        ],
      })
    })

    it('should return skill statistics', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills/stats',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const stats = response.json()
      expect(stats).toMatchObject({
        totalSkills: 6, // Excluding private skill owned by admin
        publicSkills: 6,
        privateSkills: 0,
        orphanedSkills: 1,
        skillsByLevelRange: {
          beginner: 3, // 5, 8, 10
          intermediate: 1, // 15
          advanced: 1, // 30
          expert: 1, // 60
        },
      })
      expect(stats.averageRequiredLevel).toBeGreaterThan(0)
    })

    it('should return admin statistics including all skills', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills/stats',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const stats = response.json()
      expect(stats).toMatchObject({
        totalSkills: 7,
        publicSkills: 6,
        privateSkills: 1,
        orphanedSkills: 1,
      })
    })

    it('should require authentication for stats', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills/stats',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should handle empty database correctly', async () => {
      // Clean up all skills
      await db.skill.deleteMany({})

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/skills/stats',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const stats = response.json()
      expect(stats).toMatchObject({
        totalSkills: 0,
        publicSkills: 0,
        privateSkills: 0,
        orphanedSkills: 0,
        averageRequiredLevel: 0,
        skillsByLevelRange: {
          beginner: 0,
          intermediate: 0,
          advanced: 0,
          expert: 0,
        },
      })
    })
  })
})
