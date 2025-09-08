import { afterAll, beforeAll, beforeEach, vi } from 'vitest'

import { prismaFake, resetDb } from './helpers/inmemory-prisma'

// Test environment setup
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'silent'
process.env.RBAC_ENABLED = 'true'
// Ensure required env vars for config and auth across all tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-with-minimum-32-characters!!'
process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-with-min-32-chars!!'
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/db'

// Mock Prisma service everywhere to use in-memory DB
vi.mock('../src/infrastructure/database/prisma.service', () => ({
    default: prismaFake,
    prisma: prismaFake,
}))
vi.mock('../src/infrastructure/database', () => ({
    prisma: prismaFake,
}))
vi.mock('@/infrastructure/database/prisma.service', () => ({
    default: prismaFake,
    prisma: prismaFake,
}))
vi.mock('@/infrastructure/database', () => ({
    prisma: prismaFake,
}))

// Mock image processing functions for tests - will be overridden for specific tests
vi.mock('../src/features/images/images.processing', async importOriginal => {
    const actual = (await importOriginal()) as Record<string, unknown>
    return {
        ...actual,
        validateImageFile: vi.fn(() => {
            // Do nothing - skip validation in tests
        }),
        processImageToWebP: vi.fn((buffer: Buffer) => {
            return Promise.resolve({
                buffer,
                size: buffer.length,
                mimeType: 'image/webp',
                width: 800,
                height: 600,
            })
        }),
    }
})

vi.mock('@/features/images/images.processing', async importOriginal => {
    const actual = (await importOriginal()) as Record<string, unknown>
    return {
        ...actual,
        validateImageFile: vi.fn(() => {
            // Do nothing - skip validation in tests
        }),
        processImageToWebP: vi.fn((buffer: Buffer) => {
            return Promise.resolve({
                buffer,
                size: buffer.length,
                mimeType: 'image/webp',
                width: 800,
                height: 600,
            })
        }),
    }
})

beforeAll(() => {
    // Setup will be added in future milestones
    // For now, just ensure test environment is configured
})

beforeEach(() => {
    // Clean up in-memory DB between tests
    resetDb()
    // Seed an ADMIN so RBAC finds a real user if controllers/read ownership or user lookups happen
    const adminId = '01234567-89ab-cdef-0123-456789abcdef'
    prismaFake.user.create({
        data: {
            id: adminId,
            email: 'admin@test.local',
            passwordHash: 'x',
            role: 'ADMIN',
            isEmailVerified: true,
            isActive: true,
            lastLogin: new Date(),
            isBanned: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            name: 'Admin',
            bio: null,
            oauthProvider: null,
            oauthId: null,
            lastPasswordChange: null,
            banReason: null,
            bannedUntil: null,
            bannedById: null,
            profilePictureId: null,
        },
    })
})

afterAll(() => {
    // Cleanup after all tests
    // Force garbage collection if available
    if (global.gc) {
        global.gc()
    }
})
