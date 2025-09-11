import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'

import { imageController } from './images.controller'
import * as schemas from './images.schema'

import { rbac, toFastifyPreHandler } from '@/features/auth/rbac.middleware'
import { ErrorResponseSchema } from '@/shared/schemas'

export const imageRoutes: FastifyPluginAsync = async app => {
    app.withTypeProvider<TypeBoxTypeProvider>()

    // GET /images - List image metadata
    app.get(
        '/images',
        {
            preHandler: [toFastifyPreHandler(rbac.read('images'))],
            schema: {
                tags: ['Images'],
                summary: 'List image metadata',
                description: 'Get paginated list of image metadata with optional filtering',
                security: [{ bearerAuth: [] }],
                querystring: schemas.ImageListQuerySchema,
                response: {
                    200: schemas.ImageListResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        imageController.listImages
    )

    // GET /images/:id - Get image metadata by ID
    app.get(
        '/images/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.read('images'))],
            schema: {
                tags: ['Images'],
                summary: 'Get image metadata by ID',
                description: 'Retrieve metadata for a single image by its unique identifier',
                security: [{ bearerAuth: [] }],
                params: schemas.ImageParamsSchema,
                response: {
                    200: schemas.ImageResponseSchema,
                    404: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        imageController.getImageById
    )

    // GET /images/:id/file - Get image binary (WebP)
    app.get(
        '/images/:id/file',
        {
            preHandler: [toFastifyPreHandler(rbac.read('images'))],
            schema: {
                tags: ['Images'],
                summary: 'Get image binary',
                description: 'Download the actual image file in WebP format',
                security: [{ bearerAuth: [] }],
                params: schemas.ImageParamsSchema,
                response: {
                    200: {
                        type: 'string',
                        format: 'binary',
                        description: 'Image file in WebP format',
                    },
                    404: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        imageController.getImageFile
    )

    // GET /images/stats - Image statistics
    app.get(
        '/images/stats',
        {
            preHandler: [toFastifyPreHandler(rbac.read('images'))],
            schema: {
                tags: ['Images'],
                summary: 'Get image statistics',
                description: 'Retrieve aggregated statistics about images',
                security: [{ bearerAuth: [] }],
                querystring: schemas.ImageStatsQuerySchema,
                response: {
                    200: schemas.ImageStatsResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        imageController.getImageStats
    )

    // POST /images - Upload new image
    app.post(
        '/images',
        {
            preHandler: [toFastifyPreHandler(rbac.create('images'))],
            schema: {
                tags: ['Images'],
                summary: 'Upload new image',
                description: 'Upload a new image file and create metadata record',
                security: [{ bearerAuth: [] }],
                consumes: ['multipart/form-data'],
                body: schemas.CreateImageSchema,
                response: {
                    201: schemas.ImageResponseSchema,
                    400: ErrorResponseSchema,
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    413: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        imageController.uploadImage
    )

    // PUT /images/:id - Update image metadata or replace file
    app.put(
        '/images/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.update('images'))],
            schema: {
                tags: ['Images'],
                summary: 'Update image metadata or replace file',
                description: 'Update image metadata or replace the image file',
                security: [{ bearerAuth: [] }],
                params: schemas.ImageParamsSchema,
                consumes: ['multipart/form-data'],
                body: schemas.UpdateImageSchema,
                response: {
                    200: schemas.ImageResponseSchema,
                    400: ErrorResponseSchema,
                    401: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    413: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        imageController.updateImage
    )

    // DELETE /images/:id - Delete image
    app.delete(
        '/images/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.delete('images'))],
            schema: {
                tags: ['Images'],
                summary: 'Delete image',
                description: 'Delete an image and its associated file',
                security: [{ bearerAuth: [] }],
                params: schemas.ImageParamsSchema,
                response: {
                    204: { type: 'null' },
                    401: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        imageController.deleteImage
    )
}
