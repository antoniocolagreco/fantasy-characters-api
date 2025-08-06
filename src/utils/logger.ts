/**
 * Logging Utilities for Fantasy Character API
 *
 * This module provides enhanced logging functionality with structured logging,
 * request tracking, and performance monitoring.
 */

import { FastifyRequest } from 'fastify'

/**
 * Log levels for structured logging
 */
export enum LogLevel {
    TRACE = 'trace',
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal'
}

/**
 * Request context for logging
 */
export type RequestContext = {
    requestId: string
    method: string
    url: string
    userAgent?: string
    ip?: string
    userId?: string
    startTime: number
}

/**
 * Performance metrics type
 */
export type PerformanceMetrics = {
    duration: number
    memoryUsage: {
        rss: number
        heapTotal: number
        heapUsed: number
        external: number
        arrayBuffers?: number
    }
    cpuUsage?: {
        user: number
        system: number
    }
}

/**
 * Enhanced error logging type
 */
export type ErrorLogData = {
    error: {
        name: string
        message: string
        stack?: string
        code?: string
    }
    context?: RequestContext
    additional?: Record<string, unknown>
}

/**
 * Create request context from Fastify request
 */
export function createRequestContext(request: FastifyRequest): RequestContext {
    const userFromRequest = (request as unknown as { user?: { id?: string } }).user
    const userAgent = request.headers['user-agent']
    const result: RequestContext = {
        requestId: request.id,
        method: request.method,
        url: request.url,
        ip: request.ip,
        startTime: Date.now()
    }

    if (userAgent) {
        result.userAgent = userAgent
    }

    if (userFromRequest?.id) {
        result.userId = userFromRequest.id
    }

    return result
}

/**
 * Calculate request duration and performance metrics
 */
export function calculatePerformanceMetrics(startTime: number): PerformanceMetrics {
    const duration = Date.now() - startTime
    const memoryUsage = process.memoryUsage()

    return {
        duration,
        memoryUsage: {
            ...memoryUsage,
            // Convert bytes to MB for readability
            rss: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
            heapTotal: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
            heapUsed: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
            external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100
        }
    }
}

/**
 * Create structured log data for errors
 */
export function createErrorLogData(
    error: Error,
    context?: RequestContext,
    additional?: Record<string, unknown>
): ErrorLogData {
    const errorInfo: ErrorLogData['error'] = {
        name: error.name,
        message: error.message
    }

    if (error.stack) {
        errorInfo.stack = error.stack
    }

    const errorWithCode = error as Error & { code?: string }
    if (errorWithCode.code) {
        errorInfo.code = errorWithCode.code
    }

    const result: ErrorLogData = {
        error: errorInfo
    }

    if (context) {
        result.context = context
    }

    if (additional) {
        result.additional = additional
    }

    return result
}

/**
 * Create structured log data for requests
 */
export function createRequestLogData(context: RequestContext, statusCode?: number, responseSize?: number) {
    const metrics = calculatePerformanceMetrics(context.startTime)

    return {
        request: {
            id: context.requestId,
            method: context.method,
            url: context.url,
            userAgent: context.userAgent,
            ip: context.ip,
            userId: context.userId
        },
        response: {
            statusCode,
            responseSize,
            duration: metrics.duration
        },
        performance: {
            memoryUsage: metrics.memoryUsage
        }
    }
}

/**
 * Sanitize sensitive data from log output
 */
export function sanitizeLogData<T extends Record<string, unknown>>(data: T): T {
    const sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'session']
    const sanitized = { ...data }

    function sanitizeRecursive(obj: unknown): unknown {
        if (typeof obj !== 'object' || obj === null) {
            return obj
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitizeRecursive)
        }

        const result: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            const lowerKey = key.toLowerCase()
            if (sensitiveFields.some((field) => lowerKey.includes(field))) {
                result[key] = '[REDACTED]'
            } else if (typeof value === 'object' && value !== null) {
                result[key] = sanitizeRecursive(value)
            } else {
                result[key] = value
            }
        }
        return result
    }

    return sanitizeRecursive(sanitized) as T
}

/**
 * Format log message with context
 */
export function formatLogMessage(level: LogLevel, message: string, data?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString()
    const logData = data ? sanitizeLogData(data) : {}

    return JSON.stringify({
        timestamp,
        level,
        message,
        ...logData
    })
}
