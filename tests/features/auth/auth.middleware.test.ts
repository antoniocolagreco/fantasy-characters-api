import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAuthMiddleware } from '../../../src/features/auth/auth.middleware'
import { verifyAccessToken } from '../../../src/features/auth/jwt.service'
import { AppError } from '../../../src/shared/errors'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { JwtClaims, JwtConfig } from '../../../src/features/auth'

// Mock the dependencies
vi.mock('../../../src/features/auth/jwt.service')

const mockVerifyAccessToken = vi.mocked(verifyAccessToken)

describe('createAuthMiddleware', () => {
    let mockRequest: Partial<
        FastifyRequest & { user?: { id: string; role: string; email: string } }
    >
    let mockReply: Partial<FastifyReply>
    let jwtConfig: JwtConfig
    let authMiddleware: ReturnType<typeof createAuthMiddleware>

    beforeEach(() => {
        mockRequest = {
            headers: {},
        }
        mockReply = {}

        jwtConfig = {
            secret: 'test-secret',
            accessTokenTtl: '15m',
            refreshTokenTtl: '7d',
            issuer: 'test-issuer',
            audience: 'test-audience',
        }

        authMiddleware = createAuthMiddleware(jwtConfig)

        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should authenticate user with valid token', () => {
        const mockClaims: JwtClaims = {
            sub: 'user-123',
            role: 'USER',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 900,
        }

        mockRequest.headers = {
            authorization: 'Bearer valid-token',
        }

        mockVerifyAccessToken.mockReturnValue(mockClaims)

        authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

        expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-token', jwtConfig)
        expect(mockRequest.user).toEqual({
            id: 'user-123',
            role: 'USER',
            email: '',
        })
    })

    it('should throw UNAUTHORIZED when no authorization header', () => {
        mockRequest.headers = {}

        expect(() =>
            authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
        ).toThrow(AppError)

        try {
            authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
        } catch (error) {
            expect(error).toBeInstanceOf(AppError)
            expect((error as AppError).code).toBe('UNAUTHORIZED')
        }
    })

    it('should throw UNAUTHORIZED when authorization header does not start with Bearer', () => {
        mockRequest.headers = {
            authorization: 'InvalidFormat token',
        }

        expect(() =>
            authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
        ).toThrow(AppError)

        try {
            authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
        } catch (error) {
            expect(error).toBeInstanceOf(AppError)
            expect((error as AppError).code).toBe('UNAUTHORIZED')
        }
    })

    it('should throw TOKEN_EXPIRED when token is expired', () => {
        mockRequest.headers = {
            authorization: 'Bearer invalid-token',
        }

        const jwtError = new AppError('TOKEN_EXPIRED', 'Token has expired')
        mockVerifyAccessToken.mockImplementation(() => {
            throw jwtError
        })

        expect(() =>
            authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
        ).toThrow(AppError)

        try {
            authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
        } catch (error) {
            expect(error).toBeInstanceOf(AppError)
            expect((error as AppError).code).toBe('TOKEN_INVALID')
        }
    })

    it('should handle different role types', () => {
        const mockClaims: JwtClaims = {
            sub: 'admin-123',
            role: 'ADMIN',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 900,
        }

        mockRequest.headers = {
            authorization: 'Bearer admin-token',
        }

        mockVerifyAccessToken.mockReturnValue(mockClaims)

        authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

        expect(mockRequest.user).toEqual({
            id: 'admin-123',
            role: 'ADMIN',
            email: '',
        })
    })

    it('should extract token correctly after Bearer prefix', () => {
        const mockClaims: JwtClaims = {
            sub: 'user-123',
            role: 'USER',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 900,
        }

        mockRequest.headers = {
            authorization: 'Bearer token-with-special-chars-123',
        }

        mockVerifyAccessToken.mockReturnValue(mockClaims)

        authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

        expect(mockVerifyAccessToken).toHaveBeenCalledWith(
            'token-with-special-chars-123',
            jwtConfig
        )
    })

    it('should throw UNAUTHORIZED for non-Error exceptions', () => {
        mockRequest.headers = {
            authorization: 'Bearer some-token',
        }

        mockVerifyAccessToken.mockImplementation(() => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw 'String error'
        })

        expect(() =>
            authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
        ).toThrow(AppError)

        try {
            authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
        } catch (error) {
            expect(error).toBeInstanceOf(AppError)
            expect((error as AppError).code).toBe('UNAUTHORIZED')
        }
    })
})
