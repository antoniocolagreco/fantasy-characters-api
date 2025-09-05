import helmet from '@fastify/helmet'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

export default fp(async (fastify: FastifyInstance) => {
    await fastify.register(helmet, {
        // Content Security Policy
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Swagger UI
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
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
