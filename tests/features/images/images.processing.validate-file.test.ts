/**
 * Tests for validateImageFile function
 * Focused test file using proven dynamic import technique
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('validateImageFile', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should validate JPEG files properly', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        const validFile = { mimetype: 'image/jpeg', filename: 'test.jpg' }
        const validBuffer = Buffer.alloc(1000)

        expect(() => processing.validateImageFile(validFile, validBuffer)).not.toThrow()
    })

    it('should validate PNG files properly', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        const validFile = { mimetype: 'image/png', filename: 'test.png' }
        const validBuffer = Buffer.alloc(1000)

        expect(() => processing.validateImageFile(validFile, validBuffer)).not.toThrow()
    })

    it('should validate WebP files properly', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        const validFile = { mimetype: 'image/webp', filename: 'test.webp' }
        const validBuffer = Buffer.alloc(1000)

        expect(() => processing.validateImageFile(validFile, validBuffer)).not.toThrow()
    })

    it('should reject invalid MIME types', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        const invalidFile = { mimetype: 'text/plain', filename: 'test.txt' }
        const buffer = Buffer.alloc(1000)

        expect(() => processing.validateImageFile(invalidFile, buffer)).toThrow(
            'Only JPEG, PNG, and WebP files are allowed'
        )
    })

    it('should reject files that are too large', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        const validFile = { mimetype: 'image/jpeg', filename: 'huge.jpg' }
        const largeBuffer = Buffer.alloc(20 * 1024 * 1024) // 20MB

        expect(() => processing.validateImageFile(validFile, largeBuffer)).toThrow(
            'File size must be less than 5MB'
        )
    })

    it('should reject files that are too small', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        const validFile = { mimetype: 'image/jpeg', filename: 'tiny.jpg' }
        const tinyBuffer = Buffer.alloc(10) // Less than 12 bytes minimum

        expect(() => processing.validateImageFile(validFile, tinyBuffer)).toThrow(
            'File appears to be corrupted or too small'
        )
    })
})
