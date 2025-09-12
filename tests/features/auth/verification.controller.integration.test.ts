import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { verificationService } from '@/features/auth/verification.service'
import { generateUUIDv7 } from '@/shared/utils/uuid'
import { createAuthHeaders } from '@/tests/helpers/test.helper'
import { testPrisma } from '@/tests/setup'

describe('Verification Controller (integration) — enabled', () => {
    let app: FastifyInstance
    let originalFlag: string | undefined

    beforeAll(async () => {
        originalFlag = process.env.EMAIL_VERIFICATION_ENABLED
        process.env.EMAIL_VERIFICATION_ENABLED = 'true'
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
        if (originalFlag !== undefined) process.env.EMAIL_VERIFICATION_ENABLED = originalFlag
        else delete process.env.EMAIL_VERIFICATION_ENABLED
    })

    it('POST /auth/verify/send returns 202 and does not throw', async () => {
        // Seed unverified user
        const user = await testPrisma.user.create({
            data: {
                id: generateUUIDv7(),
                email: 'verify-user@example.com',
                passwordHash: '$argon2id$fakehash',
                role: 'USER',
                isEmailVerified: false,
                isActive: true,
            },
        })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/verify/send',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: user.id, email: user.email, role: 'USER' }),
            },
            payload: {},
        })

        if (response.statusCode !== 202) {
            // Debug: log error body
            // eslint-disable-next-line no-console
            console.log('DEBUG send(authed) body:', response.json())
        }
        expect(response.statusCode).toBe(202)
    })

    it('POST /auth/verify/send returns 401 when unauthenticated', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/verify/send',
            headers: { 'content-type': 'application/json' },
            payload: {},
        })
        if (response.statusCode !== 401) {
            // eslint-disable-next-line no-console
            console.log('DEBUG send(unauth) body:', response.json())
        }
        expect(response.statusCode).toBe(401)
    })

    it('GET /auth/verify/confirm marks user as verified', async () => {
        const user = await testPrisma.user.create({
            data: {
                id: generateUUIDv7(),
                email: 'to-confirm@example.com',
                passwordHash: '$argon2id$fakehash',
                role: 'USER',
                isEmailVerified: false,
                isActive: true,
            },
        })

        const token = await verificationService.issue(user.id)

        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/auth/verify/confirm?token=${encodeURIComponent(token)}`,
        })

        if (response.statusCode !== 200) {
            // eslint-disable-next-line no-console
            console.log('DEBUG send(disabled) body:', response.json())
        }
        expect(response.statusCode).toBe(200)
        const updated = await testPrisma.user.findUnique({ where: { id: user.id } })
        expect(updated?.isEmailVerified).toBe(true)
    })

    it('GET /auth/verify/confirm with invalid token returns 400', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/auth/verify/confirm?token=invalid-token`,
        })
        expect([400, 401]).toContain(response.statusCode)
    })
})

describe('Verification Controller (integration) — disabled', () => {
    let app: FastifyInstance
    let originalFlag: string | undefined

    beforeAll(async () => {
        originalFlag = process.env.EMAIL_VERIFICATION_ENABLED
        process.env.EMAIL_VERIFICATION_ENABLED = 'false'
        // Re-import app is not necessary since controller checks config at runtime for response,
        // but to be safe in case of cached config, build a fresh app instance
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
        if (originalFlag !== undefined) process.env.EMAIL_VERIFICATION_ENABLED = originalFlag
        else delete process.env.EMAIL_VERIFICATION_ENABLED
    })

    it('POST /auth/verify/send responds 200 with disabled message when flag is false', async () => {
        const user = await testPrisma.user.create({
            data: {
                id: generateUUIDv7(),
                email: 'disabled-user@example.com',
                passwordHash: '$argon2id$fakehash',
                role: 'USER',
                isEmailVerified: false,
                isActive: true,
            },
        })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/verify/send',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: user.id, email: user.email, role: 'USER' }),
            },
            payload: {},
        })

        expect(response.statusCode).toBe(200)
        const body = response.json() as { message?: string }
        expect(body.message).toMatch(/verification disabled/i)
    })

    it('GET /auth/verify/confirm returns 200 with disabled message when flag is false', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/auth/verify/confirm?token=dummy`,
        })
        expect(response.statusCode).toBe(200)
        const body = response.json() as { message?: string }
        expect(body.message).toMatch(/verification disabled/i)
    })
})
