import { Buffer } from 'buffer'
import { generateUUIDv7 } from '../src/shared/utils/index.js'
import { testPrisma } from '../tests/setup.js'

// Debug cursor pagination
async function debugTest() {
    try {
        globalThis.console.log('1. Creating test user...')
        const userId = generateUUIDv7()
        await testPrisma.user.create({
            data: {
                id: userId,
                email: 'debug@test.local',
                passwordHash: 'hash',
                role: 'ADMIN',
                name: 'Debug User',
                isEmailVerified: true,
                isActive: true,
                isBanned: false,
                lastLogin: new Date(),
            },
        })

        globalThis.console.log('2. Testing simple query...')
        const users = await testPrisma.user.findMany({
            where: { role: 'ADMIN' },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 21,
        })

        globalThis.console.log('3. Found users:', users.length)
        users.forEach(user => {
            globalThis.console.log(
                `   ID: ${user.id}, CreatedAt: ${user.createdAt}, Role: ${user.role}`
            )
        })

        globalThis.console.log('4. Now testing cursor creation...')
        if (users.length > 0) {
            const lastItem = users[0]
            const cursor = {
                lastValue: lastItem.createdAt,
                lastId: lastItem.id,
            }
            globalThis.console.log('Cursor object:', cursor)

            const encodedCursor = Buffer.from(JSON.stringify(cursor)).toString('base64')
            globalThis.console.log('Encoded cursor:', encodedCursor)

            // Test decoding
            const decoded = JSON.parse(Buffer.from(encodedCursor, 'base64').toString())
            globalThis.console.log('Decoded cursor:', decoded)
        }
    } catch (error) {
        globalThis.console.error('Error:', error)
    } finally {
        await testPrisma.user.deleteMany()
        await testPrisma.$disconnect()
    }
}

debugTest()
