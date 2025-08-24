/**
 * Cache service for response caching
 * Implements caching strategy with proper cache headers and TTL management
 */

import { setInterval as nodeSetInterval } from 'node:timers'
import { cacheConfig } from './config'

/**
 * Cache configuration interface
 */
export type CacheConfig = {
  /** Default TTL in seconds */
  defaultTtl: number
  /** Maximum number of entries in cache */
  maxEntries: number
  /** Enable/disable caching globally */
  enabled: boolean
}

/**
 * Cache entry interface
 */
export type CacheEntry = {
  /** Cached data */
  data: unknown
  /** Timestamp when entry was created */
  createdAt: number
  /** TTL in seconds */
  ttl: number
  /** ETag for conditional requests */
  etag: string
  /** Content type of cached response */
  contentType?: string
}

/**
 * Cache key generation interface
 */
export type CacheKeyOptions = {
  /** HTTP method */
  method: string
  /** Request URL */
  url: string
  /** User ID for user-specific caching */
  userId?: string
  /** Additional cache key components */
  params?: Record<string, unknown>
}

/**
 * Cache service implementation using Map
 * In production, this should be replaced with Redis or similar
 */
class CacheService {
  private cache = new Map<string, CacheEntry>()
  private config: CacheConfig
  private stats = {
    hits: 0,
    misses: 0,
  }

  constructor(config: CacheConfig) {
    this.config = config

    // Clean up expired entries periodically
    nodeSetInterval(() => {
      this.cleanup()
    }, 60000) // Clean every minute
  }

  /**
   * Generate cache key from request information
   */
  generateKey(options: CacheKeyOptions): string {
    const { method, url, userId, params } = options

    const baseKey = `${method}:${url}`
    const userPart = userId ? `:user:${userId}` : ''
    const paramsPart = params ? `:${JSON.stringify(params)}` : ''

    return `${baseKey}${userPart}${paramsPart}`
  }

  /**
   * Get entry from cache
   */
  get(key: string): CacheEntry | undefined {
    if (!this.config.enabled) {
      this.stats.misses++
      return undefined
    }

    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return undefined
    }

    // Check if entry has expired
    const now = Date.now()
    const expiresAt = entry.createdAt + entry.ttl * 1000

    if (now > expiresAt) {
      this.cache.delete(key)
      this.stats.misses++
      return undefined
    }

    this.stats.hits++
    return entry
  }

  /**
   * Set entry in cache
   */
  set(
    key: string,
    data: unknown,
    options: {
      ttl?: number
      contentType?: string
    } = {},
  ): void {
    if (!this.config.enabled) {
      return
    }

    // Check if cache is at capacity
    if (this.cache.size >= this.config.maxEntries) {
      // Remove oldest entries (simple LRU)
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    const ttl = options.ttl ?? this.config.defaultTtl
    const etag = this.generateETag(data)

    const entry: CacheEntry = {
      data,
      createdAt: Date.now(),
      ttl,
      etag,
      ...(options.contentType && { contentType: options.contentType }),
    }

    this.cache.set(key, entry)
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): number {
    let deletedCount = 0

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    return deletedCount
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxEntries: number
    hitRate: number
    enabled: boolean
  } {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0

    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      hitRate: Math.round(hitRate * 10000) / 100, // Convert to percentage with 2 decimal places
      enabled: this.config.enabled,
    }
  }

  /**
   * Enable or disable caching
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    if (!enabled) {
      // Clear cache when disabling
      this.clear()
    }
  }

  /**
   * Generate ETag for cache entry
   */
  private generateETag(data: unknown): string {
    const content = JSON.stringify(data)
    const hash = this.simpleHash(content)
    return `"${hash}"`
  }

  /**
   * Simple hash function for ETag generation
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      const expiresAt = entry.createdAt + entry.ttl * 1000

      if (now > expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// Default cache configuration from environment
export const defaultCacheConfig: CacheConfig = {
  defaultTtl: cacheConfig.defaultTtl,
  maxEntries: cacheConfig.maxEntries,
  enabled: cacheConfig.enabled,
}

// Create singleton cache service instance
export const cacheService = new CacheService(defaultCacheConfig)

/**
 * Cache TTL presets for different types of content
 */
export const CacheTTL = {
  /** Very short cache for frequently changing data */
  SHORT: 60, // 1 minute
  /** Medium cache for semi-static data */
  MEDIUM: 300, // 5 minutes
  /** Long cache for static data */
  LONG: 900, // 15 minutes
  /** Very long cache for rarely changing data */
  VERY_LONG: 3600, // 1 hour
  /** Static assets cache */
  STATIC: 86400, // 24 hours
} as const

/**
 * Cache patterns for different endpoints
 */
export const CachePatterns = {
  /** Statistics endpoints */
  STATS: 'stats',
  /** List endpoints */
  LIST: 'list',
  /** Get single resource */
  GET: 'get',
  /** Public data */
  PUBLIC: 'public',
  /** User-specific data */
  USER: 'user',
} as const
