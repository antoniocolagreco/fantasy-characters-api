import helmet from '@fastify/helmet'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

export default fp(async (fastify: FastifyInstance) => {
    await fastify.register(helmet, {
        // Content Security Policy
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                // Swagger UI may inject some inline scripts; allow in dev
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Swagger UI
                imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
                // Allow same-origin plus protocols for server url declared in OpenAPI, and WS for dev
                connectSrc: ["'self'", 'http:', 'https:', 'ws:', 'wss:'],
                fontSrc: ["'self'", 'data:'],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },

        // Prevent MIME sniffing
        noSniff: true,

        // IE no open - sets X-Download-Options: noopen
        ieNoOpen: true,

        // Disallow Adobe cross-domain policies
        permittedCrossDomainPolicies: { permittedPolicies: 'none' },

        // Prevent clickjacking
        frameguard: { action: 'deny' },

        // Referrer Policy
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

        // Cross-Origin Resource Policy
        crossOriginResourcePolicy: { policy: 'same-site' },

        // HTTP Strict Transport Security (HSTS)
        strictTransportSecurity: {
            maxAge: 15552000, // 180 days
            includeSubDomains: true,
            preload: process.env.HSTS_PRELOAD === 'true',
        },

        // Cross-Origin Opener Policy
        crossOriginOpenerPolicy: { policy: 'same-origin' },

        // Cross-Origin Embedder Policy
        crossOriginEmbedderPolicy: false, // Disabled for API compatibility

        // Origin Agent Cluster
        originAgentCluster: true,
    })
})
