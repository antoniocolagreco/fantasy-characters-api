/**
 * Cache service tests
 * Tests for response caching functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { cacheService, CacheTTL, CachePatterns, type CacheConfig } from '../cache.service'

describe('Cache Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheService.clear()
  })

  afterEach(() => {
    // Clean up any timers
    vi.clearAllTimers()
  })

  describe('Basic Operations', () => {
    it('should store and retrieve cache entries', () => {
      const key = 'test-key'
      const data = { message: 'hello world' }

      cacheService.set(key, data)
      const entry = cacheService.get(key)

      expect(entry).toBeDefined()
      expect(entry?.data).toEqual(data)
      expect(entry?.etag).toBeDefined()
      expect(entry?.createdAt).toBeDefined()
      expect(entry?.ttl).toBe(300) // Default TTL
    })

    it('should return undefined for non-existent keys', () => {
      const entry = cacheService.get('non-existent-key')
      expect(entry).toBeUndefined()
    })

    it('should delete cache entries', () => {
      const key = 'test-key'
      cacheService.set(key, { data: 'test' })

      const deleted = cacheService.delete(key)
      expect(deleted).toBe(true)

      const entry = cacheService.get(key)
      expect(entry).toBeUndefined()
    })

    it('should clear all cache entries', () => {
      cacheService.set('key1', { data: 'test1' })
      cacheService.set('key2', { data: 'test2' })

      cacheService.clear()

      expect(cacheService.get('key1')).toBeUndefined()
      expect(cacheService.get('key2')).toBeUndefined()
    })
  })

  describe('TTL and Expiration', () => {
    it('should respect custom TTL', () => {
      const key = 'test-key'
      const data = { message: 'hello' }
      const customTtl = 600

      cacheService.set(key, data, { ttl: customTtl })
      const entry = cacheService.get(key)

      expect(entry?.ttl).toBe(customTtl)
    })

    it('should expire entries after TTL', () => {
      vi.useFakeTimers()

      const key = 'test-key'
      const data = { message: 'hello' }
      const ttl = 1 // 1 second

      cacheService.set(key, data, { ttl })

      // Entry should exist immediately
      expect(cacheService.get(key)).toBeDefined()

      // Fast forward past TTL
      vi.advanceTimersByTime(2000) // 2 seconds

      // Entry should be expired
      expect(cacheService.get(key)).toBeUndefined()

      vi.useRealTimers()
    })

    it('should set content type when provided', () => {
      const key = 'test-key'
      const data = { message: 'hello' }
      const contentType = 'application/json'

      cacheService.set(key, data, { contentType })
      const entry = cacheService.get(key)

      expect(entry?.contentType).toBe(contentType)
    })
  })

  describe('Cache Key Generation', () => {
    it('should generate consistent keys for same input', () => {
      const options = {
        method: 'GET',
        url: '/api/skills',
        userId: 'user123',
        params: { page: 1, limit: 10 },
      }

      const key1 = cacheService.generateKey(options)
      const key2 = cacheService.generateKey(options)

      expect(key1).toBe(key2)
    })

    it('should generate different keys for different users', () => {
      const baseOptions = {
        method: 'GET',
        url: '/api/skills',
        params: { page: 1 },
      }

      const key1 = cacheService.generateKey({ ...baseOptions, userId: 'user1' })
      const key2 = cacheService.generateKey({ ...baseOptions, userId: 'user2' })

      expect(key1).not.toBe(key2)
    })

    it('should generate different keys for different parameters', () => {
      const baseOptions = {
        method: 'GET',
        url: '/api/skills',
        userId: 'user123',
      }

      const key1 = cacheService.generateKey({ ...baseOptions, params: { page: 1 } })
      const key2 = cacheService.generateKey({ ...baseOptions, params: { page: 2 } })

      expect(key1).not.toBe(key2)
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate entries by pattern', () => {
      cacheService.set('GET:/api/skills:user:123', { data: 'skills1' })
      cacheService.set('GET:/api/skills:user:456', { data: 'skills2' })
      cacheService.set('GET:/api/perks:user:123', { data: 'perks1' })

      const deleted = cacheService.invalidatePattern('skills')

      expect(deleted).toBe(2)
      expect(cacheService.get('GET:/api/skills:user:123')).toBeUndefined()
      expect(cacheService.get('GET:/api/skills:user:456')).toBeUndefined()
      expect(cacheService.get('GET:/api/perks:user:123')).toBeDefined()
    })

    it('should return zero when no patterns match', () => {
      cacheService.set('GET:/api/skills', { data: 'test' })

      const deleted = cacheService.invalidatePattern('nonexistent')

      expect(deleted).toBe(0)
    })
  })

  describe('ETag Generation', () => {
    it('should generate consistent ETags for same data', () => {
      const data = { message: 'hello world' }

      cacheService.set('key1', data)
      cacheService.set('key2', data)

      const entry1 = cacheService.get('key1')
      const entry2 = cacheService.get('key2')

      expect(entry1?.etag).toBe(entry2?.etag)
    })

    it('should generate different ETags for different data', () => {
      cacheService.set('key1', { message: 'hello' })
      cacheService.set('key2', { message: 'world' })

      const entry1 = cacheService.get('key1')
      const entry2 = cacheService.get('key2')

      expect(entry1?.etag).not.toBe(entry2?.etag)
    })

    it('should generate valid ETag format', () => {
      cacheService.set('test-key', { data: 'test' })
      const entry = cacheService.get('test-key')

      expect(entry?.etag).toMatch(/^"[a-z0-9]+"$/)
    })
  })

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      cacheService.set('key1', { data: 'test1' })
      cacheService.set('key2', { data: 'test2' })

      const stats = cacheService.getStats()

      expect(stats.size).toBe(2)
      expect(stats.maxEntries).toBeDefined()
      expect(stats.enabled).toBe(true)
      expect(stats.hitRate).toBeDefined()
    })

    it('should show zero size after clearing', () => {
      cacheService.set('key1', { data: 'test' })
      cacheService.clear()

      const stats = cacheService.getStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('Cache Configuration', () => {
    it('should respect disabled cache configuration', () => {
      // Create cache service with disabled config
      const disabledConfig: CacheConfig = {
        defaultTtl: 300,
        maxEntries: 100,
        enabled: false,
      }

      // Mock the private config property
      ;(cacheService as any).config = disabledConfig

      cacheService.set('test-key', { data: 'test' })
      const entry = cacheService.get('test-key')

      expect(entry).toBeUndefined()

      // Reset to enabled
      ;(cacheService as any).config.enabled = true
    })
  })

  describe('Cache TTL Constants', () => {
    it('should have correct TTL values', () => {
      expect(CacheTTL.SHORT).toBe(60)
      expect(CacheTTL.MEDIUM).toBe(300)
      expect(CacheTTL.LONG).toBe(900)
      expect(CacheTTL.VERY_LONG).toBe(3600)
      expect(CacheTTL.STATIC).toBe(86400)
    })
  })

  describe('Cache Patterns Constants', () => {
    it('should have correct pattern values', () => {
      expect(CachePatterns.STATS).toBe('stats')
      expect(CachePatterns.LIST).toBe('list')
      expect(CachePatterns.GET).toBe('get')
      expect(CachePatterns.PUBLIC).toBe('public')
      expect(CachePatterns.USER).toBe('user')
    })
  })

  describe('LRU Behavior', () => {
    it('should remove oldest entries when cache is full', () => {
      // Set max entries to a small number
      const originalConfig = (cacheService as any).config
      ;(cacheService as any).config = {
        ...originalConfig,
        maxEntries: 2,
      }

      // Fill cache to capacity
      cacheService.set('key1', { data: 'test1' })
      cacheService.set('key2', { data: 'test2' })

      // Both should exist
      expect(cacheService.get('key1')).toBeDefined()
      expect(cacheService.get('key2')).toBeDefined()

      // Add third entry, should evict first
      cacheService.set('key3', { data: 'test3' })

      // First key should be evicted
      expect(cacheService.get('key1')).toBeUndefined()
      expect(cacheService.get('key2')).toBeDefined()
      expect(cacheService.get('key3')).toBeDefined()

      // Restore original config
      ;(cacheService as any).config = originalConfig
    })
  })
})
