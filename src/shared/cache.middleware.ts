/**
 * Caching middleware for Fastify
 * Implements response caching with proper HTTP cache headers
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { cacheService, CacheTTL } from './cache.service'
import type { CacheKeyOptions, CacheEntry } from './cache.types'

/**
 * Cache middleware options
 */
export type CacheOptions = {
  /** TTL in seconds (overrides default) */
  ttl?: number
  /** Whether to include user ID in cache key */
  includeUser?: boolean
  /** Additional cache key parameters */
  keyParams?: Record<string, unknown>
  /** Skip caching for certain conditions */
  skipIf?: (request: FastifyRequest) => boolean
  /** Custom cache key generator */
  keyGenerator?: (request: FastifyRequest) => string
}

/**
 * Cache middleware factory
 * Creates middleware that caches GET responses
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return
    }

    // Skip caching if condition is met
    if (options.skipIf?.(request)) {
      return
    }

    // Generate cache key
    const cacheKey = options.keyGenerator
      ? options.keyGenerator(request)
      : generateCacheKey(request, options)

    // Try to get cached response
    const cachedEntry = cacheService.get(cacheKey)

    if (cachedEntry) {
      // Set cache headers for cached response
      setCacheHeaders(reply, cachedEntry, true)

      // Check if client has current version (ETag)
      const clientETag = request.headers['if-none-match']
      if (clientETag === cachedEntry.etag) {
        reply.code(304)
        return reply.send()
      }

      // Send cached response
      if (cachedEntry.contentType) {
        reply.type(cachedEntry.contentType)
      }
      return reply.send(cachedEntry.data)
    }

    // If not cached, intercept the response to cache it
    const originalSend = reply.send.bind(reply)

    reply.send = function (payload: unknown) {
      // Only cache successful responses
      if (reply.statusCode >= 200 && reply.statusCode < 300) {
        const contentType = reply.getHeader('content-type') as string | undefined

        // Cache the response
        cacheService.set(cacheKey, payload, {
          ...(options.ttl && { ttl: options.ttl }),
          ...(contentType && { contentType }),
        })

        // Get the cached entry to set headers
        const newCachedEntry = cacheService.get(cacheKey)
        if (newCachedEntry) {
          setCacheHeaders(reply, newCachedEntry, false)
        }
      }

      return originalSend(payload)
    }
  }
}

/**
 * Preset cache middleware for different scenarios
 */
export const CacheMiddleware = {
  /** Short cache for frequently changing data */
  short: (options: Omit<CacheOptions, 'ttl'> = {}) =>
    cacheMiddleware({ ...options, ttl: CacheTTL.SHORT }),

  /** Medium cache for semi-static data */
  medium: (options: Omit<CacheOptions, 'ttl'> = {}) =>
    cacheMiddleware({ ...options, ttl: CacheTTL.MEDIUM }),

  /** Long cache for static data */
  long: (options: Omit<CacheOptions, 'ttl'> = {}) =>
    cacheMiddleware({ ...options, ttl: CacheTTL.LONG }),

  /** Very long cache for rarely changing data */
  veryLong: (options: Omit<CacheOptions, 'ttl'> = {}) =>
    cacheMiddleware({ ...options, ttl: CacheTTL.VERY_LONG }),

  /** Statistics cache - long TTL, includes user for permissions */
  stats: (options: Omit<CacheOptions, 'ttl' | 'includeUser'> = {}) =>
    cacheMiddleware({ ...options, ttl: CacheTTL.LONG, includeUser: true }),

  /** Public list cache - medium TTL, no user context */
  publicList: (options: Omit<CacheOptions, 'ttl' | 'includeUser'> = {}) =>
    cacheMiddleware({ ...options, ttl: CacheTTL.MEDIUM, includeUser: false }),

  /** User-specific cache - short TTL, includes user */
  userSpecific: (options: Omit<CacheOptions, 'ttl' | 'includeUser'> = {}) =>
    cacheMiddleware({ ...options, ttl: CacheTTL.SHORT, includeUser: true }),
} as const

/**
 * Generate cache key from request
 */
function generateCacheKey(request: FastifyRequest, options: CacheOptions): string {
  const keyOptions: CacheKeyOptions = {
    method: request.method,
    url: request.url,
    ...(options.includeUser && request.authUser?.id && { userId: request.authUser.id }),
    params: {
      ...(request.query as Record<string, unknown>),
      ...options.keyParams,
    },
  }

  return cacheService.generateKey(keyOptions)
}

/**
 * Set HTTP cache headers on response
 */
function setCacheHeaders(reply: FastifyReply, entry: CacheEntry, fromCache: boolean): void {
  const now = Date.now()
  const age = Math.floor((now - entry.createdAt) / 1000)
  const maxAge = entry.ttl

  // Set standard HTTP cache headers
  reply.header('Cache-Control', `public, max-age=${maxAge}`)
  reply.header('ETag', entry.etag)
  reply.header('Age', age.toString())

  // Set expiration date
  const expiresAt = new Date(entry.createdAt + entry.ttl * 1000)
  reply.header('Expires', expiresAt.toUTCString())

  // Add custom header to indicate cache status
  reply.header('X-Cache', fromCache ? 'HIT' : 'MISS')

  // Add last modified header
  const lastModified = new Date(entry.createdAt)
  reply.header('Last-Modified', lastModified.toUTCString())
}

/**
 * Cache invalidation helper
 */
export const CacheInvalidation = {
  /** Invalidate all caches for a specific user */
  user: (userId: string) => cacheService.invalidatePattern(`user:${userId}`),

  /** Invalidate all list caches */
  lists: () => cacheService.invalidatePattern('list'),

  /** Invalidate all statistics caches */
  stats: () => cacheService.invalidatePattern('stats'),

  /** Invalidate specific resource caches */
  resource: (resourceType: string, resourceId?: string) => {
    const pattern = resourceId ? `${resourceType}:${resourceId}` : resourceType
    return cacheService.invalidatePattern(pattern)
  },

  /** Clear all caches */
  all: () => cacheService.clear(),
} as const

/**
 * Cache configuration helper
 */
export const CacheConfig = {
  /** Enable/disable caching */
  setEnabled: (enabled: boolean) => {
    cacheService.setEnabled(enabled)
  },

  /** Get cache statistics */
  getStats: () => cacheService.getStats(),
} as const
