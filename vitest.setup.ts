import { execSync } from 'child_process'
import { beforeAll, beforeEach } from 'vitest'

// Setup and teardown for all tests
beforeAll(async () => {
  // Ensure we're working in the right directory
  const projectRoot = process.cwd()

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
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
  }
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
