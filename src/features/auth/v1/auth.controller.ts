import type { FastifyReply, FastifyRequest } from 'fastify'

import type {
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    ChangePasswordRequest,
} from './auth.http.schema'

import { authService } from '@/features/auth/auth.service'

function envelope<T>(data: T, requestId?: string) {
    return { data, requestId, timestamp: new Date().toISOString() }
}

function successMessage(message: string, requestId?: string) {
    return { message, requestId, timestamp: new Date().toISOString() }
}

export async function login(request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) {
    const deviceInfo = request.headers['user-agent']
    const result = await authService.login(request.body, deviceInfo)
    return reply.code(200).send(envelope(result, request.id))
}

export async function register(
    request: FastifyRequest<{ Body: RegisterRequest }>,
    reply: FastifyReply
) {
    const user = await authService.register(request.body)
    return reply.code(201).send(envelope(user, request.id))
}

export async function refreshToken(
    request: FastifyRequest<{ Body: RefreshTokenRequest }>,
    reply: FastifyReply
) {
    const deviceInfo = request.headers['user-agent']
    const tokens = await authService.refreshTokens(request.body.refreshToken, deviceInfo)
    return reply.code(200).send(envelope(tokens, request.id))
}

export async function logout(
    request: FastifyRequest<{ Body: RefreshTokenRequest }>,
    reply: FastifyReply
) {
    await authService.logout(request.body.refreshToken)
    return reply.code(200).send(successMessage('Logged out successfully', request.id))
}

export async function logoutAll(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id
    if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' })
    }

    await authService.logoutAll(userId)
    return reply.code(200).send(successMessage('Logged out from all devices', request.id))
}

export async function changePassword(
    request: FastifyRequest<{ Body: ChangePasswordRequest }>,
    reply: FastifyReply
) {
    const userId = request.user?.id
    if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' })
    }

    await authService.changePassword(userId, request.body.currentPassword, request.body.newPassword)

    return reply.code(200).send(successMessage('Password changed successfully', request.id))
}
