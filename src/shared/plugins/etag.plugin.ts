import etag from '@fastify/etag'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

/**
 * ETag plugin
 * Generates strong ETags for JSON responses to enable 304 Not Modified handling
 */
export default fp(async function etagPlugin(fastify: FastifyInstance) {
    await fastify.register(etag, { weak: false })
})
