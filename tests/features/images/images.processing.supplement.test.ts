/**
 * Additional edge case tests for image processing validation
 */

import { describe, expect, it, vi } from 'vitest'

describe('Image Processing - Edge Cases', () => {
    it('should handle maximum allowed dimensions exactly', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        const maxDim = 2048
        expect(() => processing.validateImageDimensions(maxDim, maxDim)).not.toThrow()
    })

    it('should handle one pixel over maximum dimensions', async () => {
        vi.doUnmock('../../../src/features/images/images.processing')
        const processing = await import('../../../src/features/images/images.processing')

        const overMax = 2049
        expect(() => processing.validateImageDimensions(overMax, 100)).toThrow(
            'Image dimensions must be less than 2048x2048px'
        )
    })
})
