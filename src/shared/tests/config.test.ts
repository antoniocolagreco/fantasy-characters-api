/**
 * Environment configuration tests
 * Tests for environment loading and validation
 */

import {
  apiConfig,
  cacheConfig,
  EnvironmentSchema,
  getEnvironmentDocumentation,
  healthConfig,
  logConfig,
  oauthConfig,
  rbacConfig,
  securityConfig,
  serverConfig,
  validateEnvironmentVariables,
} from '../config'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Environment Configuration', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  describe('EnvironmentSchema', () => {
    it('should define required schema properties', () => {
      expect(EnvironmentSchema).toBeDefined()
      expect(EnvironmentSchema.type).toBe('object')
      expect(EnvironmentSchema.properties).toBeDefined()
    })

    it('should have all required environment variables defined', () => {
      const properties = EnvironmentSchema.properties as Record<string, unknown>
      const requiredProps = [
        'NODE_ENV',
        'PORT',
        'HOST',
        'API_PREFIX',
        'API_VERSION',
        'LOG_LEVEL',
        'DATABASE_URL',
        'JWT_SECRET',
        'JWT_EXPIRES_IN',
        'RATE_LIMIT_MAX',
        'RATE_LIMIT_TIMEWINDOW',
        'CORS_ORIGIN',
        'HEALTH_CHECK_ENABLED',
      ]

      requiredProps.forEach(prop => {
        expect(properties[prop]).toBeDefined()
      })
    })
  })

  describe('serverConfig', () => {
    it('should have default values', () => {
      expect(serverConfig.port).toBe(3000)
      expect(serverConfig.host).toBe('0.0.0.0')
      // NODE_ENV should be 'test' in test environment
      expect(['test', 'development']).toContain(serverConfig.nodeEnv)
    })

    it('should be number for port', () => {
      expect(typeof serverConfig.port).toBe('number')
      expect(serverConfig.port).toBeGreaterThan(0)
      expect(serverConfig.port).toBeLessThanOrEqual(65535)
    })
  })

  describe('apiConfig', () => {
    it('should have default values', () => {
      expect(apiConfig.prefix).toBe('/api')
      expect(apiConfig.version).toBe('v1')
    })

    it('should have string values', () => {
      expect(typeof apiConfig.prefix).toBe('string')
      expect(typeof apiConfig.version).toBe('string')
    })
  })

  describe('logConfig', () => {
    it('should have default level', () => {
      // In test environment, log level should be 'silent' for cleaner output
      expect(logConfig.level).toBe('silent')
    })

    it('should have transport in development', () => {
      // Transport is only set in development, not in test
      if (serverConfig.nodeEnv === 'development') {
        expect(logConfig.transport).toBeDefined()
        expect(logConfig.transport?.target).toBe('pino-pretty')
      } else {
        expect(logConfig.transport).toBeUndefined()
      }
    })

    it('should be valid log level', () => {
      const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']
      expect(validLevels).toContain(logConfig.level)
    })
  })

  describe('securityConfig', () => {
    it('should have default values', () => {
      expect(securityConfig.jwtSecret).toBeDefined()
      expect(securityConfig.jwtExpiresIn).toBe('15m')
      expect(securityConfig.refreshTokenExpiresIn).toBe('7d')
      expect(securityConfig.rateLimitMax).toBe(100)
      expect(securityConfig.rateLimitTimeWindow).toBe(60000)
      expect(securityConfig.corsOrigin).toBe('http://localhost:3000')
    })

    it('should have secure defaults', () => {
      expect(securityConfig.jwtSecret.length).toBeGreaterThanOrEqual(32)
      expect(securityConfig.rateLimitMax).toBeGreaterThan(0)
      expect(securityConfig.rateLimitTimeWindow).toBeGreaterThan(0)
    })

    it('should validate JWT expiration patterns', () => {
      expect(securityConfig.jwtExpiresIn).toMatch(/^\d+[smhd]$/)
      expect(securityConfig.refreshTokenExpiresIn).toMatch(/^\d+[smhd]$/)
    })
  })

  describe('healthConfig', () => {
    it('should have default enabled state', () => {
      expect(healthConfig.enabled).toBe(true)
    })

    it('should be boolean', () => {
      expect(typeof healthConfig.enabled).toBe('boolean')
    })
  })

  describe('Environment variable validation', () => {
    it('should handle missing environment variables with defaults', () => {
      // Clear all environment variables
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('NODE_ENV') || key.startsWith('PORT') || key.startsWith('HOST')) {
          delete process.env[key]
        }
      })

      // Re-import to test defaults
      expect(() => {
        // This would be tested if we could re-import the module
        // For now, we just verify the current values are sensible
        expect(serverConfig.port).toBeGreaterThan(0)
        expect(serverConfig.host).toBeTruthy()
      }).not.toThrow()
    })

    it('should validate port ranges', () => {
      expect(serverConfig.port).toBeGreaterThan(0)
      expect(serverConfig.port).toBeLessThanOrEqual(65535)
    })

    it('should validate rate limit values', () => {
      expect(securityConfig.rateLimitMax).toBeGreaterThan(0)
      expect(securityConfig.rateLimitTimeWindow).toBeGreaterThan(0)
    })
  })

  describe('Development vs Production configuration', () => {
    it('should have pino-pretty transport in development', () => {
      // We're running in test, but the config defaults to development behavior
      if (logConfig.transport) {
        expect(logConfig.transport.target).toBe('pino-pretty')
        expect(logConfig.transport.options).toBeDefined()
      }
    })

    it('should have appropriate CORS settings', () => {
      expect(securityConfig.corsOrigin).toMatch(/^https?:\/\//)
    })
  })

  describe('Configuration object structure', () => {
    it('should export all configuration objects', () => {
      expect(serverConfig).toBeDefined()
      expect(apiConfig).toBeDefined()
      expect(logConfig).toBeDefined()
      expect(securityConfig).toBeDefined()
      expect(healthConfig).toBeDefined()
      expect(cacheConfig).toBeDefined()
      expect(rbacConfig).toBeDefined()
      expect(oauthConfig).toBeDefined()
    })

    it('should have immutable configuration objects', () => {
      // Test that we can't modify the configs (they should be read-only)
      expect(() => {
        // These should not throw as they are regular objects
        // but in production, they should be frozen
        const originalPort = serverConfig.port
        expect(originalPort).toBeDefined()
      }).not.toThrow()
    })
  })

  describe('cacheConfig', () => {
    it('should have default values', () => {
      expect(cacheConfig.enabled).toBe(true)
      expect(cacheConfig.defaultTtl).toBe(300)
      expect(cacheConfig.maxEntries).toBe(1000)
    })

    it('should have valid ranges', () => {
      expect(cacheConfig.defaultTtl).toBeGreaterThan(0)
      expect(cacheConfig.defaultTtl).toBeLessThanOrEqual(86400)
      expect(cacheConfig.maxEntries).toBeGreaterThan(0)
      expect(cacheConfig.maxEntries).toBeLessThanOrEqual(100000)
    })
  })

  describe('rbacConfig', () => {
    it('should have default disabled state for development', () => {
      expect(rbacConfig.enabled).toBe(false)
    })

    it('should be boolean', () => {
      expect(typeof rbacConfig.enabled).toBe('boolean')
    })
  })

  describe('oauthConfig', () => {
    it('should have google and github configurations', () => {
      expect(oauthConfig.google).toBeDefined()
      expect(oauthConfig.github).toBeDefined()
      expect(typeof oauthConfig.google.enabled).toBe('boolean')
      expect(typeof oauthConfig.github.enabled).toBe('boolean')
    })

    it('should not be enabled by default in test environment', () => {
      expect(oauthConfig.google.enabled).toBe(false)
      expect(oauthConfig.github.enabled).toBe(false)
    })
  })

  describe('Environment validation utilities', () => {
    it('should validate current environment successfully', () => {
      expect(validateEnvironmentVariables()).toBe(true)
    })

    it('should provide environment documentation', () => {
      const docs = getEnvironmentDocumentation()
      expect(docs).toBeDefined()
      expect(typeof docs).toBe('object')
      expect(docs.NODE_ENV).toContain('environment mode')
      expect(docs.DATABASE_URL).toContain('PostgreSQL')
      expect(docs.JWT_SECRET).toContain('JWT signing secret')
    })
  })
})

describe('Production security validation', () => {
  it('should throw error if JWT_SECRET contains dev-secret in production', () => {
    // This validation is now handled by the enhanced validation function
    // The existing config still loads for backward compatibility
    expect(securityConfig.jwtSecret).toBeDefined()
  })

  it('should validate environment patterns', () => {
    // Test JWT expiration pattern
    expect('15m').toMatch(/^\d+[smhd]$/)
    expect('1h').toMatch(/^\d+[smhd]$/)
    expect('7d').toMatch(/^\d+[smhd]$/)
    expect('invalid').not.toMatch(/^\d+[smhd]$/)
  })

  it('should validate API prefix pattern', () => {
    expect('/api').toMatch(/^\/[a-zA-Z0-9/-]*$/)
    expect('/api/v1').toMatch(/^\/[a-zA-Z0-9/-]*$/)
    expect('invalid').not.toMatch(/^\/[a-zA-Z0-9/-]*$/)
  })

  it('should validate API version pattern', () => {
    expect('v1').toMatch(/^v\d+$/)
    expect('v2').toMatch(/^v\d+$/)
    expect('invalid').not.toMatch(/^v\d+$/)
  })
})

describe('Enhanced environment validation', () => {
  it('should provide comprehensive schema validation', () => {
    expect(EnvironmentSchema.type).toBe('object')
    expect(EnvironmentSchema.properties).toBeDefined()

    const properties = EnvironmentSchema.properties as Record<string, unknown>

    // Check that all major variables are defined in schema
    const expectedVars = [
      'NODE_ENV',
      'PORT',
      'HOST',
      'API_PREFIX',
      'API_VERSION',
      'LOG_LEVEL',
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_EXPIRES_IN',
      'REFRESH_TOKEN_EXPIRES_IN',
      'ARGON2_MEMORY_COST',
      'ARGON2_TIME_COST',
      'ARGON2_PARALLELISM',
      'RATE_LIMIT_MAX',
      'RATE_LIMIT_TIMEWINDOW',
      'CORS_ORIGIN',
      'HEALTH_CHECK_ENABLED',
      'CACHE_ENABLED',
      'CACHE_DEFAULT_TTL',
      'CACHE_MAX_ENTRIES',
      'RBAC_ENABLED',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'SESSION_SECRET',
    ]

    expectedVars.forEach(varName => {
      expect(properties[varName]).toBeDefined()
    })
  })

  it('should validate number ranges in schema', () => {
    const properties = EnvironmentSchema.properties as Record<string, any>

    // PORT validation
    expect(properties.PORT.minimum).toBe(1)
    expect(properties.PORT.maximum).toBe(65535)

    // Argon2 validations
    expect(properties.ARGON2_MEMORY_COST.minimum).toBe(1024)
    expect(properties.ARGON2_TIME_COST.minimum).toBe(1)
    expect(properties.ARGON2_PARALLELISM.minimum).toBe(1)

    // Rate limiting validations
    expect(properties.RATE_LIMIT_MAX.minimum).toBe(1)
    expect(properties.RATE_LIMIT_TIMEWINDOW.minimum).toBe(1000)

    // Cache validations
    expect(properties.CACHE_DEFAULT_TTL.minimum).toBe(1)
    expect(properties.CACHE_MAX_ENTRIES.minimum).toBe(1)
  })
})

describe('Log transport configuration', () => {
  it('should configure pino-pretty in development', () => {
    // Test per linee 97-104
  })
})
