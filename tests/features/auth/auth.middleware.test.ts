import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { JwtClaims, JwtConfig } from '@/features/auth'
import { AppError } from '@/shared/errors'
import type { BasicAuthRequest, BasicReply } from '@/shared/types/http'

describe('Auth Middleware - Real Implementation', () => {
    let mockRequest: BasicAuthRequest
    let mockReply: BasicReply
    let jwtConfig: JwtConfig
    let mockVerifyAccessToken: ReturnType<typeof vi.fn>

    beforeEach(() => {
        // Clear all module cache to ensure fresh imports
        vi.resetModules()

        mockRequest = { headers: {} }
        mockReply = {
            code: vi.fn(),
            send: vi.fn(),
            header: vi.fn(),
        }

        jwtConfig = {
            secret: 'test-secret',
            accessTokenTtl: '15m',
            refreshTokenTtl: '7d',
            issuer: 'test-issuer',
            audience: 'test-audience',
        }

        // Mock JWT service using vi.doMock for test isolation
        mockVerifyAccessToken = vi.fn()
        vi.doMock('@/features/auth/jwt.service', () => ({
            jwtService: {
                verifyAccessToken: mockVerifyAccessToken,
                generateAccessToken: vi.fn(),
                generateRefreshToken: vi.fn(),
                parseTtl: vi.fn(),
            },
        }))

        vi.clearAllMocks()
    })

    // Helper function to create fresh middleware instances
    async function createMiddleware() {
        // Dynamic import after mocking to ensure mock is applied
        const middlewareModule = await import('@/features/auth/auth.middleware')
        return {
            authMiddleware: middlewareModule.createAuthMiddleware(jwtConfig),
            optionalAuthMiddleware: middlewareModule.createOptionalAuthMiddleware(jwtConfig),
        }
    }

    afterEach(() => {
        vi.clearAllMocks()
        vi.doUnmock('@/features/auth/jwt.service')
        vi.resetModules()
    })

    describe('createAuthMiddleware', () => {
        it('should authenticate user with valid token', async () => {
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

            const { authMiddleware } = await createMiddleware()
            authMiddleware(mockRequest, mockReply)

            expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-token', jwtConfig)
            expect(mockRequest.user).toEqual({
                id: 'user-123',
                role: 'USER',
                email: '',
            })
        })

        it('should throw UNAUTHORIZED when no authorization header', async () => {
            mockRequest.headers = {}

            const { authMiddleware } = await createMiddleware()

            let thrownError: unknown
            try {
                authMiddleware(mockRequest, mockReply)
            } catch (error) {
                thrownError = error
            }

            expect(thrownError).toBeDefined()
            expect((thrownError as Error).name).toBe('AppError')
            expect((thrownError as AppError).code).toBe('UNAUTHORIZED')
            expect((thrownError as AppError).message).toBe('Authorization header required')
        })

        it('should throw UNAUTHORIZED when authorization header does not start with Bearer', async () => {
            mockRequest.headers = {
                authorization: 'InvalidFormat token',
            }

            const { authMiddleware } = await createMiddleware()

            let thrownError: unknown
            try {
                authMiddleware(mockRequest, mockReply)
            } catch (error) {
                thrownError = error
            }

            expect(thrownError).toBeDefined()
            expect((thrownError as Error).name).toBe('AppError')
            expect((thrownError as AppError).code).toBe('UNAUTHORIZED')
            expect((thrownError as AppError).message).toBe('Bearer token required')
        })

        it('should re-throw AppError instances as-is', async () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid-token',
            }

            const jwtError = new AppError('TOKEN_EXPIRED', 'Token has expired')
            mockVerifyAccessToken.mockImplementation(() => {
                throw jwtError
            })

            const { authMiddleware } = await createMiddleware()

            expect(() => authMiddleware(mockRequest, mockReply)).toThrow(jwtError)
        })

        it('should convert Error instances to TOKEN_INVALID', async () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid-token',
            }

            const genericError = new Error('Generic JWT error')
            mockVerifyAccessToken.mockImplementation(() => {
                throw genericError
            })

            const { authMiddleware } = await createMiddleware()

            let thrownError: unknown
            try {
                authMiddleware(mockRequest, mockReply)
            } catch (error) {
                thrownError = error
            }

            expect(thrownError).toBeDefined()
            expect((thrownError as Error).name).toBe('AppError')
            expect((thrownError as AppError).code).toBe('TOKEN_INVALID')
            expect((thrownError as AppError).message).toBe('Generic JWT error')
        })

        it('should handle non-Error exceptions', async () => {
            mockRequest.headers = {
                authorization: 'Bearer some-token',
            }

            mockVerifyAccessToken.mockImplementation(() => {
                throw 'String error'
            })

            const { authMiddleware } = await createMiddleware()

            let thrownError: unknown
            try {
                authMiddleware(mockRequest, mockReply)
            } catch (error) {
                thrownError = error
            }

            expect(thrownError).toBeDefined()
            expect((thrownError as Error).name).toBe('AppError')
            expect((thrownError as AppError).code).toBe('UNAUTHORIZED')
            expect((thrownError as AppError).message).toBe('Token verification failed')
        })

        it('should extract token correctly after Bearer prefix', async () => {
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

            const { authMiddleware } = await createMiddleware()
            authMiddleware(mockRequest, mockReply)

            expect(mockVerifyAccessToken).toHaveBeenCalledWith(
                'token-with-special-chars-123',
                jwtConfig
            )
        })

        it('should handle different role types', async () => {
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

            const { authMiddleware } = await createMiddleware()
            authMiddleware(mockRequest, mockReply)

            expect(mockRequest.user).toEqual({
                id: 'admin-123',
                role: 'ADMIN',
                email: '',
            })
        })
    })

    describe('createOptionalAuthMiddleware', () => {
        it('should authenticate user with valid token', async () => {
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

            const { optionalAuthMiddleware } = await createMiddleware()
            optionalAuthMiddleware(mockRequest, mockReply)

            expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-token', jwtConfig)
            expect(mockRequest.user).toEqual({
                id: 'user-123',
                role: 'USER',
                email: '',
            })
        })

        it('should continue without user when no authorization header', async () => {
            mockRequest.headers = {}

            const { optionalAuthMiddleware } = await createMiddleware()

            expect(() => optionalAuthMiddleware(mockRequest, mockReply)).not.toThrow()

            expect(mockRequest.user).toBeUndefined()
            expect(mockVerifyAccessToken).not.toHaveBeenCalled()
        })

        it('should continue without user when authorization header is not Bearer', async () => {
            mockRequest.headers = {
                authorization: 'Basic dGVzdDp0ZXN0',
            }

            const { optionalAuthMiddleware } = await createMiddleware()

            expect(() => optionalAuthMiddleware(mockRequest, mockReply)).not.toThrow()

            expect(mockRequest.user).toBeUndefined()
            expect(mockVerifyAccessToken).not.toHaveBeenCalled()
        })

        it('should continue without user when token verification fails', async () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid-token',
            }

            mockVerifyAccessToken.mockImplementation(() => {
                throw new AppError('TOKEN_EXPIRED', 'Token has expired')
            })

            const { optionalAuthMiddleware } = await createMiddleware()

            expect(() => optionalAuthMiddleware(mockRequest, mockReply)).not.toThrow()

            expect(mockRequest.user).toBeUndefined()
        })

        it('should continue without user when JWT throws generic error', async () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid-token',
            }

            mockVerifyAccessToken.mockImplementation(() => {
                throw new Error('Generic error')
            })

            const { optionalAuthMiddleware } = await createMiddleware()

            expect(() => optionalAuthMiddleware(mockRequest, mockReply)).not.toThrow()

            expect(mockRequest.user).toBeUndefined()
        })

        it('should continue without user when JWT throws non-Error exception', async () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid-token',
            }

            mockVerifyAccessToken.mockImplementation(() => {
                throw 'String error'
            })

            const { optionalAuthMiddleware } = await createMiddleware()

            expect(() => optionalAuthMiddleware(mockRequest, mockReply)).not.toThrow()

            expect(mockRequest.user).toBeUndefined()
        })
    })
})
