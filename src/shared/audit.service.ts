/**
 * Audit Logging Service
 * Comprehensive security event logging for compliance and monitoring
 */

import type { FastifyBaseLogger } from 'fastify'
import type { AuthUser } from '../auth/auth.types'
import { environment } from './config'

// Audit event types for comprehensive security monitoring
export type AuditEventType =
  // Authentication Events
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.token.refresh'
  | 'auth.token.revoke'
  | 'auth.password.change'
  | 'auth.session.expired'

  // Authorization Events
  | 'authz.access.granted'
  | 'authz.access.denied'
  | 'authz.permission.escalation'
  | 'authz.role.change'

  // Data Access Events
  | 'data.read'
  | 'data.create'
  | 'data.update'
  | 'data.delete'
  | 'data.export'
  | 'data.import'

  // Administrative Events
  | 'admin.user.create'
  | 'admin.user.update'
  | 'admin.user.delete'
  | 'admin.user.ban'
  | 'admin.user.unban'
  | 'admin.role.assign'
  | 'admin.role.revoke'

  // Security Events
  | 'security.rate_limit.exceeded'
  | 'security.suspicious.activity'
  | 'security.validation.failure'
  | 'security.cors.violation'
  | 'security.injection.attempt'

  // System Events
  | 'system.startup'
  | 'system.shutdown'
  | 'system.error'
  | 'system.configuration.change'

// Audit event severity levels
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical'

// Audit event structure
export type AuditEvent = {
  // Event identification
  eventType: AuditEventType
  severity: AuditSeverity
  timestamp: string
  requestId?: string

  // User context
  userId?: string
  userEmail?: string
  userRole?: string
  sessionId?: string

  // Request context
  ipAddress?: string
  userAgent?: string
  method?: string
  path?: string

  // Resource context
  resourceType?: string
  resourceId?: string
  resourceOwner?: string

  // Event details
  action: string
  result: 'success' | 'failure' | 'error'
  message: string
  details?: Record<string, unknown>

  // Security context
  threat?: {
    type: string
    confidence: number
    indicators: string[]
  }

  // Compliance context
  regulation?: string[]
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted'
}

// Audit service implementation
export type AuditService = {
  logEvent: (event: Omit<AuditEvent, 'timestamp'>) => void
  logAuthentication: (params: AuthenticationAuditParams) => void
  logAuthorization: (params: AuthorizationAuditParams) => void
  logDataAccess: (params: DataAccessAuditParams) => void
  logAdministrative: (params: AdministrativeAuditParams) => void
  logSecurity: (params: SecurityAuditParams) => void
  logSystem: (params: SystemAuditParams) => void
}

// Parameter types for specific audit categories
export type AuthenticationAuditParams = {
  eventType: Extract<AuditEventType, `auth.${string}`>
  user?: AuthUser
  ipAddress?: string
  userAgent?: string
  requestId?: string
  result: 'success' | 'failure'
  message: string
  details?: Record<string, unknown>
}

export type AuthorizationAuditParams = {
  eventType: Extract<AuditEventType, `authz.${string}`>
  user?: AuthUser
  requestId?: string
  resourceType?: string
  resourceId?: string
  requiredPermission?: string
  result: 'success' | 'failure'
  message: string
  details?: Record<string, unknown>
}

export type DataAccessAuditParams = {
  eventType: Extract<AuditEventType, `data.${string}`>
  user?: AuthUser
  requestId?: string
  resourceType: string
  resourceId?: string
  method?: string
  path?: string
  result: 'success' | 'failure' | 'error'
  message: string
  dataClassification?: AuditEvent['dataClassification']
  details?: Record<string, unknown>
}

export type AdministrativeAuditParams = {
  eventType: Extract<AuditEventType, `admin.${string}`>
  user: AuthUser
  requestId?: string
  targetUserId?: string
  targetUserEmail?: string
  action: string
  result: 'success' | 'failure' | 'error'
  message: string
  details?: Record<string, unknown>
}

export type SecurityAuditParams = {
  eventType: Extract<AuditEventType, `security.${string}`>
  user?: AuthUser
  ipAddress?: string
  userAgent?: string
  requestId?: string
  threatType?: string
  severity: AuditSeverity
  message: string
  details?: Record<string, unknown>
}

export type SystemAuditParams = {
  eventType: Extract<AuditEventType, `system.${string}`>
  severity: AuditSeverity
  message: string
  details?: Record<string, unknown>
}

// Create audit service factory
export const createAuditService = (logger: FastifyBaseLogger): AuditService => {
  // Core event logging function
  const logEvent = (event: Omit<AuditEvent, 'timestamp'>): void => {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    }

    // Log at appropriate level based on severity
    switch (event.severity) {
      case 'critical':
        logger.fatal({ audit: auditEvent }, `AUDIT: ${event.message}`)
        break
      case 'high':
        logger.error({ audit: auditEvent }, `AUDIT: ${event.message}`)
        break
      case 'medium':
        logger.warn({ audit: auditEvent }, `AUDIT: ${event.message}`)
        break
      case 'low':
      default:
        logger.info({ audit: auditEvent }, `AUDIT: ${event.message}`)
        break
    }

    // In production, you might also want to send to external audit systems
    if (environment.NODE_ENV === 'production') {
      // Production audit system integration examples:
      // 1. ELK Stack: Use Elasticsearch client to send structured audit logs
      // 2. Splunk: Use Splunk HTTP Event Collector for security monitoring
      // 3. AWS CloudWatch: Use AWS SDK to send custom metrics and logs
      // 4. Syslog: Use syslog protocol for centralized log management
      // 5. SIEM Systems: Integration with security information and event management
      //
      // Example implementation patterns:
      // - Use async queues to avoid blocking main thread
      // - Implement retry logic for failed audit log sends
      // - Consider batching audit events for performance
      // - Ensure sensitive data is properly masked/encrypted
      //
      // Recommended approach: Create separate audit transport modules
      // based on your infrastructure requirements
    }
  }

  // Authentication events
  const logAuthentication = (params: AuthenticationAuditParams): void => {
    const severity: AuditSeverity = params.result === 'failure' ? 'medium' : 'low'

    logEvent({
      eventType: params.eventType,
      severity,
      ...(params.requestId && { requestId: params.requestId }),
      ...(params.user?.id && { userId: params.user.id }),
      ...(params.user?.email && { userEmail: params.user.email }),
      ...(params.user?.role && { userRole: params.user.role }),
      ...(params.ipAddress && { ipAddress: params.ipAddress }),
      ...(params.userAgent && { userAgent: params.userAgent }),
      action: `Authentication: ${params.eventType.split('.').pop()}`,
      result: params.result,
      message: params.message,
      ...(params.details && { details: params.details }),
    })
  }

  // Authorization events
  const logAuthorization = (params: AuthorizationAuditParams): void => {
    const severity: AuditSeverity = params.result === 'failure' ? 'high' : 'low'

    logEvent({
      eventType: params.eventType,
      severity,
      ...(params.requestId && { requestId: params.requestId }),
      ...(params.user?.id && { userId: params.user.id }),
      ...(params.user?.email && { userEmail: params.user.email }),
      ...(params.user?.role && { userRole: params.user.role }),
      ...(params.resourceType && { resourceType: params.resourceType }),
      ...(params.resourceId && { resourceId: params.resourceId }),
      action: `Authorization: ${params.requiredPermission || 'access check'}`,
      result: params.result,
      message: params.message,
      details: {
        ...params.details,
        ...(params.requiredPermission && { requiredPermission: params.requiredPermission }),
      },
    })
  }

  // Data access events
  const logDataAccess = (params: DataAccessAuditParams): void => {
    const severity: AuditSeverity =
      params.dataClassification === 'restricted' || params.dataClassification === 'confidential'
        ? 'medium'
        : 'low'

    logEvent({
      eventType: params.eventType,
      severity,
      ...(params.requestId && { requestId: params.requestId }),
      ...(params.user?.id && { userId: params.user.id }),
      ...(params.user?.email && { userEmail: params.user.email }),
      ...(params.user?.role && { userRole: params.user.role }),
      ...(params.method && { method: params.method }),
      ...(params.path && { path: params.path }),
      resourceType: params.resourceType,
      ...(params.resourceId && { resourceId: params.resourceId }),
      action: `Data access: ${params.eventType.split('.').pop()}`,
      result: params.result,
      message: params.message,
      ...(params.dataClassification && { dataClassification: params.dataClassification }),
      ...(params.details && { details: params.details }),
    })
  }

  // Administrative events
  const logAdministrative = (params: AdministrativeAuditParams): void => {
    logEvent({
      eventType: params.eventType,
      severity: 'high', // Admin actions are always high severity
      ...(params.requestId && { requestId: params.requestId }),
      userId: params.user.id,
      userEmail: params.user.email,
      userRole: params.user.role,
      action: `Administrative: ${params.action}`,
      result: params.result,
      message: params.message,
      details: {
        ...params.details,
        ...(params.targetUserId && { targetUserId: params.targetUserId }),
        ...(params.targetUserEmail && { targetUserEmail: params.targetUserEmail }),
      },
    })
  }

  // Security events
  const logSecurity = (params: SecurityAuditParams): void => {
    logEvent({
      eventType: params.eventType,
      severity: params.severity,
      ...(params.requestId && { requestId: params.requestId }),
      ...(params.user?.id && { userId: params.user.id }),
      ...(params.user?.email && { userEmail: params.user.email }),
      ...(params.user?.role && { userRole: params.user.role }),
      ...(params.ipAddress && { ipAddress: params.ipAddress }),
      ...(params.userAgent && { userAgent: params.userAgent }),
      action: `Security event: ${params.eventType.split('.').pop()}`,
      result: 'failure', // Security events are typically failures/threats
      message: params.message,
      ...(params.threatType && {
        threat: {
          type: params.threatType,
          confidence: 0.8, // Default confidence level
          indicators: [params.eventType],
        },
      }),
      ...(params.details && { details: params.details }),
    })
  }

  // System events
  const logSystem = (params: SystemAuditParams): void => {
    logEvent({
      eventType: params.eventType,
      severity: params.severity,
      action: `System event: ${params.eventType.split('.').pop()}`,
      result: 'success',
      message: params.message,
      ...(params.details && { details: params.details }),
    })
  }

  return {
    logEvent,
    logAuthentication,
    logAuthorization,
    logDataAccess,
    logAdministrative,
    logSecurity,
    logSystem,
  }
}

// Export singleton instance (to be initialized in app.ts)
let auditServiceInstance: AuditService | null = null

export const initializeAuditService = (logger: FastifyBaseLogger): void => {
  auditServiceInstance = createAuditService(logger)
}

export const getAuditService = (): AuditService => {
  if (!auditServiceInstance) {
    throw new Error('Audit service not initialized. Call initializeAuditService first.')
  }
  return auditServiceInstance
}
