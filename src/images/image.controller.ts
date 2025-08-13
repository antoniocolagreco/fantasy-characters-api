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

    // Get description from file fields if it exists
    const description: string | undefined = undefined // For now, skip description handling

    // Get user ID from JWT
    const userId = request.authUser?.id

    // Create image
    const image = await imageService.createImage({
      file: buffer,
      filename: file.filename,
      mimeType: file.mimetype,
      description,
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
    const userId = request.authUser?.id

    // First check if image exists and get image info
    await imageService.findImageById(id)

    // Check if user can delete this image (admin or owner)
    if (request.authUser?.role !== 'ADMIN') {
      if (!userId) {
        reply.code(401)
        return reply.send({
          message: 'Authentication required',
          statusCode: 401,
          error: 'Unauthorized',
        })
      }
      const canAccess = await imageService.canUserAccessImage(id, userId)
      if (!canAccess) {
        reply.code(403)
        return reply.send({
          message: 'You can only delete your own images',
          statusCode: 403,
          error: 'Forbidden',
        })
      }
    }

    // Delete image
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
