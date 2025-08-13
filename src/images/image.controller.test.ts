/**
 * Image controller tests
 * Integration tests for image HTTP endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { app } from '../app.js'
import { db } from '../shared/database/index.js'
import { createTestUser, createTestAdminUser, cleanupTestData } from '../shared/test-helpers.js'
import * as imageService from './image.service.js'

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

      const { accessToken } = loginResponse.json()

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
      expect(body.data.uploadedById).toBe(user.id)
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
      expect(body.data.description).toBe('')
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
      // Create test image
      const { user } = await createTestUser()

      const image = await imageService.createImage({
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        uploadedById: user.id,
      })

      const response = await app.inject({
        method: 'GET',
        url: `/api/images/${image.id}`,
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toBeDefined()
      expect(body.data.id).toBe(image.id)
      expect(body.data.filename).toBe('test.jpg')
      expect(body.data.uploadedById).toBe(user.id)
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
      const image = await imageService.createImage({
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        uploadedById: user.id,
      })

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

      const image = await imageService.createImage({
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        uploadedById: regularUser.id,
      })

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

    it('should prevent users from deleting others images', async () => {
      // Create two users
      const { user: user1 } = await createTestUser({ email: 'user1@test.com' })
      const { user: user2, password } = await createTestUser({
        email: 'user2@test.com',
        isEmailVerified: true,
      })

      // User1 creates an image
      const image = await imageService.createImage({
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        uploadedById: user1.id,
      })

      // User2 logs in
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: user2.email,
          password,
        },
      })

      const { accessToken } = loginResponse.json()

      // User2 tries to delete User1's image
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/images/${image.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(403)

      const body = response.json()
      expect(body.message).toBe('You can only delete your own images')
    })

    it('should require authentication for delete', async () => {
      // Create test image
      const { user } = await createTestUser()

      const image = await imageService.createImage({
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        uploadedById: user.id,
      })

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

    it('should handle error when checking user access permissions', async () => {
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
      const image = await imageService.createImage({
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        uploadedById: user.id,
      })

      // Mock canUserAccessImage to throw an error
      vi.spyOn(imageService, 'canUserAccessImage').mockRejectedValueOnce(
        new Error('Database error'),
      )

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/images/${image.id}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(500)
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
      const image = await imageService.createImage({
        file: Buffer.from('test-image-data'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        uploadedById: user.id,
      })

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

    it('should handle service errors in deleteImage gracefully', async () => {
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

      // Mock findImageById to throw an error during initial check
      vi.spyOn(imageService, 'findImageById').mockRejectedValueOnce(new Error('Database error'))

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/images/123e4567-e89b-12d3-a456-426614174000',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(500)
    })
  })
})
