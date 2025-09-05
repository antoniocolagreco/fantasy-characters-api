import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

function parseOrigins(envString?: string): string[] {
    if (!envString) return []
    return envString
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
}

export default fp(async (fastify: FastifyInstance) => {
    const isProd = process.env.NODE_ENV === 'production'

    // Development defaults for local frontends
    const devOrigins = [
        'http://localhost:5173', // Vite
        'http://localhost:3000', // Next.js
        'http://localhost:4321', // Astro
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
    ]

    const envOrigins = parseOrigins(process.env.CORS_ORIGINS)
    const allowedOrigins = isProd ? envOrigins : [...envOrigins, ...devOrigins]

    await fastify.register(cors, {
        origin: (origin, callback) => {
            // Allow non-browser tools (Postman, curl, etc.)
            if (!origin) return callback(null, true)

            // Block null origins (file://, sandboxed frames)
            if (origin === 'null') {
                return callback(new Error('CORS: null origin not allowed'), false)
            }

            const isAllowed = allowedOrigins.includes(origin)
            if (!isAllowed) {
                return callback(new Error(`CORS: origin not allowed: ${origin}`), false)
            }

            callback(null, true)
        },
        credentials: process.env.CORS_CREDENTIALS !== 'false', // Default true
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Authorization', // JWT tokens
            'Content-Type', // JSON requests
            'X-Requested-With', // AJAX requests
            'X-Request-Id', // Request tracking
        ],
        exposedHeaders: [
            // Only add if using custom pagination headers
            'X-Next-Cursor',
            'X-Total-Count',
        ],
        maxAge: 600, // 10 minutes preflight cache
    })
})
