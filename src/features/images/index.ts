// Image feature exports
export { imageService } from './images.service'
export { imageRoutes } from './v1/images.routes'

// Re-export types explicitly to avoid conflicts
export type {
    CreateImageInput,
    UpdateImageInput,
    ListImagesParams,
    ListImagesResult,
    ImageStats,
    ImageMetadata,
    CreateImageRequest,
    UpdateImageRequest,
} from './images.type'

export type { CreateImage, UpdateImage, ImageListQuery, ImageParams } from './v1/images.schema'

// Re-export schemas
export {
    ImageSchema,
    CreateImageSchema,
    UpdateImageSchema,
    ImageListQuerySchema,
    ImageParamsSchema,
    ImageResponseSchema,
    ImageListResponseSchema,
    ImageStatsResponseSchema,
} from './v1/images.schema'
