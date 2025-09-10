import type { FastifyReply } from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
    buildCacheKey,
    getCache,
    invalidateByPrefix,
    setCache,
    setLongLivedBinaryCache,
    setNoStore,
    setPublicListCache,
    setPublicResourceCache,
} from '@/shared/utils/cache.helper'

function createReply(): FastifyReply {
    // Minimal mock for header
    const headers: Record<string, string> = {}
    return {
        header(key: string, value: string) {
            headers[key] = value
            return undefined as unknown as FastifyReply
        },
        // Expose for assertions (not part of FastifyReply contract used)
        // non-standard: used only in tests
        _headers: headers,
    } as unknown as FastifyReply
}

function getHeader(reply: FastifyReply, key: string): string | undefined {
    // @ts-expect-error test helper property
    const headers = reply._headers as Record<string, string> | undefined
    return headers?.[key]
}

describe('cache.helper', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('Cache-Control header helpers', () => {
        it('sets public resource cache headers', () => {
            const reply = createReply()
            setPublicResourceCache(reply)
            expect(getHeader(reply, 'Cache-Control')).toBe(
                'public, max-age=60, stale-while-revalidate=30'
            )
        })

        it('sets public list cache headers', () => {
            const reply = createReply()
            setPublicListCache(reply)
            expect(getHeader(reply, 'Cache-Control')).toBe(
                'public, max-age=30, stale-while-revalidate=15'
            )
        })

        it('sets no-store headers', () => {
            const reply = createReply()
            setNoStore(reply)
            expect(getHeader(reply, 'Cache-Control')).toBe('no-store')
        })

        it('sets long-lived binary cache headers', () => {
            const reply = createReply()
            setLongLivedBinaryCache(reply)
            expect(getHeader(reply, 'Cache-Control')).toBe('public, max-age=31536000, immutable')
        })
    })

    describe('micro-cache store', () => {
        it('returns undefined for missing or expired keys', () => {
            // Missing
            expect(getCache('nope')).toBeUndefined()

            // Expired (use fake timers across set/get to keep Date.now consistent)
            vi.useFakeTimers()
            const key = 'k1'
            setCache(key, { foo: 'bar' }, 1)
            vi.advanceTimersByTime(2)
            expect(getCache<typeof key>(key)).toBeUndefined()
            vi.useRealTimers()
        })

        it('stores and returns values within TTL', () => {
            const key = 'k2'
            const value = { a: 1 }
            setCache(key, value, 50)
            expect(getCache<typeof value>(key)).toEqual(value)
        })

        it('invalidates by prefix', () => {
            const a = 'list:page1'
            const b = 'list:page2'
            const other = 'detail:123'
            setCache(a, 1, 5000)
            setCache(b, 2, 5000)
            setCache(other, 3, 5000)

            invalidateByPrefix('list:')

            expect(getCache<number>(a)).toBeUndefined()
            expect(getCache<number>(b)).toBeUndefined()
            expect(getCache<number>(other)).toBe(3)
        })
    })

    describe('buildCacheKey', () => {
        it('produces stable keys regardless of object key order', () => {
            const input1 = {
                b: 2,
                a: 1,
                nested: { y: 2, x: 1 },
                arr: [{ z: 3, y: 2 }],
            }
            const input2 = {
                a: 1,
                b: 2,
                nested: { x: 1, y: 2 },
                arr: [{ y: 2, z: 3 }],
            }

            const k1 = buildCacheKey('prefix', input1)
            const k2 = buildCacheKey('prefix', input2)

            expect(k1).toBe(k2)
            expect(k1.startsWith('prefix:')).toBe(true)
        })

        it('changes when input changes', () => {
            const k1 = buildCacheKey('p', { a: 1 })
            const k2 = buildCacheKey('p', { a: 2 })
            expect(k1).not.toBe(k2)
        })

        it('handles primitives and arrays', () => {
            const k1 = buildCacheKey('p', 'str')
            const k2 = buildCacheKey('p', ['a', 'b'])
            expect(typeof k1).toBe('string')
            expect(typeof k2).toBe('string')
            expect(k1).not.toBe(k2)
        })
    })
})
