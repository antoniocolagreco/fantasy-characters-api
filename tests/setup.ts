// Global test setup
beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only'
    process.env.LOG_LEVEL = 'silent'
})

afterAll(async () => {
    // Cleanup after all tests
})
