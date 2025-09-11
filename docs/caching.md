# Caching Strategy

Caching implementation for this API to optimize performance while ensuring data
consistency.

## Core Principles

**1. Set cache headers everywhere**  
Public data gets cached, sensitive data does not.

**2. Use ETags for performance**  
When data hasn't changed, return a 304 "Not Modified" to save bandwidth and
processing.

**3. Keep user data separate**  
Never let one user see another user's cached data for security reasons.

**4. Short cache times**  
30-60 seconds maximum for most content to avoid serving stale data.

**5. Clear cache on mutations**  
Create/update/delete operations should clear related cache immediately.

## ETag Implementation

The API uses a two-layer ETag approach:

**Layer 1: Stable ETags**  
A custom plugin creates hashes from the important response fields (`data` and
`pagination` only). This means that timestamp changes don't invalidate cache
when the actual data remains the same.

**Layer 2: Standard ETags**  
Fastify's built-in ETag plugin provides strong ETags (no "W/" prefix).

When a client sends `If-None-Match` with a matching ETag, the server returns a
304 response to save bandwidth.

```ts
// Configuration in src/app.ts
await app.register(stableEtagPlugin) // custom stable layer
await app.register(compressionPlugin)
await app.register(etagPlugin) // fastify's standard layer
```

## Cache Header Management

Use the provided helper functions instead of setting cache headers manually.
This ensures consistency and prevents configuration errors.

```ts
import {
  setPublicResourceCache, // 60 seconds for single items
  setPublicListCache, // 30 seconds for lists
  setNoStore, // never cache this
  setLongLivedBinaryCache, // cache files for a year
} from '@/shared/utils'
```

### Implementation Examples

**Single resources** (characters, users, items, etc.)

```ts
app.get('/api/v1/characters/:id', async (req, reply) => {
  const character = await characterService.getById(req.params.id)
  setPublicResourceCache(reply) // Caches for 60 seconds
  return reply.send(success(character, req.id))
})
```

**Lists and searches** (change more frequently)

```ts
app.get('/api/v1/characters', async (req, reply) => {
  const result = await characterService.list(req.query)
  setPublicListCache(reply) // Caches for 30 seconds
  return reply.send(paginated(result.items, result.pagination, req.id))
})
```

**User-specific content** (depends on requesting user)

```ts
app.get('/api/v1/users/:id', async (req, reply) => {
  const user = await publicUserService.getById(req.params.id, req.user)
  // For truly private data, use setNoStore(reply)
  setPublicResourceCache(reply)
  return reply.send(success(user, req.id))
})
```

**Data mutations** (creates, updates, deletes)

```ts
app.post('/api/v1/characters', async (req, reply) => {
  const character = await characterService.create(req.body, req.user?.id)
  setNoStore(reply) // Never cache mutations
  return reply.code(201).send(success(character, req.id))
})
```

**Files and images** (rarely change)

```ts
app.get('/api/v1/images/:id/file', async (req, reply) => {
  const image = await imageService.getFile(req.params.id)
  setLongLivedBinaryCache(reply) // Cache for one year
  reply.header('Content-Type', image.mimeType)
  return reply.send(image.blob)
})
```

## In-Memory Caching

For expensive database queries, the API provides in-memory caching helpers with
automatic expiration.

Available functions in `src/shared/utils/cache.helper.ts`:

- `getCache(key)` - Get cached data
- `setCache(key, data, ttlMs)` - Store data with expiration
- `invalidateByPrefix(prefix)` - Clear all cache keys starting with a prefix
- `buildCacheKey(prefix, data)` - Create a stable hash from any data structure

## In-Memory Cache Usage

Use in-memory caching only for expensive queries on public data. Implementation
pattern:

```ts
import {
  buildCacheKey,
  getCache,
  setCache,
  invalidateByPrefix,
  setPublicListCache,
  setNoStore,
} from '@/shared/utils'
```

### Caching list endpoints

```ts
app.get('/api/v1/characters', async (req, reply) => {
  // Create a unique key that includes all query parameters
  const cachePrefix = 'characters:list'
  const key = buildCacheKey(cachePrefix, req.query)

  // Check cache first
  const cached = getCache<CharacterListResult>(key)
  if (cached) {
    setPublicListCache(reply)
    return reply.send(cached)
  }

  // Query database if not cached
  const result = await characterService.list(req.query)

  // Store in cache for 30 seconds
  setCache(key, result, 30_000)

  setPublicListCache(reply)
  return reply.send(result)
})
```

### Cache invalidation on mutations

```ts
app.post('/api/v1/characters', async (req, reply) => {
  const character = await characterService.create(req.body, req.user?.id)

  // Clear all character list caches (regardless of query parameters)
  invalidateByPrefix('characters:list')

  setNoStore(reply)
  return reply.code(201).send(success(character, req.id))
})
```

**Note:** The `buildCacheKey` function creates consistent hashes regardless of
query parameter order, preventing cache misses from equivalent queries like
`?limit=10&page=2` vs `?page=2&limit=10`.

## Cache Configuration Reference

| Content Type                               | Cache Duration | ETag? | Helper Function             |
| ------------------------------------------ | -------------- | ----- | --------------------------- |
| **Single items** (characters, users, etc.) | 60 seconds     | ✅    | `setPublicResourceCache()`  |
| **Lists and searches**                     | 30 seconds     | ✅    | `setPublicListCache()`      |
| **Images and files**                       | 1 year         | ❌    | `setLongLivedBinaryCache()` |
| **Private user data**                      | Never          | ❌    | `setNoStore()`              |
| **Create/update/delete**                   | Never          | ❌    | `setNoStore()`              |

### Cache Duration Rationale

- **60s for single items**: Balances performance with data freshness for
  individual resources
- **30s for lists**: Shorter duration because lists change more frequently with
  new items and updates
- **1 year for files**: Images and downloads rarely change, and content-based
  URLs are used
- **Never for mutations**: POST/PUT/DELETE responses should never be cached
- **Never for private data**: Prevents security issues with cross-user data
  exposure
