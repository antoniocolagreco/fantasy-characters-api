import { describe, it, expect, vi } from 'vitest'

// We must reset module cache to re-evaluate NODE_ENV branches

describe('infrastructure/logging/logger.service', () => {
    it('creates pretty logger in non-production', async () => {
        const prev = process.env.NODE_ENV
        process.env.NODE_ENV = 'test'
        vi.resetModules()
        const mod = await import('../../src/infrastructure/logging/logger.service')
        expect(mod.logger).toBeDefined()
        // pino logger has child() method
        expect(typeof (mod as any).logger.child).toBe('function')
        process.env.NODE_ENV = prev
    })

    it('creates base logger in production', async () => {
        const prev = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'
        vi.resetModules()
        const mod = await import('../../src/infrastructure/logging/logger.service')
        expect(mod.logger).toBeDefined()
        expect(typeof (mod as any).logger.child).toBe('function')
        process.env.NODE_ENV = prev
    })
})
