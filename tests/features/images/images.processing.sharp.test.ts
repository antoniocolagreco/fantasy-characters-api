import { beforeEach, describe, expect, it, vi } from 'vitest'

// Reset moduli e mock prima di ogni test per evitare interferenze
beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.unmock('sharp')
    vi.unmock('../../../src/features/images/images.processing')
    vi.unmock('@/features/images/images.processing')
})

describe('Image Processing - sharp flows', () => {
    it('processImageToWebP: success path', async () => {
        // 1. Prima mocka Sharp con comportamento corretto
        const mockSharp = vi.fn(() => ({
            metadata: vi.fn().mockResolvedValue({ width: 640, height: 480, format: 'jpeg' }),
            resize: vi.fn().mockReturnThis(),
            webp: vi.fn().mockReturnThis(),
            toBuffer: vi.fn().mockResolvedValue({
                data: Buffer.from('webp'),
                info: { width: 320, height: 240 },
            }),
        }))

        vi.doMock('sharp', () => ({
            __esModule: true,
            default: mockSharp,
        }))

        // 2. Poi importa il modulo (che userà Sharp mockato)
        const { processImageToWebP } = await import(
            '../../../src/features/images/images.processing'
        )

        // 3. Testa l'implementazione reale con Sharp mockato
        const res = await processImageToWebP(Buffer.from('input'))

        expect(res.mimeType).toBe('image/webp')
        expect(res.width).toBe(320)
        expect(res.height).toBe(240)
        expect(res.buffer).toBeInstanceOf(Buffer)
        expect(res.size).toBeGreaterThan(0)

        // Verifica che Sharp sia stato chiamato correttamente
        expect(mockSharp).toHaveBeenCalledWith(Buffer.from('input'))
    })

    it('createThumbnail: delegates to processImageToWebP with size', async () => {
        const mockSharp = vi.fn(() => ({
            metadata: vi.fn().mockResolvedValue({ width: 640, height: 480, format: 'jpeg' }),
            resize: vi.fn().mockReturnThis(),
            webp: vi.fn().mockReturnThis(),
            toBuffer: vi.fn().mockResolvedValue({
                data: Buffer.from('webp'),
                info: { width: 150, height: 150 },
            }),
        }))

        vi.doMock('sharp', () => ({
            __esModule: true,
            default: mockSharp,
        }))

        const { createThumbnail } = await import('../../../src/features/images/images.processing')

        const out = await createThumbnail(Buffer.from('in'), 128)
        expect(out.width).toBe(150)
        expect(out.mimeType).toBe('image/webp')
    })

    it('extractImageMetadata: returns basic info', async () => {
        const mockSharp = vi.fn(() => ({
            metadata: vi.fn().mockResolvedValue({ width: 640, height: 480, format: 'jpeg' }),
        }))

        vi.doMock('sharp', () => ({
            __esModule: true,
            default: mockSharp,
        }))

        const { extractImageMetadata } = await import(
            '../../../src/features/images/images.processing'
        )

        const meta = await extractImageMetadata(Buffer.from('in'))
        expect(meta).toEqual({ width: 640, height: 480, format: 'jpeg', size: 2 })
    })
})

describe('Image Processing - error mapping', () => {
    it('processImageToWebP: maps unsupported format error to INVALID_FILE_FORMAT', async () => {
        const mockSharp = vi.fn(() => ({
            metadata: vi.fn().mockResolvedValue({ width: 10, height: 10 }),
            resize: vi.fn().mockReturnThis(),
            webp: vi.fn().mockReturnThis(),
            toBuffer: vi
                .fn()
                .mockRejectedValue(new Error('Input file contains unsupported image format')),
        }))

        vi.doMock('sharp', () => ({
            __esModule: true,
            default: mockSharp,
        }))

        const { processImageToWebP } = await import(
            '../../../src/features/images/images.processing'
        )

        await expect(processImageToWebP(Buffer.from('x'))).rejects.toThrow(
            'Unsupported image format'
        )
    })

    it('processImageToWebP: maps generic errors to UPLOAD_FAILED', async () => {
        const mockSharp = vi.fn(() => ({
            metadata: vi.fn().mockResolvedValue({ width: 10, height: 10 }),
            resize: vi.fn().mockReturnThis(),
            webp: vi.fn().mockReturnThis(),
            toBuffer: vi.fn().mockRejectedValue(new Error('boom')),
        }))

        vi.doMock('sharp', () => ({
            __esModule: true,
            default: mockSharp,
        }))

        const { processImageToWebP } = await import(
            '../../../src/features/images/images.processing'
        )

        await expect(processImageToWebP(Buffer.from('x'))).rejects.toThrow(
            'Failed to process image'
        )
    })

    it('extractImageMetadata: maps errors to UPLOAD_FAILED', async () => {
        const mockSharp = vi.fn(() => ({
            metadata: vi.fn().mockRejectedValue(new Error('some error')),
        }))

        vi.doMock('sharp', () => ({
            __esModule: true,
            default: mockSharp,
        }))

        const { extractImageMetadata } = await import(
            '../../../src/features/images/images.processing'
        )

        await expect(extractImageMetadata(Buffer.from('x'))).rejects.toThrow(
            'Failed to extract image metadata'
        )
    })
})
