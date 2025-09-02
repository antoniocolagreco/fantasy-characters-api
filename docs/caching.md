# AI Caching

Essential caching patterns for initial API development with HTTP headers and simple in-memory cache.

## Critical Caching Rules

1. **Always set Cache-Control headers** - Public for public data, no-store for auth/sensitive
2. **Always use ETag for JSON responses** - Enables 304 Not Modified responses  
3. **Never cache user-specific data** across different users
4. **Always use short TTLs** - 30-60 seconds for public data, immediate invalidation
5. **Always invalidate on mutations** - Clear cache when data changes

## Required ETag Setup

Automatic ETag generation for all JSON responses to enable efficient client caching.

```ts
import fp from 'fastify-plugin'
import etag from '@fastify/etag'

export default fp(async function etagPlugin(fastify) {
  await fastify.register(etag, {
    weak: false, // Strong ETag for JSON responses
  })
})
```

## Required Cache Headers

Set appropriate cache headers based on data sensitivity and access patterns.

```ts
// Public data (characters, items, etc.) - cacheable for 60 seconds
app.get('/api/v1/characters/:id', async (req, reply) => {
  const character = await characterService.getById(req.params.id)
  reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=30')
  return reply.send(success(character, req.id))
})

// Public lists - shorter cache time due to pagination
app.get('/api/v1/characters', async (req, reply) => {
  const result = await characterService.list(req.query)
  reply.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=15')
  return reply.send(paginated(result.items, result.pagination, req.id))
})

// User-specific data - never cache across users
app.get('/api/v1/auth/profile', async (req, reply) => {
  const profile = await userService.getProfile(req.user.id)
  reply.header('Cache-Control', 'no-store')
  return reply.send(success(profile, req.id))
})

// Mutations - never cache
app.post('/api/v1/characters', async (req, reply) => {
  const character = await characterService.create(req.body, req.user.id)
  reply.header('Cache-Control', 'no-store')
  return reply.code(201).send(success(character, req.id))
})

// Static images - long cache with immutable flag
app.get('/api/v1/images/:id/file', async (req, reply) => {
  const image = await imageService.getFile(req.params.id)
  reply.header('Cache-Control', 'public, max-age=31536000, immutable')
  reply.header('Content-Type', image.mimeType)
  return reply.send(image.blob)
})
```

## Optional In-Memory Cache

Simple in-memory cache for expensive public queries with automatic expiration.

```ts
// src/common/utils/micro-cache.ts
type CacheEntry<T> = { value: T; expiresAt: number }
const store = new Map<string, CacheEntry<unknown>>()

export function getCache<T>(key: string): T | undefined {
  const hit = store.get(key)
  if (!hit || hit.expiresAt < Date.now()) {
    store.delete(key)
    return undefined
  }
  return hit.value as T
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function invalidateByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
```

## Required Cache Usage Pattern

Use micro-cache only for expensive public queries with proper key generation and invalidation.

```ts
// Example: Cached public list endpoint
app.get('/api/v1/characters', async (req, reply) => {
  // Generate unique cache key including all query parameters
  const cacheKey = `characters:list:${JSON.stringify(req.query)}`
  
  // Try cache first
  const cached = getCache<CharacterListResult>(cacheKey)
  if (cached) {
    reply.header('Cache-Control', 'public, max-age=30')
    return reply.send(cached)
  }
  
  // Query database
  const result = await characterService.list(req.query)
  
  // Cache for 30 seconds
  setCache(cacheKey, result, 30_000)
  
  reply.header('Cache-Control', 'public, max-age=30')
  return reply.send(result)
})

// Invalidate cache on mutations
app.post('/api/v1/characters', async (req, reply) => {
  const character = await characterService.create(req.body, req.user.id)
  
  // Clear all character list caches
  invalidateByPrefix('characters:list:')
  
  reply.header('Cache-Control', 'no-store')
  return reply.code(201).send(success(character, req.id))
})
```

## Required Cache Strategy

Simple rules for what to cache and how long based on data access patterns.

| Data Type | Cache-Control | TTL | ETag | Notes |
|-----------|---------------|-----|------|-------|
| **Public Resources** | `public, max-age=60` | 60s | ✅ | Characters, items, races |
| **Public Lists** | `public, max-age=30` | 30s | ✅ | Paginated results |
| **Static Images** | `public, max-age=31536000, immutable` | 1 year | ❌ | Use ID as filename |
| **User Data** | `no-store` | Never | ❌ | Profile, private resources |
| **Mutations** | `no-store` | Never | ❌ | POST/PUT/PATCH/DELETE |
