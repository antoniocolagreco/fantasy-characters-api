import { describe, expect, test } from 'vitest'

// This test runs without the global setup mock to test the actual prisma service

describe('Prisma Service (No Mock)', () => {
    test('should create PrismaClient instance with configuration', async () => {
        // Temporarily unmock the module to test the actual implementation
        const { vi } = await import('vitest')

        // Clear any existing mocks for this specific test
        vi.resetModules()

        // Import the actual module
        const actual = await vi.importActual('../../../src/infrastructure/database/prisma.service')

        expect(actual).toBeDefined()
        expect('prisma' in actual).toBe(true)
        expect('default' in actual).toBe(true)

        const { prisma, default: defaultExport } = actual as any

        expect(prisma).toBeDefined()
        expect(defaultExport).toBe(prisma)

        // Verify it has the expected PrismaClient structure
        expect(typeof prisma.$connect).toBe('function')
        expect(typeof prisma.$disconnect).toBe('function')
        expect(typeof prisma.$queryRaw).toBe('function')
        expect(typeof prisma.$executeRaw).toBe('function')
        expect(typeof prisma.$transaction).toBe('function')

        // Verify it has the expected models
        expect('user' in prisma).toBe(true)
        expect('character' in prisma).toBe(true)
        expect('image' in prisma).toBe(true)
    })

    test('should export the same instance as default and named export', async () => {
        const { vi } = await import('vitest')
        vi.resetModules()

        const actual = await vi.importActual('../../../src/infrastructure/database/prisma.service')
        const { prisma, default: defaultExport } = actual as any

        expect(defaultExport).toBe(prisma)
    })
})
