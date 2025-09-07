import type { FastifyReply, FastifyRequest } from 'fastify'

import { imageService } from '../images.service'

import type { CreateImage, ImageListQuery, ImageParams, UpdateImage } from './images.schema'

import { HTTP_STATUS } from '@/shared/constants/http-status'
import { err } from '@/shared/errors'
import { success, paginated, created } from '@/shared/utils/response.helper'

/**
 * Image controllers - handle HTTP requests and responses
 */

export const imageController = {
    async uploadImage(request: FastifyRequest, reply: FastifyReply) {
        const file = await request.file()
        if (!file) {
            throw err('VALIDATION_ERROR', 'No file provided')
        }

        const buffer = await file.toBuffer()
        const body = request.body as CreateImage

        const image = await imageService.createImage(
            body,
            { mimetype: file.mimetype, filename: file.filename },
            buffer,
            request.user
        )

        const { response, headers } = created(image, `/api/v1/images/${image.id}`, request.id)
        return reply.code(HTTP_STATUS.CREATED).headers(headers).send(response)
    },

    async getImageById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as ImageParams
        const image = await imageService.getImageById(id, request.user)

        if (!image) {
            throw err('RESOURCE_NOT_FOUND', 'Image not found')
        }

        return reply.code(HTTP_STATUS.OK).send(success(image, request.id))
    },

    async getImageFile(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as ImageParams
        const imageFile = await imageService.getImageFile(id, request.user)

        if (!imageFile) {
            throw err('RESOURCE_NOT_FOUND', 'Image not found')
        }

        // Set appropriate headers for image serving
        reply.header('Content-Type', imageFile.mimeType)
        reply.header('Content-Length', imageFile.size)
        reply.header('Cache-Control', 'public, max-age=31536000, immutable')

        return reply.send(imageFile.blob)
    },

    async listImages(request: FastifyRequest, reply: FastifyReply) {
        const query = request.query as ImageListQuery
        const result = await imageService.listImages(query, request.user)

        return reply
            .code(HTTP_STATUS.OK)
            .send(paginated(result.data, result.pagination, request.id))
    },

    async updateImage(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as ImageParams
        const data = request.body as UpdateImage

        const image = await imageService.updateImage(id, data, request.user)

        if (!image) {
            throw err('RESOURCE_NOT_FOUND', 'Image not found')
        }

        return reply.code(HTTP_STATUS.OK).send(success(image, request.id))
    },

    async replaceImageFile(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as ImageParams
        const file = await request.file()

        if (!file) {
            throw err('VALIDATION_ERROR', 'No file provided')
        }

        const buffer = await file.toBuffer()

        const image = await imageService.replaceImageFile(
            id,
            { mimetype: file.mimetype, filename: file.filename },
            buffer,
            request.user
        )

        if (!image) {
            throw err('RESOURCE_NOT_FOUND', 'Image not found')
        }

        return reply.code(HTTP_STATUS.OK).send(success(image, request.id))
    },

    async deleteImage(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as ImageParams
        const deleted = await imageService.deleteImage(id, request.user)

        if (!deleted) {
            throw err('RESOURCE_NOT_FOUND', 'Image not found')
        }

        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },

    async getImageStats(request: FastifyRequest, reply: FastifyReply) {
        const query = request.query as { ownerId?: string }
        const stats = await imageService.getImageStats(query.ownerId, request.user)

        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },
} as const
