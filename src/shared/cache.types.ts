/**
 * Cache system TypeScript type definitions
 * All cache-related types for response caching and performance optimization
 */

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
 * Cache key generation options
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
 * Cache invalidation patterns
 */
export type CacheInvalidationPattern = {
  /** Pattern to match cache keys for invalidation */
  pattern: string
  /** Whether to use regex matching */
  isRegex?: boolean
}

/**
 * Cache statistics
 */
export type CacheStats = {
  /** Total number of entries in cache */
  totalEntries: number
  /** Cache hit count */
  hits: number
  /** Cache miss count */
  misses: number
  /** Cache hit ratio */
  hitRatio: number
  /** Memory usage of cache */
  memoryUsage: number
  /** Oldest entry timestamp */
  oldestEntry?: number
  /** Newest entry timestamp */
  newestEntry?: number
}

/**
 * Cache middleware preset configurations
 */
export type CachePreset = 'short' | 'medium' | 'long' | 'static' | 'dynamic'

/**
 * Cache invalidation event
 */
export type CacheInvalidationEvent = {
  /** Event type that triggered invalidation */
  eventType: string
  /** Resource type that was modified */
  resourceType: string
  /** Resource ID that was modified */
  resourceId?: string
  /** Cache patterns to invalidate */
  patterns: string[]
  /** Timestamp of invalidation */
  timestamp: number
}
