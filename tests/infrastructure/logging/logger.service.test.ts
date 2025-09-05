import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { logger } from '@/infrastructure/logging/logger.service'

describe('Logger Service', () => {
    let originalLogLevel: string | undefined

    beforeEach(() => {
        originalLogLevel = process.env.LOG_LEVEL
    })

    afterEach(() => {
        if (originalLogLevel !== undefined) {
            process.env.LOG_LEVEL = originalLogLevel
        } else {
            delete process.env.LOG_LEVEL
        }
        // Clear module cache to ensure fresh imports
        vi.resetModules()
    })

    test('should export logger instance', () => {
        expect(logger).toBeDefined()
        expect(typeof logger.info).toBe('function')
        expect(typeof logger.warn).toBe('function')
        expect(typeof logger.error).toBe('function')
        expect(typeof logger.debug).toBe('function')
    })

    test('should export logger as default', async () => {
        const { default: defaultLogger } = await import('@/infrastructure/logging/logger.service')
        expect(defaultLogger).toBeDefined()
        expect(typeof defaultLogger.info).toBe('function')
    })

    test('should have expected pino methods', () => {
        // Verify it has standard pino logger methods
        expect(typeof logger.fatal).toBe('function')
        expect(typeof logger.trace).toBe('function')
        expect(typeof logger.child).toBe('function')
    })

    test('should use default log level when LOG_LEVEL is not set', async () => {
        // Test il branch del ?? quando process.env.LOG_LEVEL è undefined
        delete process.env.LOG_LEVEL
        vi.resetModules()

        const { logger: freshLogger } = await import('@/infrastructure/logging/logger.service')
        expect(freshLogger.level).toBe('info')
    })

    test('should use custom log level when LOG_LEVEL is set', async () => {
        // Test il branch del ?? quando process.env.LOG_LEVEL ha un valore
        process.env.LOG_LEVEL = 'debug'
        vi.resetModules()

        const { logger: freshLogger } = await import('@/infrastructure/logging/logger.service')
        expect(freshLogger.level).toBe('debug')
    })
})
