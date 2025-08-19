/**
 * Health check service
 * Provides health status information about the application
 */

import { healthConfig } from '@/shared/config.js'
import { getDatabaseHealth } from '../shared/database/index.js'

export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded'

export type HealthCheck = {
  readonly name: string
  readonly status: HealthStatus
  readonly timestamp: string
  readonly details?: Record<string, unknown>
}

export type HealthResponse = {
  readonly status: HealthStatus
  readonly timestamp: string
  readonly uptime: number
  readonly version: string
  readonly environment: string
  readonly checks: HealthCheck[]
}

export type HealthCheckLevel = 'basic' | 'liveness' | 'readiness' | 'comprehensive'

// Individual health check functions
const checkApplication = (): HealthCheck => ({
  name: 'application',
  status: 'healthy',
  timestamp: new Date().toISOString(),
  details: {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
  },
})

const checkMemory = (): HealthCheck => {
  const memoryUsage = process.memoryUsage()
  const freeMemory = process.memoryUsage().heapTotal - process.memoryUsage().heapUsed
  const memoryUtilization = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

  // Memory health thresholds adjusted for development: degraded > 95%, unhealthy > 98%
  let status: HealthStatus = 'healthy'
  if (memoryUtilization > 98) {
    status = 'unhealthy'
  } else if (memoryUtilization > 95) {
    status = 'degraded'
  }

  return {
    name: 'memory',
    status,
    timestamp: new Date().toISOString(),
    details: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      free: Math.round(freeMemory / 1024 / 1024), // MB
      utilization: Math.round(memoryUtilization * 100) / 100, // percentage
    },
  }
}

const checkUptime = (): HealthCheck => {
  const uptimeSeconds = process.uptime()
  const status: HealthStatus = uptimeSeconds > 0 ? 'healthy' : 'unhealthy'

  return {
    name: 'uptime',
    status,
    timestamp: new Date().toISOString(),
    details: {
      seconds: Math.round(uptimeSeconds),
      formatted: formatUptime(uptimeSeconds),
    },
  }
}

// Basic process health check (lightweight for liveness probe)
const checkProcess = (): HealthCheck => {
  const status: HealthStatus = process.uptime() > 0 ? 'healthy' : 'unhealthy'

  return {
    name: 'process',
    status,
    timestamp: new Date().toISOString(),
    details: {
      pid: process.pid,
      uptime: Math.round(process.uptime()),
    },
  }
}

// Database health check
const checkDatabase = async (): Promise<HealthCheck> => {
  try {
    const dbHealth = await getDatabaseHealth()

    return {
      name: 'database',
      status: dbHealth.status,
      timestamp: new Date().toISOString(),
      details: {
        connected: dbHealth.connected,
        version: dbHealth.version,
        errorMessage: dbHealth.errorMessage,
      },
    }
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      details: {
        connected: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown database error',
      },
    }
  }
}

// Format uptime in human-readable format
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}

// Determine overall health status based on individual checks
const determineOverallStatus = (checks: HealthCheck[]): HealthStatus => {
  const hasUnhealthy = checks.some(check => check.status === 'unhealthy')
  const hasDegraded = checks.some(check => check.status === 'degraded')

  if (hasUnhealthy) return 'unhealthy'
  if (hasDegraded) return 'degraded'
  return 'healthy'
}

// Get checks based on health check level
const getChecksForLevel = async (level: HealthCheckLevel): Promise<HealthCheck[]> => {
  switch (level) {
    case 'basic':
      // Basic health check - minimal information for /healthz
      return [checkProcess(), checkMemory()]

    case 'liveness':
      // Liveness probe - ONLY process check (Kubernetes best practice)
      // This should be extremely lightweight and never fail unless the process is truly dead
      return [checkProcess()]

    case 'readiness':
      // Readiness probe - focus on external dependencies (Kubernetes best practice)
      // This determines if the app can serve traffic (database, external services)
      return [await checkDatabase(), checkMemory()]

    case 'comprehensive':
    default:
      // Full health check with all available checks for monitoring dashboards
      return [checkApplication(), checkMemory(), checkUptime(), await checkDatabase()]
  }
}

// Main health check service function with configurable level
export const getHealthStatus = async (
  level: HealthCheckLevel = 'comprehensive',
): Promise<HealthResponse> => {
  if (!healthConfig.enabled) {
    throw new Error('Health checks are disabled')
  }

  // Run health checks based on the specified level
  const checks = await getChecksForLevel(level)
  const overallStatus = determineOverallStatus(checks)

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
  }
}

// Specific functions for different endpoint types
export const getLivenessStatus = async (): Promise<HealthResponse> => {
  return getHealthStatus('liveness')
}

export const getReadinessStatus = async (): Promise<HealthResponse> => {
  return getHealthStatus('readiness')
}

export const getBasicHealthStatus = async (): Promise<HealthResponse> => {
  return getHealthStatus('basic')
}
