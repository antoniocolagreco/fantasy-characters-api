import { describe, it, expect, vi } from 'vitest'

// Ensure we import the real prisma service (not the in-memory mock from setup)
describe('infrastructure/prisma.service (real module import)', () => {
    it('should export the PrismaClient singleton as default and named export', async () => {
        vi.unmock('../src/infrastructure/database/prisma.service')
        vi.unmock('@/infrastructure/database/prisma.service')

        const mod = (await vi.importActual(
            '@/infrastructure/database/prisma.service'
        )) as typeof import('../../src/infrastructure/database/prisma.service')

        expect(mod).toBeDefined()
        expect(mod.prisma).toBeDefined()
        expect(mod.default).toBe(mod.prisma)

        // Basic surface check without connecting
        expect(typeof mod.prisma.$disconnect).toBe('function')
    })
})
