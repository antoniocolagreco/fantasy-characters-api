import type { AuthenticatedUser, JwtConfig } from '@/features/auth'
import { jwtService } from '@/features/auth/jwt.service'

function getTestJwtConfig(): JwtConfig {
    const secret = process.env.JWT_SECRET || 'test-secret-key-with-minimum-32-characters!!'
    const accessTokenTtl = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
    const refreshTokenTtl = process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    return {
        secret,
        accessTokenTtl,
        refreshTokenTtl,
        issuer: 'fantasy-characters-api',
        audience: 'fantasy-characters-app',
    }
}

export function createTestUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
    return {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        email: 'test@example.com',
        role: 'ADMIN',
        ...overrides,
    }
}

export function generateTestToken(user?: Partial<AuthenticatedUser>): string {
    const testUser = createTestUser(user)
    return jwtService.generateAccessToken(testUser, getTestJwtConfig())
}

export function createAuthHeaders(user?: Partial<AuthenticatedUser>) {
    const token = generateTestToken(user)
    return {
        Authorization: `Bearer ${token}`,
    }
}
