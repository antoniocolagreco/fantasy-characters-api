/**
 * Request Logging Middleware Tests
 * TASK-18.5: Test request/response logging functionality
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { environment } from '../config'
import {
  getLoggingConfig,
  isLoggingEnabled,
  registerRequestLogging,
} from '../request-logging.middleware'

// Mock environment
vi.mock('../config', () => ({
  environment: {
    NODE_ENV: 'development',
  },
}))

describe('Request Logging Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isLoggingEnabled', () => {
    it('should return false in test environment', () => {
      vi.mocked(environment).NODE_ENV = 'test'
      expect(isLoggingEnabled()).toBe(false)
    })

    it('should return true in development environment', () => {
      vi.mocked(environment).NODE_ENV = 'development'
      expect(isLoggingEnabled()).toBe(true)
    })

    it('should return true in production environment', () => {
      vi.mocked(environment).NODE_ENV = 'production'
      expect(isLoggingEnabled()).toBe(true)
    })
  })

  describe('getLoggingConfig', () => {
    it('should return disabled config for test environment', () => {
      vi.mocked(environment).NODE_ENV = 'test'
      const config = getLoggingConfig()

      expect(config.enabled).toBe(false)
      expect(config.environment).toBe('test')
      expect(config.level).toBe('detailed') // test uses detailed level
    })

    it('should return detailed config for development environment', () => {
      vi.mocked(environment).NODE_ENV = 'development'
      const config = getLoggingConfig()

      expect(config.enabled).toBe(true)
      expect(config.environment).toBe('development')
      expect(config.level).toBe('detailed')
      expect(config.excludedPaths).toContain('/api/health')
      expect(config.excludedHeaders).toContain('authorization')
    })

    it('should return minimal config for production environment', () => {
      vi.mocked(environment).NODE_ENV = 'production'
      const config = getLoggingConfig()

      expect(config.enabled).toBe(true)
      expect(config.environment).toBe('production')
      expect(config.level).toBe('minimal')
    })
  })

  describe('registerRequestLogging', () => {
    it('should register logging hooks without error', () => {
      const mockFastify = {
        addHook: vi.fn(),
        log: {
          info: vi.fn(),
        },
      }

      // Should not throw
      expect(() => {
        registerRequestLogging(mockFastify as any)
      }).not.toThrow()

      // Should register the required hooks
      expect(mockFastify.addHook).toHaveBeenCalled()
    })

    it('should register logging hooks in non-test environment', () => {
      vi.mocked(environment).NODE_ENV = 'development'

      const mockFastify = {
        addHook: vi.fn(),
        log: {
          info: vi.fn(),
        },
      }

      registerRequestLogging(mockFastify as any)

      // Should register hooks for request and response
      expect(mockFastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function))
      expect(mockFastify.addHook).toHaveBeenCalledWith('onResponse', expect.any(Function))
      expect(mockFastify.addHook).toHaveBeenCalledWith('onError', expect.any(Function))

      // Should log registration message
      expect(mockFastify.log.info).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'development',
          loggingLevel: 'detailed',
        }),
        'Request/Response logging middleware registered',
      )
    })

    it('should not log registration message in test environment', () => {
      vi.mocked(environment).NODE_ENV = 'test'

      const mockFastify = {
        addHook: vi.fn(),
        log: {
          info: vi.fn(),
        },
      }

      registerRequestLogging(mockFastify as any)

      // Should not log registration message in test
      expect(mockFastify.log.info).not.toHaveBeenCalled()
    })
  })
})
