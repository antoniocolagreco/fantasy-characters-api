import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import stripTags from 'striptags'
import { stripLow } from 'validator'

export type SanitizationPluginOptions = {
    methods?: ReadonlyArray<'POST' | 'PUT' | 'PATCH'>
    maxDepth?: number
    maxLen?: number
}

const DEFAULT_METHODS = ['POST', 'PUT', 'PATCH'] as const
const DEFAULT_MAX_DEPTH = 10
const DEFAULT_MAX_LEN = 5000

function isJsonContentType(request: FastifyRequest): boolean {
    const contentType = request.headers['content-type']
    if (!contentType) return false
    return /application\/json|\+json/i.test(contentType)
}

function stripHtmlToText(input: string): string {
    if (!input) return input
    // Remove script/style blocks entirely
    const withoutScripts = input
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    // Remove all tags but keep inner text
    return stripTags(withoutScripts)
}

function normalizeText(input: string, maxLen = DEFAULT_MAX_LEN): string {
    // Remove control characters (keep tab/newline/carriage return)
    let cleaned = stripLow(input, true)
    // Convert any HTML to plain text first
    cleaned = stripHtmlToText(cleaned)
    // Collapse whitespace and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    // Clamp length to avoid abuse
    if (cleaned.length > maxLen) cleaned = cleaned.slice(0, maxLen)
    return cleaned
}

function createSanitizer(options?: SanitizationPluginOptions) {
    const methods = (options?.methods ?? DEFAULT_METHODS) as ReadonlyArray<'POST' | 'PUT' | 'PATCH'>
    const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH
    const maxLen = options?.maxLen ?? DEFAULT_MAX_LEN

    function sanitizeValue(value: unknown): unknown {
        if (typeof value !== 'string') return value
        if (value.length === 0) return value
        return normalizeText(value, maxLen)
    }

    function sanitizeObjectDeep(
        obj: Record<string, unknown>,
        depth: number
    ): Record<string, unknown> {
        if (depth > maxDepth) return obj
        const out: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(obj)) {
            if (Array.isArray(v)) {
                out[k] = v.map(item => {
                    if (item && typeof item === 'object') {
                        return sanitizeObjectDeep(item as Record<string, unknown>, depth + 1)
                    }
                    return sanitizeValue(item)
                })
            } else if (v && typeof v === 'object') {
                out[k] = sanitizeObjectDeep(v as Record<string, unknown>, depth + 1)
            } else {
                out[k] = sanitizeValue(v)
            }
        }
        return out
    }

    async function middleware(request: FastifyRequest, _reply: FastifyReply) {
        if (!methods.includes(request.method as 'POST' | 'PUT' | 'PATCH')) return
        if (!isJsonContentType(request)) return
        if (!request.body || typeof request.body !== 'object') return

        try {
            const body = request.body as Record<string, unknown>
            request.body = sanitizeObjectDeep(body, 0)
        } catch (error) {
            request.log.warn({ error, url: request.url }, 'request sanitization failed')
        }
    }

    return { middleware, normalizeText, sanitizeObjectDeep }
}

export default fp(
    function sanitizationPlugin(
        fastify: FastifyInstance,
        opts: SanitizationPluginOptions | undefined,
        done
    ) {
        const sanitizer = createSanitizer(opts)
        // Run for matched routes, before AJV validation
        fastify.addHook('preValidation', sanitizer.middleware)

        fastify.decorate('sanitize', {
            text: sanitizer.normalizeText,
            object: (obj: Record<string, unknown>) => sanitizer.sanitizeObjectDeep(obj, 0),
        })

        done()
    },
    { name: 'sanitization' }
)

declare module 'fastify' {
    interface FastifyInstance {
        sanitize: {
            text: (text: string) => string
            object: (obj: Record<string, unknown>) => Record<string, unknown>
        }
    }
}
