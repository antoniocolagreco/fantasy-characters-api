import { describe, expect, test } from 'vitest'

import { prisma } from '@/infrastructure/database'

describe('Prisma Service', () => {
    test('should export prisma client instance', () => {
        expect(prisma).toBeDefined()
        expect('$connect' in prisma).toBe(true)
        expect('$disconnect' in prisma).toBe(true)
        expect(typeof prisma.$connect).toBe('function')
        expect(typeof prisma.$disconnect).toBe('function')
    })

    test('should export prisma as default export', async () => {
        const { default: defaultPrisma } = await import('@/infrastructure/database/prisma.service')
        expect(defaultPrisma).toBe(prisma)
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
})
