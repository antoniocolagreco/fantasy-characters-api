/**
 * Enhanced test coverage for image processing functions
 * Uses dynamic imports to bypass global mocks and test real functions
 */

import { describe, expect, it, vi } from 'vitest'

// CRITICAL: Unmock the image processing module to test real functions
vi.doUnmock('@/features/images/images.processing')
vi.doUnmock('../src/features/images/images.processing')

describe('Image Processing Unit Tests - Real Functions Enhanced', () => {
    describe('validateImageFile', () => {
        it('should pass with valid JPEG file', async () => {
            // Bypass global mocks using dynamic import with doUnmock
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/jpeg', filename: 'test.jpg' }
            const buffer = Buffer.alloc(1000)

            expect(() => validateImageFile(file, buffer)).not.toThrow()
        })

        it('should pass with valid PNG file', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/png', filename: 'test.png' }
            const buffer = Buffer.alloc(2000)

            expect(() => validateImageFile(file, buffer)).not.toThrow()
        })

        it('should pass with valid WebP file', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/webp', filename: 'test.webp' }
            const buffer = Buffer.alloc(3000)

            expect(() => validateImageFile(file, buffer)).not.toThrow()
        })

        it('should throw for invalid MIME type', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'text/plain', filename: 'test.txt' }
            const buffer = Buffer.alloc(1000)

            expect(() => validateImageFile(file, buffer)).toThrow(
                'Only JPEG, PNG, and WebP files are allowed'
            )
        })

        it('should throw for unsupported image/gif MIME type', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/gif', filename: 'test.gif' }
            const buffer = Buffer.alloc(1000)

            expect(() => validateImageFile(file, buffer)).toThrow(
                'Only JPEG, PNG, and WebP files are allowed'
            )
        })

        it('should throw for file too large', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/jpeg', filename: 'huge.jpg' }
            const buffer = Buffer.alloc(6 * 1024 * 1024) // 6MB > 5MB limit

            expect(() => validateImageFile(file, buffer)).toThrow('File size must be less than 5MB')
        })

        it('should throw for file too small', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/jpeg', filename: 'tiny.jpg' }
            const buffer = Buffer.alloc(11) // Below minimum 12 bytes

            expect(() => validateImageFile(file, buffer)).toThrow(
                'File appears to be corrupted or too small'
            )
        })

        it('should throw for empty file', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/png', filename: 'empty.png' }
            const buffer = Buffer.alloc(0)

            expect(() => validateImageFile(file, buffer)).toThrow(
                'File appears to be corrupted or too small'
            )
        })

        it('should accept file at exactly 5MB limit', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/jpeg', filename: 'max-size.jpg' }
            const buffer = Buffer.alloc(5 * 1024 * 1024) // Exactly 5MB

            expect(() => validateImageFile(file, buffer)).not.toThrow()
        })

        it('should reject file one byte over limit', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/webp', filename: 'over-limit.webp' }
            const buffer = Buffer.alloc(5 * 1024 * 1024 + 1) // 5MB + 1 byte

            expect(() => validateImageFile(file, buffer)).toThrow('File size must be less than 5MB')
        })

        it('should accept minimum valid file size', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/png', filename: 'min-size.png' }
            const buffer = Buffer.alloc(12) // At minimum threshold

            expect(() => validateImageFile(file, buffer)).not.toThrow()
        })

        it('should reject various non-image MIME types', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const buffer = Buffer.alloc(1000)
            const invalidTypes = [
                { mimetype: 'application/octet-stream', filename: 'unknown.bin' },
                { mimetype: 'video/mp4', filename: 'video.mp4' },
                { mimetype: 'image/svg+xml', filename: 'vector.svg' },
                { mimetype: 'text/html', filename: 'page.html' },
                { mimetype: 'application/pdf', filename: 'document.pdf' },
            ]

            invalidTypes.forEach(file => {
                expect(() => validateImageFile(file, buffer)).toThrow(
                    'Only JPEG, PNG, and WebP files are allowed'
                )
            })
        })

        it('should handle various valid buffer sizes', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/jpeg', filename: 'various-sizes.jpg' }

            // Test multiple valid sizes
            const validSizes = [12, 500, 1024, 2048, 1024 * 1024, 2 * 1024 * 1024]
            validSizes.forEach(size => {
                const buffer = Buffer.alloc(size)
                expect(() => validateImageFile(file, buffer)).not.toThrow()
            })
        })
    })

    describe('validateImageDimensions', () => {
        it('should pass with valid dimensions', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(800, 600)).not.toThrow()
        })

        it('should pass with minimum valid dimensions', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(1, 1)).not.toThrow()
        })

        it('should pass with maximum valid dimensions', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(2048, 2048)).not.toThrow()
        })

        it('should throw for width too large', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(2049, 600)).toThrow(
                'Image dimensions must be less than 2048x2048px'
            )
        })

        it('should throw for height too large', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(800, 2049)).toThrow(
                'Image dimensions must be less than 2048x2048px'
            )
        })

        it('should throw for both dimensions too large', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(3000, 3000)).toThrow(
                'Image dimensions must be less than 2048x2048px'
            )
        })

        it('should throw for width zero', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(0, 600)).toThrow('Invalid image dimensions')
        })

        it('should throw for height zero', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(800, 0)).toThrow('Invalid image dimensions')
        })

        it('should throw for negative width', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(-1, 600)).toThrow('Invalid image dimensions')
        })

        it('should throw for negative height', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(800, -1)).toThrow('Invalid image dimensions')
        })

        it('should throw for both dimensions zero', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(0, 0)).toThrow('Invalid image dimensions')
        })

        it('should respect custom max dimensions', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(1000, 800, 1500, 1200)).not.toThrow()
        })

        it('should throw for width exceeding custom max', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(1600, 800, 1500, 1200)).toThrow(
                'Image dimensions must be less than 1500x1200px'
            )
        })

        it('should throw for height exceeding custom max', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(1000, 1300, 1500, 1200)).toThrow(
                'Image dimensions must be less than 1500x1200px'
            )
        })

        it('should accept dimensions at custom max boundaries', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(1500, 1200, 1500, 1200)).not.toThrow()
        })

        it('should handle very large negative numbers', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(-999999, -999999)).toThrow(
                'Invalid image dimensions'
            )
        })

        it('should handle very large positive numbers', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            expect(() => validateImageDimensions(999999, 999999)).toThrow(
                'Image dimensions must be less than 2048x2048px'
            )
        })

        it('should handle decimal-like integers', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            // These should be treated as valid integers
            expect(() => validateImageDimensions(800.0, 600.0)).not.toThrow()
        })

        it('should handle dimension boundary values comprehensively', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            // Test boundary values
            expect(() => validateImageDimensions(1, 2048)).not.toThrow()
            expect(() => validateImageDimensions(2048, 1)).not.toThrow()
            expect(() => validateImageDimensions(1024, 1024)).not.toThrow()
            expect(() => validateImageDimensions(1, 1)).not.toThrow()

            // Test just over the limit
            expect(() => validateImageDimensions(2049, 1)).toThrow()
            expect(() => validateImageDimensions(1, 2049)).toThrow()
        })

        it('should handle custom limits with extreme values', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            // Test with very high custom limits
            expect(() => validateImageDimensions(5000, 4000, 6000, 5000)).not.toThrow()
            expect(() => validateImageDimensions(6001, 4000, 6000, 5000)).toThrow()

            // Test with very low custom limits
            expect(() => validateImageDimensions(50, 40, 100, 80)).not.toThrow()
            expect(() => validateImageDimensions(101, 40, 100, 80)).toThrow()
        })
    })

    describe('Comprehensive edge cases and boundary testing', () => {
        it('should validate all supported MIME types consistently', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const buffer = Buffer.alloc(1000)
            const supportedTypes = [
                { mimetype: 'image/jpeg', filename: 'test.jpg' },
                { mimetype: 'image/png', filename: 'test.png' },
                { mimetype: 'image/webp', filename: 'test.webp' },
            ]

            supportedTypes.forEach(file => {
                expect(() => validateImageFile(file, buffer)).not.toThrow()
            })
        })

        it('should handle file size edge cases thoroughly', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile } = await import('@/features/images/images.processing')

            const file = { mimetype: 'image/jpeg', filename: 'test.jpg' }

            // Test around minimum threshold (12 bytes)
            expect(() => validateImageFile(file, Buffer.alloc(11))).toThrow() // Below minimum
            expect(() => validateImageFile(file, Buffer.alloc(12))).not.toThrow() // At minimum
            expect(() => validateImageFile(file, Buffer.alloc(13))).not.toThrow() // Just above minimum

            // Test around maximum threshold (5MB)
            const fiveMB = 5 * 1024 * 1024
            expect(() => validateImageFile(file, Buffer.alloc(fiveMB - 1))).not.toThrow() // Just under max
            expect(() => validateImageFile(file, Buffer.alloc(fiveMB))).not.toThrow() // Exactly at max
            expect(() => validateImageFile(file, Buffer.alloc(fiveMB + 1))).toThrow() // Just over max
        })

        it('should test dimension validation with edge cases', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageDimensions } = await import('@/features/images/images.processing')

            // Test around the 2048 limit
            expect(() => validateImageDimensions(2047, 2047)).not.toThrow()
            expect(() => validateImageDimensions(2048, 2047)).not.toThrow()
            expect(() => validateImageDimensions(2047, 2048)).not.toThrow()
            expect(() => validateImageDimensions(2048, 2048)).not.toThrow()

            // Test just over limits
            expect(() => validateImageDimensions(2049, 2048)).toThrow()
            expect(() => validateImageDimensions(2048, 2049)).toThrow()
            expect(() => validateImageDimensions(2049, 2049)).toThrow()
        })

        it('should handle mixed valid and invalid combinations', async () => {
            vi.doUnmock('@/features/images/images.processing')
            const { validateImageFile, validateImageDimensions } = await import(
                '@/features/images/images.processing'
            )

            // Test combinations of valid files with valid dimensions
            const validFiles = [
                { mimetype: 'image/jpeg', filename: 'test.jpg' },
                { mimetype: 'image/png', filename: 'test.png' },
                { mimetype: 'image/webp', filename: 'test.webp' },
            ]

            const validSizes = [12, 1024, 2048, 1024 * 1024]
            const validDimensions = [
                [800, 600],
                [1920, 1080],
                [2048, 2048],
                [1, 1],
            ]

            // All combinations should pass
            validFiles.forEach(file => {
                validSizes.forEach(size => {
                    expect(() => validateImageFile(file, Buffer.alloc(size))).not.toThrow()
                })
            })

            validDimensions.forEach(([width, height]) => {
                expect(() => validateImageDimensions(width!, height!)).not.toThrow()
            })
        })
    })
})
