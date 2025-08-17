import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as imageService from './image.service.js'
import { db } from '../shared/database/index.js'
import { IMAGE, CONTENT_TYPES } from '../shared/constants.js'
import { createTestUser, cleanupTestData } from '../shared/test-helpers.js'

// Mock Sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 300, height: 400 }),
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-image-data')),
  })),
}))

describe('Image Service', () => {
  beforeEach(async () => {
    // Clean up any existing images and users
    await db.image.deleteMany()
    await cleanupTestData()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    // Clean up test data after each test
    await db.image.deleteMany()
    await cleanupTestData()
  })

  describe('createImage', () => {
    it('should create an image successfully', async () => {
      // Create a test user first
      const { user } = await createTestUser()

      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        description: 'Test image',
        ownerId: user.id,
      }

      const result = await imageService.createImage(testImageData)

      expect(result).toMatchObject({
        filename: 'test.jpg',
        mimeType: CONTENT_TYPES.IMAGE_WEBP,
        description: 'Test image',
        ownerId: user.id,
        width: 300,
        height: 400,
      })
      expect(result.id).toBeDefined()
      expect(result.size).toBeGreaterThan(0)
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should create an image without description', async () => {
      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.png',
        mimeType: 'image/png',
      }

      const result = await imageService.createImage(testImageData)

      expect(result).toMatchObject({
        filename: 'test.png',
        mimeType: CONTENT_TYPES.IMAGE_WEBP,
        // description and ownerId should not appear when null
      })
      expect(result.description).toBeUndefined()
      expect(result.ownerId).toBeUndefined()
    })

    it('should throw error for invalid file type', async () => {
      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.gif',
        mimeType: 'image/gif',
      }

      await expect(imageService.createImage(testImageData)).rejects.toThrow('Invalid file type')
    })

    it('should throw error for file too large', async () => {
      const largeBuffer = Buffer.alloc(IMAGE.MAX_SIZE + 1)
      const testImageData = {
        file: largeBuffer,
        filename: 'large.jpg',
        mimeType: 'image/jpeg',
      }

      await expect(imageService.createImage(testImageData)).rejects.toThrow('File too large')
    })
  })

  describe('findImageById', () => {
    it('should find an image by ID', async () => {
      // Create a test image first
      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
      }

      const createdImage = await imageService.createImage(testImageData)
      const foundImage = await imageService.findImageById(createdImage.id)

      expect(foundImage).toMatchObject({
        id: createdImage.id,
        filename: 'test.jpg',
        mimeType: CONTENT_TYPES.IMAGE_WEBP,
      })
    })

    it('should throw error when image not found', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(imageService.findImageById(nonExistentId)).rejects.toThrow('Image not found')
    })
  })

  describe('deleteImage', () => {
    it('should delete an image successfully', async () => {
      // Create a test image first
      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
      }

      const createdImage = await imageService.createImage(testImageData)

      // Delete the image
      await expect(imageService.deleteImage(createdImage.id)).resolves.not.toThrow()

      // Verify it's deleted
      await expect(imageService.findImageById(createdImage.id)).rejects.toThrow('Image not found')
    })

    it('should throw error when deleting non-existent image', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(imageService.deleteImage(nonExistentId)).rejects.toThrow('Image not found')
    })
  })

  describe('getImageBinaryData', () => {
    it('should return image binary data', async () => {
      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
      }

      const createdImage = await imageService.createImage(testImageData)
      const binaryData = await imageService.getImageBinaryData(createdImage.id)

      expect(binaryData).toEqual({
        blob: expect.any(Buffer),
        mimeType: 'image/webp',
        size: expect.any(Number),
        filename: 'test.jpg',
      })
      expect(binaryData.blob.length).toBeGreaterThan(0)
    })

    it('should throw NotFoundError for non-existent image', async () => {
      await expect(
        imageService.getImageBinaryData('123e4567-e89b-12d3-a456-426614174000'),
      ).rejects.toThrow('Image not found')
    })
  })
})
