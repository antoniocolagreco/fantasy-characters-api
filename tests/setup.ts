import { beforeAll, afterAll, beforeEach } from 'vitest'

// Test environment setup
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'silent'

beforeAll(() => {
    // Setup will be added in future milestones
    // For now, just ensure test environment is configured
})

beforeEach(() => {
    // Clean up data between tests if needed
})

afterAll(() => {
    // Cleanup after all tests
    // Force garbage collection if available
    if (global.gc) {
        global.gc()
    }
})
