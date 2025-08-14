import { FastifyRequest, FastifyReply } from 'fastify'
import * as imageService from './image.service.js'

// Controllers
export const uploadImage = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    // Get file from multipart form data
    const file = await request.file()

    if (!file) {
      reply.code(400)
      return reply.send({
        message: 'No file provided',
        statusCode: 400,
        error: 'Bad Request',
      })
    }

    // Convert file buffer to Buffer
    const buffer = await file.toBuffer()

    // Get user ID from JWT
    const userId = request.authUser?.id

    // Create image
    const image = await imageService.createImage({
      file: buffer,
      filename: file.filename,
      mimeType: file.mimetype,
      uploadedById: userId,
    })

    reply.code(201)
    return reply.send({
      data: image,
      message: 'Image uploaded successfully',
    })
  } catch (error) {
    request.log.error(error, 'Error uploading image')
    throw error
  }
}

export const getImage = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const params = request.params as { id: string }
    const { id } = params

    // Get image metadata
    const image = await imageService.findImageById(id)

    reply.code(200)
    return reply.send({
      data: image,
    })
  } catch (error) {
    request.log.error(error, 'Error getting image')
    throw error
  }
}

export const deleteImage = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const params = request.params as { id: string }
    const { id } = params

    // Delete image - service will handle if image exists
    await imageService.deleteImage(id)

    reply.code(200)
    return reply.send({
      message: 'Image deleted successfully',
    })
  } catch (error) {
    request.log.error(error, 'Error deleting image')
    throw error
  }
}

export const getImagesList = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const query = request.query as {
      page?: number
      limit?: number
      search?: string
      uploadedById?: string
    }

    const result = await imageService.getImagesList(query)

    reply.code(200)
    return reply.send({
      data: result.images,
      pagination: result.pagination,
    })
  } catch (error) {
    request.log.error(error, 'Error listing images')
    throw error
  }
}

export const getImageStats = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const stats = await imageService.getImageStats()

    reply.code(200)
    return reply.send({
      data: stats,
    })
  } catch (error) {
    request.log.error(error, 'Error getting image statistics')
    throw error
  }
}

export const getImageFile = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const params = request.params as { id: string }
    const { id } = params

    // Get image with binary data
    const imageData = await imageService.getImageBinaryData(id)

    // Set proper headers for image response
    reply.type(imageData.mimeType)
    reply.header('Content-Length', imageData.size.toString())
    reply.header('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    reply.header('Content-Disposition', `inline; filename="${imageData.filename}"`)

    reply.code(200)
    return reply.send(imageData.blob)
  } catch (error) {
    request.log.error(error, 'Error serving image file')
    throw error
  }
}
