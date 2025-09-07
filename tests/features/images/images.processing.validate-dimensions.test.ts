/**
 * Tests for validateImageDimensions function
 * Focused test file using proven dynamic import technique
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('validateImageDimensions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should accept valid dimensions', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        expect(() => processing.validateImageDimensions(800, 600)).not.toThrow()
    })

    it('should accept minimum valid dimensions', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        expect(() => processing.validateImageDimensions(1, 1)).not.toThrow()
    })

    it('should accept maximum valid dimensions', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        const maxDim = 2048
        expect(() => processing.validateImageDimensions(maxDim, maxDim)).not.toThrow()
    })

    it('should reject zero width', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        expect(() => processing.validateImageDimensions(0, 600)).toThrow('Invalid image dimensions')
    })

    it('should reject zero height', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        expect(() => processing.validateImageDimensions(800, 0)).toThrow('Invalid image dimensions')
    })

    it('should reject negative width', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        expect(() => processing.validateImageDimensions(-800, 600)).toThrow(
            'Invalid image dimensions'
        )
    })

    it('should reject negative height', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        expect(() => processing.validateImageDimensions(800, -600)).toThrow(
            'Invalid image dimensions'
        )
    })

    it('should reject width that is too large', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        expect(() => processing.validateImageDimensions(10000, 600)).toThrow(
            'Image dimensions must be less than 2048x2048px'
        )
    })

    it('should reject height that is too large', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        expect(() => processing.validateImageDimensions(800, 10000)).toThrow(
            'Image dimensions must be less than 2048x2048px'
        )
    })
})
