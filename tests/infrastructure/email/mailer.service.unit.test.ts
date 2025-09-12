import { afterEach, describe, expect, it, vi } from 'vitest'

describe('Mailer Service', () => {
    const originalEnv = { ...process.env }

    afterEach(() => {
        // Restore environment and mocks
        process.env = { ...originalEnv }
        vi.resetModules()
        vi.unstubAllEnvs()
        vi.clearAllMocks()
    })

    it('no-ops when SMTP is not configured', async () => {
        delete process.env.SMTP_HOST
        delete process.env.SMTP_USER
        delete process.env.SMTP_PASS

        const { mailer } = await import('@/infrastructure/email/mailer.service')
        await expect(
            mailer.send({ to: 't@example.com', subject: 'x', html: '<b>x</b>' })
        ).resolves.toBeUndefined()
    })

    it('sends email when SMTP is configured', async () => {
        process.env.SMTP_HOST = 'smtp.test.local'
        process.env.SMTP_USER = 'user'
        process.env.SMTP_PASS = 'pass'
        process.env.SMTP_PORT = '587'
        process.env.SMTP_SECURE = 'false'
        process.env.EMAIL_FROM = 'no-reply@test.local'

        const sendMail = vi.fn().mockResolvedValue(undefined)
        // Inject test transport via global hook
        ;(globalThis as unknown as { __TEST_MAIL_TRANSPORT__?: unknown }).__TEST_MAIL_TRANSPORT__ =
            { sendMail }

        const { mailer: mailSvc } = await import('@/infrastructure/email/mailer.service')
        await expect(
            mailSvc.send({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' })
        ).resolves.toBeUndefined()

        expect(sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                from: 'no-reply@test.local',
                to: 'user@example.com',
                subject: 'Hello',
            })
        )
    })

    it('gracefully no-ops when nodemailer module is missing', async () => {
        // Ensure no test transport injected so dynamic import path is exercised
        ;(globalThis as unknown as { __TEST_MAIL_TRANSPORT__?: unknown }).__TEST_MAIL_TRANSPORT__ =
            undefined

        // Configure SMTP so hasSmtpConfig() is true
        process.env.SMTP_HOST = 'smtp.test.local'
        process.env.SMTP_USER = 'user'
        process.env.SMTP_PASS = 'pass'
        process.env.SMTP_PORT = '2525'
        process.env.SMTP_SECURE = 'false'
        process.env.EMAIL_FROM = 'from@test.local'

        // Do not mock nodemailer. Dynamic import should fail and return null transporter
        const { mailer: dynMailer } = await import('@/infrastructure/email/mailer.service')

        await expect(
            dynMailer.send({
                to: 'dyn@example.com',
                subject: 'Dyn',
                html: '<b>dyn</b>',
            })
        ).resolves.toBeUndefined()
    })

    it('maps SMTP env to transport options via __TEST_MAIL_CREATE__ hook', async () => {
        ;(globalThis as unknown as { __TEST_MAIL_TRANSPORT__?: unknown }).__TEST_MAIL_TRANSPORT__ =
            undefined

        process.env.SMTP_HOST = 'smtp.test.local'
        process.env.SMTP_USER = 'u1'
        process.env.SMTP_PASS = 'p1'
        process.env.SMTP_PORT = '2525'
        process.env.SMTP_SECURE = 'true'
        process.env.SMTP_IGNORE_TLS = 'true'
        process.env.EMAIL_FROM = 'sender@test.local'

        const sendMail = vi.fn().mockResolvedValue(undefined)
        const hook = vi.fn((_o: unknown) => ({ sendMail }))
        ;(globalThis as unknown as { __TEST_MAIL_CREATE__?: unknown }).__TEST_MAIL_CREATE__ = hook

        vi.resetModules()
        const { mailer: dynMailer } = await import('@/infrastructure/email/mailer.service')

        await expect(
            dynMailer.send({ to: 'r@example.com', subject: 'S', html: '<b>s</b>' })
        ).resolves.toBeUndefined()

        expect(hook).toHaveBeenCalledTimes(1)
        const passed = hook.mock.calls[0]?.[0] as Record<string, unknown>
        expect(passed).toMatchObject({
            host: 'smtp.test.local',
            port: 2525,
            secure: true,
            ignoreTLS: true,
        })
        expect(passed.auth).toMatchObject({ user: 'u1', pass: 'p1' })
        expect(sendMail).toHaveBeenCalledWith(
            expect.objectContaining({ from: 'sender@test.local', to: 'r@example.com' })
        )
    })
})
