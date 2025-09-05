import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadConfig } from '../../src/infrastructure/config'

describe('Environment Configuration', () => {
    beforeEach(() => {
        // Clear any existing environment variables
        vi.unstubAllEnvs()
    })

    it('should load configuration with default values', () => {
        // Clear all environment variables to ensure clean state
        vi.unstubAllEnvs()

        // Set only what we want to test - override any .env values
        vi.stubEnv('NODE_ENV', 'test')
        vi.stubEnv('PORT', undefined)
        vi.stubEnv('LOG_LEVEL', undefined)
        vi.stubEnv('CORS_ORIGINS', undefined)
        vi.stubEnv('CORS_CREDENTIALS', undefined)
        vi.stubEnv('HOST', undefined)

        const config = loadConfig()

        expect(config.NODE_ENV).toBe('test')
        expect(config.PORT).toBe(3000) // default value
        expect(config.LOG_LEVEL).toBe('info') // default value
        expect(config.CORS_ORIGINS).toBe('http://localhost:3000') // default value
        expect(config.CORS_CREDENTIALS).toBe(true) // default value
        expect(config.HOST).toBe('0.0.0.0') // default value
    })

    it('should load configuration from environment variables', () => {
        vi.stubEnv('NODE_ENV', 'production')
        vi.stubEnv('PORT', '8080')
        vi.stubEnv('LOG_LEVEL', 'error')
        vi.stubEnv('CORS_ORIGINS', 'https://example.com')
        vi.stubEnv('CORS_CREDENTIALS', 'false')
        vi.stubEnv('HOST', 'localhost')

        const config = loadConfig()

        expect(config.NODE_ENV).toBe('production')
        expect(config.PORT).toBe(8080)
        expect(config.LOG_LEVEL).toBe('error')
        expect(config.CORS_ORIGINS).toBe('https://example.com')
        expect(config.CORS_CREDENTIALS).toBe(false)
        expect(config.HOST).toBe('localhost')
    })

    it('should handle boolean parsing correctly', () => {
        vi.stubEnv('NODE_ENV', 'test')
        vi.stubEnv('CORS_CREDENTIALS', 'true')
        vi.stubEnv('OAUTH_ENABLED', 'false')

        const config = loadConfig()

        expect(config.CORS_CREDENTIALS).toBe(true)
        expect(config.OAUTH_ENABLED).toBe(false)
    })

    it('should handle integer parsing correctly', () => {
        vi.stubEnv('NODE_ENV', 'test')
        vi.stubEnv('PORT', '9000')
        vi.stubEnv('RATE_LIMIT_MAX', '200')

        const config = loadConfig()

        expect(config.PORT).toBe(9000)
        expect(config.RATE_LIMIT_MAX).toBe(200)
    })
})
