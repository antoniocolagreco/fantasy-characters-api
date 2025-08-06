/**
 * Tests for Logger Utilities
 */

import {
    LogLevel,
    RequestContext,
    createRequestContext,
    calculatePerformanceMetrics,
    createErrorLogData,
    createRequestLogData,
    sanitizeLogData,
    formatLogMessage
} from '../src/utils/logger.js'
import { FastifyRequest } from 'fastify'

describe('Logger Utilities', () => {
    describe('LogLevel Enum', () => {
        it('should have all required log levels', () => {
            expect(LogLevel.TRACE).toBe('trace')
            expect(LogLevel.DEBUG).toBe('debug')
            expect(LogLevel.INFO).toBe('info')
            expect(LogLevel.WARN).toBe('warn')
            expect(LogLevel.ERROR).toBe('error')
            expect(LogLevel.FATAL).toBe('fatal')
        })
    })

    describe('createRequestContext', () => {
        it('should create request context from Fastify request', () => {
            const mockRequest = {
                id: 'req-123',
                method: 'GET',
                url: '/api/test',
                ip: '127.0.0.1',
                headers: {
                    'user-agent': 'test-agent'
                }
            } as FastifyRequest

            const context = createRequestContext(mockRequest)

            expect(context.requestId).toBe('req-123')
            expect(context.method).toBe('GET')
            expect(context.url).toBe('/api/test')
            expect(context.ip).toBe('127.0.0.1')
            expect(context.userAgent).toBe('test-agent')
            expect(context.startTime).toBeGreaterThan(0)
        })

        it('should handle request without user-agent', () => {
            const mockRequest = {
                id: 'req-123',
                method: 'GET',
                url: '/api/test',
                ip: '127.0.0.1',
                headers: {}
            } as FastifyRequest

            const context = createRequestContext(mockRequest)

            expect(context.userAgent).toBeUndefined()
        })

        it('should handle request with user', () => {
            const mockRequest = {
                id: 'req-123',
                method: 'GET',
                url: '/api/test',
                ip: '127.0.0.1',
                headers: {},
                user: { id: 'user-456' }
            } as unknown as FastifyRequest

            const context = createRequestContext(mockRequest)

            expect(context.userId).toBe('user-456')
        })

        it('should handle request without user', () => {
            const mockRequest = {
                id: 'req-123',
                method: 'GET',
                url: '/api/test',
                ip: '127.0.0.1',
                headers: {}
            } as FastifyRequest

            const context = createRequestContext(mockRequest)

            expect(context.userId).toBeUndefined()
        })
    })

    describe('calculatePerformanceMetrics', () => {
        it('should calculate performance metrics', () => {
            const startTime = Date.now() - 100 // 100ms ago
            const metrics = calculatePerformanceMetrics(startTime)

            expect(metrics.duration).toBeGreaterThanOrEqual(90)
            expect(metrics.duration).toBeLessThan(200)
            expect(metrics.memoryUsage).toBeDefined()
            expect(metrics.memoryUsage.rss).toBeGreaterThan(0)
            expect(metrics.memoryUsage.heapTotal).toBeGreaterThan(0)
            expect(metrics.memoryUsage.heapUsed).toBeGreaterThan(0)
            expect(metrics.memoryUsage.external).toBeGreaterThanOrEqual(0)
        })

        it('should convert memory usage to MB', () => {
            const metrics = calculatePerformanceMetrics(Date.now())

            // Memory values should be in MB (reasonable ranges)
            expect(metrics.memoryUsage.rss).toBeLessThan(1000) // Less than 1GB
            expect(metrics.memoryUsage.heapTotal).toBeLessThan(1000)
            expect(metrics.memoryUsage.heapUsed).toBeLessThan(1000)
        })
    })

    describe('createErrorLogData', () => {
        it('should create error log data', () => {
            const error = new Error('Test error')
            const context: RequestContext = {
                requestId: 'req-123',
                method: 'GET',
                url: '/api/test',
                ip: '127.0.0.1',
                startTime: Date.now()
            }
            const additional = { extra: 'data' }

            const logData = createErrorLogData(error, context, additional)

            expect(logData.error.name).toBe('Error')
            expect(logData.error.message).toBe('Test error')
            expect(logData.error.stack).toBeDefined()
            expect(logData.context).toEqual(context)
            expect(logData.additional).toEqual(additional)
        })

        it('should handle error without stack', () => {
            const error = new Error('Test error')
            delete error.stack

            const logData = createErrorLogData(error)

            expect(logData.error.name).toBe('Error')
            expect(logData.error.message).toBe('Test error')
            expect(logData.error.stack).toBeUndefined()
        })

        it('should handle error with code', () => {
            const error = new Error('Test error') as Error & { code: string }
            error.code = 'TEST_CODE'

            const logData = createErrorLogData(error)

            expect(logData.error.code).toBe('TEST_CODE')
        })

        it('should handle minimal parameters', () => {
            const error = new Error('Test error')

            const logData = createErrorLogData(error)

            expect(logData.error.name).toBe('Error')
            expect(logData.error.message).toBe('Test error')
            expect(logData.context).toBeUndefined()
            expect(logData.additional).toBeUndefined()
        })
    })

    describe('createRequestLogData', () => {
        it('should create request log data', () => {
            const context: RequestContext = {
                requestId: 'req-123',
                method: 'GET',
                url: '/api/test',
                ip: '127.0.0.1',
                userAgent: 'test-agent',
                userId: 'user-456',
                startTime: Date.now() - 50
            }

            const logData = createRequestLogData(context, 200, 1024)

            expect(logData.request.id).toBe('req-123')
            expect(logData.request.method).toBe('GET')
            expect(logData.request.url).toBe('/api/test')
            expect(logData.request.ip).toBe('127.0.0.1')
            expect(logData.request.userAgent).toBe('test-agent')
            expect(logData.request.userId).toBe('user-456')
            expect(logData.response.statusCode).toBe(200)
            expect(logData.response.responseSize).toBe(1024)
            expect(logData.response.duration).toBeGreaterThanOrEqual(40)
            expect(logData.performance.memoryUsage).toBeDefined()
        })

        it('should handle optional parameters', () => {
            const context: RequestContext = {
                requestId: 'req-123',
                method: 'GET',
                url: '/api/test',
                ip: '127.0.0.1',
                startTime: Date.now()
            }

            const logData = createRequestLogData(context)

            expect(logData.request.userAgent).toBeUndefined()
            expect(logData.request.userId).toBeUndefined()
            expect(logData.response.statusCode).toBeUndefined()
            expect(logData.response.responseSize).toBeUndefined()
        })
    })

    describe('sanitizeLogData', () => {
        it('should redact sensitive fields', () => {
            const data = {
                username: 'john',
                password: 'secret123',
                token: 'abc123',
                authorization: 'Bearer xyz',
                cookie: 'session=123',
                session: 'sess123',
                email: 'john@example.com'
            }

            const sanitized = sanitizeLogData(data)

            expect(sanitized.username).toBe('john')
            expect(sanitized.email).toBe('john@example.com')
            expect(sanitized.password).toBe('[REDACTED]')
            expect(sanitized.token).toBe('[REDACTED]')
            expect(sanitized.authorization).toBe('[REDACTED]')
            expect(sanitized.cookie).toBe('[REDACTED]')
            expect(sanitized.session).toBe('[REDACTED]')
        })

        it('should handle nested objects', () => {
            const data = {
                user: {
                    name: 'john',
                    password: 'secret123'
                },
                auth: {
                    token: 'abc123'
                }
            }

            const sanitized = sanitizeLogData(data)

            expect(sanitized.user.name).toBe('john')
            expect(sanitized.user.password).toBe('[REDACTED]')
            expect(sanitized.auth.token).toBe('[REDACTED]')
        })

        it('should handle arrays', () => {
            const data = {
                users: [
                    { name: 'john', password: 'secret' },
                    { name: 'jane', token: 'abc123' }
                ]
            }

            const sanitized = sanitizeLogData(data)

            expect(sanitized.users[0].name).toBe('john')
            expect(sanitized.users[0].password).toBe('[REDACTED]')
            expect(sanitized.users[1].name).toBe('jane')
            expect(sanitized.users[1].token).toBe('[REDACTED]')
        })

        it('should handle primitive values', () => {
            const data = {
                count: 5,
                active: true,
                description: 'test'
            }

            const sanitized = sanitizeLogData(data)

            expect(sanitized).toEqual(data)
        })

        it('should handle null and undefined values', () => {
            const data = {
                value: null,
                missing: undefined,
                password: 'secret'
            }

            const sanitized = sanitizeLogData(data)

            expect(sanitized.value).toBe(null)
            expect(sanitized.missing).toBeUndefined()
            expect(sanitized.password).toBe('[REDACTED]')
        })
    })

    describe('formatLogMessage', () => {
        it('should format log message with data', () => {
            const data = { user: 'john', action: 'login' }
            const message = formatLogMessage(LogLevel.INFO, 'User action', data)

            const parsed = JSON.parse(message)

            expect(parsed.level).toBe('info')
            expect(parsed.message).toBe('User action')
            expect(parsed.user).toBe('john')
            expect(parsed.action).toBe('login')
            expect(parsed.timestamp).toBeDefined()
            expect(new Date(parsed.timestamp)).toBeInstanceOf(Date)
        })

        it('should format log message without data', () => {
            const message = formatLogMessage(LogLevel.ERROR, 'Error occurred')

            const parsed = JSON.parse(message)

            expect(parsed.level).toBe('error')
            expect(parsed.message).toBe('Error occurred')
            expect(parsed.timestamp).toBeDefined()
        })

        it('should sanitize sensitive data', () => {
            const data = { user: 'john', password: 'secret123' }
            const message = formatLogMessage(LogLevel.DEBUG, 'Debug info', data)

            const parsed = JSON.parse(message)

            expect(parsed.user).toBe('john')
            expect(parsed.password).toBe('[REDACTED]')
        })

        it('should handle all log levels', () => {
            const levels = [
                LogLevel.TRACE,
                LogLevel.DEBUG,
                LogLevel.INFO,
                LogLevel.WARN,
                LogLevel.ERROR,
                LogLevel.FATAL
            ]

            levels.forEach((level) => {
                const message = formatLogMessage(level, 'Test message')
                const parsed = JSON.parse(message)
                expect(parsed.level).toBe(level)
            })
        })
    })
})
