import fastifyMultipart from '@fastify/multipart'
import type { FastifyInstance } from 'fastify'

/**
 * Multipart file upload handling plugin
 */
export async function multipartPlugin(fastify: FastifyInstance): Promise<void> {
    await fastify.register(fastifyMultipart, {
        limits: {
            fieldNameSize: 100, // Max field name size in bytes
            fieldSize: 100, // Max field value size in bytes
            fields: 10, // Max number of non-file fields
            fileSize: 10_000_000, // 10MB max file size
            files: 5, // Max number of file fields
            headerPairs: 2000, // Max number of header key-value pairs
        },
        attachFieldsToBody: true,
        sharedSchemaId: 'MultipartFileSchema',
    })
}
