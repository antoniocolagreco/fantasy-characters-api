type MailOptions = {
    to: string
    subject: string
    html: string
}

function hasSmtpConfig(): boolean {
    return !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS
}

type Transporter = {
    sendMail: (opts: {
        from: string
        to: string
        subject: string
        html: string
    }) => Promise<unknown>
}

type SmtpOptions = {
    host: string | undefined
    port: number
    secure: boolean
    auth: { user: string | undefined; pass: string | undefined }
    ignoreTLS: boolean
}

async function createTransport(): Promise<Transporter | null> {
    // Test hook: allow tests to inject a mock transporter via global
    const testInjected = (globalThis as unknown as { __TEST_MAIL_TRANSPORT__?: Transporter })
        .__TEST_MAIL_TRANSPORT__
    if (testInjected) return testInjected

    // Build options once to reuse across hooks and real transport
    const opts: SmtpOptions = {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE) === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        ignoreTLS: String(process.env.SMTP_IGNORE_TLS) === 'true',
    }

    // Test hook: allow tests to intercept transport creation with options
    const testCreate = (
        globalThis as unknown as {
            __TEST_MAIL_CREATE__?: (o: SmtpOptions) => Transporter
        }
    ).__TEST_MAIL_CREATE__
    if (testCreate) return testCreate(opts)
    try {
        // Dynamic import to avoid hard dependency at build time
        const mod: unknown = await import('nodemailer')
        // Support both ESM default export and CJS named export
        const maybeDefault =
            typeof mod === 'object' && mod !== null && 'default' in mod
                ? (mod as { default: unknown }).default
                : undefined
        const maybeCreateTransport =
            (maybeDefault && (maybeDefault as { createTransport?: unknown }).createTransport) ||
            (mod as { createTransport?: unknown }).createTransport

        if (typeof maybeCreateTransport === 'function') {
            const ct = maybeCreateTransport as (o: SmtpOptions) => Transporter
            return ct(opts)
        }
    } catch {
        // Module not installed or failed to load
    }
    return null
}

export const mailer = {
    async send(options: MailOptions): Promise<void> {
        if (!hasSmtpConfig()) {
            // No SMTP configured: no-op (use verification controller dev fallback)
            return
        }

        const transporter = await createTransport()
        if (!transporter) return
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'no-reply@example.com',
            to: options.to,
            subject: options.subject,
            html: options.html,
        })
    },
} as const

export type Mailer = typeof mailer
