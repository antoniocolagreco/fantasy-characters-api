/**
 * Health check service
 * Provides health status information about the application with security considerations
 */

import { CacheConfig } from '../shared/cache.middleware'
import { healthConfig } from '../shared/config'
import { getDatabaseHealth } from '../shared/prisma.service'
import { HealthCheck, HealthCheckLevel, HealthResponse, HealthStatus } from './health.types'

// Individual health check functions
const checkApplication = (includeDetails: boolean): HealthCheck => {
  const name = 'application'
  const timestamp = new Date().toISOString()

  if (!includeDetails) {
    return { name, status: 'healthy', timestamp }
  }

  const details = {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    uptime: process.uptime(),
    pid: process.pid,
  }

  const result = {
    name,
    status: 'healthy' as const,
    timestamp,
    details,
  }

  return result
}

const checkMemory = (includeDetails = false): HealthCheck => {
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

  const base = {
    name: 'memory',
    status,
    timestamp: new Date().toISOString(),
  }

  if (includeDetails) {
    return {
      ...base,
      details: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        free: Math.round(freeMemory / 1024 / 1024), // MB
        utilization: Math.round(memoryUtilization * 100) / 100, // percentage
      },
    }
  }

  return base
}

const checkUptime = (includeDetails = false): HealthCheck => {
  const uptimeSeconds = process.uptime()
  const status: HealthStatus = uptimeSeconds > 0 ? 'healthy' : 'unhealthy'

  const base = {
    name: 'uptime',
    status,
    timestamp: new Date().toISOString(),
  }

  if (includeDetails) {
    return {
      ...base,
      details: {
        seconds: Math.round(uptimeSeconds),
        formatted: formatUptime(uptimeSeconds),
      },
    }
  }

  return base
}

// Basic process health check (lightweight for liveness probe)
const checkProcess = (includeDetails = false): HealthCheck => {
  const status: HealthStatus = process.uptime() > 0 ? 'healthy' : 'unhealthy'

  const base = {
    name: 'process',
    status,
    timestamp: new Date().toISOString(),
  }

  if (includeDetails) {
    return {
      ...base,
      details: {
        pid: process.pid,
        uptime: Math.round(process.uptime()),
      },
    }
  }

  return base
}

// Database health check
const checkDatabase = async (includeDetails = false): Promise<HealthCheck> => {
  try {
    const dbHealth = await getDatabaseHealth()

    const base = {
      name: 'database',
      status: dbHealth.status,
      timestamp: new Date().toISOString(),
    }

    if (includeDetails) {
      return {
        ...base,
        details: {
          connected: dbHealth.connected,
          version: dbHealth.version,
          errorMessage: dbHealth.errorMessage,
        },
      }
    }

    return base
  } catch (error) {
    const base = {
      name: 'database',
      status: 'unhealthy' as const,
      timestamp: new Date().toISOString(),
    }

    if (includeDetails) {
      return {
        ...base,
        details: {
          connected: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown database error',
        },
      }
    }

    return base
  }
}

// Cache health check
const checkCache = (includeDetails = false): HealthCheck => {
  try {
    const cacheStats = CacheConfig.getStats()

    // Determine cache health based on hit rate and status
    let status: HealthStatus = 'healthy'

    if (!cacheStats.enabled) {
      status = 'degraded' // Cache disabled is degraded performance
    } else if (cacheStats.hitRate < 20) {
      status = 'degraded' // Very low hit rate indicates poor cache performance
    } else if (cacheStats.size >= cacheStats.maxEntries * 0.9) {
      status = 'degraded' // Cache near capacity
    }

    const base = {
      name: 'cache',
      status,
      timestamp: new Date().toISOString(),
    }

    if (includeDetails) {
      return {
        ...base,
        details: {
          enabled: cacheStats.enabled,
          hitRate: cacheStats.hitRate,
          size: cacheStats.size,
          maxEntries: cacheStats.maxEntries,
          utilization: Math.round((cacheStats.size / cacheStats.maxEntries) * 10000) / 100, // percentage
        },
      }
    }

    return base
  } catch (error) {
    const base = {
      name: 'cache',
      status: 'unhealthy' as const,
      timestamp: new Date().toISOString(),
    }

    if (includeDetails) {
      return {
        ...base,
        details: {
          enabled: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown cache error',
        },
      }
    }

    return base
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
    case 'public':
      // Public health check - minimal information for external consumption
      // Only status, no sensitive details
      return [checkProcess(), checkMemory()]

    case 'basic':
      // Basic health check - minimal information for /healthz
      return [checkProcess(), checkMemory(), checkCache()]

    case 'liveness':
      // Liveness probe - ONLY process check (Kubernetes best practice)
      // This should be extremely lightweight and never fail unless the process is truly dead
      return [checkProcess(true)]

    case 'readiness':
      // Readiness probe - focus on external dependencies (Kubernetes best practice)
      // This determines if the app can serve traffic (database, external services)
      return [await checkDatabase(), checkMemory(), checkCache()]

    case 'detailed':
      // Internal health check with detailed information for monitoring dashboards
      // Includes sensitive system information for authenticated internal use
      return [
        checkApplication(true),
        checkMemory(true),
        checkUptime(true),
        await checkDatabase(true),
        checkCache(true),
      ]

    case 'comprehensive':
    default:
      // Full health check with all available checks for monitoring dashboards
      // Backward compatibility - same as internal but can be adjusted
      return [
        checkApplication(true),
        checkMemory(true),
        checkUptime(true),
        await checkDatabase(true),
        checkCache(true),
      ]
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

  // Return different information based on access level
  if (level === 'public') {
    // Public endpoint - minimal information
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
    }
  }

  if (level === 'basic' || level === 'liveness' || level === 'readiness') {
    // Kubernetes probes - basic information
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
    }
  }

  // Internal/comprehensive - full information
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

// New secure health status functions
export const getPublicHealthStatus = async (): Promise<HealthResponse> => {
  return getHealthStatus('public')
}

export const getInternalHealthStatus = async (): Promise<HealthResponse> => {
  return getHealthStatus('detailed')
}
