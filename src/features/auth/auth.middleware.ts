import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from './jwt.service'
import type { JwtConfig } from './auth.schema'
import { AppError, err } from '../../shared/errors'

export function createAuthMiddleware(jwtConfig: JwtConfig) {
    return function authMiddleware(request: FastifyRequest, _reply: FastifyReply) {
        const { authorization } = request.headers

        if (!authorization) {
            throw err('UNAUTHORIZED', 'Authorization header required')
        }

        if (!authorization.startsWith('Bearer ')) {
            throw err('UNAUTHORIZED', 'Bearer token required')
        }

        const token = authorization.slice(7) // Remove "Bearer " prefix

        try {
            const claims = verifyAccessToken(token, jwtConfig)

            // Attach user info to request
            request.user = {
                id: claims.sub,
                role: claims.role,
                email: '', // Will be populated by user service if needed
            }
        } catch (error) {
            // Re-throw AppError instances as-is (preserves specific error codes)
            if (error instanceof AppError) {
                throw error
            }
            if (error instanceof Error) {
                throw err('TOKEN_INVALID', error.message)
            }
            // Handle non-Error exceptions (e.g., strings, objects)
            throw err('UNAUTHORIZED', 'Token verification failed')
        }
    }
}

export function createOptionalAuthMiddleware(jwtConfig: JwtConfig) {
    return function optionalAuthMiddleware(request: FastifyRequest, _reply: FastifyReply) {
        const { authorization } = request.headers

        if (!authorization?.startsWith('Bearer ')) {
            // No auth provided, continue without user
            return
        }

        const token = authorization.slice(7)

        try {
            const claims = verifyAccessToken(token, jwtConfig)

            request.user = {
                id: claims.sub,
                role: claims.role,
                email: '',
            }
        } catch {
            // Invalid token, continue without user (don't throw)
            // This allows public endpoints to work with optional auth
        }
    }
}
