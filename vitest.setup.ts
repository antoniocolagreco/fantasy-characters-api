import { beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

// Setup and teardown for all tests
beforeAll(async () => {
  console.log('🔧 Setting up test environment...')

  // Ensure we're working in the right directory
  const projectRoot = process.cwd()
  const testDbPath = path.join(projectRoot, 'prisma', 'test.db')

  // Clean up any existing test database
  if (existsSync(testDbPath)) {
    try {
      execSync(`Remove-Item "${testDbPath}" -Force`, {
        shell: 'powershell.exe',
        cwd: projectRoot,
        stdio: 'pipe',
      })
    } catch {
      // Ignore cleanup errors
    }
  }

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
        DATABASE_URL: 'file:./test.db',
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

  // Clean up test database
  const projectRoot = process.cwd()
  const testDbPath = path.join(projectRoot, 'prisma', 'test.db')

  if (existsSync(testDbPath)) {
    try {
      execSync(`Remove-Item "${testDbPath}" -Force`, {
        shell: 'powershell.exe',
        cwd: projectRoot,
        stdio: 'pipe',
      })
    } catch {
      // Ignore cleanup errors
    }
  }
})
