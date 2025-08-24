/**
 * Health module exports
 * Centralized exports for health system components
 */

// Types (derived from schemas)
export type {
  HealthStatus,
  HealthCheck,
  HealthResponse,
  BasicHealthResponse,
  HealthError,
  HealthCheckLevel,
} from './health.types'

// Schemas (for validation and documentation)
export {
  HealthStatusSchema,
  HealthCheckSchema,
  HealthResponseSchema,
  BasicHealthResponseSchema,
  HealthErrorSchema,
} from './health.schema'

// Service functions
export {
  getPublicHealthStatus,
  getInternalHealthStatus,
  getLivenessStatus,
  getReadinessStatus,
  getBasicHealthStatus,
} from './health.service'

// Controllers
export {
  getHealth,
  getInternalHealth,
  getHealthz,
  getLiveness,
  getReadiness,
} from './health.controller'

// Routes
export { healthRoutes } from './health.route'
