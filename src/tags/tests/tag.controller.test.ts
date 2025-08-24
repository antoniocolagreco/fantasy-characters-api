import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { db } from '../../shared/prisma.service'
import { app } from '../../app'

describe('Tag Controller', () => {
  let fastify: FastifyInstance
  let authToken: string
  let userId: string

  beforeEach(async () => {
    // Clean up database before each test
    await db.tag.deleteMany({})
    await db.user.deleteMany({})

    // Create a test user and get auth token
    const testUser = await db.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        name: 'Test User',
        role: 'USER',
        isActive: true,
        isEmailVerified: true,
      },
    })
    userId = testUser.id

    // Mock authentication token
    fastify = app
    authToken = fastify.jwt.sign({
      userId: testUser.id,
      role: testUser.role,
    })
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.tag.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('POST /api/tags', () => {
    it('should create a new tag successfully', async () => {
      const tagData = {
        name: 'test-tag',
        description: 'A test tag',
        visibility: 'PUBLIC',
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: tagData,
      })

      expect(response.statusCode).toBe(201)
      const responseBody = JSON.parse(response.payload)
      expect(responseBody).toMatchObject({
        name: 'test-tag',
        description: 'A test tag',
        visibility: 'PUBLIC',
        ownerId: userId,
      })
    })

    it('should return 400 for invalid tag data', async () => {
      const invalidTagData = {
        name: '', // Empty name should be invalid
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: invalidTagData,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 401 for unauthorized requests', async () => {
      const tagData = {
        name: 'test-tag',
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/tags',
        payload: tagData,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /api/tags/:id', () => {
    it('should get tag by ID successfully', async () => {
      // Create a tag first
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'get-test-tag',
          description: 'Tag for get test',
        },
      })

      const createdTag = JSON.parse(createResponse.payload)

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/tags/${createdTag.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseBody = JSON.parse(response.payload)
      expect(responseBody).toMatchObject({
        id: createdTag.id,
        name: 'get-test-tag',
        description: 'Tag for get test',
      })
    })

    it('should return 404 for non-existent tag', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/tags/123e4567-e89b-12d3-a456-426614174000',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('PUT /api/tags/:id', () => {
    it('should update tag successfully', async () => {
      // Create a tag first
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'update-test-tag',
          description: 'Original description',
        },
      })

      const createdTag = JSON.parse(createResponse.payload)

      const updateData = {
        name: 'updated-tag-name',
        description: 'Updated description',
      }

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/tags/${createdTag.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: updateData,
      })

      expect(response.statusCode).toBe(200)
      const responseBody = JSON.parse(response.payload)
      expect(responseBody).toMatchObject({
        id: createdTag.id,
        name: 'updated-tag-name',
        description: 'Updated description',
      })
    })

    it('should return 404 for non-existent tag', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/tags/123e4567-e89b-12d3-a456-426614174000',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'new-name',
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('DELETE /api/tags/:id', () => {
    it('should delete tag successfully', async () => {
      // Create a tag first
      const createResponse = await fastify.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'delete-test-tag',
        },
      })

      const createdTag = JSON.parse(createResponse.payload)

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/tags/${createdTag.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(204)
      expect(response.payload).toBe('')
    })

    it('should return 404 for non-existent tag', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/tags/123e4567-e89b-12d3-a456-426614174000',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET /api/tags', () => {
    it('should list tags with pagination', async () => {
      // Create a few tags first
      await fastify.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'tag1' },
      })

      await fastify.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'tag2' },
      })

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/tags?page=1&limit=10',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseBody = JSON.parse(response.payload)
      expect(responseBody).toHaveProperty('data')
      expect(responseBody).toHaveProperty('pagination')
      expect(responseBody.data).toHaveLength(2)
      expect(responseBody.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })

    it('should return empty list when no tags exist', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/tags',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseBody = JSON.parse(response.payload)
      expect(responseBody.data).toHaveLength(0)
      expect(responseBody.pagination.total).toBe(0)
    })
  })

  describe('GET /api/tags/stats', () => {
    it('should return tag statistics', async () => {
      // Create tags with different visibility
      await fastify.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'public-tag',
          visibility: 'PUBLIC',
        },
      })

      await fastify.inject({
        method: 'POST',
        url: '/api/tags',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'private-tag',
          visibility: 'PRIVATE',
        },
      })

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/tags/stats',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseBody = JSON.parse(response.payload)
      expect(responseBody).toMatchObject({
        totalTags: 2,
        publicTags: 1,
        privateTags: 1,
        orphanedTags: 0,
      })
    })

    it('should return zero statistics when no tags exist', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/tags/stats',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseBody = JSON.parse(response.payload)
      expect(responseBody).toMatchObject({
        totalTags: 0,
        publicTags: 0,
        privateTags: 0,
        orphanedTags: 0,
      })
    })
  })
})
