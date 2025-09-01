# Caching strategy (simple and safe)

This API favors correctness and simplicity. We primarily use HTTP caching headers and small, targeted server-side micro-caches only for public, expensive GETs.

Goals

- Make public reads fast (Cache-Control + ETag, optional CDN).
- Never cache sensitive or user-specific data across users.
- Keep invalidation simple and local to each resource.

## Layers we use

- Client/browser and CDN: HTTP headers (Cache-Control, ETag, Last-Modified, Vary).
- API server: optional in-memory micro-cache for select public GET endpoints.
- Database: rely on indexes; avoid query result caches unless clearly beneficial.

## Classify responses

- Public static assets (images, files with versioned names):
  - Cache-Control: public, max-age=31536000, immutable
  - File names must include a content hash to allow long TTL.
- Public API GET (non-personalized):
  - Cache-Control: public, max-age=30, s-maxage=60, stale-while-revalidate=30
  - ETag enabled; allow conditional GET (304 Not Modified).
- Authenticated or personalized responses:
  - Cache-Control: no-store (default). Do not share across users.
  - You may still compute ETag server-side, but do not allow intermediary caching.
- Mutation responses (POST/PUT/PATCH/DELETE):
  - Cache-Control: no-store

## HTTP headers setup

Use ETag and explicit Cache-Control per route. For automatic ETag on JSON payloads, adopt @fastify/etag.

```ts
// src/plugins/etag.ts
import fp from 'fastify-plugin'
import etag from '@fastify/etag'

export default fp(async function etagPlugin(fastify) {
  await fastify.register(etag, {
    weak: false, // strong ETag for JSON
  })
})
```

Example route policies

```ts
// Public item (can be cached by CDN/browsers)
fastify.get('/api/v1/characters/:id', async (req, reply) => {
  const item = await characterService.getById(req.params.id)
  reply.header('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=60')
  return item
})

// Public list (short TTL)
fastify.get('/api/v1/characters', { schema: {/* ... */} }, async (req, reply) => {
  const list = await characterService.list(req.query)
  reply.header('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=30')
  // If you expose pagination headers, keep them consistent across cached responses
  return list
})

// Authenticated response (do not cache)
fastify.get('/api/v1/me', async (req, reply) => {
  const me = await userService.getMe(req.user.id)
  reply.header('Cache-Control', 'no-store')
  return me
})
```

Notes

- Conditional requests: With ETag enabled, browsers/CDNs can send If-None-Match; Fastify will respond 304 automatically when matching.
- Vary header: If your response changes based on Accept or other headers, set Vary accordingly (e.g., Vary: Accept-Encoding, Accept).
- Do not set Cache-Control: private for sensitive data unless you understand the implications; prefer no-store for auth flows.

## Optional micro-cache (in-memory)

Use a tiny in-memory cache only for expensive, public GETs with short TTLs (10–60 seconds). Do not cache per-user or per-authorization responses.

```ts
// src/utils/microCache.ts
export type CacheEntry<T> = { value: T; expiresAt: number }

const store = new Map<string, CacheEntry<unknown>>()

export function getCache<T>(key: string): T | undefined {
  const hit = store.get(key)
  if (!hit) return undefined
  if (hit.expiresAt < Date.now()) {
    store.delete(key)
    return undefined
  }
  return hit.value as T
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function delByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
```

Usage pattern

```ts
// Key must include all parameters that affect the result
const key = `characters:list:visibility=${q.visibility}|owner=${q.ownerId}|sort=${q.sort}|cursor=${q.cursor}|limit=${q.limit}`
const cached = getCache<any[]>(key)
if (cached) {
  reply.header('Cache-Control', 'public, max-age=10')
  return cached
}
const data = await characterService.list(q)
setCache(key, data, 10_000)
reply.header('Cache-Control', 'public, max-age=10')
return data
```

Invalidation

- On create/update/delete of a resource type, delete keys by a simple prefix (e.g., characters:).
- For item updates, also delete the specific item key (e.g., characters:item:{ID}).
- Keep TTLs short to reduce the cost of stale data.

## CDN/edge hints (optional)

- If using a CDN/reverse proxy, you can add Surrogate-Control or use s-maxage in Cache-Control to hint edge TTLs.
- Add Cache-Control: immutable only for versioned asset URLs.

## Don’ts

- Do not cache responses that depend on Authorization or user identity (unless using private browser cache explicitly and intentionally).
- Do not use long TTLs for dynamic API JSON; prefer 10–120 seconds for public data.
- Do not forget to cap list endpoints (limit) and use stable sort to prevent inconsistent caches.

## Quick checklist (for PR reviews)

- [ ] Every route sets Cache-Control explicitly (public TTL for public GETs; no-store for auth/sensitive).
- [ ] ETag enabled for JSON responses (or explicit Last-Modified).
- [ ] No shared caching for personalized/auth responses.
- [ ] Micro-cache only used for clearly public, expensive GETs with short TTL.
- [ ] Invalidation path is clear: which prefixes are deleted on which mutations.
- [ ] Vary set if response changes by Accept or other headers.
- [ ] Asset URLs are versioned (hash) if long-lived caching is used.
