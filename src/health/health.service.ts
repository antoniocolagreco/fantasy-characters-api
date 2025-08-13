/**
 * Health check service
 * Provides health status information about the application
 */

import { healthConfig } from '../config/environment.js'
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

  // Consider memory unhealthy if utilization > 90%
  const status: HealthStatus = memoryUtilization > 90 ? 'unhealthy' : 'healthy'

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

// Main health check service function
export const getHealthStatus = async (): Promise<HealthResponse> => {
  if (!healthConfig.enabled) {
    throw new Error('Health checks are disabled')
  }

  // Run all health checks
  const checks: HealthCheck[] = [
    checkApplication(),
    checkMemory(),
    checkUptime(),
    await checkDatabase(), // This is async for future database checks
  ]

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
