import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current directory in ESM
const currentDir = path.dirname(fileURLToPath(import.meta.url))

describe('Database Migration and Seed Integration Tests', () => {
  const projectRoot = path.resolve(currentDir, '../../../..')

  beforeAll(async () => {
    // PostgreSQL doesn't need file cleanup like SQLite
    // Database will be reset during test setup
  })

  afterAll(async () => {
    // No file cleanup needed for PostgreSQL
  })

  describe('Database Migration', () => {
    it('should have prisma schema file', () => {
      const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma')
      expect(existsSync(schemaPath)).toBe(true)
    })

    it('should be able to push database schema in test environment', () => {
      expect(() => {
        execSync('pnpm prisma db push --accept-data-loss', {
          cwd: projectRoot,
          stdio: 'pipe',
          env: {
            ...process.env,
            DATABASE_URL:
              'postgresql://developer:password@localhost:5433/fantasy_character_api_test',
          },
        })
      }).not.toThrow()
    })

    it('should verify database schema is properly applied', async () => {
      // Test that we can connect to the database and query basic structure
      const { getPrismaClient } = await import('../prisma.service')
      const client = getPrismaClient()

      try {
        await client.$queryRaw`SELECT 1`
      } finally {
        await client.$disconnect()
      }
    })
  })

  describe('Database Seed', () => {
    it('should have seed script file', () => {
      const seedPath = path.join(projectRoot, 'prisma', 'seed.ts')
      expect(existsSync(seedPath)).toBe(true)
    })

    it('should be able to run seed script without errors', () => {
      expect(() => {
        execSync('pnpm prisma db seed', {
          cwd: projectRoot,
          stdio: 'pipe',
          env: {
            ...process.env,
            DATABASE_URL:
              'postgresql://developer:password@localhost:5433/fantasy_character_api_test',
          },
        })
      }).not.toThrow()
    })
  })

  describe('Database Schema Validation', () => {
    it('should validate that all expected tables exist', async () => {
      const { getPrismaClient } = await import('../prisma.service')
      const client = getPrismaClient()

      try {
        // Test that we can query each main table (this validates they exist)
        const tableTests = [
          () => client.user.findMany({ take: 1 }),
          () => client.refreshToken.findMany({ take: 1 }),
          () => client.image.findMany({ take: 1 }),
          () => client.tag.findMany({ take: 1 }),
          () => client.race.findMany({ take: 1 }),
          () => client.archetype.findMany({ take: 1 }),
          () => client.skill.findMany({ take: 1 }),
          () => client.perk.findMany({ take: 1 }),
          () => client.item.findMany({ take: 1 }),
          () => client.character.findMany({ take: 1 }),
        ]

        // All table queries should succeed (even if they return empty results)
        for (const test of tableTests) {
          await expect(test()).resolves.toBeDefined()
        }
      } finally {
        await client.$disconnect()
      }
    })

    it('should validate database constraints and relationships', async () => {
      const { getPrismaClient } = await import('../prisma.service')
      const client = getPrismaClient()

      try {
        // Test basic schema constraints by attempting operations that should work
        const testUser = await client.user.create({
          data: {
            email: 'test@example.com',
            passwordHash: 'hashed_password',
            role: 'USER',
          },
        })

        expect(testUser).toHaveProperty('id')
        expect(testUser.email).toBe('test@example.com')
        expect(testUser.role).toBe('USER')

        // Test that we can create related records
        const testTag = await client.tag.create({
          data: {
            name: 'test-tag',
            ownerId: testUser.id,
            visibility: 'PRIVATE',
          },
        })

        expect(testTag).toHaveProperty('id')
        expect(testTag.ownerId).toBe(testUser.id)

        // Clean up test data
        await client.tag.delete({ where: { id: testTag.id } })
        await client.user.delete({ where: { id: testUser.id } })
      } finally {
        await client.$disconnect()
      }
    })
  })

  describe('Database Configuration', () => {
    it('should have proper environment configuration', () => {
      const configPath = path.join(projectRoot, 'src', 'shared', 'config.ts')
      expect(existsSync(configPath)).toBe(true)
    })

    it('should have database URL configured', async () => {
      const { environment } = await import('../../config')
      expect(environment.DATABASE_URL).toBeDefined()
      expect(typeof environment.DATABASE_URL).toBe('string')
      expect(environment.DATABASE_URL.length).toBeGreaterThan(0)
    })
  })
})
