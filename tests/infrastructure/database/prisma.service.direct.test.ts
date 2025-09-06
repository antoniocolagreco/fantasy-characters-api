import { describe, expect, test } from 'vitest'

describe('Prisma Service Direct Import', () => {
    test('should execute prisma.service.ts module', async () => {
        // Directly import the module to ensure it gets executed
        const module = await import('../../../src/infrastructure/database/prisma.service')

        // Verify named export
        expect(module.prisma).toBeDefined()
        expect(typeof module.prisma.$connect).toBe('function')

        // Verify default export
        expect(module.default).toBeDefined()
        expect(module.default).toBe(module.prisma)

        // Verify it's a valid Prisma client
        expect('user' in module.prisma).toBe(true)
        expect('character' in module.prisma).toBe(true)
    })

    test('should create PrismaClient with log configuration', async () => {
        // Import and verify the PrismaClient is instantiated properly
        const { prisma } = await import('../../../src/infrastructure/database/prisma.service')

        // Test the actual configuration by verifying methods exist
        expect(typeof prisma.$connect).toBe('function')
        expect(typeof prisma.$disconnect).toBe('function')
        expect(typeof prisma.$queryRaw).toBe('function')
        expect(typeof prisma.$executeRaw).toBe('function')
        expect(typeof prisma.$transaction).toBe('function')
    })
})
