// Health check specific TypeScript type definitions
export type HealthStatus = {
  status: 'ok' | 'error'
  timestamp: string
  uptime: number
}

export type DatabaseHealthStatus = {
  status: 'connected' | 'disconnected' | 'error'
  responseTime?: number
}

export type ReadinessCheck = {
  status: 'ready' | 'not_ready'
  checks: {
    database: DatabaseHealthStatus
  }
}

export type LivenessCheck = {
  status: 'alive' | 'dead'
  checks: {
    process: boolean
    memory: boolean
  }
}
