/**
 * Health check type definitions
 * All health-related types derived from TypeBox schemas
 */

import { Static } from '@sinclair/typebox'
import {
  HealthStatusSchema,
  HealthCheckSchema,
  HealthResponseSchema,
  BasicHealthResponseSchema,
  HealthErrorSchema,
} from './health.schema'

// Core health types derived from schemas
export type HealthStatus = Static<typeof HealthStatusSchema>
export type HealthCheck = Static<typeof HealthCheckSchema>
export type HealthResponse = Static<typeof HealthResponseSchema>
export type BasicHealthResponse = Static<typeof BasicHealthResponseSchema>
export type HealthError = Static<typeof HealthErrorSchema>

// Health check levels for service logic
export type HealthCheckLevel =
  | 'basic'
  | 'liveness'
  | 'readiness'
  | 'comprehensive'
  | 'public'
  | 'detailed'
