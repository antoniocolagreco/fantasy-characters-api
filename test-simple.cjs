const { PrismaClient } = require('@prisma/client')

// This is the working connection that we tested
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://fantasy_user:fantasy_password@localhost:5432/fantasy_characters_dev',
        },
    },
})

async function runSimpleTest() {
    try {
        globalThis.console.log('Starting simple test...')

        // Clean database
        globalThis.console.log('Cleaning database...')
        await prisma.user.deleteMany()

        // Create a test user
        globalThis.console.log('Creating test user...')
        const testUser = await prisma.user.create({
            data: {
                id: '01992a39-9834-7158-9c8e-123456789abc', // Simple UUID v7 format
                email: 'test@example.com',
                passwordHash: '$argon2id$v=19$m=4096,t=3,p=1$testSalt$testHash',
                role: 'USER',
                isEmailVerified: true,
                isActive: true,
                name: 'Test User',
            },
        })

        globalThis.console.log('Test user created:', testUser.email)

        // Test retrieval
        const foundUser = await prisma.user.findUnique({
            where: { email: 'test@example.com' },
        })

        globalThis.console.log('User found:', foundUser ? foundUser.email : 'Not found')

        // Clean up
        await prisma.user.deleteMany()
        await prisma.$disconnect()

        globalThis.console.log('Simple test completed successfully!')
        globalThis.process.exit(0)
    } catch (error) {
        globalThis.console.error('Test failed:', error.message)
        globalThis.console.error('Full error:', error)
        globalThis.process.exit(1)
    }
}

runSimpleTest()
