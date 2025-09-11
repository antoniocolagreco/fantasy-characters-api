import type { FastifyReply, FastifyRequest } from 'fastify'

import { imageService } from '../images.service'

import type {
    CreateImage,
    ImageListQuery,
    ImageParams,
    UpdateImage,
    ImageStatsQuery,
} from './images.schema'

import { HTTP_STATUS } from '@/shared/constants/http-status'
import { err } from '@/shared/errors'
import { setNoStore, setPublicListCache, setPublicResourceCache } from '@/shared/utils'
import { success, paginated } from '@/shared/utils/response.helper'

/**
 * Image controllers - handle HTTP requests and responses
 * Following new RBAC architecture: Pure HTTP coordination, delegate everything to service.
 */

export const imageController = {
    async uploadImage(request: FastifyRequest<{ Body: CreateImage }>, reply: FastifyReply) {
        // Extract HTTP data
        const file = await request.file()
        if (!file) {
            throw err('VALIDATION_ERROR', 'No file provided')
        }

        const buffer = await file.toBuffer()
        const { body } = request
        const { user } = request // Set by auth middleware

        // Delegate to service - service handles all business logic and security
        const image = await imageService.createImage(
            body,
            { mimetype: file.mimetype, filename: file.filename },
            buffer,
            user
        )

        // Format HTTP response using consistent success() pattern
        setNoStore(reply)
        return reply.code(HTTP_STATUS.CREATED).send(success(image, request.id))
    },

    async getImageById(request: FastifyRequest<{ Params: ImageParams }>, reply: FastifyReply) {
        // Extract HTTP parameters
        const { id } = request.params
        const { user } = request

        // Delegate to service
        const image = await imageService.getImageById(id, user)

        if (!image) {
            throw err('RESOURCE_NOT_FOUND', 'Image not found')
        }

        // Format HTTP response
        setPublicResourceCache(reply)
        return reply.code(HTTP_STATUS.OK).send(success(image, request.id))
    },

    async getImageFile(request: FastifyRequest<{ Params: ImageParams }>, reply: FastifyReply) {
        // Extract HTTP parameters
        const { id } = request.params
        const { user } = request

        // Delegate to service
        const imageFile = await imageService.getImageFile(id, user)

        if (!imageFile) {
            throw err('RESOURCE_NOT_FOUND', 'Image not found')
        }

        // Set HTTP headers and send binary response
        reply.header('Content-Type', imageFile.mimeType)
        reply.header('Content-Length', imageFile.size)
        reply.header('Cache-Control', 'public, max-age=31536000, immutable')

        return reply.send(imageFile.blob)
    },

    async listImages(
        request: FastifyRequest<{ Querystring: ImageListQuery }>,
        reply: FastifyReply
    ) {
        // Extract HTTP parameters
        const { query } = request
        const { user } = request

        // Delegate to service
        const result = await imageService.listImages(query, user)

        // Format HTTP response
        setPublicListCache(reply)
        return reply
            .code(HTTP_STATUS.OK)
            .send(paginated(result.data, result.pagination, request.id))
    },

    async updateImage(
        request: FastifyRequest<{ Params: ImageParams; Body: UpdateImage }>,
        reply: FastifyReply
    ) {
        // Extract HTTP parameters
        const { id } = request.params
        const data = request.body
        const { user } = request

        // Delegate to service
        const image = await imageService.updateImage(id, data, user)

        if (!image) {
            throw err('RESOURCE_NOT_FOUND', 'Image not found')
        }

        // Format HTTP response
        setNoStore(reply)
        return reply.code(HTTP_STATUS.OK).send(success(image, request.id))
    },

    async replaceImageFile(request: FastifyRequest<{ Params: ImageParams }>, reply: FastifyReply) {
        // Extract HTTP data
        const { id } = request.params
        const file = await request.file()

        if (!file) {
            throw err('VALIDATION_ERROR', 'No file provided')
        }

        const buffer = await file.toBuffer()
        const { user } = request

        // Delegate to service
        const image = await imageService.replaceImageFile(
            id,
            { mimetype: file.mimetype, filename: file.filename },
            buffer,
            user
        )

        if (!image) {
            throw err('RESOURCE_NOT_FOUND', 'Image not found')
        }

        // Format HTTP response
        setNoStore(reply)
        return reply.code(HTTP_STATUS.OK).send(success(image, request.id))
    },

    async deleteImage(request: FastifyRequest<{ Params: ImageParams }>, reply: FastifyReply) {
        // Extract HTTP parameters
        const { id } = request.params
        const { user } = request

        // Delegate to service
        const deleted = await imageService.deleteImage(id, user)

        if (!deleted) {
            throw err('RESOURCE_NOT_FOUND', 'Image not found')
        }

        // Format HTTP response (204 No Content)
        setNoStore(reply)
        return reply.code(HTTP_STATUS.NO_CONTENT).send()
    },

    async getImageStats(
        request: FastifyRequest<{ Querystring: ImageStatsQuery }>,
        reply: FastifyReply
    ) {
        // Extract HTTP parameters
        const { query } = request
        const { user } = request

        // Delegate to service
        const stats = await imageService.getImageStats(query.ownerId, user)

        // Format HTTP response
        setPublicListCache(reply)
        return reply.code(HTTP_STATUS.OK).send(success(stats, request.id))
    },
} as const
