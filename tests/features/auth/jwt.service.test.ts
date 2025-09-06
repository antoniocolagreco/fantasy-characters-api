import jwt from 'jsonwebtoken'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser, JwtConfig } from '@/features/auth'
import { jwtService } from '@/features/auth/jwt.service'
import { AppError } from '@/shared/errors'

interface DecodedToken {
    sub: string
    role: string
    iat: number
    exp: number
    jti?: string
    iss: string
    aud: string
}

describe('JWT Service', () => {
    const mockUser: AuthenticatedUser = {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        email: 'test@example.com',
        role: 'USER',
    }

    const mockConfig: JwtConfig = {
        secret: 'test-secret-key-with-minimum-32-characters',
        accessTokenTtl: '15m',
        refreshTokenTtl: '7d',
        issuer: 'test-issuer',
        audience: 'test-audience',
    }

    beforeEach(() => {
        // Mock Date.now to return a fixed timestamp
        vi.spyOn(Date, 'now').mockReturnValue(1609459200000) // 2021-01-01 00:00:00 UTC
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('generateAccessToken', () => {
        it('should generate a valid JWT token', () => {
            const token = jwtService.generateAccessToken(mockUser, mockConfig)

            expect(token).toBeDefined()
            expect(typeof token).toBe('string')
            expect(token.split('.')).toHaveLength(3) // JWT has 3 parts

            // Verify the token can be decoded
            const decoded = jwt.verify(token, mockConfig.secret) as DecodedToken
            expect(decoded.sub).toBe(mockUser.id)
            expect(decoded.role).toBe(mockUser.role)
            expect(decoded.iss).toBe(mockConfig.issuer)
            expect(decoded.aud).toBe(mockConfig.audience)
        })

        it('should include correct claims in the token', () => {
            const token = jwtService.generateAccessToken(mockUser, mockConfig)
            const decoded = jwt.decode(token) as DecodedToken

            expect(decoded.sub).toBe(mockUser.id)
            expect(decoded.role).toBe(mockUser.role)
            expect(decoded.iat).toBe(1609459200) // Fixed timestamp / 1000
            expect(decoded.exp).toBe(1609459200 + 900) // 15 minutes later
            expect(decoded.jti).toBeDefined()
            expect(typeof decoded.jti).toBe('string')
        })

        it('should generate different tokens for the same user', () => {
            const token1 = jwtService.generateAccessToken(mockUser, mockConfig)
            const token2 = jwtService.generateAccessToken(mockUser, mockConfig)

            expect(token1).not.toBe(token2)
        })

        it('should work with different user roles', () => {
            const adminUser: AuthenticatedUser = {
                ...mockUser,
                role: 'ADMIN',
            }

            const token = jwtService.generateAccessToken(adminUser, mockConfig)
            const decoded = jwt.decode(token) as DecodedToken

            expect(decoded.role).toBe('ADMIN')
        })

        it('should handle numeric TTL in config', () => {
            const configWithNumericTtl = { ...mockConfig, accessTokenTtl: 1800 }
            const token = jwtService.generateAccessToken(mockUser, configWithNumericTtl)
            const decoded = jwt.decode(token) as DecodedToken

            expect(decoded.exp).toBe(1609459200 + 1800) // 30 minutes
        })
    })

    describe('generateRefreshToken', () => {
        it('should generate a valid UUID refresh token', () => {
            const token = jwtService.generateRefreshToken()

            expect(token).toBeDefined()
            expect(typeof token).toBe('string')
            expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        })

        it('should generate unique tokens', () => {
            const token1 = jwtService.generateRefreshToken()
            const token2 = jwtService.generateRefreshToken()

            expect(token1).not.toBe(token2)
        })
    })

    describe('verifyAccessToken', () => {
        it('should verify a valid token', () => {
            const token = jwtService.generateAccessToken(mockUser, mockConfig)
            const claims = jwtService.verifyAccessToken(token, mockConfig)

            expect(claims.sub).toBe(mockUser.id)
            expect(claims.role).toBe(mockUser.role)
            expect(claims.iat).toBe(1609459200)
            expect(claims.exp).toBe(1609459200 + 900)
        })

        it('should throw TOKEN_EXPIRED for expired tokens', () => {
            // Mock an expired token
            const expiredToken = jwt.sign(
                {
                    sub: mockUser.id,
                    role: mockUser.role,
                    iat: 1609459200,
                    exp: 1609459200 - 1, // Expired 1 second ago
                },
                mockConfig.secret,
                {
                    issuer: mockConfig.issuer,
                    audience: mockConfig.audience,
                }
            )

            expect(() => jwtService.verifyAccessToken(expiredToken, mockConfig)).toThrow(AppError)

            try {
                jwtService.verifyAccessToken(expiredToken, mockConfig)
            } catch (error) {
                expect(error).toBeInstanceOf(AppError)
                expect((error as AppError).code).toBe('TOKEN_EXPIRED')
            }
        })

        it('should throw TOKEN_INVALID for malformed tokens', () => {
            expect(() => jwtService.verifyAccessToken('invalid.token.here', mockConfig)).toThrow(
                AppError
            )

            try {
                jwtService.verifyAccessToken('invalid.token.here', mockConfig)
            } catch (error) {
                expect(error).toBeInstanceOf(AppError)
                expect((error as AppError).code).toBe('TOKEN_INVALID')
            }
        })

        it('should throw TOKEN_INVALID for tokens with wrong secret', () => {
            const token = jwt.sign({ sub: mockUser.id, role: mockUser.role }, 'wrong-secret', {
                issuer: mockConfig.issuer,
                audience: mockConfig.audience,
            })

            expect(() => jwtService.verifyAccessToken(token, mockConfig)).toThrow(AppError)

            try {
                jwtService.verifyAccessToken(token, mockConfig)
            } catch (error) {
                expect(error).toBeInstanceOf(AppError)
                expect((error as AppError).code).toBe('TOKEN_INVALID')
            }
        })

        it('should throw TOKEN_INVALID for tokens with wrong issuer', () => {
            const token = jwt.sign({ sub: mockUser.id, role: mockUser.role }, mockConfig.secret, {
                issuer: 'wrong-issuer',
                audience: mockConfig.audience,
            })

            expect(() => jwtService.verifyAccessToken(token, mockConfig)).toThrow(AppError)

            try {
                jwtService.verifyAccessToken(token, mockConfig)
            } catch (error) {
                expect(error).toBeInstanceOf(AppError)
                expect((error as AppError).code).toBe('TOKEN_INVALID')
            }
        })

        it('should throw TOKEN_INVALID for tokens with wrong audience', () => {
            const token = jwt.sign({ sub: mockUser.id, role: mockUser.role }, mockConfig.secret, {
                issuer: mockConfig.issuer,
                audience: 'wrong-audience',
            })

            expect(() => jwtService.verifyAccessToken(token, mockConfig)).toThrow(AppError)

            try {
                jwtService.verifyAccessToken(token, mockConfig)
            } catch (error) {
                expect(error).toBeInstanceOf(AppError)
                expect((error as AppError).code).toBe('TOKEN_INVALID')
            }
        })

        it('should handle other JWT errors as TOKEN_INVALID', () => {
            // Create a token that will cause a different JWT error
            const malformedPayload = Buffer.from('{"invalid": json}').toString('base64')
            const malformedToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${malformedPayload}.signature`

            expect(() => jwtService.verifyAccessToken(malformedToken, mockConfig)).toThrow(AppError)

            try {
                jwtService.verifyAccessToken(malformedToken, mockConfig)
            } catch (error) {
                expect(error).toBeInstanceOf(AppError)
                expect((error as AppError).code).toBe('TOKEN_INVALID')
            }
        })
    })

    describe('parseTtl', () => {
        it('should return number as-is', () => {
            expect(jwtService.parseTtl(3600)).toBe(3600)
            expect(jwtService.parseTtl(0)).toBe(0)
        })

        it('should parse seconds correctly', () => {
            expect(jwtService.parseTtl('30s')).toBe(30)
            expect(jwtService.parseTtl('1s')).toBe(1)
        })

        it('should parse minutes correctly', () => {
            expect(jwtService.parseTtl('15m')).toBe(900) // 15 * 60
            expect(jwtService.parseTtl('1m')).toBe(60)
        })

        it('should parse hours correctly', () => {
            expect(jwtService.parseTtl('2h')).toBe(7200) // 2 * 60 * 60
            expect(jwtService.parseTtl('1h')).toBe(3600)
        })

        it('should parse days correctly', () => {
            expect(jwtService.parseTtl('7d')).toBe(604800) // 7 * 24 * 60 * 60
            expect(jwtService.parseTtl('1d')).toBe(86400)
        })

        it('should throw error for invalid format', () => {
            expect(() => jwtService.parseTtl('invalid')).toThrow('Invalid TTL format: invalid')
            expect(() => jwtService.parseTtl('15x')).toThrow('Invalid TTL format: 15x')
            expect(() => jwtService.parseTtl('m15')).toThrow('Invalid TTL format: m15')
            expect(() => jwtService.parseTtl('')).toThrow('Invalid TTL format: ')
        })

        it('should throw error for invalid unit', () => {
            // This test case might not be reachable due to the regex, but let's test the switch default
            // We'll need to mock the regex match to test this
            const matchSpy = vi.spyOn(String.prototype, 'match').mockReturnValue(['15x', '15', 'x'])

            expect(() => jwtService.parseTtl('15x')).toThrow('Invalid TTL unit: x')

            matchSpy.mockRestore()
        })

        it('should handle edge cases', () => {
            expect(jwtService.parseTtl('0s')).toBe(0)
            expect(jwtService.parseTtl('999d')).toBe(999 * 24 * 60 * 60)
        })
    })
})
