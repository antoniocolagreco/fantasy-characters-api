/**
 * Centralized test utilities and mock helpers
 * Consolidates common testing patterns to avoid duplication
 *
 * This file contains:
 * - Mock objects (requests, replies, apps)
 * - Assertion helpers (health, JSON, error validation)
 * - Database test utilities (user creation, cleanup)
 * - Environment setup utilities
 */

import { vi, expect } from 'vitest'
import Fastify, { type FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { db } from '../database/index'
import { hashPassword } from '../../auth/auth.service'
import { Role } from '@prisma/client'

// ====================
// MOCK OBJECTS
// ====================

// Mock Fastify Request with sensible defaults
export const createMockRequest = (overrides: Partial<FastifyRequest> = {}): FastifyRequest =>
  ({
    log: {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
      child: vi.fn(),
      level: 'info',
    },
    url: '/test',
    method: 'GET',
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  }) as unknown as FastifyRequest

// Mock Fastify Reply with chainable methods
export const createMockReply = (): FastifyReply => {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    code: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
    headers: vi.fn().mockReturnThis(),
    type: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  }
  return reply as unknown as FastifyReply
}

// Create test Fastify app with standard configuration
export const createTestApp = async (
  options: {
    routes?: (app: FastifyInstance) => Promise<void>
    plugins?: (app: FastifyInstance) => Promise<void>
    logger?: boolean
  } = {},
): Promise<FastifyInstance> => {
  const { routes, plugins, logger = false } = options

  const app = Fastify({
    logger,
    disableRequestLogging: true,
  })

  // Register plugins if provided
  if (plugins) {
    await plugins(app)
  }

  // Register routes if provided
  if (routes) {
    await routes(app)
  }

  return app
}

// Create test app specifically for health routes
export const createHealthTestApp = async (): Promise<FastifyInstance> => {
  const { healthRoutes } = await import('../../health/health.route')

  return createTestApp({
    routes: async app => {
      await app.register(healthRoutes)
    },
  })
}

// Mock database health responses
export const mockDatabaseHealth = (status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy') => {
  const healthResponses = {
    healthy: {
      status: 'healthy',
      connected: true,
      version: '3.46.0',
    },
    unhealthy: {
      status: 'unhealthy',
      connected: false,
      errorMessage: 'Connection timeout',
    },
    degraded: {
      status: 'degraded',
      connected: true,
      version: '3.46.0',
      warning: 'High response time',
    },
  }

  return healthResponses[status]
}

// Common test assertions for health responses
export const expectHealthResponse = (body: Record<string, unknown>) => {
  expect(body).toHaveProperty('status')
  expect(body).toHaveProperty('timestamp')
  expect(body).toHaveProperty('uptime')
  expect(body).toHaveProperty('version')
  expect(body).toHaveProperty('environment')
  expect(body).toHaveProperty('checks')

  expect(body.status).toMatch(/^(healthy|unhealthy|degraded)$/)
  expect(Array.isArray(body.checks)).toBe(true)
  expect(typeof body.uptime).toBe('number')
  expect(typeof body.version).toBe('string')
  expect(typeof body.environment).toBe('string')

  // Validate timestamp format
  expect(() => new Date(body.timestamp as string)).not.toThrow()
  expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
}

// Common test assertions for JSON API responses
export const expectJsonResponse = (
  response: { statusCode: number; headers: Record<string, any>; body: string },
  expectedStatus = 200,
) => {
  expect(response.statusCode).toBe(expectedStatus)
  expect(response.headers['content-type']).toMatch(/application\/json/)
  expect(() => JSON.parse(response.body)).not.toThrow()
}

// Mock memory usage for testing different scenarios
export const mockMemoryUsage = (utilization: 'low' | 'high' | 'critical' = 'low') => {
  const scenarios = {
    low: {
      rss: 100 * 1024 * 1024, // 100MB
      heapUsed: 500 * 1024 * 1024, // 500MB (50%)
      heapTotal: 1000 * 1024 * 1024, // 1000MB
      external: 50 * 1024 * 1024, // 50MB
      arrayBuffers: 10 * 1024 * 1024, // 10MB
    },
    high: {
      rss: 100 * 1024 * 1024, // 100MB
      heapUsed: 960 * 1024 * 1024, // 960MB (96%)
      heapTotal: 1000 * 1024 * 1024, // 1000MB
      external: 50 * 1024 * 1024, // 50MB
      arrayBuffers: 10 * 1024 * 1024, // 10MB
    },
    critical: {
      rss: 100 * 1024 * 1024, // 100MB
      heapUsed: 990 * 1024 * 1024, // 990MB (99%)
      heapTotal: 1000 * 1024 * 1024, // 1000MB
      external: 50 * 1024 * 1024, // 50MB
      arrayBuffers: 10 * 1024 * 1024, // 10MB
    },
  }

  return scenarios[utilization]
}

// Mock process uptime for consistent testing
export const mockProcessUptime = (seconds: number) => {
  return vi.spyOn(process, 'uptime').mockReturnValue(seconds)
}

// Setup common environment variables for testing
export const setupTestEnvironment = () => {
  const originalEnv = { ...process.env }

  // Set test-specific environment
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'file:./test.db'
  process.env.JWT_SECRET = 'test-secret'

  return () => {
    // Restore original environment
    process.env = originalEnv
  }
}

// Common error response structure validation
export const expectErrorResponse = (body: Record<string, unknown>, expectedCode: string) => {
  expect(body.error).toBeDefined()
  expect((body.error as Record<string, unknown>).code).toBe(expectedCode)
  expect((body.error as Record<string, unknown>).message).toBeDefined()
  expect((body.error as Record<string, unknown>).timestamp).toBeDefined()
  expect((body.error as Record<string, unknown>).path).toBeDefined()

  // Validate timestamp format
  expect(() => new Date((body.error as Record<string, unknown>).timestamp as string)).not.toThrow()
}

// ====================
// DATABASE TEST UTILITIES
// ====================

export type TestUserData = {
  email?: string
  password?: string
  name?: string
  bio?: string
  role?: Role
  isActive?: boolean
  isEmailVerified?: boolean
}

export type CreateTestUserResult = {
  user: {
    id: string
    email: string
    name: string | null
    bio: string | null
    role: Role
    isActive: boolean
    isEmailVerified: boolean
    lastLogin: string
    createdAt: string
    updatedAt: string
  }
  password: string
}

/**
 * Clean up test data from database
 */
export const cleanupTestData = async (): Promise<void> => {
  try {
    // Delete all users to ensure clean state
    await db.user.deleteMany({})
  } catch (error) {
    // Ignore errors if tables don't exist yet - this can happen during setup
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.warn('⚠️  Table does not exist during cleanup, skipping...')
      return
    }
    throw error
  }
}

/**
 * Safe delete operation that handles missing tables gracefully
 */
export const safeDeleteMany = async (
  operation: () => Promise<any>,
  tableName = 'unknown',
): Promise<void> => {
  try {
    await operation()
  } catch (error) {
    // Ignore errors if tables don't exist yet - this can happen during setup
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.warn(`⚠️  Table ${tableName} does not exist during cleanup, skipping...`)
      return
    }
    throw error
  }
}

/**
 * Create a test user with optional custom data
 */
export const createTestUser = async (
  userData: TestUserData = {},
): Promise<CreateTestUserResult> => {
  const defaultPassword = 'TestPassword123!'
  const password = userData.password || defaultPassword

  const user = await db.user.create({
    data: {
      email: userData.email || `test-${Date.now()}@example.com`,
      passwordHash: await hashPassword(password),
      name: userData.name || 'Test User',
      bio: userData.bio || 'Test user bio',
      role: userData.role || Role.USER,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      isEmailVerified: userData.isEmailVerified !== undefined ? userData.isEmailVerified : false,
      lastLogin: new Date(),
    },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    password,
  }
}

/**
 * Create a test admin user
 */
export const createTestAdminUser = async (
  userData: TestUserData = {},
): Promise<CreateTestUserResult> => {
  return createTestUser({
    ...userData,
    role: Role.ADMIN,
    email: userData.email || `admin-${Date.now()}@example.com`,
    name: userData.name || 'Test Admin',
  })
}

/**
 * Create multiple test users
 */
export const createTestUsers = async (
  count: number,
  userData: TestUserData = {},
): Promise<CreateTestUserResult[]> => {
  const users: CreateTestUserResult[] = []

  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      ...userData,
      email: userData.email || `test-${Date.now()}-${i}@example.com`,
      name: userData.name || `Test User ${i + 1}`,
    })
    users.push(user)
  }

  return users
}
