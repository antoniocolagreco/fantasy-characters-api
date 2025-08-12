/**
 * Health check schemas
 * TypeBox schemas for health check endpoints
 */

import { Type } from '@sinclair/typebox'

// Health status enum
export const HealthStatusSchema = Type.Union([
  Type.Literal('healthy'),
  Type.Literal('unhealthy'),
  Type.Literal('degraded'),
])

// Individual health check schema
export const HealthCheckSchema = Type.Object({
  name: Type.String(),
  status: HealthStatusSchema,
  timestamp: Type.String({ format: 'date-time' }),
  details: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
})

// Health response schema
export const HealthResponseSchema = Type.Object({
  status: HealthStatusSchema,
  timestamp: Type.String({ format: 'date-time' }),
  uptime: Type.Number({ minimum: 0 }),
  version: Type.String(),
  environment: Type.String(),
  checks: Type.Array(HealthCheckSchema),
})

// Error response schema
export const HealthErrorSchema = Type.Object({
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
    timestamp: Type.String({ format: 'date-time' }),
    path: Type.String(),
  }),
})
