# Email and Verification

How to configure outbound email (Nodemailer over SMTP) and how the email
verification flow works in this codebase.

---

## Overview

- Outbound email uses Nodemailer over SMTP (optional; safe no‑op if not set)
- Email verification is required before regular users can CREATE content
- ADMIN and MODERATOR are exempt from the verification gate

Note

- RBAC middleware enforces the verification gate for CREATE actions
- This doc covers sending the email and confirming the token

---

## Dependency

Nodemailer is dynamically imported at runtime. If you need it in production, add
it:

```powershell
pnpm add nodemailer
```

---

## Environment variables

Required for SMTP:

- SMTP_HOST: SMTP server hostname
- SMTP_PORT: SMTP server port (e.g., 587)
- SMTP_USER: SMTP username
- SMTP_PASS: SMTP password
- EMAIL_FROM: From address (e.g., "No Reply <no-reply@example.com>")

Optional:

- SMTP_SECURE: true to use TLS immediately (port 465), default false
- SMTP_IGNORE_TLS: true to skip STARTTLS if needed, default false
- APP_BASE_URL: Public base URL to compose verification links (e.g.,
  <https://api.example.com>)
- EMAIL_VERIFICATION_TTL_HOURS: Token lifetime in hours (default 24)
- EMAIL_VERIFICATION_ENABLED: if `false`, no emails are sent and the gate is
  disabled

---

## Token strategy (current)

We use short‑lived JWT tokens for verification, signed with the existing
`JWT_SECRET` and a dedicated audience (`email-verification`). This avoids a DB
table and keeps the flow simple. You can switch to DB‑backed single‑use tokens
later if needed.

---

## Mailer service (implemented)

```typescript
// src/infrastructure/email/mailer.service.ts
export const mailer = {
  async send(to: string, subject: string, html: string) {
    // No SMTP configured: no‑op
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    )
      return

    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE) === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      ignoreTLS: String(process.env.SMTP_IGNORE_TLS) === 'true',
    })
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })
  },
} as const
```

---

## Verification service (implemented)

```typescript
// src/features/auth/verification.service.ts
import jwt from 'jsonwebtoken'
import { err } from '@/shared/errors'
import { config } from '@/infrastructure/config'

function ttlSeconds() {
  const hours = Number(process.env.EMAIL_VERIFICATION_TTL_HOURS || 24)
  return hours * 60 * 60
}

export const verificationService = {
  async issue(userId: string): Promise<string> {
    const payload = { sub: userId, purpose: 'email-verify' as const }
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: ttlSeconds(),
      audience: 'email-verification',
      issuer: 'fantasy-characters-api',
    })
  },

  async confirm(token: string): Promise<{ userId: string }> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, {
        audience: 'email-verification',
        issuer: 'fantasy-characters-api',
      }) as { sub?: string; purpose?: string; exp?: number }
      if (!decoded || decoded.purpose !== 'email-verify' || !decoded.sub) {
        throw err('BAD_REQUEST', 'Invalid verification token')
      }
      return { userId: decoded.sub }
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'name' in e &&
        (e as { name: string }).name === 'TokenExpiredError'
      ) {
        throw err('TOKEN_EXPIRED', 'Verification token expired')
      }
      throw err('BAD_REQUEST', 'Invalid verification token')
    }
  },
} as const
```

---

## Controller snippets (implemented)

```typescript
// src/features/auth/v1/verification.controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify'
import { mailer } from '@/infrastructure/email/mailer.service'
import { verificationService } from '@/features/auth/verification.service'
import { err } from '@/shared/errors'
import { config } from '@/infrastructure/config'
import { successMessage } from '@/shared/utils/response.helper'

export const verificationController = {
  async send(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user
    if (!user) throw err('UNAUTHORIZED', 'Login required')

    if (!config.EMAIL_VERIFICATION_ENABLED) {
      return reply
        .code(200)
        .send(successMessage('Email verification disabled', request.id))
    }

    const token = await verificationService.issue(user.id)
    const base = process.env.APP_BASE_URL || ''
    const link = `${base}/api/v1/auth/verify/confirm?token=${encodeURIComponent(token)}`

    await mailer.send(
      user.email,
      'Verify your email',
      `<a href="${link}">Verify</a>`
    ) // no‑op if SMTP not set
    return reply
      .code(202)
      .send(successMessage('Verification email sent', request.id))
  },

  async confirm(request: FastifyRequest, reply: FastifyReply) {
    if (!config.EMAIL_VERIFICATION_ENABLED) {
      return reply
        .code(200)
        .send(successMessage('Email verification disabled', request.id))
    }

    const token = (request.query as { token?: string }).token
    if (!token) throw err('BAD_REQUEST', 'Token is required')
    const { userId } = await verificationService.confirm(token)
    // Service call that marks the user as verified (implemented in codebase)
    // await userService.markEmailAsVerified(userId)
    return reply.code(200).send(successMessage('Email verified', request.id))
  },
} as const
```

---

## Routes (implemented)

```typescript
// src/features/auth/v1/auth.routes.ts (excerpt)
app.post(
  '/auth/verify/send',
  {
    schema: { summary: 'Send email verification link' },
    preHandler: [authMiddleware], // requires auth
  },
  verificationController.send
)

app.get(
  '/auth/verify/confirm',
  {
    schema: {
      summary: 'Confirm email verification',
      querystring: Type.Object({ token: Type.String() }),
    },
  },
  verificationController.confirm
)
```

Notes

- The send endpoint requires authentication and uses the user’s id from JWT
- The confirm endpoint is public and consumes the opaque token

---

## Operational notes

- Rate-limit the send endpoint to prevent abuse (see rate-limiting doc)
- Tokens are short‑lived JWTs; rotate secrets if compromised
- Do not include raw token in logs; log only event metadata
- SMTP not configured → mailer send is a no‑op; you can still test flows

---

## Troubleshooting

- 535/534 SMTP auth errors: verify SMTP_USER/SMTP_PASS and port/secure settings
- Timeouts: check SMTP firewall rules and TLS requirements
- Links not working: ensure APP_BASE_URL matches the public origin (protocol,
  domain)
