import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the image service module used by the controller
vi.mock('@/features/images/images.service', () => ({
    imageService: {
        createImage: vi.fn(),
        getImageById: vi.fn(),
        getImageFile: vi.fn(),
        listImages: vi.fn(),
        updateImage: vi.fn(),
        replaceImageFile: vi.fn(),
        deleteImage: vi.fn(),
        getImageStats: vi.fn(),
    },
}))

import { imageService } from '@/features/images/images.service'
import { imageController } from '@/features/images/v1/images.controller'
import { generateUUIDv7 } from '@/shared/utils'

// Test constants
const USER_ID = generateUUIDv7()
const IMAGE_ID = generateUUIDv7()
const TEST_DESC = 'Test description'

const mockService = imageService as {
    createImage: ReturnType<typeof vi.fn>
    getImageById: ReturnType<typeof vi.fn>
    getImageFile: ReturnType<typeof vi.fn>
    listImages: ReturnType<typeof vi.fn>
    updateImage: ReturnType<typeof vi.fn>
    replaceImageFile: ReturnType<typeof vi.fn>
    deleteImage: ReturnType<typeof vi.fn>
    getImageStats: ReturnType<typeof vi.fn>
}

function createReply() {
    const headers: Record<string, unknown> = {}
    const reply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
        header: vi.fn((k: string, v: unknown) => {
            headers[k] = v
            return reply
        }),
        headers: vi.fn().mockReturnThis(),
    } as unknown as any
    return { reply, headers }
}

describe('Images Controller - unit', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('uploadImage: creates image and sets Location header', async () => {
        const img = { id: 'img-1' }
        mockService.createImage.mockResolvedValue(img)

        const buff = Buffer.from('data')
        const file = {
            mimetype: 'image/jpeg',
            filename: 'a.jpg',
            toBuffer: vi.fn().mockResolvedValue(buff),
        }
        const request = {
            file: vi.fn().mockResolvedValue(file),
            body: { description: TEST_DESC },
            user: { id: USER_ID, role: 'USER' },
            id: 'req-1',
        } as unknown as any
        const { reply } = createReply()

        await imageController.uploadImage(request, reply)

        expect(mockService.createImage).toHaveBeenCalledWith(
            { description: TEST_DESC },
            { mimetype: 'image/jpeg', filename: 'a.jpg' },
            buff,
            { id: USER_ID, role: 'USER' }
        )
        expect(reply.code).toHaveBeenCalledWith(201)
        expect(reply.send).toHaveBeenCalled()
    })

    it('uploadImage: throws when no file provided', async () => {
        const request = { file: vi.fn().mockResolvedValue(null) } as unknown as any
        const { reply } = createReply()
        await expect(imageController.uploadImage(request, reply)).rejects.toThrow(
            'No file provided'
        )
    })

    it('getImageById: returns 200 with data', async () => {
        const image = { id: 'img-2' }
        mockService.getImageById.mockResolvedValue(image)
        const request = { params: { id: 'img-2' }, id: 'req-2' } as unknown as any
        const { reply } = createReply()
        await imageController.getImageById(request, reply)
        expect(mockService.getImageById).toHaveBeenCalledWith('img-2', undefined)
        expect(reply.code).toHaveBeenCalledWith(200)
        expect(reply.send).toHaveBeenCalled()
    })

    it('getImageById: not found', async () => {
        mockService.getImageById.mockResolvedValue(null)
        const request = { params: { id: generateUUIDv7() } } as unknown as any
        const { reply } = createReply()
        await expect(imageController.getImageById(request, reply)).rejects.toThrow(
            'Image not found'
        )
    })

    it('getImageFile: sets headers and returns blob', async () => {
        const blob = Buffer.from('bin')
        mockService.getImageFile.mockResolvedValue({ blob, mimeType: 'image/webp', size: 3 })
        const request = { params: { id: IMAGE_ID } } as unknown as any
        const { reply, headers } = createReply()
        await imageController.getImageFile(request, reply)
        expect(mockService.getImageFile).toHaveBeenCalledWith(IMAGE_ID, undefined)
        expect(headers['Content-Type']).toBe('image/webp')
        expect(headers['Content-Length']).toBe(3)
        expect(headers['Cache-Control']).toBe('public, max-age=31536000, immutable')
    })

    it('getImageFile: not found', async () => {
        mockService.getImageFile.mockResolvedValue(null)
        const request = { params: { id: generateUUIDv7() } } as unknown as any
        const { reply } = createReply()
        await expect(imageController.getImageFile(request, reply)).rejects.toThrow(
            'Image not found'
        )
    })

    it('listImages: returns paginated response', async () => {
        mockService.listImages.mockResolvedValue({
            data: [],
            pagination: { limit: 1, hasNext: false, hasPrev: false },
        })
        const request = { query: {}, id: generateUUIDv7() } as unknown as any
        const { reply } = createReply()
        await imageController.listImages(request, reply)
        expect(mockService.listImages).toHaveBeenCalledWith({}, undefined)
        expect(reply.code).toHaveBeenCalledWith(200)
    })

    it('updateImage: ok and not found', async () => {
        mockService.updateImage.mockResolvedValueOnce({ id: IMAGE_ID })
        const { reply: replyOk } = createReply()
        await imageController.updateImage(
            { params: { id: IMAGE_ID }, body: {}, id: generateUUIDv7() } as any,
            replyOk
        )
        expect(replyOk.code).toHaveBeenCalledWith(200)

        mockService.updateImage.mockResolvedValueOnce(null)
        const { reply: replyNot } = createReply()
        await expect(
            imageController.updateImage({ params: { id: IMAGE_ID }, body: {} } as any, replyNot)
        ).rejects.toThrow('Image not found')
    })

    it('replaceImageFile: ok and file missing', async () => {
        mockService.replaceImageFile.mockResolvedValue({ id: IMAGE_ID })
        const file = {
            mimetype: 'image/jpeg',
            filename: 'a.jpg',
            toBuffer: vi.fn().mockResolvedValue(Buffer.from('x')),
        }
        const okReq = {
            params: { id: IMAGE_ID },
            file: vi.fn().mockResolvedValue(file),
            id: generateUUIDv7(),
        } as any
        const { reply: replyOk } = createReply()
        await imageController.replaceImageFile(okReq, replyOk)
        expect(replyOk.code).toHaveBeenCalledWith(200)

        const badReq = { params: { id: IMAGE_ID }, file: vi.fn().mockResolvedValue(null) } as any
        const { reply: replyBad } = createReply()
        await expect(imageController.replaceImageFile(badReq, replyBad)).rejects.toThrow(
            'No file provided'
        )
    })

    it('replaceImageFile: not found', async () => {
        mockService.replaceImageFile.mockResolvedValue(null)
        const file = {
            mimetype: 'image/jpeg',
            filename: 'a.jpg',
            toBuffer: vi.fn().mockResolvedValue(Buffer.from('x')),
        }
        const req = {
            params: { id: generateUUIDv7() },
            file: vi.fn().mockResolvedValue(file),
        } as any
        const { reply } = createReply()
        await expect(imageController.replaceImageFile(req, reply)).rejects.toThrow(
            'Image not found'
        )
    })

    it('deleteImage: returns 204 or not found', async () => {
        mockService.deleteImage.mockResolvedValueOnce(true)
        const { reply: replyOk } = createReply()
        await imageController.deleteImage({ params: { id: IMAGE_ID } } as any, replyOk)
        expect(replyOk.code).toHaveBeenCalledWith(204)

        mockService.deleteImage.mockResolvedValueOnce(false)
        const { reply: replyNot } = createReply()
        await expect(
            imageController.deleteImage({ params: { id: IMAGE_ID } } as any, replyNot)
        ).rejects.toThrow('Image not found')
    })

    it('getImageStats: returns stats', async () => {
        const stats = {
            total: 0,
            byVisibility: { PUBLIC: 0, PRIVATE: 0, HIDDEN: 0 },
            byMimeType: {},
            totalSize: 0,
            averageSize: 0,
            averageWidth: 0,
            averageHeight: 0,
        }
        mockService.getImageStats.mockResolvedValue(stats)
        const request = { query: {}, id: generateUUIDv7() } as unknown as any
        const { reply } = createReply()
        await imageController.getImageStats(request, reply)
        expect(mockService.getImageStats).toHaveBeenCalledWith(undefined, undefined)
        expect(reply.code).toHaveBeenCalledWith(200)
        expect(reply.send).toHaveBeenCalled()
    })
})
