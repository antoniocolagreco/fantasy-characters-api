import type { User, Role } from '@prisma/client'
import { expect } from 'vitest'

import type { AuthenticatedUser } from '@/features/auth'
import { generateAccessToken } from '@/features/auth/jwt.service'
import { generateUUIDv7 } from '@/shared/utils/uuid'

interface TestUser extends Partial<User> {
    id: string
    email: string
    role: Role
}

interface TestUserOptions {
    role?: Role
    id?: string
    email?: string
    isActive?: boolean
    isBanned?: boolean
    isEmailVerified?: boolean
}

export interface TestResponse {
    statusCode: number
    json: () => Record<string, unknown>
    headers?: Record<string, unknown>
}

function getTestJwtConfig() {
    return {
        secret: process.env.JWT_SECRET || 'test-secret-key-with-minimum-32-characters!!',
        accessTokenTtl: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshTokenTtl: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
        issuer: 'fantasy-characters-api',
        audience: 'fantasy-characters-app',
    }
}

/**
 * Creates a test user with reasonable defaults
 */
export function createTestUser(options: TestUserOptions = {}): TestUser {
    const id = options.id || generateUUIDv7()
    return {
        id,
        email: options.email || `test-${id.slice(0, 8)}@example.com`,
        role: options.role || 'USER',
        isActive: options.isActive ?? true,
        isBanned: options.isBanned ?? false,
        isEmailVerified: options.isEmailVerified ?? false,
        passwordHash: 'test-hash',
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        name: `Test User ${id.slice(0, 8)}`,
        bio: null,
        oauthProvider: null,
        oauthId: null,
        lastPasswordChange: null,
        banReason: null,
        bannedUntil: null,
        bannedById: null,
        profilePictureId: null,
    }
}

/**
 * Creates authenticated user object for JWT generation
 */
export function createAuthenticatedUser(options: TestUserOptions = {}): AuthenticatedUser {
    const testUser = createTestUser(options)
    return {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
    }
}

/**
 * Generates a test JWT token
 */
export function generateTestToken(options: TestUserOptions = {}): string {
    const authUser = createAuthenticatedUser(options)
    return generateAccessToken(authUser, getTestJwtConfig())
}

/**
 * Creates Authorization headers for test requests
 */
export function createAuthHeaders(options: TestUserOptions = {}) {
    const token = generateTestToken(options)
    return {
        Authorization: `Bearer ${token}`,
    }
}

/**
 * Creates a complete test request payload for user creation
 */
export function createUserPayload(options: Partial<TestUser> = {}) {
    return {
        email: options.email || `test-${generateUUIDv7().slice(0, 8)}@example.com`,
        password: 'test-password-123',
        name: options.name || 'Test User',
        role: options.role || 'USER',
    }
}

/**
 * Standard HTTP status codes for tests
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
} as const

/**
 * Standard test timeouts
 */
export const TEST_TIMEOUTS = {
    FAST: 1000,
    NORMAL: 3000,
    SLOW: 10000,
} as const

/**
 * Validates that a response follows the standard success format
 */
export function expectSuccessResponse(response: TestResponse, expectedStatus: number = 200) {
    expect(response.statusCode).toBe(expectedStatus)
    const body = response.json()
    expect(body).toMatchObject({
        data: expect.anything(),
        requestId: expect.any(String),
        timestamp: expect.any(String),
    })
    return body
}

/**
 * Validates that a response follows the standard error format
 */
export function expectErrorResponse(response: TestResponse, expectedStatus: number) {
    expect(response.statusCode).toBe(expectedStatus)
    const body = response.json()
    expect(body).toMatchObject({
        error: expect.objectContaining({
            code: expect.any(String),
            message: expect.any(String),
            status: expectedStatus,
        }),
        requestId: expect.any(String),
        timestamp: expect.any(String),
    })
    return body
}

/**
 * Validates that a response follows the standard paginated format
 */
export function expectPaginatedResponse(response: TestResponse) {
    const body = expectSuccessResponse(response)
    expect(body).toMatchObject({
        data: expect.any(Array),
        pagination: expect.objectContaining({
            limit: expect.any(Number),
            hasNext: expect.any(Boolean),
            hasPrev: expect.any(Boolean),
        }),
    })
    return body
}

/**
 * Validates that a user object doesn't contain sensitive data
 */
export function expectSafeUserData(user: Record<string, unknown>) {
    expect(user).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        role: expect.stringMatching(/^(USER|MODERATOR|ADMIN)$/),
    })
    // Ensure sensitive data is not exposed
    expect(user).not.toHaveProperty('passwordHash')
    expect(user).not.toHaveProperty('password')
    return user
}

/**
 * Creates a test request payload with common headers
 */
export function createTestRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    options: {
        auth?: TestUserOptions | false
        payload?: Record<string, unknown>
        headers?: Record<string, string>
    } = {}
) {
    const headers: Record<string, string> = {
        'content-type': 'application/json',
        ...options.headers,
    }

    if (options.auth !== false) {
        Object.assign(headers, createAuthHeaders(options.auth))
    }

    return {
        method,
        url,
        headers,
        ...(options.payload && { payload: options.payload }),
    }
}

/**
 * Asserts that arrays do not have overlapping elements
 */
export function expectNoOverlap<T>(array1: T[], array2: T[], keyExtractor?: (item: T) => unknown) {
    const extract = keyExtractor || ((item: T) => item)
    const keys1 = array1.map(extract)
    const keys2 = array2.map(extract)
    const overlap = keys1.filter(key => keys2.includes(key))
    expect(overlap).toHaveLength(0)
}

/**
 * Validates UUID format
 */
export function expectValidUUID(value: string) {
    expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
}

/**
 * Validates ISO timestamp format
 */
export function expectValidTimestamp(value: string) {
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(new Date(value).toISOString()).toBe(value)
}
