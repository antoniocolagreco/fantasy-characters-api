/**
 * Image controller tests
 * Integration tests for image HTTP endpoints
 */

import { setTimeout } from 'node:timers/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '@/app.js'
import { db } from '@/shared/database/index.js'
import { cleanupTestData, createTestAdminUser, createTestUser } from '@/shared/test-helpers.js'
import * as imageService from '@/images/image.service.js'
import type { ImageResponse } from '@/images/image.types.js'

// Mock Sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 300, height: 400 }),
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-webp-image-data')),
  })),
}))

describe('Image Controller', () => {
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

  describe('POST /api/images', () => {
    it('should upload image successfully', async () => {
      // Create a test user and login
      const { user, password } = await createTestUser({ isEmailVerified: true })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const loginResponseBody = loginResponse.json()
      const { accessToken } = loginResponseBody
      const loggedInUser = loginResponseBody.user

      // Create multipart form data
      const boundary = '----formdata-test-boundary'
      const imageBuffer = Buffer.from('test-image-data')

      const payload = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.jpg"',
        'Content-Type: image/jpeg',
        '',
        imageBuffer.toString('binary'),
        `--${boundary}`,
        'Content-Disposition: form-data; name="description"',
        '',
        'Test image description',
        `--${boundary}--`,
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: '/api/images',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(201)

      const body = response.json()
      expect(body.message).toBe('Image uploaded successfully')
      expect(body.data).toBeDefined()
      expect(body.data.id).toBeDefined()
      expect(body.data.filename).toBe('test.jpg')
      expect(body.data.ownerId).toBe(loggedInUser.id)
      // expect(body.data.description).toBe('Test image description') // Skip description for now
    })

    it('should upload image without description', async () => {
      // Create a test user and login
      const { user, password } = await createTestUser({ isEmailVerified: true })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Create multipart form data without description
      const boundary = '----formdata-test-boundary'
      const imageBuffer = Buffer.from('test-image-data')

      const payload = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.png"',
        'Content-Type: image/png',
        '',
        imageBuffer.toString('binary'),
        `--${boundary}--`,
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: '/api/images',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(201)

      const body = response.json()
      expect(body.message).toBe('Image uploaded successfully')
      expect(body.data.description).toBeUndefined() // Optional field should not appear when null
    })

    it('should require authentication for upload', async () => {
      // Create multipart form data
      const boundary = '----formdata-test-boundary'
      const imageBuffer = Buffer.from('test-image-data')

      const payload = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.jpg"',
        'Content-Type: image/jpeg',
        '',
        imageBuffer.toString('binary'),
        `--${boundary}--`,
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: '/api/images',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(401)

      const body = response.json()
      expect(body.message).toBe('Authorization header is required')
    })

    it('should return 400 when no file is provided', async () => {
      // Login to get JWT token
      const { user, password } = await createTestUser({ isEmailVerified: true })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      const response = await app.inject({
        method: 'POST',
        url: '/api/images',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        payload: {},
      })

      expect(response.statusCode).toBe(406) // Invalid multipart content type

      const body = response.json()
      expect(body.message).toBe('the request is not multipart')
    })

    it('should handle service errors during upload', async () => {
      // Login to get JWT token
      const { user, password } = await createTestUser({ isEmailVerified: true })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Mock the service to throw an error
      vi.spyOn(imageService, 'createImage').mockRejectedValueOnce(new Error('Upload failed'))

      // Create multipart form data
      const boundary = '----formdata-test-boundary'
      const imageBuffer = Buffer.from('test-image-data')

      const payload = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.jpg"',
        'Content-Type: image/jpeg',
        '',
        imageBuffer.toString('binary'),
        `--${boundary}--`,
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: '/api/images',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(500)
    })
  })

  describe('GET /api/images/:id', () => {
    it('should get image metadata', async () => {
      // Create test user and login
      const { user, password } = await createTestUser({ isEmailVerified: true })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const loginResponseBody = loginResponse.json()
      const { accessToken } = loginResponseBody

      // Create test image with authentication
      const image = await imageService.createImage(
        {
          file: Buffer.from('test-image-data'),
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          ownerId: user.id,
        },
        user,
      )

      const response = await app.inject({
        method: 'GET',
        url: `/api/images/${image.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toBeDefined()
      expect(body.data.id).toBe(image.id)
      expect(body.data.filename).toBe('test.jpg')
      expect(body.data.ownerId).toBe(user.id)
    })

    it('should return 404 for non-existent image', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images/123e4567-e89b-12d3-a456-426614174000',
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images/invalid-uuid',
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('DELETE /api/images/:id', () => {
    it('should allow user to delete their own image', async () => {
      // Create a test user and login
      const { user, password } = await createTestUser({ isEmailVerified: true })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Create test image
      const image = await imageService.createImage(
        {
          file: Buffer.from('test-image-data'),
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          ownerId: user.id,
        },
        user,
      )

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/images/${image.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.message).toBe('Image deleted successfully')
    })

    it('should allow admin to delete any image', async () => {
      // Create a regular user and their image
      const { user: regularUser } = await createTestUser({ email: 'user@test.com' })

      const image = await imageService.createImage(
        {
          file: Buffer.from('test-image-data'),
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          ownerId: regularUser.id,
        },
        regularUser,
      )

      // Create admin user and login
      const { user: adminUser, password } = await createTestAdminUser({ isEmailVerified: true })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: adminUser.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/images/${image.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should require authentication for delete', async () => {
      // Create test image
      const { user } = await createTestUser()

      const image = await imageService.createImage(
        {
          file: Buffer.from('test-image-data'),
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          ownerId: user.id,
        },
        user,
      )

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/images/${image.id}`,
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 404 for non-existent image', async () => {
      // Create a test user and login
      const { user, password } = await createTestUser({ isEmailVerified: true })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/images/123e4567-e89b-12d3-a456-426614174000',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 400 for invalid UUID in delete', async () => {
      // Create a test user and login
      const { user, password } = await createTestUser({ isEmailVerified: true })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/images/invalid-uuid',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle error during image deletion', async () => {
      // Create a test user and login
      const { user, password } = await createTestUser({ isEmailVerified: true })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Create test image
      const image = await imageService.createImage(
        {
          file: Buffer.from('test-image-data'),
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          ownerId: user.id,
        },
        user,
      )

      // Mock deleteImage to throw an error
      vi.spyOn(imageService, 'deleteImage').mockRejectedValueOnce(new Error('Delete failed'))

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/images/${image.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(500)
    })
  })

  describe('GET /api/images', () => {
    it('should list all images with default pagination', async () => {
      // Create test users and images
      const { user: user1 } = await createTestUser({ email: 'user1@test.com' })
      const { user: user2 } = await createTestUser({ email: 'user2@test.com' })

      // Create multiple images in sequence to ensure proper ordering
      await imageService.createImage(
        {
          file: Buffer.from('image1'),
          filename: 'image1.jpg',
          mimeType: 'image/jpeg',
          ownerId: user1.id,
          description: 'First test image',
        },
        user1,
      )

      // Add small delay to ensure different timestamps
      await setTimeout(10)

      await imageService.createImage(
        {
          file: Buffer.from('image2'),
          filename: 'image2.png',
          mimeType: 'image/png',
          ownerId: user2.id,
          description: 'Second test image',
        },
        user2,
      )

      // Add small delay to ensure different timestamps
      await setTimeout(10)

      await imageService.createImage(
        {
          file: Buffer.from('image3'),
          filename: 'image3.webp',
          mimeType: 'image/webp',
          ownerId: user1.id,
        },
        user1,
      )

      // Login to get authentication token
      const { password } = await createTestUser({ email: 'auth@test.com', isEmailVerified: true })
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'auth@test.com',
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      const response = await app.inject({
        method: 'GET',
        url: '/api/images',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toBeDefined()
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data).toHaveLength(3)
      expect(body.pagination).toBeDefined()
      expect(body.pagination.page).toBe(1)
      expect(body.pagination.limit).toBe(10)
      expect(body.pagination.total).toBe(3)
      expect(body.pagination.totalPages).toBe(1)

      // Check that images are ordered by creation date (descending)
      expect(body.data[0].filename).toBe('image3.webp') // Last created
      expect(body.data[2].filename).toBe('image1.jpg') // First created
    })

    it('should support pagination parameters', async () => {
      // Create multiple images
      const { user } = await createTestUser()

      await Promise.all([
        imageService.createImage(
          {
            file: Buffer.from('image1'),
            filename: 'image1.jpg',
            mimeType: 'image/jpeg',
            ownerId: user.id,
          },
          user,
        ),
        imageService.createImage(
          {
            file: Buffer.from('image2'),
            filename: 'image2.jpg',
            mimeType: 'image/jpeg',
            ownerId: user.id,
          },
          user,
        ),
        imageService.createImage(
          {
            file: Buffer.from('image3'),
            filename: 'image3.jpg',
            mimeType: 'image/jpeg',
            ownerId: user.id,
          },
          user,
        ),
      ])

      // Login to get authentication token
      const { password } = await createTestUser({ email: 'auth@test.com', isEmailVerified: true })
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'auth@test.com',
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      const response = await app.inject({
        method: 'GET',
        url: '/api/images?page=2&limit=2',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toHaveLength(1) // Only 1 image on page 2 with limit 2
      expect(body.pagination.page).toBe(2)
      expect(body.pagination.limit).toBe(2)
      expect(body.pagination.total).toBe(3)
      expect(body.pagination.totalPages).toBe(2)
    })

    it('should support search by filename', async () => {
      // Create test images
      const { user } = await createTestUser()

      await Promise.all([
        imageService.createImage(
          {
            file: Buffer.from('image1'),
            filename: 'avatar.jpg',
            mimeType: 'image/jpeg',
            ownerId: user.id,
          },
          user,
        ),
        imageService.createImage(
          {
            file: Buffer.from('image2'),
            filename: 'background.png',
            mimeType: 'image/png',
            ownerId: user.id,
          },
          user,
        ),
        imageService.createImage(
          {
            file: Buffer.from('image3'),
            filename: 'avatar-small.webp',
            mimeType: 'image/webp',
            ownerId: user.id,
          },
          user,
        ),
      ])

      // Login to get authentication token
      const { password } = await createTestUser({ email: 'auth@test.com', isEmailVerified: true })
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'auth@test.com',
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      const response = await app.inject({
        method: 'GET',
        url: '/api/images?search=avatar',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toHaveLength(2)
      expect(body.data.every((img: ImageResponse) => img.filename.includes('avatar'))).toBe(true)
    })

    it('should support search by description', async () => {
      // Create test images
      const { user } = await createTestUser()

      await Promise.all([
        imageService.createImage(
          {
            file: Buffer.from('image1'),
            filename: 'test1.jpg',
            mimeType: 'image/jpeg',
            ownerId: user.id,
            description: 'Profile picture for user',
          },
          user,
        ),
        imageService.createImage(
          {
            file: Buffer.from('image2'),
            filename: 'test2.png',
            mimeType: 'image/png',
            ownerId: user.id,
            description: 'Game background image',
          },
          user,
        ),
        imageService.createImage(
          {
            file: Buffer.from('image3'),
            filename: 'test3.webp',
            mimeType: 'image/webp',
            ownerId: user.id,
            description: 'User avatar picture',
          },
          user,
        ),
      ])

      // Login to get authentication token
      const { password } = await createTestUser({ email: 'auth@test.com', isEmailVerified: true })
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'auth@test.com',
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      const response = await app.inject({
        method: 'GET',
        url: '/api/images?search=picture',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toHaveLength(2)
      expect(body.data.every((img: ImageResponse) => img.description?.includes('picture'))).toBe(
        true,
      )
    })

    it('should filter by ownerId', async () => {
      // Create test users and images
      const { user: user1 } = await createTestUser({ email: 'user1@test.com' })
      const { user: user2 } = await createTestUser({ email: 'user2@test.com' })

      await Promise.all([
        imageService.createImage(
          {
            file: Buffer.from('image1'),
            filename: 'user1-image1.jpg',
            mimeType: 'image/jpeg',
            ownerId: user1.id,
          },
          user1,
        ),
        imageService.createImage(
          {
            file: Buffer.from('image2'),
            filename: 'user2-image1.png',
            mimeType: 'image/png',
            ownerId: user2.id,
          },
          user2,
        ),
        imageService.createImage(
          {
            file: Buffer.from('image3'),
            filename: 'user1-image2.webp',
            mimeType: 'image/webp',
            ownerId: user1.id,
          },
          user1,
        ),
      ])

      // Login to get authentication token
      const { password } = await createTestUser({ email: 'auth@test.com', isEmailVerified: true })
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'auth@test.com',
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      const response = await app.inject({
        method: 'GET',
        url: `/api/images?ownerId=${user1.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toHaveLength(2)
      expect(body.data.every((img: ImageResponse) => img.ownerId === user1.id)).toBe(true)
    })

    it('should return empty list when no images found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images',
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toHaveLength(0)
      expect(body.pagination.total).toBe(0)
      expect(body.pagination.totalPages).toBe(0)
    })

    it('should handle invalid query parameters gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images?page=0&limit=101',
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle service errors in getImagesList gracefully', async () => {
      // Mock the service to throw an error
      vi.spyOn(imageService, 'getImagesList').mockRejectedValueOnce(new Error('Database error'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/images',
      })

      expect(response.statusCode).toBe(500)
    })
  })

  describe('GET /api/images/stats', () => {
    it('should return image statistics', async () => {
      // Create test users and images
      const { user: user1 } = await createTestUser({ email: 'user1@test.com' })
      const { user: user2 } = await createTestUser({ email: 'user2@test.com' })

      // Create images with different mime types
      await Promise.all([
        imageService.createImage(
          {
            file: Buffer.from('small-image'),
            filename: 'image1.jpg',
            mimeType: 'image/jpeg',
            ownerId: user1.id,
          },
          user1,
        ),
        imageService.createImage(
          {
            file: Buffer.from('large-image-data'),
            filename: 'image2.png',
            mimeType: 'image/png',
            ownerId: user2.id,
          },
          user2,
        ),
        imageService.createImage(
          {
            file: Buffer.from('medium'),
            filename: 'image3.webp',
            mimeType: 'image/webp',
            ownerId: user1.id,
          },
          user1,
        ),
      ])

      // Create admin user for statistics access with unique email
      const uniqueEmail = `admin-stats-${Date.now()}@test.com`
      const { password } = await createTestAdminUser({
        email: uniqueEmail,
        isEmailVerified: true,
      })
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: uniqueEmail,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/stats',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toBeDefined()

      // Check basic statistics
      expect(body.data.totalImages).toBe(3)
      expect(body.data.totalSize).toBeGreaterThan(0)
      expect(body.data.averageSize).toBeGreaterThan(0)

      // Check mime type breakdown
      expect(body.data.byMimeType).toBeDefined()
      expect(body.data.byMimeType['image/webp']).toBe(3) // All processed as WebP

      // Check recent uploads
      expect(body.data.recentUploads).toBeDefined()
      expect(body.data.recentUploads.last24Hours).toBe(3)
      expect(body.data.recentUploads.last7Days).toBe(3)
      expect(body.data.recentUploads.last30Days).toBe(3)
    })

    it('should return empty statistics when no images exist', async () => {
      // Create admin user for statistics access
      const { user: adminUser, password } = await createTestAdminUser({
        isEmailVerified: true,
      })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: adminUser.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/stats',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data.totalImages).toBe(0)
      expect(body.data.totalSize).toBe(0)
      expect(body.data.averageSize).toBe(0)
      expect(body.data.byMimeType).toEqual({})
      expect(body.data.recentUploads.last24Hours).toBe(0)
      expect(body.data.recentUploads.last7Days).toBe(0)
      expect(body.data.recentUploads.last30Days).toBe(0)
    })

    it('should handle service errors in getImageStats gracefully', async () => {
      // Create admin user for statistics access with unique email
      const uniqueEmail = `admin-${Date.now()}@test.com`
      const { password } = await createTestAdminUser({
        email: uniqueEmail,
        isEmailVerified: true,
      })
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: uniqueEmail,
          password,
        },
      })
      const { accessToken } = loginResponse.json()

      // Mock the service to throw an error
      vi.spyOn(imageService, 'getImageStats').mockRejectedValueOnce(new Error('Database error'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/stats',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(500)
    })
  })

  describe('Error handling', () => {
    it('should handle service errors in getImage gracefully', async () => {
      // Mock the service to throw an error
      vi.spyOn(imageService, 'findImageById').mockRejectedValueOnce(new Error('Database error'))

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/123e4567-e89b-12d3-a456-426614174000',
      })

      expect(response.statusCode).toBe(500)
    })
  })
  describe('GET /api/images/:id/file', () => {
    it('should return image file successfully', async () => {
      // Create a test user and login
      const { user, password } = await createTestUser({ isEmailVerified: true })

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // Upload an image first using proper multipart format
      const boundary = '----formdata-test-boundary'
      const imageBuffer = Buffer.from('test-image-data')

      const payload = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.jpg"',
        'Content-Type: image/jpeg',
        '',
        imageBuffer.toString('binary'),
        `--${boundary}--`,
      ].join('\r\n')

      const uploadResponse = await app.inject({
        method: 'POST',
        url: '/api/images',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      })

      expect(uploadResponse.statusCode).toBe(201)
      const uploadData = uploadResponse.json()
      const imageId = uploadData.data.id

      // Get the image file
      const response = await app.inject({
        method: 'GET',
        url: `/api/images/${imageId}/file`,
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toBe('image/webp')
      expect(response.headers['cache-control']).toBe('public, max-age=31536000')
      expect(response.headers['content-disposition']).toContain('inline; filename="test.jpg"')
      expect(response.headers['content-length']).toBeDefined()
      expect(response.rawPayload).toBeInstanceOf(Buffer)
    })

    it('should return 404 for non-existent image file', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images/123e4567-e89b-12d3-a456-426614174000/file',
      })

      expect(response.statusCode).toBe(404)
      const data = response.json()
      expect(data.message).toBe('Image not found')
    })

    it('should handle invalid UUID in image file endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images/invalid-uuid/file',
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle service errors in getImageFile gracefully', async () => {
      // Mock getImageBinaryData to throw an error
      vi.spyOn(imageService, 'getImageBinaryData').mockRejectedValueOnce(
        new Error('Database error'),
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/images/123e4567-e89b-12d3-a456-426614174000/file',
      })

      expect(response.statusCode).toBe(500)
    })
  })
})
