import { FastifyInstance } from 'fastify'
import * as imageController from './image.controller'
import {
  getImageResponseSchema,
  deleteImageResponseSchema,
  uploadImageResponseSchema,
  imageNotFoundSchema,
  imageValidationErrorSchema,
  imageTooLargeErrorSchema,
  imageProcessingErrorSchema,
  listImagesQuerySchema,
  listImagesResponseSchema,
  imageStatsResponseSchema,
} from './image.schema'
import {
  authenticateUser,
  requireActiveUser,
  optionalAuthentication,
} from '../auth/auth.middleware'
import { CacheMiddleware } from '../shared/cache.middleware'

export const imageRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // List images
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all images with pagination and filtering',
        tags: ['Images'],
        querystring: listImagesQuerySchema,
        response: {
          200: listImagesResponseSchema,
        },
      },
      preHandler: [optionalAuthentication, CacheMiddleware.publicList()],
    },
    imageController.getImagesList,
  )

  // Get image statistics
  fastify.get(
    '/stats',
    {
      schema: {
        description: 'Get image statistics',
        tags: ['Images'],
        response: {
          200: imageStatsResponseSchema,
        },
      },
      preHandler: [authenticateUser, requireActiveUser, CacheMiddleware.stats()],
    },
    imageController.getImageStats,
  )

  // Upload image
  fastify.post(
    '/',
    {
      schema: {
        description: 'Upload a new image',
        tags: ['Images'],
        consumes: ['multipart/form-data'],
        response: {
          201: uploadImageResponseSchema,
          400: imageValidationErrorSchema,
          413: imageTooLargeErrorSchema,
          422: imageProcessingErrorSchema,
        },
      },
      preHandler: [authenticateUser, requireActiveUser],
    },
    imageController.uploadImage,
  )

  // Get image metadata
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get image metadata by ID',
        tags: ['Images'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          200: getImageResponseSchema,
          404: imageNotFoundSchema,
        },
      },
      preHandler: [optionalAuthentication, CacheMiddleware.medium()],
    },
    imageController.getImageById,
  )

  // Get image file (binary data)
  fastify.get(
    '/:id/file',
    {
      schema: {
        description: 'Get image file by ID (returns binary data)',
        tags: ['Images'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'string',
            format: 'binary',
            description: 'Image file in WebP format',
          },
          404: imageNotFoundSchema,
        },
        produces: ['image/webp'],
      },
    },
    imageController.getImageFile,
  )

  // Delete image
  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete an image',
        tags: ['Images'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          200: deleteImageResponseSchema,
          404: imageNotFoundSchema,
        },
      },
      preHandler: [authenticateUser, requireActiveUser],
    },
    imageController.deleteImage,
  )
}
