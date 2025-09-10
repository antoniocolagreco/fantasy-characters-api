import type { FastifyReply, FastifyRequest } from 'fastify'

import type {
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    ChangePasswordRequest,
} from './auth.http.schema'

import { authService } from '@/features/auth/auth.service'
import { HTTP_STATUS } from '@/shared/constants/http-status'
import { err } from '@/shared/errors'
import { success, successMessage, setNoStore } from '@/shared/utils'

export const authController = {
    async login(request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) {
        const deviceInfo = request.headers['user-agent']
        const result = await authService.login(request.body, deviceInfo)
        setNoStore(reply)
        return reply.code(HTTP_STATUS.OK).send(success(result, request.id))
    },

    async register(request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) {
        const user = await authService.register(request.body)
        setNoStore(reply)
        return reply.code(HTTP_STATUS.CREATED).send(success(user, request.id))
    },

    async refreshToken(
        request: FastifyRequest<{ Body: RefreshTokenRequest }>,
        reply: FastifyReply
    ) {
        const deviceInfo = request.headers['user-agent']
        const tokens = await authService.refreshTokens(request.body.refreshToken, deviceInfo)
        setNoStore(reply)
        return reply.code(HTTP_STATUS.OK).send(success(tokens, request.id))
    },

    async logout(request: FastifyRequest<{ Body: RefreshTokenRequest }>, reply: FastifyReply) {
        await authService.logout(request.body.refreshToken)
        setNoStore(reply)
        return reply
            .code(HTTP_STATUS.OK)
            .send(successMessage('Logged out successfully', request.id))
    },

    async logoutAll(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user?.id
        if (!userId) {
            throw err('UNAUTHORIZED', 'Authentication required')
        }

        await authService.logoutAll(userId)
        setNoStore(reply)
        return reply
            .code(HTTP_STATUS.OK)
            .send(successMessage('Logged out from all devices', request.id))
    },

    async changePassword(
        request: FastifyRequest<{ Body: ChangePasswordRequest }>,
        reply: FastifyReply
    ) {
        const userId = request.user?.id
        if (!userId) {
            throw err('UNAUTHORIZED', 'Authentication required')
        }

        await authService.changePassword(
            userId,
            request.body.currentPassword,
            request.body.newPassword
        )
        setNoStore(reply)
        return reply
            .code(HTTP_STATUS.OK)
            .send(successMessage('Password changed successfully', request.id))
    },
} as const
