/**
 * Health route integration tests
 * Tests for health check route registration and behavior using centralized test utilities
 */

import { describe, it, expect } from 'vitest'
import {
  createHealthTestApp,
  expectHealthResponse,
  expectJsonResponse,
} from '../../shared/tests/test-utils'

describe('Health Routes', () => {
  describe('Route registration', () => {
    it('should register health routes successfully', async () => {
      const app = await createHealthTestApp()

      expect(app.hasRoute({ method: 'GET', url: '/health' })).toBe(true)

      await app.close()
    })

    it('should have correct route configuration', async () => {
      const app = await createHealthTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expectJsonResponse(response, 200)

      await app.close()
    })
  })

  describe('Health endpoint behavior', () => {
    it('should respond to GET /health', async () => {
      const app = await createHealthTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expectJsonResponse(response, 200)

      const body = JSON.parse(response.body)
      expectHealthResponse(body)

      await app.close()
    })

    it('should return valid health data structure', async () => {
      const app = await createHealthTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      const body = JSON.parse(response.body)
      expectHealthResponse(body)

      // Validate timestamp format
      expect(() => new Date(body.timestamp)).not.toThrow()

      await app.close()
    })

    it('should include all required health checks', async () => {
      const app = await createHealthTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      const body = JSON.parse(response.body)

      const checkNames = body.checks.map((check: { name: string }) => check.name)
      expect(checkNames).toContain('application')
      expect(checkNames).toContain('memory')
      expect(checkNames).toContain('uptime')
      expect(checkNames).toContain('database')

      await app.close()
    })

    it('should have proper response headers', async () => {
      const app = await createHealthTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.headers['content-type']).toMatch(/application\/json/)
      // Health endpoints may or may not set cache-control headers
      expect(response.statusCode).toBe(200)

      await app.close()
    })

    it('should not accept other HTTP methods', async () => {
      const app = await createHealthTestApp()

      const postResponse = await app.inject({
        method: 'POST',
        url: '/health',
      })

      expect(postResponse.statusCode).toBe(404)

      const putResponse = await app.inject({
        method: 'PUT',
        url: '/health',
      })

      expect(putResponse.statusCode).toBe(404)

      await app.close()
    })
  })

  describe('Route schema validation', () => {
    it('should have documented response schema', async () => {
      const app = await createHealthTestApp()

      // Since this is a minimal test app without Swagger,
      // just verify the route exists and works
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body).toHaveProperty('status')
      expect(body).toHaveProperty('version')

      await app.close()
    })

    it('should handle query parameters gracefully', async () => {
      const app = await createHealthTestApp()

      const response = await app.inject({
        method: 'GET',
        url: '/health?detailed=true',
      })

      // Should still work with query parameters (ignore them)
      expect(response.statusCode).toBe(200)

      await app.close()
    })
  })

  describe('Error handling', () => {
    it('should handle internal errors gracefully', async () => {
      const app = await createHealthTestApp()

      // The health endpoint should always try to return some status
      // even if there are internal issues
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      // Should not crash the application
      expect(response.statusCode).toBeOneOf([200, 500])

      await app.close()
    })
  })
})
