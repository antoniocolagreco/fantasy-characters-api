import { describe, expect, it, vi } from 'vitest'

// We stub required env vars BEFORE importing the app module because it loads config at import time
vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('PORT', '4010')
vi.stubEnv('HOST', '127.0.0.1')
vi.stubEnv('LOG_LEVEL', 'silent')
vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db')
vi.stubEnv('JWT_SECRET', 'test-secret-key-with-minimum-32-characters!!')
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-with-min-32-chars!!')

// Dynamic import after env is set
const appModule = await import('@/app')

describe('Server start/stop', () => {
    it('starts the server and responds to /api/health, then stops cleanly', async () => {
        const app = await appModule.startServer()

        const res = await app.inject({ method: 'GET', url: '/api/health' })
        expect(res.statusCode).toBe(200)

        await appModule.stopServer(app)
    })

    it('handles close failure in stopServer and exits with code 1', async () => {
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)

        // Minimal Fastify-like stub for stopServer error branch
        const fakeApp: any = {
            close: vi.fn().mockRejectedValue(new Error('close failed')),
            log: { error: vi.fn(), info: vi.fn() },
        }

        await appModule.stopServer(fakeApp)
        expect(exitSpy).toHaveBeenCalledWith(1)

        exitSpy.mockRestore()
    })
})
