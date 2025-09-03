import fp from 'fastify-plugin'
import DOMPurify from 'isomorphic-dompurify'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// Fields that should be sanitized as HTML
const HTML_FIELDS = new Set(['description', 'bio', 'backstory', 'notes', 'content', 'htmlContent'])

// Fields that should be normalized but not sanitized (plain text)
const TEXT_FIELDS = new Set(['name', 'title', 'email', 'username', 'slug', 'tag', 'category'])

function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p',
            'br',
            'strong',
            'em',
            'u',
            'ol',
            'ul',
            'li',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'blockquote',
            'code',
            'pre',
        ],
        ALLOWED_ATTR: ['class'],
        KEEP_CONTENT: true,
    })
}

function normalizeText(text: string): string {
    // Remove control characters using a more permissive approach
    const cleanText = text
        .split('')
        .filter(char => {
            const code = char.charCodeAt(0)
            // Keep printable characters (32-126) and common whitespace (9, 10, 13)
            return (code >= 32 && code <= 126) || [9, 10, 13].includes(code)
        })
        .join('')

    return cleanText
        .trim()
        .replace(/\s+/g, ' ') // Normalize whitespace
        .slice(0, 5000) // Reasonable length limit
}

function sanitizeValue(key: string, value: unknown): unknown {
    if (typeof value !== 'string') {
        return value
    }

    // Empty strings stay empty
    if (value.length === 0) {
        return value
    }

    // HTML fields get DOMPurify sanitization
    if (HTML_FIELDS.has(key)) {
        return sanitizeHtml(value)
    }

    // Text fields get normalization only
    if (TEXT_FIELDS.has(key)) {
        return normalizeText(value)
    }

    // Default: normalize whitespace for all other strings
    return normalizeText(value)
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'object' && item !== null
                    ? sanitizeObject(item as Record<string, unknown>)
                    : sanitizeValue(key, item)
            )
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>)
        } else {
            sanitized[key] = sanitizeValue(key, value)
        }
    }

    return sanitized
}

function sanitizationMiddleware(request: FastifyRequest, _reply: FastifyReply) {
    // Only sanitize request bodies for mutating operations
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
        return
    }

    // Skip if no body
    if (!request.body || typeof request.body !== 'object') {
        return
    }

    try {
        // Sanitize the request body in place
        request.body = sanitizeObject(request.body as Record<string, unknown>)
    } catch (error) {
        // Log the error but don't block the request
        request.log.warn({ error, url: request.url }, 'Failed to sanitize request body')
    }
}

export default fp(function sanitizationPlugin(fastify: FastifyInstance) {
    // Register the middleware globally for all routes
    fastify.addHook('preValidation', sanitizationMiddleware)

    // Expose sanitization utilities for manual use
    fastify.decorate('sanitize', {
        html: sanitizeHtml,
        text: normalizeText,
        object: sanitizeObject,
    })
})

declare module 'fastify' {
    interface FastifyInstance {
        sanitize: {
            html: (html: string) => string
            text: (text: string) => string
            object: (obj: Record<string, unknown>) => Record<string, unknown>
        }
    }
}
