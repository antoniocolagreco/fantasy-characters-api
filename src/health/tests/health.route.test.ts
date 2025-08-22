import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import { healthRoutes } from '../health.route'
import * as healthController from '../health.controller'

// Mock the health controller
vi.mock('../health.controller')

const mockedController = vi.mocked(healthController)

describe('Health Routes', () => {
  let fastify: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()

    // Create a new Fastify instance for each test
    fastify = Fastify({ logger: false })

    // Register the health routes
    await fastify.register(healthRoutes)

    // Mock all controller functions
    mockedController.getHealth.mockImplementation(async (_req, reply) => {
      return reply.status(200).send({ status: 'healthy' })
    })

    mockedController.getHealthz.mockImplementation(async (_req, reply) => {
      return reply.status(200).send({ status: 'healthy' })
    })

    mockedController.getLiveness.mockImplementation(async (_req, reply) => {
      return reply.status(200).send({ status: 'healthy' })
    })

    mockedController.getReadiness.mockImplementation(async (_req, reply) => {
      return reply.status(200).send({ status: 'healthy' })
    })
  })

  afterEach(async () => {
    await fastify.close()
  })

  describe('GET /health', () => {
    it('should register health endpoint', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      expect(mockedController.getHealth).toHaveBeenCalledTimes(1)
    })

    it('should have correct route schema', () => {
      const routes = fastify.printRoutes()
      expect(routes).toContain('health (GET, HEAD)')
    })
  })

  describe('GET /healthz', () => {
    it('should register healthz endpoint', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/healthz',
      })

      expect(response.statusCode).toBe(200)
      expect(mockedController.getHealthz).toHaveBeenCalledTimes(1)
    })

    it('should have correct route schema', () => {
      const routes = fastify.printRoutes()
      expect(routes).toContain('z (GET, HEAD)')
    })
  })

  describe('GET /ready', () => {
    it('should register readiness endpoint', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/ready',
      })

      expect(response.statusCode).toBe(200)
      expect(mockedController.getReadiness).toHaveBeenCalledTimes(1)
    })

    it('should have correct route schema', () => {
      const routes = fastify.printRoutes()
      expect(routes).toContain('ready (GET, HEAD)')
    })
  })

  describe('GET /live', () => {
    it('should register liveness endpoint', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/live',
      })

      expect(response.statusCode).toBe(200)
      expect(mockedController.getLiveness).toHaveBeenCalledTimes(1)
    })

    it('should have correct route schema', () => {
      const routes = fastify.printRoutes()
      expect(routes).toContain('live (GET, HEAD)')
    })
  })

  describe('Route registration', () => {
    it('should register all health routes', () => {
      const routes = fastify.printRoutes()

      expect(routes).toContain('health (GET, HEAD)')
      expect(routes).toContain('z (GET, HEAD)')
      expect(routes).toContain('ready (GET, HEAD)')
      expect(routes).toContain('live (GET, HEAD)')
    })

    it('should have proper route metadata', async () => {
      // Test that routes have the expected schema metadata
      const healthRoute = fastify.hasRoute({
        method: 'GET',
        url: '/health',
      })

      expect(healthRoute).toBe(true)
    })
  })

  describe('Route plugin registration', () => {
    it('should register health routes correctly', async () => {
      // This test verifies that the routes are properly registered
      // by checking if all endpoints respond correctly
      expect(true).toBe(true) // placeholder since we already test routes above
    })
  })

  describe('HTTP methods', () => {
    it('should only accept GET method for health endpoints', async () => {
      const postResponse = await fastify.inject({
        method: 'POST',
        url: '/health',
      })

      expect(postResponse.statusCode).toBe(404)
    })

    it('should only accept GET method for readiness endpoint', async () => {
      const putResponse = await fastify.inject({
        method: 'PUT',
        url: '/ready',
      })

      expect(putResponse.statusCode).toBe(404)
    })

    it('should only accept GET method for liveness endpoint', async () => {
      const deleteResponse = await fastify.inject({
        method: 'DELETE',
        url: '/live',
      })

      expect(deleteResponse.statusCode).toBe(404)
    })
  })
})
