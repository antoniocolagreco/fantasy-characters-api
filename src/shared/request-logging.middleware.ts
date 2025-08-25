/**
 * Request/Response Logging Middleware
 * TASK-18.5: Smart request/response logging for debugging
 * - Zero logging in test environment
 * - Minimal logging in production
 * - Detailed logging in development
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { environment } from './config'

// Paths to exclude from logging (health checks, metrics, static assets)
const EXCLUDED_PATHS = [
  '/api/health',
  '/api/healthz',
  '/api/ready',
  '/api/live',
  '/metrics',
  '/favicon.ico',
  '/docs',
  '/docs/',
]

// Headers to exclude from logging (security sensitive)
const EXCLUDED_HEADERS = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token']

/**
 * Check if request should be logged based on path and environment
 */
const shouldLogRequest = (url: string): boolean => {
  // Never log in test environment
  if (environment.NODE_ENV === 'test') {
    return false
  }

  // Skip excluded paths (health checks, etc.)
  return !EXCLUDED_PATHS.some(path => url.startsWith(path))
}

/**
 * Sanitize headers by removing sensitive information
 */
const sanitizeHeaders = (headers: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()
    if (EXCLUDED_HEADERS.includes(lowerKey)) {
      sanitized[key] = '[REDACTED]'
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Get log level based on environment and status code
 */
const getLogLevel = (statusCode: number): 'info' | 'warn' | 'error' => {
  if (statusCode >= 500) return 'error'
  if (statusCode >= 400) return 'warn'
  return 'info'
}

/**
 * Get request logging data based on environment
 */
const getRequestLogData = (request: FastifyRequest) => {
  const baseData = {
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  }

  // Production: minimal logging
  if (environment.NODE_ENV === 'production') {
    return {
      ...baseData,
      userId: (request.user as { id?: string })?.id,
    }
  }

  // Development: detailed logging
  return {
    ...baseData,
    headers: sanitizeHeaders(request.headers),
    query: request.query,
    params: request.params,
    userId: (request.user as { id?: string })?.id,
    requestId: request.id,
  }
}

/**
 * Get response logging data based on environment
 */
const getResponseLogData = (request: FastifyRequest, reply: FastifyReply) => {
  const baseData = {
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
  }

  // Production: minimal logging
  if (environment.NODE_ENV === 'production') {
    return {
      ...baseData,
      userId: (request.user as { id?: string })?.id,
    }
  }

  // Development: detailed logging
  return {
    ...baseData,
    headers: sanitizeHeaders(reply.getHeaders()),
    userId: (request.user as { id?: string })?.id,
    requestId: request.id,
  }
}

/**
 * Register request/response logging hooks
 */
export const registerRequestLogging = (fastify: FastifyInstance): void => {
  // Request logging hook
  fastify.addHook('onRequest', async request => {
    if (!shouldLogRequest(request.url)) {
      return
    }

    const logData = getRequestLogData(request)
    request.log.info(logData, 'Incoming request')
  })

  // Response logging hook
  fastify.addHook('onResponse', async (request, reply) => {
    if (!shouldLogRequest(request.url)) {
      return
    }

    const logData = getResponseLogData(request, reply)
    const logLevel = getLogLevel(reply.statusCode)

    request.log[logLevel](logData, 'Request completed')
  })

  // Error logging hook (always log errors except in test)
  fastify.addHook('onError', async (request, reply, error) => {
    if (environment.NODE_ENV === 'test') {
      return
    }

    const errorData = {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      error: {
        name: error.name,
        message: error.message,
        ...(environment.NODE_ENV !== 'production' && { stack: error.stack }),
      },
      userId: (request.user as { id?: string })?.id,
      requestId: request.id,
      ip: request.ip,
    }

    request.log.error(errorData, 'Request error occurred')
  })

  // Log successful registration
  if (environment.NODE_ENV !== 'test') {
    fastify.log.info(
      {
        environment: environment.NODE_ENV,
        excludedPaths: EXCLUDED_PATHS,
        loggingLevel: environment.NODE_ENV === 'production' ? 'minimal' : 'detailed',
      },
      'Request/Response logging middleware registered',
    )
  }
}

/**
 * Utility to check if logging is enabled for current environment
 */
export const isLoggingEnabled = (): boolean => {
  return environment.NODE_ENV !== 'test'
}

/**
 * Utility to get current logging configuration
 */
export const getLoggingConfig = () => {
  return {
    enabled: isLoggingEnabled(),
    environment: environment.NODE_ENV,
    level: environment.NODE_ENV === 'production' ? 'minimal' : 'detailed',
    excludedPaths: EXCLUDED_PATHS,
    excludedHeaders: EXCLUDED_HEADERS,
  }
}
