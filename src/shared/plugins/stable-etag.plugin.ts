import { createHash } from 'node:crypto'

import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

function isJsonContentType(value: unknown): boolean {
    if (typeof value !== 'string') return false
    return value.startsWith('application/json')
}

function tryParseJson(payload: unknown): unknown {
    if (payload === null || payload === undefined) return null
    if (typeof payload === 'object') return payload
    if (Buffer.isBuffer(payload)) {
        try {
            return JSON.parse(payload.toString('utf8'))
        } catch {
            return null
        }
    }
    if (typeof payload === 'string') {
        try {
            return JSON.parse(payload)
        } catch {
            return null
        }
    }
    return null
}

// Stable stringify with sorted object keys (recursively)
function stableStringify(value: unknown): string {
    return JSON.stringify(sortKeysDeep(value))
}

function sortKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeysDeep)
    if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>
        const sorted: Record<string, unknown> = {}
        for (const key of Object.keys(obj).sort()) {
            sorted[key] = sortKeysDeep(obj[key])
        }
        return sorted
    }
    return value
}

function computeStrongEtagFromEnvelope(envelope: Record<string, unknown>): string | null {
    if (!envelope || typeof envelope !== 'object') return null
    // Only hash stable fields (exclude requestId/timestamp/message)
    const subset: Record<string, unknown> = {}
    if ('data' in envelope) {
        const dataVal = (envelope as Record<string, unknown>).data
        subset.data = dataVal
    }
    if ('pagination' in envelope) {
        const pagVal = (envelope as Record<string, unknown>).pagination
        subset.pagination = pagVal
    }
    if (Object.keys(subset).length === 0) return null
    const json = stableStringify(subset)
    const hash = createHash('sha1').update(json).digest('hex')
    return `"${hash}"`
}

export default fp(async function stableEtagPlugin(app: FastifyInstance) {
    app.addHook('onSend', async (request, reply, payload) => {
        // Skip if not JSON or explicitly no-store (mutations)
        const ct = reply.getHeader('content-type')
        if (!isJsonContentType(typeof ct === 'string' ? ct : undefined)) return payload
        const cacheCtl = (reply.getHeader('cache-control') || '') as string
        if (cacheCtl.includes('no-store')) return payload

        // If ETag is already set by route, respect it
        const existing = reply.getHeader('etag') as string | undefined
        if (existing) {
            // Handle conditional request for existing ETag value
            const inm = request.headers['if-none-match']
            if (typeof inm === 'string' && inm === existing) {
                reply.code(304)
                return null
            }
            return payload
        }

        const parsed = tryParseJson(payload)
        if (!parsed || typeof parsed !== 'object') return payload
        const etag = computeStrongEtagFromEnvelope(parsed as Record<string, unknown>)
        if (!etag) return payload

        // Set ETag header based on stable subset
        reply.header('etag', etag)

        // Conditional requests handling (304)
        const inm = request.headers['if-none-match']
        if (typeof inm === 'string' && inm === etag) {
            reply.code(304)
            return null
        }

        return payload
    })
})
