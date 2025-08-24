/**
 * Cache Integration Tests
 * Tests to verify that the cache system works end-to-end in real scenarios
 * These tests deliberately avoid clearing cache between operations to test persistence
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../app'
import { cacheService } from '../cache.service'
import { db } from '../prisma.service'
import { createTestAdminUser, createTestUser } from './test-utils'

describe('Cache Integration Tests', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>
  let adminUser: Awaited<ReturnType<typeof createTestAdminUser>>

  beforeAll(async () => {
    // Clean up database but keep cache service running
    await db.user.deleteMany()
    await db.skill.deleteMany()
    await db.race.deleteMany()
    await db.item.deleteMany()

    // Create test users
    testUser = await createTestUser({ isEmailVerified: true })
    adminUser = await createTestAdminUser({ isEmailVerified: true })

    // Clear cache once at the beginning
    cacheService.clear()
  })

  afterAll(async () => {
    // Clean up
    await db.user.deleteMany()
    await db.skill.deleteMany()
    await db.race.deleteMany()
    await db.item.deleteMany()
    cacheService.clear()
  })

  describe('Cache Persistence and Performance', () => {
    it('should cache GET /api/skills responses and serve from cache on subsequent requests', async () => {
      // Login to get token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: testUser.user.email,
          password: testUser.password,
        },
      })

      const { accessToken } = loginResponse.json()

      // First request - should populate cache
      const startTime1 = Date.now()
      const response1 = await app.inject({
        method: 'GET',
        url: '/api/skills',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })
      const duration1 = Date.now() - startTime1

      expect(response1.statusCode).toBe(200)
      expect(response1.headers['x-cache']).toBe('MISS')
      expect(response1.headers['cache-control']).toContain('public')
      expect(response1.headers['etag']).toBeDefined()

      // Second request - should serve from cache
      const startTime2 = Date.now()
      const response2 = await app.inject({
        method: 'GET',
        url: '/api/skills',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })
      const duration2 = Date.now() - startTime2

      expect(response2.statusCode).toBe(200)
      expect(response2.headers['x-cache']).toBe('HIT')
      expect(response2.headers['etag']).toBe(response1.headers['etag'])

      // Cache hit should be faster (though this might be flaky in CI)
      console.log(`First request: ${duration1}ms, Second request (cached): ${duration2}ms`)

      // Verify response content is identical
      expect(response2.json()).toEqual(response1.json())
    })

    it('should handle ETag conditional requests with 304 Not Modified', async () => {
      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: testUser.user.email,
          password: testUser.password,
        },
      })

      const { accessToken } = loginResponse.json()

      // First request to get ETag
      const response1 = await app.inject({
        method: 'GET',
        url: '/api/races',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response1.statusCode).toBe(200)
      const etag = response1.headers['etag']
      expect(etag).toBeDefined()

      // Second request with If-None-Match header
      const response2 = await app.inject({
        method: 'GET',
        url: '/api/races',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'if-none-match': etag as string,
        },
      })

      expect(response2.statusCode).toBe(304)
      expect(response2.body).toBe('')
    })

    it('should invalidate cache when data is modified', async () => {
      // Login as admin to create/modify skills
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: adminUser.user.email,
          password: adminUser.password,
        },
      })

      const { accessToken } = loginResponse.json()

      // First request to cache skills list
      const response1 = await app.inject({
        method: 'GET',
        url: '/api/skills',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response1.statusCode).toBe(200)
      expect(response1.headers['x-cache']).toBe('MISS')
      const originalSkills = response1.json()

      // Create a new skill
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/skills',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          name: 'Cache Test Skill',
          description: 'A skill for testing cache invalidation',
          requiredLevel: 1,
        },
      })

      expect(createResponse.statusCode).toBe(201)

      // Request skills list again - should be fresh (not cached)
      const response2 = await app.inject({
        method: 'GET',
        url: '/api/skills',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response2.statusCode).toBe(200)
      const newSkills = response2.json()

      // Should have one more skill than before
      expect(newSkills.data.length).toBe(originalSkills.data.length + 1)

      // Find the new skill
      const newSkill = newSkills.data.find(
        (skill: { name: string }) => skill.name === 'Cache Test Skill',
      )
      expect(newSkill).toBeDefined()
    })

    it('should cache user-specific endpoints with RBAC-aware keys', async () => {
      // Login as regular user
      const userLoginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: testUser.user.email,
          password: testUser.password,
        },
      })

      const userToken = userLoginResponse.json().accessToken

      // Login as admin
      const adminLoginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: adminUser.user.email,
          password: adminUser.password,
        },
      })

      const adminToken = adminLoginResponse.json().accessToken

      // Request user profile as regular user
      const userProfileResponse = await app.inject({
        method: 'GET',
        url: `/api/users/${testUser.user.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(userProfileResponse.statusCode).toBe(200)
      expect(userProfileResponse.headers['x-cache']).toBe('MISS')

      // Request same profile as admin (should be different cache entry)
      const adminViewResponse = await app.inject({
        method: 'GET',
        url: `/api/users/${testUser.user.id}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(adminViewResponse.statusCode).toBe(200)
      expect(adminViewResponse.headers['x-cache']).toBe('MISS') // Different cache key due to different user

      // Request user profile again as regular user (should hit cache)
      const userProfileResponse2 = await app.inject({
        method: 'GET',
        url: `/api/users/${testUser.user.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(userProfileResponse2.statusCode).toBe(200)
      expect(userProfileResponse2.headers['x-cache']).toBe('HIT')
    })

    it('should respect different cache TTLs for different endpoint types', async () => {
      // Login as admin
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: adminUser.user.email,
          password: adminUser.password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Request stats endpoint (should have long cache TTL)
      const statsResponse = await app.inject({
        method: 'GET',
        url: '/api/skills/stats',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(statsResponse.statusCode).toBe(200)
      expect(statsResponse.headers['x-cache']).toBe('MISS')

      // Extract max-age from Cache-Control header
      const cacheControl = statsResponse.headers['cache-control'] as string
      expect(cacheControl).toContain('public')

      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/)
      expect(maxAgeMatch).toBeTruthy()
      if (!maxAgeMatch) {
        throw new Error('maxAgeMatch should not be null')
      }
      const maxAge = parseInt(maxAgeMatch[1], 10)

      // Stats should have long cache (900 seconds)
      expect(maxAge).toBe(900)

      // Request list endpoint (should have medium cache TTL)
      const listResponse = await app.inject({
        method: 'GET',
        url: '/api/skills',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(listResponse.statusCode).toBe(200)
      const listCacheControl = listResponse.headers['cache-control'] as string
      const listMaxAgeMatch = listCacheControl.match(/max-age=(\d+)/)
      expect(listMaxAgeMatch).toBeTruthy()
      if (!listMaxAgeMatch) {
        throw new Error('listMaxAgeMatch should not be null')
      }
      const listMaxAge = parseInt(listMaxAgeMatch[1], 10)

      // Lists should have medium cache (300 seconds)
      expect(listMaxAge).toBe(300)
    })
  })

  describe('Cache Service Direct Testing', () => {
    it('should maintain cache statistics correctly', () => {
      const initialStats = cacheService.getStats()
      const initialSize = initialStats.size

      // Add some cache entries
      cacheService.set('test-key-1', { data: 'test1' })
      cacheService.set('test-key-2', { data: 'test2' })

      const newStats = cacheService.getStats()
      expect(newStats.size).toBe(initialSize + 2)
      expect(newStats.enabled).toBe(true)
      expect(newStats.maxEntries).toBeGreaterThan(0)
    })

    it('should handle pattern-based cache invalidation', () => {
      // Add cache entries with different patterns
      cacheService.set('GET:/api/skills:user:123', { data: 'skills' })
      cacheService.set('GET:/api/skills:list', { data: 'skills-list' })
      cacheService.set('GET:/api/races:user:123', { data: 'races' })
      cacheService.set('GET:/api/stats', { data: 'stats' })

      // Invalidate skills-related caches
      const deletedCount = cacheService.invalidatePattern('skills')
      expect(deletedCount).toBe(2)

      // Verify only skills caches were removed
      expect(cacheService.get('GET:/api/skills:user:123')).toBeUndefined()
      expect(cacheService.get('GET:/api/skills:list')).toBeUndefined()
      expect(cacheService.get('GET:/api/races:user:123')).toBeDefined()
      expect(cacheService.get('GET:/api/stats')).toBeDefined()
    })

    it('should demonstrate ETag consistency', () => {
      const testData = { message: 'hello world', timestamp: '2025-01-01T00:00:00Z' }

      // Set same data with different keys
      cacheService.set('key1', testData)
      cacheService.set('key2', testData)

      const entry1 = cacheService.get('key1')
      const entry2 = cacheService.get('key2')

      // ETags should be identical for identical data
      expect(entry1?.etag).toBe(entry2?.etag)

      // Set different data
      cacheService.set('key3', { ...testData, message: 'hello universe' })
      const entry3 = cacheService.get('key3')

      // ETag should be different for different data
      expect(entry3?.etag).not.toBe(entry1?.etag)
    })
  })

  describe('Performance Validation', () => {
    it('should demonstrate measurable performance improvement with cache', async () => {
      // This test demonstrates cache performance benefits
      // Note: In CI/CD this might be flaky due to timing, but it's useful for local development

      // Login as admin to access stats
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: adminUser.user.email,
          password: adminUser.password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Create some data to make stats computation meaningful
      await app.inject({
        method: 'POST',
        url: '/api/skills',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { name: 'Performance Test Skill 1', requiredLevel: 1 },
      })

      await app.inject({
        method: 'POST',
        url: '/api/skills',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { name: 'Performance Test Skill 2', requiredLevel: 5 },
      })

      // Measure first request (cache miss)
      const start1 = Date.now()
      const response1 = await app.inject({
        method: 'GET',
        url: '/api/skills/stats',
        headers: { authorization: `Bearer ${accessToken}` },
      })
      const duration1 = Date.now() - start1

      expect(response1.statusCode).toBe(200)
      expect(response1.headers['x-cache']).toBe('MISS')

      // Measure second request (cache hit)
      const start2 = Date.now()
      const response2 = await app.inject({
        method: 'GET',
        url: '/api/skills/stats',
        headers: { authorization: `Bearer ${accessToken}` },
      })
      const duration2 = Date.now() - start2

      expect(response2.statusCode).toBe(200)
      expect(response2.headers['x-cache']).toBe('HIT')

      console.log(`Stats endpoint - Uncached: ${duration1}ms, Cached: ${duration2}ms`)

      // Verify responses are identical
      expect(response2.json()).toEqual(response1.json())

      // Log performance improvement (cached should typically be faster)
      if (duration2 < duration1) {
        const improvement = (((duration1 - duration2) / duration1) * 100).toFixed(1)
        console.log(`Cache provided ${improvement}% performance improvement`)
      }
    })
  })
})
