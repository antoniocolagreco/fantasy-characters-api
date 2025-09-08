import { PrismaClient } from '@prisma/client/extension'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://fantasy_user:fantasy_password@localhost:5432/fantasy_characters_dev',
        },
    },
})

async function testConnection() {
    try {
        await prisma.$connect()
        globalThis.console.log('Database connection successful!')

        // Test a simple query
        const result = await prisma.$queryRaw`SELECT 1 as test`
        globalThis.console.log('Query test successful:', result)

        await prisma.$disconnect()
        globalThis.process.exit(0)
    } catch (error) {
        globalThis.console.error('Database connection failed:', error.message)
        globalThis.process.exit(1)
    }
}

testConnection()
