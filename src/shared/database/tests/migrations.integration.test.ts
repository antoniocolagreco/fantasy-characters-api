import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current directory in ESM
const currentDir = path.dirname(fileURLToPath(import.meta.url))

describe('Database Migration and Seed Integration Tests', () => {
  const projectRoot = path.resolve(currentDir, '../../../..')
  const dbPath = path.join(projectRoot, 'prisma', 'test.db')

  beforeAll(async () => {
    // Clean up any existing test database
    if (existsSync(dbPath)) {
      try {
        execSync(`Remove-Item "${dbPath}" -Force`, {
          shell: 'powershell.exe',
          cwd: projectRoot,
        })
      } catch (_error) {
        // Ignore errors if file doesn't exist
      }
    }
  })

  afterAll(async () => {
    // Clean up test database
    if (existsSync(dbPath)) {
      try {
        execSync(`Remove-Item "${dbPath}" -Force`, {
          shell: 'powershell.exe',
          cwd: projectRoot,
        })
      } catch (_error) {
        // Ignore cleanup errors
      }
    }
  })

  describe('Database Migration', () => {
    it('should have prisma schema file', () => {
      const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma')
      expect(existsSync(schemaPath)).toBe(true)
    })

    it('should be able to generate Prisma client', () => {
      // Retry mechanism for Windows file locking issues
      let lastError: Error | null = null
      let success = false

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          execSync('pnpm prisma generate', {
            cwd: projectRoot,
            stdio: 'pipe',
          })
          success = true
          break
        } catch (error) {
          lastError = error as Error
          if (attempt < 3) {
            // Wait before retry to allow file locks to release
            const sleepSync = (ms: number) => {
              const start = Date.now()
              while (Date.now() - start < ms) {
                // Busy wait for synchronous sleep
              }
            }
            sleepSync(attempt * 1000) // Wait 1s, 2s, 3s between attempts
          }
        }
      }

      if (!success && lastError) {
        throw lastError
      }

      expect(success).toBe(true)
    })

    it('should be able to push database schema in test environment', () => {
      expect(() => {
        execSync('pnpm prisma db push --accept-data-loss', {
          cwd: projectRoot,
          stdio: 'pipe',
          env: {
            ...process.env,
            DATABASE_URL: 'file:./test.db',
          },
        })
      }).not.toThrow()
    })

    it('should create database file after schema push', () => {
      // The database should exist after the schema push
      expect(existsSync(dbPath)).toBe(true)
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
            DATABASE_URL: 'file:./test.db',
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
