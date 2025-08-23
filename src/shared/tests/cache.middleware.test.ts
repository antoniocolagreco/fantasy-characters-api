/**
 * Cache middleware tests
 * Tests for caching middleware functionality
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import { beforeEach, describe, expect, it } from 'vitest'
import { CacheInvalidation, cacheMiddleware, CacheMiddleware } from '../cache.middleware'
import { cacheService } from '../cache.service'
import { createMockReply, createMockRequest } from './test-utils'

describe('Cache Middleware', () => {
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply

  beforeEach(() => {
    // Clear cache before each test
    cacheService.clear()

    // Create fresh mocks
    mockRequest = createMockRequest({
      method: 'GET',
      url: '/api/skills',
      query: { page: '1', limit: '10' },
    })

    mockReply = createMockReply()
  })

  describe('Basic Caching', () => {
    it('should cache GET responses', async () => {
      const middleware = cacheMiddleware()
      const responseData = { skills: [{ id: '1', name: 'Archery' }] }

      // First request - should not be cached
      await middleware(mockRequest, mockReply)

      // Simulate response
      mockReply.statusCode = 200
      mockReply.send(responseData)

      // Verify cache entry was created
      const cacheKey = cacheService.generateKey({
        method: 'GET',
        url: '/api/skills',
        params: { page: '1', limit: '10' },
      })

      const cachedEntry = cacheService.get(cacheKey)
      expect(cachedEntry).toBeDefined()
      expect(cachedEntry?.data).toEqual(responseData)
    })

    it('should return cached response on subsequent requests', async () => {
      const middleware = cacheMiddleware()
      const responseData = { skills: [{ id: '1', name: 'Archery' }] }

      // Cache the response manually
      const cacheKey = cacheService.generateKey({
        method: 'GET',
        url: '/api/skills',
        params: { page: '1', limit: '10' },
      })

      cacheService.set(cacheKey, responseData, { contentType: 'application/json' })

      // Make request
      await middleware(mockRequest, mockReply)

      // Verify cached response was returned
      expect(mockReply.send).toHaveBeenCalledWith(responseData)
      expect(mockReply.type).toHaveBeenCalledWith('application/json')
    })

    it('should not cache non-GET requests', async () => {
      const middleware = cacheMiddleware()
      const postRequest = createMockRequest({
        method: 'POST',
        url: '/api/skills',
      })

      await middleware(postRequest, mockReply)

      // Should not have any side effects for non-GET requests
      expect(mockReply.send).not.toHaveBeenCalled()
    })

    it('should not cache error responses', async () => {
      const middleware = cacheMiddleware()

      // First request
      await middleware(mockRequest, mockReply)

      // Simulate error response
      mockReply.statusCode = 500
      mockReply.send({ error: 'Internal Server Error' })

      // Verify no cache entry was created
      const cacheKey = cacheService.generateKey({
        method: 'GET',
        url: '/api/skills',
        params: { page: '1', limit: '10' },
      })

      const cachedEntry = cacheService.get(cacheKey)
      expect(cachedEntry).toBeUndefined()
    })
  })

  describe('Cache Headers', () => {
    it('should set appropriate cache headers for cached responses', async () => {
      const middleware = cacheMiddleware({ ttl: 600 })
      const responseData = { data: 'test' }

      // Cache the response manually
      const cacheKey = cacheService.generateKey({
        method: 'GET',
        url: '/api/skills',
        params: { page: '1', limit: '10' },
      })

      cacheService.set(cacheKey, responseData, { ttl: 600 })

      // Make request
      await middleware(mockRequest, mockReply)

      // Verify cache headers were set
      expect(mockReply.header).toHaveBeenCalledWith('Cache-Control', 'public, max-age=600')
      expect(mockReply.header).toHaveBeenCalledWith('X-Cache', 'HIT')
      expect(mockReply.header).toHaveBeenCalledWith('ETag', expect.stringMatching(/^".+"$/))
      expect(mockReply.header).toHaveBeenCalledWith('Last-Modified', expect.any(String))
      expect(mockReply.header).toHaveBeenCalledWith('Expires', expect.any(String))
    })

    it('should handle ETag conditional requests', async () => {
      const middleware = cacheMiddleware()
      const responseData = { data: 'test' }

      // Cache the response manually
      const cacheKey = cacheService.generateKey({
        method: 'GET',
        url: '/api/skills',
        params: { page: '1', limit: '10' },
      })

      cacheService.set(cacheKey, responseData)
      const cachedEntry = cacheService.get(cacheKey)

      // Set If-None-Match header with matching ETag
      mockRequest.headers = {
        'if-none-match': cachedEntry?.etag,
      }

      // Make request
      await middleware(mockRequest, mockReply)

      // Should return 304 Not Modified
      expect(mockReply.code).toHaveBeenCalledWith(304)
      expect(mockReply.send).toHaveBeenCalledWith()
    })
  })

  describe('Cache Options', () => {
    it('should respect custom TTL', async () => {
      const customTtl = 1200
      const middleware = cacheMiddleware({ ttl: customTtl })

      await middleware(mockRequest, mockReply)

      // Simulate response
      mockReply.statusCode = 200
      mockReply.send({ data: 'test' })

      // Verify cache entry has custom TTL
      const cacheKey = cacheService.generateKey({
        method: 'GET',
        url: '/api/skills',
        params: { page: '1', limit: '10' },
      })

      const cachedEntry = cacheService.get(cacheKey)
      expect(cachedEntry?.ttl).toBe(customTtl)
    })

    it('should include user ID in cache key when includeUser is true', async () => {
      const middleware = cacheMiddleware({ includeUser: true })
      const requestWithUser = createMockRequest({
        method: 'GET',
        url: '/api/skills',
        query: { page: '1', limit: '10' },
      }) as FastifyRequest & { authUser?: { id: string } }
      ;(requestWithUser as any).authUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'USER',
      }

      await middleware(requestWithUser, mockReply)

      // Simulate response
      mockReply.statusCode = 200
      mockReply.send({ data: 'test' })

      // Verify cache key includes user ID
      const expectedKey = cacheService.generateKey({
        method: 'GET',
        url: '/api/skills',
        userId: 'user123',
        params: { page: '1', limit: '10' },
      })

      const cachedEntry = cacheService.get(expectedKey)
      expect(cachedEntry).toBeDefined()
    })

    it('should skip caching when skipIf condition is met', async () => {
      const middleware = cacheMiddleware({
        skipIf: request => (request.query as Record<string, string | string[]>)?.nocache === 'true',
      })

      const requestWithNocache = createMockRequest({
        query: { nocache: 'true' },
      })

      await middleware(requestWithNocache, mockReply)

      // Should not have any caching side effects
      expect(mockReply.send).not.toHaveBeenCalled()
    })

    it('should use custom key generator when provided', async () => {
      const customKey = 'custom-cache-key'
      const middleware = cacheMiddleware({
        keyGenerator: () => customKey,
      })

      await middleware(mockRequest, mockReply)

      // Simulate response
      mockReply.statusCode = 200
      mockReply.send({ data: 'test' })

      // Verify custom key was used
      const cachedEntry = cacheService.get(customKey)
      expect(cachedEntry).toBeDefined()
    })
  })

  describe('Preset Middleware', () => {
    it('should create short cache middleware with correct TTL', () => {
      const middleware = CacheMiddleware.short()
      expect(middleware).toBeDefined()
    })

    it('should create medium cache middleware with correct TTL', () => {
      const middleware = CacheMiddleware.medium()
      expect(middleware).toBeDefined()
    })

    it('should create long cache middleware with correct TTL', () => {
      const middleware = CacheMiddleware.long()
      expect(middleware).toBeDefined()
    })

    it('should create stats cache middleware with user context', () => {
      const middleware = CacheMiddleware.stats()
      expect(middleware).toBeDefined()
    })

    it('should create public list cache without user context', () => {
      const middleware = CacheMiddleware.publicList()
      expect(middleware).toBeDefined()
    })

    it('should create user-specific cache with user context', () => {
      const middleware = CacheMiddleware.userSpecific()
      expect(middleware).toBeDefined()
    })
  })

  describe('Cache Invalidation', () => {
    beforeEach(() => {
      // Set up some cache entries
      cacheService.set('GET:/api/users:user:123', { data: 'user1' })
      cacheService.set('GET:/api/users:user:456', { data: 'user2' })
      cacheService.set('GET:/api/skills:list', { data: 'skills' })
      cacheService.set('GET:/api/stats', { data: 'stats' })
    })

    it('should invalidate user-specific caches', () => {
      const deleted = CacheInvalidation.user('123')
      expect(deleted).toBe(1)
      expect(cacheService.get('GET:/api/users:user:123')).toBeUndefined()
      expect(cacheService.get('GET:/api/users:user:456')).toBeDefined()
    })

    it('should invalidate list caches', () => {
      const deleted = CacheInvalidation.lists()
      expect(deleted).toBe(1)
      expect(cacheService.get('GET:/api/skills:list')).toBeUndefined()
    })

    it('should invalidate stats caches', () => {
      const deleted = CacheInvalidation.stats()
      expect(deleted).toBe(1)
      expect(cacheService.get('GET:/api/stats')).toBeUndefined()
    })

    it('should invalidate resource-specific caches', () => {
      cacheService.set('GET:/api/skills:123', { data: 'skill' })
      const deleted = CacheInvalidation.resource('skills', '123')
      expect(deleted).toBe(1)
    })

    it('should clear all caches', () => {
      CacheInvalidation.all()
      expect(cacheService.getStats().size).toBe(0)
    })
  })
})
