import type { FastifyReply, FastifyRequest } from 'fastify'

import { verificationService } from '@/features/auth/verification.service'
import { userService } from '@/features/users'
import { config } from '@/infrastructure/config'
import { mailer } from '@/infrastructure/email/mailer.service'
import { HTTP_STATUS } from '@/shared/constants/http-status'
import { err } from '@/shared/errors'
import { successMessage } from '@/shared/utils/response.helper'

export const verificationController = {
    async send(request: FastifyRequest, reply: FastifyReply) {
        const { user } = request as { user?: { id: string; email: string } }
        if (!user) {
            throw err('UNAUTHORIZED', 'Login required')
        }

        const enabled =
            config.EMAIL_VERIFICATION_ENABLED && process.env.EMAIL_VERIFICATION_ENABLED !== 'false'
        if (!enabled) {
            return reply
                .code(HTTP_STATUS.OK)
                .send(successMessage('Email verification disabled', request.id))
        }

        const token = await verificationService.issue(user.id)
        const base = process.env.APP_BASE_URL || ''
        const link = `${base}/api/v1/auth/verify/confirm?token=${encodeURIComponent(token)}`

        // If SMTP is configured, send email; else return link in response for dev
        await mailer.send({
            to: user.email,
            subject: 'Verify your email',
            html: `<p>Please verify your email by clicking the link below:</p><p><a href="${link}">Verify Email</a></p>`,
        })

        return reply.code(202).send(successMessage('Verification email sent', request.id))
    },

    async confirm(
        request: FastifyRequest<{ Querystring: { token?: string } }>,
        reply: FastifyReply
    ) {
        const enabled =
            config.EMAIL_VERIFICATION_ENABLED && process.env.EMAIL_VERIFICATION_ENABLED !== 'false'
        if (!enabled) {
            return reply
                .code(HTTP_STATUS.OK)
                .send(successMessage('Email verification disabled', request.id))
        }

        const token = request.query?.token
        if (!token) {
            throw err('BAD_REQUEST', 'Token is required')
        }

        const { userId } = await verificationService.confirm(token)
        await userService.markEmailAsVerified(userId)

        return reply.code(HTTP_STATUS.OK).send(successMessage('Email verified', request.id))
    },
} as const
