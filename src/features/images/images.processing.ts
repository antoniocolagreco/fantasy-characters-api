import sharp from 'sharp'

import { err } from '@/shared/errors'

// Configuration constants
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_MAX_WIDTH = 2048
const DEFAULT_MAX_HEIGHT = 2048
const WEBP_QUALITY = 80

export type ProcessImageOptions = {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    position?: string
}

export type ProcessedImageResult = {
    buffer: Buffer
    width: number
    height: number
    size: number
    mimeType: 'image/webp'
}

/**
 * Validate file upload before processing
 */
export function validateImageFile(
    file: { mimetype: string; filename?: string },
    buffer: Buffer
): void {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
        throw err('INVALID_FILE_FORMAT', 'Only JPEG, PNG, and WebP files are allowed')
    }

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
        throw err(
            'FILE_TOO_LARGE',
            `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        )
    }

    // Basic file header validation
    if (buffer.length < 12) {
        throw err('INVALID_FILE_FORMAT', 'File appears to be corrupted or too small')
    }
}

/**
 * Process and convert image to WebP format
 */
export async function processImageToWebP(
    buffer: Buffer,
    options: ProcessImageOptions = {}
): Promise<ProcessedImageResult> {
    const {
        maxWidth = DEFAULT_MAX_WIDTH,
        maxHeight = DEFAULT_MAX_HEIGHT,
        quality = WEBP_QUALITY,
        fit = 'inside',
        position = 'center',
    } = options

    try {
        // Create Sharp instance and get metadata
        const sharpInstance = sharp(buffer)
        const metadata = await sharpInstance.metadata()

        if (!metadata.width || !metadata.height) {
            throw err('INVALID_FILE_FORMAT', 'Unable to read image dimensions')
        }

        // Process image: resize and convert to WebP
        const processedBuffer = await sharpInstance
            .resize(maxWidth, maxHeight, {
                fit,
                position,
                withoutEnlargement: true, // Don't upscale small images
            })
            .webp({
                quality,
                effort: 4, // Good balance between compression and speed
            })
            .toBuffer({ resolveWithObject: true })

        return {
            buffer: processedBuffer.data,
            width: processedBuffer.info.width,
            height: processedBuffer.info.height,
            size: processedBuffer.data.length,
            mimeType: 'image/webp',
        }
    } catch (error) {
        if (error instanceof Error) {
            // Handle specific Sharp errors
            if (error.message.includes('Input file contains unsupported image format')) {
                throw err('INVALID_FILE_FORMAT', 'Unsupported image format')
            }
            if (error.message.includes('Input file is missing')) {
                throw err('INVALID_FILE_FORMAT', 'File appears to be corrupted')
            }
            // Re-throw our custom errors
            if (
                error.message.includes('INVALID_FILE_FORMAT') ||
                error.message.includes('FILE_TOO_LARGE')
            ) {
                throw error
            }
        }

        throw err('UPLOAD_FAILED', 'Failed to process image')
    }
}

/**
 * Create thumbnail version of an image
 */
export async function createThumbnail(
    buffer: Buffer,
    size: number = 150
): Promise<ProcessedImageResult> {
    return processImageToWebP(buffer, {
        maxWidth: size,
        maxHeight: size,
        fit: 'cover',
        quality: 75, // Lower quality for thumbnails
    })
}

/**
 * Extract image metadata without processing
 */
export async function extractImageMetadata(buffer: Buffer): Promise<{
    width: number
    height: number
    format: string
    size: number
}> {
    try {
        const metadata = await sharp(buffer).metadata()

        if (!metadata.width || !metadata.height || !metadata.format) {
            throw err('INVALID_FILE_FORMAT', 'Unable to read image metadata')
        }

        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: buffer.length,
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('INVALID_FILE_FORMAT')) {
            throw error
        }
        throw err('UPLOAD_FAILED', 'Failed to extract image metadata')
    }
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
    width: number,
    height: number,
    maxWidth: number = DEFAULT_MAX_WIDTH,
    maxHeight: number = DEFAULT_MAX_HEIGHT
): void {
    if (width > maxWidth || height > maxHeight) {
        throw err(
            'VALUE_OUT_OF_RANGE',
            `Image dimensions must be less than ${maxWidth}x${maxHeight}px`
        )
    }

    if (width < 1 || height < 1) {
        throw err('INVALID_FORMAT', 'Invalid image dimensions')
    }
}
