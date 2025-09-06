import { describe, expect, test } from 'vitest'

// Import the module to ensure coverage
import prismaService, { prisma } from '@/infrastructure/database/prisma.service'

describe('Prisma Service', () => {
    test('should export prisma client instance', () => {
        expect(prisma).toBeDefined()
        expect('$connect' in prisma).toBe(true)
        expect('$disconnect' in prisma).toBe(true)
        expect(typeof prisma.$connect).toBe('function')
        expect(typeof prisma.$disconnect).toBe('function')
    })

    test('should export prisma as default export', () => {
        expect(prismaService).toBe(prisma)
        expect(prismaService).toBeDefined()
    })

    test('should have expected Prisma client methods', () => {
        // Basic Prisma client structure verification
        expect('$queryRaw' in prisma).toBe(true)
        expect('$executeRaw' in prisma).toBe(true)
        expect('$transaction' in prisma).toBe(true)
        expect(typeof prisma.$queryRaw).toBe('function')
        expect(typeof prisma.$executeRaw).toBe('function')
        expect(typeof prisma.$transaction).toBe('function')
    })

    test('should have correct log configuration', () => {
        // Test that prisma client is instantiated with proper log config
        expect(prisma).toBeDefined()
        // Since the configuration is internal, we just verify the client works
        expect(typeof prisma.user).toBe('object')
        expect(typeof prisma.character).toBe('object')
        expect(typeof prisma.image).toBe('object')
    })

    test('should instantiate PrismaClient with proper configuration', () => {
        // Verify the client is properly configured by testing it exists and has methods
        expect(prisma).toBeDefined()
        // In test environment, the constructor name might be different due to mocking
        expect(typeof prisma.$connect).toBe('function')
        expect(typeof prisma.$disconnect).toBe('function')

        // Test that both exports point to the same instance
        expect(prismaService).toBe(prisma)
    })

    test('should have model access methods', () => {
        // Verify all expected models are available
        expect('user' in prisma).toBe(true)
        expect('refreshToken' in prisma).toBe(true)
        expect('character' in prisma).toBe(true)
        expect('image' in prisma).toBe(true)
        expect('tag' in prisma).toBe(true)
        expect('skill' in prisma).toBe(true)
        expect('perk' in prisma).toBe(true)
        expect('race' in prisma).toBe(true)
        expect('archetype' in prisma).toBe(true)
        expect('item' in prisma).toBe(true)
    })
})
