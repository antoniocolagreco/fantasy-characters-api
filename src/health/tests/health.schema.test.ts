import { describe, expect, it } from 'vitest'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Value } from '@sinclair/typebox/value'
import {
  HealthStatusSchema,
  HealthCheckSchema,
  HealthResponseSchema,
  HealthErrorSchema,
} from '../health.schema'

describe('Health Schemas', () => {
  describe('HealthStatusSchema', () => {
    const statusCompiler = TypeCompiler.Compile(HealthStatusSchema)

    it('should validate healthy status', () => {
      expect(statusCompiler.Check('healthy')).toBe(true)
    })

    it('should validate unhealthy status', () => {
      expect(statusCompiler.Check('unhealthy')).toBe(true)
    })

    it('should validate degraded status', () => {
      expect(statusCompiler.Check('degraded')).toBe(true)
    })

    it('should reject invalid status values', () => {
      expect(statusCompiler.Check('invalid')).toBe(false)
      expect(statusCompiler.Check('HEALTHY')).toBe(false)
      expect(statusCompiler.Check('')).toBe(false)
      expect(statusCompiler.Check(null)).toBe(false)
      expect(statusCompiler.Check(undefined)).toBe(false)
      expect(statusCompiler.Check(123)).toBe(false)
    })
  })

  describe('HealthCheckSchema', () => {
    const checkCompiler = TypeCompiler.Compile(HealthCheckSchema)

    it('should validate valid health check object', () => {
      const validCheck = {
        name: 'database',
        status: 'healthy',
        timestamp: '2023-01-01T00:00:00.000Z',
        details: {
          connected: true,
          version: '1.0.0',
        },
      }

      expect(Value.Check(HealthCheckSchema, validCheck)).toBe(true)
    })

    it('should validate health check without optional details', () => {
      const checkWithoutDetails = {
        name: 'memory',
        status: 'degraded',
        timestamp: '2023-01-01T00:00:00.000Z',
      }

      expect(Value.Check(HealthCheckSchema, checkWithoutDetails)).toBe(true)
    })

    it('should reject health check with invalid status', () => {
      const invalidCheck = {
        name: 'database',
        status: 'invalid-status',
        timestamp: '2023-01-01T00:00:00.000Z',
      }

      expect(checkCompiler.Check(invalidCheck)).toBe(false)
    })

    it('should reject health check with missing required fields', () => {
      expect(checkCompiler.Check({})).toBe(false)
      expect(checkCompiler.Check({ name: 'test' })).toBe(false)
      expect(checkCompiler.Check({ status: 'healthy' })).toBe(false)
      expect(checkCompiler.Check({ timestamp: '2023-01-01T00:00:00.000Z' })).toBe(false)
    })

    it('should reject health check with invalid types', () => {
      const invalidTypes = {
        name: 123, // should be string
        status: 'healthy',
        timestamp: '2023-01-01T00:00:00.000Z',
      }

      expect(checkCompiler.Check(invalidTypes)).toBe(false)
    })
  })

  describe('HealthResponseSchema', () => {
    const responseCompiler = TypeCompiler.Compile(HealthResponseSchema)

    it('should validate complete health response', () => {
      const validResponse = {
        status: 'healthy',
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'production',
        checks: [
          {
            name: 'database',
            status: 'healthy',
            timestamp: '2023-01-01T00:00:00.000Z',
            details: { connected: true },
          },
          {
            name: 'memory',
            status: 'degraded',
            timestamp: '2023-01-01T00:00:00.000Z',
          },
        ],
      }

      expect(Value.Check(HealthResponseSchema, validResponse)).toBe(true)
    })

    it('should validate health response with empty checks array', () => {
      const responseWithoutChecks = {
        status: 'unhealthy',
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 0,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      expect(Value.Check(HealthResponseSchema, responseWithoutChecks)).toBe(true)
    })

    it('should reject health response with negative uptime', () => {
      const invalidUptime = {
        status: 'healthy',
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: -100, // negative uptime should be rejected
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      expect(responseCompiler.Check(invalidUptime)).toBe(false)
    })

    it('should reject health response with missing required fields', () => {
      expect(responseCompiler.Check({})).toBe(false)

      const missingStatus = {
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [],
      }

      expect(responseCompiler.Check(missingStatus)).toBe(false)
    })

    it('should reject health response with invalid check objects', () => {
      const invalidChecks = {
        status: 'healthy',
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        checks: [
          {
            name: 'invalid-check',
            // missing status and timestamp
          },
        ],
      }

      expect(responseCompiler.Check(invalidChecks)).toBe(false)
    })
  })

  describe('HealthErrorSchema', () => {
    const errorCompiler = TypeCompiler.Compile(HealthErrorSchema)

    it('should validate error response', () => {
      const validError = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Health check failed',
          timestamp: '2023-01-01T00:00:00.000Z',
          path: '/health',
        },
      }

      expect(Value.Check(HealthErrorSchema, validError)).toBe(true)
    })

    it('should reject error response with missing fields', () => {
      const incompleteError = {
        error: {
          code: 'INTERNAL_ERROR',
          // missing message, timestamp, path
        },
      }

      expect(errorCompiler.Check(incompleteError)).toBe(false)
    })

    it('should reject error response with invalid structure', () => {
      const invalidStructure = {
        message: 'Error occurred', // wrong structure
        code: 'ERROR',
      }

      expect(errorCompiler.Check(invalidStructure)).toBe(false)
    })

    it('should reject error response with invalid types', () => {
      const invalidTypes = {
        error: {
          code: 123, // should be string
          message: 'Error',
          timestamp: '2023-01-01T00:00:00.000Z',
          path: '/health',
        },
      }

      expect(errorCompiler.Check(invalidTypes)).toBe(false)
    })
  })

  describe('Schema compilation', () => {
    it('should compile all schemas without errors', () => {
      expect(() => TypeCompiler.Compile(HealthStatusSchema)).not.toThrow()
      expect(() => TypeCompiler.Compile(HealthCheckSchema)).not.toThrow()
      expect(() => TypeCompiler.Compile(HealthResponseSchema)).not.toThrow()
      expect(() => TypeCompiler.Compile(HealthErrorSchema)).not.toThrow()
    })

    it('should have proper schema properties', () => {
      expect(HealthStatusSchema).toBeDefined()
      expect(HealthCheckSchema).toBeDefined()
      expect(HealthResponseSchema).toBeDefined()
      expect(HealthErrorSchema).toBeDefined()
    })
  })
})
