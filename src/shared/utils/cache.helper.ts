import { createHash } from 'node:crypto'
/**
 * Small helpers to set Cache-Control consistently
 */
export function setPublicResourceCache(reply: { header: (k: string, v: string) => unknown }) {
    reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=30')
}

export function setPublicListCache(reply: { header: (k: string, v: string) => unknown }) {
    reply.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=15')
}

export function setNoStore(reply: { header: (k: string, v: string) => unknown }) {
    reply.header('Cache-Control', 'no-store')
}

export function setLongLivedBinaryCache(reply: { header: (k: string, v: string) => unknown }) {
    reply.header('Cache-Control', 'public, max-age=31536000, immutable')
}

// Optional micro-cache for expensive public queries
type CacheEntry<T> = { value: T; expiresAt: number }
const microCacheStore = new Map<string, CacheEntry<unknown>>()

export function getCache<T>(key: string): T | undefined {
    const hit = microCacheStore.get(key)
    if (!hit || hit.expiresAt < Date.now()) {
        if (hit) microCacheStore.delete(key)
        return undefined
    }
    return hit.value as T
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
    microCacheStore.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function invalidateByPrefix(prefix: string): void {
    for (const key of microCacheStore.keys()) {
        if (key.startsWith(prefix)) microCacheStore.delete(key)
    }
}

// Build a stable cache key from an arbitrary input by deep-sorting keys and hashing JSON
function sortKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeysDeep)
    if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>
        const sorted: Record<string, unknown> = {}
        for (const k of Object.keys(obj).sort()) {
            sorted[k] = sortKeysDeep(obj[k])
        }
        return sorted
    }
    return value
}

export function buildCacheKey(prefix: string, input: unknown): string {
    const json = JSON.stringify(sortKeysDeep(input))
    const hash = createHash('sha1').update(json).digest('hex')
    return `${prefix}:${hash}`
}
