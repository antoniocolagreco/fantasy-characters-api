import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as imageService from '@/images/image.service.js'
import { db } from '@/shared/database/index.js'
import { IMAGE, CONTENT_TYPES } from '@/shared/constants.js'
import { createTestUser, cleanupTestData } from '@/shared/tests/test-utils.js'

// Mock Sharp
const mockSharp = {
  metadata: vi.fn().mockResolvedValue({ width: 300, height: 400 }),
  resize: vi.fn().mockReturnThis(),
  webp: vi.fn().mockReturnThis(),
  toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-image-data')),
}

vi.mock('sharp', () => ({
  default: vi.fn(() => mockSharp),
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

      const result = await imageService.createImage(testImageData, user)

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
      // Create a test user first
      const { user } = await createTestUser()

      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.png',
        mimeType: 'image/png',
        ownerId: user.id,
      }

      const result = await imageService.createImage(testImageData, user)

      expect(result).toMatchObject({
        filename: 'test.png',
        mimeType: CONTENT_TYPES.IMAGE_WEBP,
        ownerId: user.id,
      })
      expect(result.description).toBeUndefined()
    })

    it('should throw error for invalid file type', async () => {
      // Create a test user first
      const { user } = await createTestUser()

      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.gif',
        mimeType: 'image/gif',
      }

      await expect(imageService.createImage(testImageData, user)).rejects.toThrow(
        'Invalid file type',
      )
    })

    it('should throw error for file too large', async () => {
      // Create a test user first
      const { user } = await createTestUser()

      const largeBuffer = Buffer.alloc(IMAGE.MAX_SIZE + 1)
      const testImageData = {
        file: largeBuffer,
        filename: 'large.jpg',
        mimeType: 'image/jpeg',
      }

      await expect(imageService.createImage(testImageData, user)).rejects.toThrow('File too large')
    })

    it('should throw error when image processing fails - invalid dimensions', async () => {
      const { user } = await createTestUser()

      // Mock Sharp to return invalid metadata
      mockSharp.metadata.mockResolvedValueOnce({ width: null, height: null })

      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
      }

      await expect(imageService.createImage(testImageData, user)).rejects.toThrow(
        'Invalid image: Unable to read dimensions',
      )
    })

    it('should throw error when final image dimensions cannot be read', async () => {
      const { user } = await createTestUser()

      // Mock Sharp to fail on final metadata
      mockSharp.metadata
        .mockResolvedValueOnce({ width: 300, height: 400 }) // Initial metadata
        .mockResolvedValueOnce({ width: null, height: null }) // Final metadata

      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
      }

      await expect(imageService.createImage(testImageData, user)).rejects.toThrow(
        'Failed to get final image dimensions',
      )
    })

    it('should throw error when Sharp processing fails', async () => {
      const { user } = await createTestUser()

      // Mock Sharp to throw an error
      mockSharp.metadata.mockRejectedValueOnce(new Error('Sharp processing error'))

      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
      }

      await expect(imageService.createImage(testImageData, user)).rejects.toThrow(
        'Image processing failed: Sharp processing error',
      )
    })

    it('should throw error when Sharp processing fails with unknown error', async () => {
      const { user } = await createTestUser()

      // Mock Sharp to throw a non-Error object
      mockSharp.metadata.mockRejectedValueOnce('Unknown error')

      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
      }

      await expect(imageService.createImage(testImageData, user)).rejects.toThrow(
        'Image processing failed: Unknown error',
      )
    })

    it('should require authentication', async () => {
      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
      }

      await expect(imageService.createImage(testImageData)).rejects.toThrow(
        'Authentication required',
      )
    })

    it('should enforce ownership creation permissions', async () => {
      const { user: user1 } = await createTestUser()
      const { user: user2 } = await createTestUser()

      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        ownerId: user2.id,
      }

      await expect(imageService.createImage(testImageData, user1)).rejects.toThrow(
        'You can only create images for yourself',
      )
    })
  })

  describe('findImageById', () => {
    it('should find an image by ID', async () => {
      // Create a test user first
      const { user } = await createTestUser()
      // Create a test image first
      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
      }

      const createdImage = await imageService.createImage(testImageData, user)
      const foundImage = await imageService.findImageById(createdImage.id, user)

      expect(foundImage).toMatchObject({
        id: createdImage.id,
        filename: 'test.jpg',
        mimeType: CONTENT_TYPES.IMAGE_WEBP,
      })
    })

    it('should throw error when image not found', async () => {
      // Create a test user first
      const { user } = await createTestUser()
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(imageService.findImageById(nonExistentId, user)).rejects.toThrow(
        'Image not found',
      )
    })

    it('should enforce visibility permissions', async () => {
      const { user: owner } = await createTestUser()
      const { user: otherUser } = await createTestUser()

      // Create a private image
      const createdImage = await imageService.createImage(
        {
          file: Buffer.from('test-image-data'),
          filename: 'private.jpg',
          mimeType: 'image/jpeg',
          ownerId: owner.id,
        },
        owner,
      )

      // Update to private visibility
      await db.image.update({
        where: { id: createdImage.id },
        data: { visibility: 'PRIVATE' },
      })

      await expect(imageService.findImageById(createdImage.id, otherUser)).rejects.toThrow(
        'You do not have permission to access this image',
      )
    })
  })

  describe('getImageBinaryData', () => {
    it('should return image binary data', async () => {
      // Create a test user first
      const { user } = await createTestUser()

      const testImageData = {
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        ownerId: user.id,
      }

      const createdImage = await imageService.createImage(testImageData, user)
      const binaryData = await imageService.getImageBinaryData(createdImage.id, user)

      expect(binaryData).toEqual({
        blob: expect.any(Buffer),
        mimeType: 'image/webp',
        size: expect.any(Number),
        filename: 'test.jpg',
      })
      expect(binaryData.blob.length).toBeGreaterThan(0)
    })

    it('should throw NotFoundError for non-existent image', async () => {
      const { user } = await createTestUser()
      await expect(
        imageService.getImageBinaryData('123e4567-e89b-12d3-a456-426614174000', user),
      ).rejects.toThrow('Image not found')
    })

    it('should enforce visibility permissions for binary data', async () => {
      const { user: owner } = await createTestUser()
      const { user: otherUser } = await createTestUser()

      // Create a private image
      const createdImage = await imageService.createImage(
        {
          file: Buffer.from('test-image-data'),
          filename: 'private.jpg',
          mimeType: 'image/jpeg',
          ownerId: owner.id,
        },
        owner,
      )

      // Update to private visibility
      await db.image.update({
        where: { id: createdImage.id },
        data: { visibility: 'PRIVATE' },
      })

      await expect(imageService.getImageBinaryData(createdImage.id, otherUser)).rejects.toThrow(
        'You do not have permission to access this image',
      )
    })
  })

  describe('deleteImage', () => {
    it('should delete an image successfully', async () => {
      const { user } = await createTestUser()

      const createdImage = await imageService.createImage(
        {
          file: Buffer.from('test-image-data'),
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          ownerId: user.id,
        },
        user,
      )

      await expect(imageService.deleteImage(createdImage.id, user)).resolves.not.toThrow()

      await expect(imageService.findImageById(createdImage.id, user)).rejects.toThrow(
        'Image not found',
      )
    })

    it('should throw error when deleting non-existent image', async () => {
      const { user } = await createTestUser()
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await expect(imageService.deleteImage(nonExistentId, user)).rejects.toThrow('Image not found')
    })

    it('should enforce deletion permissions', async () => {
      const { user: owner } = await createTestUser()
      const { user: otherUser } = await createTestUser()

      const createdImage = await imageService.createImage(
        {
          file: Buffer.from('test'),
          filename: 'protected.jpg',
          mimeType: 'image/jpeg',
          ownerId: owner.id,
        },
        owner,
      )

      await expect(imageService.deleteImage(createdImage.id, otherUser)).rejects.toThrow(
        'You do not have permission to delete this image',
      )
    })

    it('should handle Prisma P2025 error on delete', async () => {
      const { user } = await createTestUser()

      const createdImage = await imageService.createImage(
        {
          file: Buffer.from('test'),
          filename: 'delete-me.jpg',
          mimeType: 'image/jpeg',
          ownerId: user.id,
        },
        user,
      )

      // Delete the image directly from DB to simulate race condition
      await db.image.delete({ where: { id: createdImage.id } })

      await expect(imageService.deleteImage(createdImage.id, user)).rejects.toThrow(
        'Image not found',
      )
    })
  })

  describe('getImagesList', () => {
    it('should return paginated images list', async () => {
      const { user } = await createTestUser()

      // Create test images
      await imageService.createImage(
        {
          file: Buffer.from('test1'),
          filename: 'test1.jpg',
          mimeType: 'image/jpeg',
          ownerId: user.id,
        },
        user,
      )

      await imageService.createImage(
        {
          file: Buffer.from('test2'),
          filename: 'test2.jpg',
          mimeType: 'image/jpeg',
          ownerId: user.id,
        },
        user,
      )

      const result = await imageService.getImagesList({ page: 1, limit: 10 }, user)

      expect(result.images).toHaveLength(2)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })

    it('should filter by search term', async () => {
      const { user } = await createTestUser()

      await imageService.createImage(
        {
          file: Buffer.from('test'),
          filename: 'searchable.jpg',
          mimeType: 'image/jpeg',
          description: 'A searchable image',
          ownerId: user.id,
        },
        user,
      )

      await imageService.createImage(
        {
          file: Buffer.from('test'),
          filename: 'other.jpg',
          mimeType: 'image/jpeg',
          ownerId: user.id,
        },
        user,
      )

      const result = await imageService.getImagesList({ search: 'searchable' }, user)

      expect(result.images).toHaveLength(1)
      expect(result.images[0].filename).toBe('searchable.jpg')
    })

    it('should filter by ownerId with permission check', async () => {
      const { user: user1 } = await createTestUser()
      const { user: user2 } = await createTestUser()

      await imageService.createImage(
        {
          file: Buffer.from('test'),
          filename: 'user1.jpg',
          mimeType: 'image/jpeg',
          ownerId: user1.id,
        },
        user1,
      )

      // User2 trying to access user1's images should fail
      await expect(imageService.getImagesList({ ownerId: user1.id }, user2)).rejects.toThrow(
        'You cannot access images from this user',
      )
    })
  })

  describe('getImageStats', () => {
    it('should require proper permissions', async () => {
      const { user } = await createTestUser()

      await expect(imageService.getImageStats(user)).rejects.toThrow(
        'You do not have permission to view image statistics',
      )
    })

    it('should return stats for moderators/admins', async () => {
      const { user: admin } = await createTestUser({ role: 'ADMIN' })

      await imageService.createImage(
        {
          file: Buffer.from('test'),
          filename: 'stats.jpg',
          mimeType: 'image/jpeg',
          ownerId: admin.id,
        },
        admin,
      )

      const stats = await imageService.getImageStats(admin)

      expect(stats).toEqual({
        totalImages: expect.any(Number),
        totalSize: expect.any(Number),
        averageSize: expect.any(Number),
        byMimeType: expect.any(Object),
        recentUploads: {
          last24Hours: expect.any(Number),
          last7Days: expect.any(Number),
          last30Days: expect.any(Number),
        },
      })
    })
  })

  describe('updateImage', () => {
    it('should update image description and visibility', async () => {
      const { user } = await createTestUser()

      const createdImage = await imageService.createImage(
        {
          file: Buffer.from('test'),
          filename: 'update.jpg',
          mimeType: 'image/jpeg',
          ownerId: user.id,
        },
        user,
      )

      const updated = await imageService.updateImage(
        createdImage.id,
        {
          description: 'Updated description',
          visibility: 'PRIVATE',
        },
        user,
      )

      expect(updated).toMatchObject({
        id: createdImage.id,
        description: 'Updated description',
      })
    })

    it('should throw error for non-existent image', async () => {
      const { user } = await createTestUser()

      await expect(
        imageService.updateImage(
          '00000000-0000-0000-0000-000000000000',
          { description: 'test' },
          user,
        ),
      ).rejects.toThrow('Image not found')
    })

    it('should enforce modification permissions', async () => {
      const { user: owner } = await createTestUser()
      const { user: otherUser } = await createTestUser()

      const createdImage = await imageService.createImage(
        {
          file: Buffer.from('test'),
          filename: 'protected.jpg',
          mimeType: 'image/jpeg',
          ownerId: owner.id,
        },
        owner,
      )

      await expect(
        imageService.updateImage(createdImage.id, { description: 'hacked' }, otherUser),
      ).rejects.toThrow('You do not have permission to modify this image')
    })

    it('should handle Prisma P2025 error on update', async () => {
      const { user } = await createTestUser()

      const createdImage = await imageService.createImage(
        {
          file: Buffer.from('test'),
          filename: 'delete-me.jpg',
          mimeType: 'image/jpeg',
          ownerId: user.id,
        },
        user,
      )

      // Delete the image directly from DB to simulate P2025
      await db.image.delete({ where: { id: createdImage.id } })

      await expect(
        imageService.updateImage(createdImage.id, { description: 'test' }, user),
      ).rejects.toThrow('Image not found')
    })
  })
})
