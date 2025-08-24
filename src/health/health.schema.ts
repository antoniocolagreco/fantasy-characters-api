/**
 * Health check schemas
 * TypeBox schemas for health check endpoints with precise type definitions
 */

import { Type } from '@sinclair/typebox'

// Health status enum
export const HealthStatusSchema = Type.Union([
  Type.Literal('healthy'),
  Type.Literal('unhealthy'),
  Type.Literal('degraded'),
])

// Individual health check schema with flexible details
export const HealthCheckSchema = Type.Object(
  {
    name: Type.String({
      description: 'Name of the health check',
    }),
    status: HealthStatusSchema,
    timestamp: Type.String({
      description: 'ISO 8601 timestamp',
    }),
    details: Type.Optional(
      Type.Record(Type.String(), Type.Unknown(), {
        description: 'Optional details about the health check',
      }),
    ),
    debugInfo: Type.Optional(
      Type.Record(Type.String(), Type.Unknown(), {
        description: 'Optional debug information',
      }),
    ),
  },
  {
    additionalProperties: true,
    description: 'Individual health check result',
  },
)

// Complete health response schema
export const HealthResponseSchema = Type.Object(
  {
    status: HealthStatusSchema,
    timestamp: Type.String({
      description: 'ISO 8601 timestamp',
    }),
    uptime: Type.Optional(
      Type.Number({
        minimum: 0,
        description: 'Server uptime in seconds',
      }),
    ),
    version: Type.Optional(
      Type.String({
        description: 'Application version',
      }),
    ),
    environment: Type.Optional(
      Type.String({
        description: 'Environment name',
      }),
    ),
    checks: Type.Optional(
      Type.Array(HealthCheckSchema, {
        description: 'Array of individual health checks',
      }),
    ),
  },
  {
    additionalProperties: true,
    description: 'Complete health check response',
  },
)

// Basic health response (for public endpoints)
export const BasicHealthResponseSchema = Type.Object(
  {
    status: HealthStatusSchema,
    timestamp: Type.String({
      description: 'ISO 8601 timestamp',
    }),
  },
  {
    additionalProperties: true,
    description: 'Basic health status for public endpoints',
  },
)

// Error response schema for health endpoints (compatible with Fastify error format)
export const HealthErrorSchema = Type.Object(
  {
    statusCode: Type.Number({ description: 'HTTP status code' }),
    error: Type.String({ description: 'Error type' }),
    message: Type.String({ description: 'Error message' }),
  },
  {
    additionalProperties: true,
    description: 'Error response for health check failures',
  },
)
