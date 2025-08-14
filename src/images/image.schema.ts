import { Type } from '@sinclair/typebox'
import { IMAGE, CONTENT_TYPES } from '../shared/constants.js'

// Base image schema for database
export const imageSchema = Type.Object(
  {
    id: Type.String({ format: 'uuid' }),
    blob: Type.String(),
    description: Type.Optional(Type.String()),
    filename: Type.String(),
    size: Type.Number({ minimum: 1 }),
    mimeType: Type.Literal(CONTENT_TYPES.IMAGE_WEBP),
    width: Type.Number({ minimum: 1, maximum: IMAGE.MAX_WIDTH }),
    height: Type.Number({ minimum: 1, maximum: IMAGE.MAX_HEIGHT }),
    uploadedById: Type.Optional(Type.String({ format: 'uuid' })),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  },
  { $id: 'Image' },
)

// Upload request schema
export const imageUploadSchema = Type.Object(
  {
    file: Type.Object({
      data: Type.String(),
      filename: Type.String(),
      encoding: Type.String(),
      mimetype: Type.Union([
        Type.Literal(CONTENT_TYPES.IMAGE_JPEG),
        Type.Literal(CONTENT_TYPES.IMAGE_PNG),
        Type.Literal(CONTENT_TYPES.IMAGE_WEBP),
      ]),
    }),
    description: Type.Optional(Type.String({ maxLength: 500 })),
  },
  { $id: 'ImageUpload' },
)

// Image response schema (without blob data for listing)
export const imageResponseSchema = Type.Object(
  {
    id: Type.String({ format: 'uuid' }),
    description: Type.Optional(Type.String()),
    filename: Type.String(),
    size: Type.Number(),
    mimeType: Type.String(),
    width: Type.Number(),
    height: Type.Number(),
    uploadedById: Type.Optional(Type.String({ format: 'uuid' })),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  },
  { $id: 'ImageResponse' },
)

// Image error schemas
export const imageNotFoundSchema = Type.Object(
  {
    error: Type.Literal('NotFoundError'),
    message: Type.String(),
    statusCode: Type.Literal(404),
  },
  { $id: 'ImageNotFound' },
)

export const imageValidationErrorSchema = Type.Object(
  {
    error: Type.Literal('ValidationError'),
    message: Type.String(),
    statusCode: Type.Literal(400),
  },
  { $id: 'ImageValidationError' },
)

export const imageTooLargeErrorSchema = Type.Object(
  {
    error: Type.Literal('PayloadTooLargeError'),
    message: Type.String(),
    statusCode: Type.Literal(413),
  },
  { $id: 'ImageTooLargeError' },
)

export const imageProcessingErrorSchema = Type.Object(
  {
    error: Type.Literal('ImageProcessingError'),
    message: Type.String(),
    statusCode: Type.Literal(422),
  },
  { $id: 'ImageProcessingError' },
)

// Route response schemas
export const uploadImageResponseSchema = Type.Object(
  {
    data: imageResponseSchema,
    message: Type.String(),
  },
  { $id: 'UploadImageResponse' },
)

export const getImageResponseSchema = Type.Object(
  {
    data: imageResponseSchema,
  },
  { $id: 'GetImageResponse' },
)

export const deleteImageResponseSchema = Type.Object(
  {
    message: Type.String(),
  },
  { $id: 'DeleteImageResponse' },
)

// List images query schema
export const listImagesQuerySchema = Type.Object(
  {
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
    search: Type.Optional(Type.String({ maxLength: 100 })),
    uploadedById: Type.Optional(Type.String({ format: 'uuid' })),
  },
  { $id: 'ListImagesQuery' },
)

// List images response schema
export const listImagesResponseSchema = Type.Object(
  {
    data: Type.Array(imageResponseSchema),
    pagination: Type.Object({
      page: Type.Number(),
      limit: Type.Number(),
      total: Type.Number(),
      totalPages: Type.Number(),
    }),
  },
  { $id: 'ListImagesResponse' },
)

// Image statistics schema
export const imageStatsResponseSchema = Type.Object({
  data: Type.Object({
    totalImages: Type.Number({ description: 'Total number of images' }),
    totalSize: Type.Number({ description: 'Total size of all images in bytes' }),
    averageSize: Type.Number({ description: 'Average size per image in bytes' }),
    byMimeType: Type.Record(Type.String(), Type.Number(), {
      description: 'Images count by MIME type',
    }),
    recentUploads: Type.Object({
      last24Hours: Type.Number({ description: 'Images uploaded in last 24 hours' }),
      last7Days: Type.Number({ description: 'Images uploaded in last 7 days' }),
      last30Days: Type.Number({ description: 'Images uploaded in last 30 days' }),
    }),
  }),
})
