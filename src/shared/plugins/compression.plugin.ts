import type { FastifyInstance } from 'fastify'
import fastifyCompress from '@fastify/compress'

/**
 * Response compression plugin (gzip/brotli)
 */
export async function compressionPlugin(fastify: FastifyInstance): Promise<void> {
    await fastify.register(fastifyCompress, {
        global: true,
        threshold: 1024, // Only compress responses larger than 1KB
        encodings: ['gzip', 'deflate', 'br'],
        customTypes: /^text\/|json$|javascript$/,
    })
}
