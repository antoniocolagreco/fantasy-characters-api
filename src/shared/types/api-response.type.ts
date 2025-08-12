/**
 * Type for the health check API response.
 */
export type HealthCheckResponse = {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  system: {
    platform: string
    nodeVersion: string
    pid: number
  }
  database?: {
    status: 'healthy' | 'unhealthy'
    message: string
    migrations: {
      applied: boolean
      pending: number
    }
  }
}

/**
 * Type for the standard error response.
 */
export type ErrorResponse = {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
  path?: string
  requestId?: string
}

/**
 * Type for the standard success response.
 */
export type SuccessResponse<T> = {
  success: true
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  timestamp: string
  version?: string
  requestId?: string
}
