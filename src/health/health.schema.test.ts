/**
 * Health schema tests
 * Tests for health check endpoint schemas and validation
 */

import { describe, it, expect } from 'vitest'
import {
  HealthStatusSchema,
  HealthCheckSchema,
  HealthResponseSchema,
  HealthErrorSchema,
} from './health.schema.js'

// Helper type for schema property access
type SchemaProperty = {
  type?: string
  format?: string
  minimum?: number
  maximum?: number
  const?: string
  items?: unknown
  properties?: Record<string, unknown>
  anyOf?: unknown[]
  default?: unknown
  required?: string[]
}

describe('Health Schemas', () => {
  describe('HealthStatusSchema', () => {
    it('should be a valid union schema', () => {
      expect(HealthStatusSchema).toBeDefined()
      expect(HealthStatusSchema.anyOf).toBeDefined()
      expect(HealthStatusSchema.anyOf).toHaveLength(3)
    })

    it('should have correct status values', () => {
      const statusValues = HealthStatusSchema.anyOf.map(
        (item: unknown) => (item as { const: string }).const,
      )
      expect(statusValues).toContain('healthy')
      expect(statusValues).toContain('unhealthy')
      expect(statusValues).toContain('degraded')
    })
  })

  describe('HealthCheckSchema', () => {
    it('should be a valid TypeBox schema', () => {
      expect(HealthCheckSchema).toBeDefined()
      expect(HealthCheckSchema.type).toBe('object')
      expect(HealthCheckSchema.properties).toBeDefined()
    })

    it('should have required properties', () => {
      const properties = HealthCheckSchema.properties as Record<string, SchemaProperty>

      expect(properties.name).toBeDefined()
      expect(properties.status).toBeDefined()
      expect(properties.timestamp).toBeDefined()
      expect(properties.details).toBeDefined()

      expect(properties.name.type).toBe('string')
      expect(properties.timestamp.type).toBe('string')
      expect(properties.timestamp.format).toBe('date-time')
    })

    it('should have optional details property', () => {
      const properties = HealthCheckSchema.properties as Record<string, SchemaProperty>
      const required = HealthCheckSchema.required || []

      expect(properties.details).toBeDefined()
      expect(required).not.toContain('details')
    })

    it('should require name, status, and timestamp', () => {
      const required = HealthCheckSchema.required || []
      expect(required).toContain('name')
      expect(required).toContain('status')
      expect(required).toContain('timestamp')
    })
  })

  describe('HealthResponseSchema', () => {
    it('should be a valid TypeBox schema', () => {
      expect(HealthResponseSchema).toBeDefined()
      expect(HealthResponseSchema.type).toBe('object')
      expect(HealthResponseSchema.properties).toBeDefined()
    })

    it('should have all required response properties', () => {
      const properties = HealthResponseSchema.properties as Record<string, SchemaProperty>

      expect(properties.status).toBeDefined()
      expect(properties.timestamp).toBeDefined()
      expect(properties.uptime).toBeDefined()
      expect(properties.version).toBeDefined()
      expect(properties.environment).toBeDefined()
      expect(properties.checks).toBeDefined()
    })

    it('should have correct property types', () => {
      const properties = HealthResponseSchema.properties as Record<string, SchemaProperty>

      expect(properties.timestamp.type).toBe('string')
      expect(properties.timestamp.format).toBe('date-time')
      expect(properties.uptime.type).toBe('number')
      expect(properties.uptime.minimum).toBe(0)
      expect(properties.version.type).toBe('string')
      expect(properties.environment.type).toBe('string')
      expect(properties.checks.type).toBe('array')
    })

    it('should have checks array with proper item schema', () => {
      const properties = HealthResponseSchema.properties as Record<string, SchemaProperty>
      const checksSchema = properties.checks

      expect(checksSchema.type).toBe('array')
      expect(checksSchema.items).toBeDefined()
      expect(checksSchema.items).toEqual(HealthCheckSchema)
    })

    it('should require all properties', () => {
      const required = HealthResponseSchema.required || []
      expect(required).toContain('status')
      expect(required).toContain('timestamp')
      expect(required).toContain('uptime')
      expect(required).toContain('version')
      expect(required).toContain('environment')
      expect(required).toContain('checks')
    })
  })

  describe('HealthErrorSchema', () => {
    it('should be a valid TypeBox schema', () => {
      expect(HealthErrorSchema).toBeDefined()
      expect(HealthErrorSchema.type).toBe('object')
      expect(HealthErrorSchema.properties).toBeDefined()
    })

    it('should have error property structure', () => {
      const properties = HealthErrorSchema.properties as Record<string, SchemaProperty>

      expect(properties.error).toBeDefined()
      expect(properties.error.type).toBe('object')

      const errorProperties = properties.error.properties as Record<string, SchemaProperty>
      expect(errorProperties.code).toBeDefined()
      expect(errorProperties.message).toBeDefined()
      expect(errorProperties.timestamp).toBeDefined()
      expect(errorProperties.path).toBeDefined()

      expect(errorProperties.code.type).toBe('string')
      expect(errorProperties.message.type).toBe('string')
      expect(errorProperties.timestamp.type).toBe('string')
      expect(errorProperties.timestamp.format).toBe('date-time')
      expect(errorProperties.path.type).toBe('string')
    })
  })

  describe('Schema relationships', () => {
    it('should use consistent status schema across types', () => {
      const healthCheckProperties = HealthCheckSchema.properties as Record<string, SchemaProperty>
      const healthResponseProperties = HealthResponseSchema.properties as Record<
        string,
        SchemaProperty
      >

      expect(healthCheckProperties.status).toEqual(HealthStatusSchema)
      expect(healthResponseProperties.status).toEqual(HealthStatusSchema)
    })

    it('should reference health check schema in response checks', () => {
      const properties = HealthResponseSchema.properties as Record<string, SchemaProperty>
      const checksItems = properties.checks.items

      expect(checksItems).toEqual(HealthCheckSchema)
    })
  })

  describe('OpenAPI compatibility', () => {
    it('should be compatible with OpenAPI specification', () => {
      expect(HealthResponseSchema.type).toBeDefined()
      expect(HealthResponseSchema.properties).toBeDefined()
      expect(typeof HealthResponseSchema).toBe('object')
    })

    it('should have proper timestamp formats', () => {
      const healthCheckProps = HealthCheckSchema.properties as Record<string, SchemaProperty>
      const healthResponseProps = HealthResponseSchema.properties as Record<string, SchemaProperty>
      const errorProps = HealthErrorSchema.properties as Record<string, SchemaProperty>

      expect(healthCheckProps.timestamp.format).toBe('date-time')
      expect(healthResponseProps.timestamp.format).toBe('date-time')
      expect((errorProps.error.properties as Record<string, SchemaProperty>).timestamp.format).toBe(
        'date-time',
      )
    })
  })

  describe('Validation constraints', () => {
    it('should have non-negative uptime constraint', () => {
      const properties = HealthResponseSchema.properties as Record<string, SchemaProperty>
      expect(properties.uptime.minimum).toBe(0)
    })

    it('should have proper string types for required fields', () => {
      const healthCheckProps = HealthCheckSchema.properties as Record<string, SchemaProperty>
      const healthResponseProps = HealthResponseSchema.properties as Record<string, SchemaProperty>

      expect(healthCheckProps.name.type).toBe('string')
      expect(healthResponseProps.version.type).toBe('string')
      expect(healthResponseProps.environment.type).toBe('string')
    })
  })
})
