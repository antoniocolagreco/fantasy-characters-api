import { beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

// Setup and teardown for all tests
beforeAll(async () => {
  console.log('🔧 Setting up test environment...')

  // Ensure we're working in the right directory
  const projectRoot = process.cwd()

  // Skip Prisma client generation entirely to avoid Windows file locking
  // The client should already be generated from previous builds
  console.log('⚙️  Skipping Prisma client generation to avoid file locking issues')

  // Create and setup test database with all tables
  try {
    execSync('pnpm prisma db push --force-reset', {
      cwd: projectRoot,
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://developer:password@localhost:5433/fantasy_character_api_test',
      },
    })
    console.log('✅ Test database created with all tables')
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    // Don't throw error here, let tests handle database issues gracefully
    console.warn('⚠️  Continuing without database setup - tests may fail gracefully')
  }
})

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...')
  // No file cleanup needed for PostgreSQL - database will be reset on next run
})

// Clear cache before each test to ensure test isolation
beforeEach(async () => {
  try {
    // Import and clear cache service
    const { cacheService } = await import('./src/shared/cache.service')
    cacheService.clear()
  } catch {
    // Ignore if cache service is not available
  }
})
