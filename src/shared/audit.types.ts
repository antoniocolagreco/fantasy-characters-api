/**
 * Audit system TypeScript type definitions
 * All audit-related types for security and compliance logging
 */

export type AuditEventType =
  // Authentication events
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.login.blocked'
  | 'auth.logout'
  | 'auth.register.success'
  | 'auth.register.failure'
  | 'auth.password.change.success'
  | 'auth.password.change.failure'
  | 'auth.password.reset.request'
  | 'auth.password.reset.success'
  | 'auth.password.reset.failure'
  | 'auth.token.refresh.success'
  | 'auth.token.refresh.failure'
  | 'auth.token.invalid'
  | 'auth.session.expired'
  | 'auth.account.locked'
  | 'auth.account.unlocked'

  // Authorization events
  | 'authz.access.granted'
  | 'authz.access.denied'
  | 'authz.permission.granted'
  | 'authz.permission.denied'
  | 'authz.role.assigned'
  | 'authz.role.removed'
  | 'authz.privilege.escalation.attempt'
  | 'authz.unauthorized.access.attempt'

  // Data access events
  | 'data.read'
  | 'data.create'
  | 'data.update'
  | 'data.delete'
  | 'data.export'
  | 'data.import'
  | 'data.backup'
  | 'data.restore'
  | 'data.purge'
  | 'data.access.violation'

  // Administrative events
  | 'admin.user.create'
  | 'admin.user.update'
  | 'admin.user.delete'
  | 'admin.user.activate'
  | 'admin.user.deactivate'
  | 'admin.user.ban'
  | 'admin.user.unban'
  | 'admin.role.create'
  | 'admin.role.update'
  | 'admin.role.delete'
  | 'admin.permission.create'
  | 'admin.permission.update'
  | 'admin.permission.delete'
  | 'admin.system.configuration.change'

  // Security events
  | 'security.attack.detected'
  | 'security.vulnerability.discovered'
  | 'security.vulnerability.patched'
  | 'security.incident.reported'
  | 'security.incident.resolved'
  | 'security.breach.detected'
  | 'security.breach.contained'
  | 'security.malware.detected'
  | 'security.suspicious.activity'

  // System events
  | 'system.startup'
  | 'system.shutdown'
  | 'system.error'
  | 'system.performance.degradation'
  | 'system.resource.exhaustion'
  | 'system.backup.completed'
  | 'system.backup.failed'
  | 'system.maintenance.started'
  | 'system.maintenance.completed'

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AuditEvent = {
  id: string
  timestamp: Date
  eventType: AuditEventType
  severity: AuditSeverity
  actor: {
    userId?: string | null
    userEmail?: string | null
    userRole?: string | null
    ipAddress?: string | null
    userAgent?: string | null
    sessionId?: string | null
  }
  target: {
    resourceType?: string | null
    resourceId?: string | null
    resourceName?: string | null
    endpoint?: string | null
  }
  context: {
    method?: string | null
    statusCode?: number | null
    message: string
    details?: Record<string, unknown> | null
    errorCode?: string | null
    stackTrace?: string | null
  }
  metadata: {
    source: string
    environment: string
    version: string
    correlationId?: string | null
    parentEventId?: string | null
  }
}

export type AuditService = {
  logAuthentication: (params: AuthenticationAuditParams) => Promise<void>
  logAuthorization: (params: AuthorizationAuditParams) => Promise<void>
  logDataAccess: (params: DataAccessAuditParams) => Promise<void>
  logAdministrative: (params: AdministrativeAuditParams) => Promise<void>
  logSecurity: (params: SecurityAuditParams) => Promise<void>
  logSystem: (params: SystemAuditParams) => Promise<void>
  logError: (error: Error, context?: Record<string, unknown>) => Promise<void>
  logEvent: (event: Partial<AuditEvent>) => Promise<void>
  getAuditTrail: (filters?: AuditFilters) => Promise<AuditEvent[]>
}

export type AuthenticationAuditParams = {
  eventType: Extract<AuditEventType, `auth.${string}`>
  userId?: string | null
  userEmail?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  message: string
  success: boolean
  details?: Record<string, unknown>
}

export type AuthorizationAuditParams = {
  eventType: Extract<AuditEventType, `authz.${string}`>
  userId?: string | null
  userEmail?: string | null
  userRole?: string | null
  resourceType?: string | null
  resourceId?: string | null
  action: string
  granted: boolean
  message: string
  details?: Record<string, unknown>
}

export type DataAccessAuditParams = {
  eventType: Extract<AuditEventType, `data.${string}`>
  userId?: string | null
  userEmail?: string | null
  resourceType: string
  resourceId?: string | null
  resourceName?: string | null
  action: string
  message: string
  sensitive?: boolean
  details?: Record<string, unknown>
}

export type AdministrativeAuditParams = {
  eventType: Extract<AuditEventType, `admin.${string}`>
  adminUserId: string
  adminUserEmail: string
  targetUserId?: string | null
  targetUserEmail?: string | null
  action: string
  message: string
  changes?: Record<string, unknown>
  details?: Record<string, unknown>
}

export type SecurityAuditParams = {
  eventType: Extract<AuditEventType, `security.${string}`>
  severity: AuditSeverity
  source: string
  message: string
  ipAddress?: string | null
  userAgent?: string | null
  attackVector?: string | null
  details?: Record<string, unknown>
}

export type SystemAuditParams = {
  eventType: Extract<AuditEventType, `system.${string}`>
  severity: AuditSeverity
  component: string
  message: string
  errorCode?: string | null
  details?: Record<string, unknown>
}

export type AuditFilters = {
  eventType?: AuditEventType
  severity?: AuditSeverity
  userId?: string
  resourceType?: string
  resourceId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}
